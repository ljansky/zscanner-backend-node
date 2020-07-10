import { default as KoaRouter } from 'koa-router';

import { config } from '../lib/config';
import { Uploader } from '../services/types';

export function newUploadRouter({ uploader }: { uploader: Uploader }) {
    const router = new KoaRouter();

    router.prefix(config.ROUTER_PREFIX);

    router.all('*', uploader.getMiddleware());

    return router;
}
