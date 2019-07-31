import { HEALTH_LEVEL_OK, MetricsStorage } from "../types";

export function newNoopMetricsStorage(): MetricsStorage {
    return {
        initialize: () => Promise.resolve(),
        log: () => void 0,
        getHealth: () => ({ level: HEALTH_LEVEL_OK, messages: [] }),
    };
}
