module.exports = {
    "collectCoverage": true,
    "collectCoverageFrom": [
        "src/**/*.ts",
        "!src/index.ts",
        "!src/services/authenticators/noop.ts",
        "!src/services/document-storages/demo.ts",
        "!src/services/metrics-storages/noop.ts",
        "!**/node_modules/**",
        "!**/vendor/**",
    ],
    "roots": [
        "src",
        "test",
    ],
    "transform": {
        "^.+\\.tsx?$": "ts-jest",
    },
};
