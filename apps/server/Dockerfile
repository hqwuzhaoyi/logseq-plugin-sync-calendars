FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app
RUN npm install turbo --global
RUN turbo prune server --docker

FROM base AS prod-deps
COPY --from=base /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --shamefully-hoist

# FROM base AS build
# COPY --from=base /app/out/full/ .
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --shamefully-hoist
# RUN pnpm run build --filter=server

FROM node:20-slim AS production
WORKDIR /app
RUN corepack enable
COPY --from=prod-deps /app/node_modules ./node_modules
# COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=base /app/out/full/ .
COPY --from=base /app/out/pnpm-lock.yaml .
EXPOSE 3000
CMD [ "pnpm", "start" ]
