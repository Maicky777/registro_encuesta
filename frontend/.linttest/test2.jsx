import { useState, useEffect, useCallback } from 'react'

export default function T2() {
  const [data, setData] = useState([])

  const loadThen = useCallback(() => {
    fetch('/x').then((res) => setData(res))
  }, [])

  useEffect(() => {
    loadThen()
  }, [loadThen])

  return <div>{data.length}</div>
}
