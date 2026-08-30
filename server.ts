import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import {
  initializeSampleDocuments,
  getDocuments,
  getChunks,
  deleteDocument,
  processAndIndexFile,
  processAndIndexPDF,
  performSemanticSearch,
  queryRAGPipeline,
  generateDocumentSummary,
} from "./server/ragStore";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max PDF limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Boot sample documents into vector store
  await initializeSampleDocuments();

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get all uploaded / sample documents
  app.get("/api/documents", (_req, res) => {
    const docs = getDocuments();
    res.json({ documents: docs });
  });

  // Get document chunks
  app.get("/api/documents/:id/chunks", (req, res) => {
    const { id } = req.params;
    const chunks = getChunks(id);
    res.json({ chunks });
  });

  // Get all chunks across all documents (fast single request)
  app.get("/api/chunks", (_req, res) => {
    const chunks = getChunks();
    res.json({ chunks });
  });

  // Delete document
  app.delete("/api/documents/:id", (req, res) => {
    const { id } = req.params;
    const success = deleteDocument(id);
    if (success) {
      res.json({ success: true, message: "Document and vector chunks removed." });
    } else {
      res.status(404).json({ error: "Document not found" });
    }
  });

  // Generate document summary
  app.post("/api/documents/:id/summary", async (req, res) => {
    try {
      const { id } = req.params;
      const doc = getDocuments().find((d) => d.id === id);
      if (!doc) {
        return res.status(404).json({
          success: false,
          error: "Document not found in workspace. It may have been deleted or the server restarted.",
        });
      }
      const summary = await generateDocumentSummary(id);
      res.json({ success: true, summary });
    } catch (err) {
      console.error("Document summary route error:", err);
      res.status(500).json({
        success: false,
        error: "Failed to generate document summary: " + (err instanceof Error ? err.message : String(err)),
      });
    }
  });

  // Multi-format Document Upload (PDF, DOCX, PNG, JPG, JSON, TXT, etc.) with streaming progress support
  app.post("/api/upload", (req, res) => {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        console.error("Multer upload error:", err);
        return res.status(400).json({ error: err.message || "File upload failed" });
      }

      const isStream =
        req.query.stream === "true" ||
        req.headers.accept?.includes("text/event-stream") ||
        req.headers.accept?.includes("application/x-ndjson");

      const abortController = new AbortController();
      let isClientClosed = false;

      req.on("close", () => {
        isClientClosed = true;
        abortController.abort();
      });

      try {
        if (!req.file) {
          if (isStream) {
            res.setHeader("Content-Type", "text/event-stream");
            res.write(`data: ${JSON.stringify({ type: "error", error: "No file provided in upload" })}\n\n`);
            return res.end();
          }
          return res.status(400).json({ error: "No file provided in upload" });
        }

        const fileName = req.file.originalname || "Uploaded_Document";
        const mimeType = req.file.mimetype;

        if (isStream) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          res.flushHeaders?.();

          // Initial upload acknowledgement event
          res.write(
            `data: ${JSON.stringify({
              type: "progress",
              stage: "uploading",
              percent: 10,
              detail: `Received ${fileName} (${(req.file.size / 1024).toFixed(1)} KB). Initializing parser...`,
              fileName,
              fileSize: req.file.size,
            })}\n\n`
          );

          const doc = await processAndIndexFile(
            req.file.buffer,
            fileName,
            mimeType,
            (progress) => {
              if (!isClientClosed && !res.writableEnded) {
                res.write(
                  `data: ${JSON.stringify({
                    type: "progress",
                    fileName,
                    fileSize: req.file?.size,
                    ...progress,
                  })}\n\n`
                );
              }
            },
            abortController.signal
          );

          if (!res.writableEnded) {
            res.write(
              `data: ${JSON.stringify({
                type: "complete",
                success: true,
                document: doc,
                percent: 100,
                message: `Successfully processed ${doc.name} into ${doc.chunkCount} vector chunks.`,
              })}\n\n`
            );
            res.end();
          }
        } else {
          const doc = await processAndIndexFile(
            req.file.buffer,
            fileName,
            mimeType,
            undefined,
            abortController.signal
          );

          res.json({
            success: true,
            document: doc,
            message: `Successfully processed ${doc.name} into ${doc.chunkCount} vector chunks.`,
          });
        }
      } catch (procErr: any) {
        console.error("Document upload processing error:", procErr);
        const isAborted =
          abortController.signal.aborted ||
          String(procErr).includes("aborted") ||
          isClientClosed;

        if (isStream) {
          if (!res.writableEnded) {
            res.write(
              `data: ${JSON.stringify({
                type: isAborted ? "aborted" : "error",
                error: isAborted
                  ? "Upload aborted by user."
                  : "Failed to process document: " + (procErr instanceof Error ? procErr.message : String(procErr)),
              })}\n\n`
            );
            res.end();
          }
        } else {
          res.status(isAborted ? 499 : 500).json({
            error: isAborted
              ? "Upload aborted by user."
              : "Failed to process document: " + (procErr instanceof Error ? procErr.message : String(procErr)),
          });
        }
      }
    });
  });

  // Semantic Vector Search endpoint
  app.post("/api/search", async (req, res) => {
    try {
      const { query, settings } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query string is required" });
      }

      const defaultSettings = {
        topK: 5,
        similarityThreshold: 0.1,
        temperature: 0.2,
        selectedDocIds: [],
        ...settings,
      };

      const results = await performSemanticSearch(query, defaultSettings);
      res.json({ results });
    } catch (err) {
      console.error("Search API error:", err);
      res.status(500).json({ error: "Vector search failed" });
    }
  });

  // RAG Query endpoint
  app.post("/api/query", async (req, res) => {
    const startTime = Date.now();
    try {
      const { query, settings, chatHistory } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query string is required" });
      }

      const defaultSettings = {
        topK: 4,
        similarityThreshold: 0.15,
        temperature: 0.2,
        selectedDocIds: [],
        ...settings,
      };

      const ragResult = await queryRAGPipeline(query, defaultSettings, chatHistory);
      const reasoningTimeMs = Date.now() - startTime;

      res.json({
        ...ragResult,
        reasoningTimeMs,
      });
    } catch (err) {
      console.error("RAG Query Error:", err);
      res.status(500).json({
        error: "Failed to process RAG query: " + (err instanceof Error ? err.message : String(err)),
      });
    }
  });

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

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IntraMind RAG Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
