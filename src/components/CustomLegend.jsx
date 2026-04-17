import styles from "./CustomLegend.module.css";

export default function CustomLegend({ payload }) {
  if (!payload?.length) return null;
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
