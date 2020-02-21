import { Server, FileStore, EVENTS } from 'tus-node-server';
import e2k from 'express-to-koa';
import { config } from "../../lib/config";

export function newTusUploader() {

  const tusServer = new Server();
  tusServer.datastore = new FileStore({
      directory: 'upload',
      path: `${config.ROUTER_PREFIX}/upload`,
  });

  tusServer.on(EVENTS.EVENT_UPLOAD_COMPLETE, (event: any) => {
      console.log(`Upload complete for file ${event.file.id}`);
  });

  const middleware = e2k(tusServer.handle.bind(tusServer));

  return {
      getMiddleware: () => middleware
  };
}