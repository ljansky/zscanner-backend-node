import * as fs from 'fs';
import * as util from 'util';

import { createLogger } from "../../lib/logging";
import { normalizeString } from "../../lib/utils";
import { DocumentFolder, DocumentStorage, DocumentSummary, DocumentType } from "../types";

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
        submitDocumentSummary,
    };

    async function initialize() {
        return void 0;
    }

    async function findFolders(query: string): Promise<DocumentFolder[]> {
        query = normalizeString(query);

        return DEMO_FOLDERS
            .filter((f) => normalizeString(f.bid).indexOf(query) > -1
                                    || normalizeString(f.zid).indexOf(query) > -1
                                    || normalizeString(f.name).indexOf(query) > -1);
    }

    async function getFolderByBarcode(folderBarcode: string): Promise<DocumentFolder | undefined> {
        return DEMO_FOLDERS.find((f) => f.zid === folderBarcode);
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
        bid: '925221/9449',
        zid: '124587112',
        name: 'Radana Macháčková',
    },
    {
        bid: '011116/0632',
        zid: '124587113',
        name: 'František Chadima',
    },
    {
        bid: '995507/4789',
        zid: '124587116',
        name: 'Aneta Šálková',
    },
    {
        bid: '760623/6979',
        zid: '124587154',
        name: 'Servác Skoumal',
    },
    {
        bid: '841206/2483',
        zid: '124587154',
        name: 'Petr Šmídek',
    },
    {
        bid: '806007/3351',
        zid: '124587199',
        name: 'Jiřina Hozová',
    },
];

// JS:NOTE: No entry can have DocumentMode = 'foto', the Android FrontEnd crashes
const DEMO_DOCUMENT_TYPES: DocumentType[] = [
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
