import React, { useState } from 'react';

export default function ChatEntryForm({ onSubmit, isLoading, error, challenge }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      captchaAnswer: captchaValue.trim(),
      captchaId: challenge?.id,
    });
  };

  const btnClass = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #00f5d4, #7b2cbf)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
    width: '100%',
    opacity: isLoading ? 0.7 : 1,
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Your Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. John"
          required
          disabled={isLoading}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="john@example.com"
          required
          disabled={isLoading}
          style={inputStyle}
        />
      </div>

      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
        <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {challenge && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
            {challenge.question}
          </label>
          <input
            type="text"
            value={captchaValue}
            onChange={e => setCaptchaValue(e.target.value)}
            placeholder="Your answer"
            required
            disabled={isLoading}
            style={inputStyle}
          />
        </div>
      )}

      {error && (
        <div style={{ color: '#ff006e', fontSize: '13px', marginBottom: '8px' }}>{error}</div>
      )}

      <button type="submit" disabled={isLoading} style={btnClass}>
        {isLoading ? 'Verifying...' : 'Start Chatting'}
      </button>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
        Your info is only used for this chat session.
      </p>
    </form>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  background: 'var(--bg-secondary)',
  color: 'var(--text)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};
