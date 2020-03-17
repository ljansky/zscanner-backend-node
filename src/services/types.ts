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
    submitDocumentPageLarge(correlationId: string, pageIndex: number, file: string, contentType: string): Promise<void>;
    submitDocumentSummary(correlationId: string, summary: DocumentSummary): Promise<void>;
}

export interface MetricsStorage extends HealthConscious {
    initialize(): Promise<void>;

    log(event: MetricsEvent): void;
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

export type MetricsEvent = DocumentSummaryUploadMetricsEvent | DocumentFolderQueryMetricsEvent | DocumentFolderDecodeMetricsEvent;

interface BaseMetricsEvent {
    ts: Date;
    type: string;
    version: number;
    data: any;
    user: string;
}

interface DocumentSummaryUploadMetricsEvent extends BaseMetricsEvent {
    type: 'upload';
    data: {
        mode: DocumentMode;
        type: string;
        pages: number;
    };
}

interface DocumentFolderQueryMetricsEvent extends BaseMetricsEvent {
    type: 'search';
    data: {
        query: string;
    };
}

interface DocumentFolderDecodeMetricsEvent extends BaseMetricsEvent {
    type: 'decode';
    data: {
        query: string;
    };
}

export interface Uploader {
    getMiddleware: () => koa.Middleware;
    onUploadComplete: (uploadType: string, handler: TusUploaderEventHandler) => void;
    beforeUploadStart: (uploadType: string, handler: TusUploaderEventHandler) => void;
}

export interface TusEvent {
    file: {
        id: string;
        upload_length: string;
        upload_metadata: string;
    };
}

export interface TusUploaderMetadata {
    [key: string]: string;
}

export type TusUploaderEventHandler = (metadata: TusUploaderMetadata) => void;
