import { useState, useEffect } from 'react'

const INITIAL = { nombre: '' }

export default function T8({ editando }) {
  const [form, setForm] = useState(
    editando
      ? { nombre: editando.nombre }
      : INITIAL,
  )

  return (
    <div>
      <input value={form.nombre} onChange={(e) => setForm({ nombre: e.target.value })} />
    </div>
  )
}
