declare module 'tus-node-server' {
    import { EventEmitter } from 'events';
    interface TusEvent {
        file: {
            id: string;
            upload_length: string;
            upload_metadata: string;
        };
    }
    
    type OnEventCallback = (event: TusEvent) => void;

    export class Server extends EventEmitter {
        on(event: EVENTS, listener: OnEventCallback): this;
        handle: (req: any, res: any) => any;
        datastore: FileStore;
    }

    export class FileStore {
        constructor (options: any);
    }

    export enum EVENTS {
        EVENT_ENDPOINT_CREATED = "EVENT_ENDPOINT_CREATED",
        EVENT_FILE_CREATED = "EVENT_FILE_CREATED",
        EVENT_UPLOAD_COMPLETE = "EVENT_UPLOAD_COMPLETE"
    }
}


