export default function TablaRegistros({ registros }) {
  // Función para resolver el color de fondo según el requerimiento de negocio
  const getEstadoEstilo = (estado) => {
    switch (estado) {
      case 'SIN OBSERVACION':
        return { backgroundColor: '#d4edda', color: '#155724' } // Verde claro
      case 'OBSERVADO':
        return { backgroundColor: '#f8d7da', color: '#721c24' } // Rojo claro
      case 'CORREGIDO':
        return { backgroundColor: '#cce5ff', color: '#004085' } // Azul claro
      default:
        return {}
    }
  }

  return (
    <div
      style={{ marginTop: '30px', overflowX: 'auto', fontFamily: 'sans-serif' }}
    >
      <h3>Registros Consolidados en Sistema</h3>
      <table
        border="1"
        cellPadding="8"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '12px',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#343a40', color: 'white' }}>
            <th>N° UPM</th>
            <th>Departamento</th>
            <th>Brigada</th>
            <th>UPM</th>
            <th>Folio</th>
            <th>VOE</th>
            <th>Visita</th>
            <th>Panel</th>
            <th>Usuario</th>
            <th>Nombre</th>
            <th>Incidencia</th>
            <th>Estado Boleta</th>
            <th>Obs. Boleta</th>
            <th>Fecha Final</th>
          </tr>
        </thead>
        <tbody>
          {registros.length === 0 ? (
            <tr>
              <td colSpan="14" style={{ textAlign: 'center' }}>
                No hay boletas procesadas aún.
              </td>
            </tr>
          ) : (
            registros.map((reg, idx) => (
              <tr key={idx} style={getEstadoEstilo(reg.estadoBoleta)}>
                <td>{reg.nro}</td>
                <td>{reg.departamento}</td>
                <td>{reg.brigada}</td>
                <td>{reg.upm}</td>
                <td>{reg.folio}</td>
                <td>{reg.voe}</td>
                <td>{reg.visita}</td>
                <td>{reg.panel}</td>
                <td>{reg.usuario}</td>
                <td>{reg.nombre}</td>
                <td>{reg.incidencia}</td>
                <td>
                  <strong>{reg.estadoBoleta}</strong>
                </td>
                <td>{reg.observacionBoleta}</td>
                <td>{reg.fechaRevision}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
