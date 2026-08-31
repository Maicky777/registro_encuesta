const CONTAINER_ID = 'chartjs-tooltip-incidencias'

function getOrCreateContainer() {
  let el = document.getElementById(CONTAINER_ID)
  if (!el) {
    el = document.createElement('div')
    el.id = CONTAINER_ID
    el.style.cssText =
      'pointer-events:none;position:absolute;opacity:0;z-index:50;' +
      'font-family:ui-sans-serif,system-ui,sans-serif;' +
      'box-shadow:0 10px 30px rgba(15,23,42,.25);border-radius:10px;' +
      'border:1px solid #e2e8f0;overflow:hidden;min-width:190px;transition:opacity .12s ease;'
    document.body.appendChild(el)
  }
  return el
}

function collectSeries(chart, dataIndex) {
  const rows = []
  for (let i = 0; i < chart.data.datasets.length; i++) {
    const meta = chart.getDatasetMeta(i)
    if (meta.hidden) continue
    const ds = chart.data.datasets[i]
    const value = Number(ds.data[dataIndex]) || 0
    if (!value) continue
    rows.push({
      color: ds.borderColor || ds.backgroundColor,
      label: ds.label,
      sub: ds.serieSub,
      value,
    })
  }
  return rows
}

function buildTooltipHTML(rows, title) {
  const total = rows.reduce((acc, r) => acc + r.value, 0)

  const body = rows
    .map((r) => {
      const pct = total > 0 ? Math.round((r.value / total) * 100) : 0
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:5px 12px;border-bottom:1px solid #f1f5f9;">
          <span style="width:9px;height:9px;border-radius:50%;background:${r.color};flex-shrink:0;"></span>
          <span style="flex:1;font-size:12px;color:#334155;white-space:nowrap;">
            ${r.label}
            ${r.sub ? `<span style="display:block;font-size:10px;color:#94a3b8;">${r.sub}</span>` : ''}
          </span>
          <span style="font-weight:700;font-size:12px;color:#0f172a;">${r.value}</span>
          <span style="font-size:11px;color:#94a3b8;width:40px;text-align:right;">${pct}%</span>
        </div>`
    })
    .join('')

  if (!rows.length) return ''

  return `
    <div style="background:#ffffff;">
      <div style="background:#0f172a;color:#ffffff;font-size:12px;font-weight:700;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
        <span>${title}</span>
        ${total > 0 ? `<span style="background:rgba(255,255,255,.15);padding:1px 7px;border-radius:999px;font-size:11px;">Total ${total}</span>` : ''}
      </div>
      <div style="padding:6px 0;">${body}</div>
      <div style="background:#f8fafc;color:#94a3b8;font-size:10px;padding:5px 12px;border-top:1px solid #e2e8f0;">
        % = participación sobre el total de la semana
      </div>
    </div>`
}

export function externalTooltipHandler(context) {
  const { chart } = context
  const container = getOrCreateContainer()

  const active = chart._active && chart._active[0]
  const dataIndex = typeof active?.index === 'number' ? active.index : null

  if (dataIndex === null) {
    container.style.opacity = 0
    return
  }

  const title = chart.data.labels?.[dataIndex] || ''
  const rows = collectSeries(chart, dataIndex)
  const html = buildTooltipHTML(rows, title)

  if (!html) {
    container.style.opacity = 0
    return
  }

  container.innerHTML = html
  container.style.opacity = 1

  const position = chart.canvas.getBoundingClientRect()
  const anchor = active.element || {}
  const x = position.left + (anchor.x ?? chart.width / 2)
  const y = position.top + (anchor.y ?? chart.height / 2)
  const bodyWidth = container.offsetWidth
  const bodyHeight = container.offsetHeight

  let left = x + 12
  let top = y - bodyHeight / 2
  if (left + bodyWidth > window.innerWidth - 8) left = x - bodyWidth - 12
  if (left < 8) left = 8
  if (top + bodyHeight > window.innerHeight - 8) top = y + 12
  if (top < 8) top = 8

  container.style.left = `${left}px`
  container.style.top = `${top}px`
}
