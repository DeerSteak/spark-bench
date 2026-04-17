# Sparkrun · Benchmark Explorer

A browser-based dashboard for visualizing and comparing AI inference benchmark results. Load one or more CSV files, explore throughput and latency across concurrency levels and context depths, and export charts as PNGs.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). No environment variables or backend required — everything runs client-side.

### Other scripts

| Command | What it does |
|---|---|
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Loading data

Drag and drop one or more benchmark CSV files onto the header drop zone. You can load multiple files at once to compare runs side-by-side.

### Expected CSV format

The CSV must have at least these columns:

| Column | Description |
|---|---|
| `test_name` | Encoded test identifier (see below) |
| `t_s_mean` | Aggregate tokens/sec (mean) |
| `t_s_req_mean` | Per-request tokens/sec (mean) |
| `e2e_ttft_mean` | End-to-end time-to-first-token in ms (mean) |
| `model` | Model name string |

**`test_name` pattern:** `{operation} [@d{depth}] (c{concurrency})`

Examples:
```
pp2048 (c1)
tg128 @d4096 (c2)
ctx_pp @d16384 (c10)
```

### Filename convention

Files named with this pattern get richer labels:

```
benchmark_{model}_{suite}_{tp}.csv
```

Example: `benchmark_llama3_spark-arena-v1_tp8.csv` → shows "llama3 · TP8 · 8 nodes (QSFP)"

Files that don't match the pattern still work — the filename (minus `.csv`) is used as the label.

## Controls

| Control | Description |
|---|---|
| **Operation** | Select which benchmark type to display: Prefill (pp2048), Token Gen (tg128), Context Prefill/Token Gen, or TTFT variants |
| **TPS mode** | Toggle between aggregate TPS and per-request TPS |
| **Depth filter** | Show/hide individual context depth lines (baseline, 4K, 8K, 16K, 32K, 64K, 100K) |
| **Chart width** | Drag to resize charts between 400–2000 px |
| **Logo** | Drag-drop a logo image; it appears as a 48×48 px overlay in the bottom-right of each chart |
| **Save PNG** | Exports the chart panel as a 2× PNG; filename is auto-generated from loaded files and selected operation |

## Logo overlay

Drop any image (PNG, SVG, etc.) onto the **Logo** drop zone in the controls panel. The logo renders at **48×48 px** (object-fit: contain) in the bottom-right corner of each chart. For best results use a square image or one with a transparent background, at least 96×96 px so it stays sharp at 2× export scale.

## TTFT color coding

The stats table highlights TTFT values by performance tier:

- Green — under 5 seconds
- Yellow — 5–30 seconds
- Red — over 30 seconds

## Tech stack

- **React 19** + **Vite 8**
- **Recharts** for charts
- **html2canvas** for PNG export
- **IBM Plex Sans / IBM Plex Mono** for fonts
