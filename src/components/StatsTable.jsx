import { C, DEPTHS_LABEL, OP_LABELS } from "../constants";
import { fmt } from "../utils";
import styles from "./StatsTable.module.css";

const COLS = [
  { label: "Context Depth", key: "depth" },
  { label: "Concurrency",   key: "concurrency" },
  { label: "TPS (agg)",     key: "tps" },
  { label: "TPS (req)",     key: "tps_req" },
  { label: "TTFT",          key: "ttft" },
];

function ttftColor(v) {
  if (v > 30000) return "#f85149";
  if (v > 5000)  return "#d29922";
  return "#3fb950";
}

export default function StatsTable({ filteredData, selectedOp, sortConfig, onCycleSort, files = [] }) {
  const tableOp = selectedOp === "ttft_pp" ? "pp2048" : selectedOp === "ttft_ctx" ? "ctx_pp" : selectedOp;
  const isMultiFile = files.length > 1;
  const sorted = [...filteredData]
    .filter(d => d.op === tableOp)
    .sort((a, b) => {
      const av = a[sortConfig.key] ?? -Infinity;
      const bv = b[sortConfig.key] ?? -Infinity;
      return (av < bv ? -1 : av > bv ? 1 : 0) * sortConfig.dir;
    });

  return (
    <div className={`card ${styles.wrapper}`}>
      <div className={styles.tableTitle}>Raw Numbers — {OP_LABELS[selectedOp]}</div>
      <table className={styles.table}>
        <thead>
          <tr>
            {isMultiFile && <th className={styles.th}>Model</th>}
            {COLS.map(({ label, key }) => {
              const active = sortConfig.key === key;
              const arrow = active ? (sortConfig.dir === 1 ? " ↑" : " ↓") : " ↕";
              return (
                <th key={key} onClick={() => onCycleSort(key)} className={`${styles.th} ${active ? styles.sorted : ""}`}>
                  {label}<span className={styles.sortArrow}>{arrow}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, i) => {
            const fileIdx = isMultiFile ? files.findIndex(f => f.id === d._fileId) : -1;
            const fileColor = fileIdx === 0 ? "#0969da" : "#e36209";
            return (
              <tr key={i}>
                {isMultiFile && (
                  <td className={styles.td} style={{ color: fileColor, fontWeight: 700, fontFamily: "IBM Plex Mono" }}>
                    {fileIdx === 0 ? "A" : "B"}
                  </td>
                )}
                <td className={`${styles.td} ${styles.tdDepth}`}>{DEPTHS_LABEL[d.depth] ?? d.depth}</td>
                <td className={styles.td} style={{ color: C[`c${d.concurrency}`] }}>c{d.concurrency}</td>
                <td className={`${styles.td} ${styles.tdTps}`}>{fmt(d.tps, null)}</td>
                <td className={`${styles.td} ${styles.tdTpsReq}`}>{fmt(d.tps_req, null)}</td>
                <td className={styles.td} style={{ color: d.ttft != null ? ttftColor(d.ttft) : undefined }}>
                  {d.ttft != null ? fmt(d.ttft, "ms") : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
