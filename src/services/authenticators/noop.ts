import { Authenticator, HEALTH_LEVEL_OK } from "../types";

export function newNoopAuthenticator(): Authenticator {
    return {
        initialize: () => Promise.resolve(),
        authenticate: () => Promise.resolve(true),
        getHealth: () => ({ level: HEALTH_LEVEL_OK, messages: [] }),
    };
}
