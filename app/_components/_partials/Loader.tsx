import styles from "../../styles/Loader.module.scss";

export default function Loader() {
  return (
    <div className={styles.loader} role="status" aria-label="Loading…">
      <span aria-hidden="true" />
    </div>
  );
}
