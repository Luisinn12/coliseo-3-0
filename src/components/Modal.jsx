export default function Modal({ kind, onAction }) {
  if (!kind) return null;
  return (
    <div className="ov">
      <div className="card modal">
        {kind === 'reset' ? (
          <>
            <h3>Reiniciar draft</h3>
            <p>Se borrarán todas las selecciones. ¿Qué hacemos con el sorteo?</p>
            <div className="row">
              <button className="btn red" onClick={() => onAction('keep')}>Conservar el sorteo original</button>
              <button className="btn" onClick={() => onAction('redo')}>Realizar un sorteo nuevo</button>
              <button className="btn" onClick={() => onAction('cancel')}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <h3>Nueva edición</h3>
            <p>Se borrará el sorteo, las selecciones y el resultado. Esta acción no se puede deshacer.</p>
            <div className="row">
              <button className="btn red" onClick={() => onAction('wipe')}>Sí, empezar nueva edición</button>
              <button className="btn" onClick={() => onAction('cancel')}>Cancelar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
