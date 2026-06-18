import { ArrowUpCircle, Search } from "lucide-react";
import styles from "./TopBar.module.css";

export function TopBar() {
  return (
    <header className={styles.topBar}>
      <nav className={styles.nav}>
        <span className={`${styles.navItem} ${styles.navItemActive}`}>Home</span>
        <span className={`${styles.navItem} ${styles.navItemInactive}`}>Library</span>
        <span className={`${styles.navItem} ${styles.navItemInactive}`}>Community</span>
      </nav>
      <div className={styles.actions}>
        <div className={styles.search}>
          <Search size={16} strokeWidth={1.5} color="#999999" />
          <span className={styles.searchPlaceholder}>Search</span>
        </div>
        <button type="button" className={styles.upgradeBtn}>
          <ArrowUpCircle size={16} strokeWidth={1.5} color="#FFFFFF" />
          <span>Upgrade</span>
        </button>
        <div className={styles.avatar}>H</div>
      </div>
    </header>
  );
}
