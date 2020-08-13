# base image
FROM node:lts-alpine as base
WORKDIR /app
COPY package.json yarn.lock tsconfig.json ./

# install dependencies
FROM base AS dependencies
RUN yarn install --silent 

# build development image
FROM base AS development
COPY --from=dependencies /app/node_modules ./node_modules
CMD yarn start:watch

# build release image
FROM base AS release
COPY --from=dependencies /app/node_modules ./node_modules
COPY src ./src
COPY scripts ./scripts
RUN yarn build
RUN yarn initdb
CMD yarn start:prod