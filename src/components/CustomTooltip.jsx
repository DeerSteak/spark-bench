import { fmt } from "../utils";

export default function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#ffffff", border: "1px solid #d0d7de", borderRadius: 6, padding: "10px 14px", fontSize: 18 }}>
      <div style={{ color: "#57606a", marginBottom: 6, fontFamily: "monospace" }}>depth: {label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.dataKey}: <strong>{fmt(p.value, unit)}</strong>
        </div>
      ))}
    </div>
  );
}
