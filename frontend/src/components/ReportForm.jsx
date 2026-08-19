import { useState } from "react";
import { addReport } from "../api";

export default function ReportForm({ sectorId, onSubmitted, onCancel }) {
  const [availability, setAvailability] = useState(50);
  const [reporterType, setReporterType] = useState("official");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await addReport({ sectorId, availabilityPercent: Number(availability), reporterType, note });
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Water availability this period</span>
        <div className="slider-row">
          <input
            type="range"
            min="0"
            max="100"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          />
          <span className="slider-value">{availability}%</span>
        </div>
      </label>

      <label className="field">
        <span>Reported by</span>
        <select value={reporterType} onChange={(e) => setReporterType(e.target.value)}>
          <option value="official">Sector official</option>
          <option value="citizen_check">Citizen spot-check</option>
        </select>
      </label>

      <label className="field">
        <span>Note (optional)</span>
        <input
          type="text"
          placeholder="e.g. rationed to 2 days this week"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save report"}
        </button>
      </div>
    </form>
  );
}
