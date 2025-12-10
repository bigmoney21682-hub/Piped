import http from "http";
import fetch from "node-fetch";

const API_BASE = "https://pipedapi.kavin.rocks";

// Allowed methods
const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

// CORS headers (ONLY SET ONCE)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": ALLOWED_METHODS,
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

function sendCORS(res, status = 200, extraHeaders = {}) {
  res.writeHead(status, { ...CORS_HEADERS, ...extraHeaders });
  res.end();
}

async function handleRequest(req, res) {

  // Handle OPTIONS first
  if (req.method === "OPTIONS") {
    return sendCORS(res, 204);
  }

  let targetUrl;
  try {
    const url = new URL(req.url, "http://localhost");
    targetUrl = API_BASE + url.pathname + url.search;
  } catch (e) {
    console.error("Invalid URL:", req.url);
    return sendCORS(res, 400);
  }

  // Copy headers except host
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (k.toLowerCase() !== "host") headers[k] = v;
  }

  // Only include body for non-GET requests
  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseBody = Buffer.from(await upstream.arrayBuffer());

    // Convert upstream headers to a clean object
    const cleanHeaders = {};
    upstream.headers.forEach((value, key) => {
      if (
        key.toLowerCase() !== "access-control-allow-origin" &&
        key.toLowerCase() !== "access-control-allow-headers" &&
        key.toLowerCase() !== "access-control-allow-methods"
      ) {
        cleanHeaders[key] = value;
      }
    });

    // Add CORRECT CORS headers (only once)
    const finalHeaders = {
      ...cleanHeaders,
      ...CORS_HEADERS,
    };

    res.writeHead(upstream.status, finalHeaders);
    res.end(responseBody);

  } catch (e) {
    console.error("Proxy error:", e);
    sendCORS(res, 500);
  }
}

const PORT = process.env.PORT || 3000;
http.createServer(handleRequest).listen(PORT, () =>
  console.log("Proxy running on port", PORT)
);
