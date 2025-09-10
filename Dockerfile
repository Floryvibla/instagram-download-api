FROM node:18.14.2-alpine
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
RUN yarn
RUN yarn cache clean --all
COPY . .
ENV PORT 3333
EXPOSE 3333
CMD ["node", "index.js"]