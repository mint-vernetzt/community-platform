FROM node:19-alpine as build

WORKDIR /app

COPY .npmrc /app/
COPY package.json /app/
COPY package-lock.json /app/
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
