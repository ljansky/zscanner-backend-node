import * as koa from 'koa';
import request = require('supertest');

import { newNoopAuthenticator } from '../src/services/authenticators/noop';

import { withApplication } from './common';

describe('Authentication', () => {
    test(`Check that authentication is required`, async () => {
        await withApplication(
            {
                authenticator: {
                    ...newNoopAuthenticator(),
                    async authenticate(context: koa.Context): Promise<boolean> {
                        return false;
                    },
                },
            },
            async (server) => {
                const response = await request(server).get(
                    `/api-zscanner/v3/documenttypes`
                );
                expect(response.status).toEqual(403);
            }
        );
    });

    test(`Check that healthcheck does not require authentication`, async () => {
        await withApplication(
            {
                authenticator: {
                    ...newNoopAuthenticator(),
                    async authenticate(context: koa.Context): Promise<boolean> {
                        return false;
                    },
                },
            },
            async (server) => {
                const response = await request(server).get(
                    `/api-zscanner/v3/healthcheck`
                );
                expect(response.status).toEqual(200);
                expect(response.body).toEqual({ status: 'ok' });
            }
        );
    });
});
