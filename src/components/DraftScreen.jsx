import { useEffect, useMemo, useState } from 'react';
import * as C from '../logic/coliseo.js';
import { fmt, sgn } from '../utils/format.js';
import TeamCard from './TeamCard.jsx';

export default function DraftScreen({ state, selected, onSelect, flash, onConfirm, onUndo, onReset, onFinish }) {
  const tn = C.turn(state), ts = C.teams(state), proj = C.projection(state), pool = C.available(state);
  const rec = useMemo(() => C.recommend(state), [state]);
  // disponibilidad de cada jugador para el capitán en turno (límite de MMR + draft completable)
  const opts = useMemo(() => (tn.done ? {} : C.options(state, tn.captain)), [state]);
  const allowedByTeam = useMemo(() => {
    const out = {};
    C.teams(state).forEach(t => { out[t.captain] = t.size >= 5 ? 0 : C.available(state).filter(p => C.check(state, t.captain, p.id).ok).length; });
    return out;
  }, [state]);
  const [info, setInfo] = useState(null);
  useEffect(() => { setInfo(null); }, [state.picks.length]);
  const pickPlayer = (p) => {
    if (done) return;
    const o = opts[p.id];
    if (o && !o.ok) { onSelect(null); setInfo(o.message); return; }
    setInfo(null); onSelect(p.id);
  };
  const top = rec.slice(0, 3);
  const recRank = {}; top.forEach((r, i) => { recRank[r.player.id] = i + 1; });
  const done = tn.done;
  const seq = C.snakeOrder(state.first);
  const st = C.stats(state);
  const selP = selected && C.BY_ID[selected];
  const capTeam = !done && ts.find(t => t.captain === tn.captain);
  const ideal = !done && (C.TARGET - capTeam.total) / (5 - capTeam.size);
  const selOk = selP && !done && opts[selP.id] && opts[selP.id].ok;
  const afterSel = selOk ? opts[selP.id].newTotal : null;

  return (
    <>
      <div className="turn">
        <div className="card c"><div className="lbl">Ronda</div><div className="val">{done ? '—' : tn.round + ' / 4'}</div></div>
        <div className="card c"><div className="lbl">Selección</div><div className="val">{done ? '16 / 16' : tn.number + ' / 16'}</div></div>
        <div className="card c now"><div className="lbl">Turno de</div><div className="val">{done ? '¡Draft completo!' : C.CAP_LABEL[tn.captain]}</div></div>
        <div className="card c"><div className="lbl">Le sigue</div><div className="val">{done || !tn.next ? '—' : C.CAP_LABEL[tn.next]}</div></div>
        <div className="card c"><div className="lbl">Disponibles</div><div className="val">{pool.length}</div></div>
      </div>
      <div className="seq">
        {seq.map((c, i) => (
          <i key={i} className={i < state.picks.length ? 'done' : i === state.picks.length ? 'cur' : ''} title={`Selección ${i + 1}`}>
            {i + 1}·{C.CAP_LABEL[c].split(' ').pop()}
          </i>
        ))}
      </div>
      <div className="teams">
        {ts.map((t, i) => <TeamCard key={t.captain} team={t} proj={proj[i]} tn={tn} flashCap={flash.cap} newPick={flash.pick} allowed={allowedByTeam[t.captain]} poolSize={pool.length} />)}
      </div>
      <div className="card" style={{ marginTop: 12, padding: 10 }}>
        <div className="kv" style={{ justifyContent: 'center', gap: 18, flexWrap: 'wrap', fontSize: 16 }}>
          <span>Mayor: <b>{fmt(st.max)}</b></span><span>Menor: <b>{fmt(st.min)}</b></span>
          <span>Diferencia máx.: <b>{fmt(st.spread)}</b></span><span>Objetivo: <b>{C.TARGET.toFixed(2)}</b></span>
          <span>Límite por equipo: <b>{fmt(C.LIMIT)}</b></span>
        </div>
        <div className="lim-note">Límite inferior orientativo {fmt(C.LOWER_GUIDE)} · el margen de {C.MARGIN} MMR es una tolerancia, no una meta</div>
      </div>
      <div className="main">
        <div className="card">
          <div className="hd"><span>JUGADORES DISPONIBLES ({pool.length})</span><span style={{ fontFamily: 'Rajdhani', fontSize: 13, color: 'var(--mut)' }}>Elige libremente · ★ = sugerido · 🔒 = bloqueado</span></div>
          <div className="pgrid">
            {pool.length ? pool.map(p => {
              const o = opts[p.id], locked = !done && o && !o.ok;
              return (
                <button key={p.id} className={'pl' + (selected === p.id ? ' sel' : '') + (locked ? ' locked' : '')}
                  disabled={done} aria-disabled={locked ? 'true' : undefined}
                  title={locked ? o.message : undefined} onClick={() => pickPlayer(p)}>
                  {recRank[p.id] && !locked && <span className="rc">★ {recRank[p.id]}</span>}
                  <div className="nm">{locked && <span className="lock" role="img" aria-label="bloqueado">🔒</span>}{p.name}</div>
                  <div className="mm">{fmt(p.mmr)}</div>
                  <div style={{ fontSize: 13, color: 'var(--mut)' }}>Pos favorita {p.pos}</div>
                  {locked && <div className="why">{o.reason === 'limit' ? `Excede el límite por ${fmt(o.excess)}` : 'Dejaría el draft sin solución'}</div>}
                </button>
              );
            }) : <div className="hint">No quedan jugadores.</div>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="hd"><span>RECOMENDACIONES</span></div>
            {done ? <div className="hint">Draft completo.</div> : (
              <>
                <div className="hint">Para <b>{C.CAP_LABEL[tn.captain]}</b>: MMR ideal por pick ≈ <b>{fmt(ideal)}</b>. Sólo orientan; puedes elegir a cualquiera.</div>
                <div className="rec">
                  {top.map((r, i) => (
                    <button key={r.player.id} className="it" onClick={() => pickPlayer(r.player)}>
                      <span><b>{i + 1}. {r.player.name}</b><small>Diferencia final estimada entre equipos: {fmt(r.spread)}</small></span>
                      <span className="mm" style={{ fontFamily: 'Cinzel', color: 'var(--gold2)', fontWeight: 700 }}>{fmt(r.player.mmr)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="card">
            <div className="hd"><span>HISTORIAL</span><span style={{ fontFamily: 'Rajdhani', fontSize: 13, color: 'var(--mut)' }}>{state.picks.length}/16</span></div>
            <div className="hist">
              <table>
                <thead><tr><th>#</th><th>Ronda</th><th>Capitán</th><th>Jugador</th><th className="r">MMR</th></tr></thead>
                <tbody>
                  {state.picks.length ? state.picks.slice().reverse().map((p, i) => {
                    const n = state.picks.length - i;
                    return (
                      <tr key={n}><td>{n}</td><td>{Math.floor((n - 1) / 4) + 1}</td><td>{C.CAP_LABEL[p.captain]}</td><td>{C.BY_ID[p.player].name}</td><td className="r">{fmt(C.BY_ID[p.player].mmr)}</td></tr>
                    );
                  }) : <tr><td colSpan="5" style={{ color: 'var(--mut)' }}>Aún no hay selecciones.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="dock">
        <div className={'sel' + (info ? ' warn' : selOk ? ' okmsg' : '')}>
          {done ? 'Las 16 selecciones están completas.' : info ? (
            <>🔒 {info}</>
          ) : selOk ? (
            <>✔ Selección permitida: {C.CAP_LABEL[tn.captain]} elige a <b>{selP.name}</b> ({fmt(selP.mmr)}) y queda en {fmt(afterSel)} · disponible hasta el límite: {fmt(C.LIMIT - afterSel)}</>
          ) : (
            <>Turno de <b>{C.CAP_LABEL[tn.captain]}</b>: toca un jugador para seleccionarlo</>
          )}
        </div>
        <button className="btn red" onClick={onConfirm} disabled={!selOk || done}>Confirmar selección</button>
        <button className="btn" onClick={onUndo} disabled={!state.picks.length}>Deshacer última</button>
        <button className="btn" onClick={onReset}>Reiniciar draft</button>
        <button className="btn" onClick={onFinish} disabled={!done}>Finalizar torneo</button>
      </div>
    </>
  );
}
