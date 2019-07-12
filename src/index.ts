import { constructKoaApplication } from "./app";
import { config } from './lib/config';
import { createLogger } from "./lib/logging";
import { newNoopAuthenticator } from "./services/authenticators/noop";
import { newSeacatAuthenticator } from "./services/authenticators/seacat";
import { newDemoDocumentStorage } from "./services/document-storages/demo";
import { Authenticator, DocumentStorage } from "./services/types";

const LOG = createLogger(__filename);

start();

async function start() {
    const authenticator = constructAuthenticator();
    await authenticator.initialize();

    const documentStorage = constructDocumentStorage();
    await documentStorage.initialize();

    const app = constructKoaApplication({
        authenticator,
        documentStorage,
    });

    app.listen(config.PORT, () => LOG.info(`Listening on port ${config.PORT}...`));
}

function constructAuthenticator(): Authenticator {
    if (config.AUTHENTICATOR === 'seacat' 
        && config.VERIFY_CLIENT_TAG
        && config.SEACAT_ENDPOINT
        && config.SEACAT_USERNAME
        && config.SEACAT_PASSWORD) {
        return newSeacatAuthenticator({
            seacatEndpoint: config.SEACAT_ENDPOINT,
            seacatUsername: config.SEACAT_USERNAME,
            seacatPasword: config.SEACAT_PASSWORD,
        });
    }

    return newNoopAuthenticator();
}

function constructDocumentStorage(): DocumentStorage {
    return newDemoDocumentStorage({});
}
