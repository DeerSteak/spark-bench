import styles from "./CustomLegend.module.css";

export default function CustomLegend({ payload }) {
  if (!payload?.length) return null;

  const isMultiFile = payload.some(p => /\([AB]\)$/.test(p.value));

  if (isMultiFile) {
    const seen = new Set();
    const concurrencies = [];
    for (const p of payload) {
      const name = p.value.replace(/\s*\([AB]\)$/, "");
      if (!seen.has(name)) {
        seen.add(name);
        concurrencies.push({ name, color: p.color });
      }
    }
    concurrencies.sort((a, b) => parseInt(a.name.replace("c", "")) - parseInt(b.name.replace("c", "")));

    return (
      <div className={styles.wrapper}>
        <div className={styles.label}>Concurrency</div>
        <div className={styles.items}>
          {concurrencies.map(c => (
            <div key={c.name} className={styles.item}>
              <span className={styles.swatch} style={{ background: c.color }} />
              {c.name}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sorted = [...payload].sort((a, b) => parseInt(a.value.replace("c", "")) - parseInt(b.value.replace("c", "")));
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>Concurrency</div>
      <div className={styles.items}>
        {sorted.map(p => (
          <div key={p.value} className={styles.item}>
            <span className={styles.swatch} style={{ background: p.color }} />
            {p.value}
          </div>
        ))}
      </div>
    </div>
  );
}
