function Swords() {
  return (
    <svg width="46" height="46" viewBox="0 0 48 48" fill="none" stroke="#d4a73a" strokeWidth="2.5" strokeLinecap="round">
      <path d="M8 8l22 22M40 8L18 30M28 32l6 6M20 32l-6 6M30 30l4 4M18 30l-4 4" />
      <circle cx="24" cy="24" r="21" stroke="#c1121f" />
    </svg>
  );
}

export default function Hero() {
  return (
    <header className="hero">
      <div className="emb">
        <Swords />
        <h1>COLISEO 3.0</h1>
        <Swords />
      </div>
      <h2>DRAFT DE CAPITANES</h2>
      <p>Cuatro líderes. Cuatro equipos. Una sola corona.</p>
      <div className="rule"></div>
    </header>
  );
}
