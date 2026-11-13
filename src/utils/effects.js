export function toast(text) {
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = text;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2600);
}

// html: texto estático generado por la app (nombres y MMR del torneo)
export function burst(html) {
  const d = document.createElement('div');
  d.className = 'burst';
  d.innerHTML = html;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1400);
}

export function rand32() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0];
}
