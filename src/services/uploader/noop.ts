import { Uploader } from "../types";

export function newNoopUploader(): Uploader {
    return {
        getMiddleware: () => async (ctx, next) => {
            await next();
        },
        onUploadComplete: () => void 0,
    };
}
