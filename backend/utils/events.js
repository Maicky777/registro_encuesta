const clients = new Set()

function sseHandler(req, res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  res.write('retry: 3000\n\n')

  const client = { id: Date.now(), res }
  clients.add(client)

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n')
    } catch {
      clearInterval(heartbeat)
      clients.delete(client)
      res.end()
    }
  }, 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    clients.delete(client)
  })
}

function broadcast(event, data = {}) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of clients) {
    try {
      client.res.write(payload)
    } catch {
      clients.delete(client)
      try { client.res.end() } catch {}
    }
  }
}

module.exports = { sseHandler, broadcast }
