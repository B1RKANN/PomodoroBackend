FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --production

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
RUN chown -R node:node /app
USER node
EXPOSE 5000
CMD ["node", "dist/app.js"]
