import * as koa from 'koa';
import { default as KoaRouter } from 'koa-router';

import { max } from "../lib/utils";
import { HealthConscious, HEALTH_LEVEL_ERROR, HEALTH_LEVEL_OK } from "../services/types";

export function newHealthCheckRouter(
    {
        components,
    }: {
        components: HealthConscious[],
    }) {
    const router = new KoaRouter();

    router.prefix('/api-zscanner');

    router.get('/healthcheck', healthcheck);
    router.get('/v1/healthcheck', healthcheck);
    router.get('/v2/healthcheck', healthcheck);
    router.get('/v3/healthcheck', healthcheck);

    return router;

    async function healthcheck(ctx: koa.Context) {
        const totalHealth = components
            .map((c) => c.getHealth())
            .reduce(
                (acc, current) => ({ level: max(acc.level, current.level), messages: acc.messages.concat(current.messages) }),
                { level: HEALTH_LEVEL_OK, messages: [] });

        if (totalHealth.level === HEALTH_LEVEL_OK) {
            ctx.status = 200;
            ctx.body = { status: "ok" };
        } else {
            ctx.status = 500;
            ctx.body = {
                status: totalHealth.level < HEALTH_LEVEL_ERROR ? 'warning' : 'error',
                level: totalHealth.level,
                errors: totalHealth.messages,
            };
        }
    }
}
