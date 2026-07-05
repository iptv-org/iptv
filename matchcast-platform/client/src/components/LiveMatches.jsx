import { useEffect, useState } from 'react'

export default function LiveMatches() {
  const [matches, setMatches] = useState([])

  const fetchMatches = async () => {
    try {
      const res = await fetch('http://localhost:5000/matches')
      const data = await res.json()
      setMatches(data)
    } catch (err) {
      console.error('Failed to load matches')
    }
  }

  useEffect(() => {
    fetchMatches()
    const interval = setInterval(fetchMatches, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ color: '#fff' }}>🏟️ Live Matches</h2>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
        {matches.map((m) => (
          <div
            key={m.id}
            style={{
              minWidth: 220,
              background: '#111',
              color: '#fff',
              padding: 10,
              borderRadius: 8
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7 }}>{m.sport}</div>
            <h4>{m.home} vs {m.away}</h4>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{m.score}</div>
            <div style={{ color: 'red', marginTop: 5 }}>{m.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}