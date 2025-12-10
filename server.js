import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

// Allow CORS so frontend can fetch
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Serve frontend
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "dist")));

// Forward API requests to a real Piped instance
const API_BASE = "https://piped-instances.kavin.rocks"; // public Piped instance

app.use("/api", async (req, res) => {
  const url = API_BASE + req.originalUrl.replace(/^\/api/, "");
  try {
    const response = await fetch(url, {
      method: req.method,
      headers: { ...req.headers, host: undefined },
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });
    const data = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(data));
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Proxy failed" });
  }
});

// Fallback for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
