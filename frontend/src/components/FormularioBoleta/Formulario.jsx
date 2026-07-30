import React, { useMemo } from 'react'
import { INCIDENCIAS, MAX_POR_UPM, INCIDENCIA_TRASLADO } from '../../utils/constants'
import { calcularUPM, calcularVOE } from '../../utils/helpers'

const estadoSelectClass = (estado) => {
  const base = 'w-full px-2.5 py-1.5 text-[0.82rem] border rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed'
  if (estado === 'SIN OBSERVACION') return `${base} text-green-700 bg-green-50 border-green-200 font-semibold`
  if (estado === 'OBSERVADO') return `${base} text-red-700 bg-red-50 border-red-200 font-semibold`
  if (estado === 'CORREGIDO') return `${base} text-blue-700 bg-blue-50 border-blue-200 font-semibold`
  return `${base} border-slate-300`
}

const Formulario = ({
  formData,
  setFormData,
  editandoId,
  brigadas,
  encuestadores,
  folioDuplicado,
  submitting,
  registros,
  canEditUpmReemplazo,
  rol,
  departments,
  selectedDepartamento,
  onDepartamentoChange,
  onBrigadaChange,
  onFolioChange,
  onVisitaChange,
  onUsuarioEncuestadorChange,
  onObservacionesChange,
  onSubmit,
  onLimpiar,
  brigadaRef,
}) => {
  const handleBrigadaChangeLocal = (brigadaSel) => {
    if (onBrigadaChange) {
      onBrigadaChange(brigadaSel)
    }
  }

  const handleFolioChangeLocal = (val) => {
    const upmCalculada = calcularUPM(val)
    const voeCalculado = calcularVOE(val)
    if (onFolioChange) {
      onFolioChange(val)
    }
    setFormData((prev) => ({
      ...prev,
      folio: val,
      upm: upmCalculada,
      voe: voeCalculado,
    }))
  }

  const inputClass = 'w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed'

  const avanceBrigadas = useMemo(() => {
    if (!registros) return []
    const semana = parseInt(formData.semana, 10) || 0
    const registrosSemana = registros.filter((r) => parseInt(r.semana, 10) === semana)
    if (registrosSemana.length === 0) return []

    const agrupado = {}
    for (const r of registrosSemana) {
      const key = r.brigada
      if (!agrupado[key]) agrupado[key] = { upms: new Set(), validas: 0, traslados: 0, observadas: 0, upmList: [], upmDetalle: {} }
      agrupado[key].upms.add(r.upm)
      if (r.incidencia !== INCIDENCIA_TRASLADO) {
        agrupado[key].validas++
      } else {
        agrupado[key].traslados++
      }
      const isObservada = r.estadoBoleta === 'OBSERVADO'
      if (isObservada) agrupado[key].observadas++
      agrupado[key].upmList.push({ upm: r.upm, folio: r.folio, incidencia: r.incidencia, observada: isObservada })

      if (!agrupado[key].upmDetalle[r.upm]) agrupado[key].upmDetalle[r.upm] = { total: 0, observadas: 0 }
      agrupado[key].upmDetalle[r.upm].total++
      if (isObservada) agrupado[key].upmDetalle[r.upm].observadas++
    }

    return Object.entries(agrupado).map(([brigada, info]) => {
      const max = info.upms.size * MAX_POR_UPM
      const pct = max > 0 ? Math.round((info.validas / max) * 100) : 0
      const upmResumen = Object.entries(info.upmDetalle).map(([upm, det]) => ({
        upm,
        total: det.total,
        observadas: det.observadas,
      }))
      return {
        brigada,
        upms: info.upms.size,
        validas: info.validas,
        traslados: info.traslados,
        observadas: info.observadas,
        max,
        pct,
        upmList: info.upmList,
        upmResumen,
      }
    })
  }, [registros, formData.semana])

  return (
    <div className="max-w-6xl mx-auto my-5 bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800 flex justify-between items-center">
        <span>
          {editandoId
            ? `Editando Registro #${editandoId}`
            : 'Formulario de Boleta'}
        </span>
        {editandoId && (
          <button
            type="button"
            className="bg-slate-500 text-white border-none px-4 py-2 rounded cursor-pointer text-xs hover:bg-slate-600 transition-colors"
            onClick={onLimpiar}
            disabled={submitting}
          >
            Cancelar Edición
          </button>
        )}
      </h2>

      <form onSubmit={onSubmit} noValidate>
        <div className="flex flex-nowrap gap-3 mb-3">
          {rol === 'administrador' && departments.length > 0 && (
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-departamento-sel">Departamento</label>
              <select
                className={inputClass}
                id="cod-departamento-sel"
                value={selectedDepartamento}
                onChange={(e) => onDepartamentoChange(e.target.value)}
                required
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col flex-1 min-w-0">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-brigada">Brigada</label>
            <select
              ref={brigadaRef}
              className={inputClass}
              autoFocus
              id="cod-brigada"
              value={formData.brigada}
              onChange={(e) => handleBrigadaChangeLocal(e.target.value)}
              required
            >
              {brigadas.map((b) => (
                <option key={b.id} value={b.nombre}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-folio">Codigo de Folio</label>
            <input
              className={`${inputClass} ${folioDuplicado ? 'border-red-500 bg-red-50' : ''}`}
              type="text"
              id="cod-folio"
              required
              minLength={10}
              maxLength={30}
              pattern="[A-Za-z0-9\-]+"
              title="El folio debe contener entre 10 y 30 caracteres alfanuméricos"
              value={formData.folio}
              onChange={(e) => handleFolioChangeLocal(e.target.value.trim())}
            />
            {folioDuplicado && (
              <span className="text-red-500 text-[0.75rem] mt-0.5 block">
                Folio duplicado
              </span>
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-usuario">Encuestador</label>
            <select
              id="cod-usuario"
              className={inputClass}
              value={formData.usuarioEncuestador}
              onChange={(e) => onUsuarioEncuestadorChange(e.target.value)}
              required
            >
              <option value="">-- Seleccionar --</option>
              {[...encuestadores].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((enc) => (
                <option key={enc.id} value={enc.codigo}>
                  {enc.codigo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-visita">Visita</label>
            <input
              id="cod-visita"
              className={inputClass}
              type="number"
              min="1"
              max="4"
              required
              value={formData.visita}
              onChange={(e) => onVisitaChange(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 mb-3">
          <div className="flex flex-col col-span-full">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-observaciones">
              Detalle de Observaciones en la boleta
            </label>
            <textarea
              id="cod-observaciones"
              className={inputClass}
              rows="2"
              value={formData.detalleObservaciones || ''}
              onChange={(e) => onObservacionesChange(e.target.value)}
              maxLength={500}
              placeholder="Separar observaciones con punto y coma (;)"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-incidencias">Incidencia</label>
            <select
              id="cod-incidencias"
              className={inputClass}
              value={formData.incidencia}
              required
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  incidencia: e.target.value,
                }))
              }
            >
              {INCIDENCIAS.map((inc) => (
                <option key={inc} value={inc}>
                  {inc}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-estado">Estado de Boleta</label>
            <select
              id="cod-estado"
              className={estadoSelectClass(formData.estadoBoleta)}
              value={formData.estadoBoleta}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estadoBoleta: e.target.value,
                }))
              }
            >
              <option value="SIN OBSERVACION">SIN OBSERVACION</option>
              <option value="OBSERVADO">OBSERVADO</option>
              <option value="CORREGIDO">CORREGIDO</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-boleta-obser">Observación Boleta</label>
            <select
              id="cod-boleta-obser"
              className={inputClass}
              disabled={formData.totalObservaciones === 0}
              value={formData.observacionBoleta || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  observacionBoleta: e.target.value,
                }))
              }
            >
              <option value="">-- Seleccionar --</option>
              <option value="ENVIADO">ENVIADO</option>
              <option value="NO ENVIADO">NO ENVIADO</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-semana">Numero de Semana</label>
            <input
              id="cod-semana"
              className={inputClass}
              type="number"
              min="1"
              max="53"
              step="1"
              required
              value={formData.semana}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  semana: parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-upm-ti">CODIGO DE UPM</label>
            <input
              id="cod-upm-ti"
              className={inputClass}
              type="text"
              value={formData.upm}
              readOnly
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-voe">NUMERO DE VOE</label>
            <input
              id="cod-voe"
              className={inputClass}
              type="text"
              value={formData.voe}
              readOnly
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-nombre">Nombre Encuestador</label>
            <input
              id="cod-nombre"
              className={inputClass}
              type="text"
              value={formData.nombreEncuestador}
              readOnly
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-panel">Panel</label>
            <input
              id="cod-panel"
              className={inputClass}
              type="text"
              value={formData.panel}
              readOnly
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-boleta-obs">Boleta Observada</label>
            <input
              id="cod-boleta-obs"
              className={inputClass}
              type="text"
              value={formData.boletaObservada}
              readOnly
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-t-obs">Total Obs.</label>
            <input
              id="cod-t-obs"
              className={inputClass}
              type="number"
              value={formData.totalObservaciones}
              readOnly
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-departamento">Departamento</label>
            <input
              id="cod-departamento"
              className={inputClass}
              type="text"
              value={formData.departamento}
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-correlacion">N° Correlativo</label>
            <input
              id="cod-correlacion"
              className={inputClass}
              type="text"
              value={formData.numeroCorrelativo}
              readOnly
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-upm">
              UPM Reemplazo
              {canEditUpmReemplazo && (
                <span className="ml-1 text-[0.6rem] font-normal text-amber-600 normal-case tracking-normal">(Visita 1 - 1er registro)</span>
              )}
            </label>
            <input
              id="cod-upm"
              className={`${inputClass} ${canEditUpmReemplazo ? 'border-amber-300 bg-amber-50/50' : ''}`}
              type="text"
              disabled={!canEditUpmReemplazo}
              readOnly={!canEditUpmReemplazo}
              value={formData.upmReemplazo || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  upmReemplazo: e.target.value,
                }))
              }
              placeholder={canEditUpmReemplazo ? 'Ingrese UPM de reemplazo...' : ''}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-upm-adicional">UPM Adicional</label>
            <input
              id="cod-upm-adicional"
              className={inputClass}
              type="text"
              disabled
              value={formData.upmAdicional || ''}
              readOnly
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest" htmlFor="cod-consolidado">Consolidada</label>
            <select
              id="cod-consolidado"
              className={inputClass}
              value={formData.consolidada}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  consolidada: e.target.value,
                }))
              }
            >
              <option value="SI">SI</option>
              <option value="NO">NO</option>
            </select>
          </div>
        </div>
        <div className="flex gap-5 mx-5 mt-5 justify-center">
          <button type="submit" className="bg-slate-900 text-white border-none px-4 py-2 rounded font-semibold cursor-pointer text-xs w-[30%] hover:bg-slate-700 transition-colors" disabled={submitting}>
            {submitting
              ? 'Guardando...'
              : editandoId
                ? 'Guardar Cambios (Actualizar)'
                : 'Guardar y Limpiar'}
          </button>
          <button
            type="button"
            className="bg-slate-500 text-white border-none px-4 py-2 rounded cursor-pointer text-xs w-[30%] hover:bg-slate-600 transition-colors"
            onClick={onLimpiar}
            disabled={submitting}
          >
            Limpiar Campos
          </button>
        </div>

        {avanceBrigadas.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-[0.68rem] font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Avance UPM - Semana {formData.semana}
            </p>
            <div className="flex flex-wrap gap-2">
              {avanceBrigadas.map((b) => (
                <div
                  key={b.brigada}
                  className="relative group flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 cursor-default"
                >
                  <span className="text-[0.72rem] font-bold text-slate-700">{b.brigada}</span>
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-300 ${
                        b.pct >= 100 ? 'bg-green-500' : b.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                  <span className={`text-[0.68rem] font-bold ${b.pct >= 100 ? 'text-green-600' : b.pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {b.pct}%
                  </span>
                  <span className="text-[0.62rem] text-slate-400">
                    {b.validas}/{b.max}
                  </span>

                  {/* Tooltip detallado */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                    <div className="bg-slate-900 text-white rounded-lg shadow-xl p-3 text-left">
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-700">
                        <span className="text-[0.75rem] font-bold">{b.brigada}</span>
                        <span className={`text-[0.65rem] font-bold px-1.5 py-0.5 rounded ${
                          b.pct >= 100 ? 'bg-green-800 text-green-200' : b.pct >= 50 ? 'bg-amber-800 text-amber-200' : 'bg-red-800 text-red-200'
                        }`}>
                          {b.pct}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[0.65rem] mb-2">
                        <span className="text-slate-400">UPMs visitadas:</span>
                        <span className="font-semibold text-right">{b.upms}</span>
                        <span className="text-slate-400">Encuestas válidas:</span>
                        <span className="font-semibold text-green-400 text-right">{b.validas}</span>
                        <span className="text-slate-400">Traslados:</span>
                        <span className="font-semibold text-amber-400 text-right">{b.traslados}</span>
                        <span className="text-slate-400">Boletas observadas:</span>
                        <span className={`font-semibold text-right ${b.observadas > 0 ? 'text-red-400' : 'text-green-400'}`}>{b.observadas}</span>
                        <span className="text-slate-400">Máximo posible:</span>
                        <span className="font-semibold text-right">{b.max}</span>
                      </div>
                      {b.upmResumen.length > 0 && (
                        <div className="border-t border-slate-700 pt-1.5">
                          <span className="text-[0.6rem] text-slate-400 uppercase tracking-wider">Boletas observadas por UPM</span>
                          <div className="mt-1 max-h-32 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-600">
                            {b.upmResumen.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[0.6rem]">
                                <span className="text-slate-300 truncate max-w-[180px]">{item.upm}</span>
                                <span className={`px-1.5 py-0.5 rounded font-medium ${
                                  item.observadas > 0 ? 'bg-red-900/50 text-red-300' : 'bg-green-900/30 text-green-400'
                                }`}>
                                  {item.observadas > 0 ? `${item.observadas} obs` : 'OK'}
                                </span>
                                <span className="text-slate-500 text-[0.55rem]">{item.total} b</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default React.memo(Formulario)
