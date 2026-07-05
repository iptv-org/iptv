const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'MatchCast API',
    status: 'running',
    version: '1.0.0'
  });
});

app.get('/playlist', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL required' });
// 🏟️ Live matches endpoint (dashboard data)
app.get('/matches', (req, res) => {
  res.json([
    {
      id: 1,
      sport: 'Football',
      home: 'FC Alpha',
      away: 'United Stars',
      score: '2 - 1',
      status: 'LIVE'
    },
    {
      id: 2,
      sport: 'Basketball',
      home: 'Lions',
      away: 'Raptors',
      score: '88 - 91',
      status: 'Q4'
    },
    {
      id: 3,
      sport: 'Tennis',
      home: 'Nadal',
      away: 'Djokovic',
      score: '6-4 3-6',
      status: 'SET 3'
    }
  ])
})
    const response = await axios.get(url);
    res.send(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('MatchCast running on', PORT));
