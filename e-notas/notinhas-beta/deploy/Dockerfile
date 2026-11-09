# API — multi-stage, non-root, JS compilado (Red Hat Node RA / docker-node BestPractices)
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci --workspace @notinhas/api --include-workspace-root && npm run build -w @notinhas/api

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/migrations ./migrations
COPY apps/api/package.json ./package.json
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund \
      cheerio cookie-parser express express-rate-limit helmet jose nodemailer pg pino pino-http zod \
  && npm cache clean --force
USER node
EXPOSE 4174
CMD ["node", "dist/main.js"]
