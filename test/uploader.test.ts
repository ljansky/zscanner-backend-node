import { randomBytes } from 'crypto';
import { Server } from "http";
import request = require('supertest');

import { TusUploaderMetadata } from '../src/services/types';
import { newTusUploader } from "../src/services/uploader/tus-uploader";

import { withApplication } from "./common";

const testTusUploadClient = (server: Server) => ({
    create: async ({ url, data, metadata }: { url: string; data: Buffer; metadata: TusUploaderMetadata }) => {
        const uploadMetadata = Object.keys(metadata).reduce<string[]>((acc, curr) => {
            return acc.concat(`${curr} ${Buffer.from(metadata[curr]).toString('base64')}`);
        }, []).join(',');
        const createResponse = await request(server)
            .post(url)
            .set('Tus-Resumable', '1.0.0')
            .set('Upload-Length', data.length.toString())
            .set('Upload-Metadata', uploadMetadata);

        expect(createResponse.status).toEqual(201);
        const fileId = createResponse.header.location.split('/').pop();

        return async () => {
            const writeResponse = await request(server)
                .patch(`${url}/${fileId}`)
                .set('Tus-Resumable', '1.0.0')
                .set('Upload-Offset', '0')
                .set('Content-Type', 'application/offset+octet-stream')
                .send(data);
            expect(writeResponse.status).toEqual(204);
        };
    },
});

describe("Uploader", () => {
    test(`Check that upload handler is called after finished upload with uploadType in metadata`, async () => {
        const uploader = newTusUploader();
        const uploadHandler = jest.fn();
        uploader.onUploadComplete('test', uploadHandler);
        await withApplication({
            uploader,
        }, async (server) => {
            const uploadClient = testTusUploadClient(server);
            const binaryFile = randomBytes(256);

            const write = await uploadClient.create({
                url: '/api-zscanner/upload',
                data: binaryFile,
                metadata: {
                    uploadType: 'test',
                },
            });

            await write();

            expect(uploadHandler).toHaveBeenCalled();
        });
    });
});
