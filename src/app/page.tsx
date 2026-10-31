import { Hero } from "@/components/hero/Hero";
import { Experts } from "@/components/sections/Experts";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { EarlyAccess } from "@/components/sections/EarlyAccess";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Experts />
        <HowItWorks />
        <EarlyAccess />
      </main>
      <Footer />
    </>
  );
}
