import e2k from 'express-to-koa';
import { EVENTS, FileStore, Server } from 'tus-node-server';

import { config } from "../../lib/config";
import { TusUploaderEventHandler, TusUploaderMetadata, Uploader } from '../types';

interface TusUploaderEventHandlers {
    [uploadType: string]: TusUploaderEventHandler;
}

export function newTusUploader(): Uploader {

    const tusServer = new Server();
    tusServer.datastore = new FileStore({
            directory: 'upload',
            path: `${config.ROUTER_PREFIX}/upload`,
    });

    const handlers: TusUploaderEventHandlers = {};

    tusServer.on(EVENTS.EVENT_UPLOAD_COMPLETE, (event) => {
        const metadataList = event.file.upload_metadata
            .split(',')
            .map((m: string) => {
                const [name, encodedValue] = m.split(' ');
                return {
                    name,
                    value: Buffer.from(encodedValue, 'base64').toString(),
                };
            });

        const metadata: TusUploaderMetadata = metadataList.reduce((acc, curr) => ({
            ...acc,
            [curr.name]: curr.value,
        }), {});

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
