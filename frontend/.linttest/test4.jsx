import { useState, useEffect } from 'react'

export default function T4() {
  const [data, setData] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) {
      setTimeout(() => setData([1, 2, 3]), 0)
    }
  }, [ready])

  return <div onClick={() => setReady(true)}>{data.length}</div>
}
