import { Server } from "http";
import * as koa from "koa";

import { constructKoaApplication, newDemoDocumentStorage, newNoopAuthenticator } from "../src/app";
import { disableLogging } from "../src/lib/logging";
import { Authenticator, DocumentStorage } from "../src/services/types";

disableLogging();

export function newStaticAuthenticator() {
    return {
        ...newNoopAuthenticator(),
        async authenticate(context: koa.Context): Promise<boolean> {
            context.state.userId = "USER";
            return true;
        },
    };
}

export async function withApplication<T>(
    {
        authenticator,
        documentStorage,
        patcher,
        port,
    }: {
        authenticator?: Authenticator,
        documentStorage?: DocumentStorage,
        patcher?: (app: koa) => void,
        port?: number,
    },
    fn: (server: Server) => Promise<T>,
): Promise<T> {
    authenticator = authenticator || newNoopAuthenticator();
    documentStorage = documentStorage || newDemoDocumentStorage({});
    await authenticator.initialize();
    await documentStorage.initialize();
    const app = constructKoaApplication({
        authenticator,
        documentStorage,
    });
    if (patcher) {
        patcher(app);
    }
    const server = app.listen(port);
    try {
        return await fn(server);
    } finally {
        server.close();
    }
}
