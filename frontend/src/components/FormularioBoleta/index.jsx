import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { INCIDENCIAS, SEMANA_MIN, SEMANA_MAX } from '../../utils/constants'
import {
  calcularPanel,
  calcularUPM,
  calcularUPMEfectivo,
  calcularVOE,
  computeObservacionFields,
  validarFolio,
  getSemanaActual,
} from '../../utils/helpers'
import { useBoletas } from '../../hooks/useBoletas'
import { useFiltros } from '../../hooks/useFiltros'
import { useModal } from '../../hooks/useModal'
import { useAsignaciones } from '../../hooks/useAsignaciones'

import Formulario from './Formulario'
import PanelDatos from './PanelDatos'
import ToolbarArchivos from './ToolbarArchivos'
import ModalReporte from './ModalReporte'
import ModalAlert from '../ui/ModalAlert'
import ModalConfirm from '../ui/ModalConfirm'

const getDefaultSemana = getSemanaActual

const INITIAL_FORM_STATE = {
  departamento: '',
  brigada: '',
  folio: '',
  upm: '',
  upmReemplazo: '',
  upmAdicional: '',
  semana: getDefaultSemana(),
  visita: '',
  panel: '',
  numeroCorrelativo: 1,
  voe: '',
  usuarioEncuestador: '',
  nombreEncuestador: '',
  encuestador_id: '',
  incidencia: INCIDENCIAS[0],
  detalleObservaciones: '',
  totalObservaciones: 0,
  boletaObservada: 'NO',
  estadoBoleta: 'SIN OBSERVACION',
  observacionBoleta: '',
  consolidada: 'SI',
}

