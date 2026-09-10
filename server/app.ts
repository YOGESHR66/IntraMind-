import express from "express";
import multer from "multer";
import {
  initializeSampleDocuments,
  getDocuments,
  getChunks,
  deleteDocument,
  clearAllDocuments,
  importClientChunks,
  processAndIndexFile,
  performSemanticSearch,
  queryRAGPipeline,
  generateDocumentSummary,
} from "./ragStore";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max limit
});

export function createExpressApp() {
  const app = express();

  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // CORS and pre-flight handling
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // Sample document initialization trigger
  initializeSampleDocuments().catch((err) => {
    console.warn("Failed to initialize sample documents:", err);
  });

  // Health check endpoint
  app.get(["/api/health", "/health"], (_req, res) => {
    res.json({
      status: "ok",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
      timestamp: new Date().toISOString(),
    });
  });

  // Get all uploaded documents
  app.get(["/api/documents", "/documents"], (_req, res) => {
    const docs = getDocuments();
    res.json({ documents: docs });
  });

  // Get document chunks by document ID
  app.get(["/api/documents/:id/chunks", "/documents/:id/chunks"], (req, res) => {
    const { id } = req.params;
    const chunks = getChunks(id);
    res.json({ chunks });
  });

  // Get all chunks across all documents
  app.get(["/api/chunks", "/chunks"], (_req, res) => {
    const chunks = getChunks();
    res.json({ chunks });
  });

  // Clear all uploaded documents from workspace
  app.delete(["/api/documents", "/documents"], (_req, res) => {
    clearAllDocuments();
    res.json({ success: true, message: "All documents and vector chunks removed from workspace." });
  });

  // Delete specific document
  app.delete(["/api/documents/:id", "/documents/:id"], (req, res) => {
    const { id } = req.params;
    const success = deleteDocument(id);
    if (success) {
      res.json({ success: true, message: "Document and vector chunks removed." });
    } else {
      res.status(404).json({ error: "Document not found" });
    }
  });

  // Generate document summary
  app.post(["/api/documents/:id/summary", "/documents/:id/summary"], async (req, res) => {
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
  app.post(["/api/upload", "/upload"], (req, res) => {
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

      res.on("close", () => {
        if (!res.writableEnded) {
          isClientClosed = true;
          abortController.abort();
        }
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
          try {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Accel-Buffering", "no");
            res.flushHeaders?.();
          } catch (hErr) {
            console.warn("SSE header setup warning:", hErr);
          }

          const safeWrite = (str: string) => {
            try {
              if (!isClientClosed && !res.writableEnded) {
                res.write(str);
              }
            } catch {
              // ignore broken pipe on serverless edge
            }
          };

          // Initial upload acknowledgement event
          safeWrite(
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
              safeWrite(
                `data: ${JSON.stringify({
                  type: "progress",
                  fileName,
                  fileSize: req.file?.size,
                  ...progress,
                })}\n\n`
              );
            },
            abortController.signal
          );

          if (!res.writableEnded) {
            safeWrite(
              `data: ${JSON.stringify({
                type: "complete",
                success: true,
                document: doc,
                percent: 100,
                message: `Successfully processed ${doc.name} into ${doc.chunkCount} vector chunks.`,
              })}\n\n`
            );
            try {
              res.end();
            } catch {
              // ignore
            }
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
  app.post(["/api/search", "/search"], async (req, res) => {
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

  // Sync client-persisted chunks into the server vector store
  app.post(["/api/sync", "/sync"], (req, res) => {
    try {
      const { chunks, documents } = req.body;
      if (Array.isArray(chunks) && chunks.length > 0) {
        importClientChunks(chunks, documents);
      }
      res.json({
        success: true,
        documentsCount: getDocuments().length,
        chunksCount: getChunks().length,
      });
    } catch (err) {
      console.warn("Sync error:", err);
      res.status(500).json({ error: "Failed to sync chunks" });
    }
  });

  // RAG Query endpoint
  app.post(["/api/query", "/query"], async (req, res) => {
    const startTime = Date.now();
    try {
      const { query, settings, chatHistory, selectedDocIds, clientChunks, clientDocs } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query string is required" });
      }

      // If client provided chunks (e.g. from client storage), import them into server store
      if (Array.isArray(clientChunks) && clientChunks.length > 0) {
        importClientChunks(clientChunks, clientDocs);
      }

      const defaultSettings = {
        topK: 4,
        similarityThreshold: 0.15,
        temperature: 0.2,
        selectedDocIds: selectedDocIds || [],
        preciseOutput: false,
        ...settings,
      };
      if (Array.isArray(selectedDocIds) && selectedDocIds.length > 0) {
        defaultSettings.selectedDocIds = selectedDocIds;
      }

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

  return app;
}

export const app = createExpressApp();
export default app;
