import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { C, CONCURRENCIES } from "../constants";
import { buildLines, fmt } from "../utils";
import CustomLegend from "./CustomLegend";
import CustomTooltip from "./CustomTooltip";

function ChartCard({ title, subtitle, data, activeLines, yTickFormatter, yLabel, unit }) {
  return (
    <div className="card">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 19, fontWeight: 600, color: "#1a1f24", fontFamily: "'IBM Plex Sans'" }}>{title}</div>
        {subtitle}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid stroke="#e0e4e8" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "#57606a", fontSize: 17, dy: 8 }} label={{ value: "Context Length", position: "insideBottom", offset: -4, fill: "#8c959f", fontSize: 15 }} height={60} />
          <YAxis tick={{ fill: "#57606a", fontSize: 17 }} tickFormatter={yTickFormatter} width={100} label={{ value: yLabel, angle: -90, position: "insideLeft", offset: 20, fill: "#8c959f", fontSize: 15, dy: 60 }} />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Legend content={<CustomLegend />} />
          {activeLines.map(c => (
            <Line key={c} type="monotone" dataKey={`c${c}`} name={`c${c}`}
              stroke={C[`c${c}`]} strokeWidth={2} dot={{ r: 3, fill: C[`c${c}`] }}
              connectNulls activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function FileSubtitle({ files }) {
  if (files.length === 1) {
    return (
      <div style={{ marginTop: 4, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 17, color: "#79c0ff", fontFamily: "'IBM Plex Mono'" }}>{files[0].model}</span>
        {files[0].tpLabel && <span style={{ fontSize: 17, color: files[0].tp === 1 ? "#1a7f37" : "#6e40c9", fontFamily: "'IBM Plex Mono'" }}>· {files[0].tpLabel}</span>}
      </div>
    );
  }
  return <div style={{ fontSize: 17, color: "#57606a", marginTop: 2 }}>by context depth · lines = concurrency</div>;
}

export default function ChartPanel({ containerRef, selectedOp, filteredData, files, tpsLabel, tpsMetric, chartWidth, logoSrc }) {
  const isTTFT = selectedOp === "ttft_pp" || selectedOp === "ttft_ctx";

  if (isTTFT) {
    const ttftOp = selectedOp === "ttft_pp" ? "pp2048" : "ctx_pp";
    const ttftTitle = selectedOp === "ttft_pp" ? "TTFT · Prefill (pp2048)" : "TTFT · Ctx Prefill";
    const data = buildLines(filteredData, ttftOp, "ttft");
    const lines = CONCURRENCIES.filter(c => data.some(d => d[`c${c}`] != null));
    return (
      <div ref={containerRef} style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, width: chartWidth, minWidth: chartWidth, maxWidth: chartWidth, position: "relative" }}>
        <ChartCard
          title={ttftTitle}
          subtitle={<FileSubtitle files={files} />}
          data={data}
          activeLines={lines}
          yTickFormatter={v => fmt(v, "ms")}
          yLabel="Time (TTFT)"
          unit="ms"
        />
        {logoSrc && <LogoOverlay src={logoSrc} />}
      </div>
    );
  }

  const tpsData = buildLines(filteredData, selectedOp, tpsMetric);
  const activeLines = CONCURRENCIES.filter(c => tpsData.some(d => d[`c${c}`] != null));
  return (
    <div ref={containerRef} style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, width: chartWidth, minWidth: chartWidth, maxWidth: chartWidth, position: "relative" }}>
      <ChartCard
        title={tpsLabel}
        subtitle={<FileSubtitle files={files} />}
        data={tpsData}
        activeLines={activeLines}
        yTickFormatter={v => fmt(v, null)}
        yLabel="Tokens / sec"
        unit="tok/s"
      />
      {logoSrc && <LogoOverlay src={logoSrc} />}
    </div>
  );
}

function LogoOverlay({ src }) {
  return (
    <img
      src={src}
      style={{
        position: "absolute", bottom: 16, right: 16,
        width: 64, height: 64, objectFit: "contain",
        pointerEvents: "none", opacity: 0.9
      }}
    />
  );
}
