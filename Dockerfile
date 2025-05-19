FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./

RUN npm install --frozen-lockfile --ignore-scripts
COPY . .
RUN npm run build


FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev --ignore-scripts

EXPOSE 8080
CMD ["node", "src/index.js"]