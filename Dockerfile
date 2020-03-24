FROM node:12 AS builder

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm ci && \
    npm run-script build-ts && \
    rm -rf .src ts* test-results.xml src test types .travis.yml .gitignore .editorconfig

FROM node:12

COPY --from=builder /usr/src/app/out/src /usr/src/app/
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules/
WORKDIR /usr/src/app

ENV PORT 3000

CMD ["node", "index"]

