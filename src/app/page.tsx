import { Header } from "@/components/sections/Header";
import { Intro } from "@/components/sections/Intro";
import { MentorStage } from "@/components/sections/MentorStage";
import { Cortex } from "@/components/sections/Cortex";
import { Agents } from "@/components/sections/Agents";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { EarlyAccess } from "@/components/sections/EarlyAccess";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Intro />
        <MentorStage />
        <Cortex />
        <Agents />
        <HowItWorks />
        <EarlyAccess />
      </main>
      <Footer />
    </>
  );
}
