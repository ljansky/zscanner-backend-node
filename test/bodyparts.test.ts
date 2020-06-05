import request = require('supertest');

import { DEMO_BODY_PARTS_VIEWS } from "../src/services/body-parts-storages/demo";

import { withApplication } from "./common";

describe("Body parts views tests", () => {
    test(`Check that body parts views v3 returns all body part views`, async () => {
        await withApplication({}, async (server) => {
            const response = await request(server).get(`/api-zscanner/v3/bodyparts/views`);
            expect(response.status).toEqual(200);
            expect(response.body).toEqual(DEMO_BODY_PARTS_VIEWS);
        });
    });
});
