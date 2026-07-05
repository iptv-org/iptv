import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChannelGrid from './components/ChannelGrid'
import Player from './components/Player'
import LiveMatches from './components/LiveMatches'
import { fetchPlaylist, parseM3U } from './api'

export default function App() {
  const [channels, setChannels] = useState([])
  const [selected, setSelected] = useState(null)

  const loadPlaylist = async (url) => {
    const text = await fetchPlaylist(url)
    const items = parseM3U(text)
    setChannels(items)
  }

  return (
    <div style={{ display: 'flex', background: '#000', minHeight: '100vh', color: '#fff' }}>
      <Sidebar />

      <div style={{ flex: 1, padding: 20 }}>
        <LiveMatches />

        <div style={{ marginBottom: 20 }}>
          <input
            placeholder="Enter M3U URL"
            style={{ width: '70%', padding: 10 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadPlaylist(e.target.value)
            }}
          />
        </div>

        <ChannelGrid channels={channels} onSelect={setSelected} />

        {selected && <Player url={selected.url} />}
      </div>
    </div>
  )
}