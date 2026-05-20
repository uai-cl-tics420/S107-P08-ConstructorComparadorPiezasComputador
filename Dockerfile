FROM oven/bun:1

WORKDIR /app

COPY package.json ./
COPY bun.lock ./

RUN bun install

COPY . .
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]