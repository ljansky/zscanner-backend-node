import * as koa from 'koa';

export interface Authenticator {
    initialize(): Promise<void>;

    authenticate(context: koa.Context): Promise<boolean>;
}

export interface DocumentStorage {
    initialize(): Promise<void>;

    findFolders(query: string): Promise<DocumentFolder[]>;
    getFolderByBarcode(folderBarcode: string): Promise<DocumentFolder | undefined>;

    getDocumentTypes(): Promise<DocumentType[]>;

    submitDocumentPage(correlationId: string, pageIndex: number, file: string): Promise<void>;
    submitDocumentSummary(correlationId: string, summary: DocumentSummary): Promise<void>;
}

export interface DocumentFolder {
    bid: string;
    zid: string;
    name: string;
}

export interface Patient {
    bid: string;
    zid: string;
    name: string;
}

export type DocumentMode = 'foto' | 'exam' | 'doc';

export interface DocumentType {
    type: string;
    mode: DocumentMode;
    display: string;
}

export interface DocumentSummary {
    patid: string;
    mode: DocumentMode;
    type: string;
    pages: string;
    datetime: string; // MM/DD/YYYY HH:MM
    name: string;
    notes: string;
    user: string;
}
