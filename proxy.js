import http from "http";
import fetch from "node-fetch";

const API_BASE = "https://piped-wstu.onrender.com"; // your instance

const PORT = process.env.PORT || 10000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function sendCORS(res, status = 200, extraHeaders = {}) {
  res.writeHead(status, { ...CORS_HEADERS, ...extraHeaders });
  res.end();
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") return sendCORS(res, 204);

  let targetUrl;
  try {
    const url = new URL(req.url, "http://localhost");
    targetUrl = API_BASE + url.pathname + url.search;
  } catch {
    return sendCORS(res, 400);
  }

  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (k.toLowerCase() !== "host") headers[k] = v;
  }

  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  try {
    const upstream = await fetch(targetUrl, { method: req.method, headers, body });
    const responseBody = Buffer.from(await upstream.arrayBuffer());

    const cleanHeaders = {};
    upstream.headers.forEach((value, key) => {
      if (!["access-control-allow-origin","access-control-allow-headers","access-control-allow-methods"].includes(key.toLowerCase())) {
        cleanHeaders[key] = value;
      }
    });

    res.writeHead(upstream.status, { ...cleanHeaders, ...CORS_HEADERS });
    res.end(responseBody);

  } catch (e) {
    console.error("Proxy error:", e);
    sendCORS(res, 500);
  }
}

http.createServer(handleRequest).listen(PORT, () => console.log("Proxy running on port", PORT));
