import * as koa from 'koa';
import { default as KoaRouter } from 'koa-router';

export function newHealthCheckRouter() {
    const router = new KoaRouter();

    router.get('/api-zscanner/healthcheck', healthcheck);
    router.get('/api-zscanner/v1/healthcheck', healthcheck);
    router.get('/api-zscanner/v2/healthcheck', healthcheck);

    async function healthcheck(ctx: koa.Context) {
        ctx.status = 200;
        ctx.body = { status: "ok" };
    }

    return router;
}
