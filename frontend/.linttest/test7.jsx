import { useState, useEffect, useCallback } from 'react'

export default function T7() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    return fetch('/x')
      .then((res) => {
        setData(res)
        return res
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return <div>{data.length}</div>
}
