import { default as Koa } from "koa";
import { default as bodyparser } from "koa-bodyparser";
import { default as json } from "koa-json";

import { createLogger } from "./lib/logging";
import { time, KoaNextFunction } from "./lib/utils";
import { newDocumentsRouter } from "./routes/documents";
import { newDocumentTypesRouter } from "./routes/documenttypes";
import { newFoldersRouter } from "./routes/folders";
import { newHealthCheckRouter } from "./routes/healthcheck";
import { Authenticator, DocumentStorage } from "./services/types";

export { config } from "./lib/config";
export { createLogger } from "./lib/logging";
export * from "./lib/utils";
export * from "./services/types";
export { newNoopAuthenticator } from "./services/authenticators/noop";
export { newSeacatAuthenticator } from "./services/authenticators/seacat";
export { newDemoDocumentStorage } from "./services/document-storages/demo";

const onerror = require('koa-onerror');
const formidable = require('koa2-formidable');

const LOG = createLogger(__filename);

export function constructKoaApplication(
    {
        authenticator,
        documentStorage,
    }: {
        authenticator: Authenticator,
        documentStorage: DocumentStorage,
    }) {

    const app = new Koa();
    configureMiddleware();
    configureRoutes();
    return app;

    function configureRoutes() {
        const documentsRouter = newDocumentsRouter({ documentStorage });
        const foldersRouter = newFoldersRouter({ documentStorage });
        const documentTypesRouter = newDocumentTypesRouter({ documentStorage });
        const healthCheckRouter = newHealthCheckRouter({ components: [documentStorage, authenticator] });

        app.use(documentsRouter.routes());
        app.use(foldersRouter.routes());
        app.use(documentTypesRouter.routes());
        app.use(healthCheckRouter.routes());
    }

    function configureMiddleware() {
        onerror(app);

        app.use(async function(ctx: Koa.Context, next: KoaNextFunction) {
            if (authenticator.authenticate(ctx)) {
                await next();
            }
        });
        app.use(formidable({
            encoding: 'utf-8',
            maxFileSize: 1000 * 1024 * 1024,
        }));
        app.use(bodyparser({
            enableTypes: ['json', 'form', 'text'],
        }));
        app.use(json());

        // logger
        app.use(koaLogger());

        // error-handling
        app.on('error', (error, ctx) => {
            LOG.error(`${ctx.method} ${ctx.url} - Error ${error}`, {
                error,
            });
        });
    }

    function koaLogger() {
        return async (ctx: Koa.Context, next: KoaNextFunction) => {
            const ms = (await time(next))[1];
            LOG.debug(`${ctx.method} ${ctx.url} - ${ctx.response.status} - ${ms.toFixed(3)}ms - ${ctx.response.message}`, {
                method: ctx.method,
                url: ctx.url,
                ms,
                status: ctx.response.status,
            });
        };
    }
}
