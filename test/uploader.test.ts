import { randomBytes } from 'crypto';
import { Server } from "http";
import request, { Response } from 'supertest';

import { HttpError } from '../src/lib/utils';
import { TusUploaderEventHandler, TusUploaderMetadata } from '../src/services/types';

import { newMockTusUploader, withApplication } from "./common";

const testTusUploadClient = (server: Server) => ({
    create: async ({ url, data, metadata }: { url: string; data: Buffer; metadata: TusUploaderMetadata }) => {
        const uploadMetadata = Object.keys(metadata).reduce<string[]>((acc, curr) => {
            return acc.concat(`${curr} ${Buffer.from(metadata[curr]).toString('base64')}`);
        }, []).join(',');

        return request(server)
            .post(url)
            .set('Tus-Resumable', '1.0.0')
            .set('Upload-Length', data.length.toString())
            .set('Upload-Metadata', uploadMetadata);
    },
    write: async ({ url, createResponse, data }: { url: string; createResponse: Response; data: Buffer; }) => {
        const fileId = createResponse.header.location.split('/').pop();
        return request(server)
            .patch(`${url}/${fileId}`)
            .set('Tus-Resumable', '1.0.0')
            .set('Upload-Offset', '0')
            .set('Content-Type', 'application/offset+octet-stream')
            .send(data);
    },
});

describe("Uploader", () => {
    const url = '/api-zscanner/upload';
    const data = randomBytes(256);
    const validationHandler: TusUploaderEventHandler = (metadata) => {
        if (!metadata.requiredData) {
            throw new HttpError('Missing value', 400);
        }
    };

    test(`Check that upload passes validation and handler is called after finished upload with uploadType in metadata`, async () => {
        const uploader = newMockTusUploader();
        const uploadHandler = jest.fn();
        uploader.onUploadComplete('test', uploadHandler);
        uploader.beforeUploadStart('test', validationHandler);
        await withApplication({
            uploader,
        }, async (server) => {
            const uploadClient = testTusUploadClient(server);

            const createResponse = await uploadClient.create({
                url,
                data,
                metadata: {
                    uploadType: 'test',
                    requiredData: 'some required data',
                },
            });

            expect(createResponse.status).toEqual(201);

            const writeResponse = await uploadClient.write({ url, createResponse, data });

            expect(writeResponse.status).toEqual(204);
            expect(uploadHandler).toHaveBeenCalled();
        });
    });

    test('Check that validation is called before upload and upload does not start if validation fails', async () => {
        const uploader = newMockTusUploader();

        uploader.beforeUploadStart('test', validationHandler);

        await withApplication({
            uploader,
        }, async (server) => {
            const uploadClient = testTusUploadClient(server);

            const createResponse = await uploadClient.create({
                url,
                data,
                metadata: {
                    uploadType: 'test',
                },
            });

            expect(createResponse.status).toEqual(400);
        });
    });

    test('Check that upload fails with 400 if there is no metadata', async () => {
        const uploader = newMockTusUploader();

        await withApplication({
            uploader,
        }, async (server) => {
            const createResponse = await request(server)
                .post(url)
                .set('Tus-Resumable', '1.0.0')
                .set('Upload-Length', data.length.toString());

            expect(createResponse.status).toEqual(400);
        });
    });

    test('Check that upload fails with 400 if there is no uploadType in metadata', async () => {
        const uploader = newMockTusUploader();

        await withApplication({
            uploader,
        }, async (server) => {
            const uploadClient = testTusUploadClient(server);

            const createResponse = await uploadClient.create({
                url,
                data,
                metadata: {
                    anyData: 'any value',
                },
            });

            expect(createResponse.status).toEqual(400);
        });
    });
});
