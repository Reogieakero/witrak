import { Navbar } from "@/app/components/landing/navbar";
import { Hero } from "@/app/components/landing/hero";
import { StatStrip } from "@/app/components/landing/stat-strip";
import { ProblemSolution } from "@/app/components/landing/problem-solution";
import { Features } from "@/app/components/landing/features";
import { FeatureTabs } from "@/app/components/landing/feature-tabs";
import { Roles } from "@/app/components/landing/roles";
import { Workflow } from "@/app/components/landing/workflow";
import { Comparison } from "@/app/components/landing/comparison";
import { Security } from "@/app/components/landing/security";
import { Testimonials } from "@/app/components/landing/testimonials";
import { GettingStarted } from "@/app/components/landing/getting-started";
import { Cta } from "@/app/components/landing/cta";
import { Faq } from "@/app/components/landing/faq";
import { Footer } from "@/app/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatStrip />
        <ProblemSolution />
        <Features />
        <FeatureTabs />
        <Roles />
        <Workflow />
        <Comparison />
        <Security />
        <Testimonials />
        <GettingStarted />
        <Cta />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
