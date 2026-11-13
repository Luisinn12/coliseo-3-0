import { useMemo } from 'react';
import * as C from '../logic/coliseo.js';
import { fmt, sgn } from '../utils/format.js';
import TeamCard from './TeamCard.jsx';

export default function DraftScreen({ state, selected, onSelect, flash, onConfirm, onUndo, onReset, onFinish }) {
  const tn = C.turn(state), ts = C.teams(state), proj = C.projection(state), pool = C.available(state);
  const rec = useMemo(() => C.recommend(state), [state]);
  const top = rec.slice(0, 3);
  const recRank = {}; top.forEach((r, i) => { recRank[r.player.id] = i + 1; });
  const done = tn.done;
  const seq = C.snakeOrder(state.first);
  const st = C.stats(state);
  const selP = selected && C.BY_ID[selected];
  const capTeam = !done && ts.find(t => t.captain === tn.captain);
  const ideal = !done && (C.TARGET - capTeam.total) / (5 - capTeam.size);
  const over = selP && !done && (capTeam.total + selP.mmr - C.TARGET > 0);

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
        {ts.map((t, i) => <TeamCard key={t.captain} team={t} proj={proj[i]} tn={tn} flashCap={flash.cap} newPick={flash.pick} />)}
      </div>
      <div className="card" style={{ marginTop: 12, padding: 10 }}>
        <div className="kv" style={{ justifyContent: 'center', gap: 18, flexWrap: 'wrap', fontSize: 16 }}>
          <span>Mayor: <b>{fmt(st.max)}</b></span><span>Menor: <b>{fmt(st.min)}</b></span>
          <span>Diferencia máx.: <b>{fmt(st.spread)}</b></span><span>Objetivo: <b>{C.TARGET.toFixed(2)}</b></span>
        </div>
      </div>
      <div className="main">
        <div className="card">
          <div className="hd"><span>JUGADORES DISPONIBLES ({pool.length})</span><span style={{ fontFamily: 'Rajdhani', fontSize: 13, color: 'var(--mut)' }}>Elige libremente · ★ = sugerido</span></div>
          <div className="pgrid">
            {pool.length ? pool.map(p => (
              <button key={p.id} className={'pl' + (selected === p.id ? ' sel' : '')} disabled={done} onClick={() => !done && onSelect(p.id)}>
                {recRank[p.id] && <span className="rc">★ {recRank[p.id]}</span>}
                <div className="nm">{p.name}</div><div className="mm">{fmt(p.mmr)}</div>
                <div style={{ fontSize: 13, color: 'var(--mut)' }}>Pos favorita {p.pos}</div>
              </button>
            )) : <div className="hint">No quedan jugadores.</div>}
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
                    <button key={r.player.id} className="it" onClick={() => onSelect(r.player.id)}>
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
        <div className="sel">
          {done ? 'Las 16 selecciones están completas.' : selP ? (
            <>{C.CAP_LABEL[tn.captain]} elige a <b>{selP.name}</b> ({fmt(selP.mmr)}){over ? ' · supera el objetivo (permitido)' : ''}</>
          ) : (
            <>Turno de <b>{C.CAP_LABEL[tn.captain]}</b>: toca un jugador para seleccionarlo</>
          )}
        </div>
        <button className="btn red" onClick={onConfirm} disabled={!selP || done}>Confirmar selección</button>
        <button className="btn" onClick={onUndo} disabled={!state.picks.length}>Deshacer última</button>
        <button className="btn" onClick={onReset}>Reiniciar draft</button>
        <button className="btn" onClick={onFinish} disabled={!done}>Finalizar torneo</button>
      </div>
    </>
  );
}
