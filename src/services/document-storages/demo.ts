import * as fs from 'fs';
import * as util from 'util';

import { createLogger } from "../../lib/logging";
import { normalizeString } from "../../lib/utils";
import { DocumentFolder, DocumentStorage, DocumentSummary, DocumentType, FolderDefect, FoundDocumentFolder, HEALTH_LEVEL_OK, PageUploadInfo, PageWithDefectUploadInfo } from "../types";

const LOG = createLogger(__filename);

export function newDemoDocumentStorage(
    {
    }: {
    }): DocumentStorage {

    const stat = util.promisify(fs.lstat);

    return {
        initialize,
        findFolders,
        getFolderByBarcode,
        getDocumentTypes,
        submitDocumentPage,
        submitLargeDocumentPage,
        submitLargeDocumentPageWithDefect,
        submitDocumentSummary,
        getDefectsByFolderId,
        getHealth: () => ({ level: HEALTH_LEVEL_OK, messages: [] }),
    };

    async function initialize() {
        return void 0;
    }

    async function findFolders(query: string): Promise<FoundDocumentFolder[]> {
        query = normalizeString(query);

        return DEMO_FOLDERS
            .filter((f) => normalizeString(f.externalId).indexOf(query) > -1
                                    || normalizeString(f.internalId).indexOf(query) > -1
                                    || normalizeString(f.name).indexOf(query) > -1);
    }

    async function getFolderByBarcode(folderBarcode: string): Promise<DocumentFolder | undefined> {
        return DEMO_FOLDERS.find((f) => f.internalId === folderBarcode);
    }

    async function getDocumentTypes(): Promise<DocumentType[]> {
        return DEMO_DOCUMENT_TYPES;
    }

    async function submitDocumentSummary(correlationId: string, summary: DocumentSummary): Promise<void> {
        LOG.info(`Summary posted: correlationId: ${correlationId} summary: ${JSON.stringify(summary)}`);
    }

    async function submitDocumentPage(correlationId: string, pageIndex: number, file: string): Promise<void> {
        const s = await stat(file);
        LOG.info(`Document posted: correlationId: ${correlationId} page: ${pageIndex} contents: in ${file} (${s.size} bytes)`);
    }

    async function submitLargeDocumentPage(correlationId: string, pageIndex: number, { filePath }: PageUploadInfo): Promise<void> {
        const s = await stat(filePath);
        LOG.info(`Document posted: correlationId: ${correlationId} page: ${pageIndex} contents: in ${filePath} (${s.size} bytes)`);
    }

    async function submitLargeDocumentPageWithDefect(correlationId: string, pageIndex: number, { filePath, defect }: PageWithDefectUploadInfo): Promise<void> {
        const s = await stat(filePath);
        LOG.info(`Document posted: correlationId: ${correlationId} page: ${pageIndex} contents: in ${filePath} (${s.size} bytes)`);
        if (defect) {
            LOG.info(`Defect posted: correlationId: ${correlationId} page: ${pageIndex} defectId: ${defect.id} name: ${defect.name} bodyPartId: ${defect.bodyPartId}`);
        }
    }

    async function getDefectsByFolderId(folderId: string): Promise<FolderDefect[] | undefined> {
        const result = DEMO_FOLDER_DEFECTS.find((f) => f.folderId === folderId);
        return result ? result.defects : undefined;
    }
}

/**
 * This data is completely randomly generated.
 */
const DEMO_FOLDERS: FoundDocumentFolder[] = [
    {
        externalId: '925221/9449',
        internalId: '124587112',
        name: 'Radana Macháčková',
        type: 'suggestedResult',
    },
    {
        externalId: '011116/0632',
        internalId: '124587113',
        name: 'František Chadima',
        type: 'suggestedResult',
    },
    {
        externalId: '995507/4789',
        internalId: '124587116',
        name: 'Aneta Šálková',
        type: 'searchResult',
    },
    {
        externalId: '760623/6979',
        internalId: '124587154',
        name: 'Servác Skoumal',
        type: 'searchResult',
    },
    {
        externalId: '841206/2483',
        internalId: '124587154',
        name: 'Petr Šmídek',
        type: 'searchResult',
    },
    {
        externalId: '806007/3351',
        internalId: '124587199',
        name: 'Jiřina Hozová',
        type: 'searchResult',
    },
];

// JS:NOTE: No entry can have DocumentMode = 'foto', the Android FrontEnd crashes
export const DEMO_DOCUMENT_TYPES: DocumentType[] = [
    {
        mode: 'doc',
        display: 'Rodný list',
        type: 'birthcertificate',
    },
    {
        mode: 'doc',
        display: 'Občanský průkaz',
        type: 'nationalid',
    },
    {
        mode: 'doc',
        display: 'Pas',
        type: 'passport',
    },
    {
        mode: 'doc',
        display: 'Kartička pojišťovny',
        type: 'insuranceid',
    },
    {
        mode: 'exam',
        display: 'Výsledky analýzy krve',
        type: 'blood-results',
    },
    {
        mode: 'exam',
        display: 'Výsledky RTG vyšetření',
        type: 'rtg-results',
    },
    {
        mode: 'exam',
        display: 'Výsledky sonografického vyšetření',
        type: 'sono-results',
    },
];

interface DemoFolderDefects {
    folderId: string;
    defects: FolderDefect[];
}

export const DEMO_FOLDER_DEFECTS: DemoFolderDefects[] = [
    {
        folderId: '124587112',
        defects: [
            {
                id: 'defect1',
                bodyPartId: 'rightEye',
                name: 'Name of defect 1',
            },
            {
                id: 'defect2',
                bodyPartId: 'finger',
                name: 'Name of defect 2',
            },
        ],
    },
    {
        folderId: '124587113',
        defects: [
            {
                id: 'defect3',
                bodyPartId: 'leftEye',
                name: 'Name of defect 3',
            },
        ],
    },
];
