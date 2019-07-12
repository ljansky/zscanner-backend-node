import * as koa from 'koa';
import { default as KoaRouter } from 'koa-router';

export function newHealthCheckRouter() {
    const router = new KoaRouter();

    router.prefix('/api-zscanner');

    router.get('/healthcheck', healthcheck);
    router.get('/v1/healthcheck', healthcheck);
    router.get('/v2/healthcheck', healthcheck);
    router.get('/v3/healthcheck', healthcheck);

    async function healthcheck(ctx: koa.Context) {
        ctx.status = 200;
        ctx.body = { status: "ok" };
    }

    return router;
}
