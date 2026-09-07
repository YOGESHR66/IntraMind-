import { ChatSession, ChatMessage } from '../types';

const SESSIONS_STORAGE_KEY = 'intramind_chat_sessions_v1';
const ACTIVE_SESSION_ID_KEY = 'intramind_active_session_id_v1';

export function loadAllSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Clean any leftover graphical explanation or mermaid diagrams from stored messages
    const cleaned = parsed.map((session) => {
      if (!session || !Array.isArray(session.messages)) return session;
      return {
        ...session,
        messages: session.messages.map((m: ChatMessage) => {
          if (m.sender !== 'assistant' || !m.content) return m;
          const content = m.content
            .replace(/#{1,4}\s*(?:📊\s*)?Graphical Explanation[\s\S]*?(?=(?:#{1,4}\s|\n\n[•\d]|$))/gi, '')
            .replace(/```(?:mermaid)?\s*[\r\n]+(?:graph|flowchart|sequenceDiagram|classDiagram)[\s\S]*?```/gi, '')
            .replace(/(?:^|\n)graph\s+(?:TD|LR|TB|RL)[\s\S]*?(?=(?:\n\n|\n#{1,4}|$))/gi, '')
            .trim();
          return { ...m, content };
        }),
      };
    });
    // Sort descending by updatedAt
    return cleaned.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  } catch (err) {
    console.warn('Failed to read chat sessions from localStorage:', err);
    return [];
  }
}

export function saveAllSessions(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn('Failed to save chat sessions to localStorage:', err);
  }
}

export function loadActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
  } catch {
    return null;
  }
}

export function saveActiveSessionId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
    }
  } catch (err) {
    console.warn('Failed to store active session id:', err);
  }
}

export function generateSessionTitle(query: string, docNames?: string[]): string {
  const trimmed = query.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) {
    if (docNames && docNames.length > 0) {
      return `Chat about ${docNames[0]}`;
    }
    return 'Untitled Conversation';
  }
  if (trimmed.length <= 48) {
    return trimmed;
  }
  return trimmed.slice(0, 45) + '...';
}

export function saveOrUpdateSession(
  sessionId: string,
  messages: ChatMessage[],
  docIds?: string[],
  existingTitle?: string
): ChatSession[] {
  if (messages.length === 0) return loadAllSessions();

  const sessions = loadAllSessions();
  const now = new Date().toISOString();
  const existingIdx = sessions.findIndex(s => s.id === sessionId);

  const firstUserMsg = messages.find(m => m.sender === 'user');
  const fallbackTitle = firstUserMsg ? generateSessionTitle(firstUserMsg.content) : 'New Chat';
  const title = existingTitle || (existingIdx >= 0 ? sessions[existingIdx].title : fallbackTitle);

  const updatedSession: ChatSession = {
    id: sessionId,
    title,
    createdAt: existingIdx >= 0 ? sessions[existingIdx].createdAt : now,
    updatedAt: now,
    messages,
    docIds: docIds || (existingIdx >= 0 ? sessions[existingIdx].docIds : []),
    lastQuery: firstUserMsg?.content || '',
  };

  let updatedList: ChatSession[];
  if (existingIdx >= 0) {
    updatedList = [...sessions];
    updatedList[existingIdx] = updatedSession;
  } else {
    updatedList = [updatedSession, ...sessions];
  }

  // Keep latest 50 sessions to prevent unbounded storage growth
  if (updatedList.length > 50) {
    updatedList = updatedList.slice(0, 50);
  }

  saveAllSessions(updatedList);
  saveActiveSessionId(sessionId);
  return updatedList;
}

export function deleteSessionFromStorage(sessionId: string): ChatSession[] {
  const sessions = loadAllSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  saveAllSessions(filtered);
  if (loadActiveSessionId() === sessionId) {
    const nextActive = filtered.length > 0 ? filtered[0].id : null;
    saveActiveSessionId(nextActive);
  }
  return filtered;
}

export function clearAllSessionsFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
  } catch (err) {
    console.warn('Failed to clear sessions:', err);
  }
}

export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}
