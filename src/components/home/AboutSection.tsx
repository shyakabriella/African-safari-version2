"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./AboutSection.module.css";

const rearImages = [
  "/images/about/africa-01.jpg",
  "/images/about/africa-03.jpg",
  "/images/about/africa-05.jpg",
];

const frontImages = [
  "/images/about/africa-02.jpg",
  "/images/about/africa-04.jpg",
  "/images/about/africa-06.jpg",
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [rearIndex, setRearIndex] = useState(0);
  const [frontIndex, setFrontIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);

        if (entry.isIntersecting) {
          setEntered(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused) return;

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      return;
    }

    const rearTimer = window.setInterval(() => {
      setRearIndex((index) => (index + 1) % rearImages.length);
    }, 6500);

    const frontTimer = window.setInterval(() => {
      setFrontIndex((index) => (index + 1) % frontImages.length);
    }, 5000);

    return () => {
      window.clearInterval(rearTimer);
      window.clearInterval(frontTimer);
    };
  }, [visible, paused]);

  return (
    <section
      id="about"
      ref={sectionRef}
      className={`${styles.section} ${
        entered ? styles.entered : ""
      }`}
      aria-labelledby="about-title"
    >
      <div className={styles.container}>

        <div className={styles.visual}>

          <div className={styles.rearCard}>
            {rearImages.map((src, index) => (
              <div
                key={src}
                className={`${styles.photo} ${
                  index === rearIndex ? styles.active : ""
                }`}
                aria-hidden={index !== rearIndex}
              >
                <Image
                  src={src}
                  alt="Discover Africa"
                  fill
                  sizes="(max-width: 800px) 75vw, 35vw"
                  className={styles.image}
                />
              </div>
            ))}
          </div>

          <div className={styles.frontCard}>
            <div className={styles.frame}>
              {frontImages.map((src, index) => (
                <div
                  key={src}
                  className={`${styles.photo} ${
                    index === frontIndex ? styles.active : ""
                  }`}
                  aria-hidden={index !== frontIndex}
                >
                  <Image
                    src={src}
                    alt="Unforgettable African experiences"
                    fill
                    sizes="(max-width: 800px) 75vw, 35vw"
                    className={styles.image}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={styles.pauseButton}
            onClick={() => setPaused((value) => !value)}
            aria-label={
              paused ? "Play slideshow" : "Pause slideshow"
            }
          >
            {paused ? "▶" : "Ⅱ"}
          </button>

        </div>

        <article className={styles.story}>

          <div className={styles.eyebrow}>
            <span />
            THE STORY BEHIND OUR JOURNEY
          </div>

          <h2 id="about-title">
            Experience Africa
            <br />
            Beyond the Ordinary.
          </h2>

          <p>
            Welcome to African Safaris &amp; Hotel Booking Hub,
            where unforgettable adventures and exceptional
            hospitality come together.
          </p>

          <p>
            We bring Africa closer to the world, connecting
            travelers with extraordinary safari experiences,
            breathtaking wildlife, remarkable hotels and
            beautiful safari lodges.
          </p>

          <p>
            Whether you seek adventure in the wilderness
            or a peaceful escape, our mission is to make
            discovering and experiencing Africa simpler,
            more inspiring and truly memorable.
          </p>

          {expanded && (
            <p className={styles.extraStory}>
              Our platform brings safari discovery and hotel
              booking together in one place, connecting
              travelers with local tourism businesses and
              authentic African experiences.
            </p>
          )}

          <button
            type="button"
            className={styles.button}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "SHOW LESS" : "MORE ABOUT US"}
            <span aria-hidden="true">
              {expanded ? "−" : "→"}
            </span>
          </button>

        </article>

      </div>
    </section>
  );
}
