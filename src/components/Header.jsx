import styles from "./Header.module.css";

export default function Header({ files, dragOver, onDrop, onDragOver, onDragLeave, onRemoveFile }) {
  const dropText = dragOver
    ? (files.length >= 2 ? "Drop to replace all" : files.length === 1 ? "Drop to compare" : "Drop to load CSV")
    : (files.length >= 2 ? "↓ Drop CSV to replace all" : files.length === 1 ? "↓ Drop CSV to compare" : "↓ Drop CSV here");

  return (
    <header className={styles.header}>
      <div>
        <div className={styles.brand}>Sparkrun · Benchmark Explorer</div>
        <h1 className={styles.title}>Inference Performance</h1>
        {files.map((file, i) => (
          <div key={file.id} className={styles.fileTagRow}>
            {files.length > 1 && (
              <span className={i === 0 ? styles.fileLabelA : styles.fileLabelB}>
                {i === 0 ? "A" : "B"}
              </span>
            )}
            <span className={`tag ${styles.tagModel}`}>{file.model}</span>
            {file.tp && (
              <span className={`tag ${file.tp === 1 ? styles.tagTp1 : styles.tagTp2plus}`}>
                {file.tpLabel}
              </span>
            )}
            {file.suite && <span className={`tag ${styles.tagSuite}`}>{file.suite}</span>}
          </div>
        ))}
      </div>

      <div className={styles.dropZoneArea}>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`${styles.dropZone} ${dragOver ? styles.over : ""}`}
        >
          <div className={styles.dropZoneText}>{dropText}</div>
        </div>
        {files.map((file, i) => (
          <div key={file.id} className={styles.fileRow}>
            {files.length > 1 && (
              <span className={i === 0 ? styles.fileLabelA : styles.fileLabelB} style={{ fontSize: 12, padding: "1px 5px" }}>
                {i === 0 ? "A" : "B"}
              </span>
            )}
            <span className={styles.fileName} title={file.name}>{file.name}</span>
            <span className={styles.fileRowCount}>{file.rows} rows</span>
            <button onClick={() => onRemoveFile(file.id)} title="Remove CSV" className={styles.removeBtn}>✕</button>
          </div>
        ))}
      </div>
    </header>
  );
}
