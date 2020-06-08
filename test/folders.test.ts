import request = require('supertest');

import { newDemoDocumentStorage } from "../src/services/document-storages/demo";
import { DocumentFolder, FoundDocumentFolder } from "../src/services/types";

import { newMockMetricsStorage, newStaticAuthenticator, withApplication } from "./common";

describe("Folders/patients tests", () => {
    ["/v1/patients", "/v2/patients/search"].forEach((path) => {
        test(`Check that patient search ${path} bubbles to document storage and returns correct result`, async () => {
            const metricsStorage = newMockMetricsStorage();
            await withApplication({
                authenticator: newStaticAuthenticator(),
                documentStorage: MOCK_DOCUMENT_STORAGE,
                metricsStorage,
            }, async (server) => {
                const response = await request(server).get(`/api-zscanner${path}?query=QUERY`);
                expect(response.status).toEqual(200);
                expect(response.body).toEqual([
                    {
                        bid: 'EXTERNAL-ID',
                        zid: 'INTERNAL-ID',
                        name: 'THE-NAME',
                    },
                ]);

                metricsStorage.expectEvent({
                    ts: new Date(),
                    type: "search",
                    version: path.includes('/v2') ? 2 : 1,
                    user: 'USER',
                    data: {
                        query: 'QUERY',
                    },
                });
            });
        });
    });

    test(`Check that folder search /v3/folders/search bubbles to document storage and returns correct result`, async () => {
        const metricsStorage = newMockMetricsStorage();
        await withApplication({
            authenticator: newStaticAuthenticator(),
            documentStorage: MOCK_DOCUMENT_STORAGE,
            metricsStorage,
        }, async (server) => {
            const response = await request(server).get(`/api-zscanner/v3/folders/search?query=QUERY`);
            expect(response.status).toEqual(200);
            expect(response.body).toEqual([
                {
                    externalId: 'EXTERNAL-ID',
                    internalId: 'INTERNAL-ID',
                    name: 'THE-NAME',
                    type: 'searchResult',
                },
            ]);

            metricsStorage.expectEvent({
                ts: new Date(),
                type: "search",
                version: 3,
                user: 'USER',
                data: {
                    query: 'QUERY',
                },
            });
        });
    });

    test(`Check that patient search /v1 with ## bubbles to document storage and returns correct result`, async () => {
        const metricsStorage = newMockMetricsStorage();
        await withApplication({
            authenticator: newStaticAuthenticator(),
            documentStorage: MOCK_DOCUMENT_STORAGE,
            metricsStorage,
        }, async (server) => {
            const response = await request(server).get(`/api-zscanner/v1/patients?query=%23%23QUERY`);
            expect(response.status).toEqual(200);
            expect(response.body).toEqual([
                {
                    bid: 'EXTERNAL-ID',
                    zid: 'QUERY',
                    name: 'THE-NAME',
                },
            ]);

            metricsStorage.expectEvent({
                ts: new Date(),
                type: "search",
                version: 1,
                user: 'USER',
                data: {
                    query: '##QUERY',
                },
            });
        });
    });

    test(`Check that patient decode /v2 bubbles to document storage and returns correct result`, async () => {
        const metricsStorage = newMockMetricsStorage();
        await withApplication({
            authenticator: newStaticAuthenticator(),
            documentStorage: MOCK_DOCUMENT_STORAGE,
            metricsStorage,
        }, async (server) => {
            const response = await request(server).get(`/api-zscanner/v2/patients/decode?query=QUERY`);
            expect(response.status).toEqual(200);
            expect(response.body).toEqual({
                bid: 'EXTERNAL-ID',
                zid: 'QUERY',
                name: 'THE-NAME',
            });

            metricsStorage.expectEvent({
                ts: new Date(),
                type: "decode",
                version: 2,
                user: 'USER',
                data: {
                    query: 'QUERY',
                },
            });
        });
    });

    test(`Check that folders decode /v3 bubbles to document storage and returns correct result`, async () => {
        const metricsStorage = newMockMetricsStorage();
        await withApplication({
            authenticator: newStaticAuthenticator(),
            documentStorage: MOCK_DOCUMENT_STORAGE,
            metricsStorage,
        }, async (server) => {
            const response = await request(server).get(`/api-zscanner/v3/folders/decode?query=QUERY`);
            expect(response.status).toEqual(200);
            expect(response.body).toEqual({
                externalId: 'EXTERNAL-ID',
                internalId: 'QUERY',
                name: 'THE-NAME',
            });

            metricsStorage.expectEvent({
                ts: new Date(),
                type: "decode",
                version: 3,
                user: 'USER',
                data: {
                    query: 'QUERY',
                },
            });
        });
    });

    test(`Check that getting folder defects /v3 bubbles to document storage and returns correct result`, async () => {
        const metricsStorage = newMockMetricsStorage();
        await withApplication({
            authenticator: newStaticAuthenticator(),
            documentStorage: MOCK_DOCUMENT_STORAGE,
            metricsStorage,
        }, async (server) => {
            const response = await request(server).get(`/api-zscanner/v3/folders/124587113/defects`);
            expect(response.status).toEqual(200);
            expect(response.body).toEqual([
                {
                    defectId: 'defect3',
                    bodyPartId: 'leftEye',
                    name: 'Name of defect 3',
                },
            ]);

            metricsStorage.expectEvent({
                ts: new Date(),
                type: "getDefects",
                version: 3,
                user: 'USER',
                data: {
                    folderId: '124587113',
                },
            });
        });
    });
});

const MOCK_DOCUMENT_STORAGE = {
    ...newDemoDocumentStorage({}),
    async findFolders(query: string): Promise<FoundDocumentFolder[]> {
        expect(query).toEqual("QUERY");
        return [
            {
                name: 'THE-NAME',
                externalId: 'EXTERNAL-ID',
                internalId: 'INTERNAL-ID',
                type: 'searchResult',
            },
        ];
    },
    async getFolderByBarcode(folderBarcode: string): Promise<DocumentFolder | undefined> {
        return {
            name: "THE-NAME",
            externalId: "EXTERNAL-ID",
            internalId: folderBarcode,
        };
    },
};
