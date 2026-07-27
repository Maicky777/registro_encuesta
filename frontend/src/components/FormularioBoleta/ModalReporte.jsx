import React from 'react'

const ModalReporte = ({ modalData, onClose }) => {
  if (!modalData) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-white rounded-lg p-8 max-w-[400px] w-[90%] shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800">
          Reporte por Brigada y Semana
        </h3>
        <p className="text-sm text-slate-600 my-2">
          📲 <strong>BOLETA CON VARIACIONES</strong>
        </p>
        <p className="text-sm text-slate-600 my-2">
          <strong>BRIGADA:</strong> {modalData.brigada} -{' '}
          <strong>SEMANA:</strong> {parseInt(modalData.semana, 10)}
        </p>

        <p className="text-sm text-slate-600 my-2">
          <strong>TOTAL BOLETAS OBSERVADAS:</strong>{' '}
          {modalData.registros.length}
        </p>

        <div className="max-h-[250px] overflow-y-auto mt-3 border border-slate-200 rounded">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr>
                <th className="bg-slate-900 text-white px-2.5 py-1.5 sticky top-0">USUARIO</th>
                <th className="bg-slate-900 text-white px-2.5 py-1.5 sticky top-0">FOLIO</th>
                <th className="bg-slate-900 text-white px-2.5 py-1.5 sticky top-0">TOTAL OBS.</th>
              </tr>
            </thead>
            <tbody>
              {modalData.registros.map((r) => (
                <tr key={r.id}>
                  <td className="px-2.5 py-1 border-b border-slate-200 text-slate-600">{r.usuarioEncuestador}</td>
                  <td className="px-2.5 py-1 border-b border-slate-200 text-slate-600">{r.folio}</td>
                  <td className="px-2.5 py-1 border-b border-slate-200 text-slate-600">{r.totalObservaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-slate-100 rounded-md text-[0.85rem] text-left">
          <p>
            <span>
              📲 *_Buenas tardes equipo, se adiciona una voe para su
              verificacion y/o correccion_*
            </span>{' '}
            <br />
            <br />
            <strong>*Usuario:*</strong>{' '}
            {modalData.registroSeleccionado.usuarioEncuestador} <br />
            <strong>*Folio:*</strong> {modalData.registroSeleccionado.folio}{' '}
            <br />
            <strong>*Total de Observaciones:*</strong>{' '}
            {modalData.registroSeleccionado.totalObservaciones}
          </p>
        </div>

        <button
          className="bg-slate-900 text-white border-none px-4 py-2 rounded font-semibold cursor-pointer text-xs w-full mt-4 hover:bg-slate-700 transition-colors"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

export default React.memo(ModalReporte)
