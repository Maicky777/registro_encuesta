import { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const API_URL = "http://localhost:5000/api/boletas";

const BRIGADAS_DATA = {
  "Brigada 1": { ece70101: "Griselda", ece70102: "Diego", ece70103: "Geovani" },
  "Brigada 2": { ece70201: "Jesus", ece70202: "Elizabeth", ece70203: "Jhonny" },
  "Brigada 7": {
    ece70701: "Cristian",
    ece70702: "Jesica",
    ece70703: "Sulmian",
  },
};

const INCIDENCIAS = [
  "1: ENTREVISTA COMPLETA",
  "2: ENTREVISTA INCOMPLETA",
  "3: TEMPORALMENTE AUSENTE",
  "4: INFORMANTE NO CALIFICADO",
  "5: FALTA DE CONTACTO",
  "6: RECHAZO",
  "7: VIVIENDA DESOCUPADA",
  "8: ENTREVISTA FUERA DE PERIODO",
  "9: TRASLADO",
];

export default function FormularioBoleta({ sessionUser }) {
  const [registros, setRegistros] = useState([]);
  const [filtroGeneral, setFiltroGeneral] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const fileInputRef = useRef(null);
  const brigadaRef = useRef(null);
  const [modalData, setModalData] = useState(null);
  const [folioDuplicado, setFolioDuplicado] = useState(false);
  const [alertModal, setAlertModal] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    message: "",
    onConfirm: null,
  });
  const [semanaExcelModal, setSemanaExcelModal] = useState(false);
  const [semanaExcel, setSemanaExcel] = useState("");

  const initialFormState = {
    departamento: sessionUser.departamento,
    brigada: sessionUser.brigadas[0] || "Brigada 1",
    folio: "",
    upm: "",
    upmReemplazo: "",
    upmAdicional: "",
    semana: 3,
    visita: "",
    panel: "",
    numeroCorrelativo: 1,
    voe: "",
    usuarioEncuestador: "ece70101",
    nombreEncuestador: "Griselda",
    incidencia: INCIDENCIAS[0],
    detalleObservaciones: "",
    totalObservaciones: 0,
    boletaObservada: "NO",
    estadoBoleta: "SIN OBSERVACION",
    observacionBoleta: "",
    observacionPersonal: "",
    consolidada: "SI",
  };

  const [formData, setFormData] = useState(initialFormState);

  const showAlert = (message, type = "info") => {
    setAlertModal({ show: true, message, type });
  };

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      setConfirmModal({ show: true, message, onConfirm: resolve });
    });
  };

  // Cerrar modales con Enter o Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        if (alertModal.show) {
          setAlertModal({ show: false, message: "", type: "info" });
        }
        if (confirmModal.show) {
          confirmModal.onConfirm?.(false);
          setConfirmModal({ show: false, message: "", onConfirm: null });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertModal.show, confirmModal.show, confirmModal.onConfirm]);

  // Cargar registros al montar el componente
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    obtenerRegistros();
  }, []);

  const obtenerRegistros = async () => {
    try {
      const res = await axios.get(API_URL);
      setRegistros(res.data);
    } catch (err) {
      console.error("Error al conectar con SQLite:", err);
    }
  };

  // Funciion para reiniciar/limpiar el formulario
  const limpiarFormulario = () => {
    setFormData(initialFormState);
    setEditandoId(null);
    setFolioDuplicado(false);
  };

  const handleFolioChange = async (val) => {
    const upmCalculada = val.length >= 17 ? val.substring(0, 17) : val;
    const voeCalculado = val.length >= 4 ? val.slice(-4) : "";
    const conteoUpmPrevias = registros.filter(
      (r) => r.upm === upmCalculada && r.id !== editandoId,
    ).length;

    setFormData((prev) => ({
      ...prev,
      folio: val,
      upm: upmCalculada,
      voe: voeCalculado,
      numeroCorrelativo: conteoUpmPrevias + 1,
    }));

    if (val.trim() === "") {
      setFolioDuplicado(false);
      return;
    }

    try {
      const params = editandoId
        ? `?folio=${val}&excludeId=${editandoId}`
        : `?folio=${val}`;
      const res = await axios.get(`${API_URL}/check-folio${params}`);
      setFolioDuplicado(res.data.exists);
    } catch {
      setFolioDuplicado(false);
    }
  };

  const handleVisitaChange = (val) => {
    let panelResultante = "";
    const numVisita = parseInt(val, 10);
    if (numVisita === 4) panelResultante = "PANEL 43";
    else if (numVisita === 3) panelResultante = "PANEL 44";
    else if (numVisita === 2) panelResultante = "PANEL 45";
    else if (numVisita === 1) panelResultante = "PANEL 46 / PANEL 0";

    setFormData((prev) => ({ ...prev, visita: val, panel: panelResultante }));
  };

  const handleBrigadaChange = (brigadaSel) => {
    const usuarios = Object.keys(BRIGADAS_DATA[brigadaSel] || {});
    const primerUsuario = usuarios[0] || "";
    setFormData((prev) => ({
      ...prev,
      brigada: brigadaSel,
      usuarioEncuestador: primerUsuario,
      nombreEncuestador: BRIGADAS_DATA[brigadaSel]?.[primerUsuario] || "",
    }));
  };

  const handleUsuarioEncuestadorChange = (userSel) => {
    setFormData((prev) => ({
      ...prev,
      usuarioEncuestador: userSel,
      nombreEncuestador: BRIGADAS_DATA[formData.brigada]?.[userSel] || "",
    }));
  };

  const handleObservacionesChange = (texto) => {
    const frases = texto.split(";").filter((f) => f.trim().length > 0);
    const total = frases.length;
    setFormData((prev) => ({
      ...prev,
      detalleObservaciones: texto,
      totalObservaciones: total,
      estadoBoleta: total > 0 ? "OBSERVADO" : "SIN OBSERVACION",
      boletaObservada: total > 0 ? "SI" : "NO",
      observacionBoleta: total > 0 ? "NO ENVIADO" : "",
    }));
  };

  // --- ACCIONES CRUD ---

  // Guardar (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (folioDuplicado) {
      showAlert(
        `El folio "${formData.folio}" ya existe. No se puede guardar un folio duplicado.`,
        "error",
      );
      return;
    }
    const fechaActual = new Date().toISOString().split("T")[0];
    const payload = { ...formData, fechaFinalConsolidacion: fechaActual };

    try {
      if (editandoId) {
        await axios.put(`${API_URL}/${editandoId}`, payload);
        showAlert("Registro actualizado correctamente.", "success");
      } else {
        await axios.post(API_URL, payload);
        showAlert("Registro guardado en SQLite.", "success");
      }
      obtenerRegistros();
      limpiarFormulario();
      setTimeout(() => brigadaRef.current?.focus(), 100);
    } catch (err) {
      showAlert("Error al guardar datos: " + err.message, "error");
    }
  };

  // Cargar registro en el formulario para editar
  const handleEditar = (reg) => {
    setEditandoId(reg.id);
    setFormData({ ...reg, semana: parseInt(reg.semana, 10) || 0 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Eliminar
  const handleEliminar = async (id) => {
    const confirmado = await showConfirm(
      "¿Está seguro de eliminar este registro de la base de datos?",
    );
    if (confirmado) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        obtenerRegistros();
      } catch (err) {
        showAlert("Error al eliminar: " + err.message, "error");
      }
    }
  };

  // --- REPORTES Y ARCHIVOS ---

  // Exportar a EXCEL
  const exportarExcel = () => {
    if (registros.length === 0)
      return showAlert("No hay datos para exportar.", "warning");
    setSemanaExcel("");
    setSemanaExcelModal(true);
  };

  const ejecutarExportarExcel = () => {
    const semanaNum = parseInt(semanaExcel, 10);
    if (!semanaNum || semanaNum < 1) {
      showAlert("Ingrese un número de semana válido.", "warning");
      return;
    }

    const filtrados = registros.filter(
      (r) => parseInt(r.semana, 10) === semanaNum,
    );

    if (filtrados.length === 0) {
      showAlert(`No hay registros para la semana ${semanaNum}.`, "warning");
      return;
    }

    const ordenados = [...filtrados].sort((a, b) => {
      if (a.upm < b.upm) return -1;
      if (a.upm > b.upm) return 1;
      return 0;
    });

    const brigadas = ["Brigada 1", "Brigada 2", "Brigada 7"];
    const workbook = XLSX.utils.book_new();

    for (const brigada of brigadas) {
      const porBrigada = ordenados.filter((r) => r.brigada === brigada);
      if (porBrigada.length === 0) continue;
      const worksheet = XLSX.utils.json_to_sheet(porBrigada);
      XLSX.utils.book_append_sheet(workbook, worksheet, brigada);
    }

    XLSX.writeFile(
      workbook,
      `Reporte_Boletas_Semana_${semanaNum}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    setSemanaExcelModal(false);
    showAlert(
      `Reporte de la semana ${semanaNum} generado correctamente.`,
      "success",
    );
  };

  // Exportar a JSON
  const exportarJSON = () => {
    if (registros.length === 0)
      return showAlert("No hay datos para exportar.", "warning");
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(registros, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `boletas_${new Date().toISOString().split("T")[0]}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Cargar datos desde JSON
  const cargarJSON = (e) => {
    const fileReader = new FileReader();
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          if (Array.isArray(parsedData)) {
            await axios.post(`${API_URL}/batch`, parsedData);
            showAlert(
              "Datos del archivo JSON importados correctamente a SQLite.",
              "success",
            );
            obtenerRegistros();
          } else {
            showAlert(
              "El archivo JSON debe contener una lista de registros.",
              "warning",
            );
          }
        } catch (err) {
          showAlert("Error al leer el archivo JSON: " + err.message, "error");
        }
      };
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case "SIN OBSERVACION":
        return "estado-sin-observacion";
      case "OBSERVADO":
        return "estado-observado";
      case "CORREGIDO":
        return "estado-corregido";
      default:
        return "";
    }
  };

  const registrosFiltrados = registros.filter((reg) => {
    const busqueda = filtroGeneral.toLowerCase().trim();
    if (!busqueda) return true;
    return Object.values(reg).some((val) =>
      String(val).toLowerCase().includes(busqueda),
    );
  });

  const handleReporte = async (reg) => {
    const grupo = registros.filter(
      (r) =>
        r.brigada === reg.brigada &&
        String(r.semana) === String(reg.semana) &&
        r.estadoBoleta === "OBSERVADO",
    );
    if (grupo.length === 0) return;

    /*setModalData({
      brigada: reg.brigada,
      semana: reg.semana,
      registros: grupo,
    })*/

    setModalData({
      brigada: reg.brigada,
      semana: reg.semana,
      registros: grupo,
      registroSeleccionado: reg, // ← nuevo
    });

    try {
      await axios.put(`${API_URL}/${reg.id}`, {
        ...reg,
        observacionBoleta: "ENVIADO",
        fechaFinalConsolidacion: new Date().toISOString().split("T")[0],
      });
      obtenerRegistros();
    } catch (err) {
      console.error("Error al actualizar observacionBoleta:", err);
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1rem" }}>
      {/* SECCIÓN FORMULARIO */}
      <div className="card-container">
        <h2 className="card-title">
          <span>
            {editandoId
              ? `Editando Registro #${editandoId}`
              : "Formulario de Boleta"}
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

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="cod-brigada">Brigada</label>
              <select
                className="form-control"
                autoFocus
                id="cod-brigada"
                ref={brigadaRef}
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
              <label htmlFor="cod-folio">Codigo de Folio</label>
              <input
                className="form-control"
                type="text"
                id="cod-folio"
                required
                value={formData.folio}
                onChange={(e) => handleFolioChange(e.target.value)}
                style={
                  folioDuplicado
                    ? { borderColor: "#ef4444", backgroundColor: "#fef2f2" }
                    : {}
                }
              />
              {folioDuplicado && (
                <span
                  style={{
                    color: "#ef4444",
                    fontSize: "0.85rem",
                    marginTop: "4px",
                    display: "block",
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
              <label htmlFor="cod-visita">Numero de Visita</label>
              <input
                id="cod-visita"
                className="form-control"
                type="number"
                min="1"
                max="4"
                required
                value={formData.visita}
                onChange={(e) => handleVisitaChange(e.target.value)}
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
                value={formData.detalleObservaciones || ""}
                onChange={(e) => handleObservacionesChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cod-incidencias">Incidencia</label>
              <select
                id="cod-incidencias"
                className="form-control"
                value={formData.incidencia}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, incidencia: e.target.value }))
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
                className={`form-control ${getEstadoClass(formData.estadoBoleta)}`}
                value={formData.estadoBoleta}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, estadoBoleta: e.target.value }))
                }
              >
                <option value="SIN OBSERVACION">SIN OBSERVACION</option>
                <option value="OBSERVADO">OBSERVADO</option>
                <option value="CORREGIDO">CORREGIDO</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cod-upm">UPM Reemplazo</label>
              <input
                id="cod-upm"
                className="form-control"
                type="text"
                value={formData.upmReemplazo || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, upmReemplazo: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="cod-upm-adicional">UPM Adicional</label>
              <input
                id="cod-upm-adicional"
                className="form-control"
                type="text"
                value={formData.upmAdicional || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, upmAdicional: e.target.value }))
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
              <label htmlFor="cod-boleta-obser">Observación Boleta</label>
              <select
                id="cod-boleta-obser"
                className="form-control"
                disabled={formData.totalObservaciones === 0}
                value={formData.observacionBoleta || ""}
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
              <label htmlFor="cod-semana">Numero de Semana</label>
              <input
                id="cod-semana"
                className="form-control"
                type="number"
                min="1"
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

            <div className="form-group">
              <label htmlFor="cod-obs-personal">Observación Personal</label>
              <input
                id="cod-obs-personal"
                className="form-control"
                type="text"
                value={formData.observacionPersonal || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    observacionPersonal: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="form-group-corregido">
            <button type="submit" className="btn-submit-corregido">
              {editandoId
                ? "Guardar Cambios (Actualizar)"
                : "Guardar y Limpiar"}
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
            style={{ display: "none" }}
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
            id="cod-busqueda"
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
                <th>N°</th>
                <th>UPM</th>
                <th>Folio</th>
                <th>VOE</th>
                <th>Semana</th>
                <th>Visita</th>
                <th>Panel</th>
                <th>Encuestador</th>
                <th>Estado</th>
                <th>Obs. Total</th>
                <th>Estado Boleta</th>
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
                      {
                        reg.estadoBoleta == "OBSERVADO" ? <button
                        className="btn-action report"
                        onClick={() => handleReporte(reg)}
                      >
                        📋
                      </button> : ""
                      }
                    </td>
                    <td>{reg.numeroCorrelativo}</td>
                    <td>{reg.upm}</td>
                    <td>
                      <strong>{reg.folio}</strong>
                    </td>
                    <td>{reg.voe}</td>
                    <td>{parseInt(reg.semana, 10)}</td>
                    <td>{reg.visita}</td>
                    <td>{reg.panel}</td>
                    <td>{reg.nombreEncuestador}</td>
                    <td>
                      <span
                        className={`form-control ${getEstadoClass(reg.estadoBoleta)}`}
                        style={{ padding: "2px 6px" }}
                      >
                        {reg.estadoBoleta}
                      </span>
                    </td>
                    <td>{reg.totalObservaciones}</td>
                    <td>{reg.observacionBoleta}</td>
                    <td>{reg.fechaFinalConsolidacion}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="14"
                    style={{
                      textAlign: "center",
                      padding: "1rem",
                      color: "#64748b",
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

      {modalData && (
        <div className="modal-overlay" onClick={() => setModalData(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reporte por Brigada y Semana</h3>
            <p>
              📲 <strong>BOLETA CON VARIACIONES</strong>
            </p>
            <p>
              <strong>BRIGADA:</strong> {modalData.brigada} - <strong>SEMANA:</strong> {parseInt(modalData.semana, 10)}
            </p>
            
            <p>
              <strong>TOTAL BOLETAS OBSERVADAS:</strong>{" "}
              {modalData.registros.length}
            </p>

            <div className="modal-table-wrapper">
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>USUARIO</th>
                    <th>FOLIO</th>
                    <th>TOTAL OBS.</th>
                  </tr>
                </thead>
                <tbody>
                  {modalData.registros.map((r) => (
                    <tr key={r.id}>
                      <td>{r.usuarioEncuestador}</td>
                      <td>{r.folio}</td>
                      <td>{r.totalObservaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                background: "#f1f5f9",
                borderRadius: "6px",
                fontSize: "0.85rem",
                textAlign:"left"
              }}
            >
              <p>
                <span>📲 *_Buenas tardes equipo, se adiciona una voe para su verificacion y/o correccion_*</span> <br /><br />
                <strong>*Usuario:*</strong>{" "}
                {modalData.registroSeleccionado.usuarioEncuestador} <br />
                <strong>*Folio:*</strong> {modalData.registroSeleccionado.folio} <br />
                <strong>*Total de Observaciones:*</strong>{" "}
                {modalData.registroSeleccionado.totalObservaciones}
              </p>
              
            </div>

            <button
              className="btn-submit-corregido"
              onClick={() => setModalData(null)}
              style={{ marginTop: "1rem" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {alertModal.show && (
        <div
          className="modal-overlay"
          onClick={() =>
            setAlertModal({ show: false, message: "", type: "info" })
          }
        >
          <div
            className="modal-content alert-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`alert-icon alert-icon-${alertModal.type}`}>
              {alertModal.type === "success" && "✓"}
              {alertModal.type === "error" && "✕"}
              {alertModal.type === "warning" && "⚠"}
              {alertModal.type === "info" && "ℹ"}
            </div>
            <p className="alert-message">{alertModal.message}</p>
            <button
              className={`btn-alert-${alertModal.type}`}
              onClick={() =>
                setAlertModal({ show: false, message: "", type: "info" })
              }
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="modal-overlay">
          <div
            className="modal-content confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="alert-icon alert-icon-warning">?</div>
            <p className="alert-message">{confirmModal.message}</p>
            <div className="confirm-buttons">
              <button
                className="btn-confirm-cancel"
                onClick={() => {
                  confirmModal.onConfirm(false);
                  setConfirmModal({
                    show: false,
                    message: "",
                    onConfirm: null,
                  });
                }}
              >
                Cancelar
              </button>
              <button
                className="btn-confirm-ok"
                onClick={() => {
                  confirmModal.onConfirm(true);
                  setConfirmModal({
                    show: false,
                    message: "",
                    onConfirm: null,
                  });
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {semanaExcelModal && (
        <div
          className="modal-overlay"
          onClick={() => setSemanaExcelModal(false)}
        >
          <div
            className="modal-content confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="alert-icon alert-icon-info">📊</div>
            <p className="alert-message">
              Ingrese el número de <strong>semana</strong> para generar el
              reporte Excel:
            </p>
            <input
              type="number"
              min="1"
              step="1"
              className="form-control"
              placeholder="Ej: 3"
              value={semanaExcel}
              onChange={(e) => setSemanaExcel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") ejecutarExportarExcel();
                if (e.key === "Escape") setSemanaExcelModal(false);
              }}
              autoFocus
              style={{ margin: "0.75rem 0", textAlign: "center" }}
            />
            <div className="confirm-buttons">
              <button
                className="btn-confirm-cancel"
                onClick={() => setSemanaExcelModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-confirm-ok"
                onClick={ejecutarExportarExcel}
              >
                Generar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
