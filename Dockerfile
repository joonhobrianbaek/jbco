FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node runtime ./runtime
COPY --chown=node:node public ./public
RUN mkdir /data && chown node:node /data
USER node
ENV PORT=3000 OFFICE_DATA_DIR=/data
EXPOSE 3000
CMD ["node", "server.mjs"]
