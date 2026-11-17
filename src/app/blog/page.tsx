import type { Metadata } from "next";
import SiteLayout from "@/components/layout/SiteLayout";
import BlogPosts from "@/components/home/BlogPosts";

export const metadata: Metadata = {
  title: "African Travel Journal | Safari & Travel Guides",
  description:
    "Explore African safari guides, wildlife adventures, travel tips, hotels and destination inspiration.",
  alternates: {
    canonical: "https://www.hotelandsafari.com/blog",
  },
};

export default function BlogPage() {
  return (
    <SiteLayout>
      <BlogPosts standalone />
    </SiteLayout>
  );
}
