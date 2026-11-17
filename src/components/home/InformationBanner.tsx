import styles from "./InformationBanner.module.css";

const highlights = [
  {
    strong: "African",
    text: " Safari Experiences",
  },
  {
    strong: "Hotels",
    text: " & Safari Lodges",
  },
  {
    strong: "Local",
    text: " Safari Experts",
  },
  {
    strong: "Discover",
    text: " Africa",
  },
];

export default function InformationBanner() {
  return (
    <section
      className={styles.banner}
      aria-label="Discover our safari and accommodation services"
    >
      <div className={styles.container}>
        {highlights.map((item) => (
          <div className={styles.item} key={item.strong}>
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="m7.5 12 3 3 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span className={styles.label}>
              <strong>{item.strong}</strong>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
