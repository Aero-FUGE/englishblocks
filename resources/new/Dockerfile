FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install --package-lock=false --ignore-scripts --no-audit --no-fund
COPY . .
ARG VITE_CLOUD_URL=
ENV VITE_CLOUD_URL=$VITE_CLOUD_URL
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 CLOUD_DATA_DIR=/data
COPY package.json ./
RUN npm install --omit=dev --package-lock=false --ignore-scripts --no-audit --no-fund && mkdir /data && chown node:node /data
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY shared ./shared
USER node
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "server/start.cjs"]
