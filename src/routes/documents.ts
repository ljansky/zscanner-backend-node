import * as fs from 'fs';
import * as koa from 'koa';
import { default as KoaRouter } from 'koa-router';
import { default as moment } from 'moment';

import { config } from '../lib/config';
import { createLogger } from '../lib/logging';
import { wrapRouteWithErrorHandler, HttpError } from '../lib/utils';
import {
    DocumentStorage,
    DocumentSummary,
    FolderDefectRequest,
    MetricsStorage,
    TusUploaderMetadata,
    Uploader,
} from '../services/types';

const formidable = require('koa2-formidable');

const LOG = createLogger(__filename);

export function newDocumentsRouter({
    documentStorage,
    metricsStorage,
    uploader,
}: {
    documentStorage: DocumentStorage;
    metricsStorage: MetricsStorage;
    uploader: Uploader;
}) {
    const router = new KoaRouter();

    router.prefix(config.ROUTER_PREFIX);

    const formidableMiddleware = formidable({
        encoding: 'utf-8',
        maxFileSize: 1000 * 1024 * 1024,
    });

    router.post(
        '/v1/documents/page',
        formidableMiddleware,
        wrapRouteWithErrorHandler(LOG, postPage)
    );
    router.post(
        '/v1/documents/summary',
        formidableMiddleware,
        wrapRouteWithErrorHandler(LOG, postSummaryV1V2)
    );
    router.post(
        '/v2/documents/page',
        formidableMiddleware,
        wrapRouteWithErrorHandler(LOG, postPage)
    );
    router.post(
        '/v2/documents/summary',
        formidableMiddleware,
        wrapRouteWithErrorHandler(LOG, postSummaryV1V2)
    );
    router.post(
        '/v3/documents/page',
        formidableMiddleware,
        wrapRouteWithErrorHandler(LOG, postPage)
    );
    router.post(
        '/v3/documents/summary',
        wrapRouteWithErrorHandler(LOG, postSummaryV3)
    );

    uploader.beforeUploadStart('page', validateUpload);
    uploader.onUploadComplete('page', uploadPage);

    uploader.beforeUploadStart('pageWithDefect', validateUpload);
    uploader.onUploadComplete('pageWithDefect', uploadPageWithDefect);

    return router;

    function validateUpload(metadata: TusUploaderMetadata) {
        try {
            validateUploadMetadata(metadata);
        } catch (err) {
            throw new HttpError(err.message, 400);
        }
    }

    function validateUploadMetadata(metadata: TusUploaderMetadata) {
        if (!metadata.correlation) {
            throw new Error('No correlation in the request');
        }
        if (
            !metadata.pageIndex ||
            !isFinite(parseInt(metadata.pageIndex, 10))
        ) {
            throw new Error('No page in the request');
        }

        if (!metadata.filetype) {
            throw new Error('No filetype in the request');
        }
    }

    async function uploadPageWithDefect(metadata: TusUploaderMetadata) {
        validateUploadMetadata(metadata);
        if (!metadata.filepath) {
            throw new Error('No filepath in metadata');
        }

        const correlation = metadata.correlation;
        const pageIndex = parseInt(metadata.pageIndex, 10);

        const defect: FolderDefectRequest | undefined = metadata.defectId
            ? {
                  id: metadata.defectId,
                  name: metadata.defectName,
                  bodyPartId: metadata.bodyPartId,
              }
            : undefined;

        await documentStorage.submitLargeDocumentPageWithDefect(
            correlation,
            pageIndex,
            {
                filePath: metadata.filepath,
                contentType: metadata.filetype,
                defect,
                description: metadata.description,
            }
        );

        if (!config.UPLOADER_KEEP_PROCESSED_FILES) {
            fs.unlink(metadata.filepath, (err) => {
                if (err) {
                    LOG.error('Error deleting uploaded page file', err);
                }
            });
        }
    }

    async function uploadPage(metadata: TusUploaderMetadata) {
        validateUploadMetadata(metadata);
        if (!metadata.filepath) {
            throw new Error('No filepath in metadata');
        }

        const correlation = metadata.correlation;
        const pageIndex = parseInt(metadata.pageIndex, 10);

        await documentStorage.submitLargeDocumentPage(correlation, pageIndex, {
            filePath: metadata.filepath,
            contentType: metadata.filetype,
        });

        if (!config.UPLOADER_KEEP_PROCESSED_FILES) {
            fs.unlink(metadata.filepath, (err) => {
                if (err) {
                    LOG.error('Error deleting uploaded page file', err);
                }
            });
        }
    }

    async function postPage(ctx: koa.Context) {
        if (ctx.request.type !== `multipart/form-data`) {
            return error('Not multipart/form-data');
        }
        const body = ctx.request.body;

        const pageFile = (ctx.request as any).files.page;

        if (!body) {
            return error('No body in the request');
        }
        if (!pageFile) {
            return error('No page in request');
        }
        if (!body.correlation) {
            return error('No correlation in the request');
        }

        let pageIndex;

        if (body.pageIndex && isFinite(parseInt(body.pageIndex, 10))) {
            pageIndex = parseInt(body.pageIndex, 10);
        }

        if (body.page && isFinite(parseInt(body.page, 10))) {
            pageIndex = parseInt(body.page, 10);
        }

        if (typeof pageIndex === 'undefined') {
            return error('No pageIndex in the request');
        }

        await documentStorage.submitDocumentPage(
            body.correlation,
            pageIndex,
            pageFile.path
        );

        ctx.response.status = 200;
        ctx.response.message = `OK`;

        function error(message: string, status = 400) {
            ctx.response.status = status;
            ctx.response.message = `Required fields missing`;
        }
    }

    async function postSummaryV3(ctx: koa.Context) {
        const body = ctx.request.body;

        if (!body) {
            return error('No body in the request');
        }
        if (!body.correlation) {
            return error('No correlation in the request');
        }
        if (!body.folderInternalId) {
            return error('No folderInternalId in the request');
        }
        if (!body.documentMode) {
            return error('No documentMode in the request');
        }
        if (!body.documentType && body.documentType !== '') {
            return error('No documentType in the request');
        }
        if (!body.pages || !parseInt(body.pages, 10)) {
            return error('No pages in the request');
        }
        if (!body.datetime || !moment(body.datetime).isValid()) {
            return error('No valid datetime in the request');
        }

        metricsStorage.log({
            ts: new Date(),
            type: 'upload',
            version: 3,
            user: ctx.state.userId,
            data: {
                mode: body.documentMode,
                type: body.documentType,
                pages: parseInt(body.pages, 10),
            },
        });

        const summary: DocumentSummary = {
            folderInternalId: body.folderInternalId,
            documentMode: body.documentMode,
            documentType: body.documentType,
            pages: parseInt(body.pages, 10),
            datetime: moment(body.datetime).valueOf(),
            name: body.name,
            notes: body.notes,
            user: ctx.state.userId,
        };

        await documentStorage.submitDocumentSummary(body.correlation, summary);

        ctx.response.status = 200;
        ctx.response.message = `OK`;

        function error(message: string, status = 400) {
            ctx.response.status = status;
            ctx.response.message = message;
        }
    }

    async function postSummaryV1V2(ctx: koa.Context) {
        if (ctx.request.type !== `multipart/form-data`) {
            return error('Not multipart/form-data');
        }
        const body = ctx.request.body;

        if (!body) {
            return error('No body in the request');
        }
        if (!body.correlation) {
            return error('No correlation in the request');
        }
        if (!body.patid) {
            return error('No patid in the request');
        }
        if (!body.mode) {
            return error('No mode in the request');
        }
        if (!body.type && body.type !== '') {
            return error('No type in the request');
        }
        if (!body.pages || !parseInt(body.pages, 10)) {
            return error('No pages in the request');
        }
        if (
            !body.datetime ||
            !moment(body.datetime, 'MM/DD/YYYY HH:mm').isValid()
        ) {
            return error('No datetime in the request');
        }

        metricsStorage.log({
            ts: new Date(),
            type: 'upload',
            version: ctx.request.path.includes('/v2/') ? 2 : 1,
            user: ctx.state.userId,
            data: {
                mode: body.mode,
                type: body.type,
                pages: parseInt(body.pages, 10),
            },
        });

        const summary: DocumentSummary = {
            folderInternalId: body.patid,
            documentMode: body.mode,
            documentType: body.type,
            pages: parseInt(body.pages, 10),
            datetime: moment(body.datetime, 'MM/DD/YYYY HH:mm').valueOf(),
            name: body.name,
            notes: body.notes,
            user: ctx.state.userId,
        };

        await documentStorage.submitDocumentSummary(body.correlation, summary);

        ctx.response.status = 200;
        ctx.response.message = `OK`;

        function error(message: string, status = 400) {
            ctx.response.status = status;
            ctx.response.message = message;
        }
    }
}
