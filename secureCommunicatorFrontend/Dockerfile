FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Use the dev command for development with hot reload
CMD ["npm", "run", "dev"]
