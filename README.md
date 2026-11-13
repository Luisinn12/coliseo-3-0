# COLISEO 3.0 – Draft de Capitanes

Simulador de draft para el torneo Coliseo 3.0 (Dota 2): sorteo del primer turno, Snake Draft de 16 selecciones,
balance de MMR en vivo, recomendaciones (nunca eligen por el capitán) y pantalla final exportable a PNG.

React 19 + Vite. Sin backend: el progreso se guarda en `localStorage` (clave `coliseo30_state_v1`).

## Uso local

```bash
npm install
npm run dev        # desarrollo en http://localhost:5173
npm run build      # genera ./dist
npm run preview    # sirve ./dist
npm test           # pruebas de la lógica (sorteo, snake, 16 picks, deshacer, sumas)
```

Requiere Node.js 18 o superior.

## Despliegue en Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. En Vercel: **Add New → Project** e importa el repositorio.
3. Vercel detecta Vite solo: Build Command `npm run build`, Output Directory `dist`. Pulsa **Deploy**.

## Estructura

```
src/
  logic/coliseo.js        datos (20 jugadores), sorteo, Snake Draft, cálculos y recomendaciones
  logic/coliseo.test.js   pruebas automáticas de la lógica
  components/             Hero, DrawScreen (ruleta), DraftScreen, TeamCard, FinalScreen, Modal
  utils/                  formato, almacenamiento local, efectos, exportación PNG/texto
  App.jsx  main.jsx  styles.css
```

## Datos

Fuente: Excel "MMR según encuesta". Los 20 jugadores suman 75,393 MMR; objetivo por equipo 18,848.25.
Para cambiar jugadores o MMR edita `PLAYERS` en `src/logic/coliseo.js` (los capitanes llevan `captain: true`).
