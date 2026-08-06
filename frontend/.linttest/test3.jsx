import { useState, useEffect } from 'react'

export default function T3() {
  const [data, setData] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) {
      setData([1, 2, 3])
    }
  }, [ready])

  return <div onClick={() => setReady(true)}>{data.length}</div>
}
