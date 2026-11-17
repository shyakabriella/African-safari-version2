import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import { blogPosts, getBlogPost } from "@/data/blogPosts";
import credits from "../../../../public/images/destinations/credits.json";
import styles from "./Article.module.css";

const SITE = "https://www.hotelandsafari.com";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return { title: "Article Not Found" };
  }

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author }],
    alternates: {
      canonical: `${SITE}/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `${SITE}/blog/${post.slug}`,
      images: [
        {
          url: `${SITE}${post.image}`,
          alt: post.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [`${SITE}${post.image}`],
    },
  };
}

export default async function ArticlePage({
  params,
}: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) notFound();

  const credit = credits.find(
    (item) => item.destination === post.imageCreditId
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: `${SITE}${post.image}`,
    inLanguage: "en",
    articleSection: post.category,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "African Safaris & Hotel Booking Hub",
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/images/logo/LOGO.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE}/blog/${post.slug}`,
    },
  };

  return (
    <SiteLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

      <article className={styles.article}>
        <div className={styles.container}>
          <nav
            className={styles.breadcrumb}
            aria-label="Breadcrumb"
          >
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/blog">Travel Journal</Link>
          </nav>

          <header className={styles.header}>
            <p className={styles.category}>
              {post.category}
            </p>

            <h1>{post.title}</h1>

            <p className={styles.excerpt}>
              {post.excerpt}
            </p>

            <p className={styles.author}>
              Written by {post.author}
            </p>
          </header>

          <figure className={styles.figure}>
            <div className={styles.hero}>
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                sizes="(max-width: 900px) 100vw, 1100px"
                className={styles.image}
              />
            </div>

            {credit && (
              <figcaption className={styles.credit}>
                Photo: {credit.artist}
                {" — "}
                <a
                  href={credit.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  Original source
                </a>
                {" — "}
                {credit.licenseUrl ? (
                  <a
                    href={credit.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {credit.license}
                  </a>
                ) : credit.license}
                {" — Cropped for display."}
              </figcaption>
            )}
          </figure>

          <div className={styles.body}>
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>

                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}

            <div className={styles.cta}>
              <h2>Ready to Explore Africa?</h2>

              <p>
                Discover inspiring safari experiences
                and remarkable African destinations.
              </p>

              <Link href="/#popular-safaris">
                EXPLORE SAFARIS →
              </Link>
            </div>

            <Link
              href="/blog"
              className={styles.back}
            >
              ← Back to Travel Journal
            </Link>
          </div>
        </div>
      </article>
    </SiteLayout>
  );
}
