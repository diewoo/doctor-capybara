FROM node:22-alpine

WORKDIR /app

COPY bun.lockb ./

RUN bun install

COPY . .

EXPOSE 5173

# TODO: Add a command to run the frontend in production mode
CMD ["bun", "run", "dev"] 