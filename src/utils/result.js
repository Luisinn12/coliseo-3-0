import * as C from '../logic/coliseo.js';
import { fmt, sgn, COL } from './format.js';

export function finalData(state) {
  const ts = C.teams(state), st = C.stats(state), bl = C.balanceLevel(st.spread);
  const rank = ts.slice().sort((a, b) => b.total - a.total);
  return { ts, st, bl, rank };
}

export function resultText(state) {
  const { st, bl, rank } = finalData(state);
  let s = '🏛️ COLISEO 3.0 – EQUIPOS DEFINITIVOS\n\n';
  rank.forEach((t, i) => {
    s += `${i + 1}. Equipo ${C.CAP_LABEL[t.captain]} – ${fmt(t.total)} MMR (${sgn(t.total - st.avg)})\n   Capitán: ${t.cap.name} (${fmt(t.cap.mmr)})\n   ${t.members.map(m => `${m.name} (${fmt(m.mmr)})`).join(', ')}\n\n`;
  });
  s += `Mayor: ${C.CAP_LABEL[st.maxTeam]} ${fmt(st.max)} | Menor: ${C.CAP_LABEL[st.minTeam]} ${fmt(st.min)}\nDiferencia máxima: ${fmt(st.spread)} | Promedio: ${st.avg.toFixed(2)}\nEquilibrio: ${bl.label}`;
  return s;
}

