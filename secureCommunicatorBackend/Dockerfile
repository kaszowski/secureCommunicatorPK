FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY knexfile.js ./
COPY database/migrations ./database/migrations
COPY database/seeds ./database/seeds
COPY certs ./certs

COPY . .

EXPOSE 5000

CMD [ "node", "server.js" ]