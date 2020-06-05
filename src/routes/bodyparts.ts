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

    return router;

    async function getBodyPartsViews(ctx: koa.Context) {
        ctx.body = await bodyPartsStorage.getBodyPartsViews();
        ctx.response.status = 200;
        ctx.response.message = `OK`;
    }
}
