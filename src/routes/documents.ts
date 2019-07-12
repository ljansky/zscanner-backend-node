import * as koa from 'koa';
import { default as KoaRouter } from 'koa-router';

import { createLogger } from "../lib/logging";
import { wrapRouteWithErrorHandler } from "../lib/utils";
import { DocumentStorage, DocumentSummary } from "../services/types";

const LOG = createLogger(__filename);

export function newDocumentsRouter(
    {
      documentStorage,
    }: {
      documentStorage: DocumentStorage,
    }) {

  const router = new KoaRouter();

  router.prefix('/api-zscanner');

  router.post('/v1/documents/page', wrapRouteWithErrorHandler(LOG, postPage));
  router.post('/v1/documents/summary', wrapRouteWithErrorHandler(LOG, postSummary));

  router.post('/v2/documents/page', wrapRouteWithErrorHandler(LOG, postPage));
  router.post('/v2/documents/summary', wrapRouteWithErrorHandler(LOG, postSummary));

  async function postPage(ctx: koa.Context) {
    // chect request type is multipart/form-data
    if (ctx.request.type !== `multipart/form-data`) {
      ctx.response.status = 400;
      ctx.response.message = 'Not multipart/form-data';
      return;
    }

    // check file attached to multipart post request
    if (!((ctx.request as any).files.page)) {
      ctx.response.status = 400;
      ctx.response.message = 'No page in request';
      return;
    }

    // check reqired post fields
    if (!(ctx.request.body.page) || !(ctx.request.body.correlation)) {
      ctx.response.status = 400;
      ctx.response.message = 'Required fields missing';
      return;
    }

    const pageIndex = parseInt(ctx.request.body.page, 10);
    const filePath = (ctx.request as any).files.page.path;

    await documentStorage.submitDocumentPage(ctx.request.body.correlation, pageIndex, filePath);

    ctx.response.status = 200;
    ctx.response.message = `OK`;
  }

  async function postSummary(ctx: koa.Context) {
    // chect request type is multipart/form-data
    if (ctx.request.type !== `multipart/form-data`) {
      ctx.response.status = 400;
      ctx.response.message = 'Not multipart/form-data';
      return;
    }
    // check reqired post fields
    if (!(ctx.request.body.correlation)  // correleation must not be empty
        || (ctx.request.body.datetime === undefined)
        || (ctx.request.body.pages === undefined)
        || (ctx.request.body.patid === undefined)
        || (ctx.request.body.type === undefined)
        || (ctx.request.body.mode === undefined)) {
      ctx.response.status = 400;
      ctx.response.message = `Required fields missing`;
      return;
    }

    const summaryMessageBody: DocumentSummary = {
      patid: ctx.request.body.patid,
      mode: ctx.request.body.mode,
      type: ctx.request.body.type,
      pages: ctx.request.body.pages,
      datetime: ctx.request.body.datetime,
      name: ctx.request.body.name,
      notes: ctx.request.body.notes,
      user: ctx.state.userId,
    };

    await documentStorage.submitDocumentSummary(ctx.request.body.correlation, summaryMessageBody);

    ctx.response.status = 200;
    ctx.response.message = `OK`;
  }

  return router;
}
