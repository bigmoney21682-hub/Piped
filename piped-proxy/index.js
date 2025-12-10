import express from "express";
import fetch from "node-fetch";

const app = express();

// Your upstream API
const API_BASE = "https://pipedapi.kavin.rocks";

// Allowed origins (can add multiple)
const ALLOWED_ORIGINS = ["https://bigmoney21682-hub.github.io", "*"];

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

// Enable parsing JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Proxy all requests to upstream
app.use(async (req, res) => {
  try {
    const url = new URL(req.url, API_BASE);
    const options = {
      method: req.method,
      headers: { ...req.headers },
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      options.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(url, options);

    // Copy headers from upstream except CORS headers
    upstream.headers.forEach((value, key) => {
      if (
        ![
          "access-control-allow-origin",
          "access-control-allow-methods",
          "access-control-allow-headers",
        ].includes(key.toLowerCase())
      ) {
        res.setHeader(key, value);
      }
    });

    const data = await upstream.arrayBuffer();
    res.status(upstream.status).send(Buffer.from(data));
  } catch (err) {
    console.error("Proxy error:", err);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
