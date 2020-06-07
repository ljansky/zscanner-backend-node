///<reference path="../../../types/tus-node-server/index.d.ts" />
import { CronJob } from 'cron';
import e2k from 'express-to-koa';
import { default as Koa } from "koa";
import compose from 'koa-compose';
import { DataStore, EVENTS, FileStore, Server } from 'tus-node-server';

import { clearExpiredFiles } from '../../lib/clear-expired-files';
import { config } from "../../lib/config";
import { createLogger } from "../../lib/logging";
import { HttpError } from '../../lib/utils';
import { TusUploaderEventHandler, TusUploaderMetadata, Uploader } from '../types';

const LOG = createLogger(__filename);
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
    const store = new FileStore({
        directory,
        path: `${config.ROUTER_PREFIX}${path}`,
    });

    if (directory) {
        const clearJob = new CronJob('0 * * * * *', () => {
            clearExpiredFiles(directory, config.UPLOADER_EXPIRATION_TIME)
                .catch((err) => LOG.error('Error while clearing expired files', err));
        });
        clearJob.start();
    }

    return store;
}

export function newTusUploader({
    store,
}: {
    store: DataStore,
}): Uploader {

    const tusServer = new Server();
    tusServer.datastore = store;

    const onCompleteHandlers: TusUploaderEventHandlers = {};
    const beforeStartHandlers: TusUploaderEventHandlers = {};

    tusServer.on(EVENTS.EVENT_UPLOAD_COMPLETE, (event) => {
        const metadata = parseMetadata(event.file.upload_metadata);
        metadata.filepath = `${tusServer.datastore.directory}/${event.file.id}`;

        if (metadata.uploadType && onCompleteHandlers[metadata.uploadType]) {
            onCompleteHandlers[metadata.uploadType](metadata);
        }
    });

    const validationMiddleware: Koa.Middleware = async (ctx, next) => {
        if (ctx.request.headers['x-http-method-override'] ? ctx.request.headers['x-http-method-override'].toUpperCase() === 'POST' : ctx.request.method === 'POST') {
            const uploadMetadata = ctx.request.header['upload-metadata'];
            if (!uploadMetadata) {
                throw new HttpError('Missing metadata', 400);
            }

            const metadata = parseMetadata(uploadMetadata);
            if (!metadata.uploadType) {
                throw new HttpError('Missing metadata uploadType', 400);
            }

            if (beforeStartHandlers[metadata.uploadType]) {
                beforeStartHandlers[metadata.uploadType](metadata);
            }
        }

        await next();
    };

    const middleware = compose([
        validationMiddleware,
        e2k(tusServer.handle.bind(tusServer)),
    ]);

    function parseMetadata(uploadMetadata: string) {
        const metadataList = uploadMetadata ? uploadMetadata
            .split(',')
            .filter(Boolean)
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

        return metadata;
    }

    return {
        getMiddleware: () => middleware,
        onUploadComplete: (uploadType: string, handler: TusUploaderEventHandler) => {
            onCompleteHandlers[uploadType] = handler;
        },
        beforeUploadStart: (uploadType: string, handler: TusUploaderEventHandler) => {
            beforeStartHandlers[uploadType] = handler;
        },
    };
}
