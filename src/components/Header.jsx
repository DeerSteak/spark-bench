export default function Header({ files, dragOver, onDrop, onDragOver, onDragLeave, onRemoveFile }) {
  return (
    <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div>
        <div style={{ fontSize: 17, color: "#0969da", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Sparkrun · Benchmark Explorer</div>
        <h1 style={{ margin: 0, fontSize: 34, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, color: "#1a1f24" }}>
          Inference Performance
        </h1>
        {files.length > 1 && (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {files.map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="tag" style={{ background: "#dff0ff", color: "#0969da", border: "1px solid #b6d4fb", fontSize: 18, padding: "3px 10px" }}>
                  {f.model}
                </span>
                {f.tp && (
                  <span className="tag" style={{ background: f.tp === 1 ? "#dafbe1" : "#f0ebff", color: f.tp === 1 ? "#3fb950" : "#7c4dff", border: `1px solid ${f.tp === 1 ? "#aceebb" : "#c8b8f8"}`, fontSize: 17, padding: "3px 10px" }}>
                    {f.tpLabel}
                  </span>
                )}
                {f.suite && (
                  <span className="tag" style={{ background: "#f6f8fa", color: "#8c959f", border: "1px solid #d0d7de", fontSize: 14 }}>
                    {f.suite}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            border: `1px dashed ${dragOver ? "#0969da" : "#d0d7de"}`,
            borderRadius: 8, padding: "10px 18px", textAlign: "center",
            background: dragOver ? "#dff0ff" : "transparent", transition: "all .2s", minWidth: 220
          }}
        >
          <div style={{ fontSize: 17, color: dragOver ? "#0969da" : "#57606a" }}>
            {dragOver ? "Drop to add CSV" : "↓ Drop additional CSVs here"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
          {files.map(f => (
            <div key={f.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
              background: "#f6f8fa", border: "1px solid #d0d7de", borderRadius: 6,
              padding: "5px 10px", fontSize: 14, fontFamily: "'IBM Plex Mono'"
            }}>
              <span style={{ color: "#57606a", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.name}>
                {f.name}
              </span>
              <span style={{ color: "#8c959f", flexShrink: 0 }}>{f.rows} rows</span>
              <button
                onClick={() => onRemoveFile(f.id)}
                title="Remove this CSV"
                style={{
                  background: "none", border: "none", cursor: "pointer", color: "#8c959f",
                  fontSize: 19, lineHeight: 1, padding: "0 2px", flexShrink: 0,
                  transition: "color .15s"
                }}
                onMouseEnter={e => e.target.style.color = "#f85149"}
                onMouseLeave={e => e.target.style.color = "#8c959f"}
              >✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
