import { useState } from "react";
import { addSector } from "../api";

export default function AddSectorForm({ onAdded, onCancel }) {
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [population, setPopulation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await addSector({ name, district, population: Number(population) });
      setName("");
      setDistrict("");
      setPopulation("");
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="add-sector-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Sector name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kigoma" required />
      </label>
      <label className="field">
        <span>District</span>
        <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Nyanza" required />
      </label>
      <label className="field">
        <span>Population</span>
        <input
          type="number"
          min="0"
          value={population}
          onChange={(e) => setPopulation(e.target.value)}
          placeholder="e.g. 32000"
          required
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Adding…" : "Add sector"}
        </button>
      </div>
    </form>
  );
}
