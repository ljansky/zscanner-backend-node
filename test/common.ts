import { Server } from "http";
import * as koa from "koa";
import { DataStore, EVENTS } from 'tus-node-server';

import {
    constructKoaApplication,
    newDemoDocumentStorage, newNoopAuthenticator,
    HEALTH_LEVEL_OK,
    MetricsEvent,
    MetricsStorage,
} from "../src/app";
import { disableLogging } from "../src/lib/logging";
import { newNoopMetricsStorage } from "../src/services/metrics-storages/noop";
import { Authenticator, DocumentStorage, Uploader } from "../src/services/types";
import { newTusUploader } from "../src/services/uploader/tus-uploader";

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

class MockStore extends DataStore {
    public files: any[] = [];
    public create(req: any) {
        return super.create(req)
            .then((file) => {
                this.files.push(file);
                return file;
            });
    }
    public write(req: any, file_id: string) {
        return new Promise((resolve, reject) => {
            const file = this.files.find((f) => f.id === file_id);
            // Stub resolve for tests
            const offset = 0;

            this.emit(EVENTS.EVENT_UPLOAD_COMPLETE, { file });
            return resolve(offset);
        });
    }
}

export function newMockTusUploader() {
    return newTusUploader({
        store: new MockStore({
            path: '/api-zscanner/upload',
        }),
    });
}

export async function withApplication<T>(
    {
        authenticator,
        documentStorage,
        metricsStorage,
        uploader,
        patcher,
        port,
    }: {
        authenticator?: Authenticator,
        documentStorage?: DocumentStorage,
        metricsStorage?: MetricsStorage,
        uploader?: Uploader,
        patcher?: (app: koa) => void,
        port?: number,
    },
    fn: (server: Server) => Promise<T>,
): Promise<T> {
    authenticator = authenticator || newNoopAuthenticator();
    documentStorage = documentStorage || newDemoDocumentStorage({});
    metricsStorage = metricsStorage || newNoopMetricsStorage();
    uploader = uploader || newMockTusUploader();
    await authenticator.initialize();
    await documentStorage.initialize();
    await metricsStorage.initialize();
    const app = constructKoaApplication({
        authenticator,
        documentStorage,
        metricsStorage,
        uploader,
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
