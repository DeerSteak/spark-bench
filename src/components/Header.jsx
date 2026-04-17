import styles from "./Header.module.css";

export default function Header({ files, dragOver, onDrop, onDragOver, onDragLeave, onRemoveFile }) {
  const file = files[0] ?? null;
  return (
    <header className={styles.header}>
      <div>
        <div className={styles.brand}>Sparkrun · Benchmark Explorer</div>
        <h1 className={styles.title}>Inference Performance</h1>
        {file && (
          <div className={styles.fileTagRow}>
            <span className={`tag ${styles.tagModel}`}>{file.model}</span>
            {file.tp && (
              <span className={`tag ${file.tp === 1 ? styles.tagTp1 : styles.tagTp2plus}`}>
                {file.tpLabel}
              </span>
            )}
            {file.suite && <span className={`tag ${styles.tagSuite}`}>{file.suite}</span>}
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
            {dragOver ? "Drop to load CSV" : file ? "↓ Drop CSV to replace" : "↓ Drop CSV here"}
          </div>
        </div>
        {file && (
          <div className={styles.fileRow}>
            <span className={styles.fileName} title={file.name}>{file.name}</span>
            <span className={styles.fileRowCount}>{file.rows} rows</span>
            <button onClick={onRemoveFile} title="Remove CSV" className={styles.removeBtn}>✕</button>
          </div>
        )}
      </div>
    </header>
  );
}
