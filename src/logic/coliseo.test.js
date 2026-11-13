import C from './coliseo.js';
import assert from 'node:assert';
let n = 0; const t = (name, f) => { f(); n++; console.log('✓', name); };

t('20 jugadores suman 75,393 y objetivo 18,848.25', () => {
  assert.equal(C.PLAYERS.length, 20); assert.equal(new Set(C.PLAYERS.map(p => p.id)).size, 20);
  assert.equal(C.TOTAL, 75393); assert.equal(C.TARGET, 18848.25);
  assert.equal(C.available(C.initialState()).length, 16);
  assert.equal(C.PLAYERS.filter(p => p.captain).length, 4);
});
t('sorteo: 4 ganadores posibles, ~25% c/u', () => {
  const cnt = {}; const N = 200000;
  for (let i = 0; i < N; i++) { const w = C.drawWinner(() => Math.floor(Math.random() * 2 ** 32)); cnt[w] = (cnt[w] || 0) + 1; }
  assert.equal(Object.keys(cnt).length, 4);
  Object.values(cnt).forEach(v => assert(Math.abs(v / N - 0.25) < 0.01));
  // exhaustivo sobre residuos
  assert.deepEqual([0,1,2,3].map(r => C.drawWinner(() => r)).sort(), [...C.CAPS].sort());
});
t('snake: ejemplo Jordan y alternancia para todos los ganadores', () => {
  assert.deepEqual(C.snakeOrder('jordan'), ['jordan','owari','fyodor','barbero','barbero','fyodor','owari','jordan','jordan','owari','fyodor','barbero','barbero','fyodor','owari','jordan']);
  C.CAPS.forEach(f => {
    const o = C.snakeOrder(f); assert.equal(o.length, 16); assert.equal(o[0], f);
    for (let r = 0; r < 4; r++) { const row = o.slice(r*4, r*4+4); assert.equal(new Set(row).size, 4);
      if (r) assert.deepEqual(row, o.slice((r-1)*4, r*4).slice().reverse()); }
    C.CAPS.forEach(c => assert.equal(o.filter(x => x === c).length, 4));
  });
});
function play(first, chooser) {
  let s = Object.assign(C.initialState(), { first, started: true });
  while (!C.turn(s).done) { const tn = C.turn(s); s = C.pick(s, tn.captain, chooser(s, tn).id); }
  return s;
}
t('16 selecciones, sin repetidos, 20 jugadores, MMR suman', () => {
  C.CAPS.forEach(f => {
    const s = play(f, st => C.available(st)[Math.floor(Math.random() * C.available(st).length)]);
    assert.equal(s.picks.length, 16); assert.equal(new Set(s.picks.map(p => p.player)).size, 16);
    assert.deepEqual(C.validateFinal(s), []);
    const ts = C.teams(s); ts.forEach(x => assert.equal(x.size, 5));
    assert.equal(ts.reduce((a, x) => a + x.total, 0), 75393);
    assert.equal(ts.flatMap(x => [x.captain, ...x.members.map(m => m.id)]).length, 20);
  });
});
t('validaciones: fuera de turno, repetido, capitán, sin sorteo', () => {
  let s = Object.assign(C.initialState(), { first: 'jordan', started: true });
  assert.throws(() => C.pick(s, 'owari', 'takagi'), /turno/);
  assert.throws(() => C.pick(s, 'jordan', 'owari'), /capitanes/);
  s = C.pick(s, 'jordan', 'takagi');
  assert.throws(() => C.pick(s, 'owari', 'takagi'), /ya seleccionado/);
  assert.throws(() => C.pick(C.initialState(), 'jordan', 'takagi'), /no ha comenzado/);
  // sin bloqueo por presupuesto: Fyodor puede tomar al mejor jugador
  let f = Object.assign(C.initialState(), { first: 'fyodor', started: true });
  assert.doesNotThrow(() => C.pick(f, 'fyodor', 'takagi'));
});
t('deshacer restaura turno y cálculos', () => {
  let s = Object.assign(C.initialState(), { first: 'owari', started: true });
  const s0 = JSON.stringify(s), t0 = C.turn(s), tot0 = C.teams(s).map(x => x.total);
  s = C.pick(s, 'owari', 'takagi'); s = C.pick(s, 'fyodor', 'leny');
  s = C.undo(s); assert.equal(C.turn(s).captain, 'fyodor'); s = C.undo(s);
  assert.deepEqual(C.turn(s), t0); assert.deepEqual(C.teams(s).map(x => x.total), tot0);
  assert.equal(JSON.stringify(s), s0); assert.equal(C.available(s).length, 16);
  assert.equal(C.undo(s), s);
});
t('recomendaciones no mutan estado ni eligen; ordenadas', () => {
  const s = Object.assign(C.initialState(), { first: 'jordan', started: true });
  const before = JSON.stringify(s); const r = C.recommend(s);
  assert.equal(JSON.stringify(s), before); assert.equal(r.length, 16);
  for (let i = 1; i < r.length; i++) assert(r[i-1].spread <= r[i].spread);
  assert.equal(C.recommend(play('jordan', st => C.available(st)[0])).length, 0);
});
t('recomendar siempre el #1 mejora vs. elegir siempre al más fuerte', () => {
  const spread = s => C.stats(s).spread;
  const gS = spread(play('jordan', st => C.available(st)[0]));
  const rS = spread(play('jordan', st => C.recommend(st)[0].player));
  console.log('   spread voraz-fuerte:', gS, '| siguiendo recomendación:', rS);
  assert(rS < gS);
  C.CAPS.forEach(f => console.log('   inicio', f, '→ spread con recomendaciones:', spread(play(f, st => C.recommend(st)[0].player))));
});
t('proyección y estado inicial', () => {
  const s = Object.assign(C.initialState(), { first: 'jordan', started: true });
  const p = C.projection(s); assert(Math.abs(p.reduce((a, b) => a + b, 0) - 75393) < 1e-6);
});
console.log(`\n${n} grupos de pruebas OK`);
