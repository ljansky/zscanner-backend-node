import * as koa from 'koa';
import { default as KoaRouter } from 'koa-router';
import { Server, FileStore, EVENTS } from 'tus-node-server';
import e2k from 'express-to-koa';

console.log(EVENTS);

import { config } from "../lib/config";

export function newUploadRouter({
    uploader
}: {
    uploader: any
}) {
    const tusServer = new Server();
    tusServer.datastore = new FileStore({
        directory: 'upload',
        path: `${config.ROUTER_PREFIX}/upload`,
    });

    tusServer.on(EVENTS.EVENT_UPLOAD_COMPLETE, (event: any) => {
        console.log(`Upload complete for file ${event.file.id}`);
    });

    const router = new KoaRouter();

    router.prefix(config.ROUTER_PREFIX);

    router.all('*', uploader.getMiddleware());

    return router;
}
