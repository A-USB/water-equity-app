import { useState, useEffect, useCallback, useMemo } from "react";
import {
  calculateDistribution,
  publishDistribution,
  getDistributionConfig,
  getDistributionHistory,
  getDistributionPlan,
  getActiveDistribution,
} from "../api";
import { colorForAvailability, formatNumber } from "../utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import {
  IconDownload,
  IconPublish,
  IconSliders,
  IconHistory,
  IconRotateCcw,
  IconRefresh,
  IconTrendingUp,
  IconChevronDown,
  IconChevronRight,
  IconChevronLeft,
  IconCheck,
  IconCheckCircle,
  IconAlertTriangle,
  IconX,
  IconLoader,
} from "../components/Icons";

const SCENARIOS = [
  { label: "Severe Drought", supply: 80000, desc: "Critical deficit allocation", tag: "Emergency", cls: "preset-drought" },
  { label: "Dry Season", supply: 150000, desc: "Constrained regional flow", tag: "Dry", cls: "preset-dry" },
  { label: "Normal Operations", supply: 220000, desc: "Standard grid capacity", tag: "Standard", cls: "preset-normal" },
  { label: "Peak Season", supply: 340000, desc: "Abundant water surplus", tag: "Surplus", cls: "preset-peak" },
];

export default function DistributionPage() {
  const [activeTab, setActiveTab] = useState("simulator"); // "simulator" | "history"
  const [config, setConfig] = useState(null);
  const [customParams, setCustomParams] = useState(null);
  const [showParamTuner, setShowParamTuner] = useState(false);
  
  const [supply, setSupply] = useState(160000);
  const [activeScenarioTag, setActiveScenarioTag] = useState("Standard");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState("Kigali City");
  
  // Table search, filter, sort & pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("currentAsc");
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const [districtPage, setDistrictPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // Default 5 per page

  // Publish Modal State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState(null);

  // History Tab State & Pagination
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryPlan, setSelectedHistoryPlan] = useState(null);
  const [activePublishedPlan, setActivePublishedPlan] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 5;

  // Load initial config and active plan
  const loadInitial = useCallback(async () => {
    try {
      const [cfg, active] = await Promise.all([
        getDistributionConfig(),
        getActiveDistribution().catch(() => null),
      ]);
      setConfig(cfg);
      setCustomParams({
        basePoolPct: Math.round((cfg.basePoolPct ?? 0.30) * 100),
        needPoolPct: Math.round((cfg.needPoolPct ?? 0.70) * 100),
        targetFloorPct: cfg.targetFloorPct ?? 75,
        targetCeilingPct: cfg.targetCeilingPct ?? 85,
        maxSectorSpreadPct: cfg.maxSectorSpreadPct ?? 25,
        perCapitaUrban_lpcd: cfg.perCapitaUrban_lpcd ?? 80,
        perCapitaRural_lpcd: cfg.perCapitaRural_lpcd ?? 25,
      });
      setSupply(cfg.totalSupply_m3 || 160000);
      setActivePublishedPlan(active);
    } catch (err) {
      console.error("Failed to load initial distribution config:", err);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Recalculate distribution live with supply & parameter overrides
  const loadSimulation = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    try {
      const overrides = customParams
        ? {
            basePoolPct: customParams.basePoolPct / 100,
            needPoolPct: customParams.needPoolPct / 100,
            targetFloorPct: customParams.targetFloorPct,
            targetCeilingPct: customParams.targetCeilingPct,
            maxSectorSpreadPct: customParams.maxSectorSpreadPct,
            perCapitaUrban_lpcd: customParams.perCapitaUrban_lpcd,
            perCapitaRural_lpcd: customParams.perCapitaRural_lpcd,
          }
        : {};
      overrides.scenario = activeScenarioTag;
      const result = await calculateDistribution(supply, overrides);
      setData(result);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  }, [config, customParams, supply, activeScenarioTag]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSimulation();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadSimulation]);

  // Load history list
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const list = await getDistributionHistory();
      setHistoryList(list);
    } catch (err) {
      console.error("Failed to load distribution history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  // Reset page when filter, search, sort, or page size changes
  useEffect(() => {
    setDistrictPage(1);
  }, [searchQuery, tierFilter, floorFilter, sortBy, pageSize]);

  // Handle Scenario preset select
  function applyScenario(s) {
    setSupply(s.supply);
    setActiveScenarioTag(s.tag);
  }

  // Reset custom parameters to initial default config
  function handleResetParams() {
    if (!config) return;
    setCustomParams({
      basePoolPct: Math.round((config.basePoolPct ?? 0.30) * 100),
      needPoolPct: Math.round((config.needPoolPct ?? 0.70) * 100),
      targetFloorPct: config.targetFloorPct ?? 75,
      targetCeilingPct: config.targetCeilingPct ?? 85,
      maxSectorSpreadPct: config.maxSectorSpreadPct ?? 25,
      perCapitaUrban_lpcd: config.perCapitaUrban_lpcd ?? 80,
      perCapitaRural_lpcd: config.perCapitaRural_lpcd ?? 25,
    });
  }

  // Handle Publish Plan
  async function handleConfirmPublish(e) {
    e.preventDefault();
    setPublishing(true);
    try {
      const payload = {
        totalSupply_m3: supply,
        scenario: activeScenarioTag,
        title: planTitle.trim() || `Daily Plan · ${new Date().toLocaleDateString("en-RW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        notes: planNotes.trim(),
        config: customParams
          ? {
              basePoolPct: customParams.basePoolPct / 100,
              needPoolPct: customParams.needPoolPct / 100,
              targetFloorPct: customParams.targetFloorPct,
              targetCeilingPct: customParams.targetCeilingPct,
              maxSectorSpreadPct: customParams.maxSectorSpreadPct,
              perCapitaUrban_lpcd: customParams.perCapitaUrban_lpcd,
              perCapitaRural_lpcd: customParams.perCapitaRural_lpcd,
            }
          : undefined,
      };

      const published = await publishDistribution(payload);
      setActivePublishedPlan(published);
      setShowPublishModal(false);
      setPlanTitle("");
      setPlanNotes("");
      setPublishSuccessMsg(`Published plan "${published.title}" successfully at ${new Date().toLocaleTimeString()}!`);
      setTimeout(() => setPublishSuccessMsg(null), 6000);
      if (activeTab === "history") loadHistory();
    } catch (err) {
      alert("Failed to publish plan: " + err.message);
    } finally {
      setPublishing(false);
    }
  }

  // Export Allocation to CSV
  function handleExportCsv() {
    if (!data || !data.districts) return;
    const rows = [
      ["# Rwanda Water Equity Allocation Plan"],
      [`Generated at: ${new Date().toISOString()}`],
      [`Total Daily Supply (m3): ${data.summary.totalSupply_m3}`],
      [`Total Population: ${data.summary.totalPopulation}`],
      [`Equity Index: ${(data.summary.equityIndex * 100).toFixed(1)}%`],
      [`Average Availability (Before -> After): ${Math.round(data.summary.avgAvailabilityBefore)}% -> ${Math.round(data.summary.avgAvailabilityAfter)}%`],
      [],
      [
        "District",
        "Sector",
        "Population",
        "Stress Tier",
        "Demand (m3)",
        "Current Availability (%)",
        "Projected Availability (%)",
        "Net Gain (%)",
        "Allocated Volume (m3)",
        "Per Capita (LPCD)",
      ],
    ];

    data.districts.forEach((d) => {
      rows.push([
        d.district,
        "[ALL SECTORS]",
        d.totalPopulation,
        d.stressTier,
        Math.round(d.demand_m3),
        Math.round(d.currentAvailability),
        Math.round(d.projectedAvailability),
        Math.round(d.projectedAvailability - d.currentAvailability),
        Math.round(d.totalAllocation_m3),
        Math.round(d.lpcd),
      ]);

      d.sectors.forEach((s) => {
        rows.push([
          d.district,
          s.name,
          s.population,
          d.stressTier,
          Math.round(s.demand_m3 || 0),
          Math.round(s.currentAvailability),
          Math.round(s.projectedAvailability),
          Math.round(s.projectedAvailability - s.currentAvailability),
          Math.round(s.allocation_m3),
          Math.round(s.lpcd || 0),
        ]);
      });
    });

    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `WASAC-Water-Distribution-Plan-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Load a historical plan into detail modal
  async function handleViewHistoryPlan(id) {
    try {
      const fullPlan = await getDistributionPlan(id);
      setSelectedHistoryPlan(fullPlan);
    } catch (err) {
      alert("Error loading plan details: " + err.message);
    }
  }

  function tierLabel(tier) {
    if (tier >= 1.5) return { text: "T1 Critical", cls: "dist-tier-1" };
    if (tier >= 1.3) return { text: "T2 Urban", cls: "dist-tier-2" };
    if (tier >= 1.0) return { text: "T3 Moderate", cls: "dist-tier-3" };
    return { text: "T4 Abundant", cls: "dist-tier-4" };
  }

  // Filter and sort districts
  const filteredDistricts = useMemo(() => {
    if (!data || !data.districts) return [];
    let list = [...data.districts];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((d) => d.district.toLowerCase().includes(q) || d.sectors.some((s) => s.name.toLowerCase().includes(q)));
    }

    // Stress Tier Filter
    if (tierFilter !== "all") {
      list = list.filter((d) => {
        if (tierFilter === "t1") return d.stressTier >= 1.5;
        if (tierFilter === "t2") return d.stressTier >= 1.3 && d.stressTier < 1.5;
        if (tierFilter === "t3") return d.stressTier >= 1.0 && d.stressTier < 1.3;
        if (tierFilter === "t4") return d.stressTier < 1.0;
        return true;
      });
    }

    // Floor Target Filter
    if (floorFilter === "belowFloor") {
      list = list.filter((d) => d.projectedAvailability < (customParams?.targetFloorPct ?? 75));
    } else if (floorFilter === "reachedFloor") {
      list = list.filter((d) => d.projectedAvailability >= (customParams?.targetFloorPct ?? 75));
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "currentAsc") return a.currentAvailability - b.currentAvailability;
      if (sortBy === "currentDesc") return b.currentAvailability - a.currentAvailability;
      if (sortBy === "projectedAsc") return a.projectedAvailability - b.projectedAvailability;
      if (sortBy === "projectedDesc") return b.projectedAvailability - a.projectedAvailability;
      if (sortBy === "volumeDesc") return b.totalAllocation_m3 - a.totalAllocation_m3;
      if (sortBy === "gainDesc") return (b.projectedAvailability - b.currentAvailability) - (a.projectedAvailability - a.currentAvailability);
      if (sortBy === "populationDesc") return b.totalPopulation - a.totalPopulation;
      if (sortBy === "nameAsc") return a.district.localeCompare(b.district);
      return 0;
    });

    return list;
  }, [data, searchQuery, tierFilter, floorFilter, sortBy, customParams]);

  // Paginated Districts
  const totalDistricts = filteredDistricts.length;
  const totalPages = Math.max(1, Math.ceil(totalDistricts / pageSize));
  const paginatedDistricts = useMemo(() => {
    const start = (districtPage - 1) * pageSize;
    return filteredDistricts.slice(start, start + pageSize);
  }, [filteredDistricts, districtPage, pageSize]);

  const startDistrictIndex = totalDistricts === 0 ? 0 : (districtPage - 1) * pageSize + 1;
  const endDistrictIndex = Math.min(districtPage * pageSize, totalDistricts);

  // Paginated History
  const totalHistoryPages = Math.max(1, Math.ceil(historyList.length / historyPageSize));
  const paginatedHistoryList = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return historyList.slice(start, start + historyPageSize);
  }, [historyList, historyPage, historyPageSize]);

  // Chart data preparation for Recharts
  const PROVINCE_BY_DISTRICT = useMemo(() => ({
    Gasabo: "Kigali City", Kicukiro: "Kigali City", Nyarugenge: "Kigali City",
    Burera: "Northern", Gakenke: "Northern", Gicumbi: "Northern", Musanze: "Northern", Rulindo: "Northern",
    Gisagara: "Southern", Huye: "Southern", Kamonyi: "Southern", Muhanga: "Southern",
    Nyamagabe: "Southern", Nyanza: "Southern", Nyaruguru: "Southern", Ruhango: "Southern",
    Bugesera: "Eastern", Gatsibo: "Eastern", Kayonza: "Eastern", Kirehe: "Eastern",
    Ngoma: "Eastern", Nyagatare: "Eastern", Rwamagana: "Eastern",
    Karongi: "Western", Ngororero: "Western", Nyabihu: "Western", Nyamasheke: "Western",
    Rubavu: "Western", Rusizi: "Western", Rutsiro: "Western",
  }), []);

  const PROVINCE_ORDER = ["Kigali City", "Northern", "Southern", "Eastern", "Western"];
  const PROVINCE_COLORS = {
    "Kigali City": "#5b8def",
    Northern: "#7fb56e",
    Southern: "#d9a441",
    Eastern: "#c46b6b",
    Western: "#8f7fc9",
  };

  const chartData = useMemo(() => {
    if (!data || !data.districts) return [];
    return [...data.districts]
      .filter((d) => (PROVINCE_BY_DISTRICT[d.district] ?? "Other") === selectedProvince)
      .sort((a, b) => a.currentAvailability - b.currentAvailability)
      .map((d) => ({
        name: d.district,
        province: PROVINCE_BY_DISTRICT[d.district] ?? "Other",
        Current: Math.round(d.currentAvailability),
        Projected: Math.round(d.projectedAvailability),
        Volume: Math.round(d.totalAllocation_m3),
      }));
  }, [data, PROVINCE_BY_DISTRICT, selectedProvince]);

  const provincesWithData = useMemo(() => {
    if (!data || !data.districts) return [];
    const present = new Set(data.districts.map((d) => PROVINCE_BY_DISTRICT[d.district] ?? "Other"));
    return PROVINCE_ORDER.filter((p) => present.has(p));
  }, [data, PROVINCE_BY_DISTRICT]);

  if (!config || !data) {
    return (
      <div className="workspace-page">
        <header className="workspace-header">
          <p className="eyebrow">WASAC · Equity Optimization</p>
          <h1>Distribution Engine</h1>
          <p className="hero-sub">Initializing national water distribution model…</p>
        </header>
        <p className="empty-state">Loading simulation engine and district network…</p>
      </div>
    );
  }

  const { summary } = data;
  const floorThreshold = customParams?.targetFloorPct ?? 75;
  const ceilingThreshold = customParams?.targetCeilingPct ?? 85;

  return (
    <main className="workspace-page dist-page">
      {/* Top Banner & Navigation Header */}
      <header className="workspace-header dist-header">
        <div className="dist-header-title">
          <p className="eyebrow">WASAC · Equity Optimization</p>
          <h1>Distribution Engine</h1>
          <p className="hero-sub">
            Model and dispatch Rwanda’s daily water supply across all 30 districts using the dynamic 30/70 equity formula with stress tier weighting and variance compression.
          </p>
        </div>

        <div className="dist-header-actions">
          <button className="btn-secondary dist-export-btn" onClick={handleExportCsv} title="Export distribution spreadsheet">
            <IconDownload size={15} />
            <span>Export CSV</span>
          </button>
          <button
            className="btn-primary dist-publish-main-btn"
            onClick={() => {
              setPlanTitle(`Daily Plan · ${new Date().toLocaleDateString("en-RW", { month: "short", day: "numeric", year: "numeric" })}`);
              setShowPublishModal(true);
            }}
          >
            <IconPublish size={15} />
            <span>Publish Plan</span>
          </button>
        </div>
      </header>

      {/* Success Notification */}
      {publishSuccessMsg && (
        <div className="dist-toast-banner">
          <IconCheckCircle size={18} className="dist-toast-icon" />
          <span>{publishSuccessMsg}</span>
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="dist-nav-tabs">
        <button
          className={`dist-tab-btn ${activeTab === "simulator" ? "dist-tab-active" : ""}`}
          onClick={() => setActiveTab("simulator")}
        >
          <span className="dist-tab-icon"><IconSliders size={16} /></span>
          <span>Interactive Simulator</span>
        </button>
        <button
          className={`dist-tab-btn ${activeTab === "history" ? "dist-tab-active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <span className="dist-tab-icon"><IconHistory size={16} /></span>
          <span>Published Plans & History</span>
          {historyList.length > 0 && <span className="dist-tab-badge">{historyList.length}</span>}
        </button>
      </div>

      {activeTab === "simulator" ? (
        <>
          {/* Executive KPI Metric Cards */}
          <section className="dist-summary" aria-label="Distribution Key Metrics">
            <div className="panel dist-card dist-card-primary">
              <span className="dist-card-label">Daily Supply Input</span>
              <div className="dist-card-main">
                <span className="dist-card-value">{formatNumber(supply)}</span>
                <span className="dist-card-unit">m³/day</span>
              </div>
              <span className="dist-card-sub">
                Effective after {Math.round((summary.nonRevenueLossPct ?? 0.3) * 100)}% loss: <strong>{formatNumber(Math.round(summary.effectiveSupply_m3 ?? 0))} m³</strong>
              </span>
            </div>

            <div className="panel dist-card">
              <span className="dist-card-label">Base / Need Split</span>
              <div className="dist-card-main dist-split-main">
                <span className="dist-split-figure">
                  <strong>{formatNumber(Math.round(summary.basePool_m3 ?? 0))} m³</strong>
                  <small>Base ({Math.round((config?.basePoolPct ?? 0.3) * 100)}%)</small>
                </span>
                <span className="dist-split-figure">
                  <strong>{formatNumber(Math.round(summary.needPool_m3 ?? 0))} m³</strong>
                  <small>Need ({Math.round((config?.needPoolPct ?? 0.7) * 100)}%)</small>
                </span>
              </div>
              <div className="dist-split-bar">
                <div
                  className="dist-split-bar-base"
                  style={{ width: `${Math.round((config?.basePoolPct ?? 0.3) * 100)}%` }}
                />
                <div
                  className="dist-split-bar-need"
                  style={{ width: `${Math.round((config?.needPoolPct ?? 0.7) * 100)}%` }}
                />
              </div>
              <span className="dist-card-sub">Equal share per district, then stress-weighted by need</span>
            </div>

            <div className="panel dist-card">
              <span className="dist-card-label">National Population</span>
              <div className="dist-card-main">
                <span className="dist-card-value">{formatNumber(summary.totalPopulation)}</span>
                <span className="dist-card-unit">residents</span>
              </div>
              <span className="dist-card-sub">Across 30 districts & 150+ sectors</span>
            </div>

            <div className="panel dist-card">
              <span className="dist-card-label">Equity Index</span>
              <div className="dist-card-main">
                <span className={`dist-card-value ${summary.equityIndex >= 0.85 ? "dist-green" : "dist-orange"}`}>
                  {(summary.equityIndex * 100).toFixed(1)}%
                </span>
              </div>
              <div className="dist-mini-bar">
                <div
                  className="dist-mini-bar-fill"
                  style={{
                    width: `${Math.min(100, summary.equityIndex * 100)}%`,
                    background: summary.equityIndex >= 0.85 ? "var(--c-good)" : "#d9a441",
                  }}
                />
              </div>
              <span className="dist-card-sub">
                {summary.equityIndex >= 0.85 ? "Optimal Fairness" : "Moderate Variance"}
              </span>
            </div>

            <div className="panel dist-card">
              <span className="dist-card-label">Floor Target Compliance</span>
              <div className="dist-card-main">
                <span className="dist-card-value">
                  <span className="dist-red">{summary.districtsBeforeFloor}</span>
                  <span className="dist-arrow"> → </span>
                  <span className={summary.districtsAfterFloor === 0 ? "dist-green" : "dist-orange"}>
                    {summary.districtsAfterFloor}
                  </span>
                </span>
                <span className="dist-card-unit">below {floorThreshold}%</span>
              </div>
              <span className="dist-card-sub">
                {summary.floorGuaranteed === false
                  ? `Not guaranteed — lowest is ${Math.round(summary.minProjectedAvailability ?? 0)}%`
                  : `${summary.districtsBeforeFloor - summary.districtsAfterFloor} districts lifted to standard`}
              </span>
            </div>

            <div className="panel dist-card">
              <span className="dist-card-label">National Avg Availability</span>
              <div className="dist-card-main">
                <span className="dist-card-value">
                  <span style={{ color: colorForAvailability(summary.avgAvailabilityBefore) }}>
                    {Math.round(summary.avgAvailabilityBefore)}%
                  </span>
                  <span className="dist-arrow"> → </span>
                  <span style={{ color: colorForAvailability(summary.avgAvailabilityAfter) }}>
                    {Math.round(summary.avgAvailabilityAfter)}%
                  </span>
                </span>
              </div>
              <span className="dist-card-sub dist-green dist-lift-sub">
                <IconTrendingUp size={13} />
                <span>+{Math.round(summary.avgAvailabilityAfter - summary.avgAvailabilityBefore)}% national boost</span>
              </span>
            </div>

            <div className="panel dist-card">
              <span className="dist-card-label">Network Capacity Limits</span>
              <div className="dist-card-main">
                <span className={`dist-card-value ${(summary.capacityConstrainedDistricts ?? 0) > 0 ? "dist-orange" : "dist-green"}`}>
                  {summary.capacityConstrainedDistricts ?? 0}
                </span>
                <span className="dist-card-unit">districts capped</span>
              </div>
              <span className="dist-card-sub">
                {(summary.unusedSurplus_m3 ?? 0) > 1
                  ? `${formatNumber(Math.round(summary.unusedSurplus_m3))} m³ couldn't be delivered anywhere`
                  : "All available supply was delivered"}
              </span>
            </div>
          </section>

          {/* Scenario Presets & Live Supply Controller */}
          <section className="panel dist-control-section">
            <div className="dist-control-head">
              <div>
                <h2 className="dist-section-title">Water Availability Simulation</h2>
                <p className="dist-section-sub">
                  Select an operational scenario or drag the slider to simulate varying water yield conditions.
                </p>
              </div>
              <button
                type="button"
                className={`btn-secondary dist-tune-toggle ${showParamTuner ? "active" : ""}`}
                onClick={() => setShowParamTuner((v) => !v)}
              >
                <IconSliders size={14} />
                <span>{showParamTuner ? "Hide Formula Parameters" : "Tune Formula Parameters"}</span>
              </button>
            </div>

            {/* Scenario Preset Chips */}
            <div className="dist-preset-grid">
              {SCENARIOS.map((sc) => {
                const isSelected = supply === sc.supply;
                return (
                  <button
                    key={sc.label}
                    type="button"
                    className={`dist-preset-card ${sc.cls} ${isSelected ? "selected" : ""}`}
                    onClick={() => applyScenario(sc)}
                  >
                    <div className="dist-preset-tag">{sc.tag}</div>
                    <strong className="dist-preset-name">{sc.label}</strong>
                    <span className="dist-preset-val">{formatNumber(sc.supply)} m³/day</span>
                    <small className="dist-preset-desc">{sc.desc}</small>
                  </button>
                );
              })}
            </div>

            {/* Slider & Exact Value Controller */}
            <div className="dist-slider-container">
              <div className="dist-slider-header">
                <label htmlFor="supply-slider" className="dist-slider-label">
                  Total Daily Grid Supply (m³/day)
                </label>
                <div className="dist-slider-input-wrap">
                  <input
                    id="supply-input"
                    type="number"
                    min={40000}
                    max={400000}
                    step={1000}
                    className="dist-number-input"
                    value={supply}
                    onChange={(e) => setSupply(Math.max(10000, Number(e.target.value)))}
                  />
                  <span className="dist-number-suffix">m³/day</span>
                </div>
              </div>

              <input
                id="supply-slider"
                type="range"
                className="dist-slider"
                min={40000}
                max={400000}
                step={1000}
                value={supply}
                onChange={(e) => setSupply(Number(e.target.value))}
              />

              <div className="dist-slider-scale">
                <span>40k m³ (Severe Drought)</span>
                <span>150k m³ (Dry Baseline)</span>
                <span>220k m³ (Normal)</span>
                <span>400k m³ (Maximum Capacity)</span>
              </div>
            </div>

            {/* Formula Parameter Tuner Drawer */}
            {showParamTuner && customParams && (
              <div className="dist-tuner-panel">
                <div className="dist-tuner-header">
                  <div>
                    <h3>Distribution Formula Parameters</h3>
                    <p>Adjust weights, thresholds, and consumption targets for the simulation.</p>
                  </div>
                  <button type="button" className="btn-ghost dist-btn-with-icon" onClick={handleResetParams}>
                    <IconRotateCcw size={14} />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                <div className="dist-tuner-grid">
                  <label className="field">
                    <span>Base Pool Share (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={customParams.basePoolPct}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value)));
                        setCustomParams((p) => ({
                          ...p,
                          basePoolPct: val,
                          needPoolPct: 100 - val,
                        }));
                      }}
                    />
                    <small>Equal baseline split per district ({customParams.basePoolPct}%)</small>
                  </label>

                  <label className="field">
                    <span>Need-Based Pool Share (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={customParams.needPoolPct}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value)));
                        setCustomParams((p) => ({
                          ...p,
                          needPoolPct: val,
                          basePoolPct: 100 - val,
                        }));
                      }}
                    />
                    <small>Deficit & stress-weighted split ({customParams.needPoolPct}%)</small>
                  </label>

                  <label className="field">
                    <span>Target Floor (%)</span>
                    <input
                      type="number"
                      min={40}
                      max={90}
                      value={customParams.targetFloorPct}
                      onChange={(e) =>
                        setCustomParams((p) => ({
                          ...p,
                          targetFloorPct: Number(e.target.value),
                        }))
                      }
                    />
                    <small>Minimum acceptable availability goal</small>
                  </label>

                  <label className="field">
                    <span>Target Ceiling (%)</span>
                    <input
                      type="number"
                      min={60}
                      max={100}
                      value={customParams.targetCeilingPct}
                      onChange={(e) =>
                        setCustomParams((p) => ({
                          ...p,
                          targetCeilingPct: Number(e.target.value),
                        }))
                      }
                    />
                    <small>Surplus cap threshold for redistribution</small>
                  </label>

                  <label className="field">
                    <span>Max Sector Spread (%)</span>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={customParams.maxSectorSpreadPct}
                      onChange={(e) =>
                        setCustomParams((p) => ({
                          ...p,
                          maxSectorSpreadPct: Number(e.target.value),
                        }))
                      }
                    />
                    <small>Max allowed availability variance inside district</small>
                  </label>

                  <label className="field">
                    <span>Urban Demand (LPCD)</span>
                    <input
                      type="number"
                      min={30}
                      max={150}
                      value={customParams.perCapitaUrban_lpcd}
                      onChange={(e) =>
                        setCustomParams((p) => ({
                          ...p,
                          perCapitaUrban_lpcd: Number(e.target.value),
                        }))
                      }
                    />
                    <small>Litres per person/day for urban districts</small>
                  </label>
                </div>
              </div>
            )}
          </section>

          {/* Visual Analytics Chart: Current vs Projected Availability */}
          <section className="panel dist-chart-section">
            <div className="dist-chart-header">
              <div>
                <h2 className="dist-section-title">Availability Impact by District</h2>
                <p className="dist-section-sub">
                  Current vs Projected Availability after equity allocation. Select a province to inspect its districts.
                </p>
              </div>
              <div className="dist-chart-legend-custom">
                <span className="dist-legend-item">
                  <span className="dist-legend-color cur" /> Current Availability
                </span>
                <span className="dist-legend-item">
                  <span className="dist-legend-color proj" /> Projected Availability
                </span>
                <span className="dist-legend-item">
                  <span className="dist-legend-color floor" /> 75% Floor Target
                </span>
              </div>
            </div>

            <div className="dist-province-tabs" role="tablist" aria-label="Filter chart by province">
              {provincesWithData.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={selectedProvince === p}
                  className={`dist-province-tab${selectedProvince === p ? " dist-province-tab-active" : ""}`}
                  style={selectedProvince === p ? { borderColor: PROVINCE_COLORS[p], color: PROVINCE_COLORS[p] } : undefined}
                  onClick={() => setSelectedProvince(p)}
                >
                  <span className="dist-province-dot" style={{ background: PROVINCE_COLORS[p] }} />
                  {p}
                  <small>
                    ({data && data.districts ? data.districts.filter((d) => (PROVINCE_BY_DISTRICT[d.district] ?? "Other") === p).length : 0})
                  </small>
                </button>
              ))}
            </div>

            <div className="dist-recharts-wrap">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 18, right: 64, left: -4, bottom: 40 }}>
                  <CartesianGrid stroke="var(--c-line)" vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--c-ink-soft)" }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "var(--c-ink-soft)" }}
                    unit="%"
                    width={48}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--c-line)", opacity: 0.3 }}
                    contentStyle={{
                      background: "var(--c-surface)",
                      color: "var(--c-ink)",
                      border: "1px solid var(--c-line)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                      fontFamily: "var(--font-body)",
                    }}
                    formatter={(val, name) => [`${val}%`, name]}
                    labelFormatter={(label) => `${label} · ${selectedProvince}`}
                  />
                  <ReferenceLine
                    y={floorThreshold}
                    stroke="var(--c-bad)"
                    strokeDasharray="4 4"
                    label={{ value: `Floor (${floorThreshold}%)`, fill: "var(--c-bad)", fontSize: 11, position: "right" }}
                  />
                  <ReferenceLine
                    y={ceilingThreshold}
                    stroke="var(--c-good)"
                    strokeDasharray="4 4"
                    label={{ value: `Ceiling (${ceilingThreshold}%)`, fill: "var(--c-good)", fontSize: 11, position: "right" }}
                  />
                  <Bar dataKey="Current" fill="#b5451f" opacity={0.65} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Projected" fill="var(--c-good)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* District Table & Detailed Sector Breakdown */}
          <section className="panel dist-table-section">
            <div className="dist-table-header">
              <div>
                <h2 className="dist-section-title">District Allocation & Sector Drill-down</h2>
                <p className="dist-section-sub">
                  Showing {filteredDistricts.length} matching districts (Page {districtPage} of {totalPages}). Click any row to view individual sector quotas.
                </p>
              </div>

              {/* Table Controls */}
              <div className="dist-table-controls">
                <label className="dist-filter-field">
                  <span>Search</span>
                  <input
                    type="text"
                    placeholder="Search district or sector…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>

                <label className="dist-filter-field">
                  <span>Stress Tier</span>
                  <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                    <option value="all">All Tiers</option>
                    <option value="t1">T1 Critical (1.5x)</option>
                    <option value="t2">T2 Urban (1.3x)</option>
                    <option value="t3">T3 Moderate (1.0x)</option>
                    <option value="t4">T4 Abundant (0.7x)</option>
                  </select>
                </label>

                <label className="dist-filter-field">
                  <span>Compliance</span>
                  <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="belowFloor">Below Floor (&lt;{floorThreshold}%)</option>
                    <option value="reachedFloor">Floor Reached (&gt;={floorThreshold}%)</option>
                  </select>
                </label>

                <label className="dist-filter-field">
                  <span>Sort By</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="currentAsc">Current Scarcity (Lowest first)</option>
                    <option value="gainDesc">Highest Net Lift (+▲%)</option>
                    <option value="volumeDesc">Allocated Volume (Highest first)</option>
                    <option value="projectedAsc">Projected Availability (Lowest)</option>
                    <option value="populationDesc">Population (Highest)</option>
                    <option value="nameAsc">District Name (A–Z)</option>
                  </select>
                </label>
              </div>
            </div>

            {loading && (
              <div className="dist-loading-indicator">
                <IconLoader size={14} />
                <span>Recalculating allocations…</span>
              </div>
            )}

            <div className="table-wrap dist-table-wrap">
              <table className="history-table dist-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Population</th>
                    <th>Tier</th>
                    <th>Current Avail.</th>
                    <th>Projected</th>
                    <th>Net Change</th>
                    <th>Allocated Volume</th>
                    <th>Per Capita</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDistricts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-state">
                        No districts match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedDistricts.map((d) => {
                      const tier = tierLabel(d.stressTier);
                      const change = Math.round(d.projectedAvailability - d.currentAvailability);
                      const isExpanded = expandedDistrict === d.district;
                      const meetsFloor = d.projectedAvailability >= floorThreshold;

                      return [
                        <tr
                          key={d.district}
                          className={`dist-row ${isExpanded ? "dist-row-expanded" : ""}`}
                          onClick={() => setExpandedDistrict(isExpanded ? null : d.district)}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                        >
                          <td className="dist-district-name">
                            <span className="dist-expand-icon">
                              {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                            </span>
                            <strong>{d.district}</strong>
                            <small className="dist-sector-count">({d.sectors.length} sectors)</small>
                            {d.capacityConstrained && (
                              <span className="dist-capacity-badge" title="This district's allocation is capped by its real network/production capacity, not by the equity formula">
                                <IconAlertTriangle size={11} /> Capacity-capped
                              </span>
                            )}
                          </td>
                          <td>{formatNumber(d.totalPopulation)}</td>
                          <td>
                            <span className={`dist-tier-badge ${tier.cls}`}>{tier.text}</span>
                          </td>
                          <td>
                            <span
                              className="dist-avail-pill"
                              style={{ color: colorForAvailability(d.currentAvailability) }}
                            >
                              {Math.round(d.currentAvailability)}%
                            </span>
                          </td>
                          <td>
                            <strong
                              className="dist-avail-pill proj"
                              style={{ color: colorForAvailability(d.projectedAvailability) }}
                            >
                              {Math.round(d.projectedAvailability)}%
                            </strong>
                          </td>
                          <td className="dist-change-cell">
                            <span className={change > 0 ? "dist-green dist-badge-lift" : "dist-neutral"}>
                              {change > 0 ? (
                                <>
                                  <IconTrendingUp size={12} className="dist-inline-icon" /> +{change}%
                                </>
                              ) : (
                                `${change}%`
                              )}
                            </span>
                          </td>
                          <td className="mono font-semibold">
                            {formatNumber(Math.round(d.totalAllocation_m3))} m³
                          </td>
                          <td className="mono">{Math.round(d.lpcd)} L/day</td>
                          <td>
                            <span className={`dist-status-pill ${meetsFloor ? "compliant" : "sub-floor"}`}>
                              {meetsFloor ? (
                                <>
                                  <IconCheck size={12} /> &ge; {floorThreshold}%
                                </>
                              ) : (
                                <>
                                  <IconAlertTriangle size={12} /> &lt; {floorThreshold}%
                                </>
                              )}
                            </span>
                          </td>
                        </tr>,

                        // Expanded Sector Breakdown
                        isExpanded && (
                          <tr key={`${d.district}-sectors-drilldown`} className="dist-sector-row">
                            <td colSpan={9}>
                              <div className="dist-sector-detail">
                                <div className="dist-sector-header">
                                  <div>
                                    <strong>{d.district} Sector Level Allocations</strong>
                                    <span className="dist-sector-meta">
                                      Demand: {formatNumber(Math.round(d.demand_m3))} m³/day · Baseline Pool: {formatNumber(Math.round(d.baseAllocation_m3))} m³ · Need Pool: {formatNumber(Math.round(d.needAllocation_m3))} m³
                                    </span>
                                  </div>
                                  {(() => {
                                    const avails = d.sectors.map((s) => s.projectedAvailability);
                                    const spread = Math.round(Math.max(...avails) - Math.min(...avails));
                                    const isSpreadOk = spread <= (customParams?.maxSectorSpreadPct ?? 25);
                                    return (
                                      <span
                                        className={`dist-spread-badge ${
                                          isSpreadOk ? "dist-spread-ok" : "dist-spread-warn"
                                        }`}
                                      >
                                        {isSpreadOk ? <IconCheck size={12} /> : <IconAlertTriangle size={12} />}
                                        <span>Intra-District Spread: {spread}% ({isSpreadOk ? "Compliant" : "High Spread"})</span>
                                      </span>
                                    );
                                  })()}
                                </div>

                                <div className="table-wrap">
                                  <table className="history-table dist-sector-table">
                                    <thead>
                                      <tr>
                                        <th>Sector</th>
                                        <th>Population</th>
                                        <th>Current Availability</th>
                                        <th>Projected Availability</th>
                                        <th>Net Lift</th>
                                        <th>Sector Quota</th>
                                        <th>Daily Per Capita</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {d.sectors.map((s) => {
                                        const sChange = Math.round(s.projectedAvailability - s.currentAvailability);
                                        return (
                                          <tr key={s.id}>
                                            <td>
                                              <strong>{s.name}</strong>
                                            </td>
                                            <td>{formatNumber(s.population)}</td>
                                            <td>
                                              <span
                                                className="dist-avail-pill"
                                                style={{ color: colorForAvailability(s.currentAvailability) }}
                                              >
                                                {Math.round(s.currentAvailability)}%
                                              </span>
                                            </td>
                                            <td>
                                              <strong
                                                className="dist-avail-pill proj"
                                                style={{ color: colorForAvailability(s.projectedAvailability) }}
                                              >
                                                {Math.round(s.projectedAvailability)}%
                                              </strong>
                                            </td>
                                            <td>
                                              <span className={sChange > 0 ? "dist-green" : ""}>
                                                {sChange > 0 ? `+${sChange}%` : `${sChange}%`}
                                              </span>
                                            </td>
                                            <td className="mono font-semibold">
                                              {formatNumber(Math.round(s.allocation_m3))} m³
                                            </td>
                                            <td className="mono">{Math.round(s.lpcd || 0)} L/day</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ),
                      ];
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalDistricts > 0 && (
              <div className="dist-pagination-bar">
                <div className="dist-pagination-left">
                  <span className="dist-pagination-info">
                    Showing <strong>{startDistrictIndex}–{endDistrictIndex}</strong> of <strong>{totalDistricts}</strong> districts
                  </span>
                  <label className="dist-page-size-wrap">
                    <span>Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setDistrictPage(1);
                      }}
                      className="dist-page-size-select"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={30}>All (30)</option>
                    </select>
                  </label>
                </div>

                {totalPages > 1 && (
                  <div className="dist-pagination-controls">
                    <button
                      type="button"
                      className="btn-ghost dist-page-nav-btn"
                      onClick={() => setDistrictPage((p) => Math.max(1, p - 1))}
                      disabled={districtPage <= 1}
                      aria-label="Previous page"
                    >
                      <IconChevronLeft size={14} />
                      <span>Prev</span>
                    </button>

                    <div className="dist-page-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`dist-page-num-btn ${districtPage === num ? "active" : ""}`}
                          onClick={() => setDistrictPage(num)}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn-ghost dist-page-nav-btn"
                      onClick={() => setDistrictPage((p) => Math.min(totalPages, p + 1))}
                      disabled={districtPage >= totalPages}
                      aria-label="Next page"
                    >
                      <span>Next</span>
                      <IconChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      ) : (
        /* History & Published Plans Tab */
        <section className="panel dist-history-section">
          <div className="dist-history-head">
            <div>
              <h2 className="dist-section-title">Published Distribution Plans Log</h2>
              <p className="dist-section-sub">
                Historical record of official water allocation directives published by WASAC headquarters.
              </p>
            </div>
            <button className="btn-secondary dist-btn-with-icon" onClick={loadHistory} disabled={historyLoading}>
              <IconRefresh size={14} className={historyLoading ? "icon-spin" : ""} />
              <span>{historyLoading ? "Refreshing…" : "Refresh History"}</span>
            </button>
          </div>

          {activePublishedPlan && (
            <div className="dist-active-banner">
              <div className="dist-active-badge">ACTIVE DIRECTIVE</div>
              <div className="dist-active-info">
                <h3>{activePublishedPlan.title || "Active National Plan"}</h3>
                <p>
                  Published on <strong>{new Date(activePublishedPlan.publishedAt).toLocaleString()}</strong> by <strong>{activePublishedPlan.publishedBy}</strong>
                </p>
                {activePublishedPlan.notes && <p className="dist-active-notes">“{activePublishedPlan.notes}”</p>}
              </div>
              <div className="dist-active-stats">
                <div>
                  <span>Daily Volume</span>
                  <strong>{formatNumber(activePublishedPlan.summary.totalSupply_m3)} m³</strong>
                </div>
                <div>
                  <span>Equity Index</span>
                  <strong className="dist-green">{(activePublishedPlan.summary.equityIndex * 100).toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          )}

          {historyLoading ? (
            <p className="empty-state">Loading published plans history…</p>
          ) : historyList.length === 0 ? (
            <p className="empty-state">No published plans recorded yet. Publish your first plan from the simulator.</p>
          ) : (
            <>
              <div className="table-wrap">
                <table className="history-table dist-history-table">
                  <thead>
                    <tr>
                      <th>Plan Title</th>
                      <th>Published At</th>
                      <th>Author</th>
                      <th>Supply Volume</th>
                      <th>Equity Index</th>
                      <th>Avg Availability</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHistoryList.map((plan, idx) => {
                      const isLatest = historyPage === 1 && idx === 0;
                      return (
                        <tr key={plan.id}>
                          <td>
                            <strong>{plan.title}</strong>
                            {isLatest && <span className="dist-latest-badge">Current</span>}
                            {plan.notes && <small className="dist-plan-note-preview">{plan.notes}</small>}
                          </td>
                          <td>{new Date(plan.publishedAt).toLocaleString()}</td>
                          <td>{plan.publishedBy}</td>
                          <td className="mono">{formatNumber(plan.summary.totalSupply_m3)} m³</td>
                          <td>
                            <span
                              className={plan.summary.equityIndex >= 0.85 ? "dist-green font-semibold" : "dist-orange font-semibold"}
                            >
                              {(plan.summary.equityIndex * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td>
                            <span style={{ color: colorForAvailability(plan.summary.avgAvailabilityAfter) }}>
                              {Math.round(plan.summary.avgAvailabilityAfter)}%
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-ghost btn-sm"
                              onClick={() => handleViewHistoryPlan(plan.id)}
                            >
                              View Breakdown
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {historyList.length > 0 && totalHistoryPages > 1 && (
                <div className="dist-pagination-bar">
                  <span className="dist-pagination-info">
                    Showing <strong>{(historyPage - 1) * historyPageSize + 1}–{Math.min(historyPage * historyPageSize, historyList.length)}</strong> of <strong>{historyList.length}</strong> published plans
                  </span>
                  <div className="dist-pagination-controls">
                    <button
                      type="button"
                      className="btn-ghost dist-page-nav-btn"
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage <= 1}
                    >
                      <IconChevronLeft size={14} />
                      <span>Prev</span>
                    </button>
                    <div className="dist-page-numbers">
                      {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`dist-page-num-btn ${historyPage === num ? "active" : ""}`}
                          onClick={() => setHistoryPage(num)}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn-ghost dist-page-nav-btn"
                      onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                      disabled={historyPage >= totalHistoryPages}
                    >
                      <span>Next</span>
                      <IconChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Publish Plan Modal */}
      {showPublishModal && (
        <div className="modal-backdrop" onClick={() => !publishing && setShowPublishModal(false)}>
          <div className="modal-card dist-publish-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Publish National Allocation Plan</h2>
                <p className="hero-sub">Commit this water allocation plan as the official active directive for all sectors.</p>
              </div>
              <button className="btn-ghost dist-modal-close" onClick={() => !publishing && setShowPublishModal(false)} aria-label="Close modal">
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPublish} className="dist-publish-form">
              <div className="dist-publish-summary-card">
                <div>
                  <span>Daily Grid Supply</span>
                  <strong>{formatNumber(supply)} m³/day</strong>
                </div>
                <div>
                  <span>Projected National Avg</span>
                  <strong style={{ color: colorForAvailability(summary.avgAvailabilityAfter) }}>
                    {Math.round(summary.avgAvailabilityAfter)}%
                  </strong>
                </div>
                <div>
                  <span>Equity Index</span>
                  <strong className="dist-green">{(summary.equityIndex * 100).toFixed(1)}%</strong>
                </div>
                <div>
                  <span>Districts &lt; 75%</span>
                  <strong>{summary.districtsAfterFloor}</strong>
                </div>
              </div>

              <label className="field">
                <span>Plan Title *</span>
                <input
                  type="text"
                  required
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="e.g. Daily Dispatch Plan - 160k m³"
                />
              </label>

              <label className="field">
                <span>Operational Directives & Notes</span>
                <textarea
                  rows={3}
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  placeholder="e.g. Dry season rationing active in Bugesera and Kayonza. Peak morning delivery prioritised."
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowPublishModal(false)}
                  disabled={publishing}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={publishing}>
                  {publishing ? "Publishing Plan…" : "Confirm & Publish Directive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historical Plan Detail Modal */}
      {selectedHistoryPlan && (
        <div className="modal-backdrop" onClick={() => setSelectedHistoryPlan(null)}>
          <div className="modal-card dist-plan-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedHistoryPlan.title}</h2>
                <p className="hero-sub">
                  Published on {new Date(selectedHistoryPlan.publishedAt).toLocaleString()} by {selectedHistoryPlan.publishedBy}
                </p>
              </div>
              <button className="btn-ghost dist-modal-close" onClick={() => setSelectedHistoryPlan(null)} aria-label="Close modal">
                <IconX size={18} />
              </button>
            </div>

            {selectedHistoryPlan.notes && (
              <p className="dist-modal-notes">“{selectedHistoryPlan.notes}”</p>
            )}

            <div className="dist-summary dist-summary-modal">
              <div className="panel dist-card">
                <span className="dist-card-label">Supply Volume</span>
                <span className="dist-card-value">{formatNumber(selectedHistoryPlan.summary.totalSupply_m3)} m³</span>
              </div>
              <div className="panel dist-card">
                <span className="dist-card-label">Equity Index</span>
                <span className="dist-card-value dist-green">{(selectedHistoryPlan.summary.equityIndex * 100).toFixed(1)}%</span>
              </div>
              <div className="panel dist-card">
                <span className="dist-card-label">Projected Avg</span>
                <span className="dist-card-value">{Math.round(selectedHistoryPlan.summary.avgAvailabilityAfter)}%</span>
              </div>
            </div>

            <div className="table-wrap dist-modal-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Population</th>
                    <th>Current Avail.</th>
                    <th>Projected</th>
                    <th>Allocated Volume</th>
                    <th>LPCD</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHistoryPlan.districts.map((d) => (
                    <tr key={d.district}>
                      <td><strong>{d.district}</strong></td>
                      <td>{formatNumber(d.totalPopulation)}</td>
                      <td style={{ color: colorForAvailability(d.currentAvailability) }}>{Math.round(d.currentAvailability)}%</td>
                      <td style={{ color: colorForAvailability(d.projectedAvailability) }}><strong>{Math.round(d.projectedAvailability)}%</strong></td>
                      <td className="mono">{formatNumber(Math.round(d.totalAllocation_m3))} m³</td>
                      <td className="mono">{Math.round(d.lpcd)} L/day</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={() => setSelectedHistoryPlan(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
