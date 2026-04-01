// React компонент для теста чистоты
import React from 'react';
import { createRoot } from 'react-dom/client';

const POLL_DATA = [
  {id:'freq',title:'How often',subtitle:'do you clean?',options:[{id:'daily',text:'Daily',emoji:'✨',score:100},{id:'weekly',text:'Weekly',emoji:'🧹',score:70},{id:'monthly',text:'Monthly',emoji:'🕸️',score:40},{id:'never',text:'Rarely',emoji:'🍄',score:10}]},
  {id:'method',title:'Main cleaning',subtitle:'tool?',options:[{id:'ultrasonic',text:'Ultrasonic',emoji:'🔋',score:100},{id:'iso',text:'ISO Alcohol',emoji:'🧪',score:90},{id:'soap',text:'Soap & Water',emoji:'🧼',score:60},{id:'nothing',text:'Just Water',emoji:'🚰',score:30}]},
  {id:'residue',title:'Visible',subtitle:'residue?',options:[{id:'none',text:'Crystal Clear',emoji:'💎',score:100},{id:'slight',text:'Minor Spots',emoji:'🔍',score:70},{id:'cloudy',text:'Cloudy Film',emoji:'🌫️',score:40},{id:'heavy',text:'Heavy Buildup',emoji:'🌑',score:10}]},
  {id:'odor',title:'How does',subtitle:'it smell?',options:[{id:'fresh',text:'Fresh',emoji:'🌿',score:100},{id:'neutral',text:'Neutral',emoji:'⚪',score:80},{id:'stale',text:'Stale',emoji:'🍂',score:40},{id:'funky',text:'Funky',emoji:'🦨',score:10}]}
];

function PurityAudit() {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState([]);
  const [view, setView] = React.useState('intro');
  const [score, setScore] = React.useState(0);
  const [insight, setInsight] = React.useState('');

  const calcScore = (ans) => Math.round(ans.reduce((a,b) => a + POLL_DATA[b.q].options.find(o => o.id === b.id).score, 0) / POLL_DATA.length);
  const getInsight = (s) => s >= 90 ? "Lab-grade purity! You're a hygiene master." : s >= 70 ? "Solid hygiene. Small improvements ahead." : s >= 40 ? "Microbes are moving in. Time to clean!" : "Biohazard alert! Deep clean immediately.";

  const vote = (optId) => {
    const newAns = [...answers, {id: optId, q: step}];
    if (step < POLL_DATA.length - 1) {
      setAnswers(newAns);
      setStep(step + 1);
    } else {
      const final = calcScore(newAns);
      setScore(final);
      setInsight(getInsight(final));
      setAnswers(newAns);
      setView('result');
    }
  };

  const reset = () => { setStep(0); setAnswers([]); setView('intro'); };

  if (view === 'intro') {
    return (
      <div className="card" style={{textAlign:'center', padding:'36px'}}>
        <div style={{fontSize:'3rem', marginBottom:'16px'}}>🧼</div>
        <h3 style={{fontFamily:'var(--font-display)', fontSize:'40px', marginBottom:'8px'}}>Purity Audit</h3>
        <p style={{color:'var(--text-secondary)', marginBottom:'24px'}}>Diagnose what lives in your glass.</p>
        <button onClick={() => setView('voting')} className="btn-primary">Start Diagnostic</button>
      </div>
    );
  }

  if (view === 'voting') {
    const q = POLL_DATA[step];
    return (
      <div className="card" style={{padding:'32px'}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'16px'}}>
          <span style={{fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-secondary)', textTransform:'uppercase'}}>Step {step+1}/{POLL_DATA.length}</span>
          <div style={{display:'flex', gap:'4px'}}>
            {POLL_DATA.map((_, i) => <div key={i} style={{height:'3px', width:'20px', borderRadius:'2px', background: i <= step ? 'var(--accent)' : 'rgba(255,255,255,.15)'}}></div>)}
          </div>
        </div>
        <h4 style={{fontFamily:'var(--font-cond)', fontSize:'28px', fontWeight:700, textAlign:'center', lineHeight:1.1, marginBottom:'24px'}}>{q.title}<br/><span style={{color:'var(--accent)'}}>{q.subtitle}</span></h4>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          {q.options.map(opt => (
            <button key={opt.id} onClick={() => vote(opt.id)} style={{display:'flex', flexDirection:'column', alignItems:'center', padding:'16px 10px', background:'rgba(255,255,255,.04)', border:'1px solid var(--border-light)', borderRadius:'16px', cursor:'pointer', transition:'.2s', color:'var(--text-primary)'}} onMouseOver={e=>{e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.background='var(--accent-dim)';}} onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.background='rgba(255,255,255,.04)';}}>
              <span style={{fontSize:'2rem'}}>{opt.emoji}</span>
              <span style={{fontFamily:'var(--font-cond)', fontSize:'13px', fontWeight:600, marginTop:'6px', textTransform:'uppercase', letterSpacing:'.06em'}}>{opt.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{textAlign:'center', padding:'36px'}}>
      <div style={{position:'relative', width:'120px', height:'120px', margin:'0 auto 20px'}}>
        <svg style={{width:'100%', height:'100%', transform:'rotate(-90deg)'}} viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="10"/>
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent)" strokeWidth="12" strokeDasharray="314" strokeDashoffset={314 - (314 * score / 100)} style={{transition:'stroke-dashoffset 1.5s ease'}}/>
        </svg>
        <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
          <span style={{fontFamily:'var(--font-display)', fontSize:'36px', color:'var(--accent)'}}>{score}%</span>
          <span style={{fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-secondary)', textTransform:'uppercase'}}>Purity</span>
        </div>
      </div>
      <p style={{fontStyle:'italic', color:'rgba(255,255,255,.8)', marginBottom:'24px'}}>“{insight}”</p>
      <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
        <a href="#" className="btn-primary" style={{display:'inline-flex', justifyContent:'center'}} onClick={() => window.showPage('hygiene')}>Learn Hygiene Science →</a>
        <button onClick={reset} className="btn-ghost" style={{justifyContent:'center'}}>Restart Audit</button>
      </div>
    </div>
  );
}

export function mountPurityAudit(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    const root = createRoot(container);
    root.render(<PurityAudit />);
  }
}