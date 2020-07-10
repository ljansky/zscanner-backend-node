import * as koa from 'koa';
import { default as KoaRouter } from 'koa-router';
import request = require('supertest');

import { newSeacatAuthenticator } from '../src/services/authenticators/seacat';

import { withApplication } from './common';

describe('Seacat', () => {
    test(`Check that seacat authenticator refuses auth when no tag header is passed`, async () => {
        await withApplication(
            {
                authenticator: newSeacatAuthenticator({
                    seacatEndpoint: 'http://127.0.0.1:42983/__seacat/',
                    seacatUsername: 'username',
                    seacatPasword: 'password',
                }),
            },
            async (server) => {
                const response = await request(server).get(
                    `/api-zscanner/v3/documenttypes`
                );
                expect(response.status).toEqual(403);
            }
        );
    });

    test(`Check that seacat request is correct and authentiation passed if successfull`, async () => {
        let tag: string;

        await withApplication(
            {
                authenticator: newSeacatAuthenticator({
                    seacatEndpoint: 'http://127.0.0.1:42983/__seacat/',
                    seacatUsername: 'username',
                    seacatPasword: 'password',
                }),
                port: 42983,
                patcher(app: koa) {
                    const router = new KoaRouter();
                    router.get('/__seacat/:tag', async (ctx: koa.Context) => {
                        expect(ctx.request.headers.authorization).toEqual(
                            'Basic ' +
                                Buffer.from('username:password').toString(
                                    'base64'
                                )
                        );
                        tag = ctx.params.tag;
                        ctx.response.status = 200;
                        ctx.response.body = { userid: 'userid' };
                    });
                    app.use(router.routes());
                },
            },
            async (server) => {
                const response = await request(server)
                    .get(`/api-zscanner/v3/documenttypes`)
                    .set('x-sc-client-tag', 'THE-TAG');
                expect(response.status).toEqual(200);
                expect(tag).toEqual('[THE-TAG]');
            }
        );
    });
});
