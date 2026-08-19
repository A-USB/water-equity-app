import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const SECTORS_FILE = path.join(DATA_DIR, "sectors.json");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

// ---------- storage helpers ----------
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function ensureSeed() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(SECTORS_FILE)) {
    // Illustrative seed data only — swap in real NISR population figures
    // and live reports before using this for anything real.
    const sectors = [
      { id: "s1", name: "Busasamana", district: "Nyanza", population: 45000 },
      { id: "s2", name: "Muyira", district: "Nyanza", population: 27000 },
      { id: "s3", name: "Ntyazo", district: "Nyanza", population: 24000 },
      { id: "s4", name: "Jenda", district: "Nyabihu", population: 31000 },
      { id: "s5", name: "Mukamira", district: "Nyabihu", population: 38000 },
      { id: "s6", name: "Karago", district: "Nyabihu", population: 29000 },
      { id: "s7", name: "Nyamirambo", district: "Nyarugenge", population: 92000 },
      { id: "s8", name: "Muhima", district: "Nyarugenge", population: 54000 },
      { id: "s9", name: "Kimisagara", district: "Nyarugenge", population: 61000 },
    ].map((s) => ({ ...s, createdAt: new Date().toISOString() }));
    writeJSON(SECTORS_FILE, sectors);
  }
  if (!fs.existsSync(REPORTS_FILE)) writeJSON(REPORTS_FILE, []);
}
ensureSeed();

// ---------- scoring ----------
// Need score blends how many people are affected with how bad the shortage is.
// Both population and (100 - availability) are normalized 0-1 across current
// sectors, then combined. Higher score = higher priority.
function computeScores(sectors, reports) {
  const latestBySector = {};
  for (const r of reports) {
    const prev = latestBySector[r.sectorId];
    if (!prev || new Date(r.date) > new Date(prev.date)) latestBySector[r.sectorId] = r;
  }

  const populations = sectors.map((s) => s.population);
  const maxPop = Math.max(...populations, 1);
  const minPop = Math.min(...populations, 0);
  const popRange = maxPop - minPop || 1;

  return sectors.map((s) => {
    const latest = latestBySector[s.id] || null;
    const availability = latest ? latest.availabilityPercent : null;
    const popNorm = (s.population - minPop) / popRange;
    const scarcityNorm = availability === null ? 0.5 : (100 - availability) / 100;
    const score = Math.round((popNorm * 0.5 + scarcityNorm * 0.5) * 100);
    return {
      ...s,
      latestAvailability: availability,
      latestReportDate: latest ? latest.date : null,
      needScore: score,
    };
  }).sort((a, b) => b.needScore - a.needScore);
}

// ---------- app ----------
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/sectors", (req, res) => {
  const sectors = readJSON(SECTORS_FILE);
  const reports = readJSON(REPORTS_FILE);
  res.json(computeScores(sectors, reports));
});

app.post("/api/sectors", (req, res) => {
  const { name, district, population } = req.body;
  if (!name || !district || !population) {
    return res.status(400).json({ error: "name, district, and population are required" });
  }
  const sectors = readJSON(SECTORS_FILE);
  const newSector = {
    id: "s" + Date.now(),
    name,
    district,
    population: Number(population),
    createdAt: new Date().toISOString(),
  };
  sectors.push(newSector);
  writeJSON(SECTORS_FILE, sectors);
  res.status(201).json(newSector);
});

app.get("/api/sectors/:id/reports", (req, res) => {
  const reports = readJSON(REPORTS_FILE).filter((r) => r.sectorId === req.params.id);
  reports.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(reports);
});

app.post("/api/reports", (req, res) => {
  const { sectorId, availabilityPercent, reporterType, note } = req.body;
  if (!sectorId || availabilityPercent === undefined || !reporterType) {
    return res.status(400).json({ error: "sectorId, availabilityPercent, and reporterType are required" });
  }
  if (availabilityPercent < 0 || availabilityPercent > 100) {
    return res.status(400).json({ error: "availabilityPercent must be 0-100" });
  }
  const sectors = readJSON(SECTORS_FILE);
  if (!sectors.find((s) => s.id === sectorId)) {
    return res.status(404).json({ error: "sector not found" });
  }
  const reports = readJSON(REPORTS_FILE);
  const newReport = {
    id: "r" + Date.now(),
    sectorId,
    availabilityPercent: Number(availabilityPercent),
    reporterType, // "official" | "citizen_check"
    note: note || "",
    date: new Date().toISOString(),
  };
  reports.push(newReport);
  writeJSON(REPORTS_FILE, reports);
  res.status(201).json(newReport);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Water equity API running on port ${PORT}`));
