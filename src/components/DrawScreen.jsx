import { useEffect, useRef, useState } from 'react';
import * as C from '../logic/coliseo.js';
import { burst, rand32 } from '../utils/effects.js';
import OrderPanel from './OrderPanel.jsx';

function drawWheel(cv, rot) {
  const ctx = cv.getContext('2d'), S = cv.width, r = S / 2 - 8;
  ctx.clearRect(0, 0, S, S); ctx.save(); ctx.translate(S / 2, S / 2);
  const cols = ['#7a0a12', '#1b1411', '#a3101c', '#2a1d12'];
  C.CAPS.forEach((c, i) => {
    const a0 = (-90 + i * 90 + rot) * Math.PI / 180, a1 = a0 + Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, a0, a1); ctx.closePath(); ctx.fillStyle = cols[i]; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#d4a73a'; ctx.stroke();
    ctx.save(); ctx.rotate(a0 + Math.PI / 4); ctx.fillStyle = '#f6d77a'; ctx.font = `700 ${S * 0.065}px Cinzel, Georgia, serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText((c === 'barbero' ? 'Barbero' : C.CAP_LABEL[c]).toUpperCase(), r - S * 0.05, 0); ctx.restore();
  });
  ctx.beginPath(); ctx.arc(0, 0, S * 0.07, 0, 7); ctx.fillStyle = '#0b0708'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#d4a73a'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.lineWidth = 6; ctx.strokeStyle = '#d4a73a'; ctx.stroke(); ctx.restore();
}

export default function DrawScreen({ first, onWinner, onStart, onNew }) {
  const canvasRef = useRef(null);
  const rotRef = useRef(0);
  const rafRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const has = !!first;
  const order = has ? C.roundOrders(first)[0] : [];

  // redibuja la ruleta tras cada render (conserva el ángulo actual)
  useEffect(() => { if (canvasRef.current) drawWheel(canvasRef.current, rotRef.current); });
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function spin() {
    if (spinning || first) return;
    setSpinning(true);
    const winner = C.drawWinner(rand32), i = C.CAPS.indexOf(winner);
    const jitter = (rand32() / 2 ** 32 - 0.5) * 60;
    const start = rotRef.current % 360, base = ((360 - (i * 90 + 45) + jitter) % 360 + 360) % 360;
    const target = start + (((base - start) % 360) + 360) % 360 + 360 * 6;
    const cv = canvasRef.current, t0 = performance.now(), dur = 5200, from = start;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      rotRef.current = from + (target - from) * e; drawWheel(cv, rotRef.current);
      if (k < 1) { rafRef.current = requestAnimationFrame(step); return; }
      rotRef.current = target % 360; setSpinning(false);
      onWinner(winner);
      burst('🏆 ' + C.CAP_LABEL[winner]);
    };
    rafRef.current = requestAnimationFrame(step);
  }

  return (
    <div className="draw">
      <div className="display" style={{ fontSize: 'clamp(18px,4vw,26px)', color: 'var(--gold2)' }}>SORTEO DEL PRIMER TURNO</div>
      <div className="wheelbox"><div className="pointer"></div><canvas ref={canvasRef} width="840" height="840"></canvas></div>
      <div id="res">
        {has && (
          <>
            <div className="winner">🏆 {C.CAP_LABEL[order[0]]} elige primero</div>
            <div className="order" style={{ marginTop: 10 }}>
              {order.map((c, i) => <div key={c} className="o"><b>{i + 1}º</b>{C.CAP_LABEL[c]}</div>)}
            </div>
            <OrderPanel first={first} />
          </>
        )}
      </div>
      <div className="bar">
        <button className="btn red big" onClick={spin} disabled={has || spinning}>SORTEAR PRIMER TURNO</button>
        {has && <button className="btn big" onClick={onStart}>Comenzar draft</button>}
      </div>
      <div className="hint" style={{ textAlign: 'center', maxWidth: 560 }}>
        Probabilidad idéntica (25 %) para Jordan, Owari, Fyodor y El Barbero. El resultado no se puede modificar salvo reiniciando el torneo.
      </div>
      <div className="bar"><button className="btn sm" onClick={onNew}>Nueva edición del torneo</button></div>
    </div>
  );
}
