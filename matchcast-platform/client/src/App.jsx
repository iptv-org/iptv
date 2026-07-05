import { useState } from 'react'

export default function App() {
  const [url, setUrl] = useState('')
  const [data, setData] = useState('')

  const fetchPlaylist = async () => {
    if (!url) return
    const res = await fetch(`http://localhost:5000/playlist?url=${encodeURIComponent(url)}`)
    const text = await res.text()
    setData(text)
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>📡 MatchCast</h1>

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter M3U URL"
        style={{ width: '80%', padding: 10 }}
      />

      <button onClick={fetchPlaylist} style={{ marginLeft: 10, padding: 10 }}>
        Load
      </button>

      <pre style={{ marginTop: 20, background: '#111', color: '#0f0', padding: 10 }}>
        {data}
      </pre>
    </div>
  )
}