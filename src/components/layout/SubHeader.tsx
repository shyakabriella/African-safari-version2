"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./SubHeader.module.css";

const links = [
  { name: "Explore Safaris", href: "/safaris" },
  { name: "Destinations", href: "/destinations" },
  { name: "Hotels & Lodges", href: "/hotels" },
  { name: "Plan My Safari", href: "/plan-my-safari" },
  { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function SubHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          href="/"
          className={styles.logo}
          onClick={() => setOpen(false)}
          aria-label="AFHBH home"
        >
          <img
            src="/images/logo/LOGO.png"
            alt="African Safaris & Hotel Booking Hub"
            className={styles.logoImage}
          />
        </Link>

        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="afhbh-main-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span>{open ? "✕" : "☰"}</span>
        </button>

        <nav
          id="afhbh-main-navigation"
          className={`${styles.nav} ${open ? styles.open : ""}`}
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
