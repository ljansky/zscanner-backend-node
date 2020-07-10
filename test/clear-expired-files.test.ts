import fs from 'fs';
import Mockdate from 'mockdate';
import moment from 'moment';
import tmp from 'tmp';

import { clearExpiredFiles } from '../src/lib/clear-expired-files';

describe('clearExpiredFiles', () => {
    test(`Check that clearExpiredFiles works`, async () => {
        const actualDate = moment();
        Mockdate.set(actualDate.toDate());

        const tmpDir = tmp.dirSync({ unsafeCleanup: true });
        tmp.fileSync({
            dir: tmpDir.name,
        });

        await clearExpiredFiles(tmpDir.name, 3000);
        const dirFilesBeforeExpiration = fs.readdirSync(tmpDir.name);
        expect(dirFilesBeforeExpiration.length).toBe(1);

        actualDate.add(5, 'seconds');
        Mockdate.set(actualDate.toDate());

        await clearExpiredFiles(tmpDir.name, 3000);

        const dirFilesAfterExpiration = fs.readdirSync(tmpDir.name);
        expect(dirFilesAfterExpiration.length).toBe(0);

        Mockdate.reset();
    });
});
