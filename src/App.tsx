import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { LoginModal } from './components/LoginModal';
import { Header } from './components/Header';
import { DocumentLibrary } from './components/DocumentLibrary';
import { DocumentViewer } from './components/DocumentViewer';
import { VectorInspector } from './components/VectorInspector';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { PDFDocument, DocumentChunk, ChatMessage, Citation, RAGSettings } from './types';
import { fetchApi } from './lib/api';

export default function App() {
  const [viewMode, setViewMode] = useState<'login' | 'app'>('login');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadingFileName(file.name);
    setUploadError(null);
    setUploadSuccessNotice(null);
    setLastFailedFile(null);

    let attempts = 0;
    const maxUploadAttempts = 2;

    while (attempts < maxUploadAttempts) {
      attempts++;
      try {
        const formData = new FormData();
        formData.append('file', file, file.name);

        const res = await fetchApi('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const contentType = res.headers.get('content-type') || '';
        let data: any = {};
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const rawText = await res.text();
          if (rawText.includes('Cookie check') || rawText.includes('color-scheme') || rawText.includes('<html')) {
            if (attempts < maxUploadAttempts) {
              await new Promise((r) => setTimeout(r, 400 * attempts));
              continue;
            }
            throw new Error(`Upload preview session establishing. Please click "Retry Upload" for ${file.name}.`);
          }
          throw new Error(`Server response error (${res.status}). Please click "Retry Upload".`);
        }

        if (!res.ok) {
          throw new Error(data.error || 'Failed to process document');
        }

        await fetchDocuments();
        if (data.document) {
          const doc: PDFDocument = data.document;
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
        break;
      } catch (err: any) {
        if (attempts >= maxUploadAttempts) {
          setLastFailedFile(file);
          const errMsg = err instanceof Error ? err.message : String(err);
          let cleanErr = errMsg
            .replace(/<[^>]*>?/gm, '')
            .replace(/:\s*root\s*\{[^}]*\}/gi, '')
            .replace(/body\s*\{[^}]*\}/gi, '')
            .trim();

          if (cleanErr.includes('Failed to fetch') || cleanErr.includes('fetch')) {
            cleanErr = `Connection interrupted. Click "Retry Upload" to index ${file.name}.`;
          }

          setUploadError(cleanErr || `Failed to index ${file.name}. Please click "Retry Upload".`);
          setIsUploading(false);
          setUploadingFileName(null);
        } else {
          await new Promise((r) => setTimeout(r, 400 * attempts));
        }
      }
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
      <LoginPage
        onEnterApp={() => setViewMode('app')}
        onOpenLoginModal={() => setIsLoginOpen(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0a18] selection:bg-indigo-500 selection:text-white font-sans text-slate-100 flex flex-col relative">
      <main className="flex-1 w-full relative overflow-hidden">
        {/* Subtle Ambient Background Glow for Standard Workspace Mode */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="pb-8 min-h-screen flex flex-col relative z-10">
          <Header
            documents={documents}
            totalChunks={totalChunksCount}
            onOpenUpload={() => setActiveTab('library')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenVectorInspector={() => fetchChunksForActiveDoc()}
            onResetChat={handleResetChat}
            onPortalHome={() => setViewMode('login')}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

            <div className="flex-1 w-full px-3 sm:px-6 md:px-8 py-3 min-h-[600px] flex flex-col">
              {activeTab === 'chat' && (
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isQueryLoading}
                  onSelectCitation={handleSelectCitation}
                  settings={ragSettings}
                  documents={documents}
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
                />
              )}

              {activeTab === 'library' && (
                <DocumentLibrary
                  documents={documents}
                  selectedDocIds={selectedDocIds}
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
                />
              )}

              {activeTab === 'vector' && (
                <VectorInspector
                  chunks={allChunks}
                  settings={ragSettings}
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
