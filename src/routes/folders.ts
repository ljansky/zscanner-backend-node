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
    router.get('/v2/patients/decode', wrapRouteWithErrorHandler(LOG, getPatientV1V2));
    router.get('/v3/folders/search', wrapRouteWithErrorHandler(LOG, getFoldersV3));
    router.get('/v3/folders/decode', wrapRouteWithErrorHandler(LOG, getFolderV3));

    async function getPatientsV1V2(ctx: koa.Context) {
        const folders = ctx.query.query ? await documentStorage.findFolders(ctx.query.query) : [];
        ctx.body = folders.map(DocumentFolder2Patient);
        ctx.response.status = 200;
        ctx.response.message = 'OK';
    }

    async function getPatientV1V2(ctx: koa.Context) {
        const folder = ctx.query.query ? await documentStorage.getFolderByBarcode(ctx.query.query) : undefined;
        const response = folder ? DocumentFolder2Patient(folder) : folder;
        if (response) {
            ctx.response.body = response;
            ctx.response.status = 200;
        } else {
            ctx.response.status = 404;
        }
    }

    async function getFoldersV3(ctx: koa.Context) {
        ctx.body = ctx.query.query ? await documentStorage.findFolders(ctx.query.query) : [];
        ctx.response.status = 200;
        ctx.response.message = 'OK';
    }

    async function getFolderV3(ctx: koa.Context) {
        const response = ctx.query.query ? await documentStorage.getFolderByBarcode(ctx.query.query) : undefined;
        if (response) {
            ctx.response.body = response;
            ctx.response.status = 200;
        } else {
            ctx.response.status = 404;
        }
    }

    return router;
}

function DocumentFolder2Patient(folder: DocumentFolder): Patient {
    return {
        bid: folder.externalId,
        zid: folder.internalId,
        name: folder.name,
    };
}
