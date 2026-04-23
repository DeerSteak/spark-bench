import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { C, CONCURRENCIES } from "../constants";
import { buildLines, buildLinesMulti, fmt } from "../utils";
import CustomLegend from "./CustomLegend";
import CustomTooltip from "./CustomTooltip";
import styles from "./ChartPanel.module.css";

function FileSubtitle({ files }) {
  if (!files.length) return null;
  if (files.length === 1) {
    const f = files[0];
    return (
      <div className={styles.subtitleSingle}>
        <span className={styles.subtitleModel}>{f.model}</span>
        {f.tpLabel && (
          <span className={f.tp === 1 ? styles.subtitleTp1 : styles.subtitleTp2plus}>
            · {f.tpLabel}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={styles.subtitleMulti}>
      {files.map((f, i) => (
        <div key={f.id} className={styles.subtitleFile}>
          <span className={i === 0 ? styles.subtitleLineA : styles.subtitleLineB} />
          <span className={styles.subtitleModel}>{f.model}</span>
          {f.tpLabel && (
            <span className={f.tp === 1 ? styles.subtitleTp1 : styles.subtitleTp2plus}>
              · {f.tpLabel}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function buildLineConfigs(data, files) {
  if (files.length <= 1) {
    return CONCURRENCIES
      .filter(c => data.some(d => d[`c${c}`] != null))
      .map(c => ({ dataKey: `c${c}`, stroke: C[`c${c}`], name: `c${c}` }));
  }
  const configs = [];
  for (const c of CONCURRENCIES) {
    for (let fi = 0; fi < files.length; fi++) {
      const dataKey = `f${fi}_c${c}`;
      if (data.some(d => d[dataKey] != null)) {
        configs.push({
          dataKey,
          stroke: C[`c${c}`],
          strokeDasharray: fi === 0 ? undefined : "8 4",
          name: `c${c} (${fi === 0 ? "A" : "B"})`,
        });
      }
    }
  }
  return configs;
}

function ChartCard({ title, subtitle, data, lineConfigs, yTickFormatter, yLabel, unit }) {
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
          {lineConfigs.map(lc => (
            <Line key={lc.dataKey} type="monotone" dataKey={lc.dataKey} name={lc.name}
              stroke={lc.stroke} strokeWidth={2} dot={{ r: 3, fill: lc.stroke }}
              strokeDasharray={lc.strokeDasharray}
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
  const fileIds = files.map(f => f.id);

  if (files.length === 0) {
    return (
      <div className={styles.emptyState} style={containerStyle}>
        Drop a CSV file above to get started
      </div>
    );
  }

  if (isTTFT) {
    const ttftOp = selectedOp === "ttft_pp" ? "pp2048" : "ctx_pp";
    const ttftTitle = selectedOp === "ttft_pp" ? "TTFT · Prefill (pp2048)" : "TTFT · Ctx Prefill";
    const data = files.length > 1
      ? buildLinesMulti(filteredData, ttftOp, "ttft", fileIds)
      : buildLines(filteredData, ttftOp, "ttft");
    const lineConfigs = buildLineConfigs(data, files);
    return (
      <div ref={containerRef} className={styles.container} style={containerStyle}>
        <ChartCard
          title={ttftTitle}
          subtitle={<FileSubtitle files={files} />}
          data={data}
          lineConfigs={lineConfigs}
          yTickFormatter={v => fmt(v, "ms")}
          yLabel="Time (TTFT)"
          unit="ms"
        />
        {logoSrc && <img src={logoSrc} className={styles.logoOverlay} />}
      </div>
    );
  }

  const tpsData = files.length > 1
    ? buildLinesMulti(filteredData, selectedOp, tpsMetric, fileIds)
    : buildLines(filteredData, selectedOp, tpsMetric);
  const lineConfigs = buildLineConfigs(tpsData, files);
  return (
    <div ref={containerRef} className={styles.container} style={containerStyle}>
      <ChartCard
        title={tpsLabel}
        subtitle={<FileSubtitle files={files} />}
        data={tpsData}
        lineConfigs={lineConfigs}
        yTickFormatter={v => fmt(v, null)}
        yLabel="Tokens / sec"
        unit="tok/s"
      />
      {logoSrc && <img src={logoSrc} className={styles.logoOverlay} />}
    </div>
  );
}
