import { Authenticator } from "../types";

export function newNoopAuthenticator(): Authenticator {
    return {
        initialize: () => Promise.resolve(),
        authenticate: () => Promise.resolve(true),
    };
}
