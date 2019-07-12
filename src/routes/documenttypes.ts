import * as koa from 'koa';
import { default as KoaRouter } from 'koa-router';

import { createLogger } from "../lib/logging";
import { wrapRouteWithErrorHandler } from "../lib/utils";
import { DocumentStorage } from "../services/types";

const LOG = createLogger(__filename);

export function newDocumentTypesRouter(
    {
        documentStorage,
    }: {
        documentStorage: DocumentStorage,
    }) {

    const router = new KoaRouter();

    router.prefix('/api-zscanner');

    router.get('/v1/documenttypes', wrapRouteWithErrorHandler(LOG, getDocumentTypes));
    router.get('/v2/documenttypes', wrapRouteWithErrorHandler(LOG, getDocumentTypes));
    router.get('/v3/documenttypes', wrapRouteWithErrorHandler(LOG, getDocumentTypes));

    async function getDocumentTypes(ctx: koa.Context) {
        ctx.body = await documentStorage.getDocumentTypes();
        ctx.response.status = 200;
        ctx.response.message = `OK`;
    }

    return router;
}
