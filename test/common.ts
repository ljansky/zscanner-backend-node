import fs from 'fs';
import { Server } from "http";
import * as koa from "koa";
import request, { Response } from 'supertest';
import tmp from 'tmp';
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
import { Authenticator, DocumentStorage, TusUploaderMetadata, Uploader } from "../src/services/types";
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
    constructor(options: any) {
        super(options);
        this.directory = options.directory;
    }
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
            const offset = 0;
            let body = '';
            req.on('data', (chunk: any) => {
                body += chunk;
            });
            req.on('end', () => {
                fs.writeFileSync(`${this.directory}/${file_id}`, body);
                this.emit(EVENTS.EVENT_UPLOAD_COMPLETE, { file });
                return resolve(offset);
            });
        });
    }
}

export function newMockTusUploader() {
    const tmpDirObj = tmp.dirSync();
    return newTusUploader({
        store: new MockStore({
            path: '/api-zscanner/upload',
            directory: tmpDirObj.name,
        }),
    });
}

export const newTusUploadClient = (server: Server) => ({
    create: async ({ url, data, metadata }: { url: string; data: Buffer; metadata: TusUploaderMetadata }) => {
        const uploadMetadata = Object.keys(metadata).reduce<string[]>((acc, curr) => {
            return acc.concat(`${curr} ${Buffer.from(metadata[curr]).toString('base64')}`);
        }, []).join(',');

        return request(server)
            .post(url)
            .set('Tus-Resumable', '1.0.0')
            .set('Upload-Length', data.length.toString())
            .set('Upload-Metadata', uploadMetadata);
    },
    write: async ({ url, createResponse, data }: { url: string; createResponse: Response; data: Buffer; }) => {
        const fileId = createResponse.header.location.split('/').pop();
        return request(server)
            .patch(`${url}/${fileId}`)
            .set('Tus-Resumable', '1.0.0')
            .set('Upload-Offset', '0')
            .set('Content-Type', 'application/offset+octet-stream')
            .send(data);
    },
});

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
