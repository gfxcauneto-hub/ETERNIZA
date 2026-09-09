FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm check && pnpm test && pnpm build && pnpm prune --prod

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system nodeapp && useradd --system --gid nodeapp nodeapp
COPY --from=build --chown=nodeapp:nodeapp /app/package.json ./package.json
COPY --from=build --chown=nodeapp:nodeapp /app/node_modules ./node_modules
COPY --from=build --chown=nodeapp:nodeapp /app/dist ./dist
USER nodeapp
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
