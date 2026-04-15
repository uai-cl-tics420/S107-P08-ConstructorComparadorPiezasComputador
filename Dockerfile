FROM oven/bun:1

COPY package.json ./
COPY bun.lock ./
COPY src ./

RUN bun install

COPY . .
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]