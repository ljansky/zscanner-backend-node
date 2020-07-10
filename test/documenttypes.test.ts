import request = require('supertest');

import { DEMO_DOCUMENT_TYPES } from '../src/services/document-storages/demo';

import { withApplication } from './common';

describe('Document types tests', () => {
    ['/v1', '/v2', '/v3'].forEach((path) => {
        test(`Check that document type ${path} returns all document types`, async () => {
            await withApplication({}, async (server) => {
                const response = await request(server).get(
                    `/api-zscanner${path}/documenttypes`
                );
                expect(response.status).toEqual(200);
                expect(response.body).toEqual(DEMO_DOCUMENT_TYPES);
            });
        });
    });
});
