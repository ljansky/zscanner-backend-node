import { default as KoaRouter } from 'koa-router';

import { config } from "../lib/config";

export function newUploadRouter({
    uploader,
}: {
    uploader: any,
}) {
    const router = new KoaRouter();

    router.prefix(config.ROUTER_PREFIX);

    router.all('*', uploader.getMiddleware());

    return router;
}
