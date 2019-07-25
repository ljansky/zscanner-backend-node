import request = require('supertest');

import { newDemoDocumentStorage } from "../src/services/document-storages/demo";
import { DocumentFolder } from "../src/services/types";

import { withApplication } from "./common";

describe("Folders/patients tests", () => {
    ["/v1/patients", "/v2/patients/search"].forEach((path) => {
        test(`Check that patient search ${path} bubbles to document storage and returns correct result`, async () => {
            await withApplication({
                documentStorage: MOCK_DOCUMENT_STORAGE,
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
            });
        });
    });

    test(`Check that folder search /v3/folders/search bubbles to document storage and returns correct result`, async () => {
        await withApplication({
            documentStorage: MOCK_DOCUMENT_STORAGE,
        }, async (server) => {
            const response = await request(server).get(`/api-zscanner/v3/folders/search?query=QUERY`);
            expect(response.status).toEqual(200);
            expect(response.body).toEqual([
                {
                    externalId: 'EXTERNAL-ID',
                    internalId: 'INTERNAL-ID',
                    name: 'THE-NAME',
                },
            ]);
        });
    });

    test(`Check that patient decode /v2 bubbles to document storage and returns correct result`, async () => {
        await withApplication({
            documentStorage: MOCK_DOCUMENT_STORAGE,
        }, async (server) => {
            const response = await request(server).get(`/api-zscanner/v2/patients/decode?query=QUERY`);
            expect(response.status).toEqual(200);
            expect(response.body).toEqual({
                bid: 'EXTERNAL-ID',
                zid: 'QUERY',
                name: 'THE-NAME',
            });
        });
    });

    test(`Check that folders decode /v3 bubbles to document storage and returns correct result`, async () => {
        await withApplication({
            documentStorage: MOCK_DOCUMENT_STORAGE,
        }, async (server) => {
            const response = await request(server).get(`/api-zscanner/v3/folders/decode?query=QUERY`);
            expect(response.status).toEqual(200);
            expect(response.body).toEqual({
                externalId: 'EXTERNAL-ID',
                internalId: 'QUERY',
                name: 'THE-NAME',
            });
        });
    });
});

const MOCK_DOCUMENT_STORAGE = {
    ...newDemoDocumentStorage({}),
    async findFolders(query: string): Promise<DocumentFolder[]> {
        expect(query).toEqual("QUERY");
        return [
            {
                name: 'THE-NAME',
                externalId: 'EXTERNAL-ID',
                internalId: 'INTERNAL-ID',
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
