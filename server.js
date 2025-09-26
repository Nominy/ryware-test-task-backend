import express from "express";
import { JSONFilePreset } from "lowdb/node";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const db = await JSONFilePreset("db.json", { parkings: {} });

if (!db.data || typeof db.data !== "object") {
  db.data = { parkings: {} };
  await db.write();
} else if (
  !("parkings" in db.data) ||
  typeof db.data.parkings !== "object" ||
  Array.isArray(db.data.parkings)
) {
  const flatEntries = db.data;
  db.data = {
    parkings: flatEntries && !("parkings" in flatEntries) ? flatEntries : {},
  };
  await db.write();
}

const app = express();
app.use(express.json());
const allowedOriginsEnv =
  process.env.FRONTEND_URL || process.env.CORS_ORIGINS || "";
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
      Object.entries(db.data.parkings || {}).map(([key, parking]) => {
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
});

app.post("/parkings", (req, res) => {
  const parking = req.body;

  const id = uuidv4();
  parking.usages = 0;
  parking.status = req.body.status;
  parking.address = req.body.address;

  db.data.parkings[id] = parking;
  db.write();
  res.json(parking);
});

app.put("/parkings/usage/:id", (req, res) => {
  if (!db.data.parkings[req.params.id]) {
    return res.status(404).json({ error: "Parking not found" });
  }

  if (db.data.parkings[req.params.id].status === false) {
    return res.status(400).json({ error: "Parking is not enabled" });
  }

  const parking = db.data.parkings[req.params.id];
  parking.usages++;
  db.write();
  res.json(parking);
});

app.put("/parkings/status/:id", (req, res) => {
  if (!db.data.parkings[req.params.id]) {
    return res.status(404).json({ error: "Parking not found" });
  }

  const parking = db.data.parkings[req.params.id];
  parking.status = req.body.status;
  db.write();
  res.json(parking);
});
