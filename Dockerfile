# Build in Google Cloud, with the repository root as the build context.
FROM node:24-bookworm-slim AS build
WORKDIR /workspace
RUN npm install --global pnpm@10.26.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json .npmrc ./
COPY lib ./lib
COPY artifacts/api-server ./artifacts/api-server
RUN pnpm --filter @workspace/api-server... install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

# esbuild bundles the runtime dependencies and shared workspace libraries.
# Copy the whole output: Pino also emits worker files alongside index.mjs.
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /workspace/artifacts/api-server/dist ./dist
USER node
EXPOSE 8080
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
