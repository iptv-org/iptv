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

    const response = await axios.get(url);
    res.send(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('MatchCast running on', PORT));
