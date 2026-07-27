import React, { useState } from 'react'
import ReporteAvance from './ReporteAvance'
import TablaRegistros from './TablaRegistros'

const TabIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125m1.5 3.75c-.621 0-1.125-.504-1.125-1.125" />
  </svg>
)

const AvanceIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
)

const PanelDatos = ({
  registros,
  semana,
  registrosFiltrados,
  filtroGeneral,
  onFiltroChange,
  onEditar,
  onEliminar,
  onDoubleClickCorregir,
  onReporte,
  rol,
}) => {
  const [activeTab, setActiveTab] = useState('tabla')

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold tracking-wide">BD</span>
            </div>
            <div>
              <h2 className="text-[0.95rem] font-bold text-slate-900 leading-tight">
                Registro de Datos de Boletas
              </h2>
              <p className="text-[0.7rem] text-slate-400 mt-0.5">
                {registrosFiltrados.length === registros.length
                  ? `${registros.length} registros en total`
                  : `${registrosFiltrados.length} de ${registros.length} registros`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[0.72rem] font-semibold">
              <span className={`w-1.5 h-1.5 rounded-full ${registrosFiltrados.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              {registrosFiltrados.length} registros
            </span>

            <div className="flex rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <button
                onClick={() => setActiveTab('avance')}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-[0.75rem] font-semibold transition-all duration-200 ${
                  activeTab === 'avance'
                    ? 'bg-slate-900 text-white shadow-inner'
                    : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <AvanceIcon />
                Avance UPM
              </button>
              <button
                onClick={() => setActiveTab('tabla')}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-[0.75rem] font-semibold transition-all duration-200 border-l border-slate-200 ${
                  activeTab === 'tabla'
                    ? 'bg-slate-900 text-white shadow-inner'
                    : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <TabIcon />
                Tabla de Datos
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        {activeTab === 'avance' ? (
          <ReporteAvance registros={registros} semana={semana} />
        ) : (
          <TablaRegistros
            registrosFiltrados={registrosFiltrados}
            filtroGeneral={filtroGeneral}
            onFiltroChange={onFiltroChange}
            onEditar={onEditar}
            onEliminar={onEliminar}
            onDoubleClickCorregir={onDoubleClickCorregir}
            onReporte={onReporte}
            rol={rol}
          />
        )}
      </div>
    </div>
  )
}

export default React.memo(PanelDatos)
