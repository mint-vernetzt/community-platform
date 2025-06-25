FROM node:23.11.1 AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm install
RUN npm run copy:fonts

FROM node:23.11.1 AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm install --omit=dev

FROM node:23.11.1 AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:23.11.1
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app

CMD ["npm", "run", "start"]
