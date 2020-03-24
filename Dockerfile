FROM node:12 AS builder

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm ci && \
    npm run-script build-ts && \
    rm -rf .circleci .github .src ts* test-results.xml

