import e2k from 'express-to-koa';
import { DataStore, EVENTS, FileStore, Server } from 'tus-node-server';

import { config } from "../../lib/config";
import { TusUploaderEventHandler, TusUploaderMetadata, Uploader } from '../types';

interface TusUploaderEventHandlers {
    [uploadType: string]: TusUploaderEventHandler;
}

export function newTusStore({
    directory,
    path = '/upload',
}: {
    directory?: string;
    path?: string;
}): DataStore {
    return new FileStore({
        directory,
        path: `${config.ROUTER_PREFIX}${path}`,
    });
}

export function newTusUploader({
    store,
}: {
    store: DataStore,
}): Uploader {

    const tusServer = new Server();
    tusServer.datastore = store;

    const handlers: TusUploaderEventHandlers = {};

    tusServer.on(EVENTS.EVENT_UPLOAD_COMPLETE, (event) => {
        const metadataList = event.file ? event.file.upload_metadata
            .split(',')
            .map((m: string) => {
                const [name, encodedValue] = m.split(' ');
                return {
                    name,
                    value: Buffer.from(encodedValue, 'base64').toString(),
                };
            }) : [];

        const metadata: TusUploaderMetadata = metadataList.reduce((acc, curr) => ({
            ...acc,
            [curr.name]: curr.value,
        }), {});
        // TODO: set the filepath in better way (to have app root dir in config?)
        metadata.filepath = `${__dirname}/../../../upload/${event.file.id}`;

        if (metadata.uploadType && handlers[metadata.uploadType]) {
            handlers[metadata.uploadType](metadata);
        }
    });

    const middleware = e2k(tusServer.handle.bind(tusServer));

    return {
            getMiddleware: () => middleware,
            onUploadComplete: (uploadType: string, handler: TusUploaderEventHandler) => {
                handlers[uploadType] = handler;
            },
    };
}
