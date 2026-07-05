export default function ChannelGrid({ channels, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
      {channels.map((ch, i) => (
        <div
          key={i}
          onClick={() => onSelect(ch)}
          style={{ padding: 10, background: '#111', color: '#fff', cursor: 'pointer' }}
        >
          <h4>{ch.name}</h4>
        </div>
      ))}
    </div>
  )
}