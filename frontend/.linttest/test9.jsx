import { useState, useEffect } from 'react'

export default function T9() {
  const [dept, setDept] = useState('')
  const [brigadas, setBrigadas] = useState([])

  useEffect(() => {
    let cancelled = false
    if (!dept) {
      Promise.resolve([]).then((b) => {
        if (!cancelled) setBrigadas(b)
      })
      return () => { cancelled = true }
    }
    fetch('/b/' + dept)
      .then((d) => {
        if (!cancelled) setBrigadas(d)
      })
      .catch(() => {
        if (!cancelled) setBrigadas([])
      })
    return () => { cancelled = true }
  }, [dept])

  return <div onClick={() => setDept('x')}>{brigadas.length}</div>
}
