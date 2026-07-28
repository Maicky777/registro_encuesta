import React, { useState } from 'react'
import PanelMasivo from './PanelMasivo'
import CeldasTurno from './CeldasTurno'

export default function ReporteBrigadas() {
  const dias = [
    { id: 'lun', nombre: 'LUNES', fecha: '14/11/2026' },
    { id: 'mar', nombre: 'MARTES', fecha: '15/11/2026' },
    { id: 'mie', nombre: 'MIÉRCOLES', fecha: '16/11/2026' },
    { id: 'jue', nombre: 'JUEVES', fecha: '17/11/2026' },
    { id: 'vie', nombre: 'VIERNES', fecha: '18/11/2026' },
    { id: 'sab', nombre: 'SÁBADO', fecha: '19/11/2026' },
    { id: 'dom', nombre: 'DOMINGO', fecha: '20/11/2026' },
  ]

  const inicialPersonal = [
    {
      uid: 'p1',
      idDep: '7',
      departamento: 'SANTA CRUZ',
      codBrigada: '1',
      semana: '4',
      idEnc: '',
      cargo: 'SUPERVISOR / ENCUESTADOR',
      nombre: 'JUAN PÉREZ LÓPEZ',
      usuario: 'ece70101',
    },
    {
      uid: 'p2',
      idDep: '7',
      departamento: 'SANTA CRUZ',
      codBrigada: '1',
      semana: '4',
      idEnc: '',
      cargo: 'BRIGADISTA',
      nombre: 'MARÍA GÓMEZ RAMÍREZ',
      usuario: 'ece70102',
    },
    {
      uid: 'p3',
      idDep: '7',
      departamento: 'SANTA CRUZ',
      codBrigada: '1',
      semana: '4',
      idEnc: '',
      cargo: 'BRIGADISTA',
      nombre: 'CARLOS CHÁVEZ MARTÍNEZ',
      usuario: 'ece70103',
    },
  ]

  const [asistencia, setAsistencia] = useState({})
  const [seleccionados, setSeleccionados] = useState([])

  // Estados locales para el panel masivo
  const [bulkDia, setBulkDia] = useState('lun')
  const [bulkTurno, setBulkTurno] = useState('t1')
  const [bulkEstatus, setBulkEstatus] = useState('ASISTENCIA')
  const [bulkIngreso, setBulkIngreso] = useState('08:00')
  const [bulkSalida, setBulkSalida] = useState('16:00')

  const handleCellChange = (personaUid, diaId, turno, campo, valor) => {
    const key = `${personaUid}_${diaId}_${turno}`
    setAsistencia((prev) => {
      const celda = prev[key] || {
        estatus: 'N/A',
        ingreso: '',
        fIngreso: '',
        salida: '',
        fSalida: '',
        observacion: '',
      }
      let nuevaCelda = { ...celda, [campo]: valor }

      if (campo === 'estatus' && valor === 'ASISTENCIA') {
        const fechaDia = dias.find((d) => d.id === diaId)?.fecha || ''
        nuevaCelda.ingreso = turno === 't1' ? '08:00' : '16:00'
        nuevaCelda.salida = turno === 't1' ? '16:00' : '00:00'
        nuevaCelda.fIngreso = fechaDia
        nuevaCelda.fSalida = fechaDia
      } else if (
        campo === 'estatus' &&
        (valor === 'FALTA' || valor === 'N/A')
      ) {
        nuevaCelda.ingreso = ''
        nuevaCelda.salida = ''
        nuevaCelda.fIngreso = ''
        nuevaCelda.fSalida = ''
      }
      return { ...prev, [key]: nuevaCelda }
    })
  }

  const ejecutarAsignacionMasiva = () => {
    if (seleccionados.length === 0)
      return alert('Selecciona al menos un brigadista.')
    const fechaDia = dias.find((d) => d.id === bulkDia)?.fecha || ''
    const copias = { ...asistencia }

    seleccionados.forEach((uid) => {
      const key = `${uid}_${bulkDia}_${bulkTurno}`
      const prev = copias[key] || {}
      copias[key] = {
        ...prev,
        estatus: bulkEstatus,
        ...(bulkEstatus === 'ASISTENCIA'
          ? {
              ingreso: bulkIngreso,
              fIngreso: fechaDia,
              salida: bulkSalida,
              fSalida: fechaDia,
            }
          : {
              ingreso: '',
              fIngreso: '',
              salida: '',
              fSalida: '',
            }),
      }
    })

    setAsistencia(copias)
    setSeleccionados([])
  }

  const getEstatusStyle = (estatus) => {
    if (estatus === 'ASISTENCIA') return 'bg-green-100 text-green-800'
    if (estatus === 'FALTA') return 'bg-red-100 text-red-800'
    return 'bg-gray-50 text-gray-400'
  }

  return (
    <div className="w-full p-4 bg-slate-50 min-h-screen text-xs">
      {/* Componente Panel Superior */}
      <PanelMasivo
        dias={dias}
        seleccionadosCount={seleccionados.length}
        bulkDia={bulkDia}
        setBulkDia={setBulkDia}
        bulkTurno={bulkTurno}
        setBulkTurno={setBulkTurno}
        bulkEstatus={bulkEstatus}
        setBulkEstatus={setBulkEstatus}
        bulkIngreso={bulkIngreso}
        setBulkIngreso={setBulkIngreso}
        bulkSalida={bulkSalida}
        setBulkSalida={setBulkSalida}
        onAplicar={ejecutarAsignacionMasiva}
      />

      {/* Contenedor de la Tabla */}
      <div className="overflow-x-auto shadow border border-gray-200 rounded-lg max-h-[65vh] bg-white">
        <table className="min-w-full divide-y divide-gray-200 table-fixed border-collapse">
          <thead className="bg-slate-800 text-white sticky top-0 z-10 text-center font-semibold text-[10px]">
            <tr className="bg-slate-900">
              <th
                rowSpan="2"
                className="border-r border-b border-slate-600 p-1 w-10 align-middle"
              >
                <input
                  type="checkbox"
                  checked={seleccionados.length === inicialPersonal.length}
                  onChange={() =>
                    setSeleccionados(
                      seleccionados.length === inicialPersonal.length
                        ? []
                        : inicialPersonal.map((p) => p.uid),
                    )
                  }
                  className="rounded accent-emerald-500"
                />
              </th>
              <th
                rowSpan="2"
                className="border-r border-b border-slate-600 px-2 py-2 align-middle"
              >
                ID DEP
              </th>
              <th
                rowSpan="2"
                className="border-r border-b border-slate-600 px-2 py-2 align-middle"
              >
                DEPARTAMENTO
              </th>
              <th
                rowSpan="2"
                className="border-r border-b border-slate-600 px-2 py-2 align-middle"
              >
                CODIGO DE BRIGADA
              </th>
              <th
                rowSpan="2"
                className="border-r border-b border-slate-600 px-2 py-2 align-middle"
              >
                SEMANA
              </th>
              <th
                rowSpan="2"
                className="border-r border-b border-slate-600 px-2 py-2 align-middle"
              >
                ID ENC
              </th>
              <th
                rowSpan="2"
                className="border-r border-b border-slate-600 px-2 py-2 align-middle"
              >
                CARGO
              </th>
              <th
                rowSpan="2"
                className="border-r border-b border-slate-600 px-2 py-2 align-middle"
              >
                NOMBRE
              </th>
              <th
                rowSpan="2"
                className="border-r border-b border-slate-600 px-2 py-2 align-middle"
              >
                USUARIO
              </th>
              {dias.map((d) => (
                <th
                  key={d.id}
                  colSpan="10"
                  className="border-r border-b border-slate-600 py-1 bg-white text-slate-800"
                >
                  <div className="font-bold">{d.nombre}</div>
                  <div className="text-red-600 text-[9px]">{d.fecha}</div>
                </th>
              ))}
            </tr>
            <tr className="bg-slate-700">
              {dias.map((d) => (
                <React.Fragment key={d.id}>
                  <th className="border-r border-b border-slate-500 px-1 py-1 text-[8px] font-medium">
                    INGRESO
                  </th>
                  <th className="border-r border-b border-slate-500 px-1 py-1 text-[8px] font-medium">
                    DETALLE INGRESO
                  </th>
                  <th className="border-r border-b border-slate-500 px-1 py-1 text-[8px] font-medium">
                    SALIDA
                  </th>
                  <th className="border-r border-b border-slate-500 px-1 py-1 text-[8px] font-medium">
                    DETALLE SALIDA
                  </th>
                  <th className="border-r border-b border-slate-500 px-1 py-1 text-[8px] font-medium">
                    OBSERVACION
                  </th>
                  <th className="border-r border-b border-slate-500 px-1 py-1 text-[8px] font-medium">
                    INGRESO
                  </th>
                  <th className="border-r border-b border-slate-500 px-1 py-1 text-[8px] font-medium">
                    DETALLE INGRESO
                  </th>
                  <th className="border-r border-b border-slate-500 px-1 py-1 text-[8px] font-medium">
                    SALIDA
                  </th>
                  <th className="border-r border-b border-slate-500 px-1 py-1 text-[8px] font-medium">
                    DETALLE SALIDA
                  </th>
                  <th className="border-r border-b border-slate-500 px-1 py-1 text-[8px] font-medium">
                    OBSERVACION
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200 text-[10px]">
            {inicialPersonal.map((persona) => {
              const esSeleccionado = seleccionados.includes(persona.uid)
              return (
                <tr
                  key={persona.uid}
                  className={`transition-colors ${
                    esSeleccionado ? 'bg-emerald-50/60' : 'hover:bg-blue-50/40'
                  }`}
                >
                  <td className="border-r border-gray-200 p-1 text-center bg-slate-50">
                    <input
                      type="checkbox"
                      checked={esSeleccionado}
                      onChange={() =>
                        setSeleccionados((prev) =>
                          prev.includes(persona.uid)
                            ? prev.filter((id) => id !== persona.uid)
                            : [...prev, persona.uid],
                        )
                      }
                    />
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1 bg-slate-50 font-medium text-center">
                    {persona.idDep}
                  </td>
                  <td className="border-r border-gray-200 px-1 py-1 text-center bg-slate-50 text-gray-400">
                    {persona.departamento}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1 bg-slate-50 text-gray-500 truncate text-center">
                    {persona.codBrigada}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1 bg-slate-50 text-gray-500 truncate text-center">
                    {persona.semana}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1 bg-slate-50 text-gray-500 truncate text-center">
                    {persona.idEnc || '-'}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1 bg-slate-50 text-gray-500 truncate">
                    {persona.cargo}
                  </td>
                  <td className="border-r border-gray-300 px-2 py-1 bg-slate-50 font-semibold whitespace-nowrap">
                    {persona.nombre}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1 bg-slate-50 text-gray-500 truncate text-center">
                    {persona.usuario}
                  </td>

                  {dias.map((dia) => {
                    const t1 = asistencia[`${persona.uid}_${dia.id}_t1`] || {
                      estatus: 'N/A',
                    }
                    const t2 = asistencia[`${persona.uid}_${dia.id}_t2`] || {
                      estatus: 'N/A',
                    }

                    return (
                      <React.Fragment key={dia.id}>
                        <CeldasTurno
                          datosTurno={t1}
                          colorEstatusClass={getEstatusStyle(t1.estatus)}
                          onChangeCampo={(campo, valor) =>
                            handleCellChange(
                              persona.uid,
                              dia.id,
                              't1',
                              campo,
                              valor,
                            )
                          }
                        />
                        <CeldasTurno
                          datosTurno={t2}
                          colorEstatusClass={getEstatusStyle(t2.estatus)}
                          onChangeCampo={(campo, valor) =>
                            handleCellChange(
                              persona.uid,
                              dia.id,
                              't2',
                              campo,
                              valor,
                            )
                          }
                        />
                      </React.Fragment>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
