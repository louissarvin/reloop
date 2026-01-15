import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { ipfsRoutes } from "./routes/ipfs";
import { interestRoutes } from "./routes/interests";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.get("/", (c) => {
  return c.json({
    name: "ReLoop API",
    version: "1.0.0",
    status: "healthy",
  });
});

// Routes
app.route("/api/ipfs", ipfsRoutes);
app.route("/api/interests", interestRoutes);

// Start server
const port = process.env.PORT || 3001;
console.log(`🚀 ReLoop API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
