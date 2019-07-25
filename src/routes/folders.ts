import * as koa from 'koa';
import { default as KoaRouter } from 'koa-router';

import { createLogger } from "../lib/logging";
import { wrapRouteWithErrorHandler } from "../lib/utils";
import { DocumentFolder, DocumentStorage, Patient } from "../services/types";

const LOG = createLogger(__filename);

export function newFoldersRouter(
    {
        documentStorage,
    }: {
        documentStorage: DocumentStorage,
    }) {

    const router = new KoaRouter();

    router.prefix('/api-zscanner/');

    router.get('/v1/patients', wrapRouteWithErrorHandler(LOG, getPatientsV1V2));
    router.get('/v2/patients/search', wrapRouteWithErrorHandler(LOG, getPatientsV1V2));
    router.get('/v2/patients/decode', wrapRouteWithErrorHandler(LOG, getPatientByBarcodeV1V2));
    router.get('/v3/folders/search', wrapRouteWithErrorHandler(LOG, getFoldersV3));
    router.get('/v3/folders/decode', wrapRouteWithErrorHandler(LOG, getFolderByBarcodeV3));

    return router;

    async function getPatientsV1V2(ctx: koa.Context) {
        const query = sanitizeQuery(ctx.query.query);
        const folders = query ? await documentStorage.findFolders(query) : [];
        ctx.body = folders.map(DocumentFolder2Patient);
        ctx.response.status = 200;
        ctx.response.message = 'OK';
    }

    async function getPatientByBarcodeV1V2(ctx: koa.Context) {
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
        const query = sanitizeQuery(ctx.query.query);
        ctx.body = query ? await documentStorage.findFolders(query) : [];
        ctx.response.status = 200;
        ctx.response.message = 'OK';
    }

    async function getFolderByBarcodeV3(ctx: koa.Context) {
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
