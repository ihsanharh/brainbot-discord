# transpiling typescript to javascript first
FROM node:20.11-alpine AS transpile

WORKDIR /app

COPY . .

RUN npm install --include=dev
RUN npm run build

# stage 2 running the server in production
FROM node:20.11-alpine

RUN adduser -D runner

WORKDIR /home/runner/server

COPY --from=transpile /app/dist ./dist
COPY ./package.json ./

RUN npm install --omit=dev

EXPOSE 4094

CMD ["npm", "start"]