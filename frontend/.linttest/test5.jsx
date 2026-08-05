import { useState, useEffect } from 'react'

export default function T5() {
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ nombre: '' })

  useEffect(() => {
    if (edit) {
      setForm({ nombre: edit.nombre })
    } else {
      setForm({ nombre: '' })
    }
  }, [edit])

  return <div onClick={() => setEdit({ nombre: 'x' })}>{form.nombre}</div>
}
