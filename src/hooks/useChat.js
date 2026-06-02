import { useState, useRef, useCallback } from 'react';

const SESSION_KEY = 'tony_chat_session';

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [entryData, setEntryData] = useState(() => {
    const s = loadSession();
    return s ? { name: s.name, sessionToken: s.sessionToken } : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [challenge, setChallenge] = useState(null);
  const sessionTokenRef = useRef(entryData?.sessionToken || null);
  const nameRef = useRef(entryData?.name || '');

  const submitEntry = useCallback(async ({ name, email, captchaAnswer, captchaId }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, captchaAnswer, captchaId,
          t: String(Date.now()),
          website_url: '',
          website: '',
          sessionToken: sessionTokenRef.current,
        }),
      });
      const data = await res.json();

      if (data.challenge) {
        setChallenge(data.challenge);
        setError(data.error || null);
        return false;
      }
      if (data.error) {
        setError(data.error);
        return false;
      }
      if (data.sessionToken) {
        sessionTokenRef.current = data.sessionToken;
        nameRef.current = data.name;
        const entry = { name: data.name, sessionToken: data.sessionToken };
        setEntryData(entry);
        saveSession(entry);
        setChallenge(null);
        setError(null);
        return true;
      }
      return false;
    } catch (_err) {
      setError('Connection error. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;
    const userMsg = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          sessionToken: sessionTokenRef.current,
        }),
      });
      const data = await res.json();

      if (data.reply) {
        const botMsg = { role: 'assistant', text: data.reply };
        setMessages(prev => [...prev, botMsg]);

        if (data.sessionToken && data.sessionToken !== sessionTokenRef.current) {
          sessionTokenRef.current = data.sessionToken;
          saveSession({ name: nameRef.current, sessionToken: data.sessionToken });
        }

        if (!isMuted && window.webspeechSpeak) {
          window.webspeechSpeak(data.reply);
        }
      }
      if (data.entry) {
        setEntryData(null);
        localStorage.removeItem(SESSION_KEY);
      }
      if (data.error) {
        setError(data.error);
      }
    } catch (_err) {
      setError('Failed to send message.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isMuted]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setEntryData(null);
    setChallenge(null);
    setError(null);
    sessionTokenRef.current = null;
    nameRef.current = '';
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);

  return {
    messages,
    entryData,
    isLoading,
    error,
    isMuted,
    challenge,
    submitEntry,
    sendMessage,
    clearChat,
    toggleMute,
  };
}
