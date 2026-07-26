import React from 'react'
import { BRIGADAS_DATA, INCIDENCIAS } from '../../utils/constants'
import { calcularUPM, calcularVOE, calcularPanel } from '../../utils/helpers'

const Formulario = ({
  formData,
  setFormData,
  editandoId,
  sessionUser,
  folioDuplicado,
  onFolioChange,
  onVisitaChange,
  onUsuarioEncuestadorChange,
  onObservacionesChange,
  onSubmit,
  onLimpiar,
}) => {
  const handleBrigadaChangeLocal = (brigadaSel) => {
    const usuarios = Object.keys(BRIGADAS_DATA[brigadaSel] || {})
    const primerUsuario = usuarios[0] || ''
    setFormData((prev) => ({
      ...prev,
      brigada: brigadaSel,
      usuarioEncuestador: primerUsuario,
      nombreEncuestador: BRIGADAS_DATA[brigadaSel]?.[primerUsuario] || '',
    }))
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

  return (
    <div className="card-container">
      <h2 className="card-title">
        <span>
          {editandoId
            ? `Editando Registro #${editandoId}`
            : 'Formulario de Boleta'}
        </span>
        {editandoId && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onLimpiar}
          >
            Cancelar Edición
          </button>
        )}
      </h2>

      <form onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="cod-brigada">Brigada</label>
            <select
              className="form-control"
              autoFocus
              id="cod-brigada"
              value={formData.brigada}
              onChange={(e) => handleBrigadaChangeLocal(e.target.value)}
              required
            >
              {sessionUser.brigadas.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cod-folio">Codigo de Folio</label>
            <input
              className="form-control"
              type="text"
              id="cod-folio"
              required
              minLength={10}
              maxLength={30}
              pattern="[A-Za-z0-9\-]+"
              title="El folio debe contener entre 10 y 30 caracteres alfanuméricos"
              value={formData.folio}
              onChange={(e) => handleFolioChangeLocal(e.target.value.trim())}
              style={
                folioDuplicado
                  ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' }
                  : {}
              }
            />
            {folioDuplicado && (
              <span
                style={{
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                Este folio ya existe. No se permiten duplicados.
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="cod-usuario">Usuario Encuestador</label>
            <select
              id="cod-usuario"
              className="form-control"
              value={formData.usuarioEncuestador}
              onChange={(e) => onUsuarioEncuestadorChange(e.target.value)}
              required
            >
              {Object.keys(BRIGADAS_DATA[formData.brigada] || {}).map(
                (user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cod-visita">Numero de Visita</label>
            <input
              id="cod-visita"
              className="form-control"
              type="number"
              min="1"
              max="4"
              required
              value={formData.visita}
              onChange={(e) => onVisitaChange(e.target.value)}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="cod-observaciones">
              Detalle de Observaciones en la boleta
            </label>
            <textarea
              id="cod-observaciones"
              className="form-control"
              rows="2"
              value={formData.detalleObservaciones || ''}
              onChange={(e) => onObservacionesChange(e.target.value)}
              maxLength={500}
              placeholder="Separar observaciones con punto y coma (;)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cod-incidencias">Incidencia</label>
            <select
              id="cod-incidencias"
              className="form-control"
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

          <div className="form-group">
            <label htmlFor="cod-estado">Estado de Boleta</label>
            <select
              id="cod-estado"
              className={`form-control ${formData.estadoBoleta === 'SIN OBSERVACION' ? 'estado-sin-observacion' : formData.estadoBoleta === 'OBSERVADO' ? 'estado-observado' : formData.estadoBoleta === 'CORREGIDO' ? 'estado-corregido' : ''}`}
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

          <div className="form-group">
            <label htmlFor="cod-boleta-obser">Observación Boleta</label>
            <select
              id="cod-boleta-obser"
              className="form-control"
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

          <div className="form-group">
            <label htmlFor="cod-semana">Numero de Semana</label>
            <input
              id="cod-semana"
              className="form-control"
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

          <div className="form-group">
            <label htmlFor="cod-upm-ti">CODIGO DE UPM</label>
            <input
              id="cod-upm-ti"
              className="form-control"
              type="text"
              value={formData.upm}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="cod-voe">NUMERO DE VOE</label>
            <input
              id="cod-voe"
              className="form-control"
              type="text"
              value={formData.voe}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="cod-nombre">Nombre Encuestador</label>
            <input
              id="cod-nombre"
              className="form-control"
              type="text"
              value={formData.nombreEncuestador}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="cod-panel">Panel</label>
            <input
              id="cod-panel"
              className="form-control"
              type="text"
              value={formData.panel}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="cod-boleta-obs">Boleta Observada</label>
            <input
              id="cod-boleta-obs"
              className="form-control"
              type="text"
              value={formData.boletaObservada}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="cod-t-obs">Total Obs.</label>
            <input
              id="cod-t-obs"
              className="form-control"
              type="number"
              value={formData.totalObservaciones}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="cod-departamento">Departamento</label>
            <input
              id="cod-departamento"
              className="form-control"
              type="text"
              value={formData.departamento}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="cod-correlacion">N° Correlativo</label>
            <input
              id="cod-correlacion"
              className="form-control"
              type="text"
              value={formData.numeroCorrelativo}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="cod-upm">UPM Reemplazo</label>
            <input
              id="cod-upm"
              className="form-control"
              type="text"
              disabled
              value={formData.upmReemplazo || ''}
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="cod-upm-adicional">UPM Adicional</label>
            <input
              id="cod-upm-adicional"
              className="form-control"
              type="text"
              disabled
              value={formData.upmAdicional || ''}
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="cod-consolidado">Consolidada</label>
            <input
              id="cod-consolidado"
              className="form-control"
              type="text"
              value={formData.consolidada}
              readOnly
              disabled
            />
          </div>
        </div>
        <div className="form-group-corregido">
          <button type="submit" className="btn-submit-corregido">
            {editandoId
              ? 'Guardar Cambios (Actualizar)'
              : 'Guardar y Limpiar'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onLimpiar}
          >
            Limpiar Campos
          </button>
        </div>
      </form>
    </div>
  )
}

export default React.memo(Formulario)
