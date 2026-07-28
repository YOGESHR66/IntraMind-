# IntraMind AI - RAG Studio

**IntraMind AI** is an advanced, full-stack Retrieval-Augmented Generation (RAG) workspace designed for instant document search, vector embedding analysis, and accurate Q&A with highlighted key insights and verified citations.

---

## 🌟 Key Features

- 📄 **Multi-Format Document Ingestion**: Native support for PDF, Word (`.docx`), Images (`.png`, `.jpg`, `.webp`), JSON, Plain Text (`.txt`), and Code files.
- ⚡ **Optimized Parsing Engine**: High-speed stream extraction for multi-page documents with non-blocking OCR fallbacks for scanned PDFs.
- 🧠 **Vector Embeddings & Semantic Search**: High-dimensional vector generation using Gemini embeddings and similarity matching.
- 🎯 **Grounding & Verifiable Citations**: Chat responses link directly to extracted document chunks and page numbers.
- 🔍 **Vector Inspector & Library Reader**: View document chunks, inspect similarity metrics, and read raw extracted text side-by-side.
- 💻 **Full-Width Responsive UI**: Sleek, edge-to-edge dark workspace tailored for desktop and mobile displays.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React Icons, Motion Animation.
- **Backend**: Node.js, Express, `tsx`, `esbuild`.
- **AI & RAG Engine**: Google Gemini API (`@google/genai`), `pdf-parse`, `mammoth` (DOCX parser), `multer` for multipart upload stream management.
- **Build Tooling**: Vite 6, TypeScript 5.8.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js 18+** installed on your system.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd intramind-rag
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

## 📜 Available Scripts

- `npm run dev`: Starts the Node/Express backend development server with hot TypeScript execution (`tsx server.ts`).
- `npm run build`: Bundles the React Vite frontend and builds the Express server into `dist/server.cjs`.
- `npm run start`: Runs the production CommonJS server on port 3000 (includes auto-build failsafe).
- `npm run lint`: Validates TypeScript type checking across the codebase.

---

## 🌐 Deploying on Render

To deploy on **Render**, configure your Web Service settings in the Render Dashboard as follows:

- **Environment**: `Node`
- **Build Command**: `npm install && npm run build` *(or `bun install && bun run build`)*
- **Start Command**: `npm start`
- **Environment Variables**:
  - `GEMINI_API_KEY`: Your Google Gemini API Key

> 💡 **Why this fix works**: Render requires running `npm run build` during the build phase so `esbuild` compiles `server.ts` into `dist/server.cjs`. We have also included an automatic build failsafe in `npm start` so that if `dist/server.cjs` is ever missing, it automatically builds it before starting the server.

---

## 📁 Project Structure

```
├── server.ts             # Express server entry point with Vite middleware integration
├── server/
│   ├── ragStore.ts       # Core RAG engine: Document parsing, chunking, embeddings & vector search
│   └── sampleDocs.ts     # Pre-loaded sample knowledge base documents
├── src/
│   ├── App.tsx           # Primary application container & tab state engine
│   ├── components/
│   │   ├── Header.tsx    # Header navigation & action controls
│   │   ├── ChatInterface.tsx # Interactive RAG chat UI with citations
│   │   ├── LibraryView.tsx   # Knowledge base document manager
│   │   ├── DocumentViewer.tsx# Side-by-side document reader
│   │   ├── VectorInspector.tsx# Vector store chunk & embedding analyzer
│   │   ├── LoginPage.tsx # Portal login & onboarding view
│   │   └── SettingsModal.tsx # Workspace configuration settings
│   └── lib/
│       └── api.ts        # Resilient API client with connection retry logic
├── metadata.json         # AI Studio applet metadata
└── package.json          # Project configuration and dependencies
```

---

## 🔒 Security & Privacy

- All API calls and Gemini interactions run securely on the server-side.
- API keys are kept strictly within environment variables and are never exposed to client browsers.
