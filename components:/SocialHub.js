import React from 'react';
import { createRoot } from 'react-dom/client';

const SOCIALS = [
  {name:'Telegram', url:'https://t.me/donbong', icon:'✈️'},
  {name:'Instagram', url:'https://instagram.com/donbongstore', icon:'📷'},
  {name:'Facebook', url:'#', icon:'📘'},
  {name:'WhatsApp', url:'#', icon:'💬'},
  {name:'TikTok', url:'#', icon:'🎵'},
  {name:'YouTube', url:'#', icon:'▶️'},
  {name:'X', url:'#', icon:'🐦'},
  {name:'Zalo', url:'#', icon:'💚'}
];

function SocialHub() {
  return (
    <div className="social-hub">
      {SOCIALS.map(s => (
        <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="social-link" title={s.name}>{s.icon}</a>
      ))}
    </div>
  );
}

export function mountSocialHub(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    const root = createRoot(container);
    root.render(<SocialHub />);
  }
}