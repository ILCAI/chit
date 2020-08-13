# base image
FROM node:lts-alpine as base
WORKDIR /app
COPY package.json yarn.lock .env ./

# install dependencies
FROM base AS dependencies
RUN yarn install --silent 

# build development image
FROM base AS development
COPY --from=dependencies /app/node_modules ./node_modules
CMD yarn start