import { randomBytes } from 'crypto';
import request from 'supertest';

import { HttpError } from '../src/lib/utils';
import { TusUploaderEventHandler } from '../src/services/types';

import {
    newMockTusUploader,
    newTusUploadClient,
    withApplication,
} from './common';

describe('Uploader', () => {
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
        await withApplication(
            {
                uploader,
            },
            async (server) => {
                const uploadClient = newTusUploadClient(server);

                const createResponse = await uploadClient.create({
                    url,
                    data,
                    metadata: {
                        uploadType: 'test',
                        requiredData: 'some required data',
                    },
                });

                expect(createResponse.status).toEqual(201);

                const writeResponse = await uploadClient.write({
                    url,
                    createResponse,
                    data,
                });

                expect(writeResponse.status).toEqual(204);
                expect(uploadHandler).toHaveBeenCalled();
            }
        );
    });

    test('Check that validation is called before upload and upload does not start if validation fails', async () => {
        const uploader = newMockTusUploader();

        uploader.beforeUploadStart('test', validationHandler);

        await withApplication(
            {
                uploader,
            },
            async (server) => {
                const uploadClient = newTusUploadClient(server);

                const createResponse = await uploadClient.create({
                    url,
                    data,
                    metadata: {
                        uploadType: 'test',
                    },
                });

                expect(createResponse.status).toEqual(400);
            }
        );
    });

    test('Check that upload fails with 400 if there is no metadata', async () => {
        const uploader = newMockTusUploader();

        await withApplication(
            {
                uploader,
            },
            async (server) => {
                const createResponse = await request(server)
                    .post(url)
                    .set('Tus-Resumable', '1.0.0')
                    .set('Upload-Length', data.length.toString());

                expect(createResponse.status).toEqual(400);
            }
        );
    });

    test('Check that upload fails with 400 if there is no uploadType in metadata', async () => {
        const uploader = newMockTusUploader();

        await withApplication(
            {
                uploader,
            },
            async (server) => {
                const uploadClient = newTusUploadClient(server);

                const createResponse = await uploadClient.create({
                    url,
                    data,
                    metadata: {
                        anyData: 'any value',
                    },
                });

                expect(createResponse.status).toEqual(400);
            }
        );
    });
});
