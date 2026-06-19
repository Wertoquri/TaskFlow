FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p uploads/tasks uploads/avatars
EXPOSE 5000
CMD ["npm", "run", "start:with-migrate"]
