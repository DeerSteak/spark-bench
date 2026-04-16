export default function CustomLegend({ payload }) {
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
