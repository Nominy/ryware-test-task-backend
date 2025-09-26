import express from "express";
import { JSONFilePreset } from "lowdb/node";
import cors from "cors";
import { v4 as uuidv4 } from 'uuid';

const db = await JSONFilePreset("db.json", { parkings: [] });

const app = express();
app.use(express.json());
const allowedOriginsEnv = process.env.FRONTEND_URL || process.env.CORS_ORIGINS || "";
const allowedOrigins = (allowedOriginsEnv ? allowedOriginsEnv.split(",") : [])
  .map((s) => s.trim())
  .filter(Boolean);


const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: false,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

app.get("/parkings", (req, res) => {
  if (req.query.verbose) {
    res.json(db.data.parkings);
  } else {
    res.json(
      Object.entries(db.data.parkings).map(([key, parking]) => {
        return { id: key, address: parking.address };
      })
    );
  }
});

app.get("/parkings/:id", (req, res) => {
  if (!db.data.parkings[req.params.id]) {
    return res.status(404).json({ error: "Parking not found" });
  }
  const parking = db.data.parkings[req.params.id];
  res.json(parking);
})

app.post("/parkings", (req, res) => {
  const parking = req.body;

  parking.id = uuidv4();
  parking.usages = 0;
  parking.status = req.body.status;
  parking.address = req.body.address;

  db.data.parkings[parking.id] = parking;
  db.write();
  res.json(parking);
})