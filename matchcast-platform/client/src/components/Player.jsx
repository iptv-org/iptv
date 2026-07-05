import { useEffect, useRef } from 'react'

export default function Player({ url }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (!url || !videoRef.current) return

    videoRef.current.src = url
  }, [url])

  return (
    <div style={{ background: '#000', padding: 10 }}>
      <video
        ref={videoRef}
        controls
        style={{ width: '100%', maxHeight: 500 }}
      />
    </div>
  )
}