export function exportCanvas(state) {
  const { st, bl, rank } = finalData(state);
  const W = 1200, H = 1180, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  const g = x.createRadialGradient(W / 2, 0, 50, W / 2, 0, H); g.addColorStop(0, '#3a0a0e'); g.addColorStop(.5, '#0b0708'); g.addColorStop(1, '#050506'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#d4a73a'; x.lineWidth = 4; x.strokeRect(14, 14, W - 28, H - 28);
  x.textAlign = 'center'; x.fillStyle = '#f6d77a'; x.font = '900 74px Cinzel, Georgia, serif'; x.fillText('COLISEO 3.0', W / 2, 100);
  x.fillStyle = '#ff2b3a'; x.font = '700 28px Cinzel, Georgia, serif'; x.fillText('EQUIPOS DEFINITIVOS', W / 2, 145);
  x.fillStyle = '#9b8f7a'; x.font = 'italic 22px Rajdhani, sans-serif'; x.fillText('Cuatro líderes. Cuatro equipos. Una sola corona.', W / 2, 180);
  const cw = 272, gap = 16, x0 = (W - (cw * 4 + gap * 3)) / 2;
  rank.forEach((t, i) => {
    const cx = x0 + i * (cw + gap), cy = 210, ch = 520;
    x.fillStyle = '#14100e'; x.fillRect(cx, cy, cw, ch); x.fillStyle = COL[t.captain]; x.fillRect(cx, cy, cw, 6); x.strokeStyle = '#3a2f22'; x.lineWidth = 2; x.strokeRect(cx, cy, cw, ch);
    x.textAlign = 'left'; x.fillStyle = '#efe6d2'; x.font = '700 26px Cinzel, Georgia, serif'; x.fillText((i + 1) + '. ' + C.CAP_LABEL[t.captain], cx + 14, cy + 44);
    x.fillStyle = '#ff2b3a'; x.font = '700 14px Rajdhani, sans-serif'; x.fillText('CAPITÁN', cx + 14, cy + 68);
    const rows = [[t.cap.name, t.cap.mmr, true]].concat(t.members.map(m => [m.name, m.mmr, false]));
    rows.forEach((r, j) => {
      const y = cy + 100 + j * 58; x.fillStyle = r[2] ? '#2a1d12' : '#0e0b09'; x.fillRect(cx + 10, y - 28, cw - 20, 46);
      x.fillStyle = '#efe6d2'; x.font = '600 20px Rajdhani, sans-serif'; x.textAlign = 'left'; x.fillText(r[0].length > 18 ? r[0].slice(0, 17) + '…' : r[0], cx + 18, y + 2);
      x.fillStyle = '#f6d77a'; x.font = '700 20px Rajdhani, sans-serif'; x.textAlign = 'right'; x.fillText(fmt(r[1]), cx + cw - 18, y + 2);
    });
    x.textAlign = 'center'; x.fillStyle = '#9b8f7a'; x.font = '700 14px Rajdhani, sans-serif'; x.fillText('MMR EQUIPO', cx + cw / 2, cy + 430);
    x.fillStyle = ({ green: '#2fbf71', yellow: '#e8b923', red: '#ef4444' })[C.deviationClass(t.total - C.TARGET)]; x.font = '900 48px Cinzel, Georgia, serif'; x.fillText(fmt(t.total), cx + cw / 2, cy + 480);
    x.fillStyle = '#9b8f7a'; x.font = '600 16px Rajdhani, sans-serif'; x.fillText('vs promedio: ' + sgn(t.total - st.avg), cx + cw / 2, cy + 506);
  });
  x.textAlign = 'center'; x.fillStyle = '#d4a73a'; x.font = '700 22px Cinzel, Georgia, serif'; x.fillText('RESUMEN DE EQUILIBRIO', W / 2, 785);
  const items = [['Mayor MMR', C.CAP_LABEL[st.maxTeam] + ' · ' + fmt(st.max)], ['Menor MMR', C.CAP_LABEL[st.minTeam] + ' · ' + fmt(st.min)], ['Diferencia máxima', fmt(st.spread)], ['Promedio', st.avg.toFixed(2)], ['Equilibrio', bl.label]];
  items.forEach((it, i) => {
    const w = (W - 80) / 5, cx = 40 + i * w + w / 2; x.fillStyle = '#9b8f7a'; x.font = '600 16px Rajdhani, sans-serif'; x.fillText(it[0].toUpperCase(), cx, 835); x.fillStyle = '#f6d77a'; x.font = '700 24px Cinzel, Georgia, serif'; x.fillText(it[1], cx, 875);
  });
  x.textAlign = 'left'; x.fillStyle = '#d4a73a'; x.font = '700 14px Rajdhani, sans-serif';
  ['EQUIPO', 'CAPITÁN', 'INTEGRANTES', 'MMR'].forEach((h, i) => x.fillText(h, [50, 230, 400, 1100][i], 930));
  x.fillStyle = '#3a2f22'; x.fillRect(40, 940, W - 80, 2);
  rank.forEach((t, i) => {
    const y = 978 + i * 50; x.fillStyle = '#efe6d2'; x.font = '600 18px Rajdhani, sans-serif'; x.textAlign = 'left';
    x.fillText((i + 1) + '. ' + C.CAP_LABEL[t.captain], 50, y); x.fillText(t.cap.name.slice(0, 20), 230, y);
    const names = t.members.map(m => m.name).join(', '); x.font = '500 15px Rajdhani, sans-serif'; x.fillText(names.length > 80 ? names.slice(0, 79) + '…' : names, 400, y);
    x.fillStyle = '#f6d77a'; x.font = '700 20px Rajdhani, sans-serif'; x.textAlign = 'right'; x.fillText(fmt(t.total), 1160, y);
  });
  x.textAlign = 'center'; x.fillStyle = '#5d5242'; x.font = '500 14px Rajdhani, sans-serif'; x.fillText('MMR según encuesta · Total 75,393 · Objetivo 18,848.25 por equipo', W / 2, H - 34);
  return cv;
}

// Descarga estándar del navegador (sin depender de Claude)
export function downloadPng(state, filename = 'coliseo-3-0-equipos.png') {
  return new Promise((resolve, reject) => {
    exportCanvas(state).toBlob((blob) => {
      if (!blob) return reject(new Error('No se pudo generar la imagen'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve();
    }, 'image/png');
  });
}
