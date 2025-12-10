import http from "http";
import fetch from "node-fetch";

const API_BASE = "https://pipedapi.kavin.rocks"; // Change to your preferred Piped instance

const server = http.createServer(async (req, res) => {
  // Handle OPTIONS preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    });
    return res.end();
  }

  let url;
  try {
    url = new URL(req.url, "http://localhost");
  } catch (err) {
    res.writeHead(400, { "Access-Control-Allow-Origin": "*" });
    return res.end("Invalid URL");
  }

  const targetUrl = API_BASE + url.pathname + url.search;

  // Copy request headers
  const headers = {};
  req.headers && Object.entries(req.headers).forEach(([k, v]) => headers[k] = v);

  // Only include body for non-GET/HEAD requests
  const body = (req.method !== "GET" && req.method !== "HEAD") ? await new Promise(r => {
    const data = [];
    req.on("data", chunk => data.push(chunk));
    req.on("end", () => r(Buffer.concat(data)));
  }) : null;

  try {
    const response = await fetch(targetUrl, { method: req.method, headers, body });
    const responseBody = await response.buffer();

    res.writeHead(response.status, {
      ...Object.fromEntries(response.headers),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    });
    res.end(responseBody);
  } catch (err) {
    res.writeHead(502, { "Access-Control-Allow-Origin": "*" });
    res.end("Bad Gateway: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
