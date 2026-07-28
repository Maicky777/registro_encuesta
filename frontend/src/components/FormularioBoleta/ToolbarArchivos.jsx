import React, { useRef, useState } from 'react'
import ExcelJS from 'exceljs/dist/exceljs.min.js'
import ModalSemanaExcel from './ModalSemanaExcel'
import { TRIMESTRE_ACTUAL } from '../../utils/constants'

const ToolbarArchivos = ({ registros, showAlert, onCargarJSON }) => {
  const fileInputRef = useRef(null)
  const [showSemanaModal, setShowSemanaModal] = useState(false)
  const [semanaInput, setSemanaInput] = useState('')

  const exportarExcel = async (semanaNum) => {
    if (registros.length === 0) {
      showAlert('No hay datos para exportar.', 'warning')
      return
    }

    const filtrados = registros.filter(
      (r) => parseInt(r.semana, 10) === semanaNum,
    )

    if (filtrados.length === 0) {
      showAlert(`No hay registros para la semana ${semanaNum}.`, 'warning')
      return
    }

    const ordenados = [...filtrados].sort((a, b) => {
      if (a.upm < b.upm) return -1
      if (a.upm > b.upm) return 1
      return a.numeroCorrelativo - b.numeroCorrelativo
    })

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
    const departamento = ordenados[0]?.departamento || ''
    const brigadas = [...new Set(ordenados.map((r) => r.brigada).filter(Boolean))]

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Sistema de Boletas'

    for (const brigada of brigadas) {
      const porBrigada = ordenados.filter((r) => r.brigada === brigada)
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
      row3.getCell(4).value = TRIMESTRE_ACTUAL
      row3.getCell(4).font = { name: 'Calibri', size: 14, bold: true }

      const headerRow = sheet.getRow(4)
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1)
        cell.value = h
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } }
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

      const lastCol = String.fromCharCode(64 + headers.length)
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
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Reporte_Boletas_Semana_${semanaNum}_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

  const handleConfirmarSemana = () => {
    const semanaNum = parseInt(semanaInput, 10)
    if (!semanaNum || semanaNum < 1) {
      showAlert('Ingrese un número de semana válido.', 'warning')
      return
    }
    exportarExcel(semanaNum)
    showAlert(
      `Reporte de la semana ${semanaNum} generado correctamente.`,
      'success',
    )
    setShowSemanaModal(false)
    setSemanaInput('')
  }

  return (
    <>
      <div className="max-w-6xl mx-auto my-5 bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
        <div className="flex gap-3 flex-wrap">
          <button
            className="bg-green-800 text-white border-none px-4 py-2 rounded font-semibold cursor-pointer text-xs hover:bg-green-700 transition-colors"
            onClick={() => setShowSemanaModal(true)}
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
        semanaExcel={semanaInput}
        onChange={setSemanaInput}
        onConfirm={handleConfirmarSemana}
        onCancel={() => {
          setShowSemanaModal(false)
          setSemanaInput('')
        }}
      />
    </>
  )
}

export default React.memo(ToolbarArchivos)
