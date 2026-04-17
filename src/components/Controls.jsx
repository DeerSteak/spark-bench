import { ALL_OPS, OP_LABELS, DEPTHS_LABEL } from "../constants";
import styles from "./Controls.module.css";

export default function Controls({
  selectedOp, setSelectedOp,
  tpsMode, setTpsMode,
  allDepths, enabledDepths, onToggleDepth,
  chartWidth, setChartWidth,
  logoSrc, setLogoSrc,
  logoDragOver, onLogoDrop, onLogoDragOver, onLogoDragLeave,
  saving, onSaveChart,
}) {
  return (
    <div className="card" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <div>
        <div className={styles.controlLabel}>Operation</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ALL_OPS.map(op => (
            <button key={op} className={`pill ${selectedOp === op ? "active" : "inactive"}`} onClick={() => setSelectedOp(op)}>
              {OP_LABELS[op]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.dividerGroup}>
        <div className={styles.controlLabel}>TPS view</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["aggregate", "Aggregate"], ["per_req", "Per Request"]].map(([v, l]) => (
            <button key={v} className={`pill ${tpsMode === v ? "active" : "inactive"}`} onClick={() => setTpsMode(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className={styles.dividerGroup}>
        <div className={styles.controlLabel}>Context Depth</div>
        <div className={styles.depthFilters}>
          {allDepths.map(d => (
            <label key={d} className={`${styles.depthCheck} ${enabledDepths.has(d) ? styles.enabled : styles.disabled}`}>
              <input
                type="checkbox"
                checked={enabledDepths.has(d)}
                onChange={() => onToggleDepth(d)}
              />
              {DEPTHS_LABEL[d] ?? d}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.endGroup}>
        <div>
          <div className={styles.controlLabel}>Chart Width</div>
          <div className={styles.widthRow}>
            <input
              type="number"
              value={chartWidth}
              min={400}
              max={2000}
              onChange={e => setChartWidth(Math.max(400, parseInt(e.target.value) || 708))}
              className={styles.widthInput}
            />
            <span className={styles.widthUnit}>px</span>
          </div>
        </div>

        <div>
          <div className={styles.controlLabel}>Logo</div>
          <div
            onDrop={onLogoDrop}
            onDragOver={onLogoDragOver}
            onDragLeave={onLogoDragLeave}
            className={`${styles.logoDropZone} ${logoDragOver ? styles.over : ""}`}
          >
            {logoSrc
              ? <div className={styles.logoPreview}>
                  <img src={logoSrc} className={styles.logoThumb} />
                  <button onClick={() => setLogoSrc(null)} className={styles.logoClearBtn}>✕</button>
                </div>
              : <span className={styles.logoPlaceholder}>↓ logo</span>
            }
          </div>
        </div>

        <div>
          <div className={styles.controlLabel}>Export</div>
          <button
            onClick={onSaveChart}
            disabled={saving}
            className={`pill inactive ${styles.exportBtn}`}
          >
            {saving ? "Saving…" : "⬇ Save PNG"}
          </button>
        </div>
      </div>
    </div>
  );
}
