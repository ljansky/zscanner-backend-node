import request = require('supertest');

import {
    newDemoDocumentStorage,
    newNoopAuthenticator,
    HealthReport,
} from '../src/app';

import { withApplication } from './common';

describe('Healthcheck tests', () => {
    ['', '/v1', '/v2', '/v3'].forEach((path) => {
        test(`Check that healthcheck ${path} returns success if all services work`, async () => {
            await withApplication({}, async (server) => {
                const response = await request(server).get(
                    `/api-zscanner${path}/healthcheck`
                );
                expect(response.status).toEqual(200);
                expect(response.body).toEqual({ status: 'ok' });
            });
        });

        test(`Check that healthcheck ${path} returns warning when authenticator returns warning`, async () => {
            await withApplication(
                {
                    authenticator: {
                        ...newNoopAuthenticator(),
                        getHealth(): HealthReport {
                            return {
                                level: 1,
                                messages: ['Error from Authenticator'],
                            };
                        },
                    },
                },
                async (server) => {
                    const response = await request(server).get(
                        `/api-zscanner${path}/healthcheck`
                    );
                    expect(response.status).toEqual(500);
                    expect(response.body).toEqual({
                        status: 'warning',
                        level: 1,
                        errors: ['Error from Authenticator'],
                    });
                }
            );
        });

        test(`Check that healthcheck ${path} returns warning when document storage returns warning`, async () => {
            await withApplication(
                {
                    documentStorage: {
                        ...newDemoDocumentStorage({}),
                        getHealth(): HealthReport {
                            return {
                                level: 1,
                                messages: ['Error from Document Storage'],
                            };
                        },
                    },
                },
                async (server) => {
                    const response = await request(server).get(
                        `/api-zscanner${path}/healthcheck`
                    );
                    expect(response.status).toEqual(500);
                    expect(response.body).toEqual({
                        status: 'warning',
                        level: 1,
                        errors: ['Error from Document Storage'],
                    });
                }
            );
        });

        test(`Check that healthcheck ${path} returns error when authenticator returns error`, async () => {
            await withApplication(
                {
                    authenticator: {
                        ...newNoopAuthenticator(),
                        getHealth(): HealthReport {
                            return {
                                level: 2,
                                messages: ['Error from Authenticator'],
                            };
                        },
                    },
                },
                async (server) => {
                    const response = await request(server).get(
                        `/api-zscanner${path}/healthcheck`
                    );
                    expect(response.status).toEqual(500);
                    expect(response.body).toEqual({
                        status: 'error',
                        level: 2,
                        errors: ['Error from Authenticator'],
                    });
                }
            );
        });

        test(`Check that healthcheck ${path} returns error when document storage returns error`, async () => {
            await withApplication(
                {
                    documentStorage: {
                        ...newDemoDocumentStorage({}),
                        getHealth(): HealthReport {
                            return {
                                level: 2,
                                messages: ['Error from Document Storage'],
                            };
                        },
                    },
                },
                async (server) => {
                    const response = await request(server).get(
                        `/api-zscanner${path}/healthcheck`
                    );
                    expect(response.status).toEqual(500);
                    expect(response.body).toEqual({
                        status: 'error',
                        level: 2,
                        errors: ['Error from Document Storage'],
                    });
                }
            );
        });
    });
});
