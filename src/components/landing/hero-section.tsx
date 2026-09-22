"use client"

import DepthCarousel from "@/components/ui/depth-carousel"
import GradientWaves from "@/components/ui/gradient-waves"

// Place this file at: src/components/landing/hero-section.tsx
// Requires: npm install ogl   (for GradientWaves)
//           npm install gsap  (for DepthCarousel)

const TEMPLATE_ITEMS = [
  { image: "/resume-templates/template1.png", alt: "Clean Professional resume template", label: "Clean Professional" },
  { image: "/resume-templates/template2.png", alt: "Modern Minimal resume template", label: "Modern Minimal" },
  { image: "/resume-templates/template3.png", alt: "Global Remote resume template", label: "Global Remote" },
  { image: "/resume-templates/template4.png", alt: "Fresh Graduate resume template", label: "Fresh Graduate" },
  { image: "/resume-templates/template5.png", alt: "BPO / Customer Service resume template", label: "BPO / Customer Service" },
]

export default function HeroSection() {
  return (
    <section className="relative bg-[#EFF2F9] min-h-screen overflow-hidden">
      {/* Ambient animated background — sits behind nav, text, and carousel.
          pointer-events-none on the wrapper so it never blocks clicks on the
          content above; mouseInteraction still works wherever the cursor is
          over an area not covered by other content. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <GradientWaves
          horizonColor="#6366F1"
          waveColor="#F2F7FC"
          crestColor="#9698f4"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1}
          opacity={0.55}
          mouseInteraction
          parallaxStrength={0.5}
          grain
          grainIntensity={0.05}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 max-w-[1180px] mx-auto px-7 pt-6 pb-4 flex items-center justify-between">
        <div className="text-xl font-semibold text-[#0F1E38]">Kursoha</div>
        <div className="flex items-center gap-8">
          <a href="#templates" className="text-sm font-medium text-[#425066] hover:text-[#0F1E38]">Templates</a>
          <a href="#how-it-works" className="text-sm font-medium text-[#425066] hover:text-[#0F1E38]">How it works</a>
          <a href="#extension" className="text-sm font-medium text-[#425066] hover:text-[#0F1E38]">Extension</a>
          <a
            href="#get-started"
            className="text-sm font-semibold text-white bg-[#1170CD] px-5 py-2.5 rounded-lg hover:bg-[#0F5FB3] transition-colors"
          >
            Get started
          </a>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 max-w-[1180px] mx-auto px-7 pt-10 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="inline-block text-[#1170CD] text-sm font-semibold mb-4">
            Built for Filipino job seekers
          </span>
          <h1 className="text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-tight text-[#0F1E38] mb-5">
            Your career has a direction. Let&apos;s pursue it faster.
          </h1>
          <p className="text-lg text-[#425066] leading-relaxed max-w-[46ch] mb-8">
            Kursoha reads the job posting, tailors your resume, fills out the application, and tracks
            what actually gets you interviews — whether you&apos;re staying local or going global.
          </p>
          <div className="flex flex-wrap gap-3 mb-9">
            <button className="bg-[#1170CD] hover:bg-[#0F5FB3] text-white font-semibold px-7 py-3.5 rounded-lg transition-colors">
              Start for free
            </button>
            <button className="bg-white hover:bg-[#F3F6FB] border border-[#1B2A4A]/12 text-[#0F1E38] font-semibold px-6 py-3.5 rounded-lg transition-colors">
              Browse templates
            </button>
          </div>
          <div className="flex flex-wrap gap-7">
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-[#0F1E38]">&lt;30 sec</span>
              <span className="text-sm text-[#6B7A90]">per tailored application</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-[#0F1E38]">₱0</span>
              <span className="text-sm text-[#6B7A90]">no subscription, ever</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-[#0F1E38]">5</span>
              <span className="text-sm text-[#6B7A90]">templates, built for PH careers</span>
            </div>
          </div>
        </div>

        {/* Depth carousel of resume templates */}
        <div className="h-[460px] lg:h-[520px]">
          <DepthCarousel
            items={TEMPLATE_ITEMS}
            cardWidth={470}
            cardHeight={420}
            autoplay
            autoplayDelay={3200}
            showControls
            showIndicators
          />
        </div>
      </div>
    </section>
  )
}