// test-trend-seed.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DAY = 86400000;
const REPORTS_FILE = path.join(__dirname, "data", "reports.json");

// Nyamasheke's 5 auto-generated demo sectors, per ensureNationalDemoCoverage's
// id scheme: demo_${slug(district)}_${position}
const TEST_SECTOR_IDS = [
  "demo_nyamasheke_1",
  "demo_nyamasheke_2",
  "demo_nyamasheke_3",
  "demo_nyamasheke_4",
  "demo_nyamasheke_5",
];

// Known values — hand-calculable expected averages
const PAST_VALUES = [80, 82, 78, 84, 81]; // 10 days ago — avg = 81
const CURRENT_VALUES = [40, 42, 38, 44, 41]; // 1 day ago — avg = 41
// Expected trendDelta = 41 - 81 = -40

const now = Date.now();
const reports = JSON.parse(fs.readFileSync(REPORTS_FILE, "utf-8"));

// Remove any existing reports for these test sectors so old seed data
// doesn't interfere with which report computeScores picks as "latest"
const cleaned = reports.filter((r) => !TEST_SECTOR_IDS.includes(r.sectorId));

const testReports = [];
TEST_SECTOR_IDS.forEach((sectorId, i) => {
  testReports.push({
    id: `test_past_${sectorId}`,
    sectorId,
    availabilityPercent: PAST_VALUES[i],
    reporterType: "demo",
    reportedBy: "trend_test",
    note: "Controlled trend test — past snapshot",
    date: new Date(now - 10 * DAY).toISOString(),
  });
  testReports.push({
    id: `test_current_${sectorId}`,
    sectorId,
    availabilityPercent: CURRENT_VALUES[i],
    reporterType: "demo",
    reportedBy: "trend_test",
    note: "Controlled trend test — current snapshot",
    date: new Date(now - 1 * DAY).toISOString(),
  });
});

fs.writeFileSync(
  REPORTS_FILE,
  JSON.stringify([...cleaned, ...testReports], null, 2),
);

console.log("Injected controlled trend test data for Nyamasheke.");
console.log(
  `Expected avgAvailability: ${CURRENT_VALUES.reduce((a, b) => a + b) / 5}`,
);
console.log(
  `Expected previousAvgAvailability: ${PAST_VALUES.reduce((a, b) => a + b) / 5}`,
);
console.log(
  `Expected trendDelta: ${CURRENT_VALUES.reduce((a, b) => a + b) / 5 - PAST_VALUES.reduce((a, b) => a + b) / 5}`,
);
