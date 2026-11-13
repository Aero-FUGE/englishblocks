ARG BASE_IMAGE
FROM ${BASE_IMAGE}
WORKDIR /app
COPY dist/ ./dist/
COPY server/ ./server/
COPY shared/ ./shared/
COPY VERSION.json ./DEPLOYED_VERSION.json
ARG RELEASE_VERSION
LABEL io.englishblocks.release=$RELEASE_VERSION
ENV NODE_ENV=production PORT=3000 CLOUD_DATA_DIR=/data
USER node
EXPOSE 3000
CMD ["node", "server/start.cjs"]
