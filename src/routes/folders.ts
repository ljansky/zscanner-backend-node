import * as koa from 'koa';
import { default as KoaRouter } from 'koa-router';

import { config } from "../lib/config";
import { createLogger } from "../lib/logging";
import { wrapRouteWithErrorHandler } from "../lib/utils";
import { DocumentFolder, DocumentStorage, MetricsStorage, Patient } from "../services/types";

const LOG = createLogger(__filename);

export function newFoldersRouter(
    {
        documentStorage,
        metricsStorage,
    }: {
        documentStorage: DocumentStorage,
        metricsStorage: MetricsStorage,
    }) {

    const router = new KoaRouter();

    router.prefix(config.ROUTER_PREFIX);

    router.get('/v1/patients', wrapRouteWithErrorHandler(LOG, getPatientsV1V2));
    router.get('/v2/patients/search', wrapRouteWithErrorHandler(LOG, getPatientsV1V2));
    router.get('/v2/patients/decode', wrapRouteWithErrorHandler(LOG, getPatientByBarcodeV1V2));
    router.get('/v3/folders/search', wrapRouteWithErrorHandler(LOG, getFoldersV3));
    router.get('/v3/folders/decode', wrapRouteWithErrorHandler(LOG, getFolderByBarcodeV3));

    return router;

    async function getPatientsV1V2(ctx: koa.Context) {
        metricsStorage.log({
            ts: new Date(),
            type: "search",
            version: ctx.request.path.includes('/v2/') ? 2 : 1,
            user: ctx.state.userId,
            data: {
                query: ctx.query.query,
            },
        });

        const query = sanitizeQuery(ctx.query.query);
        const folders = await executeSearchOrBarcodeDecode();
        ctx.body = folders.map(DocumentFolder2Patient);
        ctx.response.status = 200;
        ctx.response.message = 'OK';

        async function executeSearchOrBarcodeDecode() {
            if (!query) {
                return [];
            }
            if (!ctx.query.query.includes('#')) {
                return documentStorage.findFolders(query, ctx.state.userId);
            }
            const folder = await documentStorage.getFolderByBarcode(query);
            return folder ? [ folder ] : [];
        }
    }

    async function getPatientByBarcodeV1V2(ctx: koa.Context) {
        metricsStorage.log({
            ts: new Date(),
            type: "decode",
            version: ctx.request.path.includes('/v2/') ? 2 : 1,
            user: ctx.state.userId,
            data: {
                query: ctx.query.query,
            },
        });

        const query = sanitizeQuery(ctx.query.query);
        const folder = query ? await documentStorage.getFolderByBarcode(query) : undefined;
        const response = folder ? DocumentFolder2Patient(folder) : folder;
        if (response) {
            ctx.response.body = response;
            ctx.response.status = 200;
        } else {
            ctx.response.status = 404;
        }
    }

    async function getFoldersV3(ctx: koa.Context) {
        metricsStorage.log({
            ts: new Date(),
            type: "search",
            version: 3,
            user: ctx.state.userId,
            data: {
                query: ctx.query.query,
            },
        });

        const query = sanitizeQuery(ctx.query.query);
        ctx.body = query ? await documentStorage.findFolders(query, ctx.state.userId) : [];
        ctx.response.status = 200;
        ctx.response.message = 'OK';
    }

    async function getFolderByBarcodeV3(ctx: koa.Context) {
        metricsStorage.log({
            ts: new Date(),
            type: "decode",
            version: 3,
            user: ctx.state.userId,
            data: {
                query: ctx.query.query,
            },
        });

        const query = sanitizeQuery(ctx.query.query);
        const response = query ? await documentStorage.getFolderByBarcode(query) : undefined;
        if (response) {
            ctx.response.body = response;
            ctx.response.status = 200;
        } else {
            ctx.response.status = 404;
        }
    }
}

function DocumentFolder2Patient(folder: DocumentFolder): Patient {
    return {
        bid: folder.externalId,
        zid: folder.internalId,
        name: folder.name,
    };
}

function sanitizeQuery(query: string): string | undefined {
    if (!query) {
        return;
    }

    query = `${query}`
        .replace(/[^\p{L}\p{N}\p{Z}\/.-]/gu, '')
        .replace(/\p{Z}+/gu, ' ')
        .trim();

    if (!query) {
        return;
    }

    return query;
}