export default function FormularioBoleta({ sessionUser }) {
  const [editandoId, setEditandoId] = useState(null)
  const [folioDuplicado, setFolioDuplicado] = useState(false)
  const [modalData, setModalData] = useState(null)
  const brigadaRef = useRef(null)
  const folioCheckRef = useRef(null)
  const folioCheckSeq = useRef(0)

  const {
    brigadas,
    encuestadores,
    encuestadoresBrigada,
    loadingEncuestadores,
    fetchEncuestadores,
    departments,
    selectedDepartamento,
    setSelectedDepartamento,
  } = useAsignaciones(
    sessionUser.departamento,
    sessionUser.brigadas,
    sessionUser.rol,
  )

  const {
    registros,
    loading,
    submitting,
    crearRegistro,
    actualizarRegistro,
    eliminarRegistro,
    verificarFolio,
    actualizarUpmReemplazo,
    cargarBatch,
  } = useBoletas()

  const {
    alertModal,
    confirmModal,
    showAlert,
    closeAlert,
    showConfirm,
    confirmAction,
  } = useModal()

  const getFormState = useCallback(
    () => ({
      ...INITIAL_FORM_STATE,
      departamento:
        sessionUser.rol === 'administrador'
          ? selectedDepartamento
          : sessionUser.departamento,
      brigada: brigadas[0]?.nombre || '',
      usuarioEncuestador: '',
      nombreEncuestador: '',
      encuestador_id: '',
    }),
    [sessionUser, brigadas, selectedDepartamento],
  )

  const [formData, setFormData] = useState(() => ({
    ...INITIAL_FORM_STATE,
    departamento:
      sessionUser.rol === 'administrador'
        ? selectedDepartamento
        : sessionUser.departamento,
  }))

  const dataReady = brigadas.length > 0 && encuestadores.length > 0

  useEffect(() => {
    if (dataReady && !formData.brigada) {
      setFormData(getFormState())
    }
  }, [dataReady, formData.brigada, getFormState])

  useEffect(() => {
    return () => {
      folioCheckSeq.current++
      clearTimeout(folioCheckRef.current)
    }
  }, [])

  const registrosSemana = useMemo(
    () =>
      registros.filter(
        (r) => parseInt(r.semana, 10) === parseInt(formData.semana, 10),
      ),
    [registros, formData.semana],
  )

  const { filtroGeneral, setFiltroGeneral, registrosFiltrados } =
    useFiltros(registrosSemana)

  const limpiarFormulario = useCallback(() => {
    folioCheckSeq.current++
    clearTimeout(folioCheckRef.current)
    setFormData(getFormState())
    setEditandoId(null)
    setFolioDuplicado(false)
  }, [getFormState])

  const canEditUpmReemplazo = useMemo(() => {
    const visita = parseInt(formData.visita, 10)
    return (
      visita === 1 && formData.numeroCorrelativo === 1 && formData.upm !== ''
    )
  }, [formData.visita, formData.numeroCorrelativo, formData.upm])

  const handleFolioChange = useCallback(
    (val) => {
      const voeCalculado = calcularVOE(val)
      const upmDesdeFolio = calcularUPM(val)
      const grupoRegistros = registros.filter(
        (r) =>
          r.id !== editandoId &&
          (calcularUPM(r.folio) === upmDesdeFolio ||
            (r.upmAdicional &&
              r.upmAdicional.trim() !== '' &&
              r.upmAdicional.trim() === upmDesdeFolio)),
      )
      const primerRegistroUpm = grupoRegistros
        .filter((r) => r.upmReemplazo && r.upmReemplazo.trim() !== '')
        .sort((a, b) => a.id - b.id)[0]
      const primerRegistro = [...grupoRegistros].sort((a, b) => a.id - b.id)[0]
      const esGrupoAdicional = !!(
        primerRegistro &&
        primerRegistro.upmAdicional &&
        primerRegistro.upmAdicional.trim() !== ''
      )

      const conteoUpmPrevias = grupoRegistros.length

      setFormData((prev) => {
        const visitaAuto = primerRegistro
          ? String(primerRegistro.visita)
          : prev.visita
        const brigadaAuto = primerRegistro
          ? primerRegistro.brigada
          : prev.brigada
        const brigadaCambio = brigadaAuto !== prev.brigada
        const upmFinal = calcularUPMEfectivo(
          val,
          prev.upmAdicional,
          prev.upm,
        )
        const upmAuto = esGrupoAdicional ? primerRegistro.upm : upmFinal
        return {
          ...prev,
          folio: val,
          upm: upmAuto,
          upmAdicional: esGrupoAdicional
            ? primerRegistro.upmAdicional
            : prev.upmAdicional,
          voe: voeCalculado,
          panel: calcularPanel(visitaAuto, upmAuto),
          visita: visitaAuto,
          brigada: brigadaAuto,
          numeroCorrelativo: conteoUpmPrevias + 1,
          upmReemplazo: primerRegistroUpm ? primerRegistroUpm.upmReemplazo : '',
          ...(brigadaCambio && {
            usuarioEncuestador: '',
            nombreEncuestador: '',
            encuestador_id: '',
          }),
        }
      })

      const seq = ++folioCheckSeq.current
      clearTimeout(folioCheckRef.current)

      if (val.trim() === '') {
        setFolioDuplicado(false)
        return
      }

      folioCheckRef.current = setTimeout(async () => {
        const existe = await verificarFolio(val, editandoId)
        if (seq === folioCheckSeq.current) {
          setFolioDuplicado(existe)
        }
      }, 400)
    },
    [registros, editandoId, verificarFolio],
  )

  const handleVisitaChange = useCallback((val) => {
    setFormData((prev) => ({
      ...prev,
      visita: val,
      panel: calcularPanel(val, prev.upm),
    }))
  }, [])

  const handleUsuarioEncuestadorChange = useCallback(
    (userSel) => {
      const encDB = encuestadores.find((e) => e.codigo === userSel)
      if (userSel && !encDB) {
        showAlert(
          'El encuestador seleccionado no pertenece a la brigada actual. Seleccione la brigada correcta.',
          'warning',
        )
      }
      setFormData((prev) => ({
        ...prev,
        usuarioEncuestador: encDB ? userSel : '',
        nombreEncuestador: encDB?.nombre || '',
        encuestador_id: encDB?.encuestador_id || '',
      }))
    },
    [encuestadores, showAlert],
  )

  const handleBrigadaChange = useCallback((brigadaNombre) => {
    setFormData((prev) => ({
      ...prev,
      brigada: brigadaNombre,
      usuarioEncuestador: '',
      nombreEncuestador: '',
      encuestador_id: '',
    }))
  }, [])

  useEffect(() => {
    if (formData.brigada && encuestadoresBrigada !== formData.brigada) {
      fetchEncuestadores(formData.brigada)
    }
  }, [formData.brigada, encuestadoresBrigada, fetchEncuestadores])

  const handleDepartamentoChange = useCallback(
    (newDept) => {
      setSelectedDepartamento(newDept)
      setFormData((prev) => ({
        ...prev,
        brigada: '',
        usuarioEncuestador: '',
        nombreEncuestador: '',
        encuestador_id: '',
      }))
    },
    [setSelectedDepartamento],
  )

  const handleObservacionesChange = useCallback((texto) => {
    const obsFields = computeObservacionFields(texto)
    setFormData((prev) => ({
      ...prev,
      detalleObservaciones: texto,
      ...obsFields,
    }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!validarFolio(formData.folio)) {
      showAlert(
        'El folio debe tener el formato 721-05388196879-A-0291 (3 dígitos, 11 dígitos, letra A/D y 4 dígitos).',
        'error',
      )
      return
    }
    if (folioDuplicado) {
      showAlert(
        `El folio "${formData.folio}" ya existe. No se puede guardar un folio duplicado.`,
        'error',
      )
      return
    }

    const semanaNum = Number(formData.semana)
    if (
      formData.semana === '' ||
      formData.semana === null ||
      formData.semana === undefined ||
      !Number.isInteger(semanaNum) ||
      semanaNum < SEMANA_MIN ||
      semanaNum > SEMANA_MAX
    ) {
      showAlert(
        `La semana debe ser un número entero entre ${SEMANA_MIN} y ${SEMANA_MAX}.`,
        'error',
      )
      return
    }

    if (!loadingEncuestadores && formData.usuarioEncuestador) {
      const encActual = encuestadores.find(
        (e) => e.codigo === formData.usuarioEncuestador,
      )
      if (!encActual) {
        showAlert(
          'El encuestador seleccionado no pertenece a la brigada seleccionada. Verifique la brigada antes de guardar.',
          'error',
        )
        return
      }
    }

    try {
      if (editandoId) {
        await actualizarRegistro(editandoId, formData)
        if (formData.upmReemplazo) {
          try {
            const res = await actualizarUpmReemplazo(
              formData.upm,
              formData.upmReemplazo,
              editandoId,
            )
            showAlert(
              `Registro actualizado. UPM Reemplazo propagado a ${res?.actualizados || 0} registro(s).`,
              'success',
            )
          } catch {
            showAlert(
              'Registro guardado, pero hubo un error al propagar UPM Reemplazo a los demás registros.',
              'error',
            )
          }
        } else {
          showAlert('Registro actualizado correctamente.', 'success')
        }
      } else {
        await crearRegistro(formData)
        if (formData.upmReemplazo) {
          try {
            const res = await actualizarUpmReemplazo(
              formData.upm,
              formData.upmReemplazo,
            )
            showAlert(
              `Registro guardado. UPM Reemplazo propagado a ${res?.actualizados || 0} registro(s).`,
              'success',
            )
          } catch {
            showAlert(
              'Registro guardado, pero hubo un error al propagar UPM Reemplazo a los demás registros.',
              'error',
            )
          }
        } else {
          showAlert('Registro guardado en SQLite.', 'success')
        }
      }
      limpiarFormulario()
      setTimeout(() => brigadaRef.current?.focus(), 100)
    } catch (err) {
      showAlert('Error al guardar datos: ' + err.message, 'error')
    }
  }

  const handleEditar = useCallback((reg) => {
    folioCheckSeq.current++
    clearTimeout(folioCheckRef.current)
    setEditandoId(reg.id)
    setFormData({ ...reg, semana: parseInt(reg.semana, 10) || 0 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleEliminar = useCallback(
    async (id) => {
      const confirmado = await showConfirm(
        '¿Está seguro de eliminar este registro de la base de datos?',
      )
      if (confirmado) {
        try {
          await eliminarRegistro(id)
          if (editandoId === id) {
            limpiarFormulario()
          }
          showAlert('Registro eliminado correctamente.', 'success')
        } catch (err) {
          showAlert('Error al eliminar: ' + err.message, 'error')
        }
      }
    },
    [showConfirm, eliminarRegistro, showAlert, editandoId, limpiarFormulario],
  )

  const handleDoubleClickCorregir = useCallback(
    async (reg) => {
      if (reg.estadoBoleta !== 'OBSERVADO') return
      const confirmado = await showConfirm(
        `¿Marcar el folio "${reg.folio}" como CORREGIDO?`,
      )
      if (!confirmado) return
      try {
        await actualizarRegistro(reg.id, {
          ...reg,
          estadoBoleta: 'CORREGIDO',
        })
        showAlert('Boleta marcada como CORREGIDA.', 'success')
      } catch (err) {
        showAlert('Error al actualizar estado: ' + err.message, 'error')
      }
    },
    [showConfirm, actualizarRegistro, showAlert],
  )

  const handleReporte = useCallback(
    async (reg) => {
      const grupo = registros.filter(
        (r) =>
          r.brigada === reg.brigada &&
          String(r.semana) === String(reg.semana) &&
          r.estadoBoleta === 'OBSERVADO',
      )
      if (grupo.length === 0) return

      setModalData({
        brigada: reg.brigada,
        semana: reg.semana,
        registros: grupo,
        registroSeleccionado: reg,
      })

      try {
        await actualizarRegistro(reg.id, {
          ...reg,
          observacionBoleta: 'ENVIADO',
        })
      } catch (err) {
        showAlert(
          'Error al marcar boleta como enviada: ' + err.message,
          'error',
        )
      }
    },
    [registros, actualizarRegistro, showAlert],
  )

  const handleCargarJSON = useCallback(
    async (e) => {
      const fileReader = new FileReader()
      if (e.target.files[0]) {
        fileReader.readAsText(e.target.files[0], 'UTF-8')
        fileReader.onload = async (event) => {
          try {
            const parsedData = JSON.parse(event.target.result)
            if (Array.isArray(parsedData)) {
              if (parsedData.length === 0) {
                showAlert('El archivo JSON no contiene registros.', 'warning')
                return
              }
              const result = await cargarBatch(parsedData)
              const msg = result
                ? `Importación completada: ${result.insertados} insertados, ${result.omitidos} omitidos (duplicados).`
                : 'Datos del archivo JSON importados correctamente.'
              showAlert(msg, 'success')
            } else {
              showAlert(
                'El archivo JSON debe contener una lista de registros.',
                'warning',
              )
            }
          } catch (err) {
            const msg = err.response?.data?.error || err.message
            showAlert('Error al importar: ' + msg, 'error')
          }
        }
      }
    },
    [cargarBatch, showAlert],
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-slate-400">
        Cargando registros...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <Formulario
        formData={formData}
        setFormData={setFormData}
        editandoId={editandoId}
        brigadas={brigadas}
        encuestadores={encuestadores}
        folioDuplicado={folioDuplicado}
        submitting={submitting}
        registros={registros}
        canEditUpmReemplazo={canEditUpmReemplazo}
        rol={sessionUser.rol}
        departments={departments}
        selectedDepartamento={selectedDepartamento}
        onDepartamentoChange={handleDepartamentoChange}
        onBrigadaChange={handleBrigadaChange}
        onFolioChange={handleFolioChange}
        onVisitaChange={handleVisitaChange}
        onUsuarioEncuestadorChange={handleUsuarioEncuestadorChange}
        onObservacionesChange={handleObservacionesChange}
        onSubmit={handleSubmit}
        onLimpiar={limpiarFormulario}
        brigadaRef={brigadaRef}
      />

      <PanelDatos
        registros={registros}
        semana={formData.semana}
        registrosFiltrados={registrosFiltrados}
        filtroGeneral={filtroGeneral}
        onFiltroChange={setFiltroGeneral}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
        onDoubleClickCorregir={handleDoubleClickCorregir}
        onReporte={handleReporte}
        rol={sessionUser.rol}
      />

      <ToolbarArchivos
        registros={registros}
        showAlert={showAlert}
        onCargarJSON={handleCargarJSON}
      />

      {modalData && (
        <ModalReporte
          modalData={modalData}
          onClose={() => setModalData(null)}
        />
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
