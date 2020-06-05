import { constructKoaApplication, MetricsStorage } from "./app";
import { config } from './lib/config';
import { createLogger } from "./lib/logging";
import { newNoopAuthenticator } from "./services/authenticators/noop";
import { newSeacatAuthenticator } from "./services/authenticators/seacat";
import { newDemoBodyPartsStorage } from './services/body-parts-storages/demo';
import { newDemoDocumentStorage } from "./services/document-storages/demo";
import { newNoopMetricsStorage } from "./services/metrics-storages/noop";
import { Authenticator, BodyPartsStorage, DocumentStorage, Uploader } from "./services/types";
import { newTusStore, newTusUploader } from "./services/uploader/tus-uploader";

const LOG = createLogger(__filename);

process.on("unhandledRejection", (error: any, promise: Promise<any>) => {
    LOG.error(`Unhandled Rejection: ${error} ${error.stack}`);
    throw error;
});

start();

async function start() {
    const authenticator = constructAuthenticator();
    await authenticator.initialize();

    const documentStorage = constructDocumentStorage();
    await documentStorage.initialize();

    const bodyPartsStorage = constructBodyPartsStorage();
    await bodyPartsStorage.initialize();

    const metricsStorage = constructMetricsStorage();
    await metricsStorage.initialize();

    const uploader = constructUploader();

    const app = constructKoaApplication({
        authenticator,
        documentStorage,
        metricsStorage,
        uploader,
        bodyPartsStorage,
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

function constructBodyPartsStorage(): BodyPartsStorage {
    return newDemoBodyPartsStorage({});
}

function constructMetricsStorage(): MetricsStorage {
    return newNoopMetricsStorage();
}

function constructUploader(): Uploader {
    return newTusUploader({
        store: newTusStore({
            path: '/upload',
            directory: config.UPLOADER_DIRECTORY,
        }),
    });
}
