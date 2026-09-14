import { useEffect, useState, useCallback } from "react";
import { getDistricts, getDistrictSectors, getSectors, getActiveDistribution } from "../api";
import DistrictCard from "../components/DistrictCard";
import SectorCard from "../components/SectorCard";
import AddSectorForm from "../components/AddSectorForm";
import Pagination from "../components/Pagination";
import SectorDetailModal from "../components/SectorDetailModal";
import NeedsAttention from "../components/NeedsAttention";
import { colorForAvailability, formatNumber } from "../utils";
import WorseningFastest from "../components/WorseningFastest";
import DistributionStatus from "../components/DistributionStatus";
import ThresholdAlerts from "../components/ThresholdAlerts";

const PAGE_SIZE = 6;
const DISTRICT_PAGE_SIZE = 6;

export default function WasacPortal() {
  const [districts, setDistricts] = useState(null);
  const [allSectors, setAllSectors] = useState([]);
  const [error, setError] = useState("");
  const [addingSector, setAddingSector] = useState(false);
  const [detailSector, setDetailSector] = useState(null);
  const [activeDistribution, setActiveDistribution] = useState(null);
  const [distributionLoaded, setDistributionLoaded] = useState(false);

  const [alertThreshold] = useState(() => {
  const saved = localStorage.getItem("Mira:alertThreshold");
  return saved !== null ? Number(saved) : 40;
  });
  // null = districts overview; otherwise { district aggregate object }
  const [openDistrict, setOpenDistrict] = useState(null);
  const [sectorPage, setSectorPage] = useState(1);
  const [sectorData, setSectorData] = useState(null);
  const [sectorError, setSectorError] = useState("");
  const [districtPage, setDistrictPage] = useState(1);

  const loadDistricts = useCallback(async () => {
    try {
      const [districtData, sectorData] = await Promise.all([getDistricts(), getSectors()]);
      setDistricts(districtData);
      setAllSectors(sectorData);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadDistricts();
  }, [loadDistricts]);

  const loadSectorPage = useCallback(async (districtName, page) => {
    try {
      const data = await getDistrictSectors(districtName, page, PAGE_SIZE);
      setSectorData(data);
      setSectorError("");
    } catch (err) {
      setSectorError(err.message);
    }
  }, []);

  useEffect(() => {
    getActiveDistribution()
      .then(setActiveDistribution)
      .catch(() => setActiveDistribution(null))
      .finally(() => setDistributionLoaded(true));
    }, []);

  useEffect(() => {
    if (openDistrict) loadSectorPage(openDistrict.district, sectorPage);
  }, [openDistrict, sectorPage, loadSectorPage]);

  function openDistrictView(d) {
    setOpenDistrict(d);
    setSectorPage(1);
  }

  function closeDistrictView() {
    setOpenDistrict(null);
    setSectorData(null);
    loadDistricts();
  }

  const reportedTotal = (districts || []).reduce((sum, d) => sum + d.reportedCount, 0);
  const weightedSum = (districts || []).reduce(
    (sum, d) => sum + (d.avgAvailability ?? 0) * d.reportedCount,
    0
  );
  const overallAvg = reportedTotal ? Math.round(weightedSum / reportedTotal) : null;

  const totalPopulation = (districts || []).reduce((sum, d) => sum + d.totalPopulation, 0);
  const attentionCount = (districts || []).reduce((sum, d) => sum + d.staleCount, 0);

  const previousWeightedSum = (districts || []).reduce(
    (sum, d) => sum + (d.previousAvgAvailability ?? 0) * (d.previousAvgAvailability !== null ? d.reportedCount : 0),
    0
  );
  const previousReportedTotal = (districts || []).reduce(
    (sum, d) => sum + (d.previousAvgAvailability !== null ? d.reportedCount : 0),
    0
  );
  const previousOverallAvg = previousReportedTotal ? Math.round(previousWeightedSum / previousReportedTotal) : null;
  const overallTrend = overallAvg !== null && previousOverallAvg !== null ? overallAvg - previousOverallAvg : null;
  


  const populations = openDistrict && sectorData ? sectorData.sectors.map((s) => s.population) : [];
  const minPop = populations.length ? Math.min(...populations) : 0;
  const maxPop = populations.length ? Math.max(...populations) : 1;
  const districtTotalPages = Math.max(1, Math.ceil((districts?.length || 0) / DISTRICT_PAGE_SIZE));
  const visibleDistricts = (districts || []).slice(
    (districtPage - 1) * DISTRICT_PAGE_SIZE,
    districtPage * DISTRICT_PAGE_SIZE
  );

  return (
    <>
      <header className="hero">
        <p className="eyebrow">WASAC · national view</p>
        <h1>{openDistrict ? openDistrict.district : "Dashboard"}</h1>
        <p className="hero-sub">
          {openDistrict
            ? `${openDistrict.sectorCount} sectors in ${openDistrict.district} district.`
            : "Every district, ranked by need — population and reported scarcity combined across all its sectors."}
        </p>

        {!openDistrict && districts && (
          <>
            <div className="stat-cards">
              <div className="stat-card">
                <span className="stat-card-value" style={{ color: colorForAvailability(overallAvg) }}>
                  {overallAvg === null ? "—" : `${overallAvg}%`}
                </span>
                <span className="stat-card-label">
                  national avg availability
                  {overallTrend !== null && overallTrend !== 0 && (
                    <span className={`trend-badge ${overallTrend > 0 ? "trend-up" : "trend-down"}`}>
                      {" "}{overallTrend > 0 ? "▲" : "▼"} {Math.abs(overallTrend)}%
                    </span>
                  )}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card-value">{formatNumber(totalPopulation)}</span>
                <span className="stat-card-label">people covered</span>
              </div>
              <div className="stat-card">
                <span
                  className="stat-card-value"
                  style={{ color: attentionCount > 0 ? "var(--c-bad)" : "var(--c-good)" }}
                >
                  {attentionCount}
                </span>
                <span className="stat-card-label">sectors needing attention</span>
              </div>
            </div>

            <DistributionStatus activeDistribution={activeDistribution} loading={!distributionLoaded} />
          </>
        )}

        {openDistrict && (
          <div className="hero-stat">
            <div>
              <span className="hero-stat-num" style={{ color: colorForAvailability(openDistrict.avgAvailability) }}>
                {openDistrict.avgAvailability === null ? "—" : `${openDistrict.avgAvailability}%`}
              </span>
              <span className="hero-stat-label">district avg availability</span>
            </div>
            <div className="hero-gauge">
              <div className="hero-gauge-line" style={{ background: colorForAvailability(openDistrict.avgAvailability) }} />
            </div>
          </div>
        )}
      </header>

      <main>
        {!openDistrict && (
          <>
          <ThresholdAlerts districts={districts} threshold={alertThreshold} onOpen={openDistrictView} />
          <WorseningFastest districts={districts} onOpen={openDistrictView} />
            <NeedsAttention sectors={allSectors} onOpen={setDetailSector} />
            
            <div className="section-head">
              <h2>Districts ({districts ? districts.length : "…"})</h2>
              <button className="btn-primary" onClick={() => setAddingSector((v) => !v)}>
                {addingSector ? "Close" : "+ Add sector"}
              </button>
            </div>

            {addingSector && (
              <div className="panel">
                <AddSectorForm
                  onCancel={() => setAddingSector(false)}
                  onAdded={() => {
                    setAddingSector(false);
                    loadDistricts();
                  }}
                />
              </div>
            )}

            {error && <p className="empty-state">{error}</p>}
            {!error && districts === null && <p className="empty-state">Loading districts…</p>}
            {!error && districts !== null && districts.length === 0 && (
              <p className="empty-state">No sectors yet. Add one to start tracking.</p>
            )}

            {districts && districts.length > 0 && (
        <div className="district-grid">
            {visibleDistricts.map((d) => (
            <DistrictCard key={d.district} district={d}
            onSelect={() => openDistrictView(d)}
            />
          ))}
        </div>
)}
            <Pagination page={districtPage} totalPages={districtTotalPages} onChange={setDistrictPage} />
          </>
        )}

        {openDistrict && (
          <>
            <div className="section-head">
              <button className="back-link" onClick={closeDistrictView}>
                ← All districts
              </button>
            </div>

            {sectorError && <p className="empty-state">{sectorError}</p>}
            {!sectorError && !sectorData && <p className="empty-state">Loading sectors…</p>}

            {sectorData && (
              <>
                <div className="sector-grid">
                  {sectorData.sectors.map((s) => (
                    <SectorCard
                      key={s.id}
                      sector={s}
                      minPop={minPop}
                      maxPop={maxPop}
                      onChanged={() => loadSectorPage(openDistrict.district, sectorPage)}
                      onOpenDetail={setDetailSector}
                    />
                  ))}
                </div>
                <Pagination page={sectorData.page} totalPages={sectorData.totalPages} onChange={setSectorPage} />
              </>
            )}
          </>
        )}
      </main>

      {detailSector && <SectorDetailModal sector={detailSector} onClose={() => setDetailSector(null)} />}
    </>
  );
}
