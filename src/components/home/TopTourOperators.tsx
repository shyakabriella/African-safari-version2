"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./TopTourOperators.module.css";

type TourOperator = {
  id: number;
  name: string;
  country: string;
  image: string;
  description: string;
};

const operators: TourOperator[] = [
  {
    id: 1,
    name: "African Safari Experts",
    country: "Tanzania",
    image: "/images/operators/operator-01.jpg",
    description:
      "Discover African wildlife, national parks and unforgettable safari experiences.",
  },
  {
    id: 2,
    name: "Rwanda Wildlife Tours",
    country: "Rwanda",
    image: "/images/operators/operator-02.jpg",
    description:
      "Explore Rwanda's beautiful landscapes, wildlife and cultural experiences.",
  },
  {
    id: 3,
    name: "Kenya Safari Adventures",
    country: "Kenya",
    image: "/images/operators/operator-03.jpg",
    description:
      "Experience Kenya's iconic savannahs, wildlife reserves and extraordinary journeys.",
  },
  {
    id: 4,
    name: "Uganda Safari Experiences",
    country: "Uganda",
    image: "/images/operators/operator-04.jpg",
    description:
      "Discover diverse wildlife, beautiful forests and remarkable natural destinations.",
  },
];

export default function TopTourOperators() {
  const sectionRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [entered, setEntered] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selected, setSelected] =
    useState<TourOperator | null>(null);

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "afhbh-operator-favorites"
      );

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setFavorites(
            parsed.filter(
              (value): value is number =>
                typeof value === "number"
            )
          );
        }
      }
    } catch {
      // Storage may be unavailable.
    }
  }, []);

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

  function toggleFavorite(id: number) {
    const updated = favorites.includes(id)
      ? favorites.filter((value) => value !== id)
      : [...favorites, id];

    setFavorites(updated);

    try {
      localStorage.setItem(
        "afhbh-operator-favorites",
        JSON.stringify(updated)
      );
    } catch {
      // Favorites remain available during this session.
    }
  }

  function closeDialog() {
    dialogRef.current?.close();
    setSelected(null);
  }

  return (
    <section
      id="tour-operators"
      ref={sectionRef}
      className={`${styles.section} ${
        entered ? styles.entered : ""
      }`}
      aria-labelledby="operators-title"
    >
      <div className={styles.container}>

        <h2 id="operators-title" className={styles.heading}>
          Top Rated Tour Operators
        </h2>

        <p className={styles.previewNotice}>
          Sample operator profiles — rankings and reviews
          will be available when our marketplace is connected.
        </p>

        <div className={styles.grid}>
          {operators.map((operator, index) => {
            const saved = favorites.includes(operator.id);

            return (
              <article
                key={operator.id}
                className={styles.card}
              >
                <div className={styles.imageArea}>

                  <Image
                    src={operator.image}
                    alt="African safari experience"
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 1050px) 50vw, 25vw"
                    className={styles.image}
                  />

                  <div className={styles.overlay} />

                  <div
                    className={styles.ribbon}
                    aria-label={`Sample position ${index + 1}`}
                  >
                    #{index + 1}
                  </div>

                  <button
                    type="button"
                    className={`${styles.favorite} ${
                      saved ? styles.saved : ""
                    }`}
                    aria-pressed={saved}
                    aria-label={
                      saved
                        ? `Remove ${operator.name} from favorites`
                        : `Save ${operator.name} to favorites`
                    }
                    onClick={() =>
                      toggleFavorite(operator.id)
                    }
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
                    </svg>
                  </button>

                  <h3 className={styles.operatorName}>
                    <button
                      type="button"
                      onClick={() => setSelected(operator)}
                    >
                      {operator.name}
                    </button>
                  </h3>

                </div>

                <div className={styles.footer}>

                  <div className={styles.logoArea}>
                    <Image
                      src="/images/logo/ICON.PNG"
                      alt="AFHBH placeholder logo"
                      width={48}
                      height={48}
                      className={styles.logo}
                    />
                  </div>

                  <div className={styles.reviewArea}>
                    <div
                      className={styles.stars}
                      aria-label="Not yet rated"
                    >
                      ☆☆☆☆☆
                    </div>

                    <span className={styles.reviewText}>
                      Reviews pending
                    </span>
                  </div>

                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.bottom}>
          <button
            type="button"
            className={styles.allButton}
            aria-expanded={showAll}
            onClick={() => setShowAll((value) => !value)}
          >
            All Top Rated Operators
            <span aria-hidden="true">›</span>
          </button>

          {showAll && (
            <div className={styles.directory}>
              <h3>Explore Our Operator Directory</h3>

              <p className={styles.previewNotice}>
                Operator directory preview
              </p>

              {operators.map((operator) => (
                <button
                  key={operator.id}
                  type="button"
                  className={styles.directoryRow}
                  onClick={() => setSelected(operator)}
                >
                  <strong>{operator.name}</strong>
                  <span>{operator.country} →</span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClose={() => setSelected(null)}
        aria-labelledby="operator-dialog-title"
      >
        {selected && (
          <>
            <button
              type="button"
              className={styles.close}
              aria-label="Close operator profile"
              onClick={closeDialog}
              autoFocus
            >
              ×
            </button>

            <div className={styles.dialogImage}>
              <Image
                src={selected.image}
                alt="African safari landscape"
                fill
                sizes="600px"
                className={styles.image}
              />
            </div>

            <div className={styles.dialogContent}>

              <h3 id="operator-dialog-title">
                {selected.name}
              </h3>

              <p>
                <strong>Destination: </strong>
                {selected.country}
              </p>

              <p>{selected.description}</p>

              <p className={styles.previewNotice}>
                This is a demonstration operator profile.
                Verified operator information and reviews
                will be supplied by our marketplace.
              </p>

            </div>
          </>
        )}
      </dialog>

    </section>
  );
}
