import styles from "../../styles/Loader.module.scss";

export default function Loader() {
  return (
    <div className={styles.loader} role="status" aria-label="Inhoud laden…">
      <span aria-hidden="true" />
    </div>
  );
}
