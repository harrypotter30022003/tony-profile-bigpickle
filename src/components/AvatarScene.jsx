import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const VI_PATTERN = /[àáạãảâầấậẫẩăằắặẵẳèéẹẽẻêềếệễểìíịĩỉòóọõỏôồốộỗổơờớợỡởùúụũủưừứựữửỳýỵỹỷđ]/i;

function getBestVoice(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (VI_PATTERN.test(text)) {
    return voices.find(v => v.lang.startsWith('vi')) || null;
  }
  return voices.find(v => v.lang.startsWith('en')) || null;
}

const AvatarScene = forwardRef(function AvatarScene({ isMuted, isVisible }, ref) {
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    speak(text) {
      if (isMuted || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getBestVoice(text);
      if (voice) utterance.voice = voice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    },
    stop() {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    },
  }), [isMuted]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.webspeechSpeak = (text) => {
      if (isMuted || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getBestVoice(text);
      if (voice) utterance.voice = voice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    };
    return () => { window.webspeechSpeak = null; };
  }, [isMuted]);

  useEffect(() => {
    if (!isVisible) return;
    let mounted = true;

    async function initTalkingHead() {
      try {
        const { TalkingHead } = await import('@met4citizen/talkinghead');
        if (!mounted || !canvasRef.current) return;
        const th = new TalkingHead(canvasRef.current, {
          avatarPath: '/avatars/tony.glb',
          autoPlay: false,
        });
        await th.init();
      } catch {
        // noop - GLB not available yet
      }
    }

    initTalkingHead();
    return () => { mounted = false; };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div style={{
      width: '140px',
      height: '180px',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      flexShrink: 0,
    }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginTop: '8px' }}>👤</div>
      </div>
    </div>
  );
});

export default AvatarScene;
