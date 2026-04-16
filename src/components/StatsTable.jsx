import { C, DEPTHS_LABEL, OP_LABELS } from "../constants";
import { fmt } from "../utils";

const COLS = [
  { label: "Context Depth", key: "depth" },
  { label: "Concurrency",   key: "concurrency" },
  { label: "TPS (agg)",     key: "tps" },
  { label: "TPS (req)",     key: "tps_req" },
  { label: "TTFT",          key: "ttft" },
];

export default function StatsTable({ filteredData, selectedOp, sortConfig, onCycleSort }) {
  const tableOp = selectedOp === "ttft_pp" ? "pp2048" : selectedOp === "ttft_ctx" ? "ctx_pp" : selectedOp;
  const sorted = [...filteredData]
    .filter(d => d.op === tableOp)
    .sort((a, b) => {
      const av = a[sortConfig.key] ?? -Infinity;
      const bv = b[sortConfig.key] ?? -Infinity;
      return (av < bv ? -1 : av > bv ? 1 : 0) * sortConfig.dir;
    });

  return (
    <div className="card" style={{ marginTop: 20, overflowX: "auto" }}>
      <div style={{ fontSize: 19, fontWeight: 600, color: "#1a1f24", fontFamily: "'IBM Plex Sans'", marginBottom: 14 }}>
        Raw Numbers — {OP_LABELS[selectedOp]}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 17 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #d0d7de" }}>
            {COLS.map(({ label, key }) => {
              const active = sortConfig.key === key;
              const arrow = active ? (sortConfig.dir === 1 ? " ↑" : " ↓") : " ↕";
              return (
                <th key={key} onClick={() => onCycleSort(key)} style={{
                  padding: "6px 12px", textAlign: "right", fontWeight: 400,
                  letterSpacing: ".05em", textTransform: "uppercase", fontSize: 14,
                  color: active ? "#0969da" : "#57606a",
                  cursor: "pointer", userSelect: "none", whiteSpace: "nowrap"
                }}>
                  {label}<span style={{ opacity: active ? 1 : 0.35 }}>{arrow}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #eaeef2", background: i % 2 === 0 ? "transparent" : "#f0f2f5aa" }}>
              <td style={{ padding: "6px 12px", textAlign: "right", color: "#79c0ff" }}>{DEPTHS_LABEL[d.depth] ?? d.depth}</td>
              <td style={{ padding: "6px 12px", textAlign: "right" }}>
                <span style={{ color: C[`c${d.concurrency}`] }}>c{d.concurrency}</span>
              </td>
              <td style={{ padding: "6px 12px", textAlign: "right", color: "#1a1f24" }}>{fmt(d.tps, null)}</td>
              <td style={{ padding: "6px 12px", textAlign: "right", color: "#57606a" }}>{fmt(d.tps_req, null)}</td>
              <td style={{ padding: "6px 12px", textAlign: "right", color: d.ttft > 30000 ? "#f85149" : d.ttft > 5000 ? "#d29922" : "#3fb950" }}>
                {d.ttft != null ? fmt(d.ttft, "ms") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
