import SiteLayout from "@/components/layout/SiteLayout";
import WelcomeHero from "@/components/home/WelcomeHero";
import InformationBanner from "@/components/home/InformationBanner";
import AboutSection from "@/components/home/AboutSection";
import PopularSafariTours from "@/components/home/PopularSafariTours";

export default function Home() {
  return (
    <SiteLayout>
      <WelcomeHero />
      <InformationBanner />
      <AboutSection />
      <PopularSafariTours />

      <section
        id="discover"
        className="bg-[#FAF8F3] px-6 py-24 text-center sm:py-32"
      >
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#BF7847]">
          The Journey Begins
        </p>

        <h2 className="mt-5 font-serif text-4xl text-[#173C36] sm:text-6xl">
          Discover Your Africa
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-[#66736B]">
          Remarkable landscapes, unforgettable wildlife,
          and journeys created around you.
        </p>
      </section>
    </SiteLayout>
  );
}
