require('dotenv').config()
const { initDatabase } = require('./db/connection')

initDatabase()
console.log('Seed completado exitosamente.')
process.exit(0)
