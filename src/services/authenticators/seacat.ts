import * as koa from 'koa';
import * as rp from 'request-promise';

import { Authenticator } from "../types";

export function newSeacatAuthenticator(
    {
        seacatEndpoint,
        seacatUsername,
        seacatPasword,
    }: {
        seacatEndpoint: string,
        seacatUsername: string,
        seacatPasword: string,
    }): Authenticator {

    return {
        initialize,
        authenticate,
    };

    // tslint:disable-next-line: no-empty
    async function initialize() {
    }

    async function authenticate(ctx: koa.Context): Promise<boolean> {
        let clientTag = ctx.headers['x-sc-client-tag'];
        if (clientTag === undefined) {
            return authFail();
        }

        // seacat neposila v hlavicce hranate zavorky - nutno doplnit
        if (!((clientTag.includes("[") && clientTag.includes("]")))) {
            clientTag = `[${clientTag}]`;
        }

        const options = {
            uri: `${seacatEndpoint}${clientTag}`,
            headers: {
                'User-Agent': 'Request-Promise',
                'Cache-Control': 'max-age=60',
            },
            auth: {
                user: seacatUsername,
                pass: seacatPasword,
                json: true, // Automatically parses the JSON string in the response
            },
        };

        let res;
        try {
            res = await rp.get(options);
        } catch (err) {
            return authFail();
        }

        const user = JSON.parse(res);

        ctx.state.userId = user.userid;
        ctx.state.clientTag = clientTag;

        return true;

        function authFail() {
            ctx.status = 401;
            ctx.body = {
                error: "invalid-client-tag",
            };
            return false;
        }
    }
}
