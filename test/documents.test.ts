import * as fs from 'fs';
import request = require('supertest');

import { newDemoDocumentStorage } from "../src/services/document-storages/demo";
import { DocumentSummary } from "../src/services/types";

import { withApplication } from "./common";

describe("Documents tests", () => {
    ["/v1", "/v2"].forEach((path) => {
        test(`Check that document summary upload ${path} bubbles to document storage and returns correct result`, async () => {
            const storage = newMockDocumentStorage();
            await withApplication({
                documentStorage: storage,
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
                expect(storage.postedPages.length).toEqual(0);
                expect(storage.postedSummaries).toEqual([
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
                            user: undefined,
                        },
                    },
                ]);
            });
        });
    });

    test(`Check that document summary upload /v3 bubbles to document storage and returns correct result`, async () => {
        const storage = newMockDocumentStorage();
        await withApplication({
            documentStorage: storage,
        }, async (server) => {
            const response = await request(server)
                .post(`/api-zscanner/v3/documents/summary`)
                .set('Content-Type', 'application/json')
                .send({
                    correlation: 'CORRELATION',
                    folderInternalId: 'PATID',
                    documentMode: "doc",
                    documentType:  'TYPE',
                    pages: 1,
                    datetime: "2000-01-01T12:30:00Z",
                    name: 'NAME',
                    notes: 'NOTES',
                });
            expect(response.status).toEqual(200);
            expect(storage.postedPages.length).toEqual(0);
            expect(storage.postedSummaries).toEqual([
                {
                    correlationId: "CORRELATION",
                    summary: {
                        datetime: Date.UTC(2000, 0, 1, 12, 30),
                        documentMode: "doc",
                        documentType: "TYPE",
                        folderInternalId: "PATID",
                        name: "NAME",
                        notes: "NOTES",
                        pages: 1,
                        user: undefined,
                    },
                },
            ]);
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
                    .field("page", "1")
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
        async submitDocumentPage(correlationId: string, pageIndex: number, file: string): Promise<void> {
            c.postedPages.push({
                correlationId,
                pageIndex,
                file: fs.readFileSync(file).toString("hex"),
            });
        },
        postedSummaries: [] as any[],
        postedPages: [] as any[],
    };
    return c;
}
