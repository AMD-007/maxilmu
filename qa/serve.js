// Tiny static server for public/ that mimics Cloudflare assets:
// extensionless -> .html, missing -> 404.html (status 404).
const http = require("http"), fs = require("fs"), path = require("path");
const root = process.argv[2], port = +process.argv[3] || 8787;
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  let f = path.join(root, p);
  if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f += ".html";
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404, { "content-type": types[".html"] });
    return res.end(fs.readFileSync(path.join(root, "404.html")));
  }
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log("serving", root, "on", port));
