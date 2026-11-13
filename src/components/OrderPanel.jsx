import * as C from '../logic/coliseo.js';
import { COL } from '../utils/format.js';

// Panel: resultado del sorteo + orden de las cuatro rondas + capitán con el turno + jugador elegido en cada casilla.
export default function OrderPanel({ first, picks = [], tn = null }) {
  const rounds = C.roundOrders(first);
  return (
    <div className="card orderpanel">
      <div className="hd">
        <span>SORTEO Y ORDEN DE ELECCIÓN</span>
        <span style={{ fontFamily: 'Rajdhani', fontSize: 15, color: 'var(--gold2)' }}>🏆 Sorteo: <b>{C.CAP_LABEL[first]}</b> elige primero</span>
      </div>
      <div className="ordergrid">
        {rounds.map((order, r) => (
          <div key={r} className={'rnd' + (tn && !tn.done && tn.round === r + 1 ? ' cur' : '')}>
            <div className="rh">RONDA {r + 1}</div>
            {order.map((c, i) => {
              const n = r * 4 + i, pk = picks[n];
              const now = tn && !tn.done && tn.number === n + 1;
              return (
                <div key={c} className={'oc' + (now ? ' now' : '') + (pk ? ' done' : '')} style={{ '--c': COL[c] }}>
                  <span className="pn">{i + 1}</span>
                  <span className="cn">{C.CAP_LABEL[c]}</span>
                  <span className="pp">{pk ? C.BY_ID[pk.player].name : now ? '¡Elige ahora!' : '—'}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="lim-note">
        R2 invierte la R1 · R3 desplaza la R1 empezando por su 3.er capitán · R4 invierte la R3.
        Cada capitán elige exactamente una vez en 1.ª, 2.ª, 3.ª y 4.ª posición.
      </div>
    </div>
  );
}
