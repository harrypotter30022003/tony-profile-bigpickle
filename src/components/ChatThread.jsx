import React, { useRef, useEffect, useState } from 'react';
import AvatarScene from './AvatarScene';

export default function ChatThread({ messages, onSend, isLoading, isMuted, onToggleMute, name, onClose }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--bg-secondary)',
      }}>
        <AvatarScene ref={avatarRef} isMuted={isMuted} isVisible={true} />
        <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-muted)' }}>
          {name ? `Chatting with ${name}` : 'Tony\'s AI Assistant'}
        </div>
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute avatar' : 'Mute avatar'}
          style={iconBtnStyle}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        {onClose && (
          <button onClick={onClose} title="Close" style={iconBtnStyle}>
            ✕
          </button>
        )}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
            marginTop: '40px',
          }}>
            Ask me anything about tech, project management, or my experience!
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
          }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '14px',
              lineHeight: '1.5',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #7b2cbf, #00f5d4)'
                : 'var(--glass)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
              color: 'var(--text)',
              wordBreak: 'break-word',
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '13px' }}>
            <TypingDots />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--glass-border)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #00f5d4, #7b2cbf)',
              color: '#fff',
              fontWeight: 600,
              cursor: isLoading || !input.trim() ? 'default' : 'pointer',
              opacity: isLoading || !input.trim() ? 0.5 : 1,
              fontSize: '14px',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '3px', padding: '4px 0' }}>
      <span style={dotStyle(0)} />
      <span style={dotStyle(0.2)} />
      <span style={dotStyle(0.4)} />
    </span>
  );
}

const dotStyle = (delay) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: 'var(--text-muted)',
  animation: `pulse 1.4s ease-in-out ${delay}s infinite`,
});

const iconBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  padding: '4px',
  color: 'var(--text-muted)',
};
