import React, { useState, useEffect, useRef } from 'react';
import { LoginPage } from './components/LoginPage';
import { LoginModal } from './components/LoginModal';
import { Header } from './components/Header';
import { DocumentLibrary } from './components/DocumentLibrary';
import { DocumentViewer } from './components/DocumentViewer';
import { VectorInspector } from './components/VectorInspector';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { PDFDocument, DocumentChunk, ChatMessage, Citation, RAGSettings, UploadProgressState } from './types';
import { fetchApi, uploadDocumentWithStreamingProgress } from './lib/api';

export default function App() {
  const [viewMode, setViewMode] = useState<'login' | 'app'>('login');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // RAG State
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [activeDoc, setActiveDoc] = useState<PDFDocument | null>(null);
  const [activeDocChunks, setActiveDocChunks] = useState<DocumentChunk[]>([]);
  const [allChunks, setAllChunks] = useState<DocumentChunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'chat' | 'library' | 'viewer' | 'vector'>('chat');
  const [highlightedCitation, setHighlightedCitation] = useState<Citation | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isQueryLoading, setIsQueryLoading] = useState<boolean>(false);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState<{ docName: string; chunkCount: number; fileSize: number; fileType: string } | null>(null);
  const [lastUploadedDocId, setLastUploadedDocId] = useState<string | null>(null);
  const [lastFailedFile, setLastFailedFile] = useState<File | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [ragSettings, setRagSettings] = useState<RAGSettings>({
    topK: 4,
    similarityThreshold: 0.15,
    temperature: 0.2,
    selectedDocIds: [],
  });

  const fetchDocuments = async () => {
    try {
      const res = await fetchApi('/api/documents');
      if (!res.ok) return;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;

      const data = await res.json();
      const docs: PDFDocument[] = data.documents || [];
      setDocuments(docs);

      if (docs.length > 0 && !activeDoc) {
        setActiveDoc(docs[0]);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const fetchChunksForActiveDoc = async (docId?: string) => {
    setIsLoadingChunks(true);
    try {
      const promises: Promise<any>[] = [fetchApi('/api/chunks')];
      if (docId) {
        promises.push(fetchApi(`/api/documents/${docId}/chunks`));
      }

      const results = await Promise.all(promises);
      const allChunksRes = results[0];
      if (allChunksRes.ok) {
        const allData = await allChunksRes.json();
        setAllChunks(allData.chunks || []);
      }

      if (docId && results[1] && results[1].ok) {
        const docData = await results[1].json();
        setActiveDocChunks(docData.chunks || []);
      }
    } catch (e) {
      console.error('Error fetching chunks:', e);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (activeDoc) {
      fetchChunksForActiveDoc(activeDoc.id);
    }
  }, [activeDoc?.id]);

  function formatErrorMessage(err: any): string {
    if (!err) return 'An unexpected error occurred';
    if (typeof err === 'string') {
      let str = err.trim();
      if (str.startsWith('[object') || str === 'Error') {
        return 'Connection or document processing error. Please retry.';
      }
      return str;
    }
    if (err instanceof Error) {
      return err.message || 'Processing error';
    }
    if (typeof err === 'object') {
      if (err.message && typeof err.message === 'string') return err.message;
      if (err.error && typeof err.error === 'string') return err.error;
      if (err.details && typeof err.details === 'string') return err.details;
      try {
        const json = JSON.stringify(err);
        if (json && json !== '{}') return json;
      } catch {
        // ignore
      }
    }
    return String(err);
  }

  const handleAbortUpload = () => {
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
      uploadAbortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress((prev) =>
      prev
        ? {
            ...prev,
            stage: 'aborted',
            percent: 0,
            detail: 'Upload and indexing was cancelled by user.',
            isAborting: false,
          }
        : null
    );
    setTimeout(() => {
      setUploadProgress(null);
      setUploadingFileName(null);
    }, 2500);
  };

  const handleUploadFile = async (file: File) => {
    // If an upload is already underway, cancel it first
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    uploadAbortControllerRef.current = controller;

    setIsUploading(true);
    setUploadingFileName(file.name);
    setUploadError(null);
    setUploadSuccessNotice(null);
    setLastFailedFile(null);

    setUploadProgress({
      stage: 'uploading',
      percent: 8,
      fileName: file.name,
      fileSize: file.size,
      detail: 'Connecting and sending document...',
    });

    try {
      const result = await uploadDocumentWithStreamingProgress(
        file,
        (progressState) => {
          setUploadProgress(progressState);
        },
        controller.signal
      );

      await fetchDocuments();

      if (result.document) {
        const doc: PDFDocument = result.document;
        setActiveDoc(doc);
        setLastUploadedDocId(doc.id);
        setUploadSuccessNotice({
          docName: doc.name,
          chunkCount: doc.chunkCount,
          fileSize: doc.fileSize,
          fileType: doc.fileType || 'file',
        });
        setActiveTab('chat');
      }

      setIsUploading(false);
      setUploadingFileName(null);
      uploadAbortControllerRef.current = null;

      // Keep success state visible briefly for clear feedback
      setTimeout(() => {
        setUploadProgress(null);
      }, 1200);
    } catch (err: any) {
      const isAborted =
        controller.signal.aborted ||
        err?.name === 'AbortError' ||
        String(err?.message || '').toLowerCase().includes('abort');

      if (isAborted) {
        setUploadProgress({
          stage: 'aborted',
          percent: 0,
          fileName: file.name,
          fileSize: file.size,
          detail: 'Upload aborted by user.',
        });
        setIsUploading(false);
        setUploadingFileName(null);
        uploadAbortControllerRef.current = null;
        setTimeout(() => {
          setUploadProgress(null);
        }, 2500);
        return;
      }

      setLastFailedFile(file);
      const rawMsg = formatErrorMessage(err);
      let cleanErr = rawMsg
        .replace(/<[^>]*>?/gm, '')
        .replace(/:\s*root\s*\{[^}]*\}/gi, '')
        .replace(/body\s*\{[^}]*\}/gi, '')
        .trim();

      if (cleanErr.includes('Failed to fetch') || cleanErr.includes('fetch')) {
        cleanErr = `Connection interrupted. Click "Retry Upload" to index ${file.name}.`;
      }

      setUploadError(cleanErr || `Failed to index ${file.name}. Please click "Retry Upload".`);
      setUploadProgress({
        stage: 'error',
        percent: 0,
        fileName: file.name,
        fileSize: file.size,
        detail: cleanErr || 'Document processing error',
      });

      setIsUploading(false);
      setUploadingFileName(null);
      uploadAbortControllerRef.current = null;
    }
  };

  const handleRetryFailedUpload = () => {
    if (lastFailedFile) {
      handleUploadFile(lastFailedFile);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      const res = await fetchApi(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedDocIds(prev => prev.filter(id => id !== docId));
        if (activeDoc?.id === docId) {
          const remaining = documents.filter(d => d.id !== docId);
          setActiveDoc(remaining.length > 0 ? remaining[0] : null);
        }
        await fetchDocuments();
      }
    } catch (err) {
      console.error('Failed to delete doc:', err);
    }
  };

  const handleToggleDocSelection = (docId: string) => {
    setSelectedDocIds(prev => {
      let next: string[];
      if (prev.includes(docId)) {
        next = prev.filter(id => id !== docId);
      } else {
        next = [...prev, docId];
      }
      setRagSettings(s => ({ ...s, selectedDocIds: next }));
      return next;
    });
  };

  const handleSelectAllDocs = () => {
    setSelectedDocIds([]);
    setRagSettings(s => ({ ...s, selectedDocIds: [] }));
  };

  const handleDeselectAllDocs = () => {
    if (documents.length > 0) {
      const firstOnly = [documents[0].id];
      setSelectedDocIds(firstOnly);
      setRagSettings(s => ({ ...s, selectedDocIds: firstOnly }));
    }
  };

  const handleSendMessage = async (query: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsQueryLoading(true);

    try {
      const res = await fetchApi('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          settings: ragSettings,
          chatHistory: messages.map(m => ({ role: m.sender, text: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'RAG Query Failed');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: data.answer || 'No response generated.',
        timestamp: new Date().toISOString(),
        citations: data.citations || [],
        retrievedChunks: data.retrievedChunks || [],
        reasoningTimeMs: data.reasoningTimeMs,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        sender: 'assistant',
        content: `Sorry, an error occurred during vector retrieval: ${
          err instanceof Error ? err.message : String(err)
        }`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsQueryLoading(false);
    }
  };

  const handleSelectCitation = (citation: Citation) => {
    setHighlightedCitation(citation);
    const targetDoc = documents.find(d => d.id === citation.docId);
    if (targetDoc) {
      setActiveDoc(targetDoc);
    }
    setActiveTab('viewer');
  };

  const handleResetChat = () => {
    setMessages([]);
    setIsQueryLoading(false);
    setIsUploading(false);
    setUploadingFileName(null);
    setUploadSuccessNotice(null);
    setUploadError(null);
    setActiveTab('chat');
  };

  const totalChunksCount = documents.reduce((acc, d) => acc + d.chunkCount, 0);

  // If in Dark Hero Login mode
  if (viewMode === 'login') {
    return (
      <>
        <LoginPage
          onEnterApp={() => setViewMode('app')}
          onOpenLoginModal={() => setIsLoginOpen(true)}
        />
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={(email) => {
            setIsLoginOpen(false);
            setUserEmail(email);
            setViewMode('app');
          }}
        />
      </>
    );
  }

  return (
    <div className={`min-h-screen selection:bg-indigo-500 selection:text-white font-sans flex flex-col relative transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0a0d14] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      <main className="flex-1 w-full relative overflow-hidden">
        {/* Subtle Ambient Background Glow */}
        {theme === 'dark' ? (
          <>
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
            <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
          </>
        ) : (
          <>
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-400/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[300px] bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none" />
          </>
        )}

        <div className="h-screen max-h-screen flex flex-col relative z-10 overflow-hidden">
          <Header
            documents={documents}
            totalChunks={totalChunksCount}
            theme={theme}
            setTheme={setTheme}
            onOpenUpload={() => setActiveTab('library')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenVectorInspector={() => fetchChunksForActiveDoc()}
            onResetChat={handleResetChat}
            onPortalHome={() => setViewMode('login')}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

            <div className="flex-1 w-full px-2 sm:px-4 md:px-6 py-2 sm:py-3 flex flex-col min-h-0 overflow-hidden">
              {activeTab === 'chat' && (
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isQueryLoading}
                  onSelectCitation={handleSelectCitation}
                  settings={ragSettings}
                  documents={documents}
                  theme={theme}
                  onOpenLibrary={() => setActiveTab('library')}
                  onUploadFile={handleUploadFile}
                  onResetChat={handleResetChat}
                  isUploading={isUploading}
                  uploadingFileName={uploadingFileName}
                  uploadSuccessNotice={uploadSuccessNotice}
                  uploadError={uploadError}
                  onRetryUpload={handleRetryFailedUpload}
                  onDismissUploadNotice={() => {
                    setUploadSuccessNotice(null);
                    setUploadError(null);
                  }}
                  lastUploadedDocId={lastUploadedDocId}
                  uploadProgress={uploadProgress}
                  onAbortUpload={handleAbortUpload}
                />
              )}

              {activeTab === 'library' && (
                <DocumentLibrary
                  documents={documents}
                  selectedDocIds={selectedDocIds}
                  theme={theme}
                  onToggleDocSelection={handleToggleDocSelection}
                  onSelectAllDocs={handleSelectAllDocs}
                  onDeselectAllDocs={handleDeselectAllDocs}
                  onDeleteDoc={handleDeleteDoc}
                  onUploadFile={handleUploadFile}
                  onViewDocInReader={(doc) => {
                    setActiveDoc(doc);
                    setActiveTab('viewer');
                  }}
                  isUploading={isUploading}
                  uploadingFileName={uploadingFileName}
                  uploadSuccessNotice={uploadSuccessNotice}
                  uploadError={uploadError}
                  onDismissUploadNotice={() => setUploadSuccessNotice(null)}
                  lastUploadedDocId={lastUploadedDocId}
                  uploadProgress={uploadProgress}
                  onAbortUpload={handleAbortUpload}
                />
              )}

              {activeTab === 'viewer' && (
                <DocumentViewer
                  documents={documents}
                  activeDoc={activeDoc}
                  onSelectDoc={(doc) => setActiveDoc(doc)}
                  highlightedCitation={highlightedCitation}
                  chunks={activeDocChunks}
                  isLoadingChunks={isLoadingChunks}
                  theme={theme}
                />
              )}

              {activeTab === 'vector' && (
                <VectorInspector
                  chunks={allChunks}
                  settings={ragSettings}
                  theme={theme}
                />
              )}
            </div>
          </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={ragSettings}
        onUpdateSettings={(newS) => setRagSettings(prev => ({ ...prev, ...newS }))}
        documents={documents}
        theme={theme}
        setTheme={setTheme}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(email) => {
          setIsLoginOpen(false);
          setUserEmail(email);
          setViewMode('app');
        }}
      />
    </div>
  );
}
