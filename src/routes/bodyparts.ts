import * as koa from 'koa';
import { default as KoaRouter } from 'koa-router';

import { config } from "../lib/config";
import { createLogger } from "../lib/logging";
import { wrapRouteWithErrorHandler } from "../lib/utils";
import { BodyPartsStorage } from '../services/types';

const LOG = createLogger(__filename);

export function newBodyPartsRouter(
    {
        bodyPartsStorage,
    }: {
        bodyPartsStorage: BodyPartsStorage,
    }) {

    const router = new KoaRouter();

    router.prefix(config.ROUTER_PREFIX);

    router.get('/v3/bodyparts/views', wrapRouteWithErrorHandler(LOG, getBodyPartsViews));
    router.get('/v3/bodyparts/views/:viewId/image', wrapRouteWithErrorHandler(LOG, getBodyPartViewImage));

    return router;

    async function getBodyPartsViews(ctx: koa.Context) {
        ctx.body = await bodyPartsStorage.getBodyPartsViews();
        ctx.response.status = 200;
        ctx.response.message = `OK`;
    }

    async function getBodyPartViewImage(ctx: koa.Context) {
        const viewId = ctx.params.viewId;
        const image = await bodyPartsStorage.getBodyPartsViewImage(viewId);
        if (image) {
            ctx.body = image.data;
            ctx.type = image.type;
            ctx.response.status = 200;
            ctx.response.message = `OK`;
        } else {
            ctx.response.status = 404;
        }
    }
}
