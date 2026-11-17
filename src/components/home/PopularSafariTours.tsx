"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./PopularSafariTours.module.css";

type SafariTour = {
  id: number;
  title: string;
  image: string;
  price: number;
  country: string;
  duration: string;
  category: string;
  accommodation: string;
  destinations: string;
  description: string;
};

const tours: SafariTour[] = [
  {
    id: 1,
    title: "8-Day Serengeti Migration Safari",
    image: "/images/safaris/safari-01.jpg",
    price: 3038,
    country: "Tanzania",
    duration: "8 days",
    category: "Mid-range",
    accommodation: "Lodge & Tented Camp",
    destinations:
      "Arusha, Tarangire National Park, Serengeti National Park, Ngorongoro Crater.",
    description:
      "Explore Tanzania's remarkable wildlife landscapes and experience the beauty of the Serengeti.",
  },
  {
    id: 2,
    title: "4-Day Rwanda Gorilla Trekking Safari",
    image: "/images/safaris/safari-02.jpg",
    price: 2450,
    country: "Rwanda",
    duration: "4 days",
    category: "Wildlife",
    accommodation: "Safari Lodge",
    destinations:
      "Kigali, Musanze, Volcanoes National Park.",
    description:
      "Discover Rwanda's beautiful landscapes and experience an extraordinary mountain gorilla adventure.",
  },
  {
    id: 3,
    title: "7-Day Magical Kenya Wildlife Safari",
    image: "/images/safaris/safari-03.jpg",
    price: 2890,
    country: "Kenya",
    duration: "7 days",
    category: "Luxury",
    accommodation: "Lodge & Tented Camp",
    destinations:
      "Nairobi, Maasai Mara National Reserve, Lake Nakuru National Park.",
    description:
      "Experience Kenya's iconic savannahs, wildlife encounters and spectacular natural landscapes.",
  },
  {
    id: 4,
    title: "6-Day Uganda Wildlife Adventure",
    image: "/images/safaris/safari-04.jpg",
    price: 1850,
    country: "Uganda",
    duration: "6 days",
    category: "Mid-range",
    accommodation: "Safari Lodge",
    destinations:
      "Entebbe, Queen Elizabeth National Park, Bwindi Impenetrable National Park.",
    description:
      "Explore Uganda's diverse wildlife, beautiful forests and unforgettable natural destinations.",
  },
];

const priceFormatter = new Intl.NumberFormat("en-US");

export default function PopularSafariTours() {
  const sectionRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [entered, setEntered] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedTour, setSelectedTour] =
    useState<SafariTour | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("afhbh-safari-favorites");

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
      // Favorites are optional when storage is unavailable.
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

  function toggleFavorite(id: number) {
    const updated = favorites.includes(id)
      ? favorites.filter((value) => value !== id)
      : [...favorites, id];

    setFavorites(updated);

    try {
      localStorage.setItem(
        "afhbh-safari-favorites",
        JSON.stringify(updated)
      );
    } catch {
      // Keep favorites available for the current session.
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;

    if (selectedTour && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [selectedTour]);

  function closeTour() {
    dialogRef.current?.close();
    setSelectedTour(null);
  }

  return (
    <section
      id="popular-safaris"
      ref={sectionRef}
      className={`${styles.section} ${
        entered ? styles.entered : ""
      }`}
      aria-labelledby="popular-safaris-title"
    >
      <div className={styles.container}>

        <div className={styles.heading}>
          <p className={styles.eyebrow}>
            EXPLORE THE WILD
          </p>

          <h2 id="popular-safaris-title">
            Popular Safari Tours
          </h2>

          <p className={styles.subtitle}>
            Discover extraordinary African safari experiences.
          </p>

          <p className={styles.previewNotice}>
            Sample tour previews — pricing and availability
            are illustrative.
          </p>
        </div>

        <div className={styles.toursGrid}>
          {tours.map((tour) => {
            const saved = favorites.includes(tour.id);

            return (
              <article
                className={styles.tourCard}
                key={tour.id}
              >
                <div className={styles.imageArea}>

                  <Image
                    src={tour.image}
                    alt="African safari landscape"
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 1050px) 50vw, 25vw"
                    className={styles.image}
                  />

                  <div className={styles.overlay} />

                  <button
                    type="button"
                    className={`${styles.favorite} ${
                      saved ? styles.saved : ""
                    }`}
                    onClick={() => toggleFavorite(tour.id)}
                    aria-pressed={saved}
                    aria-label={
                      saved
                        ? `Remove ${tour.title} from favorites`
                        : `Save ${tour.title} to favorites`
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

                  <button
                    type="button"
                    className={styles.titleButton}
                    onClick={() => setSelectedTour(tour)}
                  >
                    <h3>{tour.title}</h3>
                  </button>

                </div>

                <div className={styles.details}>

                  <div className={styles.price}>
                    <strong>
                      ${priceFormatter.format(tour.price)}
                    </strong>
                    <span> pp (USD)</span>
                  </div>

                  <p className={styles.tourType}>
                    <strong>{tour.country}:</strong>
                    {" "}Private tour
                    <span className={styles.dot}> • </span>
                    {tour.category}
                    <span className={styles.dot}> • </span>
                    {tour.accommodation}
                  </p>

                  <p className={styles.destinations}>
                    <strong>You Visit: </strong>
                    {tour.destinations}
                  </p>

                </div>

                <div className={styles.footer}>

                  <div className={styles.operatorLogo}>
                    <Image
                      src="/images/logo/ICON.PNG"
                      alt="AFHBH"
                      width={40}
                      height={40}
                      className={styles.logo}
                    />
                  </div>

                  <div className={styles.operator}>
                    <strong>Safari Experience Preview</strong>

                    <button
                      type="button"
                      className={styles.detailsButton}
                      onClick={() => setSelectedTour(tour)}
                    >
                      View Tour Details
                      <span aria-hidden="true"> →</span>
                    </button>
                  </div>

                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.bottom}>
          <span>
            More safari experiences coming soon.
          </span>
        </div>

      </div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClose={() => setSelectedTour(null)}
        aria-labelledby="safari-dialog-title"
      >
        {selectedTour && (
          <>
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeTour}
              aria-label="Close tour details"
              autoFocus
            >
              ×
            </button>

            <div className={styles.dialogImage}>
              <Image
                src={selectedTour.image}
                alt="African safari landscape"
                fill
                sizes="650px"
                className={styles.image}
              />
            </div>

            <div className={styles.dialogContent}>
              <p className={styles.eyebrow}>
                SAFARI EXPERIENCE PREVIEW
              </p>

              <h3 id="safari-dialog-title">
                {selectedTour.title}
              </h3>

              <div className={styles.price}>
                <strong>
                  ${priceFormatter.format(selectedTour.price)}
                </strong>
                <span> pp (USD)</span>
              </div>

              <p>{selectedTour.description}</p>

              <p>
                <strong>Destination: </strong>
                {selectedTour.country}
              </p>

              <p>
                <strong>Duration: </strong>
                {selectedTour.duration}
              </p>

              <p>
                <strong>You Visit: </strong>
                {selectedTour.destinations}
              </p>

              <p className={styles.previewNotice}>
                This is a sample itinerary. It is not yet
                available for booking. Images and prices are
                illustrative.
              </p>
            </div>
          </>
        )}
      </dialog>

    </section>
  );
}
