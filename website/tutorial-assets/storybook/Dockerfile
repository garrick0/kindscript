# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY apps/storybook/package.json ./apps/storybook/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/storybook ./apps/storybook
COPY packages/shared ./packages/shared

# Build the application
WORKDIR /app/apps/storybook
RUN pnpm build:components && pnpm build:storybook

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/storybook/storybook-static /usr/share/nginx/html
COPY --from=builder /app/apps/storybook/dist /usr/share/nginx/html/dist

# Copy nginx configuration
COPY apps/storybook/nginx.conf /etc/nginx/conf.d/default.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]