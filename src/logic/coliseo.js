  // ===== DATOS (fuente: Excel "MMR según encuesta") =====
  const PLAYERS = [
    { id: 'takagi',   name: 'Takagi',               mmr: 5306, pos: '4' },
    { id: 'jordan',   name: 'Jordan',               mmr: 5167, pos: '1', captain: true },
    { id: 'leny',     name: 'Leny Conislla',        mmr: 5000, pos: '1' },
    { id: 'barbero',  name: 'El Barbero (Raidel)',  mmr: 4750, pos: '1', captain: true },
    { id: 'picoy',    name: 'Picoy',                mmr: 4667, pos: '5' },
    { id: 'rankc',    name: 'RankCollector',        mmr: 4611, pos: '1' },
    { id: 'owari',    name: 'Owari',                mmr: 4605, pos: '2', captain: true },
    { id: 'tom',      name: 'Tom',                  mmr: 3952, pos: '2' },
    { id: 'choleral', name: 'Choleral',             mmr: 3818, pos: '1' },
    { id: 'jh',       name: 'Jh (primo de Tom)',    mmr: 3727, pos: '4' },
    { id: 'megaman',  name: 'Megaman',              mmr: 3278, pos: '5' },
    { id: 'kanay',    name: 'Kanay',                mmr: 3184, pos: '4' },
    { id: 'mania',    name: 'Manía Blaz',           mmr: 3182, pos: '4' },
    { id: 'wallace',  name: 'Wallace',              mmr: 3167, pos: '5' },
    { id: 'charles',  name: 'Charles',              mmr: 3125, pos: '3' },
    { id: 'patron',   name: 'El patrón',            mmr: 3036, pos: '4' },
    { id: 'lenin',    name: 'Leninblackiss',        mmr: 3000, pos: '2' },
    { id: 'fyodor',   name: 'Fyodor (Fiodor)',      mmr: 2842, pos: '2', captain: true },
    { id: 'rata',     name: 'La rata',              mmr: 2567, pos: '2' },
    { id: 'yiyo',     name: 'Yiyo',                 mmr: 2409, pos: '2' }
  ];
  const BY_ID = Object.fromEntries(PLAYERS.map(p => [p.id, p]));
  const CAPS = ['jordan', 'owari', 'fyodor', 'barbero']; // orden base del sorteo
  const CAP_LABEL = { jordan: 'Jordan', owari: 'Owari', fyodor: 'Fyodor', barbero: 'El Barbero' };
  const TOTAL = PLAYERS.reduce((a, p) => a + p.mmr, 0);
  const TARGET = TOTAL / 4;
  const TOTAL_PICKS = 16;
  // ===== RESTRICCIÓN DE MMR POR EQUIPO =====
  const MARGIN = 300;                    // tolerancia de equilibrio (no es un objetivo)
  const LIMIT = 19148;                   // máximo permitido por equipo, capitán incluido
  const LOWER_GUIDE = 18548;             // límite inferior orientativo (no se impone)
  const fmtN = n => Math.round(n).toLocaleString('en-US');

  const initialState = () => ({ v: 1, first: null, started: false, finished: false, picks: [] });

  // ===== SORTEO =====
  // rand32: función que devuelve un entero uniforme de 32 bits. 2^32 es múltiplo de 4 => sin sesgo.
  function drawWinner(rand32) { return CAPS[rand32() % 4]; }

  // ===== ROTACIÓN DE PRIORIDADES (4 rondas) =====
  // R1: el ganador del sorteo y luego los demás en el orden base (Jordan, Owari, Fyodor, Barbero, cíclico).
  // R2: R1 invertida.  R3: R1 desplazada, empezando por su 3.er capitán.  R4: R3 invertida.
  // Cada capitán obtiene exactamente una vez la 1.ª, 2.ª, 3.ª y 4.ª posición de elección.
  function roundOrders(first) {
    const i = CAPS.indexOf(first);
    if (i < 0) throw new Error('Capitán inválido');
    const r1 = CAPS.slice(i).concat(CAPS.slice(0, i));
    const r2 = r1.slice().reverse();
    const r3 = [r1[2], r1[3], r1[0], r1[1]];
    const r4 = r3.slice().reverse();
    return [r1, r2, r3, r4];
  }
  function draftOrder(first) { return [].concat.apply([], roundOrders(first)); }
  function turn(s) {
    const n = s.picks.length;
    if (s.first == null || n >= TOTAL_PICKS) return { done: true, number: n };
    const order = draftOrder(s.first);
    return {
      done: false, number: n + 1, round: Math.floor(n / 4) + 1,
      captain: order[n], next: order[n + 1] || null, order
    };
  }
  function available(s) {
    const taken = new Set(s.picks.map(x => x.player));
    return PLAYERS.filter(p => !p.captain && !taken.has(p.id)).sort((a, b) => b.mmr - a.mmr);
  }
  function pick(s, cap, pid) {
    if (s.first == null || !s.started) throw new Error('El draft no ha comenzado');
    if (s.finished) throw new Error('El torneo ya finalizó');
    const t = turn(s);
    if (t.done) throw new Error('El draft ya terminó');
    if (t.captain !== cap) throw new Error('Fuera de turno');
    const p = BY_ID[pid];
    if (!p) throw new Error('Jugador inexistente');
    if (p.captain) throw new Error('Los capitanes no se seleccionan entre sí');
    if (s.picks.some(x => x.player === pid)) throw new Error('Jugador ya seleccionado');
    const c = check(s, cap, pid);
    if (!c.ok) throw new Error(c.message);
    return Object.assign({}, s, { picks: s.picks.concat([{ captain: cap, player: pid }]) });
  }
  function undo(s) {
    if (!s.picks.length) return s;
    return Object.assign({}, s, { finished: false, picks: s.picks.slice(0, -1) });
  }

  // ===== EQUIPOS Y ESTADÍSTICAS =====
  function teams(s) {
    return CAPS.map(c => {
      const members = s.picks.filter(x => x.captain === c).map(x => BY_ID[x.player]);
      const total = BY_ID[c].mmr + members.reduce((a, p) => a + p.mmr, 0);
      return { captain: c, cap: BY_ID[c], members, total, size: 1 + members.length };
    });
  }
  function projection(s) {
    const pool = available(s);
    const avg = pool.length ? pool.reduce((a, p) => a + p.mmr, 0) / pool.length : 0;
    return teams(s).map(t => t.total + (5 - t.size) * avg);
  }
  function stats(s) {
    const ts = teams(s);
    const totals = ts.map(t => t.total);
    const max = Math.max(...totals), min = Math.min(...totals);
    return {
      totals, max, min, spread: max - min,
      avg: totals.reduce((a, b) => a + b, 0) / 4,
      maxTeam: ts[totals.indexOf(max)].captain, minTeam: ts[totals.indexOf(min)].captain
    };
  }
  function balanceLevel(spread) {
    if (spread <= 300) return { key: 'excelente', label: 'EXCELENTE', cls: 'green' };
    if (spread <= 700) return { key: 'bueno', label: 'BUENO', cls: 'green' };
    if (spread <= 1200) return { key: 'aceptable', label: 'ACEPTABLE', cls: 'yellow' };
    return { key: 'desigual', label: 'DESIGUAL', cls: 'red' };
  }
  function deviationClass(dev) {
    const a = Math.abs(dev);
    return a <= 250 ? 'green' : a <= 600 ? 'yellow' : 'red';
  }

  // ===== RECOMENDACIONES (nunca eligen) =====
  // Simula el resto del draft: cada capitán toma el jugador más cercano a su "MMR ideal por pick".
  function simulate(totals, left, pool, seq) {
    totals = Object.assign({}, totals); left = Object.assign({}, left); pool = pool.slice();
    for (const c of seq) {
      const need = (TARGET - totals[c]) / left[c];
      let bi = 0, bd = Infinity;
      pool.forEach((p, i) => {
        const d = Math.abs(p.mmr - need);
        if (d < bd || (d === bd && p.mmr > pool[bi].mmr)) { bd = d; bi = i; }
      });
      totals[c] += pool[bi].mmr; left[c]--; pool.splice(bi, 1);
    }
    const v = Object.values(totals);
    return { spread: Math.max(...v) - Math.min(...v), totals };
  }
  function recommend(s) {
    const t = turn(s);
    if (t.done) return [];
    const ts = teams(s);
    const totals = {}, left = {};
    ts.forEach(x => { totals[x.captain] = x.total; left[x.captain] = 5 - x.size; });
    const need = (TARGET - totals[t.captain]) / left[t.captain];
    const seq = t.order.slice(s.picks.length + 1);
    const pool = available(s);
    const allowed = pool.filter(p => check(s, t.captain, p.id).ok);
    return allowed.map(p => {
      const tt = Object.assign({}, totals); tt[t.captain] += p.mmr;
      const ll = Object.assign({}, left); ll[t.captain]--;
      const sim = simulate(tt, ll, pool.filter(q => q.id !== p.id), seq);
      return { player: p, spread: sim.spread, gap: Math.abs(p.mmr - need), need };
    }).sort((a, b) => a.spread - b.spread || a.gap - b.gap || b.player.mmr - a.player.mmr);
  }

  // ===== FACTIBILIDAD =====
  // ¿Existe un reparto de los jugadores restantes que complete a cada equipo (slots[t] integrantes más)
  // sin que ningún equipo supere LIMIT? Búsqueda exacta con poda y memoización.
  function feasible(totals, slots, mmrs) {
    const pool = mmrs.slice().sort((a, b) => b - a);
    const n = pool.length;
    if (slots.reduce((a, b) => a + b, 0) !== n) return false;
    const tt = totals.slice(), ss = slots.slice(), failed = new Set();
    const suffix = new Array(n + 1).fill(0);
    for (let i = n - 1; i >= 0; i--) suffix[i] = suffix[i + 1] + pool[i];
    function dfs(i) {
      if (i === n) return true;
      let cap = 0; const sigs = [];
      for (let t = 0; t < tt.length; t++) {
        if (ss[t] > 0) {
          cap += LIMIT - tt[t];
          if (tt[t] + ss[t] * pool[n - 1] > LIMIT) return false; // ni con los más baratos le alcanza
          sigs.push(tt[t] + ':' + ss[t]);
        }
      }
      if (suffix[i] > cap) return false;
      const key = i + '|' + sigs.slice().sort().join(',');
      if (failed.has(key)) return false;
      const tried = new Set();
      for (let t = 0; t < tt.length; t++) {
        if (ss[t] <= 0 || tt[t] + pool[i] > LIMIT) continue;
        const sig = tt[t] + ':' + ss[t];
        if (tried.has(sig)) continue; // equipos idénticos: simetría
        tried.add(sig);
        tt[t] += pool[i]; ss[t]--;
        if (dfs(i + 1)) return true;
        tt[t] -= pool[i]; ss[t]++;
      }
      failed.add(key);
      return false;
    }
    return dfs(0);
  }

  // Comprueba si el capitán `cap` puede tomar a `pid` (sin considerar de quién es el turno).
  function check(s, cap, pid) {
    const p = BY_ID[pid];
    if (!p || p.captain) return { ok: false, reason: 'invalid', message: 'Jugador no seleccionable' };
    if (s.picks.some(x => x.player === pid)) return { ok: false, reason: 'taken', message: 'Jugador ya seleccionado' };
    const ts = teams(s), t = ts.find(x => x.captain === cap);
    if (!t || t.size >= 5) return { ok: false, reason: 'full', message: 'El equipo ya está completo' };
    const newTotal = t.total + p.mmr;
    if (newTotal > LIMIT) {
      const excess = newTotal - LIMIT;
      return { ok: false, reason: 'limit', newTotal, excess,
        message: p.name + ' (' + fmtN(p.mmr) + ') bloqueado: ' + CAP_LABEL[cap] + ' quedaría en ' + fmtN(newTotal) +
          ' MMR y excedería el límite de ' + fmtN(LIMIT) + ' por ' + fmtN(excess) + ' MMR.' };
    }
    const totals = ts.map(x => x.captain === cap ? newTotal : x.total);
    const slots = ts.map(x => (5 - x.size) - (x.captain === cap ? 1 : 0));
    const rest = available(s).filter(q => q.id !== pid).map(q => q.mmr);
    if (!feasible(totals, slots, rest)) {
      return { ok: false, reason: 'infeasible', newTotal,
        message: p.name + ' (' + fmtN(p.mmr) + ') bloqueado: con esta elección ya no sería posible completar los cuatro equipos de 5 dentro del límite de ' + fmtN(LIMIT) + ' MMR.' };
    }
    return { ok: true, newTotal, room: LIMIT - newTotal };
  }

  // Resultado de `check` para cada jugador disponible (id -> resultado), para el capitán `cap`.
  function options(s, cap) {
    const out = {};
    available(s).forEach(p => { out[p.id] = check(s, cap, p.id); });
    return out;
  }

  // Reconstruye un estado guardado aplicando TODAS las reglas pick a pick.
  // Si algo no cumple (límite, turno, repetidos...), conserva sólo el tramo válido anterior.
  function sanitize(raw) {
    const base = initialState();
    if (!raw || typeof raw !== 'object') return { state: base, repaired: false };
    const first = CAPS.indexOf(raw.first) >= 0 ? raw.first : null;
    const rawPicks = Array.isArray(raw.picks) ? raw.picks : [];
    let repaired = false;
    let cur = Object.assign({}, base, { first, started: true });
    if (first) {
      for (const pk of rawPicks) {
        try { cur = pick(cur, pk && pk.captain, pk && pk.player); }
        catch (e) { repaired = true; break; }
      }
    } else if (rawPicks.length) repaired = true;
    const picks = cur.picks;
    let finished = false;
    if (raw.finished) {
      finished = picks.length === TOTAL_PICKS && validateFinal(Object.assign({}, cur)).length === 0;
      if (!finished) repaired = true;
    }
    const started = !!first && (!!raw.started || picks.length > 0);
    return { state: Object.assign({}, base, { first, started, finished, picks }), repaired };
  }

  // ===== VALIDACIÓN FINAL =====
  function validateFinal(s) {
    const errs = [];
    const ts = teams(s);
    ts.forEach(t => { if (t.size !== 5) errs.push('Equipo ' + t.captain + ' tiene ' + t.size + ' integrantes'); });
    const ids = ts.flatMap(t => [t.captain].concat(t.members.map(m => m.id)));
    if (new Set(ids).size !== 20) errs.push('Hay jugadores repetidos o faltantes');
    if (s.picks.length !== TOTAL_PICKS) errs.push('Selecciones: ' + s.picks.length + '/16');
    ts.forEach(t => { if (t.total > LIMIT) errs.push('Equipo ' + t.captain + ' supera el límite de ' + LIMIT); });
    return errs;
  }

  const api = { PLAYERS, BY_ID, CAPS, CAP_LABEL, TOTAL, TARGET, TOTAL_PICKS, initialState, drawWinner, roundOrders, draftOrder, turn,
    available, pick, undo, teams, projection, stats, balanceLevel, deviationClass, recommend, validateFinal,
    MARGIN, LIMIT, LOWER_GUIDE, feasible, check, options, sanitize };

export {
  PLAYERS, BY_ID, CAPS, CAP_LABEL, TOTAL, TARGET, TOTAL_PICKS, initialState, drawWinner, roundOrders, draftOrder, turn,
  available, pick, undo, teams, projection, stats, balanceLevel, deviationClass, recommend, validateFinal,
  MARGIN, LIMIT, LOWER_GUIDE, feasible, check, options, sanitize
};
export default api;
