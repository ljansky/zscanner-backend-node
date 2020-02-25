import e2k from 'express-to-koa';
import { EVENTS, FileStore, Server } from 'tus-node-server';

import { config } from "../../lib/config";
import { TusEvent, TusUploaderEventHandler } from '../types';

interface TusUploaderEventHandlers {
    [uploadType: string]: TusUploaderEventHandler;
}

export function newTusUploader() {

  const tusServer = new Server();
  tusServer.datastore = new FileStore({
      directory: 'upload',
      path: `${config.ROUTER_PREFIX}/upload`,
  });

  const handlers: TusUploaderEventHandlers = {};

  tusServer.on(EVENTS.EVENT_UPLOAD_COMPLETE, (event: TusEvent) => {
      const metadata = event.file.upload_metadata
        .split(',')
        .map((m: string) => {
          const [name, encodedValue] = m.split(' ');
          return {
            name,
            value: Buffer.from(encodedValue, 'base64').toString(),
          };
        });

      const uploadType = metadata.find((m) => m.name === 'uploadType');
      if (uploadType && handlers[uploadType.value]) {
        handlers[uploadType.value](metadata);
      }
  });

  const middleware = e2k(tusServer.handle.bind(tusServer));

  return {
      getMiddleware: () => middleware,
      onUploadComplete: (uploadType: string, handler: any) => {
        handlers[uploadType] = handler;
      },
  };
}
