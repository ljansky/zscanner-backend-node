import { Server } from "http";
import * as koa from "koa";

import {
    constructKoaApplication,
    newDemoDocumentStorage, newNoopAuthenticator,
    HEALTH_LEVEL_OK,
    MetricsEvent,
    MetricsStorage,
} from "../src/app";
import { disableLogging } from "../src/lib/logging";
import { newNoopMetricsStorage } from "../src/services/metrics-storages/noop";
import { Authenticator, DocumentStorage } from "../src/services/types";

disableLogging();

export function newStaticAuthenticator() {
    return {
        ...newNoopAuthenticator(),
        async authenticate(context: koa.Context): Promise<boolean> {
            context.state.userId = "USER";
            return true;
        },
    };
}

export function newMockMetricsStorage(): MetricsStorage & { expectEvent(event: MetricsEvent): void | never } {
    const events: MetricsEvent[] = [];

    return {
        initialize: () => Promise.resolve(),
        log: (event) => events.push(event),
        getHealth: () => ({ level: HEALTH_LEVEL_OK, messages: [] }),
        expectEvent: (event) => {
            expect(events.length).toEqual(1);
            expect(events[0].ts).toBeInstanceOf(Date);
            event.ts = events[0].ts;
            expect(events[0]).toEqual(event);
        },
    };
}

export async function withApplication<T>(
    {
        authenticator,
        documentStorage,
        metricsStorage,
        patcher,
        port,
    }: {
        authenticator?: Authenticator,
        documentStorage?: DocumentStorage,
        metricsStorage?: MetricsStorage,
        patcher?: (app: koa) => void,
        port?: number,
    },
    fn: (server: Server) => Promise<T>,
): Promise<T> {
    authenticator = authenticator || newNoopAuthenticator();
    documentStorage = documentStorage || newDemoDocumentStorage({});
    metricsStorage = metricsStorage || newNoopMetricsStorage();
    await authenticator.initialize();
    await documentStorage.initialize();
    await metricsStorage.initialize();
    const app = constructKoaApplication({
        authenticator,
        documentStorage,
        metricsStorage,
    });
    if (patcher) {
        patcher(app);
    }
    const server = app.listen(port);
    try {
        return await fn(server);
    } finally {
        server.close();
    }
}
