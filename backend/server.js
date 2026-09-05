import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { computeDistribution } from "./distribution.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const SECTORS_FILE = path.join(DATA_DIR, "sectors.json");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const DISTRIBUTION_CONFIG_FILE = path.join(DATA_DIR, "distribution-config.json");
const DISTRIBUTIONS_FILE = path.join(DATA_DIR, "distributions.json");

// ---------- storage helpers ----------
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

// Illustrative national coverage for the pilot. These are district names only;
// replace the generated sector and population values with official NISR data
// before any operational use.
const RWANDA_DISTRICTS = [
  "Bugesera", "Burera", "Gakenke", "Gasabo", "Gatsibo", "Gicumbi", "Gisagara", "Huye",
  "Kamonyi", "Karongi", "Kayonza", "Kicukiro", "Kirehe", "Muhanga", "Musanze", "Ngoma",
  "Ngororero", "Nyabihu", "Nyagatare", "Nyamagabe", "Nyamasheke", "Nyanza", "Nyarugenge",
  "Nyaruguru", "Rubavu", "Ruhango", "Rulindo", "Rusizi", "Rutsiro", "Rwamagana",
];

function textHash(value) {
  return [...value].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 7);
}

function ensureNationalDemoCoverage() {
  const sectors = readJSON(SECTORS_FILE);
  const reports = readJSON(REPORTS_FILE);
  const users = readJSON(USERS_FILE);
  let sectorsChanged = false;
  let reportsChanged = false;
  let usersChanged = false;

  for (const district of RWANDA_DISTRICTS) {
    const districtSectors = sectors.filter((sector) => sector.district === district);
    for (let position = districtSectors.length + 1; position <= 5; position += 1) {
      const id = `demo_${slug(district)}_${position}`;
      const sector = {
        id,
        name: `${district} Sector ${position}`,
        district,
        population: 18000 + ((textHash(`${district}-${position}`) % 42) * 1000),
        createdAt: new Date().toISOString(),
      };
      sectors.push(sector);
      districtSectors.push(sector);
      sectorsChanged = true;
    }
  }

  for (const sector of sectors) {
    if (!users.some((user) => user.sectorId === sector.id)) {
      users.push({
        id: `u_${sector.id}`,
        username: slug(sector.name),
        role: "sector",
        sectorId: sector.id,
        passwordHash: bcrypt.hashSync("sector123", 8),
      });
      usersChanged = true;
    }
    if (!reports.some((report) => report.sectorId === sector.id)) {
      const seed = textHash(sector.id);
      const date = new Date(Date.now() - ((seed % 8) + 1) * 86400000).toISOString();
      reports.push({
        id: `demo_r_${sector.id}`,
        sectorId: sector.id,
        availabilityPercent: 35 + (seed % 56),
        reporterType: "demo",
        reportedBy: "demo_seed",
        note: "Illustrative national demo reading.",
        date,
      });
      reportsChanged = true;
    }
  }

  if (sectorsChanged) writeJSON(SECTORS_FILE, sectors);
  if (reportsChanged) writeJSON(REPORTS_FILE, reports);
  if (usersChanged) writeJSON(USERS_FILE, users);
}

function ensureSeed() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

  let sectors;
  if (!fs.existsSync(SECTORS_FILE)) {
    // Illustrative seed data only — swap in real NISR population figures
    // before this is used for anything beyond a demo.
    sectors = [
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
  } else {
    sectors = readJSON(SECTORS_FILE);
  }

  if (!fs.existsSync(REPORTS_FILE)) writeJSON(REPORTS_FILE, []);

  if (!fs.existsSync(USERS_FILE)) {
    // Demo credentials — every sector account uses the same demo password.
    // Force a real password change before using this for anything real.
    const users = [
      {
        id: "u_wasac",
        username: "wasac_hq",
        role: "wasac",
        sectorId: null,
        passwordHash: bcrypt.hashSync("wasac123", 8),
      },
      ...sectors.map((s) => ({
        id: "u_" + s.id,
        username: slug(s.name),
        role: "sector",
        sectorId: s.id,
        passwordHash: bcrypt.hashSync("sector123", 8),
      })),
    ];
    writeJSON(USERS_FILE, users);
  }
}
ensureSeed();
ensureNationalDemoCoverage();

// in-memory session store — fine for a local pilot; swap for JWT/Redis later
const sessions = new Map();

// A sector is considered "needs attention" if it has never reported, or its
// last report is older than this. Keep in sync with STALE_DAYS in the
// frontend's utils.js if you change this.
const STALE_DAYS = 14;

function isStale(latestReportDate) {
  if (!latestReportDate) return true;
  const days = (Date.now() - new Date(latestReportDate).getTime()) / 86400000;
  return days > STALE_DAYS;
}

