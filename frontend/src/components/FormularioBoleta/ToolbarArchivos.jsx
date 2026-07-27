import React, { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { BRIGADAS_DATA } from '../../utils/constants'
import ModalSemanaExcel from './ModalSemanaExcel'

const BRIGADAS = Object.keys(BRIGADAS_DATA)

const ToolbarArchivos = ({ registros, showAlert, onCargarJSON }) => {
  const fileInputRef = useRef(null)
  const [showSemanaModal, setShowSemanaModal] = useState(false)
  const [semanaInput, setSemanaInput] = useState('')

  const exportarExcel = (semanaNum) => {
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
      return 0
    })

    const workbook = XLSX.utils.book_new()

    for (const brigada of BRIGADAS) {
      const porBrigada = ordenados.filter((r) => r.brigada === brigada)
      if (porBrigada.length === 0) continue
      const worksheet = XLSX.utils.json_to_sheet(porBrigada)
      XLSX.utils.book_append_sheet(workbook, worksheet, brigada)
    }

    XLSX.writeFile(
      workbook,
      `Reporte_Boletas_Semana_${semanaNum}_${new Date().toISOString().split('T')[0]}.xlsx`,
    )
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
    showAlert(`Reporte de la semana ${semanaNum} generado correctamente.`, 'success')
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
        onCancel={() => { setShowSemanaModal(false); setSemanaInput('') }}
      />
    </>
  )
}

export default React.memo(ToolbarArchivos)
