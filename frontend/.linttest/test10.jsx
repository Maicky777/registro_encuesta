import { useState, useEffect, useCallback } from 'react'

export default function T10() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/x')
      .then((res) => setData(res))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    Promise.resolve().then(load)
  }, [load])

  return <div>{data.length}</div>
}
