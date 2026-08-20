function parseBrigadas(brigadas) {
  if (Array.isArray(brigadas)) return brigadas
  if (typeof brigadas === 'object' && brigadas !== null && !Array.isArray(brigadas)) return brigadas
  try {
    const parsed = JSON.parse(brigadas)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed
    return Array.isArray(parsed) ? parsed : {}
  } catch {
    if (typeof brigadas === 'string' && brigadas.trim()) {
      return brigadas.split(',').map((s) => s.trim()).filter(Boolean)
    }
    return {}
  }
}

function parseBrigadasArray(brigadas) {
  const parsed = parseBrigadas(brigadas)
  if (Array.isArray(parsed)) return parsed
  if (typeof parsed === 'object' && parsed !== null) {
    const all = []
    for (const arr of Object.values(parsed)) {
      if (Array.isArray(arr)) all.push(...arr)
    }
    return [...new Set(all)]
  }
  return []
}

function getBrigadasForDepartamento(brigadas, departamento) {
  const parsed = parseBrigadas(brigadas)
  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    return parsed[departamento] || []
  }
  return []
}

function parseDepartamentos(departamento) {
  if (Array.isArray(departamento)) return departamento
  try {
    const parsed = JSON.parse(departamento)
    return Array.isArray(parsed) ? parsed : typeof parsed === 'string' && parsed.trim() ? [parsed] : []
  } catch {
    if (typeof departamento === 'string' && departamento.trim()) {
      return [departamento.trim()]
    }
    return []
  }
}

module.exports = { parseBrigadas, parseBrigadasArray, getBrigadasForDepartamento, parseDepartamentos }
