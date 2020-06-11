import * as fs from 'fs';
import request = require('supertest');

import { newDemoDocumentStorage } from "../src/services/document-storages/demo";
import { DocumentSummary, PageUploadInfo, PageWithDefectUploadInfo } from "../src/services/types";

import { newMockMetricsStorage, newStaticAuthenticator, newTusUploadClient, withApplication } from "./common";

describe("Documents tests", () => {
    ["/v1", "/v2"].forEach((path) => {
        test(`Check that document summary upload ${path} bubbles to document storage and returns correct result`, async () => {
            const documentStorage = newMockDocumentStorage();
            const metricsStorage = newMockMetricsStorage();
            await withApplication({
                authenticator: newStaticAuthenticator(),
                documentStorage,
                metricsStorage,
            }, async (server) => {
                const response = await request(server)
                    .post(`/api-zscanner${path}/documents/summary`)
                    .field("correlation", 'CORRELATION')
                    .field("patid", 'PATID')
                    .field("mode", "doc")
                    .field("type",  'TYPE')
                    .field("pages", "1")
                    .field("datetime", "01/01/2000 12:30")
                    .field("name", 'NAME')
                    .field("notes", 'NOTES');
                expect(response.status).toEqual(200);
                expect(documentStorage.postedPages.length).toEqual(0);
                expect(documentStorage.postedSummaries).toEqual([
                    {
                        correlationId: "CORRELATION",
                        summary: {
                            datetime: (new Date(2000, 0, 1, 12, 30)).valueOf(),
                            documentMode: "doc",
                            documentType: "TYPE",
                            folderInternalId: "PATID",
                            name: "NAME",
                            notes: "NOTES",
                            pages: 1,
                            user: "USER",
                        },
                    },
                ]);

                metricsStorage.expectEvent({
                    ts: new Date(),
                    type: "upload",
                    version: path === '/v2' ? 2 : 1,
                    user: 'USER',
                    data: {
                        mode: 'doc',
                        type: 'TYPE',
                        pages: 1,
                    },
                });
            });
        });
    });

    test(`Check that document summary upload /v3 bubbles to document storage and returns correct result`, async () => {
        const documentStorage = newMockDocumentStorage();
        const metricsStorage = newMockMetricsStorage();
        await withApplication({
            authenticator: newStaticAuthenticator(),
            documentStorage,
            metricsStorage,
        }, async (server) => {
            const response = await request(server)
                .post(`/api-zscanner/v3/documents/summary`)
                .set('Content-Type', 'application/json')
                .send({
                    correlation: 'CORRELATION',
                    folderInternalId: 'PATID',
                    documentMode: "doc",
                    documentType:  '',
                    pages: 1,
                    datetime: "2000-01-01T12:30:00Z",
                    name: 'NAME',
                    notes: 'NOTES',
                });
            expect(response.status).toEqual(200);
            expect(documentStorage.postedPages.length).toEqual(0);
            expect(documentStorage.postedSummaries).toEqual([
                {
                    correlationId: "CORRELATION",
                    summary: {
                        datetime: Date.UTC(2000, 0, 1, 12, 30),
                        documentMode: "doc",
                        documentType: "",
                        folderInternalId: "PATID",
                        name: "NAME",
                        notes: "NOTES",
                        pages: 1,
                        user: "USER",
                    },
                },
            ]);

            metricsStorage.expectEvent({
                ts: new Date(),
                type: "upload",
                version: 3,
                user: 'USER',
                data: {
                    mode: 'doc',
                    type: '',
                    pages: 1,
                },
            });
        });
    });

    ["/v1", "/v2", "/v3"].forEach((path) => {
        test(`Check that document page upload ${path} bubbles to document storage and returns correct result`, async () => {
            const storage = newMockDocumentStorage();
            await withApplication({
                documentStorage: storage,
            }, async (server) => {
                const response = await request(server)
                    .post(`/api-zscanner${path}/documents/page`)
                    .field("correlation", 'CORRELATION')
                    .field("pageIndex", "1")
                    .attach("page", Buffer.from([1, 2, 3]), { contentType: "image/jpeg", filename: "image.jpg" });
                expect(response.status).toEqual(200);
                expect(storage.postedSummaries.length).toEqual(0);
                expect(storage.postedPages).toEqual([
                    {
                        correlationId: "CORRELATION",
                        pageIndex: 1,
                        file: "010203",
                    },
                ]);
            });
        });

        test(`Check that document page upload ${path} fails if required parameters are missing`, async () => {
            const storage = newMockDocumentStorage();
            await withApplication({
                documentStorage: storage,
            }, async (server) => {
                const uploadData = Buffer.from([1, 2, 3]);
                const uploadOptions = { contentType: "image/jpeg", filename: "image.jpg" };
                const responseWithoutPageIndex = await request(server)
                    .post(`/api-zscanner${path}/documents/page`)
                    .field("correlation", 'CORRELATION')
                    .attach("page", uploadData, uploadOptions);
                expect(responseWithoutPageIndex.status).toEqual(400);

                const responseWithoutCorrelation = await request(server)
                    .post(`/api-zscanner${path}/documents/page`)
                    .field("pageIndex", "1")
                    .attach("page", uploadData, uploadOptions);
                expect(responseWithoutCorrelation.status).toEqual(400);

                const responseWithoutPageFile = await request(server)
                    .post(`/api-zscanner${path}/documents/page`)
                    .field("correlation", 'CORRELATION')
                    .field("pageIndex", "1");
                expect(responseWithoutPageFile.status).toEqual(400);

                expect(storage.postedSummaries.length).toEqual(0);
                expect(storage.postedPages).toEqual([]);
            });
        });
    });

    test('Check that page upload with uploader bubbles to document storage', async () => {
        const storage = newMockDocumentStorage();
        await withApplication({
                documentStorage: storage,
            }, async (server) => {
                const uploadClient = newTusUploadClient(server);
                const url = '/api-zscanner/upload';
                const data = Buffer.from([1, 2, 3]);
                const createResponse = await uploadClient.create({
                    url,
                    data,
                    metadata: {
                        uploadType: 'page',
                        correlation: 'CORRELATION',
                        pageIndex: '1',
                        filetype: 'test',
                    },
                });

                expect(createResponse.status).toEqual(201);

                const writeResponse = await uploadClient.write({ url, createResponse, data });

                expect(writeResponse.status).toEqual(204);
                expect(storage.postedSummaries.length).toEqual(0);
                expect(storage.postedPages).toEqual([
                    {
                        correlationId: "CORRELATION",
                        pageIndex: 1,
                        file: data.toString('hex'),
                    },
                ]);
            });
    });

    test('Check that page upload fails if required metadata are missing', async () => {
        const storage = newMockDocumentStorage();
        await withApplication({
                documentStorage: storage,
            }, async (server) => {
                const uploadClient = newTusUploadClient(server);
                const url = '/api-zscanner/upload';
                const data = Buffer.from([1, 2, 3]);
                const createResponseWithoutPageIndex = await uploadClient.create({
                    url,
                    data,
                    metadata: {
                        uploadType: 'page',
                        correlation: 'CORRELATION',
                        filetype: 'test',
                    },
                });

                expect(createResponseWithoutPageIndex.status).toEqual(400);

                const createResponseWithoutCorrerlation = await uploadClient.create({
                    url,
                    data,
                    metadata: {
                        uploadType: 'page',
                        pageIndex: '1',
                        filetype: 'test',
                    },
                });

                expect(createResponseWithoutCorrerlation.status).toEqual(400);

                const createResponseWithoutFiletype = await uploadClient.create({
                    url,
                    data,
                    metadata: {
                        uploadType: 'page',
                        correlation: 'CORRELATION',
                        pageIndex: '1',
                    },
                });

                expect(createResponseWithoutFiletype.status).toEqual(400);
            });
    });
});

function newMockDocumentStorage() {
    const c = {
        ...newDemoDocumentStorage({}),
        async submitDocumentSummary(correlationId: string, summary: DocumentSummary): Promise<void> {
            c.postedSummaries.push({
                correlationId,
                summary,
            });
        },
        submitDocumentPage,
        submitLargeDocumentPage,
        submitLargeDocumentPageWithDefect,
        postedSummaries: [] as any[],
        postedPages: [] as any[],
    };
    return c;

    async function submitDocumentPage(correlationId: string, pageIndex: number, file: string): Promise<void> {
        c.postedPages.push({
            correlationId,
            pageIndex,
            file: fs.readFileSync(file).toString("hex"),
        });
    }

    async function submitLargeDocumentPage(correlationId: string, pageIndex: number, uploadInfo: PageUploadInfo): Promise<void> {
        submitDocumentPage(correlationId, pageIndex, uploadInfo.filePath);
    }

    async function submitLargeDocumentPageWithDefect(correlationId: string, pageIndex: number, uploadInfo: PageWithDefectUploadInfo): Promise<void> {
        submitDocumentPage(correlationId, pageIndex, uploadInfo.filePath);
    }
}
