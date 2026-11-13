import * as C from '../logic/coliseo.js';
import { fmt, sgn, COL } from '../utils/format.js';

export default function TeamCard({ team: t, proj, tn, flashCap, newPick }) {
  const dev = t.total - C.TARGET, pdev = proj - C.TARGET;
  const cls = C.deviationClass(t.size === 5 ? dev : pdev);
  const active = tn && !tn.done && tn.captain === t.captain;
  const pct = t.total / C.TARGET * 100;
  const slots = [];
  for (let i = 0; i < 4; i++) {
    const m = t.members[i];
    if (m) {
      const isNew = newPick && newPick === m.id;
      slots.push(
        <div key={i} className={'slot' + (isNew ? ' new' : '')}>
          <span>{m.name}<span className="pos">P{m.pos}</span></span>
          <span className="m">{fmt(m.mmr)}</span>
        </div>
      );
    } else {
      slots.push(
        <div key={i} className="slot empty"><span>— selección {i + 1} —</span><span>·</span></div>
      );
    }
  }
  return (
    <div className={`card team st-${cls}${active ? ' active' : ''}${flashCap === t.captain ? ' flash' : ''}`} id={`team-${t.captain}`} style={{ '--c': COL[t.captain] }}>
      <h3><span>{C.CAP_LABEL[t.captain]}</span><span className="capmmr">{fmt(t.cap.mmr)}</span></h3>
      <div className="tag">⚔ CAPITÁN · {t.members.length}/4 SELECCIONES {active ? '· ¡TURNO!' : ''}</div>
      {slots}
      <div className="total"><span className="tag" style={{ color: 'var(--mut)' }}>MMR EQUIPO</span><span className="n">{fmt(t.total)}</span></div>
      <div className="meter"><div style={{ width: Math.min(100, pct).toFixed(1) + '%' }}></div></div>
      <div className="kv"><span>Restante p/ {fmt(C.TARGET)}</span><b>{fmt(C.TARGET - t.total)}</b></div>
      <div className="kv"><span>Dif. vs promedio ideal</span><b className={dev >= 0 ? 'pos-d' : 'neg-d'}>{sgn(dev)}</b></div>
      <div className="kv"><span>Cumplimiento</span><b>{pct.toFixed(1)}%</b></div>
      {t.size < 5 && (
        <div className="kv"><span>Proyección final</span><b>{fmt(proj)} ({sgn(pdev)})</b></div>
      )}
      <div style={{ marginTop: 6 }}>
        <span className={`pill ${cls}`}>{cls === 'green' ? 'MUY CERCA' : cls === 'yellow' ? 'DESVÍO MODERADO' : 'DESVÍO ALTO'}</span>
      </div>
    </div>
  );
}
