export default function Sidebar({ channels, onSelect }) {
  const categories = ['All', 'Football', 'Basketball', 'Tennis']

  return (
    <div style={{ width: 200, background: '#000', color: '#fff', padding: 10 }}>
      <h3>MatchCast</h3>
      {categories.map((c, i) => (
        <div key={i} style={{ padding: 5, cursor: 'pointer' }}>
          {c}
        </div>
      ))}
    </div>
  )
}