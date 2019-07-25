import { Server } from "http";

import { constructKoaApplication, newDemoDocumentStorage, newNoopAuthenticator } from "../src/app";
import { disableLogging } from "../src/lib/logging";
import { Authenticator, DocumentStorage } from "../src/services/types";

disableLogging();

export async function withApplication<T>(
    {
        authenticator,
        documentStorage,
    }: {
        authenticator?: Authenticator,
        documentStorage?: DocumentStorage,
    },
    fn: (server: Server) => Promise<T>,
): Promise<T> {
    const app = constructKoaApplication({
        authenticator: authenticator || newNoopAuthenticator(),
        documentStorage: documentStorage || newDemoDocumentStorage({}),
    });
    const server = app.listen();
    try {
        return await fn(server);
    } finally {
        server.close();
    }
}
