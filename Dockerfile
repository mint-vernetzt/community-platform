
FROM node:23.11.1 AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm install

FROM node:23.11.1 AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm install --omit=dev
COPY ./prisma ./prisma
RUN npx prisma generate

FROM node:23.11.1 AS build-env
ARG TRIGGER_SENTRY_RELEASE
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN if [ "$TRIGGER_SENTRY_RELEASE" = "true" ]; then npm run build:release; else npm run build; fi

FROM node:23.11.1
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/mail-templates /app/mail-templates
WORKDIR /app

CMD ["npm", "run", "start"]
