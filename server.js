import express from 'express';
import { JSONFilePreset } from 'lowdb/node';

const db = await JSONFilePreset('db.json', { parkings: [] });

const app = express();
app.use(express.json());

app.get('/parkings', (req, res) => {
  res.json(db.data.parkings);
});

app.get('/parkings/:id', (req, res) => {
  if (!db.data.parkings[req.params.id]) {
    return res.status(404).json({ error: 'Parking not found' });
  }
  const parking = db.data.parkings[req.params.id];
  res.json(parking);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});