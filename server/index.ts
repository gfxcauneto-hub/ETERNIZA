import compression from "compression";
import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerPixRoutes } from "./pixRoutes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(compression());
  app.use(express.json({ limit: "256kb" }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  registerPixRoutes(app);

  if (process.env.NODE_ENV === "development") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, "..", "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const publicDir = path.resolve(__dirname, "public");
    app.use(express.static(publicDir, {
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }));
    app.get("*", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));
  }

  const port = Number(process.env.PORT || 3000);
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch((error) => {
  console.error("Fatal server error", error);
  process.exit(1);
});
