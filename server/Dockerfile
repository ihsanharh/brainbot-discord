# transpiling typescript to javascript first
FROM node:20.11-alpine AS transpile

WORKDIR /app

COPY . .

RUN npm install --include=dev
RUN npm run build

# stage 2 running the server in production
FROM node:20.11-alpine AS prod

WORKDIR /app

COPY --from=transpile /app/dist ./dist
COPY ./package.json ./

RUN npm install --omit=dev

EXPOSE 4094

CMD ["npm", "start"]