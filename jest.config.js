module.exports = {
    "collectCoverage": true,
    "collectCoverageFrom": [
        "src/**/*.ts",
        "!src/index.ts",
        "!src/services/document-storages/demo.ts",
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
