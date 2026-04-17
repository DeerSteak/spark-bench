import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { DEPTH_ORDER } from "./constants";
import { parseCSV, parseFilename } from "./utils";
import Header from "./components/Header";
import Controls from "./components/Controls";
import ChartPanel from "./components/ChartPanel";
import StatsTable from "./components/StatsTable";
import "./dashboard.css";
import styles from "./benchmark_dashboard.module.css";

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [allData, setAllData] = useState([]);
  const [selectedOp, setSelectedOp] = useState("pp2048");
  const [tpsMode, setTpsMode] = useState("aggregate");
  const [dragOver, setDragOver] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "depth", dir: 1 });

  const allDepths = useMemo(() => [...new Set(allData.map(d => d.depth))].sort((a, b) => a - b), [allData]);
  const [enabledDepths, setEnabledDepths] = useState(new Set(DEPTH_ORDER));

  const toggleDepth = (depth) => {
    setEnabledDepths(prev => {
      const next = new Set(prev);
      next.has(depth) ? next.delete(depth) : next.add(depth);
      return next;
    });
  };

  const prevDepthsRef = useRef(new Set(DEPTH_ORDER));
  useEffect(() => {
    const newOnes = allDepths.filter(d => !prevDepthsRef.current.has(d));
    if (newOnes.length) {
      setEnabledDepths(prev => { const next = new Set(prev); newOnes.forEach(d => next.add(d)); return next; });
      newOnes.forEach(d => prevDepthsRef.current.add(d));
    }
  }, [allDepths]);

  const cycleSort = (key) => {
    setSortConfig(prev => prev.key === key ? { key, dir: prev.dir * -1 } : { key, dir: 1 });
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    const csv = [...e.dataTransfer.files].find(f => f.name.endsWith(".csv"));
    if (!csv) return;
    const parsed = parseCSV(await csv.text());
    if (!parsed.length) return;
    const id = `${csv.name}-${Date.now()}`;
    prevDepthsRef.current = new Set(DEPTH_ORDER);
    setEnabledDepths(new Set(DEPTH_ORDER));
    setAllData(parsed.map(r => ({ ...r, _fileId: id })));
    setFiles([{ id, name: csv.name, rows: parsed.length, ...parseFilename(csv.name) }]);
  }, []);

  const removeFile = useCallback(() => {
    setAllData([]);
    setFiles([]);
    prevDepthsRef.current = new Set(DEPTH_ORDER);
    setEnabledDepths(new Set(DEPTH_ORDER));
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

  const chartRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const filesRef = useRef(files);
  const selectedOpRef = useRef(selectedOp);
  const tpsModeRef = useRef(tpsMode);
  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { selectedOpRef.current = selectedOp; }, [selectedOp]);
  useEffect(() => { tpsModeRef.current = tpsMode; }, [tpsMode]);

  const saveChart = useCallback(async () => {
    if (!chartRef.current || saving) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#ffffff", scale: 2, useCORS: true, logging: false,
      });
      const f = filesRef.current;
      const op = selectedOpRef.current;
      const mode = tpsModeRef.current;
      const link = document.createElement("a");
      const opSlug = op.replace(/[^a-z0-9_]/gi, "-");
      const modelSlug = f.length === 1 && f[0].model ? f[0].model : "model";
      const tpSlug = f.length === 1 && f[0].tp ? `tp${f[0].tp}` : "";
      const prefix = [tpSlug, modelSlug].filter(Boolean).join("-");
      const tpsModeSlug = op !== "ttft_pp" && op !== "ttft_ctx" ? `_${mode === "per_req" ? "per-request" : "aggregate"}` : "";
      link.download = `${prefix}_${opSlug}${tpsModeSlug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setSaving(false);
    }
  }, [saving]);

  const tpsMetric = tpsMode === "per_req" ? "tps_req" : "tps";
  const tpsLabel = tpsMode === "per_req" ? "Tokens/s (per request)" : "Tokens/s (aggregate)";

  const filteredData = useMemo(() => allData.filter(d => enabledDepths.has(d.depth)), [allData, enabledDepths]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);
  const handleLogoDragOver = useCallback((e) => { e.preventDefault(); setLogoDragOver(true); }, []);
  const handleLogoDragLeave = useCallback(() => setLogoDragOver(false), []);

  return (
    <div className={styles.root}>
      <Header
        files={files}
        dragOver={dragOver}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onRemoveFile={removeFile}
      />

      <Controls
        selectedOp={selectedOp} setSelectedOp={setSelectedOp}
        tpsMode={tpsMode} setTpsMode={setTpsMode}
        allDepths={allDepths} enabledDepths={enabledDepths} onToggleDepth={toggleDepth}
        chartWidth={chartWidth} setChartWidth={setChartWidth}
        logoSrc={logoSrc} setLogoSrc={setLogoSrc}
        logoDragOver={logoDragOver}
        onLogoDrop={handleLogoDrop}
        onLogoDragOver={handleLogoDragOver}
        onLogoDragLeave={handleLogoDragLeave}
        saving={saving} onSaveChart={saveChart}
      />

      <ChartPanel
        containerRef={chartRef}
        selectedOp={selectedOp}
        filteredData={filteredData}
        files={files}
        tpsLabel={tpsLabel}
        tpsMetric={tpsMetric}
        chartWidth={chartWidth}
        logoSrc={logoSrc}
      />

      <StatsTable
        filteredData={filteredData}
        selectedOp={selectedOp}
        sortConfig={sortConfig}
        onCycleSort={cycleSort}
      />

      <div className={styles.ttftLegend}>
        TTFT color: <span style={{ color: "#3fb950" }}>●</span> &lt;5s &nbsp;
        <span style={{ color: "#d29922" }}>●</span> 5–30s &nbsp;
        <span style={{ color: "#f85149" }}>●</span> &gt;30s
      </div>
    </div>
  );
}
