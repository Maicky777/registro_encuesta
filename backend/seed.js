require('dotenv').config()
const { connectDB, createTables, seedDefaultUser } = require('./db/connection')

const db = connectDB()
createTables(db)
seedDefaultUser(db)
console.log('Seed completado exitosamente.')
process.exit(0)
