"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./DestinationGallery.module.css";
import credits from "../../../public/images/destinations/credits.json";

const destinations = [
  {
    id: "tanzania",
    name: "Tanzania",
    subtitle: "The endless Serengeti",
    description:
      "Discover spectacular wildlife, the Great Migration, Serengeti National Park and the Ngorongoro Crater.",
    highlights: ["Serengeti", "Ngorongoro", "Tarangire", "Zanzibar"],
  },
  {
    id: "rwanda",
    name: "Rwanda",
    subtitle: "Land of a thousand hills",
    description:
      "Explore beautiful green landscapes, mountain gorillas, peaceful lakes and extraordinary wildlife.",
    highlights: ["Volcanoes", "Akagera", "Nyungwe", "Lake Kivu"],
  },
  {
    id: "kenya",
    name: "Kenya",
    subtitle: "Into the wild",
    description:
      "Experience iconic African savannahs, remarkable wildlife and unforgettable safari adventures.",
    highlights: ["Maasai Mara", "Amboseli", "Lake Nakuru", "Tsavo"],
  },
  {
    id: "uganda",
    name: "Uganda",
    subtitle: "The Pearl of Africa",
    description:
      "Discover mountain gorillas, lush forests, spectacular waterfalls and diverse wildlife.",
    highlights: ["Bwindi", "Queen Elizabeth", "Murchison Falls", "Kibale"],
  },
  {
    id: "south-africa",
    name: "South Africa",
    subtitle: "A world of wonders",
    description:
      "Experience incredible wildlife, stunning coastlines, vibrant cities and remarkable landscapes.",
    highlights: ["Kruger", "Cape Town", "Garden Route", "Table Mountain"],
  },
  {
    id: "botswana",
    name: "Botswana",
    subtitle: "Untouched wilderness",
    description:
      "Explore the extraordinary waterways of the Okavango Delta and some of Africa's remarkable wilderness areas.",
    highlights: ["Okavango Delta", "Chobe", "Moremi", "Kalahari"],
  },
];

type Destination = (typeof destinations)[number];

export default function DestinationGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [entered, setEntered] = useState(false);

  const [selected, setSelected] =
    useState<Destination | null>(null);

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    if (!("IntersectionObserver" in window)) {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      selected &&
      dialogRef.current &&
      !dialogRef.current.open
    ) {
      dialogRef.current.showModal();
    }
  }, [selected]);

  function closeDestination() {
    dialogRef.current?.close();
    setSelected(null);
  }

  return (
    <section
      id="destinations"
      ref={sectionRef}
      className={`${styles.section} ${
        entered ? styles.entered : ""
      }`}
      aria-labelledby="destinations-title"
    >
      <div className={styles.container}>

        <header className={styles.heading}>
          <p className={styles.eyebrow}>
            YOUR NEXT ADVENTURE AWAITS
          </p>

          <h2 id="destinations-title">
            Explore Africa&apos;s Top Destinations
          </h2>

          <p className={styles.subtitle}>
            Remarkable places. Extraordinary wildlife.
            Unforgettable African journeys.
          </p>
        </header>

        <div className={styles.gallery}>
          {destinations.map((destination, index) => (
            <button
              key={destination.id}
              type="button"
              className={`${styles.card} ${
                styles[`card${index + 1}`]
              }`}
              onClick={() => setSelected(destination)}
              aria-label={`Explore ${destination.name}`}
            >
              <Image
                src={`/images/destinations/${destination.id}.jpg`}
                alt={`${destination.name} destination`}
                fill
                sizes="(max-width: 600px) 50vw, 50vw"
                className={styles.image}
              />

              <div className={styles.overlay} />

              <div className={styles.content}>
                <div>
                  <p>{destination.subtitle}</p>
                  <h3>{destination.name}</h3>
                </div>

                <span
                  className={styles.arrow}
                  aria-hidden="true"
                >
                  →
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className={styles.bottom}>
          <button
            type="button"
            className={styles.allButton}
            aria-expanded={showAll}
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? "CLOSE DESTINATIONS" : "EXPLORE ALL DESTINATIONS"}
            <span aria-hidden="true">
              {showAll ? "−" : "→"}
            </span>
          </button>
        </div>

        {showAll && (
          <div className={styles.directory}>
            {destinations.map((destination) => (
              <button
                type="button"
                key={destination.id}
                onClick={() => setSelected(destination)}
              >
                {destination.name}
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        )}

        <details className={styles.credits}>
          <summary>Photography credits</summary>

          {credits.map((credit) => (
            <p key={credit.destination}>
              <a
                href={credit.source}
                target="_blank"
                rel="noreferrer"
              >
                {credit.title}
              </a>
              {" — "}
              {credit.artist}
              {" — "}
              {credit.licenseUrl ? (
                <a
                  href={credit.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {credit.license}
                </a>
              ) : (
                credit.license
              )}
              {" — Display cropped to fit."}
            </p>
          ))}
        </details>

      </div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="destination-dialog-title"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <button
              type="button"
              className={styles.close}
              onClick={closeDestination}
              aria-label="Close destination details"
              autoFocus
            >
              ×
            </button>

            <div className={styles.dialogImage}>
              <Image
                src={`/images/destinations/${selected.id}.jpg`}
                alt={selected.name}
                fill
                sizes="700px"
                className={styles.image}
              />
            </div>

            <div className={styles.dialogContent}>
              <p className={styles.eyebrow}>
                EXPLORE AFRICA
              </p>

              <h3 id="destination-dialog-title">
                {selected.name}
              </h3>

              <p>{selected.description}</p>

              <h4>Places to discover</h4>

              <div className={styles.highlights}>
                {selected.highlights.map((place) => (
                  <span key={place}>{place}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </dialog>

    </section>
  );
}
