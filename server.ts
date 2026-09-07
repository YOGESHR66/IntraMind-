import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import app from "./server/app";

const PORT = 3000;

async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));
  const isProduction = process.env.NODE_ENV === "production" || hasDist;

  // Vite middleware in development vs static serving in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Catch-all 404 handler for API routes before static/vite fallback
  app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Global error handler ensuring API calls always respond with JSON
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled API error:", err);
    if (res.headersSent) return;
    const statusCode = typeof err.status === "number" ? err.status : 500;
    const message = err instanceof Error ? err.message : String(err) || "Internal server error";
    res.status(statusCode).json({ error: message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IntraMind RAG Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
