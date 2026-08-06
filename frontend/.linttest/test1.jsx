import { useState, useEffect, useCallback } from 'react'

export default function T1() {
  const [data, setData] = useState([])

  const loadAsync = useCallback(async () => {
    const res = await fetch('/x')
    setData(res)
  }, [])

  useEffect(() => {
    loadAsync()
  }, [loadAsync])

  return <div>{data.length}</div>
}
