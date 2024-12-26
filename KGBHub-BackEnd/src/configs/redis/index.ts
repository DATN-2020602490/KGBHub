import { REDIS_HOST, REDIS_PORT } from "../../util/global";
import { createClient } from "redis";

const redisClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
});
redisClient.on("connect", () => {
  "connect";
});
redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

export default redisClient;
