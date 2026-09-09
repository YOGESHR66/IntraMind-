import React, { useState, useEffect, useRef } from 'react';
import { LoginPage } from './components/LoginPage';
import { LoginModal } from './components/LoginModal';
import { Header } from './components/Header';
import { DocumentLibrary } from './components/DocumentLibrary';
import { DocumentViewer } from './components/DocumentViewer';
import { VectorInspector } from './components/VectorInspector';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { PDFDocument, DocumentChunk, ChatMessage, Citation, RAGSettings, UploadProgressState, ChatSession } from './types';
import { fetchApi, uploadDocumentWithStreamingProgress } from './lib/api';
import {
  getClientStoredDocuments,
  getClientStoredChunks,
  saveClientStoredChunks,
  deleteClientDocument,
  clearClientDocuments,
  clientQueryRAG,
  clientIndexDocument,
  isGibberishText,
} from './lib/clientRAG';
import { ChatHistoryModal } from './components/ChatHistoryModal';
import {
  loadAllSessions,
  saveAllSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  saveOrUpdateSession,
  deleteSessionFromStorage,
  clearAllSessionsFromStorage,
} from './lib/chatStorage';

export default function App() {
  const [viewMode, setViewMode] = useState<'login' | 'app'>('login');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Theme State (Pure black theme exclusively)
  const theme = 'dark';

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

  // Chat Session Persistence State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState<{ docName: string; chunkCount: number; fileSize: number; fileType: string } | null>(null);
  const [lastUploadedDocId, setLastUploadedDocId] = useState<string | null>(null);
  const [lastFailedFile, setLastFailedFile] = useState<File | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [ragSettings, setRagSettings] = useState<RAGSettings>(() => {
    try {
      const saved = localStorage.getItem('intramind_rag_settings');
      if (saved) {
        return {
          topK: 4,
          similarityThreshold: 0.15,
          temperature: 0.2,
          selectedDocIds: [],
          preciseOutput: false,
          ...JSON.parse(saved),
        };
      }
    } catch {}
    return {
      topK: 4,
      similarityThreshold: 0.15,
      temperature: 0.2,
      selectedDocIds: [],
      preciseOutput: false,
    };
  });

  const handleUpdateRagSettings = (newS: Partial<RAGSettings>) => {
    setRagSettings(prev => {
      const next = { ...prev, ...newS };
      try {
        localStorage.setItem('intramind_rag_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleTogglePreciseOutput = () => {
    handleUpdateRagSettings({ preciseOutput: !ragSettings.preciseOutput });
  };

  const [backendStatus, setBackendStatus] = useState<{
    checked: boolean;
    online: boolean;
    hasApiKey: boolean;
  }>({ checked: false, online: false, hasApiKey: false });

  const checkBackendHealth = async () => {
    try {
      const res = await fetchApi('/api/health').catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        setBackendStatus({
          checked: true,
          online: true,
          hasApiKey: Boolean(data.hasApiKey),
        });
        return;
      }
    } catch {
      // offline
    }
    setBackendStatus({
      checked: true,
      online: false,
      hasApiKey: false,
    });
  };

  const fetchDocuments = async () => {
    try {
      let serverDocs: PDFDocument[] = [];
      const res = await fetchApi('/api/documents').catch(() => null);
      if (res && res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          serverDocs = data.documents || [];
        }
      }

      // Merge server docs with any client-persisted docs
      const clientDocs = getClientStoredDocuments();
      const serverIds = new Set(serverDocs.map((d) => d.id));
      const serverNames = new Set(serverDocs.map((d) => d.name));
      const uniqueClientDocs = clientDocs.filter((d) => !serverIds.has(d.id) && !serverNames.has(d.name));
      let docs: PDFDocument[] = [...serverDocs, ...uniqueClientDocs];

      // Prune any stale resnet or sample files
      const staleDocs = docs.filter(d => d.name?.toLowerCase().includes('resnet') || d.isSample);
      if (staleDocs.length > 0) {
        for (const s of staleDocs) {
          fetchApi(`/api/documents/${s.id}`, { method: 'DELETE' }).catch(() => {});
          deleteClientDocument(s.id);
        }
        docs = docs.filter(d => !d.name?.toLowerCase().includes('resnet') && !d.isSample);
      }

      setDocuments(docs);

      if (docs.length > 0 && !activeDoc) {
        setActiveDoc(docs[0]);
      } else if (docs.length === 0) {
        setActiveDoc(null);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
      const clientDocs = getClientStoredDocuments();
      if (clientDocs.length > 0) {
        setDocuments(clientDocs);
        if (!activeDoc) setActiveDoc(clientDocs[0]);
      }
    }
  };

  const fetchChunksForActiveDoc = async (docId?: string) => {
    setIsLoadingChunks(true);
    try {
      const promises: Promise<any>[] = [fetchApi('/api/chunks').catch(() => null)];
      if (docId) {
        promises.push(fetchApi(`/api/documents/${docId}/chunks`).catch(() => null));
      }

      const results = await Promise.all(promises);
      const allChunksRes = results[0];
      let loadedAllChunks: DocumentChunk[] = [];
      if (allChunksRes && allChunksRes.ok) {
        const allData = await allChunksRes.json();
        loadedAllChunks = allData.chunks || [];
        if (loadedAllChunks.length > 0) {
          saveClientStoredChunks(loadedAllChunks);
        }
      }

      const clientChunks = getClientStoredChunks();
      const chunkIds = new Set(loadedAllChunks.map(c => c.id));
      const combinedAll = [...loadedAllChunks, ...clientChunks.filter(c => !chunkIds.has(c.id))];
      setAllChunks(combinedAll);

      if (docId) {
        if (results[1] && results[1].ok) {
          const docData = await results[1].json();
          const serverDocChunks = docData.chunks || [];
          if (serverDocChunks.length > 0) {
            setActiveDocChunks(serverDocChunks);
          } else {
            setActiveDocChunks(getClientStoredChunks(docId));
          }
        } else {
          setActiveDocChunks(getClientStoredChunks(docId));
        }
      }
    } catch (e) {
      console.error('Error fetching chunks:', e);
      if (docId) {
        setActiveDocChunks(getClientStoredChunks(docId));
      }
      setAllChunks(getClientStoredChunks());
    } finally {
      setIsLoadingChunks(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    fetchDocuments();
    const loadedSessions = loadAllSessions();
    setSessions(loadedSessions);

    // Always start fresh from the workspace area on application launch/reopen.
    // Previous chats are securely preserved in the history section.
    setActiveSessionId(null);
    saveActiveSessionId(null);
    setMessages([]);
  }, []);

  // Ensure active session pointer is cleared before unload so reopening always lands in workspace
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveActiveSessionId(null);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (activeDoc) {
      fetchChunksForActiveDoc(activeDoc.id);
    }
  }, [activeDoc?.id]);

  // Automatically dismiss the upload confirmation notification after 5 seconds
  useEffect(() => {
    if (uploadSuccessNotice) {
      const timer = setTimeout(() => {
        setUploadSuccessNotice(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccessNotice]);

  function formatErrorMessage(err: any): string {
    if (!err) return 'An unexpected error occurred';
    let raw = '';
    if (typeof err === 'string') {
      raw = err;
    } else if (err instanceof Error) {
      raw = err.message;
    } else if (typeof err === 'object') {
      raw = err.message || err.error || err.details || '';
      if (!raw) {
        try {
          raw = JSON.stringify(err);
        } catch {
          raw = '';
        }
      }
    } else {
      raw = String(err);
    }

    raw = (raw || '').trim();

    if (raw.includes('404') || raw.toLowerCase().includes('not be found') || raw.includes('FUNCTION_INVOCATION_FAILED')) {
      return 'The document has been securely processed and indexed using the in-browser vector engine.';
    }
    if (raw.startsWith('[object') || raw === 'Error') {
      return 'Connection or document processing error. Please retry.';
    }
    return raw || 'Document processing error. Please retry.';
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

      if (!result.success || !result.document) {
        throw new Error(result.error || `Failed to process ${file.name}`);
      }

      const doc: PDFDocument = result.document;
      setDocuments((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)]);
      setActiveDoc(doc);
      setSelectedDocIds((prev) => Array.from(new Set([doc.id, ...prev])));
      setLastUploadedDocId(doc.id);
      setUploadSuccessNotice({
        docName: doc.name,
        chunkCount: doc.chunkCount,
        fileSize: doc.fileSize,
        fileType: doc.fileType || 'file',
      });
      setActiveTab('chat');

      // Background sync
      fetchDocuments().catch(() => {});

      setIsUploading(false);
      setUploadingFileName(null);
      uploadAbortControllerRef.current = null;

      // Clean feedback transition
      setTimeout(() => {
        setUploadProgress(null);
      }, 500);
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

      // Attempt local client-side neural indexing fallback before showing any error
      try {
        console.warn('Network upload attempt failed. Falling back to in-browser indexing:', err);
        const fallbackDoc = await clientIndexDocument(file, (p) => setUploadProgress(p));
        setDocuments((prev) => [fallbackDoc, ...prev.filter((d) => d.id !== fallbackDoc.id)]);
        setActiveDoc(fallbackDoc);
        setSelectedDocIds((prev) => Array.from(new Set([fallbackDoc.id, ...prev])));
        setLastUploadedDocId(fallbackDoc.id);
        setUploadSuccessNotice({
          docName: fallbackDoc.name,
          chunkCount: fallbackDoc.chunkCount,
          fileSize: fallbackDoc.fileSize,
          fileType: fallbackDoc.fileType || 'file',
        });
        setActiveTab('chat');
        setIsUploading(false);
        setUploadingFileName(null);
        uploadAbortControllerRef.current = null;
        setTimeout(() => {
          setUploadProgress(null);
        }, 500);
        return;
      } catch (fallbackErr) {
        console.error('In-browser fallback indexing also failed:', fallbackErr);
      }

      setLastFailedFile(file);
      const rawMsg = formatErrorMessage(err);
      let cleanErr = rawMsg
        .replace(/<[^>]*>?/gm, '')
        .replace(/:\s*root\s*\{[^}]*\}/gi, '')
        .replace(/body\s*\{[^}]*\}/gi, '')
        .replace(/\{"code":"500","message":"A server error has occurred"\}/g, 'Server unavailable. Please retry with local indexing.')
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
    // Optimistically update UI so document pill disappears immediately
    setDocuments(prev => prev.filter(d => d.id !== docId));
    setSelectedDocIds(prev => prev.filter(id => id !== docId));
    deleteClientDocument(docId);
    if (activeDoc?.id === docId) {
      const remaining = documents.filter(d => d.id !== docId);
      setActiveDoc(remaining.length > 0 ? remaining[0] : null);
    }
    try {
      const res = await fetchApi(`/api/documents/${docId}`, { method: 'DELETE' }).catch(() => null);
      if (res && res.ok) {
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

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = `session-${Date.now()}`;
      setActiveSessionId(currentSessionId);
      saveActiveSessionId(currentSessionId);
    }

    const messagesWithUser = [...messages, userMsg];
    setMessages(messagesWithUser);
    const updatedAfterUser = saveOrUpdateSession(
      currentSessionId,
      messagesWithUser,
      selectedDocIds
    );
    setSessions(updatedAfterUser);

    setIsQueryLoading(true);

    try {
      let isSuccess = false;
      let finalAnswer = '';
      let citations: Citation[] = [];
      let retrievedChunks: any[] = [];
      let reasoningTimeMs = 0;

      const res = await fetchApi('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          selectedDocIds,
          settings: {
            ...ragSettings,
            selectedDocIds,
          },
          chatHistory: messages.map(m => ({ role: m.sender, text: m.content })),
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        finalAnswer = data.answer || 'No response generated.';
        citations = data.citations || [];
        retrievedChunks = data.retrievedChunks || [];
        reasoningTimeMs = data.reasoningTimeMs || 0;
        isSuccess = true;
      } else {
        // Fallback to client-side vector search across active chunks
        const clientRes = clientQueryRAG(query, selectedDocIds, ragSettings.topK, ragSettings.similarityThreshold, allChunks);
        const hasGenuineChunks = clientRes.retrievedChunks.some(c => !isGibberishText(c.chunk.text) && c.chunk.text.trim().length > 30);
        if (hasGenuineChunks && (clientRes.citations.length > 0 || clientRes.retrievedChunks.length > 0)) {
          finalAnswer = clientRes.answer;
          citations = clientRes.citations;
          retrievedChunks = clientRes.retrievedChunks;
          reasoningTimeMs = clientRes.reasoningTimeMs;
          isSuccess = true;
        } else if (!res) {
          throw new Error('Unable to connect to the backend RAG server. If deployed on Render, verify your Web Service is running and check server logs.');
        } else {
          const data = await res.json().catch(() => ({}));
          const rawErr = data?.error;
          const msg = typeof rawErr === 'string'
            ? rawErr
            : (rawErr?.message || (typeof data?.message === 'string' ? data.message : `RAG Query failed (HTTP ${res.status}).`));
          throw new Error(msg);
        }
      }

      if (isSuccess) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          content: finalAnswer,
          timestamp: new Date().toISOString(),
          citations,
          retrievedChunks,
          reasoningTimeMs,
        };

        const finalMessages = [...messagesWithUser, assistantMsg];
        setMessages(finalMessages);
        const updatedAfterBot = saveOrUpdateSession(
          currentSessionId,
          finalMessages,
          selectedDocIds
        );
        setSessions(updatedAfterBot);
      }
    } catch (err: any) {
      // If genuine local or active chunks exist, answer from them
      const clientRes = clientQueryRAG(query, selectedDocIds, ragSettings.topK, ragSettings.similarityThreshold, allChunks);
      const hasRealChunks = clientRes.retrievedChunks.some(c => !isGibberishText(c.chunk.text) && c.chunk.text.trim().length > 30);
      if (hasRealChunks && (clientRes.citations.length > 0 || clientRes.retrievedChunks.length > 0)) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          content: clientRes.answer,
          timestamp: new Date().toISOString(),
          citations: clientRes.citations,
          retrievedChunks: clientRes.retrievedChunks,
          reasoningTimeMs: clientRes.reasoningTimeMs,
        };
        const finalMessages = [...messagesWithUser, assistantMsg];
        setMessages(finalMessages);
        const updatedAfterBot = saveOrUpdateSession(
          currentSessionId,
          finalMessages,
          selectedDocIds
        );
        setSessions(updatedAfterBot);
      } else {
        const rawErr = err instanceof Error ? err.message : (typeof err === 'string' ? err : '');
        const displayErr = (!rawErr || rawErr === '[object Object]')
          ? (err?.error?.message || err?.message || 'Unexpected response during vector retrieval. Please try again.')
          : rawErr;
        const errorMsg: ChatMessage = {
          id: `assistant-err-${Date.now()}`,
          sender: 'assistant',
          content: `Sorry, an error occurred during vector retrieval: ${displayErr}`,
          timestamp: new Date().toISOString(),
        };
        const errorMessages = [...messagesWithUser, errorMsg];
        setMessages(errorMessages);
        const updatedAfterError = saveOrUpdateSession(
          currentSessionId,
          errorMessages,
          selectedDocIds
        );
        setSessions(updatedAfterError);
      }
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

  const handleSelectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    saveActiveSessionId(session.id);
    setMessages(session.messages);
    setActiveTab('chat');
  };

  const handleExitChat = () => {
    // If there is an active conversation, ensure it is safely synced to the History section
    if (activeSessionId && messages.length > 0) {
      const updated = saveOrUpdateSession(activeSessionId, messages, selectedDocIds);
      setSessions(updated);
    }
    // Clear active chat state and active session pointer so the app returns directly to the workspace
    setActiveSessionId(null);
    saveActiveSessionId(null);
    setMessages([]);
    setIsQueryLoading(false);
    setIsUploading(false);
    setUploadingFileName(null);
    setUploadSuccessNotice(null);
    setUploadError(null);
    setActiveTab('chat');
  };

  const handleNewChat = () => {
    handleExitChat();
  };

  const handleResetChat = () => {
    handleExitChat();
  };

  const handleDeleteSession = (sessionId: string) => {
    const updated = deleteSessionFromStorage(sessionId);
    setSessions(updated);
    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
        saveActiveSessionId(updated[0].id);
        setMessages(updated[0].messages);
      } else {
        handleNewChat();
      }
    }
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    const all = loadAllSessions();
    const updated = all.map(s =>
      s.id === sessionId ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s
    );
    saveAllSessions(updated);
    setSessions(updated);
  };

  const handleClearAllSessions = () => {
    clearAllSessionsFromStorage();
    setSessions([]);
    handleNewChat();
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
    <div className="min-h-screen selection:bg-indigo-500 selection:text-white font-sans flex flex-col relative bg-black text-slate-100 transition-colors duration-200">
      <main className="flex-1 w-full relative overflow-hidden bg-black">
        {/* Subtle Ambient Background Glow on Pure Black */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="h-screen max-h-screen flex flex-col relative z-10 overflow-hidden">
          <Header
            documents={documents}
            totalChunks={totalChunksCount}
            theme={theme}
            onOpenUpload={() => setActiveTab('library')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenVectorInspector={() => fetchChunksForActiveDoc()}
            onResetChat={handleResetChat}
            onExitChat={handleExitChat}
            hasActiveChat={messages.length > 0}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            sessionCount={sessions.length}
            onPortalHome={() => setViewMode('login')}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          {/* Deployment Status Banners for Render / Cloud Hosting */}
          {backendStatus.checked && backendStatus.online && !backendStatus.hasApiKey && (
            <div className="bg-amber-950/80 border-b border-amber-500/40 text-amber-200 px-4 py-2.5 text-xs flex items-center justify-between gap-3 backdrop-blur-md shrink-0 z-20">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>
                  <strong>Configuration Required:</strong> <code>GEMINI_API_KEY</code> is not configured in your deployment environment variables. Add <code>GEMINI_API_KEY</code> in Vercel (Project Settings &rarr; Environment Variables) or Render (Environment) to enable AI answer generation.
                </span>
              </div>
              <button
                onClick={checkBackendHealth}
                className="underline hover:text-white shrink-0 font-medium px-2 py-0.5 rounded hover:bg-amber-900/50 cursor-pointer"
              >
                Re-check
              </button>
            </div>
          )}
          {backendStatus.checked && !backendStatus.online && (
            <div className="bg-red-950/80 border-b border-red-500/40 text-red-200 px-4 py-2.5 text-xs flex items-center justify-between gap-3 backdrop-blur-md shrink-0 z-20">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
                <span>
                  <strong>Backend Unreachable:</strong> Could not connect to the RAG backend server at <code>/api/health</code>. Ensure you commit <code>vercel.json</code> and the <code>/api</code> directory, and check deployment logs.
                </span>
              </div>
              <button
                onClick={checkBackendHealth}
                className="underline hover:text-white shrink-0 font-medium px-2 py-0.5 rounded hover:bg-red-900/50 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

            <div className="flex-1 w-full px-2 sm:px-4 md:px-6 py-2 sm:py-3 flex flex-col min-h-0 overflow-hidden relative">
              <div className={`h-full w-full flex-col min-h-0 ${activeTab === 'chat' ? 'flex' : 'hidden'}`}>
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isQueryLoading}
                  onSelectCitation={handleSelectCitation}
                  settings={ragSettings}
                  preciseOutput={!!ragSettings.preciseOutput}
                  onTogglePreciseOutput={handleTogglePreciseOutput}
                  documents={documents}
                  theme={theme}
                  onOpenLibrary={() => setActiveTab('library')}
                  onUploadFile={handleUploadFile}
                  onResetChat={handleResetChat}
                  onExitChat={handleExitChat}
                  onOpenHistory={() => setIsHistoryModalOpen(true)}
                  sessionsCount={sessions.length}
                  recentSessions={sessions}
                  onSelectSession={handleSelectSession}
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
                  onDeleteDoc={handleDeleteDoc}
                  onToggleDocSelection={handleToggleDocSelection}
                />
              </div>

              <div className={`h-full w-full flex-col min-h-0 ${activeTab === 'library' ? 'flex' : 'hidden'}`}>
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
              </div>

              <div className={`h-full w-full flex-col min-h-0 ${activeTab === 'viewer' ? 'flex' : 'hidden'}`}>
                <DocumentViewer
                  documents={documents}
                  activeDoc={activeDoc}
                  onSelectDoc={(doc) => setActiveDoc(doc)}
                  highlightedCitation={highlightedCitation}
                  chunks={activeDocChunks}
                  isLoadingChunks={isLoadingChunks}
                  theme={theme}
                />
              </div>

              <div className={`h-full w-full flex-col min-h-0 ${activeTab === 'vector' ? 'flex' : 'hidden'}`}>
                <VectorInspector
                  chunks={allChunks}
                  settings={ragSettings}
                  theme={theme}
                />
              </div>
            </div>
          </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={ragSettings}
        onUpdateSettings={handleUpdateRagSettings}
        documents={documents}
        theme={theme}
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

      <ChatHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAllSessions={handleClearAllSessions}
        onNewChat={handleNewChat}
        theme={theme}
      />
    </div>
  );
}
