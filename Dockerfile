FROM node:19-slim as build

RUN apt-get update -y && apt-get install -y openssl libssl-dev python3 make gcc g++ rsync

WORKDIR /app

RUN npm config set script-shell /bin/bash

COPY .npmrc /app/
COPY package.json /app/
COPY package-lock.json /app/
COPY common /app/common/
RUN npm install

COPY ./ /app/
RUN npx prisma generate
RUN npm run build

RUN npm prune --omit=dev

FROM node:19-alpine

WORKDIR /app

COPY package.json /app/
COPY package-lock.json /app/
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public

EXPOSE 3000

CMD ["npm", "run", "start"]
