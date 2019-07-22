import * as koa from 'koa';

export const HEALTH_LEVEL_OK = 0;
export const HEALTH_LEVEL_WARNING = 1;
export const HEALTH_LEVEL_ERROR = 2;

export interface HealthReport {
    level: number;
    messages: string[];
}

export interface HealthConscious {
    getHealth(): HealthReport;
}

export interface Authenticator extends HealthConscious {
    initialize(): Promise<void>;

    authenticate(context: koa.Context): Promise<boolean>;
}

export interface DocumentStorage extends HealthConscious {
    initialize(): Promise<void>;

    findFolders(query: string): Promise<DocumentFolder[]>;
    getFolderByBarcode(folderBarcode: string): Promise<DocumentFolder | undefined>;

    getDocumentTypes(): Promise<DocumentType[]>;

    submitDocumentPage(correlationId: string, pageIndex: number, file: string): Promise<void>;
    submitDocumentSummary(correlationId: string, summary: DocumentSummary): Promise<void>;
}

export interface DocumentFolder {
    externalId: string;
    internalId: string;
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
    folderInternalId: string;
    documentMode: DocumentMode;
    documentType: string;
    pages: number;
    datetime: number;
    name: string;
    notes: string;
    user: string;
}

export interface PatientDocumentSummary {
    patid: string;
    mode: DocumentMode;
    type: string;
    pages: string;
    datetime: string; // MM/DD/YYYY HH:MM
    name: string;
    notes: string;
    user: string;
}
