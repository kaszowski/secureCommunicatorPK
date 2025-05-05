FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY knexfile.js ./
COPY migrations ./migrations
COPY seeds ./seeds
COPY certs ./certs

COPY . .

EXPOSE 5000

CMD [ "node", "server.js" ]