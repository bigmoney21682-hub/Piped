import fetch from "node-fetch";

const PORT = process.env.PORT || 10000;

async function handleRequest(request) {
  const url = new URL(request.url);

  // Your API instance
  const API_BASE = "https://pipedapi.kavin.rocks";

  // Handle preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  }

  // Build target URL
  const targetUrl = API_BASE + url.pathname + url.search;

  // Build request init without body for GET/HEAD
  const init = {
    method: request.method,
    headers: request.headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  // Fetch from upstream API
  const response = await fetch(targetUrl, init);

  // Clone headers and add CORS
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Headers", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  // Return proxied response
  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers: newHeaders,
  });
}

// If using native Node.js server (Render)
import http from "http";

const server = http.createServer((req, res) => {
  handleRequest(req)
    .then((response) => {
      res.writeHead(response.status, Object.fromEntries(response.headers));
      response.arrayBuffer().then((buf) => {
        res.end(Buffer.from(buf));
      });
    })
    .catch((err) => {
      console.error(err);
      res.writeHead(500);
      res.end("Internal Server Error");
    });
});

server.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
