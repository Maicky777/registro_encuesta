function parseBrigadas(brigadas) {
  if (Array.isArray(brigadas)) return brigadas
  try {
    const parsed = JSON.parse(brigadas)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    if (typeof brigadas === 'string' && brigadas.trim()) {
      return brigadas.split(',').map((s) => s.trim()).filter(Boolean)
    }
    return []
  }
}

module.exports = { parseBrigadas }
