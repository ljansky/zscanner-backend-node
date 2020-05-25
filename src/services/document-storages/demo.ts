import * as fs from 'fs';
import * as util from 'util';

import { createLogger } from "../../lib/logging";
import { normalizeString } from "../../lib/utils";
import { DocumentFolder, DocumentStorage, DocumentSummary, DocumentType, HEALTH_LEVEL_OK, SuggestedDocumentFolder } from "../types";

const LOG = createLogger(__filename);

export function newDemoDocumentStorage(
    {
    }: {
    }): DocumentStorage {

    const stat = util.promisify(fs.lstat);

    return {
        initialize,
        findFolders,
        suggestFolders,
        getFolderByBarcode,
        getDocumentTypes,
        submitDocumentPage,
        submitLargeDocumentPage: submitDocumentPage,
        submitDocumentSummary,
        getHealth: () => ({ level: HEALTH_LEVEL_OK, messages: [] }),
    };

    async function initialize() {
        return void 0;
    }

    async function findFolders(query: string): Promise<DocumentFolder[]> {
        query = normalizeString(query);

        return DEMO_FOLDERS
            .filter((f) => normalizeString(f.externalId).indexOf(query) > -1
                                    || normalizeString(f.internalId).indexOf(query) > -1
                                    || normalizeString(f.name).indexOf(query) > -1);
    }

    async function suggestFolders(query: string): Promise<SuggestedDocumentFolder[]> {
        return (await findFolders(query)).map((folder, index) => ({
            ...folder,
            suggested: index < 2,
        }));
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
}

/**
 * This data is completely randomly generated.
 */
const DEMO_FOLDERS: DocumentFolder[] = [
    {
        externalId: '925221/9449',
        internalId: '124587112',
        name: 'Radana Macháčková',
    },
    {
        externalId: '011116/0632',
        internalId: '124587113',
        name: 'František Chadima',
    },
    {
        externalId: '995507/4789',
        internalId: '124587116',
        name: 'Aneta Šálková',
    },
    {
        externalId: '760623/6979',
        internalId: '124587154',
        name: 'Servác Skoumal',
    },
    {
        externalId: '841206/2483',
        internalId: '124587154',
        name: 'Petr Šmídek',
    },
    {
        externalId: '806007/3351',
        internalId: '124587199',
        name: 'Jiřina Hozová',
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
