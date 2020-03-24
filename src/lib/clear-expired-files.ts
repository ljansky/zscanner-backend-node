import { promises as fs } from 'fs';
import path from 'path';

export async function clearExpiredFiles(directory: string, expirationTime: number) {
    const files = await fs.readdir(directory);
    const promises = [];
    for (const file of files) {
        const filePath = path.join(directory, file);
        const filePromise = fs.stat(filePath)
            .then((stat) => {
                const absoluteExpirationTime = new Date(stat.ctime).getTime() + expirationTime;
                if (absoluteExpirationTime < Date.now()) {
                    return fs.unlink(filePath);
                }
            });
        promises.push(filePromise);
    }

    return Promise.all(promises);
}
