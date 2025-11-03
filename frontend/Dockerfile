FROM node:18-alpine AS builder

ARG APP_API_URL
ARG APP_SOCKET_URL

ENV APP_API_URL=$APP_API_URL
ENV APP_SOCKET_URL=$APP_SOCKET_URL

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

RUN chown -R nodejs:nodejs /app
USER nodejs

RUN npm run build

FROM nginx:alpine

RUN apk add --no-cache dumb-init

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

COPY scripts/generate-config.sh /generate-config.sh
RUN chmod +x /generate-config.sh

EXPOSE 80

ENTRYPOINT ["/generate-config.sh"]
CMD ["dumb-init", "--", "nginx", "-g", "daemon off;"]