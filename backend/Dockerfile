FROM node:18-alpine

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "src/server.js"]


