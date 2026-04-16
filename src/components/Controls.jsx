import { ALL_OPS, OP_LABELS, DEPTHS_LABEL } from "../constants";

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
        <div style={{ fontSize: 14, color: "#8c959f", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Operation</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ALL_OPS.map(op => (
            <button key={op} className={`pill ${selectedOp === op ? "active" : "inactive"}`} onClick={() => setSelectedOp(op)}>
              {OP_LABELS[op]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderLeft: "1px solid #d0d7de", paddingLeft: 24 }}>
        <div style={{ fontSize: 14, color: "#8c959f", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>TPS view</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["aggregate", "Aggregate"], ["per_req", "Per Request"]].map(([v, l]) => (
            <button key={v} className={`pill ${tpsMode === v ? "active" : "inactive"}`} onClick={() => setTpsMode(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ borderLeft: "1px solid #d0d7de", paddingLeft: 24 }}>
        <div style={{ fontSize: 14, color: "#8c959f", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Context Depth</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {allDepths.map(d => (
            <label key={d} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 15, color: enabledDepths.has(d) ? "#1a1f24" : "#8c959f", userSelect: "none" }}>
              <input
                type="checkbox"
                checked={enabledDepths.has(d)}
                onChange={() => onToggleDepth(d)}
                style={{ accentColor: "#0969da", width: 14, height: 14, cursor: "pointer" }}
              />
              {DEPTHS_LABEL[d] ?? d}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14, color: "#8c959f", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Chart Width</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="number"
              value={chartWidth}
              min={400}
              max={2000}
              onChange={e => setChartWidth(Math.max(400, parseInt(e.target.value) || 708))}
              style={{
                width: 72, padding: "4px 8px", fontSize: 15, fontFamily: "'IBM Plex Mono'",
                border: "1px solid #d0d7de", borderRadius: 6, color: "#1a1f24",
                background: "#ffffff", outline: "none"
              }}
            />
            <span style={{ fontSize: 14, color: "#8c959f" }}>px</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 14, color: "#8c959f", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Logo</div>
          <div
            onDrop={onLogoDrop}
            onDragOver={onLogoDragOver}
            onDragLeave={onLogoDragLeave}
            style={{
              border: `1px dashed ${logoDragOver ? "#0969da" : "#d0d7de"}`,
              borderRadius: 6, padding: "4px 10px", textAlign: "center",
              background: logoDragOver ? "#dff0ff" : "#f6f8fa", transition: "all .2s",
              cursor: "pointer", minWidth: 80
            }}
          >
            {logoSrc
              ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <img src={logoSrc} style={{ width: 24, height: 24, objectFit: "contain" }} />
                  <button onClick={() => setLogoSrc(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8c959f", fontSize: 13, padding: 0 }}>✕</button>
                </div>
              : <span style={{ fontSize: 13, color: logoDragOver ? "#0969da" : "#8c959f" }}>↓ logo</span>
            }
          </div>
        </div>

        <div>
          <div style={{ fontSize: 14, color: "#8c959f", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Export</div>
          <button
            onClick={onSaveChart}
            disabled={saving}
            className="pill inactive"
            style={{ fontSize: 15, padding: "6px 16px", display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.5 : 1 }}
          >
            {saving ? "Saving…" : "⬇ Save PNG"}
          </button>
        </div>
      </div>
    </div>
  );
}
