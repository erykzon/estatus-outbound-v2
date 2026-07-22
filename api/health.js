import { redis } from "../lib/redis.js";

export default async function handler(req, res) {
  try {
    await redis.set("healthcheck", "OK");

    const value = await redis.get("healthcheck");

    return res.status(200).json({
      status: "OK",
      redis: value,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
}