// ---------- scoring ----------
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

// ---------- auth middleware ----------
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const session = token && sessions.get(token);
  if (!session) return res.status(401).json({ error: "Not authenticated" });
  req.user = session;
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ error: `Requires ${role} account` });
    next();
  };
}

// ---------- app ----------
const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(USERS_FILE);
  const user = users.find((u) => u.username === username);
  if (!user || !bcrypt.compareSync(password || "", user.passwordHash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const token = crypto.randomBytes(24).toString("hex");
  const session = { userId: user.id, username: user.username, role: user.role, sectorId: user.sectorId };
  sessions.set(token, session);

  let sectorName = null;
  if (user.sectorId) {
    const sector = readJSON(SECTORS_FILE).find((s) => s.id === user.sectorId);
    sectorName = sector ? sector.name : null;
  }
  res.json({ token, ...session, sectorName });
});

app.post("/api/auth/signup", (req, res) => {
  const { role, username, password, sectorName, district, population } = req.body;

  if (!role || !username || !password) {
    return res.status(400).json({ error: "role, username, and password are required" });
  }
  if (!["sector", "wasac"].includes(role)) {
    return res.status(400).json({ error: "role must be 'sector' or 'wasac'" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const users = readJSON(USERS_FILE);
  if (users.some((u) => u.username === username)) {
    return res.status(409).json({ error: "That username is already taken" });
  }

  let sectorId = null;
  const sectors = readJSON(SECTORS_FILE);

  if (role === "sector") {
    if (!sectorName || !district || !population) {
      return res.status(400).json({ error: "sectorName, district, and population are required for a sector account" });
    }
    const newSector = {
      id: "s" + Date.now(),
      name: sectorName,
      district,
      population: Number(population),
      createdAt: new Date().toISOString(),
    };
    sectors.push(newSector);
    writeJSON(SECTORS_FILE, sectors);
    sectorId = newSector.id;
  }

  const newUser = {
    id: "u_" + crypto.randomBytes(6).toString("hex"),
    username,
    role,
    sectorId,
    passwordHash: bcrypt.hashSync(password, 8),
  };
  const allUsers = readJSON(USERS_FILE);
  allUsers.push(newUser);
  writeJSON(USERS_FILE, allUsers);

  const token = crypto.randomBytes(24).toString("hex");
  const session = { userId: newUser.id, username: newUser.username, role: newUser.role, sectorId: newUser.sectorId };
  sessions.set(token, session);

  res.status(201).json({ token, ...session, sectorName: sectorName || null });
});

app.post("/api/auth/logout", authenticate, (req, res) => {
  const header = req.headers.authorization || "";
  sessions.delete(header.slice(7));
  res.json({ ok: true });
});

app.get("/api/me", authenticate, (req, res) => {
  let sectorName = null;
  if (req.user.sectorId) {
    const sector = readJSON(SECTORS_FILE).find((s) => s.id === req.user.sectorId);
    sectorName = sector ? sector.name : null;
  }
  res.json({ ...req.user, sectorName });
});

app.get("/api/sectors", authenticate, (req, res) => {
  const sectors = readJSON(SECTORS_FILE);
  const reports = readJSON(REPORTS_FILE);
  const scored = computeScores(sectors, reports);
  // Sector accounts only ever need their own row + the rest for context is fine
  // to withhold — keep the full list WASAC-only.
  if (req.user.role === "sector") {
    return res.json(scored.filter((s) => s.id === req.user.sectorId));
  }
  res.json(scored);
});

app.post("/api/sectors", authenticate, requireRole("wasac"), (req, res) => {
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

  // auto-create a login for the new sector so WASAC doesn't have to do it separately
  const users = readJSON(USERS_FILE);
  users.push({
    id: "u_" + newSector.id,
    username: slug(newSector.name),
    role: "sector",
    sectorId: newSector.id,
    passwordHash: bcrypt.hashSync("sector123", 8),
  });
  writeJSON(USERS_FILE, users);

  res.status(201).json({ ...newSector, loginUsername: slug(newSector.name) });
});

// ---------- public (no auth) — powers the homepage preview and, later, a
// citizen-facing map. Deliberately trimmed: no population, no staleness/
// compliance data, nothing that isn't already implied by "is there water".
app.get("/api/public/districts", (req, res) => {
  const sectors = readJSON(SECTORS_FILE);
  const reports = readJSON(REPORTS_FILE);
  const scored = computeScores(sectors, reports);

  const byDistrict = {};
  for (const s of scored) {
    if (!byDistrict[s.district]) byDistrict[s.district] = [];
    byDistrict[s.district].push(s);
  }

  const districts = Object.entries(byDistrict).map(([district, list]) => {
    const reportedList = list.filter((s) => s.latestAvailability !== null);
    const avgAvailability = reportedList.length
      ? Math.round(reportedList.reduce((sum, s) => sum + s.latestAvailability, 0) / reportedList.length)
      : null;
    return { district, sectorCount: list.length, avgAvailability };
  });

  res.json(districts);
});

app.get("/api/districts", authenticate, requireRole("wasac"), (req, res) => {
  const sectors = readJSON(SECTORS_FILE);
  const reports = readJSON(REPORTS_FILE);
  const scored = computeScores(sectors, reports);

  const byDistrict = {};
  for (const s of scored) {
    if (!byDistrict[s.district]) byDistrict[s.district] = [];
    byDistrict[s.district].push(s);
  }

  const districts = Object.entries(byDistrict).map(([district, list]) => {
    const reportedList = list.filter((s) => s.latestAvailability !== null);
    const avgAvailability = reportedList.length
      ? Math.round(reportedList.reduce((sum, s) => sum + s.latestAvailability, 0) / reportedList.length)
      : null;
    const avgNeedScore = Math.round(list.reduce((sum, s) => sum + s.needScore, 0) / list.length);
    const totalPopulation = list.reduce((sum, s) => sum + s.population, 0);
    const staleCount = list.filter((s) => isStale(s.latestReportDate)).length;
    return {
      district,
      sectorCount: list.length,
      reportedCount: reportedList.length,
      staleCount,
      totalPopulation,
      avgAvailability,
      avgNeedScore,
    };
  });

  districts.sort((a, b) => b.avgNeedScore - a.avgNeedScore);
  res.json(districts);
});

app.get("/api/districts/:district/sectors", authenticate, requireRole("wasac"), (req, res) => {
  const sectors = readJSON(SECTORS_FILE);
  const reports = readJSON(REPORTS_FILE);
  const scored = computeScores(sectors, reports).filter((s) => s.district === req.params.district);

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize) || 6);
  const total = scored.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = scored.slice(start, start + pageSize);

  res.json({ sectors: pageItems, total, page, pageSize, totalPages });
});

app.get("/api/sectors/:id/reports", authenticate, (req, res) => {
  if (req.user.role === "sector" && req.user.sectorId !== req.params.id) {
    return res.status(403).json({ error: "Cannot view another sector's reports" });
  }
  const reports = readJSON(REPORTS_FILE).filter((r) => r.sectorId === req.params.id);
  reports.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(reports);
});

app.post("/api/reports", authenticate, requireRole("sector"), (req, res) => {
  const { availabilityPercent, note } = req.body;
  if (availabilityPercent === undefined || availabilityPercent < 0 || availabilityPercent > 100) {
    return res.status(400).json({ error: "availabilityPercent must be 0-100" });
  }
  const reports = readJSON(REPORTS_FILE);
  const newReport = {
    id: "r" + Date.now(),
    sectorId: req.user.sectorId, // always the reporter's own sector — not client-supplied
    availabilityPercent: Number(availabilityPercent),
    note: note || "",
    reportedBy: req.user.username,
    date: new Date().toISOString(),
  };
  reports.push(newReport);
  writeJSON(REPORTS_FILE, reports);
  res.status(201).json(newReport);
});

app.get("/api/reports", authenticate, requireRole("wasac"), (req, res) => {
  const sectorsById = Object.fromEntries(readJSON(SECTORS_FILE).map((sector) => [sector.id, sector]));
  const reports = readJSON(REPORTS_FILE).map((report) => ({
    ...report,
    sectorName: sectorsById[report.sectorId]?.name || "Unknown sector",
    district: sectorsById[report.sectorId]?.district || "Unknown district",
  })).sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(reports);
});

// ---------- distribution ----------
app.get("/api/distribution/config", authenticate, requireRole("wasac"), (req, res) => {
  res.json(readJSON(DISTRIBUTION_CONFIG_FILE));
});

app.put("/api/distribution/config", authenticate, requireRole("wasac"), (req, res) => {
  const current = readJSON(DISTRIBUTION_CONFIG_FILE);
  const updated = { ...current, ...req.body };
  writeJSON(DISTRIBUTION_CONFIG_FILE, updated);
  res.json(updated);
});

app.get("/api/distribution/calculate", authenticate, requireRole("wasac"), (req, res) => {
  const sectors = readJSON(SECTORS_FILE);
  const reports = readJSON(REPORTS_FILE);
  const config = { ...readJSON(DISTRIBUTION_CONFIG_FILE) };
  
  // Allow overrides via query params
  if (req.query.supply) config.totalSupply_m3 = Number(req.query.supply);
  if (req.query.basePoolPct) config.basePoolPct = Number(req.query.basePoolPct);
  if (req.query.needPoolPct) config.needPoolPct = Number(req.query.needPoolPct);
  if (req.query.targetFloorPct) config.targetFloorPct = Number(req.query.targetFloorPct);
  if (req.query.targetCeilingPct) config.targetCeilingPct = Number(req.query.targetCeilingPct);
  if (req.query.maxSectorSpreadPct) config.maxSectorSpreadPct = Number(req.query.maxSectorSpreadPct);
  if (req.query.perCapitaUrban_lpcd) config.perCapitaUrban_lpcd = Number(req.query.perCapitaUrban_lpcd);
  if (req.query.perCapitaRural_lpcd) config.perCapitaRural_lpcd = Number(req.query.perCapitaRural_lpcd);

  const scored = computeScores(sectors, reports);
  const result = computeDistribution(scored, config);
  res.json(result);
});

app.post("/api/distribution/publish", authenticate, requireRole("wasac"), (req, res) => {
  const sectors = readJSON(SECTORS_FILE);
  const reports = readJSON(REPORTS_FILE);
  const baseConfig = readJSON(DISTRIBUTION_CONFIG_FILE);
  const config = { ...baseConfig, ...(req.body.config || {}) };
  
  if (req.body.totalSupply_m3) config.totalSupply_m3 = Number(req.body.totalSupply_m3);
  
  const scored = computeScores(sectors, reports);
  const result = computeDistribution(scored, config);
  
  const plan = {
    id: "dist_" + Date.now(),
    title: req.body.title || `Daily Plan - ${new Date().toLocaleDateString("en-RW", { month: "short", day: "numeric", year: "numeric" })}`,
    notes: req.body.notes || "",
    publishedAt: new Date().toISOString(),
    publishedBy: req.user.username,
    configUsed: config,
    ...result,
  };
  
  const distributions = fs.existsSync(DISTRIBUTIONS_FILE) ? readJSON(DISTRIBUTIONS_FILE) : [];
  distributions.unshift(plan);
  // Keep up to 50 historical plans
  if (distributions.length > 50) distributions.length = 50;
  writeJSON(DISTRIBUTIONS_FILE, distributions);
  
  res.status(201).json(plan);
});

app.get("/api/distribution/active", authenticate, (req, res) => {
  const distributions = fs.existsSync(DISTRIBUTIONS_FILE) ? readJSON(DISTRIBUTIONS_FILE) : [];
  if (distributions.length === 0) return res.json(null);
  const latest = distributions[0];
  
  // For sector users, filter to only their sector's and district's context
  if (req.user.role === "sector" && req.user.sectorId) {
    let matchedSector = null;
    let matchedDistrict = null;
    
    for (const d of (latest.districts || [])) {
      const s = (d.sectors || []).find((sec) => sec.id === req.user.sectorId);
      if (s) {
        matchedSector = s;
        matchedDistrict = {
          district: d.district,
          totalPopulation: d.totalPopulation,
          currentAvailability: d.currentAvailability,
          projectedAvailability: d.projectedAvailability,
          totalAllocation_m3: d.totalAllocation_m3,
          lpcd: d.lpcd,
        };
        break;
      }
    }
    
    return res.json({
      id: latest.id,
      title: latest.title || "Active Allocation Plan",
      notes: latest.notes || "",
      publishedAt: latest.publishedAt,
      publishedBy: latest.publishedBy,
      summary: latest.summary,
      district: matchedDistrict,
      sectorAllocation: matchedSector || null,
    });
  }
  
  res.json(latest);
});

app.get("/api/distribution/history", authenticate, requireRole("wasac"), (req, res) => {
  const distributions = fs.existsSync(DISTRIBUTIONS_FILE) ? readJSON(DISTRIBUTIONS_FILE) : [];
  const list = distributions.map((d) => ({
    id: d.id,
    title: d.title || `Plan ${d.id}`,
    notes: d.notes || "",
    publishedAt: d.publishedAt,
    publishedBy: d.publishedBy,
    summary: d.summary,
    districtCount: d.districts?.length || 0,
  }));
  res.json(list);
});

app.get("/api/distribution/plans/:id", authenticate, requireRole("wasac"), (req, res) => {
  const distributions = fs.existsSync(DISTRIBUTIONS_FILE) ? readJSON(DISTRIBUTIONS_FILE) : [];
  const plan = distributions.find((d) => d.id === req.params.id);
  if (!plan) return res.status(404).json({ error: "Distribution plan not found" });
  res.json(plan);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Water equity API running on port ${PORT}`));

