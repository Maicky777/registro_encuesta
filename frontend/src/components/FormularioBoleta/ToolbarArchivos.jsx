import React, { useRef, useState } from 'react'
import ExcelJS from 'exceljs/dist/exceljs.min.js'
import ModalSemanaExcel from './ModalSemanaExcel'
import { SEMANA_MIN, SEMANA_MAX } from '../../utils/constants'
import { getTrimestreActual, getSemanaActual } from '../../utils/helpers'

const ROMANOS = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' }

const ToolbarArchivos = ({ registros, showAlert, onCargarJSON }) => {
  const fileInputRef = useRef(null)
  const [showSemanaModal, setShowSemanaModal] = useState(false)
  const [trimestreInput, setTrimestreInput] = useState(() =>
    String(getTrimestreActual()),
  )
  const [semanaInput, setSemanaInput] = useState(() => String(getSemanaActual()))
  const [generando, setGenerando] = useState(false)

  const columnas = [
    { key: 'departamento', label: 'DEPARTAMENTO' },
    { key: 'brigada', label: 'BRIGADA' },
    { key: 'upm', label: 'UPM' },
    { key: 'upmReemplazo', label: 'UPM DE REEMPLAZO' },
    { key: 'upmAdicional', label: 'UPM ADICIONAL' },
    { key: 'semana', label: 'SEMANA', center: true },
    { key: 'visita', label: 'VISITA', center: true },
    { key: 'panel', label: 'PANEL' },
    { key: 'numeroCorrelativo', label: 'N°', center: true },
    { key: 'folio', label: 'FOLIO' },
    { key: 'usuarioEncuestador', label: 'USUARIO' },
    { key: 'incidencia', label: 'INCIDENCIA' },
    { key: 'boletaObservada', label: 'BOLETA OBSERVADA', center: true },
    { key: 'totalObservaciones', label: 'TOTAL OBSERVACIONES', center: true },
    { key: 'detalleObservaciones', label: 'DETALLE OBSERVACIONES' },
    { key: 'consolidada', label: 'CONSOLIDADA', center: true },
    {
      key: 'fechaFinalConsolidacion',
      label: 'FECHA FINAL DE REVISION / CONSOLIDACION',
    },
    {
      key: 'cuestionarioDevuelto',
      label: 'CUESTIONARIO DEVUELTO POR EQUIPO TECNICO',
    },
  ]

  const headers = columnas.map((c) => c.label)

  const sanitizarNombre = (str) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_')

  const descargarArchivo = (buffer, nombreArchivo) => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const crearYDescargarWorkbook = async (
    departamento,
    registrosDept,
    trimestre,
    semana,
  ) => {
    const brigadas = [
      ...new Set(registrosDept.map((r) => r.brigada).filter(Boolean)),
    ].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0
      return numA - numB
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Sistema de Boletas'

    for (const brigada of brigadas) {
      const porBrigada = registrosDept.filter((r) => r.brigada === brigada)
      if (porBrigada.length === 0) continue

      const sheet = workbook.addWorksheet(brigada)

      sheet.columns = headers.map(() => ({ width: 22 }))

      const row1 = sheet.getRow(1)
      row1.getCell(1).value = 'ENCUENTAS CONTINUA DE EMPLEO'
      row1.getCell(1).font = { name: 'Calibri', size: 18, bold: true }
      sheet.mergeCells(1, 1, 1, 4)

      const row2 = sheet.getRow(2)
      row2.getCell(1).value = 'DETALLE DE FOLIOS REVISADOS'
      row2.getCell(1).font = { name: 'Calibri', size: 18, bold: true }
      sheet.mergeCells(2, 1, 2, 4)

      const row3 = sheet.getRow(3)
      row3.getCell(1).value = 'DEPARTAMENTO'
      row3.getCell(1).font = { name: 'Calibri', size: 14, bold: true }
      row3.getCell(2).value = departamento
      row3.getCell(2).font = { name: 'Calibri', size: 14, bold: true }
      row3.getCell(3).value = 'TRIMESTRE:'
      row3.getCell(3).font = { name: 'Calibri', size: 14, bold: true }
      row3.getCell(4).value = `${ROMANOS[trimestre] || trimestre}/${new Date().getFullYear()}`
      row3.getCell(4).font = { name: 'Calibri', size: 14, bold: true }
      row3.getCell(5).value = 'SEMANA:'
      row3.getCell(5).font = { name: 'Calibri', size: 14, bold: true }
      row3.getCell(6).value = semana
      row3.getCell(6).font = { name: 'Calibri', size: 14, bold: true }

      const headerRow = sheet.getRow(4)
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1)
        cell.value = h
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: 'FFFFFF' },
        }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0F172B' },
        }
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        }
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        }
      })

      sheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: headers.length },
      }

      porBrigada.forEach((r, idx) => {
        const dataRow = sheet.getRow(5 + idx)
        columnas.forEach((col, i) => {
          const cell = dataRow.getCell(i + 1)
          let valor = r[col.key] !== undefined ? r[col.key] : ''
          if (col.key === 'semana' || col.key === 'numeroCorrelativo') {
            valor = Number(valor) || 0
          }
          if (col.key === 'totalObservaciones') {
            valor = Number(valor) || 0
            valor = valor === 0 ? '' : valor
          }
          cell.value = valor
          cell.font = { name: 'Calibri', size: 10 }
          if (col.center) {
            cell.alignment = { horizontal: 'center' }
          }
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          }
        })
      })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const deptLimpio = sanitizarNombre(departamento)
    descargarArchivo(
      buffer,
      `FORMULARIO_DE_SEGUIMIENTO_${deptLimpio}_TRIM${trimestre}_SEM${semana}.xlsx`,
    )
  }

  const exportarExcel = async (trimestreNum, semanaNum) => {
    if (registros.length === 0) {
      showAlert('No hay datos para exportar.', 'warning')
      return false
    }

    const filtrados = registros.filter(
      (r) =>
        String(r.trimestre) === String(trimestreNum) &&
        parseInt(r.semana, 10) === semanaNum,
    )

    if (filtrados.length === 0) {
      showAlert(
        `No hay registros para TRIM-${trimestreNum} Semana ${semanaNum}.`,
        'warning',
      )
      return false
    }

    const ordenados = [...filtrados].sort((a, b) => {
      if (a.upm < b.upm) return -1
      if (a.upm > b.upm) return 1
      return a.numeroCorrelativo - b.numeroCorrelativo
    })

    const porDepartamento = {}
    ordenados.forEach((r) => {
      const dept = r.departamento || 'SIN_DEPARTAMENTO'
      if (!porDepartamento[dept]) porDepartamento[dept] = []
      porDepartamento[dept].push(r)
    })

    const departamentos = Object.keys(porDepartamento)

    for (const dept of departamentos) {
      await crearYDescargarWorkbook(
        dept,
        porDepartamento[dept],
        trimestreNum,
        semanaNum,
      )
    }

    if (departamentos.length > 1) {
      showAlert(
        `${departamentos.length} reportes generados correctamente (uno por departamento).`,
        'success',
      )
    } else {
      showAlert(
        `Reporte TRIM-${trimestreNum} Semana ${semanaNum} generado correctamente.`,
        'success',
      )
    }

    return true
  }

  const exportarJSON = () => {
    if (registros.length === 0) {
      showAlert('No hay datos para exportar.', 'warning')
      return
    }
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

  const abrirModalSemana = () => {
    setTrimestreInput(String(getTrimestreActual()))
    setSemanaInput(String(getSemanaActual()))
    setShowSemanaModal(true)
  }

  const handleConfirmarSemana = async () => {
    if (generando) return

    const trimestreNum = parseInt(trimestreInput, 10)
    const semanaNum = parseInt(semanaInput, 10)

    if (!trimestreNum || trimestreNum < 1 || trimestreNum > 4) {
      showAlert('Seleccione un trimestre válido (1 a 4).', 'warning')
      return
    }

    if (
      !Number.isInteger(semanaNum) ||
      semanaNum < SEMANA_MIN ||
      semanaNum > SEMANA_MAX
    ) {
      showAlert(
        `Ingrese un número de semana válido (${SEMANA_MIN} a ${SEMANA_MAX}).`,
        'warning',
      )
      return
    }

    setGenerando(true)
    try {
      const ok = await exportarExcel(trimestreNum, semanaNum)
      if (ok) setShowSemanaModal(false)
    } catch (err) {
      showAlert('Error al generar el reporte: ' + err.message, 'error')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      <div className="max-w-6xl mx-auto my-5 bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
        <div className="flex gap-3 flex-wrap">
          <button
            className="bg-green-800 text-white border-none px-4 py-2 rounded font-semibold cursor-pointer text-xs hover:bg-green-700 transition-colors"
            onClick={abrirModalSemana}
          >
            📊 Generar Reporte Excel (.xlsx)
          </button>
          <button
            className="bg-slate-800 text-white border border-slate-700 px-4 py-2 rounded font-semibold cursor-pointer text-xs hover:bg-slate-700 transition-colors"
            onClick={exportarJSON}
          >
            ⬇️ Exportar JSON
          </button>
          <button
            className="bg-slate-800 text-white border border-slate-700 px-4 py-2 rounded font-semibold cursor-pointer text-xs hover:bg-slate-700 transition-colors"
            onClick={() => fileInputRef.current.click()}
          >
            ⬆️ Cargar JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={onCargarJSON}
          />
        </div>
      </div>

      <ModalSemanaExcel
        show={showSemanaModal}
        trimestreExcel={trimestreInput}
        semanaExcel={semanaInput}
        loading={generando}
        onChangeTrimestre={setTrimestreInput}
        onChangeSemana={setSemanaInput}
        onConfirm={handleConfirmarSemana}
        onCancel={() => setShowSemanaModal(false)}
      />
    </>
  )
}

export default React.memo(ToolbarArchivos)
