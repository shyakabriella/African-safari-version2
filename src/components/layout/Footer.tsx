import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

const exploreLinks = [
  { label: "Safari Tours", href: "/#popular-safaris" },
  { label: "Tour Operators", href: "/#tour-operators" },
  { label: "Destinations", href: "/#destinations" },
  { label: "Travel Journal", href: "/blog" },
];

const destinations = [
  "Rwanda",
  "Tanzania",
  "Kenya",
  "Uganda",
  "South Africa",
  "Botswana",
];

const companyLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/#about-title" },
  { label: "Travel Inspiration", href: "/blog" },
  { label: "Discover Africa", href: "/#discover" },
];

export default function Footer() {
  const year = 2026;

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>

        <div className={styles.grid}>

          <div className={styles.brandColumn}>

            <Link href="/" className={styles.logoLink}>
              <Image
                src="/images/logo/LOGO.png"
                alt="African Safaris & Hotel Booking Hub"
                width={230}
                height={85}
                className={styles.logo}
              />
            </Link>

            <p className={styles.description}>
              Connecting the world to Africa&apos;s
              extraordinary wildlife, beautiful
              destinations and remarkable hospitality.
            </p>

            <p className={styles.brandMessage}>
              Discover Africa. Experience More.
            </p>

          </div>

          <div className={styles.column}>
            <h2>Explore Africa</h2>

            <nav aria-label="Explore Africa">
              {exploreLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className={styles.column}>
            <h2>Popular Destinations</h2>

            <nav aria-label="Popular destinations">
              {destinations.map((destination) => (
                <Link
                  key={destination}
                  href="/#destinations"
                >
                  {destination}
                </Link>
              ))}
            </nav>
          </div>

          <div className={styles.column}>
            <h2>Discover More</h2>

            <nav aria-label="Company navigation">
              {companyLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/register?role=vendor"
              className={styles.partnerButton}
            >
              <span aria-hidden="true">＋</span>
              Become a Partner
            </Link>

            <div className={styles.message}>
              <span className={styles.smallTitle}>
                YOUR JOURNEY BEGINS HERE
              </span>

              <p>Africa Awaits You.</p>
            </div>

          </div>
        </div>

        <div className={styles.bottom}>

          <p>
            © {year} African Safaris &amp; Hotel
            Booking Hub. All rights reserved.
          </p>

          <Link
            href="/"
            className={styles.bottomLink}
          >
            African Safaris &amp; Hotel Booking Hub
          </Link>

        </div>

      </div>
    </footer>
  );
}
