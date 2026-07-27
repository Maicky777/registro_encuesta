import { useState, useEffect, useCallback } from 'react'
import { getBrigadas } from '../../services/brigadaService'
import { getEncuestadores, getEncuestadoresByBrigada, asignarEncuestador, desasignarEncuestador } from '../../services/encuestadorService'
import { useModal } from '../../hooks/useModal'
import ModalAlert from '../ui/ModalAlert'
import ModalConfirm from '../ui/ModalConfirm'

const DEPARTAMENTOS = [
  'BENI', 'CHUQUISACA', 'COCHABAMBA', 'LA PAZ', 'ORURO', 'PANDO', 'POTOSÍ', 'SANTA CRUZ', 'TARIJA',
]

const inputClass = 'w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15'

export default function AsignacionBrigadas() {
  const [departamento, setDepartamento] = useState('SANTA CRUZ')
  const [brigadas, setBrigadas] = useState([])
  const [brigadaSeleccionada, setBrigadaSeleccionada] = useState(null)
  const [encuestadoresEnBrigada, setEncuestadoresEnBrigada] = useState([])
  const [todosEncuestadores, setTodosEncuestadores] = useState([])
  const [loading, setLoading] = useState(false)

  const {
    alertModal,
    confirmModal,
    showAlert,
    closeAlert,
    showConfirm,
    confirmAction,
  } = useModal()

  const cargarBrigadas = useCallback(async () => {
    try {
      const data = await getBrigadas(departamento)
      setBrigadas(data)
      setBrigadaSeleccionada(null)
      setEncuestadoresEnBrigada([])
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al cargar brigadas'
      showAlert(msg, 'error')
    }
  }, [departamento, showAlert])

  const cargarEncuestadores = useCallback(async () => {
    try {
      const data = await getEncuestadores(departamento)
      setTodosEncuestadores(data)
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al cargar encuestadores'
      showAlert(msg, 'error')
    }
  }, [departamento, showAlert])

  useEffect(() => {
    cargarBrigadas()
    cargarEncuestadores()
  }, [cargarBrigadas, cargarEncuestadores])

  const cargarAsignacionesBrigada = useCallback(async (brigadaId) => {
    setLoading(true)
    try {
      const data = await getEncuestadoresByBrigada(brigadaId)
      setEncuestadoresEnBrigada(data)
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al cargar asignaciones'
      showAlert(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [showAlert])

  const handleBrigadaSelect = (brigada) => {
    setBrigadaSeleccionada(brigada)
    cargarAsignacionesBrigada(brigada.id)
  }

  const handleAsignar = async (encuestadorId) => {
    if (!brigadaSeleccionada) return
    try {
      await asignarEncuestador(brigadaSeleccionada.id, encuestadorId)
      showAlert('Encuestador asignado correctamente.', 'success')
      cargarAsignacionesBrigada(brigadaSeleccionada.id)
      cargarEncuestadores()
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al asignar'
      showAlert(msg, 'error')
    }
  }

  const handleDesasignar = async (encuestadorId, encuestadorNombre) => {
    if (!brigadaSeleccionada) return
    const confirmado = await showConfirm(
      `¿Quitar a "${encuestadorNombre}" de ${brigadaSeleccionada.nombre}?`
    )
    if (!confirmado) return

    try {
      await desasignarEncuestador(brigadaSeleccionada.id, encuestadorId)
      showAlert('Encuestador desasignado correctamente.', 'success')
      cargarAsignacionesBrigada(brigadaSeleccionada.id)
      cargarEncuestadores()
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al desasignar'
      showAlert(msg, 'error')
    }
  }

  const encuestadoresAsignadosIds = new Set(encuestadoresEnBrigada.map((e) => e.id))
  const encuestadoresDisponibles = todosEncuestadores.filter((e) => !encuestadoresAsignadosIds.has(e.id))

  return (
    <div className="max-w-6xl mx-auto my-5 bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800">
        Asignar Encuestadores a Brigadas
      </h2>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 mb-4">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest">
            Departamento
          </label>
          <select
            className={inputClass}
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
          >
            {DEPARTAMENTOS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-widest">
            Brigada
          </label>
          <select
            className={inputClass}
            value={brigadaSeleccionada?.id || ''}
            onChange={(e) => {
              const brigada = brigadas.find((b) => b.id === Number(e.target.value))
              if (brigada) handleBrigadaSelect(brigada)
            }}
          >
            <option value="">Seleccionar brigada...</option>
            {brigadas.map((b) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {brigadaSeleccionada && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3">
              Encuestadores en {brigadaSeleccionada.nombre}
              <span className="ml-2 text-[0.7rem] font-normal text-slate-400">({encuestadoresEnBrigada.length})</span>
            </h3>
            {loading ? (
              <p className="text-slate-400 text-sm">Cargando...</p>
            ) : encuestadoresEnBrigada.length === 0 ? (
              <p className="text-slate-400 text-sm italic">No hay encuestadores asignados</p>
            ) : (
              <div className="space-y-2">
                {encuestadoresEnBrigada.map((enc) => (
                  <div key={enc.id} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-slate-900">{enc.nombre}</span>
                      <span className="text-[0.7rem] text-slate-500 ml-2">({enc.codigo})</span>
                      <span className={`text-[0.65rem] font-bold ml-2 px-1.5 py-0.5 rounded ${
                        enc.rol === 'supervisor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {enc.rol === 'supervisor' ? 'SUP' : 'ENC'}
                      </span>
                    </div>
                    <button
                      className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[0.7rem] font-semibold cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={() => handleDesasignar(enc.id, enc.nombre)}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3">
              Encuestadores Disponibles
              <span className="ml-2 text-[0.7rem] font-normal text-slate-400">({encuestadoresDisponibles.length})</span>
            </h3>
            {encuestadoresDisponibles.length === 0 ? (
              <p className="text-slate-400 text-sm italic">No hay encuestadores disponibles en este departamento</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {encuestadoresDisponibles.map((enc) => (
                  <div key={enc.id} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-slate-900">{enc.nombre}</span>
                      <span className="text-[0.7rem] text-slate-500 ml-2">({enc.codigo})</span>
                      <span className={`text-[0.65rem] font-bold ml-2 px-1.5 py-0.5 rounded ${
                        enc.rol === 'supervisor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {enc.rol === 'supervisor' ? 'SUP' : 'ENC'}
                      </span>
                    </div>
                    <button
                      className="bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded text-[0.7rem] font-semibold cursor-pointer hover:bg-green-100 transition-colors"
                      onClick={() => handleAsignar(enc.id)}
                    >
                      Asignar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ModalAlert
        show={alertModal.show}
        message={alertModal.message}
        type={alertModal.type}
        onClose={closeAlert}
      />

      <ModalConfirm
        show={confirmModal.show}
        message={confirmModal.message}
        onConfirm={() => confirmAction(true)}
        onCancel={() => confirmAction(false)}
      />
    </div>
  )
}
