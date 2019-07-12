import * as koa from 'koa';
import { default as KoaRouter } from 'koa-router';

import { createLogger } from "../lib/logging";
import { wrapRouteWithErrorHandler } from "../lib/utils";
import { DocumentStorage } from "../services/types";

const LOG = createLogger(__filename);

export function newFoldersRouter(
    {
        documentStorage,
    }: {
        documentStorage: DocumentStorage,
    }) {

    const router = new KoaRouter();

    router.prefix('/api-zscanner/');

    router.get('/v1/patients', wrapRouteWithErrorHandler(LOG, getFolders));
    router.get('/v2/patients/search', wrapRouteWithErrorHandler(LOG, getFolders));
    router.get('/v2/patients/decode', wrapRouteWithErrorHandler(LOG, getFolder));

    async function getFolders(ctx: koa.Context) {
        ctx.body = ctx.query.query ? await documentStorage.findFolders(ctx.query.query) : [];
        ctx.response.status = 200;
        ctx.response.message = 'OK';
    }

    async function getFolder(ctx: koa.Context) {
        const response = ctx.query.query ? await documentStorage.getFolderByBarcode(ctx.query.query) : undefined;
        if (response) {
            ctx.response.body = response;
            ctx.response.status = 200;
        } else {
            ctx.response.status = 404;
        }
    }

    return router;
}
