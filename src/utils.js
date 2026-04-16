import { DEPTHS_LABEL, DEPTH_ORDER } from "./constants";

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  const rows = lines.slice(1).map(l => {
    const vals = l.split(",");
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = vals[i]?.trim());
    return obj;
  });

  const parsed = [];
  const re = /([\w_]+(?:\s[\w_]+)?)\s*(?:@\s*d(\d+))?\s*\(c(\d+)\)/;
  for (const r of rows) {
    const m = re.exec(r.test_name || "");
    if (!m) continue;
    parsed.push({
      op: m[1].trim(),
      depth: m[2] ? parseInt(m[2]) : 0,
      concurrency: parseInt(m[3]),
      tps: r.t_s_mean ? parseFloat(r.t_s_mean) : null,
      tps_req: r.t_s_req_mean ? parseFloat(r.t_s_req_mean) : null,
      ttft: r.e2e_ttft_mean ? parseFloat(r.e2e_ttft_mean) : null,
      model: r.model || "unknown",
    });
  }
  return parsed;
}

export function parseFilename(name) {
  const m = name.match(/benchmark_(.+?)_(spark-arena-[^_]+)_(tp\d+)\.csv/);
  if (!m) return { model: name.replace(".csv", ""), suite: "", tp: null };
  const tp = parseInt(m[3].replace("tp", ""));
  return {
    model: m[1],
    suite: m[2],
    tp,
    tpLabel: tp === 1 ? "TP1 · single node" : `TP${tp} · ${tp} nodes (QSFP)`,
  };
}

export function fmt(v, unit) {
  if (v == null) return "—";
  if (unit === "ms") {
    if (v >= 60000) return `${(v / 60000).toFixed(1)}m`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}s`;
    return `${v.toFixed(0)}ms`;
  }
  if (v >= 1000) return `${(v / 1000).toFixed(2)}K`;
  return v.toFixed(2);
}

export function buildLines(data, op, metric) {
  const byDepth = {};
  for (const d of data) {
    if (d.op !== op) continue;
    const key = d.depth;
    if (!byDepth[key]) byDepth[key] = { depth: key, label: DEPTHS_LABEL[key] ?? `${key}` };
    byDepth[key][`c${d.concurrency}`] = d[metric];
  }
  return DEPTH_ORDER.filter(k => byDepth[k]).map(k => byDepth[k]);
}
