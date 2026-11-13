import { useEffect, useState } from 'react';
import * as C from './logic/coliseo.js';
import { fmt } from './utils/format.js';
import { loadState, saveState } from './utils/storage.js';
import { toast, burst } from './utils/effects.js';
import { resultText, downloadPng } from './utils/result.js';
import Hero from './components/Hero.jsx';
import DrawScreen from './components/DrawScreen.jsx';
import DraftScreen from './components/DraftScreen.jsx';
import FinalScreen from './components/FinalScreen.jsx';
import Modal from './components/Modal.jsx';

export default function App() {
  const [state, setState] = useState(loadState);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [copyText, setCopyText] = useState(null);
  const [flash, setFlash] = useState({ cap: null, pick: null });
  const [wipes, setWipes] = useState(0); // reinicia la ruleta en "nueva edición"

  // guardado automático del progreso
  useEffect(() => { saveState(state); }, [state]);

  const screen = state.finished ? 'final' : (state.first && state.started ? 'draft' : 'draw');

  function confirmPick() {
    const tn = C.turn(state);
    if (tn.done || !selected) return;
    try {
      const p = C.BY_ID[selected], cap = tn.captain;
      setState(C.pick(state, cap, selected));
      setFlash({ cap, pick: selected }); setSelected(null);
      burst(`${C.CAP_LABEL[cap]} → ${p.name}<br><span style="font-size:.55em">+${fmt(p.mmr)} MMR</span>`);
      setTimeout(() => setFlash({ cap: null, pick: null }), 1200);
    } catch (e) { toast(e.message); }
  }
  function undoPick() {
    if (!state.picks.length) return;
    setSelected(null); setFlash({ cap: null, pick: null });
    setState(C.undo(state)); toast('Última selección deshecha');
  }
  function finish() {
    const errs = C.validateFinal(state);
    if (errs.length) { toast(errs[0]); return; }
    setState({ ...state, finished: true });
  }
  function modalAction(a) {
    setModal(null); setSelected(null); setCopyText(null);
    if (a === 'keep') setState({ ...state, picks: [], finished: false, started: true });
    else if (a === 'redo' || a === 'wipe') { setState(C.initialState()); setWipes(w => w + 1); }
  }
  async function copyResult() {
    const txt = resultText(state);
    try { await navigator.clipboard.writeText(txt); toast('Resultado copiado'); }
    catch (e) { setCopyText(txt); }
  }
  async function exportPng() {
    try { await downloadPng(state); toast('Imagen lista'); }
    catch (e) { toast('No se pudo guardar la imagen'); }
  }

  return (
    <>
      <Hero />
      <div className="wrap">
        {screen === 'draw' && (
          <DrawScreen
            key={wipes}
            first={state.first}
            onWinner={(winner) => setState(s => ({ ...s, first: winner, started: false, picks: [], finished: false }))}
            onStart={() => setState({ ...state, started: true })}
            onNew={() => setModal('new')}
          />
        )}
        {screen === 'draft' && (
          <DraftScreen
            state={state} selected={selected} onSelect={setSelected} flash={flash}
            onConfirm={confirmPick} onUndo={undoPick} onReset={() => setModal('reset')} onFinish={finish}
          />
        )}
        {screen === 'final' && (
          <FinalScreen
            state={state} copyText={copyText}
            onPng={exportPng} onCopy={copyResult}
            onBack={() => { setState({ ...state, finished: false }); setCopyText(null); }}
            onNew={() => setModal('new')}
          />
        )}
      </div>
      <Modal kind={modal} onAction={modalAction} />
      <footer>Coliseo 3.0 · MMR según encuesta · Total 75,393 · Objetivo por equipo 18,848.25 · El progreso se guarda automáticamente en este navegador</footer>
    </>
  );
}
