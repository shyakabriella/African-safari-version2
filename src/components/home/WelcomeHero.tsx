import Link from "next/link";
import styles from "./WelcomeHero.module.css";

export default function WelcomeHero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <video
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/images/afhbh-hero-poster.jpg"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source
          src="/videos/afhbh-hero.mp4"
          type="video/mp4"
        />
      </video>
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.eyebrow}>
            <span className={styles.line} />
            EXPLORE AFRICA. EXPERIENCE MORE.
          </div>

          <h1 id="hero-heading" className={styles.title}>
            Africa Is Calling.
            <span>Your Story Starts Here.</span>
          </h1>

          <p className={styles.description}>
            Journey beyond the ordinary. Explore breathtaking
            safaris, extraordinary destinations, and beautiful
            places to stay across Africa.
          </p>

          <div className={styles.actions}>
            <Link href="/safaris" className={styles.primary}>
              Explore Safaris
              <span aria-hidden="true">↗</span>
            </Link>

            <Link href="/plan-my-safari" className={styles.secondary}>
              Plan My Adventure
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.caption}>
          <span className={styles.dot} />
          A WORLD OF AFRICAN ADVENTURES
        </div>

        <a href="#discover" className={styles.scroll}>
          SCROLL TO EXPLORE
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
