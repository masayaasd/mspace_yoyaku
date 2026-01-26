# ----- 1. Build Staff Admin App -----
FROM node:20-slim AS admin-builder
WORKDIR /app/admin-app
COPY admin-app/package*.json ./
RUN npm install
COPY admin-app/ ./
ARG VITE_API_BASE=""
RUN VITE_API_BASE=$VITE_API_BASE npm run build

# ----- 2. Build LIFF Customer App -----
FROM node:20-slim AS liff-builder
WORKDIR /app/liff-app
COPY liff-app/package*.json ./
RUN npm install
COPY liff-app/ ./
ARG VITE_API_BASE=""
ARG VITE_LIFF_ID=""
RUN VITE_API_BASE=$VITE_API_BASE VITE_LIFF_ID=$VITE_LIFF_ID npm run build

# ----- 3. Build & Run Backend -----
FROM node:20-slim
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source and config
COPY . .

# Copy built frontend assets from builder stages
COPY --from=admin-builder /app/admin-app/dist ./admin-app/dist
COPY --from=liff-builder /app/liff-app/dist ./liff-app/dist

# Prisma generation
RUN npx prisma generate

# Final setup
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Command to run the application
CMD ["npx", "tsx", "src/index.ts"]
