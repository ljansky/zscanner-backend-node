import { default as winston } from 'winston';

import { config } from './config';

const rootFilename = __dirname.replace(/\/lib$/, '');

export function createLogger(fileName: string) {
    fileName = fileName
        .replace(rootFilename, '')
        .replace(/\.(ts|js)$/, '');
    return globalLogger.child({ fileName });
}

const globalLogger = constructLogger();

function constructLogger() {
    return winston.createLogger({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS' }),
            winston.format.align(),
            winston.format.printf((info) => `${info.timestamp} ${align(info.fileName, 20)} ${info.level} ${info.message}`),
        ),
        transports: [
            new winston.transports.Console(),
        ],
        defaultMeta: {
            service: 'zscanner-backend',
        },
        level: config.DEBUG_LEVEL,
    });
}

const SPACES = new Array(1000).fill(' ').join('');

function align(s: string, len: number) {
    return !s
        ? SPACES.substr(0, len)
        : s.length < len ? s + SPACES.substr(0, len - s.length)
            : s.length === len ? s
                : s.substr(-len);
}
