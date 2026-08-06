import { useState, useEffect, useCallback } from 'react'

export default function T11() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/x')
      .then((res) => setData(res))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [load])

  return <div>{data.length}</div>
}
