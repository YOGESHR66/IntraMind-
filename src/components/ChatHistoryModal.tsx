import React, { useState } from 'react';
import {
  X,
  History,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  Search,
  Plus,
  ArrowRight,
  Clock,
  Download,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { ChatSession } from '../types';
import { formatTimeAgo } from '../lib/chatStorage';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onClearAllSessions: () => void;
  onNewChat: () => void;
  theme?: 'light' | 'dark';
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  onNewChat,
  theme = 'dark',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = session.title.toLowerCase().includes(q);
    const contentMatch = session.messages.some(m => m.content.toLowerCase().includes(q));
    return titleMatch || contentMatch;
  });

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (sessionId: string, e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(sessionId, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSession(sessionId);
  };

  const handleExportMarkdown = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const lines = [
      `# ${session.title}`,
      `*Created: ${new Date(session.createdAt).toLocaleString()}*`,
      '',
      ...session.messages.map(m => {
        const role = m.sender === 'user' ? '👤 **User**' : '🤖 **IntraMind AI**';
        let chunk = `${role} *(${new Date(m.timestamp).toLocaleTimeString()})*:\n\n${m.content}\n`;
        if (m.citations && m.citations.length > 0) {
          chunk += '\n**Sources Referenced:**\n';
          m.citations.forEach(c => {
            chunk += `- [${c.sourceId}] ${c.docName} (Page ${c.pageNumber}, score: ${Math.round(c.similarity * 100)}%)\n`;
          });
        }
        return chunk;
      })
    ];
    const blob = new Blob([lines.join('\n\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)}_transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border transition-colors ${
          theme === 'dark'
            ? 'bg-neutral-950 border-neutral-800 text-slate-100 shadow-black/80'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 flex items-center justify-between border-b ${
            theme === 'dark' ? 'border-neutral-800 bg-neutral-900' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <History className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>Chat History</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    theme === 'dark'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}
                >
                  {sessions.length} saved
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Revisit, load, and manage your past conversations stored in local storage
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/20 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
              }`}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className={`p-3 sm:px-5 sm:py-3 border-b flex items-center gap-2.5 ${
          theme === 'dark' ? 'border-white/10 bg-[#121318]' : 'border-slate-200 bg-white'
        }`}>
          <div className={`flex items-center gap-2 flex-1 px-3 py-1.5 rounded-xl border text-xs ${
            theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}>
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previous chat questions or answers..."
              className="bg-transparent border-0 focus:outline-none w-full placeholder:text-slate-400 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {sessions.length > 0 && (
            confirmClearAll ? (
              <div className="flex items-center gap-1 shrink-0 animate-in fade-in">
                <span className="text-[11px] text-rose-400 font-semibold hidden sm:inline">Delete all?</span>
                <button
                  onClick={() => {
                    onClearAllSessions();
                    setConfirmClearAll(false);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Yes, Clear All
                </button>
                <button
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClearAll(true)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
                  theme === 'dark'
                    ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
                    : 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                }`}
                title="Clear all saved chat history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear History</span>
              </button>
            )
          )}
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5 min-h-[220px]">
          {filteredSessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm">
                {searchQuery ? 'No matching conversations found' : 'No previous chat sessions yet'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                {searchQuery
                  ? 'Try searching for different keywords or clear the filter.'
                  : 'Your questions and assistant responses will be automatically saved here so you can revisit them anytime.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    onNewChat();
                    onClose();
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start New Conversation</span>
                </button>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = editingSessionId === session.id;
              const firstUserMsg = session.messages.find(m => m.sender === 'user');
              const lastAssistantMsg = [...session.messages].reverse().find(m => m.sender === 'assistant');

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectSession(session);
                      onClose();
                    }
                  }}
                  className={`group relative p-3 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive
                      ? theme === 'dark'
                        ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                        : 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-200'
                      : theme === 'dark'
                        ? 'bg-[#181a22] hover:bg-[#1f222d] border-white/5 hover:border-white/15'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isActive && (
                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active Session</span>
                        </span>
                      )}

                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(session.updatedAt || session.createdAt)}</span>
                      </span>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          theme === 'dark' ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {session.messages.length} message{session.messages.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {isEditing ? (
                      <div
                        className="flex items-center gap-2 mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(session.id);
                            if (e.key === 'Escape') setEditingSessionId(null);
                          }}
                          autoFocus
                          className={`px-2 py-1 text-xs font-bold rounded border focus:outline-none w-full max-w-xs ${
                            theme === 'dark'
                              ? 'bg-slate-900 border-indigo-500 text-white'
                              : 'bg-white border-indigo-500 text-slate-900'
                          }`}
                        />
                        <button
                          onClick={(e) => handleSaveRename(session.id, e)}
                          className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                          title="Save Title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingSessionId(null)}
                          className="p-1 bg-slate-700 hover:bg-slate-600 text-white rounded cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <h4 className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                        <span>{session.title}</span>
                      </h4>
                    )}

                    {/* Preview of prompt / response */}
                    {firstUserMsg && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        <span className="font-semibold text-slate-300">Q:</span> {firstUserMsg.content}
                      </p>
                    )}
                    {lastAssistantMsg && lastAssistantMsg !== firstUserMsg && (
                      <p className="text-[11px] text-slate-500 truncate">
                        <span className="font-semibold text-slate-400">A:</span>{' '}
                        {lastAssistantMsg.content.slice(0, 90)}...
                      </p>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div
                    className="flex items-center gap-1 sm:gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => handleStartRename(session, e)}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-200'
                      }`}
                      title="Rename Conversation"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleExportMarkdown(session, e)}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-200'
                      }`}
                      title="Download Markdown Transcript"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(session.id, e)}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer ${
                        theme === 'dark' ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                      }`}
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectSession(session);
                        onClose();
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ml-1 ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white'
                      }`}
                    >
                      <span>{isActive ? 'Current' : 'Load'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-3 px-5 border-t text-[11px] text-slate-400 flex items-center justify-between ${
            theme === 'dark' ? 'border-white/10 bg-[#121318]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <span>Sessions automatically persist in your browser's local storage.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
