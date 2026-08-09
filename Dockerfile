# check=skip=SecretsUsedInArgOrEnv
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments
ARG API_HOST
ARG DOMAIN
ARG TOKEN_KEY
ARG TOKEN_MAX_AGE=604800
ARG NODE_ENV=production
ARG PORT=8400

# Set as environment variables untuk build
ENV API_HOST=$API_HOST
ENV DOMAIN=$DOMAIN
ENV TOKEN_KEY=$TOKEN_KEY
ENV TOKEN_MAX_AGE=$TOKEN_MAX_AGE
ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT

# Copy package files first (untuk caching layer)
COPY package*.json ./

RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Environment variables untuk runtime
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=8500

# Copy only the built output
COPY --from=builder /app/.output ./.output

EXPOSE 8500

CMD ["node", ".output/server/index.mjs"]
