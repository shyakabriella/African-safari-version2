import Image from "next/image";
import Link from "next/link";
import { blogPosts } from "@/data/blogPosts";
import styles from "./BlogPosts.module.css";

export default function BlogPosts({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  const Heading = standalone ? "h1" : "h2";

  return (
    <section
      id="blog"
      className={styles.section}
      aria-labelledby="blog-heading"
    >
      <div className={styles.container}>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>
            STORIES, GUIDES &amp; INSPIRATION
          </p>

          <Heading id="blog-heading">
            The African Travel Journal
          </Heading>

          <p className={styles.subtitle}>
            Travel tips, inspiring stories and everything
            you need to explore Africa.
          </p>
        </header>

        <div className={styles.grid}>
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className={styles.card}
            >
              <Link
                href={`/blog/${post.slug}`}
                className={styles.imageArea}
                aria-label={`Read ${post.title}`}
              >
                <Image
                  src={post.image}
                  alt={post.imageAlt}
                  fill
                  sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw"
                  className={styles.image}
                />

                <span className={styles.category}>
                  {post.category}
                </span>
              </Link>

              <div className={styles.content}>
                <p className={styles.author}>
                  {post.author}
                </p>

                <h3>
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h3>

                <p className={styles.excerpt}>
                  {post.excerpt}
                </p>

                <div className={styles.footer}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className={styles.readLink}
                  >
                    Read Article
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!standalone && (
          <div className={styles.bottom}>
            <Link
              href="/blog"
              className={styles.allButton}
            >
              EXPLORE ALL ARTICLES
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
