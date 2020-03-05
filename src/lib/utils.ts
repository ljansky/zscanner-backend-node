import * as koa from "koa";
import * as winston from "winston";

export type KoaNextFunction = () => Promise<void>;

export function wrapRouteWithErrorHandler(LOG: winston.Logger, handler: (ctx: koa.Context) => Promise<void>) {
    return async (ctx: koa.Context) => {
        try {
            await handler(ctx);
        } catch (err) {
            ctx.response.status = 500;
            ctx.response.message = 'Error: ' + err;
            LOG.info(`Error ${err} processing ${ctx.method} ${ctx.url}`, { error: err });
        }
    };
}

export type RecursivePartial<T> = {
    [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
        T[P] extends object ?
            T[P] extends Buffer ? T[P]
                : RecursivePartial<T[P]> :
            T[P];
};

export function normalizeString(s: any) {
    if (s === null || s === undefined) {
        return '';
    }

    if (typeof s !== 'string') {
        s = '' + s;
    }

    s = s.toLowerCase();
    s = s.replace(/\s+/g, ' ');
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s;
}

export function max<T>(i: T, j: T): T {
    return i > j ? i : j;
}

export async function time<T>(fn: () => Promise<T>): Promise<[T, number]> {
    const startTs = process.hrtime();
    const result = await fn();
    const elapsed = process.hrtime(startTs);
    const ms = (elapsed[0] * 1000000 + elapsed[1] / 1000) / 1000.0;

    return [result, ms];
}

export class HttpError extends Error {
    public status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}
