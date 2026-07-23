import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'

const API_URL = 'http://localhost:5000/api/boletas'

const BRIGADAS_DATA = {
  'Brigada 1': { ece70101: 'Griselda', ece70102: 'Diego', ece70103: 'Geovani' },
  'Brigada 2': { ece70201: 'Jesus', ece70202: 'Elizabeth', ece70203: 'Jhonny' },
  'Brigada 7': {
    ece70701: 'Cristian',
    ece70702: 'Jesica',
    ece70703: 'Sulmian',
  },
}

const INCIDENCIAS = [
  '1: ENTREVISTA COMPLETA',
  '2: ENTREVISTA INCOMPLETA',
  '3: TEMPORALMENTE AUSENTE',
  '4: INFORMANTE NO CALIFICADO',
  '5: FALTA DE CONTACTO',
  '6: RECHAZO',
  '7: VIVIENDA DESOCUPADA',
  '8: ENTREVISTA FUERA DE PERIODO',
  '9: TRASLADO',
]

export default function FormularioBoleta({ sessionUser }) {
  const [registros, setRegistros] = useState([])
  const [filtroGeneral, setFiltroGeneral] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const fileInputRef = useRef(null)

  const initialFormState = {
    departamento: sessionUser.departamento,
    brigada: sessionUser.brigadas[0] || 'Brigada 1',
    folio: '',
    upm: '',
    upmReemplazo: '',
    upmAdicional: '',
    semana: '',
    visita: '',
    panel: '',
    numeroCorrelativo: 1,
    voe: '',
    usuarioEncuestador: 'ece70101',
    nombreEncuestador: 'Griselda',
    incidencia: INCIDENCIAS[0],
    detalleObservaciones: '',
    totalObservaciones: 0,
    boletaObservada: 'NO',
    estadoBoleta: 'SIN OBSERVACION',
    observacionBoleta: '',
    observacionPersonal: '',
    consolidada: 'NO',
  }

  const [formData, setFormData] = useState(initialFormState)

  // Cargar registros al montar el componente
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    obtenerRegistros()
  }, [])

  const obtenerRegistros = async () => {
    try {
      const res = await axios.get(API_URL)
      setRegistros(res.data)
    } catch (err) {
      console.error('Error al conectar con SQLite:', err)
    }
  }

  // Funciion para reiniciar/limpiar el formulario
  const limpiarFormulario = () => {
    setFormData(initialFormState)
    setEditandoId(null)
  }

  const handleFolioChange = (val) => {
    const upmCalculada = val.length >= 17 ? val.substring(0, 17) : val
    const voeCalculado = val.length >= 4 ? val.slice(-4) : ''
    const conteoUpmPrevias = registros.filter(
      (r) => r.upm === upmCalculada && r.id !== editandoId,
    ).length
    const existeFolio = registros.some(
      (r) => r.folio === val && val !== '' && r.id !== editandoId,
    )

    setFormData((prev) => ({
      ...prev,
      folio: val,
      upm: upmCalculada,
      voe: voeCalculado,
      numeroCorrelativo: conteoUpmPrevias + 1,
      consolidada: existeFolio ? 'SI' : 'NO',
    }))
  }

  const handleVisitaChange = (val) => {
    let panelResultante = ''
    const numVisita = parseInt(val, 10)
    if (numVisita === 4) panelResultante = 'PANEL 43'
    else if (numVisita === 3) panelResultante = 'PANEL 44'
    else if (numVisita === 2) panelResultante = 'PANEL 45'
    else if (numVisita === 1) panelResultante = 'PANEL 46 / PANEL 0'

    setFormData((prev) => ({ ...prev, visita: val, panel: panelResultante }))
  }

  const handleBrigadaChange = (brigadaSel) => {
    const usuarios = Object.keys(BRIGADAS_DATA[brigadaSel] || {})
    const primerUsuario = usuarios[0] || ''
    setFormData((prev) => ({
      ...prev,
      brigada: brigadaSel,
      usuarioEncuestador: primerUsuario,
      nombreEncuestador: BRIGADAS_DATA[brigadaSel]?.[primerUsuario] || '',
    }))
  }

  const handleUsuarioEncuestadorChange = (userSel) => {
    setFormData((prev) => ({
      ...prev,
      usuarioEncuestador: userSel,
      nombreEncuestador: BRIGADAS_DATA[formData.brigada]?.[userSel] || '',
    }))
  }

  const handleObservacionesChange = (texto) => {
    const frases = texto.split(';').filter((f) => f.trim().length > 0)
    const total = frases.length
    setFormData((prev) => ({
      ...prev,
      detalleObservaciones: texto,
      totalObservaciones: total,
      boletaObservada: total > 0 ? 'SI' : 'NO',
      observacionBoleta: total > 0 ? 'ENVIADO' : '',
    }))
  }

  // --- ACCIONES CRUD ---

  // Guardar (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault()
    const fechaActual = new Date().toISOString().split('T')[0]
    const payload = { ...formData, fechaFinalConsolidacion: fechaActual }

    try {
      if (editandoId) {
        await axios.put(`${API_URL}/${editandoId}`, payload)
        alert('Registro actualizado correctamente.')
      } else {
        await axios.post(API_URL, payload)
        alert('Registro guardado en SQLite.')
      }
      obtenerRegistros()
      limpiarFormulario() // Limpia el formulario tras guardar
    } catch (err) {
      alert('Error al guardar datos: ' + err.message)
    }
  }

  // Cargar registro en el formulario para editar
  const handleEditar = (reg) => {
    setEditandoId(reg.id)
    setFormData(reg)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Eliminar
  const handleEliminar = async (id) => {
    if (
      window.confirm(
        '¿Está seguro de eliminar este registro de la base de datos?',
      )
    ) {
      try {
        await axios.delete(`${API_URL}/${id}`)
        obtenerRegistros()
      } catch (err) {
        alert('Error al eliminar: ' + err.message)
      }
    }
  }

  // --- REPORTES Y ARCHIVOS ---

  // Exportar a EXCEL
  const exportarExcel = () => {
    if (registros.length === 0) return alert('No hay datos para exportar.')
    const worksheet = XLSX.utils.json_to_sheet(registros)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Boletas')
    XLSX.writeFile(
      workbook,
      `Reporte_Boletas_${new Date().toISOString().split('T')[0]}.xlsx`,
    )
  }

  // Exportar a JSON
  const exportarJSON = () => {
    if (registros.length === 0) return alert('No hay datos para exportar.')
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(registros, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute(
      'download',
      `boletas_${new Date().toISOString().split('T')[0]}.json`,
    )
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Cargar datos desde JSON
  const cargarJSON = (e) => {
    const fileReader = new FileReader()
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8')
      fileReader.onload = async (event) => {
        try {
          const parsedData = JSON.parse(event.target.result)
          if (Array.isArray(parsedData)) {
            await axios.post(`${API_URL}/batch`, parsedData)
            alert('Datos del archivo JSON importados correctamente a SQLite.')
            obtenerRegistros()
          } else {
            alert('El archivo JSON debe contener una lista de registros.')
          }
        } catch (err) {
          alert('Error al leer el archivo JSON: ' + err.message)
        }
      }
    }
  }

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'SIN OBSERVACION':
        return 'estado-sin-observacion'
      case 'OBSERVADO':
        return 'estado-observado'
      case 'CORREGIDO':
        return 'estado-corregido'
      default:
        return ''
    }
  }

  const registrosFiltrados = registros.filter((reg) => {
    const busqueda = filtroGeneral.toLowerCase().trim()
    if (!busqueda) return true
    return Object.values(reg).some((val) =>
      String(val).toLowerCase().includes(busqueda),
    )
  })

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
      {/* SECCIÓN FORMULARIO */}
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
              onClick={limpiarFormulario}
            >
              Cancelar Edición
            </button>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Departamento</label>
            <input
              className="form-control"
              type="text"
              value={formData.departamento}
              disabled
            />
          </div>

          <div className="form-group">
            <label>Brigada</label>
            <select
              className="form-control"
              value={formData.brigada}
              onChange={(e) => handleBrigadaChange(e.target.value)}
            >
              {sessionUser.brigadas.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Folio (Obligatorio)</label>
            <input
              className="form-control"
              type="text"
              required
              value={formData.folio}
              onChange={(e) => handleFolioChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>UPM (Primeros 17)</label>
            <input
              className="form-control"
              type="text"
              value={formData.upm}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label>VOE (Últimos 4)</label>
            <input
              className="form-control"
              type="text"
              value={formData.voe}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label>N° Correlativo</label>
            <input
              className="form-control"
              type="text"
              value={formData.numeroCorrelativo}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label>UPM Reemplazo</label>
            <input
              className="form-control"
              type="text"
              value={formData.upmReemplazo || ''}
              onChange={(e) =>
                setFormData({ ...formData, upmReemplazo: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>UPM Adicional</label>
            <input
              className="form-control"
              type="text"
              value={formData.upmAdicional || ''}
              onChange={(e) =>
                setFormData({ ...formData, upmAdicional: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Semana (Requisito)</label>
            <input
              className="form-control"
              type="text"
              required
              value={formData.semana}
              onChange={(e) =>
                setFormData({ ...formData, semana: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Visita (Requisito)</label>
            <input
              className="form-control"
              type="number"
              min="1"
              max="4"
              required
              value={formData.visita}
              onChange={(e) => handleVisitaChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Panel</label>
            <input
              className="form-control"
              type="text"
              value={formData.panel}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label>Usuario Encuestador</label>
            <select
              className="form-control"
              value={formData.usuarioEncuestador}
              onChange={(e) => handleUsuarioEncuestadorChange(e.target.value)}
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
            <label>Nombre Encuestador</label>
            <input
              className="form-control"
              type="text"
              value={formData.nombreEncuestador}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label>Incidencia</label>
            <select
              className="form-control"
              value={formData.incidencia}
              onChange={(e) =>
                setFormData({ ...formData, incidencia: e.target.value })
              }
            >
              {INCIDENCIAS.map((inc) => (
                <option key={inc} value={inc}>
                  {inc}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group full-width">
            <label>Detalle Observaciones (Separadas por ;)</label>
            <textarea
              className="form-control"
              rows="2"
              value={formData.detalleObservaciones || ''}
              onChange={(e) => handleObservacionesChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Total Obs.</label>
            <input
              className="form-control"
              type="number"
              value={formData.totalObservaciones}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label>Boleta Observada</label>
            <input
              className="form-control"
              type="text"
              value={formData.boletaObservada}
              readOnly
              disabled
            />
          </div>

          <div className="form-group">
            <label>Estado de Boleta</label>
            <select
              className={`form-control ${getEstadoClass(formData.estadoBoleta)}`}
              value={formData.estadoBoleta}
              onChange={(e) =>
                setFormData({ ...formData, estadoBoleta: e.target.value })
              }
            >
              <option value="SIN OBSERVACION">SIN OBSERVACION</option>
              <option value="OBSERVADO">OBSERVADO</option>
              <option value="CORREGIDO">CORREGIDO</option>
            </select>
          </div>

          <div className="form-group">
            <label>Observación Boleta</label>
            <select
              className="form-control"
              disabled={formData.totalObservaciones === 0}
              value={formData.observacionBoleta || ''}
              onChange={(e) =>
                setFormData({ ...formData, observacionBoleta: e.target.value })
              }
            >
              <option value="">-- Seleccionar --</option>
              <option value="ENVIADO">ENVIADO</option>
              <option value="NO ENVIADO">NO ENVIADO</option>
            </select>
          </div>

          <div className="form-group">
            <label>Observación Personal</label>
            <input
              className="form-control"
              type="text"
              value={formData.observacionPersonal || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  observacionPersonal: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Consolidada</label>
            <input
              className="form-control"
              type="text"
              value={formData.consolidada}
              readOnly
              disabled
            />
          </div>

          <div
            className="form-group full-width"
            style={{ display: 'flex', gap: '10px' }}
          >
            <button type="submit" className="btn-submit">
              {editandoId
                ? 'Guardar Cambios (Actualizar)'
                : 'Guardar y Limpiar'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={limpiarFormulario}
            >
              Limpiar Campos
            </button>
          </div>
        </form>
      </div>

      {/* BARRA DE HERRAMIENTAS DE REPORTES Y ARCHIVOS */}
      <div className="card-container">
        <div className="toolbar-actions">
          <button className="btn-excel" onClick={exportarExcel}>
            📊 Generar Reporte Excel (.xlsx)
          </button>
          <button className="btn-json" onClick={exportarJSON}>
            ⬇️ Exportar JSON
          </button>
          <button
            className="btn-json"
            onClick={() => fileInputRef.current.click()}
          >
            ⬆️ Cargar JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={cargarJSON}
          />
        </div>
      </div>

      {/* SECCIÓN TABLA CON FILTRO */}
      <div className="card-container">
        <div className="card-title">
          <span>Base de Datos de Boletas (SQLite)</span>
          <span className="badge-count">
            {registrosFiltrados.length} Registros
          </span>
        </div>

        <div className="search-box">
          <input
            type="text"
            className="form-control search-input"
            placeholder="🔍 Buscar por cualquier campo (Folio, UPM, Estado, Encuestador...)"
            value={filtroGeneral}
            onChange={(e) => setFiltroGeneral(e.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Acciones</th>
                <th>ID</th>
                <th>N°</th>
                <th>Folio</th>
                <th>UPM</th>
                <th>VOE</th>
                <th>Semana</th>
                <th>Visita</th>
                <th>Panel</th>
                <th>Encuestador</th>
                <th>Estado</th>
                <th>Obs. Total</th>
                <th>Consolidada</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.length > 0 ? (
                registrosFiltrados.map((reg) => (
                  <tr key={reg.id}>
                    <td>
                      <button
                        className="btn-action edit"
                        onClick={() => handleEditar(reg)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-action delete"
                        onClick={() => handleEliminar(reg.id)}
                      >
                        🗑️
                      </button>
                    </td>
                    <td>{reg.id}</td>
                    <td>{reg.numeroCorrelativo}</td>
                    <td>
                      <strong>{reg.folio}</strong>
                    </td>
                    <td>{reg.upm}</td>
                    <td>{reg.voe}</td>
                    <td>{reg.semana}</td>
                    <td>{reg.visita}</td>
                    <td>{reg.panel}</td>
                    <td>{reg.nombreEncuestador}</td>
                    <td>
                      <span
                        className={`form-control ${getEstadoClass(reg.estadoBoleta)}`}
                        style={{ padding: '2px 6px' }}
                      >
                        {reg.estadoBoleta}
                      </span>
                    </td>
                    <td>{reg.totalObservaciones}</td>
                    <td>{reg.consolidada}</td>
                    <td>{reg.fechaFinalConsolidacion}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="14"
                    style={{
                      textAlign: 'center',
                      padding: '1rem',
                      color: '#64748b',
                    }}
                  >
                    No hay registros en la base de datos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
