import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { C, CONCURRENCIES } from "../constants";
import { buildLines, fmt } from "../utils";
import CustomLegend from "./CustomLegend";
import CustomTooltip from "./CustomTooltip";
import styles from "./ChartPanel.module.css";

function FileSubtitle({ files }) {
  if (files.length === 1) {
    return (
      <div className={styles.subtitleSingle}>
        <span className={styles.subtitleModel}>{files[0].model}</span>
        {files[0].tpLabel && (
          <span className={files[0].tp === 1 ? styles.subtitleTp1 : styles.subtitleTp2plus}>
            · {files[0].tpLabel}
          </span>
        )}
      </div>
    );
  }
  return <div className={styles.subtitleMulti}>by context depth · lines = concurrency</div>;
}

function ChartCard({ title, subtitle, data, activeLines, yTickFormatter, yLabel, unit }) {
  return (
    <div className="card">
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>{title}</div>
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

export default function ChartPanel({ containerRef, selectedOp, filteredData, files, tpsLabel, tpsMetric, chartWidth, logoSrc }) {
  const isTTFT = selectedOp === "ttft_pp" || selectedOp === "ttft_ctx";
  const containerStyle = { width: chartWidth, minWidth: chartWidth, maxWidth: chartWidth };

  if (isTTFT) {
    const ttftOp = selectedOp === "ttft_pp" ? "pp2048" : "ctx_pp";
    const ttftTitle = selectedOp === "ttft_pp" ? "TTFT · Prefill (pp2048)" : "TTFT · Ctx Prefill";
    const data = buildLines(filteredData, ttftOp, "ttft");
    const lines = CONCURRENCIES.filter(c => data.some(d => d[`c${c}`] != null));
    return (
      <div ref={containerRef} className={styles.container} style={containerStyle}>
        <ChartCard
          title={ttftTitle}
          subtitle={<FileSubtitle files={files} />}
          data={data}
          activeLines={lines}
          yTickFormatter={v => fmt(v, "ms")}
          yLabel="Time (TTFT)"
          unit="ms"
        />
        {logoSrc && <img src={logoSrc} className={styles.logoOverlay} />}
      </div>
    );
  }

  const tpsData = buildLines(filteredData, selectedOp, tpsMetric);
  const activeLines = CONCURRENCIES.filter(c => tpsData.some(d => d[`c${c}`] != null));
  return (
    <div ref={containerRef} className={styles.container} style={containerStyle}>
      <ChartCard
        title={tpsLabel}
        subtitle={<FileSubtitle files={files} />}
        data={tpsData}
        activeLines={activeLines}
        yTickFormatter={v => fmt(v, null)}
        yLabel="Tokens / sec"
        unit="tok/s"
      />
      {logoSrc && <img src={logoSrc} className={styles.logoOverlay} />}
    </div>
  );
}
