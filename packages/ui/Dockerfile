# Build stage
FROM node:20.6.0-alpine AS builder

WORKDIR /app

# Set environment variables for build
# We can do this because this docker image is just so people
# can quickly use the app locally. If they are actually deploying
# to a server, they need to build the image themselves with the
# correct client url and server url.
ENV VITE_CLIENT_URL=http://localhost:5173
ENV VITE_SERVER_URL=http://localhost:9094

# Copy workspace configuration and root config files
COPY package.json pnpm-lock.yaml ./
COPY nx.json tsconfig.base.json ./
COPY jest.preset.js eslint.config.js ./
COPY packages/ui ./packages/ui

# Install pnpm and other global dependencies
RUN npm install -g pnpm nx


ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
ENV NODE_AUTH_TOKEN=${NPM_TOKEN}
# Install dependencies
RUN pnpm install --frozen-lockfile 

# Build UI
RUN pnpm exec nx run ui:build --verbose

# Production stage
FROM nginx:alpine

# Copy built static files to nginx serve directory
COPY --from=builder /app/dist/packages/ui /usr/share/nginx/html

# Copy nginx config if you have custom configuration
COPY packages/ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]