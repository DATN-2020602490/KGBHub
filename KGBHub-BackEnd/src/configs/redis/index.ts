import { REDIS_HOST, REDIS_PORT } from "../../util/global";
import { createClient } from "redis";

const redisClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
});
redisClient.on("connect", () => {
  console.log("Connected to Redis");
});
redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

export default redisClient;
