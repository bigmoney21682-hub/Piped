import http from "http";
import fetch from "node-fetch";

const API_BASE = "https://pipedapi.kavin.rocks"; // Change this to your preferred Piped instance

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    });
    return res.end();
  }

  const url = new URL(req.url, "http://localhost");
  const targetUrl = API_BASE + url.pathname + url.search;

  const headers = {};
  req.headers && Object.entries(req.headers).forEach(([k,v]) => headers[k] = v);

  const body = req.method !== "GET" ? await new Promise(r => {
    let data = [];
    req.on("data", chunk => data.push(chunk));
    req.on("end", () => r(Buffer.concat(data)));
  }) : null;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body
  });

  const responseBody = await response.buffer();

  res.writeHead(response.status, {
    ...Object.fromEntries(response.headers),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  });
  res.end(responseBody);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
