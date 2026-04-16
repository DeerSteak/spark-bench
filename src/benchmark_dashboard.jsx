import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis
} from "recharts";

// ── palette ──────────────────────────────────────────────────────────────────
const C = { c1: "#00e5ff", c2: "#7c4dff", c5: "#ff6d00", c10: "#00e676" };
const CONCURRENCIES = [1, 2, 5, 10];
const DEPTHS_LABEL = { 0: "baseline", 4096: "4K", 8192: "8K", 16384: "16K", 32768: "32K", 65535: "64K", 100000: "100K" };
const ALL_OPS = ["pp2048", "tg128", "ctx_pp", "ctx_tg", "ttft_pp", "ttft_ctx"];
const OP_LABELS = { pp2048: "Prefill (pp2048)", tg128: "Token Gen (tg128)", ctx_pp: "Ctx Prefill", ctx_tg: "Ctx Token Gen", ttft_pp: "TTFT · Prefill", ttft_ctx: "TTFT · Ctx Prefill" };

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
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

// ── filename metadata parser ─────────────────────────────────────────────────
function parseFilename(name) {
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

// ── embedded seed data ────────────────────────────────────────────────────────
const SEED_ID = "seed";
const SEED = [{"op":"pp2048","depth":0,"concurrency":1,"tps":3652.4745,"tps_req":3652.4745,"ttft":565.4215,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":0,"concurrency":1,"tps":8.7612,"tps_req":8.7612,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":0,"concurrency":2,"tps":3876.7389,"tps_req":2901.6272,"ttft":795.8445,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":0,"concurrency":2,"tps":15.5122,"tps_req":8.4253,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":0,"concurrency":5,"tps":3887.7194,"tps_req":1454.4077,"ttft":2118.1611,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":0,"concurrency":5,"tps":26.6064,"tps_req":7.1355,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":0,"concurrency":10,"tps":4134.6353,"tps_req":914.9888,"ttft":3522.9814,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":0,"concurrency":10,"tps":38.0613,"tps_req":5.7195,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":4096,"concurrency":1,"tps":3949.4027,"tps_req":3949.4027,"ttft":1040.6325,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":4096,"concurrency":1,"tps":8.4385,"tps_req":8.4385,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":4096,"concurrency":1,"tps":1341.7886,"tps_req":1341.7886,"ttft":1528.9408,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":4096,"concurrency":1,"tps":8.2136,"tps_req":8.2136,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":4096,"concurrency":2,"tps":4178.2484,"tps_req":3113.0095,"ttft":1476.976,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":4096,"concurrency":2,"tps":14.2863,"tps_req":8.0944,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":4096,"concurrency":2,"tps":1378.7168,"tps_req":1029.1496,"ttft":2234.946,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":4096,"concurrency":2,"tps":12.9241,"tps_req":7.6202,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":4096,"concurrency":5,"tps":3979.4893,"tps_req":1599.1808,"ttft":3800.2643,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":4096,"concurrency":5,"tps":21.3322,"tps_req":6.293,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":4096,"concurrency":5,"tps":1327.2465,"tps_req":577.9215,"ttft":5135.9806,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":4096,"concurrency":5,"tps":17.454,"tps_req":5.394,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":4096,"concurrency":10,"tps":4027.6033,"tps_req":1004.8948,"ttft":6644.0507,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":4096,"concurrency":10,"tps":26.8179,"tps_req":4.5702,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":4096,"concurrency":10,"tps":1309.4095,"tps_req":358.7059,"ttft":9474.3973,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":4096,"concurrency":10,"tps":20.0121,"tps_req":3.6444,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":8192,"concurrency":1,"tps":3660.3985,"tps_req":3660.3985,"ttft":2245.5671,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":8192,"concurrency":1,"tps":7.9997,"tps_req":7.9997,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":8192,"concurrency":1,"tps":768.233,"tps_req":768.233,"ttft":2667.9651,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":8192,"concurrency":1,"tps":7.7965,"tps_req":7.7965,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":8192,"concurrency":2,"tps":3852.5623,"tps_req":2591.7495,"ttft":3558.5726,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":8192,"concurrency":2,"tps":13.1808,"tps_req":7.521,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":8192,"concurrency":2,"tps":741.6223,"tps_req":421.9259,"ttft":4927.9538,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":8192,"concurrency":2,"tps":12.8018,"tps_req":7.3417,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":8192,"concurrency":5,"tps":3525.5862,"tps_req":1221.7924,"ttft":8521.9447,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":8192,"concurrency":5,"tps":15.0589,"tps_req":5.0693,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":8192,"concurrency":5,"tps":753.2645,"tps_req":270.9716,"ttft":8995.9668,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":8192,"concurrency":5,"tps":13.3076,"tps_req":4.2859,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":8192,"concurrency":10,"tps":3449.2759,"tps_req":723.774,"ttft":14994.3332,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":8192,"concurrency":10,"tps":16.2702,"tps_req":3.1522,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":8192,"concurrency":10,"tps":765.3232,"tps_req":183.1766,"ttft":15554.227,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":8192,"concurrency":10,"tps":14.3858,"tps_req":2.6663,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":16384,"concurrency":1,"tps":3549.2268,"tps_req":3549.2268,"ttft":4618.5818,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":16384,"concurrency":1,"tps":7.2326,"tps_req":7.2326,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":16384,"concurrency":1,"tps":389.5069,"tps_req":389.5069,"ttft":5260.0745,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":16384,"concurrency":1,"tps":7.0606,"tps_req":7.0606,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":16384,"concurrency":2,"tps":3602.5343,"tps_req":2690.6927,"ttft":6838.1359,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":16384,"concurrency":2,"tps":8.362,"tps_req":5.9145,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":16384,"concurrency":2,"tps":392.7776,"tps_req":293.3116,"ttft":7839.4852,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":16384,"concurrency":2,"tps":7.8312,"tps_req":5.6529,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":16384,"concurrency":5,"tps":3588.9827,"tps_req":1623.6052,"ttft":13745.0423,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":16384,"concurrency":5,"tps":8.5339,"tps_req":3.1799,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":16384,"concurrency":5,"tps":394.3951,"tps_req":178.841,"ttft":15613.7735,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":16384,"concurrency":5,"tps":7.5453,"tps_req":2.9288,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":16384,"concurrency":10,"tps":3602.2202,"tps_req":1051.3354,"ttft":25014.5747,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":16384,"concurrency":10,"tps":8.8766,"tps_req":1.8491,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":16384,"concurrency":10,"tps":394.4698,"tps_req":114.6899,"ttft":28596.2645,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":16384,"concurrency":10,"tps":7.6877,"tps_req":1.6731,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":32768,"concurrency":1,"tps":3027.0308,"tps_req":3027.0308,"ttft":10827.8096,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":32768,"concurrency":1,"tps":6.063,"tps_req":6.063,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":32768,"concurrency":1,"tps":175.1368,"tps_req":175.1368,"ttft":11695.7991,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":32768,"concurrency":1,"tps":5.9547,"tps_req":5.9547,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":32768,"concurrency":2,"tps":3029.6685,"tps_req":2260.4735,"ttft":16267.7285,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":32768,"concurrency":2,"tps":4.8412,"tps_req":4.2984,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":32768,"concurrency":2,"tps":176.2309,"tps_req":131.7347,"ttft":17462.0251,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":32768,"concurrency":2,"tps":4.6989,"tps_req":4.2721,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":32768,"concurrency":5,"tps":3046.323,"tps_req":1382.0565,"ttft":32321.3748,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":32768,"concurrency":5,"tps":4.156,"tps_req":1.956,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":32768,"concurrency":5,"tps":176.3905,"tps_req":79.8228,"ttft":34926.7434,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":32768,"concurrency":5,"tps":3.8796,"tps_req":1.8655,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":32768,"concurrency":10,"tps":3045.7776,"tps_req":886.1886,"ttft":59253.454,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":32768,"concurrency":10,"tps":4.0435,"tps_req":1.0227,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":32768,"concurrency":10,"tps":176.7398,"tps_req":51.4101,"ttft":63803.7983,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":32768,"concurrency":10,"tps":3.6237,"tps_req":0.9452,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":65535,"concurrency":1,"tps":2308.8105,"tps_req":2308.8105,"ttft":28387.5549,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":65535,"concurrency":1,"tps":4.6081,"tps_req":4.6081,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":65535,"concurrency":1,"tps":68.9017,"tps_req":68.9017,"ttft":29725.5954,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":65535,"concurrency":1,"tps":4.5334,"tps_req":4.5334,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":65535,"concurrency":2,"tps":2324.8663,"tps_req":1738.1354,"ttft":42352.0937,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":65535,"concurrency":2,"tps":2.4283,"tps_req":2.9304,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":65535,"concurrency":2,"tps":69.161,"tps_req":51.7225,"ttft":44482.9983,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":65535,"concurrency":2,"tps":2.3359,"tps_req":2.8455,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":65535,"concurrency":5,"tps":2326.7643,"tps_req":1054.8826,"ttft":84690.3593,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":65535,"concurrency":5,"tps":1.7401,"tps_req":1.0897,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":65535,"concurrency":5,"tps":69.3386,"tps_req":31.5032,"ttft":88742.545,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":65535,"concurrency":5,"tps":1.6436,"tps_req":1.0607,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":65535,"concurrency":10,"tps":2330.4757,"tps_req":678.387,"ttft":154843.3187,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":65535,"concurrency":10,"tps":1.5802,"tps_req":0.5016,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":65535,"concurrency":10,"tps":69.4282,"tps_req":20.2404,"ttft":162391.0243,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":65535,"concurrency":10,"tps":1.5312,"tps_req":0.48,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":100000,"concurrency":1,"tps":1841.5028,"tps_req":1841.5028,"ttft":54306.0739,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":100000,"concurrency":1,"tps":3.6548,"tps_req":3.6548,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":100000,"concurrency":1,"tps":36.5257,"tps_req":36.5257,"ttft":56072.1444,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":100000,"concurrency":1,"tps":3.6127,"tps_req":3.6127,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":100000,"concurrency":2,"tps":1849.8907,"tps_req":1384.331,"ttft":81178.0814,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":100000,"concurrency":2,"tps":1.4276,"tps_req":2.1249,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":100000,"concurrency":2,"tps":36.6611,"tps_req":27.43,"ttft":83896.3989,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":100000,"concurrency":2,"tps":1.2943,"tps_req":2.1034,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":100000,"concurrency":5,"tps":1850.4403,"tps_req":840.962,"ttft":162366.3109,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":100000,"concurrency":5,"tps":0.9588,"tps_req":0.7375,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":100000,"concurrency":5,"tps":36.6966,"tps_req":16.7094,"ttft":167570.1182,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":100000,"concurrency":5,"tps":0.9077,"tps_req":0.7075,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_pp","depth":100000,"concurrency":10,"tps":1851.6637,"tps_req":540.631,"ttft":297197.8894,"model":"Qwen/Qwen3.5-9B"},{"op":"ctx_tg","depth":100000,"concurrency":10,"tps":0.8715,"tps_req":0.3063,"ttft":null,"model":"Qwen/Qwen3.5-9B"},{"op":"pp2048","depth":100000,"concurrency":10,"tps":36.7168,"tps_req":10.7194,"ttft":306931.4059,"model":"Qwen/Qwen3.5-9B"},{"op":"tg128","depth":100000,"concurrency":10,"tps":0.8314,"tps_req":0.303,"ttft":null,"model":"Qwen/Qwen3.5-9B"}];

// ── helpers ───────────────────────────────────────────────────────────────────
function fmt(v, unit) {
  if (v == null) return "—";
  if (unit === "ms") {
    if (v >= 60000) return `${(v / 60000).toFixed(1)}m`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}s`;
    return `${v.toFixed(0)}ms`;
  }
  if (v >= 1000) return `${(v / 1000).toFixed(2)}K`;
  return v.toFixed(2);
}

const DEPTH_ORDER = [0, 4096, 8192, 16384, 32768, 65535, 100000];

function buildLines(data, op, metric) {
  const byDepth = {};
  for (const d of data) {
    if (d.op !== op) continue;
    const key = d.depth;
    if (!byDepth[key]) byDepth[key] = { depth: key, label: DEPTHS_LABEL[key] ?? `${key}` };
    byDepth[key][`c${d.concurrency}`] = d[metric];
  }
  return DEPTH_ORDER.filter(k => byDepth[k]).map(k => byDepth[k]);
}

// ── custom legend ────────────────────────────────────────────────────────────
function CustomLegend({ payload }) {
  if (!payload?.length) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, paddingTop: 24 }}>
      <div style={{ fontSize: 13, color: "#8c959f", textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "'IBM Plex Mono', monospace" }}>Concurrency</div>
      <div style={{ display: "flex", gap: 20 }}>
        {[...payload].sort((a, b) => parseInt(a.value.replace("c","")) - parseInt(b.value.replace("c",""))).map(p => (
          <div key={p.value} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 17, color: "#57606a", fontFamily: "'IBM Plex Mono', monospace" }}>
            <span style={{ display: "inline-block", width: 16, height: 3, background: p.color, borderRadius: 2 }} />
            {p.value}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, unit }) {
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

// ── main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const SEED_NAME = "benchmark_qwen3_5-9b-bf16-sglang_spark-arena-v1_tp1.csv";
  const [files, setFiles] = useState([{ id: SEED_ID, name: SEED_NAME, rows: SEED.length, ...parseFilename(SEED_NAME) }]);
  const [allData, setAllData] = useState(SEED.map(r => ({ ...r, _fileId: SEED_ID })));
  const [selectedOp, setSelectedOp] = useState("pp2048");
  const [tpsMode, setTpsMode] = useState("aggregate");
  const [dragOver, setDragOver] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "depth", dir: 1 });

  const allDepths = useMemo(() => [...new Set(allData.map(d => d.depth))].sort((a,b) => a-b), [allData]);
  const [enabledDepths, setEnabledDepths] = useState(new Set(DEPTH_ORDER));

  const toggleDepth = (depth) => {
    setEnabledDepths(prev => {
      const next = new Set(prev);
      next.has(depth) ? next.delete(depth) : next.add(depth);
      return next;
    });
  };

  // Keep enabledDepths in sync when new files add new depths
  const prevDepthsRef = React.useRef(new Set(DEPTH_ORDER));
  useMemo(() => {
    const newOnes = allDepths.filter(d => !prevDepthsRef.current.has(d));
    if (newOnes.length) {
      setEnabledDepths(prev => { const next = new Set(prev); newOnes.forEach(d => next.add(d)); return next; });
      newOnes.forEach(d => prevDepthsRef.current.add(d));
    }
  }, [allDepths]);

  const cycleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key ? { key, dir: prev.dir * -1 } : { key, dir: 1 }
    );
  };

  const models = useMemo(() => [...new Set(allData.map(d => d.model))], [allData]);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = [...e.dataTransfer.files].filter(f => f.name.endsWith(".csv"));
    for (const f of dropped) {
      const text = await f.text();
      const parsed = parseCSV(text);
      if (parsed.length) {
        const id = `${f.name}-${Date.now()}`;
        setAllData(prev => [...prev, ...parsed.map(r => ({ ...r, _fileId: id }))]);
        setFiles(prev => [...prev, { id, name: f.name, rows: parsed.length, ...parseFilename(f.name) }]);
      }
    }
  }, []);

  const removeFile = useCallback((id) => {
    setAllData(prev => prev.filter(r => r._fileId !== id));
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const [chartWidth, setChartWidth] = useState(708);
  const [logoSrc, setLogoSrc] = useState(null);
  const [logoDragOver, setLogoDragOver] = useState(false);

  const handleLogoDrop = useCallback((e) => {
    e.preventDefault();
    setLogoDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoSrc(ev.target.result);
    reader.readAsDataURL(file);
  }, []);

  // ── html2canvas loader ───────────────────────────────────────────────────────
  const chartRef = useRef(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (window.html2canvas) return;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    document.head.appendChild(script);
  }, []);

  const saveChart = useCallback(async () => {
    if (!chartRef.current || saving) return;
    setSaving(true);
    try {
      const canvas = await window.html2canvas(chartRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      const opSlug = selectedOp.replace(/[^a-z0-9_]/gi, "-");
      const modelSlug = files.length === 1 && files[0].model ? files[0].model : "model";
      const tpSlug = files.length === 1 && files[0].tp ? `tp${files[0].tp}` : "";
      const prefix = [tpSlug, modelSlug].filter(Boolean).join("-");
      const tpsModeSlug = selectedOp !== "ttft_pp" && selectedOp !== "ttft_ctx" ? `_${tpsMode === "per_req" ? "per-request" : "aggregate"}` : "";
      link.download = `${prefix}_${opSlug}${tpsModeSlug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setSaving(false);
    }
  }, [saving, selectedOp]);

  const tpsMetric = tpsMode === "per_req" ? "tps_req" : "tps";
  const tpsLabel = tpsMode === "per_req" ? "Tokens/s (per request)" : "Tokens/s (aggregate)";
  const tpsUnit = "tok/s";

  const filteredData = useMemo(() => allData.filter(d => enabledDepths.has(d.depth)), [allData, enabledDepths]);
  const tpsData = buildLines(filteredData, selectedOp, tpsMetric);
  const ttftData = buildLines(filteredData, selectedOp, "ttft");
  const hasTTFT = ttftData.some(d => CONCURRENCIES.some(c => d[`c${c}`] != null));

  const activeLines = CONCURRENCIES.filter(c =>
    tpsData.some(d => d[`c${c}`] != null)
  );

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", color: "#1a1f24", fontFamily: "'IBM Plex Mono', monospace", padding: "24px 28px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #f6f8fa; } ::-webkit-scrollbar-thumb { background: #d0d7de; border-radius: 3px; }
        .pill { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 11px; cursor: pointer; border: 1px solid transparent; transition: all .15s; font-family: 'IBM Plex Mono', monospace; }
        .pill:hover { opacity: .85; }
        .pill.active { border-color: #0969da; background: #dff0ff; color: #0969da; }
        .pill.inactive { border-color: #d0d7de; background: #f6f8fa; color: #57606a; }
        .card { background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 10px; padding: 20px 24px; }
        .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-family: 'IBM Plex Mono'; }
      `}</style>

      {/* header */}
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
        {/* drop zone + file list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
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
                  onClick={() => removeFile(f.id)}
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

      {/* controls */}
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
                  onChange={() => toggleDepth(d)}
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
              onDrop={handleLogoDrop}
              onDragOver={e => { e.preventDefault(); setLogoDragOver(true); }}
              onDragLeave={() => setLogoDragOver(false)}
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
              onClick={saveChart}
              disabled={saving}
              className="pill inactive"
              style={{ fontSize: 15, padding: "6px 16px", display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.5 : 1 }}
            >
              {saving ? "Saving…" : "⬇ Save PNG"}
            </button>
          </div>
        </div>
      </div>

      {/* charts */}
      <div ref={chartRef} style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, width: chartWidth, minWidth: chartWidth, maxWidth: chartWidth, position: "relative" }}>
        {selectedOp !== "ttft_pp" && selectedOp !== "ttft_ctx" && (
          <div className="card">
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 19, fontWeight: 600, color: "#1a1f24", fontFamily: "'IBM Plex Sans'" }}>{tpsLabel}</div>
              {files.length === 1 ? (
                <div style={{ marginTop: 4, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 17, color: "#79c0ff", fontFamily: "'IBM Plex Mono'" }}>{files[0].model}</span>
                  {files[0].tpLabel && <span style={{ fontSize: 17, color: files[0].tp === 1 ? "#1a7f37" : "#6e40c9", fontFamily: "'IBM Plex Mono'" }}>· {files[0].tpLabel}</span>}
                </div>
              ) : (
                <div style={{ fontSize: 17, color: "#57606a", marginTop: 2 }}>by context depth · lines = concurrency</div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tpsData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="#e0e4e8" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#57606a", fontSize: 17, dy: 8 }} label={{ value: "Context Length", position: "insideBottom", offset: -4, fill: "#8c959f", fontSize: 15 }} height={60} />
                <YAxis tick={{ fill: "#57606a", fontSize: 17 }} tickFormatter={v => fmt(v, null)} width={100} label={{ value: "Tokens / sec", angle: -90, position: "insideLeft", offset: 20, fill: "#8c959f", fontSize: 15, dy: 60 }} />
                <Tooltip content={<CustomTooltip unit={tpsUnit} />} />
                <Legend content={<CustomLegend />} />
                {activeLines.map(c => (
                  <Line key={c} type="monotone" dataKey={`c${c}`} name={`c${c}`}
                    stroke={C[`c${c}`]} strokeWidth={2} dot={{ r: 3, fill: C[`c${c}`] }}
                    connectNulls activeDot={{ r: 5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {(selectedOp === "ttft_pp" || selectedOp === "ttft_ctx") && (() => {
          const ttftOp = selectedOp === "ttft_pp" ? "pp2048" : "ctx_pp";
          const ttftTitle = selectedOp === "ttft_pp" ? "TTFT · Prefill (pp2048)" : "TTFT · Ctx Prefill";
          const data = buildLines(filteredData, ttftOp, "ttft");
          const lines = CONCURRENCIES.filter(c => data.some(d => d[`c${c}`] != null));
          return (
            <div className="card">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 19, fontWeight: 600, color: "#1a1f24", fontFamily: "'IBM Plex Sans'" }}>{ttftTitle}</div>
                {files.length === 1 ? (
                  <div style={{ marginTop: 4, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 17, color: "#79c0ff", fontFamily: "'IBM Plex Mono'" }}>{files[0].model}</span>
                    {files[0].tpLabel && <span style={{ fontSize: 17, color: files[0].tp === 1 ? "#1a7f37" : "#6e40c9", fontFamily: "'IBM Plex Mono'" }}>· {files[0].tpLabel}</span>}
                  </div>
                ) : (
                  <div style={{ fontSize: 17, color: "#57606a", marginTop: 2 }}>by context depth · lines = concurrency</div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke="#e0e4e8" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: "#57606a", fontSize: 17, dy: 8 }} label={{ value: "Context Length", position: "insideBottom", offset: -4, fill: "#8c959f", fontSize: 15 }} height={60} />
                  <YAxis tick={{ fill: "#57606a", fontSize: 17 }} tickFormatter={v => fmt(v, "ms")} width={100} label={{ value: "Time (TTFT)", angle: -90, position: "insideLeft", offset: 20, fill: "#8c959f", fontSize: 15, dy: 60 }} />
                  <Tooltip content={<CustomTooltip unit="ms" />} />
                  <Legend content={<CustomLegend />} />
                  {lines.map(c => (
                    <Line key={c} type="monotone" dataKey={`c${c}`} name={`c${c}`}
                      stroke={C[`c${c}`]} strokeWidth={2} dot={{ r: 3, fill: C[`c${c}`] }}
                      connectNulls activeDot={{ r: 5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })()}
        {logoSrc && (
          <img
            src={logoSrc}
            style={{
              position: "absolute", bottom: 16, right: 16,
              width: 64, height: 64, objectFit: "contain",
              pointerEvents: "none", opacity: 0.9
            }}
          />
        )}
      </div>

      {/* summary stats table */}
      <div className="card" style={{ marginTop: 20, overflowX: "auto" }}>
        <div style={{ fontSize: 19, fontWeight: 600, color: "#1a1f24", fontFamily: "'IBM Plex Sans'", marginBottom: 14 }}>
          Raw Numbers — {OP_LABELS[selectedOp]}
        </div>
        {(() => {
          const COLS = [
            { label: "Context Depth", key: "depth" },
            { label: "Concurrency",   key: "concurrency" },
            { label: "TPS (agg)",     key: "tps" },
            { label: "TPS (req)",     key: "tps_req" },
            { label: "TTFT",          key: "ttft" },
          ];
          const tableOp = selectedOp === "ttft_pp" ? "pp2048" : selectedOp === "ttft_ctx" ? "ctx_pp" : selectedOp;
          const sorted = [...filteredData]
            .filter(d => d.op === tableOp)
            .sort((a, b) => {
              const av = a[sortConfig.key] ?? -Infinity;
              const bv = b[sortConfig.key] ?? -Infinity;
              return (av < bv ? -1 : av > bv ? 1 : 0) * sortConfig.dir;
            });
          return (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 17 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #d0d7de" }}>
                  {COLS.map(({ label, key }) => {
                    const active = sortConfig.key === key;
                    const arrow = active ? (sortConfig.dir === 1 ? " ↑" : " ↓") : " ↕";
                    return (
                      <th key={key} onClick={() => cycleSort(key)} style={{
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
          );
        })()}
      </div>

      <div style={{ marginTop: 16, fontSize: 14, color: "#8c959f", textAlign: "right" }}>
        TTFT color: <span style={{ color: "#3fb950" }}>●</span> &lt;5s &nbsp;
        <span style={{ color: "#d29922" }}>●</span> 5–30s &nbsp;
        <span style={{ color: "#f85149" }}>●</span> &gt;30s
      </div>
    </div>
  );
}
