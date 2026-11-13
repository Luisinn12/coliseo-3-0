import * as C from '../logic/coliseo.js';
import { fmt, sgn, COL } from '../utils/format.js';

export default function TeamCard({ team: t, proj, tn, flashCap, newPick, allowed, poolSize }) {
  const dev = t.total - C.TARGET, pdev = proj - C.TARGET;
  const cls = C.deviationClass(t.size === 5 ? dev : pdev);
  const active = tn && !tn.done && tn.captain === t.captain;
  const pct = t.total / C.TARGET * 100;
  const room = C.LIMIT - t.total;
  const limPct = Math.min(100, t.total / C.LIMIT * 100);
  const full = t.size >= 5;
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
      <div className="kv"><span>Límite máximo</span><b>{fmt(C.LIMIT)}</b></div>
      <div className="kv"><span>MMR disponible hasta el límite</span><b className={room < 0 ? 'neg-d' : ''}>{fmt(room)}</b></div>
      <div className="limbar" title={`Límite ${fmt(C.LIMIT)} · objetivo ${fmt(C.TARGET)}`}>
        <div style={{ width: limPct.toFixed(1) + '%' }}></div>
        <i style={{ left: (C.TARGET / C.LIMIT * 100).toFixed(2) + '%' }}></i>
        <i className="lim"></i>
      </div>
      <div className="kv"><span>Selecciones permitidas ahora</span><b>{full ? '—' : `${allowed}/${poolSize}`}</b></div>
      <div style={{ marginTop: 6 }}>
        <span className={`pill ${cls}`}>{cls === 'green' ? 'MUY CERCA' : cls === 'yellow' ? 'DESVÍO MODERADO' : 'DESVÍO ALTO'}</span>{' '}
        {full
          ? <span className="pill green">EQUIPO COMPLETO</span>
          : <span className={'pill ' + (allowed > 0 ? 'green' : 'red')}>{allowed > 0 ? 'SELECCIÓN PERMITIDA' : 'SELECCIÓN BLOQUEADA'}</span>}
      </div>
    </div>
  );
}
