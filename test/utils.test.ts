import request = require('supertest');

import { normalizeString } from "../src/lib/utils";
import { newDemoDocumentStorage } from "../src/services/document-storages/demo";
import { DocumentType } from "../src/services/types";

import { withApplication } from "./common";

describe("Utilities", () => {
    test(`Check that normalizer works`, async () => {
        expect(normalizeString(null)).toEqual("");
        expect(normalizeString(undefined)).toEqual("");
        expect(normalizeString(1)).toEqual("1");
        expect(normalizeString("ABC")).toEqual("abc");
        expect(normalizeString("ABC  ABC")).toEqual("abc abc");
        expect(normalizeString("ABC  ABC\t\t123")).toEqual("abc abc 123");
    });

    test(`Route error handling works`, async () => {
        await withApplication({
            documentStorage: {
                ...newDemoDocumentStorage({}),
                async getDocumentTypes(): Promise<DocumentType[]> {
                    throw new Error('ERROR');
                },
            },
        }, async (server) => {
            const response = await request(server).get(`/api-zscanner/v3/documenttypes`);
            expect(response.status).toEqual(500);
        });
    });
});
