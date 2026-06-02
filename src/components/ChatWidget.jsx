import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../hooks/useChat';
import ChatEntryForm from './ChatEntryForm';
import ChatThread from './ChatThread';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    messages, entryData, isLoading, error, isMuted, challenge,
    submitEntry, sendMessage, toggleMute,
  } = useChat();

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.setProperty('--chat-z', '1000');
    }
  }, [isOpen]);

  return (
    <>
      <style>{chatStyles}</style>

      <div className="chat-fab" onClick={toggleOpen} role="button" tabIndex={0} aria-label="Toggle chat">
        {isOpen ? '✕' : (
          <div className="chat-fab-inner">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="chat-panel">
          {!entryData ? (
            <div className="chat-panel-inner">
              <div className="chat-header">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>Chat with Tony</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Enter your details to start
                  </div>
                </div>
                <button className="chat-close-btn" onClick={toggleOpen}>✕</button>
              </div>
              <ChatEntryForm
                onSubmit={submitEntry}
                isLoading={isLoading}
                error={error}
                challenge={challenge}
              />
            </div>
          ) : (
            <ChatThread
              messages={messages}
              onSend={sendMessage}
              isLoading={isLoading}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onClose={toggleOpen}
              name={entryData.name}
            />
          )}
        </div>
      )}
    </>
  );
}

const chatStyles = `
.chat-fab {
  position: fixed;
  bottom: 106px;
  right: 30px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00f5d4, #7b2cbf);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,245,212,0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: none;
  color: #fff;
  font-size: 22px;
}
.chat-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 24px rgba(0,245,212,0.4);
}
.chat-fab-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-panel {
  position: fixed;
  bottom: 174px;
  right: 24px;
  width: 380px;
  height: 560px;
  max-height: calc(100vh - 140px);
  background: var(--bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  overflow: hidden;
  z-index: 999;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  animation: chatSlideUp 0.25s ease;
}

@keyframes chatSlideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.chat-panel-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--glass-border);
}

.chat-close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.chat-close-btn:hover {
  background: var(--glass);
}

@media (max-width: 480px) {
  .chat-panel {
    right: 8px;
    left: 8px;
    bottom: 170px;
    width: auto;
    height: 60vh;
  }
  .chat-fab {
    bottom: 106px;
    right: 16px;
  }
}
`;
