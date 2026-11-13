import C from './coliseo.js';
import assert from 'node:assert';

let n = 0; const t = (name, f) => { f(); n++; console.log('✓', name); };
const rnd = k => Math.floor(Math.random() * k);
const started = first => Object.assign(C.initialState(), { first, started: true });
const allowedList = (s, cap) => C.available(s).filter(p => C.check(s, cap, p.id).ok);
function play(first, chooser) {
  let s = started(first);
  while (!C.turn(s).done) {
    const tn = C.turn(s), opts = allowedList(s, tn.captain);
    assert(opts.length > 0, 'sin jugadas legales: ' + JSON.stringify(s.picks));
    s = C.pick(s, tn.captain, chooser(s, tn, opts).id);
  }
  return s;
}

t('constantes: 20 jugadores = 75,393; objetivo 18,848.25; límite 19,148', () => {
  assert.equal(C.PLAYERS.length, 20); assert.equal(new Set(C.PLAYERS.map(p => p.id)).size, 20);
  assert.equal(C.TOTAL, 75393); assert.equal(C.TARGET, 18848.25);
  assert.equal(C.LIMIT, 19148); assert.equal(C.MARGIN, 300); assert.equal(C.LOWER_GUIDE, 18548);
  assert.equal(Math.floor(C.TARGET + C.MARGIN), C.LIMIT);
  assert.equal(C.available(C.initialState()).length, 16);
  assert.equal(C.PLAYERS.filter(p => p.captain).length, 4);
});
t('sorteo: 4 ganadores posibles, ~25% c/u', () => {
  const cnt = {}; const N = 200000;
  for (let i = 0; i < N; i++) { const w = C.drawWinner(() => Math.floor(Math.random() * 2 ** 32)); cnt[w] = (cnt[w] || 0) + 1; }
  assert.equal(Object.keys(cnt).length, 4);
  Object.values(cnt).forEach(v => assert(Math.abs(v / N - 0.25) < 0.01));
  assert.deepEqual([0,1,2,3].map(r => C.drawWinner(() => r)).sort(), [...C.CAPS].sort());
});
t('rotación de prioridades: ejemplo del enunciado (gana Jordan)', () => {
  const L = { jordan: 'Jordan', owari: 'Owari', fyodor: 'Fyodor', barbero: 'El Barbero' };
  const names = r => r.map(c => L[c]);
  const R = C.roundOrders('jordan');
  assert.deepEqual(names(R[0]), ['Jordan', 'Owari', 'Fyodor', 'El Barbero']);
  assert.deepEqual(names(R[1]), ['El Barbero', 'Fyodor', 'Owari', 'Jordan']);
  assert.deepEqual(names(R[2]), ['Fyodor', 'El Barbero', 'Jordan', 'Owari']);
  assert.deepEqual(names(R[3]), ['Owari', 'Jordan', 'El Barbero', 'Fyodor']);
  assert.deepEqual(C.draftOrder('jordan'), [].concat(...R));
  assert.equal(C.draftOrder('jordan').length, 16);
});
t('rotación: reglas R2/R3/R4 y justicia (cada capitán 1.º, 2.º, 3.º y 4.º exactamente una vez) con cualquier ganador', () => {
  C.CAPS.forEach(first => {
    const [r1, r2, r3, r4] = C.roundOrders(first);
    assert.equal(r1[0], first);                                   // el ganador abre la ronda 1
    assert.deepEqual([...r1].sort(), [...C.CAPS].sort());         // R1 es permutación de los 4
    assert.deepEqual(r2, r1.slice().reverse());                   // R2 = R1 invertida
    assert.deepEqual(r3, [r1[2], r1[3], r1[0], r1[1]]);           // R3 = R1 desplazada desde su 3.er capitán
    assert.equal(r3[0], r1[2]);
    assert.deepEqual(r4, r3.slice().reverse());                   // R4 = R3 invertida
    C.CAPS.forEach(c => {
      const pos = [r1, r2, r3, r4].map(r => r.indexOf(c) + 1).sort();
      assert.deepEqual(pos, [1, 2, 3, 4], c + ' con ' + first);   // una vez cada posición
    });
    for (let col = 0; col < 4; col++) assert.equal(new Set([r1, r2, r3, r4].map(r => r[col])).size, 4); // cuadrado latino
    const o = C.draftOrder(first); C.CAPS.forEach(c => assert.equal(o.filter(x => x === c).length, 4));
  });
  console.log('   posiciones por capitán (R1,R2,R3,R4), gana Owari: ' + C.CAPS.map(c => c + '=' + C.roundOrders('owari').map(r => r.indexOf(c) + 1).join('')).join(' '));
});
t('el turno sigue exactamente el orden de rotación', () => {
  C.CAPS.forEach(first => {
    let s = started(first); const exp = C.draftOrder(first);
    for (let i = 0; i < 16; i++) {
      const tn = C.turn(s); assert.equal(tn.captain, exp[i]); assert.equal(tn.round, Math.floor(i / 4) + 1); assert.equal(tn.number, i + 1);
      assert.equal(tn.next, exp[i + 1] || null);
      const o = allowedList(s, tn.captain); s = C.pick(s, tn.captain, o[0].id);
    }
    assert.equal(C.turn(s).done, true);
  });
});
t('validaciones básicas: turno, repetido, capitán, sin sorteo', () => {
  let s = started('jordan');
  assert.throws(() => C.pick(s, 'owari', 'takagi'), /turno/);
  assert.throws(() => C.pick(s, 'jordan', 'owari'), /capitanes/);
  s = C.pick(s, 'jordan', 'takagi');
  assert.throws(() => C.pick(s, 'owari', 'takagi'), /ya seleccionado/);
  assert.throws(() => C.pick(C.initialState(), 'jordan', 'takagi'), /no ha comenzado/);
});
t('límite: se bloquea lo que pasa de 19,148 y se explica el exceso', () => {
  let found = null;
  for (let g = 0; g < 500 && !found; g++) {
    let s = started(C.CAPS[rnd(4)]);
    while (!C.turn(s).done && !found) {
      const tn = C.turn(s), opts = C.options(s, tn.captain);
      const lim = Object.keys(opts).find(id => opts[id].reason === 'limit');
      if (lim) { found = { s, tn, id: lim, r: opts[lim] }; break; }
      const ok = Object.keys(opts).filter(id => opts[id].ok);
      s = C.pick(s, tn.captain, ok[rnd(ok.length)]);
    }
  }
  assert(found, 'no se encontró un caso de bloqueo por límite');
  const { s, tn, id, r } = found, team = C.teams(s).find(x => x.captain === tn.captain), p = C.BY_ID[id];
  assert.equal(r.ok, false); assert.equal(r.newTotal, team.total + p.mmr); assert(r.newTotal > 19148);
  assert.equal(r.excess, team.total + p.mmr - 19148);
  assert(r.message.includes('excedería el límite de 19,148 por ' + r.excess.toLocaleString('en-US') + ' MMR'));
  assert.throws(() => C.pick(s, tn.captain, id), /excedería el límite/);
  console.log('   ejemplo: ' + r.message);
  // ejemplo determinista: Jordan 5,167 + Takagi 5,306 + Leny 5,000 + Picoy 4,667 = 20,140 → excede por 992
  assert.equal(5167 + 5306 + 5000 + 4667 - 19148, 992);
});
t('el límite se cumple en el borde exacto (<= 19,148 sí, 19,149 no)', () => {
  // feasible() con equipos sintéticos
  assert.equal(C.feasible([19148], [0], []), true);
  assert.equal(C.feasible([19147], [1], [1]), true);
  assert.equal(C.feasible([19147], [1], [2]), false);
});
t('factibilidad = fuerza bruta en estados avanzados (pool ≤ 7)', () => {
  function brute(totals, slots, mm) {
    if (!mm.length) return true;
    const [m, ...rest] = mm;
    for (let i = 0; i < totals.length; i++) if (slots[i] > 0 && totals[i] + m <= C.LIMIT) {
      const t2 = totals.slice(), s2 = slots.slice(); t2[i] += m; s2[i]--;
      if (brute(t2, s2, rest)) return true;
    }
    return false;
  }
  let checked = 0, infeasible = 0;
  for (let g = 0; g < 400; g++) {
    let s = started(C.CAPS[rnd(4)]);
    const stop = 9 + rnd(5); // 9..13 picks hechos → quedan 7..3
    while (s.picks.length < stop) {
      const tn = C.turn(s), o = allowedList(s, tn.captain); s = C.pick(s, tn.captain, o[rnd(o.length)].id);
    }
    const ts = C.teams(s), pool = C.available(s);
    ts.forEach(tm => pool.forEach(p => {
      if (tm.size >= 5 || tm.total + p.mmr > C.LIMIT) return;
      const totals = ts.map(x => x.captain === tm.captain ? tm.total + p.mmr : x.total);
      const slots = ts.map(x => 5 - x.size - (x.captain === tm.captain ? 1 : 0));
      const rest = pool.filter(q => q.id !== p.id).map(q => q.mmr);
      const exp = brute(totals, slots, rest);
      assert.equal(C.check(s, tm.captain, p.id).ok, exp);
      checked++; if (!exp) infeasible++;
    }));
  }
  console.log(`   comprobaciones vs fuerza bruta: ${checked} (de ellas ${infeasible} sin solución) → todas coinciden`);
  assert(checked > 1000);
});
t('TODOS los sorteos × estrategias extremas siempre completan 16 picks válidos', () => {
  const strategies = {
    aleatoria: (s, tn, o) => o[rnd(o.length)],
    'más fuerte posible': (s, tn, o) => o.slice().sort((a, b) => b.mmr - a.mmr)[0],
    'más débil posible': (s, tn, o) => o.slice().sort((a, b) => a.mmr - b.mmr)[0],
    'empujar al límite': (s, tn, o) => {
      const cur = C.teams(s).find(x => x.captain === tn.captain).total;
      return o.slice().sort((a, b) => (C.LIMIT - cur - b.mmr) - (C.LIMIT - cur - a.mmr)).reverse()[0] && o.slice().sort((a, b) => Math.abs(C.LIMIT - cur - a.mmr) - Math.abs(C.LIMIT - cur - b.mmr))[0];
    },
    'recomendación #1': (s, tn, o) => C.recommend(s)[0].player
  };
  const rows = [];
  C.CAPS.forEach(first => Object.entries(strategies).forEach(([name, ch]) => {
    const reps = name === 'aleatoria' ? 150 : 1;
    let worst = 0;
    for (let k = 0; k < reps; k++) {
      const s = play(first, ch);
      assert.equal(s.picks.length, 16); assert.equal(new Set(s.picks.map(p => p.player)).size, 16);
      assert.deepEqual(C.validateFinal(s), []);
      const ts = C.teams(s); ts.forEach(x => { assert.equal(x.size, 5); assert(x.total <= C.LIMIT); });
      assert.equal(ts.reduce((a, x) => a + x.total, 0), 75393);
      worst = Math.max(worst, C.stats(s).spread);
    }
    rows.push(`${first}/${name}: ok (peor diferencia ${worst})`);
  }));
  console.log('   ' + rows.join('\n   '));
});
t('la comprobación de factibilidad bloquea jugadas que pasan el límite pero no tienen solución', () => {
  let found = 0, games = 400, minLegal = 99;
  for (let g = 0; g < games; g++) {
    let s = started(C.CAPS[rnd(4)]);
    while (!C.turn(s).done) {
      const tn = C.turn(s), opts = C.options(s, tn.captain), ids = Object.keys(opts);
      ids.forEach(id => { if (opts[id].reason === 'infeasible') found++; });
      const ok = ids.filter(id => opts[id].ok); minLegal = Math.min(minLegal, ok.length);
      assert(ok.length > 0);
      // elegir de forma agresiva (el más fuerte permitido) para estresar
      ok.sort((a, b) => C.BY_ID[b].mmr - C.BY_ID[a].mmr);
      s = C.pick(s, tn.captain, g % 2 ? ok[0] : ok[rnd(ok.length)]);
    }
  }
  console.log(`   jugadas bloqueadas por "draft imposible" (pasaban el límite): ${found}; mínimo de jugadas legales en un turno: ${minLegal}`);
  assert(found > 0);
});
t('rendimiento: cada comprobación es rápida', () => {
  let max = 0, total = 0, cnt = 0;
  for (let g = 0; g < 60; g++) {
    let s = started(C.CAPS[rnd(4)]);
    while (!C.turn(s).done) {
      const tn = C.turn(s);
      C.CAPS.forEach(c => C.available(s).forEach(p => { const t0 = performance.now(); C.check(s, c, p.id); const d = performance.now() - t0; max = Math.max(max, d); total += d; cnt++; }));
      const o = allowedList(s, tn.captain); s = C.pick(s, tn.captain, o[rnd(o.length)].id);
    }
  }
  console.log(`   ${cnt} comprobaciones; media ${(total / cnt).toFixed(3)} ms; máxima ${max.toFixed(1)} ms`);
  assert(max < 200);
});
t('deshacer restaura turno y cálculos y nunca rompe el límite', () => {
  let s = started('owari');
  const s0 = JSON.stringify(s), t0 = C.turn(s), tot0 = C.teams(s).map(x => x.total);
  s = C.pick(s, 'owari', 'takagi'); s = C.pick(s, 'fyodor', 'leny');
  s = C.undo(s); assert.equal(C.turn(s).captain, 'fyodor'); s = C.undo(s);
  assert.deepEqual(C.turn(s), t0); assert.deepEqual(C.teams(s).map(x => x.total), tot0);
  assert.equal(JSON.stringify(s), s0); assert.equal(C.available(s).length, 16); assert.equal(C.undo(s), s);
  // draft completo → deshacer paso a paso: todos los estados intermedios válidos y factibles
  for (let g = 0; g < 30; g++) {
    let f = play(C.CAPS[rnd(4)], (st, tn, o) => o[rnd(o.length)]);
    while (f.picks.length) {
      f = C.undo(f);
      C.teams(f).forEach(x => assert(x.total <= C.LIMIT));
      if (!C.turn(f).done) assert(allowedList(f, C.turn(f).captain).length > 0);
    }
    assert.deepEqual(C.available(f).length, 16);
  }
});
t('restaurar estado guardado: nunca deja pasar el límite ni jugadas ilegales', () => {
  // 1) estado guardado con jugadas que superan el límite (p. ej. de una versión sin restricción)
  const bad = { v: 1, first: 'jordan', started: true, finished: false, picks: [
    { captain: 'jordan', player: 'takagi' }, { captain: 'owari', player: 'yiyo' }, { captain: 'fyodor', player: 'rata' },
    { captain: 'barbero', player: 'kanay' }, { captain: 'barbero', player: 'mania' }, { captain: 'fyodor', player: 'wallace' },
    { captain: 'owari', player: 'charles' }, { captain: 'jordan', player: 'leny' },
    { captain: 'jordan', player: 'picoy' } ] };
  let r = C.sanitize(bad);   // la 3.ª jugada (Fyodor→La rata) ya deja el draft sin solución: se conserva sólo el tramo válido
  assert.equal(r.repaired, true); assert.equal(r.state.picks.length, 2);
  C.teams(r.state).forEach(x => assert(x.total <= C.LIMIT));
  // jugada ilegal por límite añadida al final de una partida válida → se descarta sólo esa jugada
  let hit = null;
  for (let g = 0; g < 500 && !hit; g++) {
    let st = started(C.CAPS[rnd(4)]);
    while (!C.turn(st).done) {
      const tn = C.turn(st), o = C.options(st, tn.captain), lim = Object.keys(o).find(id => o[id].reason === 'limit');
      if (lim) { hit = { st, tn, lim }; break; }
      const ok = Object.keys(o).filter(id => o[id].ok); st = C.pick(st, tn.captain, ok[rnd(ok.length)]);
    }
  }
  const tampered = JSON.parse(JSON.stringify(hit.st)); tampered.picks.push({ captain: hit.tn.captain, player: hit.lim });
  r = C.sanitize(tampered);
  assert.equal(r.repaired, true); assert.equal(r.state.picks.length, hit.st.picks.length);
  assert.deepEqual(r.state.picks, hit.st.picks);
  // 2) fuera de turno / repetidos / jugadores inexistentes / capitán como jugador
  r = C.sanitize({ v: 1, first: 'jordan', started: true, picks: [{ captain: 'jordan', player: 'takagi' }, { captain: 'jordan', player: 'leny' }] });
  assert.equal(r.state.picks.length, 1); assert(r.repaired);
  r = C.sanitize({ v: 1, first: 'jordan', started: true, picks: [{ captain: 'jordan', player: 'owari' }] });
  assert.equal(r.state.picks.length, 0);
  r = C.sanitize({ v: 1, first: 'zzz', started: true, picks: [{ captain: 'jordan', player: 'takagi' }] });
  assert.equal(r.state.first, null); assert.equal(r.state.picks.length, 0);
  // 3) "finished" falso con menos de 16 picks → se rechaza
  r = C.sanitize({ v: 1, first: 'jordan', started: true, finished: true, picks: [{ captain: 'jordan', player: 'takagi' }] });
  assert.equal(r.state.finished, false);
  // 4) estados válidos se conservan idénticos (incluido finished)
  for (let g = 0; g < 20; g++) {
    const f = Object.assign(play(C.CAPS[rnd(4)], (st, tn, o) => o[rnd(o.length)]), { finished: true });
    const q = C.sanitize(JSON.parse(JSON.stringify(f)));
    assert.equal(q.repaired, false); assert.deepEqual(q.state, f);
  }
  assert.equal(C.sanitize(null).state.first, null);
});
t('recomendaciones: sólo jugadores permitidos, no mutan y van ordenadas', () => {
  const s = started('jordan'); const before = JSON.stringify(s); const r = C.recommend(s);
  assert.equal(JSON.stringify(s), before); assert(r.length > 0);
  r.forEach(x => assert.equal(C.check(s, 'jordan', x.player.id).ok, true));
  for (let i = 1; i < r.length; i++) assert(r[i-1].spread <= r[i].spread);
  assert.equal(C.recommend(play('jordan', (st, tn, o) => o[0])).length, 0);
  // seguir siempre la #1 deja los equipos mucho más parejos que tomar siempre al más fuerte permitido
  const sp = s2 => C.stats(s2).spread;
  const g = sp(play('jordan', (st, tn, o) => o.slice().sort((a, b) => b.mmr - a.mmr)[0]));
  const rr = sp(play('jordan', st => C.recommend(st)[0].player));
  console.log('   diferencia máx.: más fuerte permitido', g, '| siguiendo #1', rr);
  assert(rr <= g);
});
t('proyección y estado inicial', () => {
  const p = C.projection(started('jordan')); assert(Math.abs(p.reduce((a, b) => a + b, 0) - 75393) < 1e-6);
});
console.log(`\n${n} grupos de pruebas OK`);
