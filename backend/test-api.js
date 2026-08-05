const http = require('http')

const BASE = 'http://localhost:5000'
let TOKEN = null

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE)
    const bodyStr = body ? JSON.stringify(body) : null
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        let json = null
        try { json = JSON.parse(data) } catch { json = data }
        resolve({ status: res.statusCode, body: json, headers: res.headers })
      })
    })
    req.on('error', reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

const results = []
function assert(name, ok, detail = '') {
  const status = ok ? 'PASS' : 'FAIL'
  results.push({ name, status, detail })
  console.log(`  [${status}] ${name}${detail ? ' - ' + detail : ''}`)
}

function debug(label, res) {
  console.log(`    DEBUG ${label}: status=${res.status}, type=${typeof res.body}, isArray=${Array.isArray(res.body)}`)
  if (!Array.isArray(res.body) && typeof res.body === 'object') {
    console.log(`    DEBUG keys: ${Object.keys(res.body).join(', ')}`)
    if (res.body.error) console.log(`    DEBUG error: ${res.body.error}`)
  } else if (Array.isArray(res.body)) {
    console.log(`    DEBUG length: ${res.body.length}`)
    if (res.body.length > 0) console.log(`    DEBUG first item keys: ${Object.keys(res.body[0]).join(', ')}`)
  }
}

async function run() {
  console.log('\n========================================')
  console.log('  TEST: Conectividad, Brigadas, Encuestadores, Asignaciones')
  console.log('========================================\n')

  // ─── 1. HEALTH CHECK ───
  console.log('1. Health Check')
  try {
    const r = await request('GET', '/api/health')
    assert('Servidor responde', r.status === 200, `status=${r.status}`)
  } catch (e) {
    assert('Servidor responde', false, e.message)
    console.log('\nEl servidor no está corriendo. Iniciándolo...')

    // Iniciar servidor en segundo plano
    const { initDatabase, getDB } = require('./db/connection')
    initDatabase()

    const express = require('express')
    const cors = require('cors')
    const helmet = require('helmet')
    const cookieParser = require('cookie-parser')
    const rateLimit = require('express-rate-limit')
    require('dotenv').config()

    const app = express()
    app.use(helmet())
    app.use(cookieParser())
    app.use(express.json({ limit: '5mb' }))
    app.use(cors({ origin: '*', credentials: true }))

    const authRoutes = require('./routes/auth')
    const boletasRoutes = require('./routes/boletas')
    const brigadasRoutes = require('./routes/brigadas')
    const encuestadoresRoutes = require('./routes/encuestadores')
    const asignacionesRoutes = require('./routes/asignaciones')

    app.use('/api/auth', authRoutes)
    app.use('/api/boletas', boletasRoutes)
    app.use('/api/brigadas', brigadasRoutes)
    app.use('/api/encuestadores', encuestadoresRoutes)
    app.use('/api/asignaciones', asignacionesRoutes)
    app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

    await new Promise(resolve => {
      const server = app.listen(5000, () => {
        console.log('Servidor iniciado en puerto 5000')
        global._testServer = server
        global._testDB = getDB()
        resolve()
      })
    })

    const r2 = await request('GET', '/api/health')
    assert('Servidor iniciado y responde', r2.status === 200)
  }

  // ─── 2. LOGIN ───
  console.log('\n2. Autenticacion')
  const loginRes = await request('POST', '/api/auth/login', {
    username: 'mcayo',
    password: process.env.ADMIN_PASSWORD || '4852264',
  })
  debug('login', loginRes)
  assert('Login exitoso', loginRes.status === 200, `status=${loginRes.status}`)
  if (loginRes.status === 200) {
    const setCookie = Array.isArray(loginRes.headers['set-cookie'])
      ? loginRes.headers['set-cookie'][0]
      : loginRes.headers['set-cookie'] || ''
    const match = setCookie.match(/(?:^|;\s*)token=([^;]+)/)
    let tokenFromCookie = match ? match[1] : ''
    try { tokenFromCookie = decodeURIComponent(tokenFromCookie) } catch {}
    TOKEN = tokenFromCookie
    assert('Token JWT recibido (cookie)', typeof TOKEN === 'string' && TOKEN.length > 10)
    if (loginRes.body.user) {
      console.log(`    Usuario: ${loginRes.body.user.username}, rol: ${loginRes.body.user.rol}, depto: ${loginRes.body.user.departamento}`)
    }
  } else {
    assert('Token JWT recibido (cookie)', false, JSON.stringify(loginRes.body))
    console.log('\nNo se pudo obtener token. Abortando tests.\n')
    cleanup()
    return
  }

  // ─── 2.5. AUTH LOGOUT ───
  console.log('\n2.5. Logout y re-autenticación')
  const logoutRes = await request('POST', '/api/auth/logout', {}, TOKEN)
  assert('Logout endpoint responde', logoutRes.status === 200, `status=${logoutRes.status}`)

  // Verificar que el token aún funciona (el logout solo limpia cookie, no invalida token)
  const meAfterLogout = await request('GET', '/api/auth/me', null, TOKEN)
  assert('Token sigue válido tras logout', meAfterLogout.status === 200)

  // ─── 3. BRIGADAS ───
  console.log('\n3. CRUD Brigadas')

  // Listar brigadas existentes
  const listBrigadas = await request('GET', '/api/brigadas', null, TOKEN)
  debug('listBrigadas', listBrigadas)
  assert('Listar brigadas', listBrigadas.status === 200 && Array.isArray(listBrigadas.body))
  const countBefore = Array.isArray(listBrigadas.body) ? listBrigadas.body.length : 0
  console.log(`    Brigadas existentes: ${countBefore}`)

  // Crear brigada de prueba
  const crearBrigada = await request('POST', '/api/brigadas', {
    nombre: 'TEST_BRIGADA_001',
    departamento: 'SANTA CRUZ',
  }, TOKEN)
  debug('crearBrigada', crearBrigada)
  assert('Crear brigada', crearBrigada.status === 200, `id=${crearBrigada.body.id}`)
  const newBrigadaId = crearBrigada.body.id

  // Verificar que aparece en la lista
  const listAfter = await request('GET', '/api/brigadas', null, TOKEN)
  assert('Brigada aparece en lista', Array.isArray(listAfter.body) && listAfter.body.length === countBefore + 1)

  // Obtener brigada por ID
  if (newBrigadaId) {
    const getBrigada = await request('GET', `/api/brigadas/${newBrigadaId}`, null, TOKEN)
    assert('Obtener brigada por ID', getBrigada.status === 200 && getBrigada.body.nombre === 'TEST_BRIGADA_001')

    // Intentar duplicar
    const dupBrigada = await request('POST', '/api/brigadas', {
      nombre: 'TEST_BRIGADA_001',
      departamento: 'SANTA CRUZ',
    }, TOKEN)
    assert('Rechazar duplicado', dupBrigada.status === 409)

    // Filtrar por departamento
    const filterBrigadas = await request('GET', '/api/brigadas?departamento=SANTA CRUZ', null, TOKEN)
    assert('Filtrar brigadas por departamento', filterBrigadas.status === 200 && Array.isArray(filterBrigadas.body) && filterBrigadas.body.length > 0)

    // Eliminar brigada de prueba
    const delBrigada = await request('DELETE', `/api/brigadas/${newBrigadaId}`, null, TOKEN)
    assert('Eliminar brigada', delBrigada.status === 200)

    // Verificar que ya no aparece
    const getDeleted = await request('GET', `/api/brigadas/${newBrigadaId}`, null, TOKEN)
    assert('Brigada eliminada no aparece', getDeleted.status === 404)
  } else {
    console.log('    Saltando tests de brigada por falta de ID')
  }

  // ─── 3.5. BOLETAS CRUD ───
  console.log('\n3.5. CRUD Boletas')

  // Obtener una brigada real para la prueba
  const brigadaTest = Array.isArray((await request('GET', '/api/brigadas', null, TOKEN)).body)
    ? (await request('GET', '/api/brigadas', null, TOKEN)).body[0]
    : null

  if (brigadaTest) {
    const boletaData = {
      departamento: brigadaTest.departamento,
      brigada: brigadaTest.nombre,
      folio: 'TESTFOLIO000001',
      upm: 'TESTUPM00000000001',
      semana: 4,
      visita: 1,
      panel: 'PANEL 46',
      incidencia: '1: ENTREVISTA COMPLETA',
    }

    // Crear boleta
    const crearBoleta = await request('POST', '/api/boletas', boletaData, TOKEN)
    debug('crearBoleta', crearBoleta)
    assert('Crear boleta', crearBoleta.status === 200, `id=${crearBoleta.body.id}`)
    const boletaId = crearBoleta.body.id

    if (boletaId) {
      // Listar boletas
      const listBoletas = await request('GET', '/api/boletas?limit=10', null, TOKEN)
      assert('Listar boletas', listBoletas.status === 200 && Array.isArray(listBoletas.body.data))
      assert('Paginación presente', listBoletas.body.pagination && typeof listBoletas.body.pagination.total === 'number')

      // Check folio duplicado
      const checkFolio = await request('GET', '/api/boletas/check-folio?folio=TESTFOLIO000001', null, TOKEN)
      assert('Detectar folio duplicado', checkFolio.status === 200 && checkFolio.body.exists === true)

      // Actualizar boleta
      const updateBoleta = await request('PUT', `/api/boletas/${boletaId}`, {
        ...boletaData,
        incidencia: '6: RECHAZO',
        estadoBoleta: 'SIN OBSERVACION',
      }, TOKEN)
      assert('Actualizar boleta', updateBoleta.status === 200)

      // Validar folio duplicado rechazado
      const dupBoleta = await request('POST', '/api/boletas', boletaData, TOKEN)
      assert('Rechazar folio duplicado en creación', dupBoleta.status === 409)

      // Validar campos requeridos
      const noFolio = await request('POST', '/api/boletas', { departamento: 'X', brigada: 'Y' }, TOKEN)
      assert('Rechazar boleta sin folio', noFolio.status === 400)

      // Validar week range
      const badWeek = await request('POST', '/api/boletas', {
        ...boletaData,
        folio: 'OTROFOLIO000001',
        semana: 99,
      }, TOKEN)
      assert('Rechazar semana inválida', badWeek.status === 400)

      // Batch import
      const batchData = [
        { ...boletaData, folio: 'BATCHFOLIO00001' },
        { ...boletaData, folio: 'BATCHFOLIO00002' },
      ]
      const batchRes = await request('POST', '/api/boletas/batch', batchData, TOKEN)
      assert('Importación batch', batchRes.status === 200, `insertados=${batchRes.body.insertados}`)
      assert('Batch inserta 2 registros', batchRes.body.insertados === 2)

      // Batch evita duplicados
      const batchDup = await request('POST', '/api/boletas/batch', batchData, TOKEN)
      assert('Batch omite duplicados', batchDup.status === 200 && batchDup.body.omitidos === 2)

      // Eliminar boleta de prueba
      const delBoleta = await request('DELETE', `/api/boletas/${boletaId}`, null, TOKEN)
      assert('Eliminar boleta', delBoleta.status === 200)

      // Verificar eliminada
      const checkFolioDel = await request('GET', '/api/boletas/check-folio?folio=TESTFOLIO000001', null, TOKEN)
      assert('Boleta eliminada ya no existe en check', checkFolioDel.status === 200 && checkFolioDel.body.exists === false)
    }
  } else {
    console.log('    Saltando tests de boletas - no hay brigadas disponibles')
  }

  // ─── 4. ENCUESTADORES ───
  console.log('\n4. CRUD Encuestadores')

  // Listar encuestadores existentes
  const listEnc = await request('GET', '/api/encuestadores', null, TOKEN)
  debug('listEnc', listEnc)
  assert('Listar encuestadores', listEnc.status === 200 && Array.isArray(listEnc.body))
  const countEncBefore = Array.isArray(listEnc.body) ? listEnc.body.length : 0
  console.log(`    Encuestadores existentes: ${countEncBefore}`)

  // Crear encuestador de prueba
  const crearEnc = await request('POST', '/api/encuestadores', {
    nombre: 'TEST_ENC_001',
    rol: 'encuestador',
    codigo: 'test99901',
    telefono: '77777777',
  }, TOKEN)
  debug('crearEnc', crearEnc)
  assert('Crear encuestador', crearEnc.status === 200, `id=${crearEnc.body.id}`)
  const newEncId = crearEnc.body.id

  // Verificar que aparece en la lista
  const listEncAfter = await request('GET', '/api/encuestadores', null, TOKEN)
  assert('Encuestador aparece en lista', Array.isArray(listEncAfter.body) && listEncAfter.body.length === countEncBefore + 1)

  // Obtener encuestador por ID
  if (newEncId) {
    const getEnc = await request('GET', `/api/encuestadores/${newEncId}`, null, TOKEN)
    assert('Obtener encuestador por ID', getEnc.status === 200 && getEnc.body.nombre === 'TEST_ENC_001')

    // Obtener por código
    const getEncByCode = await request('GET', '/api/encuestadores/por-codigo/test99901', null, TOKEN)
    assert('Obtener encuestador por código', getEncByCode.status === 200 && getEncByCode.body.codigo === 'test99901')

    // Actualizar encuestador
    const updateEnc = await request('PUT', `/api/encuestadores/${newEncId}`, {
      nombre: 'TEST_ENC_001_UPD',
      rol: 'encuestador',
      codigo: 'test99901',
      telefono: '88888888',
    }, TOKEN)
    assert('Actualizar encuestador', updateEnc.status === 200)

    // Verificar actualización
    const getEncUpd = await request('GET', `/api/encuestadores/${newEncId}`, null, TOKEN)
    assert('Nombre actualizado correctamente', getEncUpd.body.nombre === 'TEST_ENC_001_UPD')
    assert('Teléfono actualizado correctamente', getEncUpd.body.telefono === '88888888')

    // Intentar duplicar código
    const dupEnc = await request('POST', '/api/encuestadores', {
      nombre: 'OTRO',
      rol: 'encuestador',
      codigo: 'test99901',
      telefono: '',
    }, TOKEN)
    assert('Rechazar código duplicado', dupEnc.status === 409)

    // Validar campos requeridos
    const noName = await request('POST', '/api/encuestadores', {
      nombre: '',
      rol: 'encuestador',
      codigo: 'xxx',
    }, TOKEN)
    assert('Rechazar nombre vacío', noName.status === 400)

    const noRol = await request('POST', '/api/encuestadores', {
      nombre: 'Test',
      rol: 'invalido',
      codigo: 'xxx',
    }, TOKEN)
    assert('Rechazar rol inválido', noRol.status === 400)

    // Eliminar encuestador de prueba
    const delEnc = await request('DELETE', `/api/encuestadores/${newEncId}`, null, TOKEN)
    assert('Eliminar encuestador', delEnc.status === 200)

    // Verificar que ya no aparece
    const getDeletedEnc = await request('GET', `/api/encuestadores/${newEncId}`, null, TOKEN)
    assert('Encuestador eliminado no aparece', getDeletedEnc.status === 404)
  } else {
    console.log('    Saltando tests de encuestador por falta de ID')
  }

  // ─── 5. ASIGNACIONES ───
  console.log('\n5. Asignaciones de Brigadas')

  // Obtener una brigada y un encuestador existentes
  const brigadas = Array.isArray((await request('GET', '/api/brigadas', null, TOKEN)).body)
    ? (await request('GET', '/api/brigadas', null, TOKEN)).body
    : []
  const encuestadores = Array.isArray((await request('GET', '/api/encuestadores', null, TOKEN)).body)
    ? (await request('GET', '/api/encuestadores', null, TOKEN)).body
    : []

  if (brigadas.length === 0 || encuestadores.length === 0) {
    assert('Datos existentes para asignación', false, 'No hay brigadas o encuestadores')
  } else {
    const testBrigada = brigadas.find(b => b.departamento === 'SANTA CRUZ') || brigadas[0]
    const testEnc = encuestadores[encuestadores.length - 1] // último para no romper seed
    console.log(`    Usando brigada: ${testBrigada.nombre} (id=${testBrigada.id})`)
    console.log(`    Usando encuestador: ${testEnc.nombre} (id=${testEnc.id})`)

    // Listar asignaciones actuales
    const listAsig = await request('GET', '/api/asignaciones', null, TOKEN)
    assert('Listar asignaciones', listAsig.status === 200 && Array.isArray(listAsig.body))

    // Crear asignación
    const crearAsig = await request('POST', '/api/asignaciones', {
      brigada_id: testBrigada.id,
      encuestador_id: testEnc.id,
    }, TOKEN)
    assert('Crear asignación', crearAsig.status === 200, crearAsig.body.message)

    // Verificar que la asignación aparece en la lista de la brigada
    const asigByBrigada = await request('GET', `/api/asignaciones?brigada_id=${testBrigada.id}`, null, TOKEN)
    const found = asigByBrigada.body.some(e => e.id === testEnc.id)
    assert('Encuestador aparece en brigada asignada', found)

    // Verificar que aparece en asignaciones por departamento
    const asigByDept = await request('GET', `/api/asignaciones?departamento=${encodeURIComponent(testBrigada.departamento)}`, null, TOKEN)
    const foundDept = asigByDept.body.some(a =>
      a.brigada_id === testBrigada.id && a.encuestador_id === testEnc.id
    )
    assert('Asignación aparece en consulta por departamento', foundDept)

    // Intentar duplicar
    const dupAsig = await request('POST', '/api/asignaciones', {
      brigada_id: testBrigada.id,
      encuestador_id: testEnc.id,
    }, TOKEN)
    assert('Rechazar asignación duplicada', dupAsig.status === 409)

    // Eliminar asignación
    const delAsig = await request('DELETE', '/api/asignaciones', {
      brigada_id: testBrigada.id,
      encuestador_id: testEnc.id,
    }, TOKEN)
    assert('Eliminar asignación', delAsig.status === 200, delAsig.body.message)

    // Verificar que ya no aparece
    const asigAfterDel = await request('GET', `/api/asignaciones?brigada_id=${testBrigada.id}`, null, TOKEN)
    const notFound = !asigAfterDel.body.some(e => e.id === testEnc.id)
    assert('Asignación eliminada no aparece', notFound)

    // Eliminar inexistente
    const delNotExist = await request('DELETE', '/api/asignaciones', {
      brigada_id: -1,
      encuestador_id: -1,
    }, TOKEN)
    assert('Eliminar asignación inexistente retorna 404', delNotExist.status === 404)
  }

  // ─── 5.5. GESTIÓN DE USUARIOS ───
  console.log('\n5.5. Gestión de Usuarios')

  // Listar usuarios
  const listUsers = await request('GET', '/api/auth/users', null, TOKEN)
  assert('Listar usuarios', listUsers.status === 200 && Array.isArray(listUsers.body))
  const userCount = Array.isArray(listUsers.body) ? listUsers.body.length : 0
  console.log(`    Usuarios existentes: ${userCount}`)

  // Crear usuario de prueba
  const crearUser = await request('POST', '/api/auth/register', {
    username: 'testuser001',
    password: 'Test123456',
    departamento: 'SANTA CRUZ',
    brigadas: ['Brigada 1'],
    rol: 'usuarios',
  }, TOKEN)
  debug('crearUser', crearUser)
  assert('Crear usuario', crearUser.status === 200, `id=${crearUser.body.id}`)
  const newUserId = crearUser.body.id

  // Verificar que aparece en la lista
  const listUsersAfter = await request('GET', '/api/auth/users', null, TOKEN)
  assert('Usuario aparece en lista', Array.isArray(listUsersAfter.body) && listUsersAfter.body.length === userCount + 1)

  if (newUserId) {
    // Actualizar usuario
    const updateUser = await request('PUT', `/api/auth/users/${newUserId}`, {
      username: 'testuser002',
      departamento: 'SANTA CRUZ',
      brigadas: ['Brigada 1', 'Brigada 2'],
      rol: 'usuarios',
    }, TOKEN)
    assert('Actualizar usuario sin password', updateUser.status === 200)
    assert('Nombre actualizado', updateUser.body.username === 'testuser002')

    // Actualizar con password
    const updateUserPwd = await request('PUT', `/api/auth/users/${newUserId}`, {
      username: 'testuser003',
      password: 'NewPass123456',
      departamento: 'SANTA CRUZ',
      brigadas: ['Brigada 1'],
      rol: 'usuarios',
    }, TOKEN)
    assert('Actualizar usuario con password', updateUserPwd.status === 200)

    // Validar username corto
    const shortUser = await request('POST', '/api/auth/register', {
      username: 'ab',
      password: 'Test123456',
    }, TOKEN)
    assert('Rechazar username corto', shortUser.status === 400)

    // Validar password corto
    const shortPwd = await request('POST', '/api/auth/register', {
      username: 'valido123',
      password: '12345',
    }, TOKEN)
    assert('Rechazar password corto', shortPwd.status === 400)

    // Eliminar usuario de prueba
    const delUser = await request('DELETE', `/api/auth/users/${newUserId}`, null, TOKEN)
    assert('Eliminar usuario', delUser.status === 200)
    const listFinal = await request('GET', '/api/auth/users', null, TOKEN)
    assert('Usuario eliminado de la lista', Array.isArray(listFinal.body) && listFinal.body.length === userCount)
  }

  // ─── 6. PERMISOS (sin token / sin rol admin) ───
  console.log('\n6. Seguridad y Permisos')

  const noAuth = await request('GET', '/api/brigadas')
  assert('Acceso sin token rechazado', noAuth.status === 401 || noAuth.status === 403)

  const createNoAuth = await request('POST', '/api/brigadas', {
    nombre: 'HACK',
    departamento: 'X',
  })
  assert('Crear sin token rechazado', createNoAuth.status === 401 || createNoAuth.status === 403)

  // ─── RESUMEN ───
  console.log('\n========================================')
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  console.log(`  RESUMEN: ${passed} pasaron, ${failed} fallaron de ${results.length} total`)
  console.log('========================================\n')

  if (failed > 0) {
    console.log('Tests fallidos:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.detail}`)
    })
    console.log()
  }

  cleanup()
}

function cleanup() {
  if (global._testServer) {
    global._testServer.close(() => {
      console.log('Servidor de test cerrado.')
      if (global._testDB) {
        try { global._testDB.close() } catch {}
      }
      process.exit(0)
    })
  } else {
    process.exit(0)
  }
}

run().catch(e => {
  console.error('Error inesperado:', e)
  cleanup()
})
