import { useEffect, useRef } from 'react';
import * as C from '../logic/coliseo.js';
import { fmt, sgn, COL } from '../utils/format.js';
import { finalData } from '../utils/result.js';

function FinalTeam({ t, st }) {
  const dev = t.total - st.avg, cls = C.deviationClass(t.total - C.TARGET);
  return (
    <div className={`card team st-${cls}`} style={{ '--c': COL[t.captain] }}>
      <h3><span>{C.CAP_LABEL[t.captain]}</span><span className="capmmr">{fmt(t.cap.mmr)}</span></h3>
      <div className="tag">⚔ CAPITÁN</div>
      {t.members.map(m => (
        <div key={m.id} className="slot"><span>{m.name}<span className="pos">P{m.pos}</span></span><span className="m">{fmt(m.mmr)}</span></div>
      ))}
      <div className="total"><span className="tag" style={{ color: 'var(--mut)' }}>MMR EQUIPO</span><span className="n">{fmt(t.total)}</span></div>
      <div className="kv"><span>Dif. vs promedio</span><b className={dev >= 0 ? 'pos-d' : 'neg-d'}>{sgn(dev)}</b></div>
    </div>
  );
}

export default function FinalScreen({ state, copyText, onPng, onCopy, onBack, onNew }) {
  const { st, bl, rank } = finalData(state);
  const taRef = useRef(null);
  useEffect(() => { if (copyText && taRef.current) taRef.current.select(); }, [copyText]);

  return (
    <>
      <div className="display" style={{ textAlign: 'center', fontSize: 'clamp(22px,5vw,36px)', color: 'var(--gold2)', margin: '10px 0' }}>⚔ EQUIPOS DEFINITIVOS ⚔</div>
      <div className="teams">{rank.map(t => <FinalTeam key={t.captain} t={t} st={st} />)}</div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="hd"><span>TABLA COMPARATIVA</span></div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>#</th><th>Equipo</th><th>Capitán</th><th>Integrantes</th><th className="r">MMR total</th><th className="r">Diferencia</th></tr></thead>
            <tbody>
              {rank.map((t, i) => (
                <tr key={t.captain}>
                  <td>{i + 1}</td><td>Equipo {C.CAP_LABEL[t.captain]}</td><td>{t.cap.name} ({fmt(t.cap.mmr)})</td>
                  <td>{t.members.map(m => m.name).join(', ')}</td>
                  <td className="r"><b>{fmt(t.total)}</b></td>
                  <td className={'r ' + (t.total - st.avg >= 0 ? 'pos-d' : 'neg-d')}>{sgn(t.total - st.avg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="stats">
        <div className="card stat"><div className="l">Mayor MMR</div><div className="v">{C.CAP_LABEL[st.maxTeam]} · {fmt(st.max)}</div></div>
        <div className="card stat"><div className="l">Menor MMR</div><div className="v">{C.CAP_LABEL[st.minTeam]} · {fmt(st.min)}</div></div>
        <div className="card stat"><div className="l">Diferencia máxima</div><div className="v">{fmt(st.spread)}</div></div>
        <div className="card stat"><div className="l">Promedio de equipos</div><div className="v">{st.avg.toFixed(2)}</div></div>
        <div className="card stat"><div className="l">Límite por equipo</div><div className="v">{fmt(C.LIMIT)} <span style={{ fontSize: 14, color: rank.every(t => t.total <= C.LIMIT) ? 'var(--green)' : 'var(--rojo)' }}>{rank.every(t => t.total <= C.LIMIT) ? '✔ cumplido' : '✘ superado'}</span></div></div>
        <div className="card stat"><div className="l">Dentro de {fmt(C.LOWER_GUIDE)} a {fmt(C.LIMIT)}</div><div className="v">{rank.filter(t => t.total >= C.LOWER_GUIDE && t.total <= C.LIMIT).length} / 4</div></div>
        <div className="card stat"><div className="l">Equilibrio del torneo</div><div className="v"><span className={`pill ${bl.cls}`} style={{ fontSize: 18 }}>{bl.label}</span></div></div>
      </div>
      <div className="bar">
        <button className="btn red" onClick={onPng}>Descargar imagen (PNG)</button>
        <button className="btn" onClick={onCopy}>Copiar resultado</button>
        <button className="btn" onClick={onBack}>Volver al draft</button>
        <button className="btn" onClick={onNew}>Nueva edición</button>
      </div>
      {copyText && (
        <div className="card" style={{ padding: 12 }}>
          <div className="hint" style={{ padding: '0 0 6px' }}>Selecciona y copia el texto:</div>
          <textarea ref={taRef} className="copybox" readOnly value={copyText} />
        </div>
      )}
    </>
  );
}
