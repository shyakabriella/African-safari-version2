import Link from "next/link";
import styles from "./MainHeader.module.css";

export default function MainHeader() {
  return (
    <div className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.preferences}>
          <span className={styles.globe} aria-hidden="true">
            <img
              src="/images/logo/ICON.PNG"
              alt=""
              className={styles.globeImage}
            />
          </span>
          <span>Explore Africa</span>
          <span className={styles.separator}>|</span>
          <span>English</span>
          <span className={styles.separator}>|</span>
          <span>USD</span>
        </div>

        <div className={styles.search}>
          <span aria-hidden="true">⌕</span>
          <span>Discover your next adventure</span>
        </div>

        <div className={styles.actions}>
          <Link href="/safaris">Explore</Link>
          <Link href="/login">Sign In</Link>
          <Link
            href="/register?role=vendor"
            className={styles.listSafariButton}
          >
            <span aria-hidden="true">＋</span>
            List Your Safari
          </Link>
          <Link href="/plan-my-safari" className={styles.cta}>
            Start Planning <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
