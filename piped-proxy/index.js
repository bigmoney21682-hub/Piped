import http from "http";
import fetch from "node-fetch";

const API_BASE = "https://pipedapi.kavin.rocks"; // Your preferred Piped instance

const server = http.createServer(async (req, res) => {
  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    });
    return res.end();
  }

  try {
    const url = new URL(req.url, "http://localhost");
    const targetUrl = API_BASE + url.pathname + url.search;

    // Copy incoming headers
    const headers = {};
    req.headers && Object.entries(req.headers).forEach(([k,v]) => headers[k] = v);

    // Only include body for non-GET/HEAD requests
    const body = req.method !== "GET" && req.method !== "HEAD" 
      ? await new Promise(r => {
          let data = [];
          req.on("data", chunk => data.push(chunk));
          req.on("end", () => r(Buffer.concat(data)));
        })
      : null;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body
    });

    const responseBody = await response.arrayBuffer();

    // Copy original headers but remove any CORS headers
    const newHeaders = {};
    response.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith("access-control-")) {
        newHeaders[key] = value;
      }
    });

    // Add proper CORS headers
    newHeaders["Access-Control-Allow-Origin"] = "*";
    newHeaders["Access-Control-Allow-Headers"] = "*";
    newHeaders["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";

    res.writeHead(response.status, newHeaders);
    res.end(Buffer.from(responseBody));

  } catch (err) {
    res.writeHead(500, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    res.end("Proxy error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
