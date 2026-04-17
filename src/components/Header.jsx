import styles from "./Header.module.css";

export default function Header({ files, dragOver, onDrop, onDragOver, onDragLeave, onRemoveFile }) {
  return (
    <header className={styles.header}>
      <div>
        <div className={styles.brand}>Sparkrun · Benchmark Explorer</div>
        <h1 className={styles.title}>Inference Performance</h1>
        {files.length > 1 && (
          <div className={styles.fileTagList}>
            {files.map(f => (
              <div key={f.id} className={styles.fileTagRow}>
                <span className={`tag ${styles.tagModel}`}>{f.model}</span>
                {f.tp && (
                  <span className={`tag ${f.tp === 1 ? styles.tagTp1 : styles.tagTp2plus}`}>
                    {f.tpLabel}
                  </span>
                )}
                {f.suite && <span className={`tag ${styles.tagSuite}`}>{f.suite}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.dropZoneArea}>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`${styles.dropZone} ${dragOver ? styles.over : ""}`}
        >
          <div className={styles.dropZoneText}>
            {dragOver ? "Drop to add CSV" : "↓ Drop additional CSVs here"}
          </div>
        </div>
        <div className={styles.fileList}>
          {files.map(f => (
            <div key={f.id} className={styles.fileRow}>
              <span className={styles.fileName} title={f.name}>{f.name}</span>
              <span className={styles.fileRowCount}>{f.rows} rows</span>
              <button
                onClick={() => onRemoveFile(f.id)}
                title="Remove this CSV"
                className={styles.removeBtn}
              >✕</button>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
