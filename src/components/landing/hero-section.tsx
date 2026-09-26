"use client"

import { useState, useEffect, useCallback } from "react"
import type React from "react"
import {
  motion,
  AnimatePresence,
  useSpring,
  useReducedMotion,
} from "framer-motion"
import { useLenis } from "lenis/react"
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
} from "lucide-react"
import GradientWaves from "@/components/ui/gradient-waves"

// Requires: npm install framer-motion lenis lucide-react
//           npm install ogl   (for GradientWaves)
// No longer used by this file, safe to leave in place or delete:
//   @/components/ui/depth-carousel (replaced by the card slider below)

const NAV_LINKS = [
  { label: "Templates", href: "#templates" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Extension", href: "#extension" },
]

const TEMPLATES = [
  {
    id: 1,
    name: "Clean Professional",
    tagline: "Corporate Ready",
    description:
      "A polished traditional layout for finance, HR, administration, operations, and management roles.",
    image: "/resume-templates/template1.jpg",
    tags: ["ATS-Safe", "Corporate", "Traditional Layout"],
  },
  {
    id: 2,
    name: "Modern Minimal",
    tagline: "Tech Forward",
    description:
      "A clean, modern format designed to put technical skills, projects, and measurable results first.",
    image: "/resume-templates/template2.jpg",
    tags: ["Tech Roles", "Minimal", "Project-Focused"],
  },
  {
    id: 3,
    name: "Global Remote",
    tagline: "Work Without Borders",
    description:
      "Designed for Filipino professionals applying to international remote companies and distributed teams.",
    image: "/resume-templates/template3.jpg",
    tags: ["Remote Ready", "Global Jobs", "Timezone Ready"],
  },
  {
    id: 4,
    name: "Fresh Graduate",
    tagline: "First Step",
    description:
      "Education and projects take center stage for graduates and applicants with limited professional experience.",
    image: "/resume-templates/template4.jpg",
    tags: ["Entry-Level", "Fresh Graduate", "Projects First"],
  },
  {
    id: 5,
    name: "BPO / Customer Service",
    tagline: "Shift Ready",
    description:
      "Built around customer service metrics, communication skills, availability, and measurable performance.",
    image: "/resume-templates/template5.jpg",
    tags: ["BPO", "CSAT Metrics", "Night Shift"],
  },
  {
    id: 6,
    name: "Creative Sidebar",
    tagline: "Stand Out",
    description:
      "A distinctive two-column design for marketing, communications, content, and creative professionals.",
    image: "/resume-templates/template6.jpg",
    tags: ["Creative", "Marketing", "Two Column"],
  },
  {
    id: 7,
    name: "Executive",
    tagline: "Leadership Focused",
    description:
      "A premium executive format emphasizing leadership, business impact, budgets, teams, and strategic results.",
    image: "/resume-templates/template7.jpg",
    tags: ["Executive", "Leadership", "Management"],
  },
  {
    id: 8,
    name: "Academic / Research",
    tagline: "Evidence Driven",
    description:
      "A structured academic layout for researchers, analysts, university applicants, and technical professionals.",
    image: "/resume-templates/template8.jpg",
    tags: ["Academic", "Research", "Data & Analytics"],
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
    rotateY: direction > 0 ? 15 : -15,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.9,
    rotateY: direction > 0 ? -15 : 15,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  }),
}

// ---------------------------------------------------------------------------
// Nav — fixed, transitions from transparent to a solid/blurred bar once the
// user scrolls, matching the reference's behavior. Rendered as a sibling of
// <section>, not nested inside it — nesting a `position: fixed` element
// inside an `overflow-hidden` ancestor causes it to get visually clipped in
// most browsers, so it lives outside that boundary here.
// ---------------------------------------------------------------------------
function HeroNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const lenis = useLenis()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollToSection = useCallback(
    (href: string) => {
      const el = document.querySelector(href)
      if (el && lenis) {
        lenis.scrollTo(el as HTMLElement, { offset: -90 })
      }
      setMobileOpen(false)
    },
    [lenis],
  )

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-[#EFF2F9]/90 backdrop-blur-md border-b border-[#1B2A4A]/8" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1180px] mx-auto px-6 sm:px-7 py-4 flex items-center justify-between">
        <motion.span
          className="text-xl font-semibold text-[#0F1E38]"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          Kursoha
        </motion.span>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item, i) => (
            <motion.button
              key={item.label}
              onClick={() => scrollToSection(item.href)}
              className="relative text-sm font-medium text-[#425066] hover:text-[#0F1E38] transition-colors"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label}
              <motion.span
                className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#1170CD] origin-left"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              />
            </motion.button>
          ))}
        </div>

        <motion.button
          onClick={() => scrollToSection("#get-started")}
          className="hidden md:block bg-[#1170CD] text-white px-5 py-2.5 rounded-lg font-semibold text-sm relative overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
          />
          <span className="relative z-10">Get started</span>
        </motion.button>

        <motion.button
          className="md:hidden p-2 text-[#0F1E38]"
          onClick={() => setMobileOpen(!mobileOpen)}
          whileTap={{ scale: 0.9 }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Menu className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="md:hidden bg-[#EFF2F9]/95 backdrop-blur-md border-t border-[#1B2A4A]/8 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-4">
              {NAV_LINKS.map((item, i) => (
                <motion.button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left text-[#0F1E38] text-base font-medium py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {item.label}
                </motion.button>
              ))}
              <motion.button
                onClick={() => scrollToSection("#get-started")}
                className="w-full bg-[#1170CD] text-white px-6 py-3 rounded-lg font-semibold text-sm mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Get started
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// ---------------------------------------------------------------------------
// Template showcase — one resume template at a time, large and readable,
// with a pointer-tracked 3D tilt, slide transitions, chevron + dot navigation.
// Replaces the previous DepthCarousel.
// ---------------------------------------------------------------------------
function TemplateShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [[, direction], setPage] = useState([0, 0])
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const prefersReducedMotion = useReducedMotion()
  const current = TEMPLATES[currentIndex]

  // ---------------------------------------------------------------------------
  // 3D card tilt
  // ---------------------------------------------------------------------------

  const rotateX = useSpring(0, {
    stiffness: 150,
    damping: 20,
  })

  const rotateY = useSpring(0, {
    stiffness: 150,
    damping: 20,
  })

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (prefersReducedMotion) return

    const rect = e.currentTarget.getBoundingClientRect()

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const x =
      (e.clientX - centerX) / (rect.width / 2)

    const y =
      (e.clientY - centerY) / (rect.height / 2)

    rotateY.set(x * 5)
    rotateX.set(-y * 5)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  // ---------------------------------------------------------------------------
  // Carousel navigation
  // ---------------------------------------------------------------------------

  const paginate = (newDirection: number) => {
    const newIndex =
      (currentIndex +
        newDirection +
        TEMPLATES.length) %
      TEMPLATES.length

    setCurrentIndex(newIndex)
    setPage([newIndex, newDirection])
  }

  const goToTemplate = (index: number) => {
    if (index === currentIndex) return

    const newDirection =
      index > currentIndex ? 1 : -1

    setCurrentIndex(index)
    setPage([index, newDirection])
  }

  // ---------------------------------------------------------------------------
  // Preview controls
  // ---------------------------------------------------------------------------

  const openPreview = () => {
    setIsPreviewOpen(true)
  }

  const closePreview = () => {
    setIsPreviewOpen(false)
  }

  // ---------------------------------------------------------------------------
  // Close preview with Escape
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isPreviewOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePreview()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isPreviewOpen])

  // ---------------------------------------------------------------------------
  // Prevent page scrolling while preview is open
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isPreviewOpen) return

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isPreviewOpen])

  return (
    <>
      {/* ===================================================================== */}
      {/* TEMPLATE SHOWCASE                                                     */}
      {/* ===================================================================== */}

      <div className="relative">
        <div className="flex items-center justify-center gap-4">

          {/* ----------------------------------------------------------------- */}
          {/* DESKTOP PREVIOUS BUTTON                                           */}
          {/* ----------------------------------------------------------------- */}

          <motion.button
            onClick={() => paginate(-1)}
            className="
              hidden md:flex
              w-11 h-11 shrink-0
              rounded-full
              border-2 border-[#0F1E38]/15
              items-center justify-center
              text-[#0F1E38]
              hover:bg-[#0F1E38]
              hover:text-white
              hover:border-[#0F1E38]
              transition-colors
            "
            whileHover={
              prefersReducedMotion
                ? undefined
                : {
                    scale: 1.1,
                    rotate: -5,
                  }
            }
            whileTap={
              prefersReducedMotion
                ? undefined
                : { scale: 0.9 }
            }
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
            }}
            aria-label="Previous template"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          {/* ----------------------------------------------------------------- */}
          {/* TEMPLATE CARD                                                     */}
          {/* ----------------------------------------------------------------- */}

          <AnimatePresence
            mode="wait"
            custom={direction}
          >
            <motion.div
              key={current.id}
              custom={direction}
              variants={
                prefersReducedMotion
                  ? undefined
                  : slideVariants
              }
              initial={
                prefersReducedMotion
                  ? undefined
                  : "enter"
              }
              animate={
                prefersReducedMotion
                  ? undefined
                  : "center"
              }
              exit={
                prefersReducedMotion
                  ? undefined
                  : "exit"
              }
              className="relative w-full max-w-xl"
              style={{
                perspective: 1000,
              }}
            >
              <motion.div
                className="
                  bg-white
                  rounded-3xl
                  p-5 sm:p-7
                  border-2
                  border-[#1B2A4A]/8
                  shadow-xl
                "
                style={
                  prefersReducedMotion
                    ? undefined
                    : {
                        rotateX,
                        rotateY,
                        transformStyle: "preserve-3d",
                      }
                }
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 items-center">

                  {/* ========================================================= */}
                  {/* CLICKABLE RESUME PREVIEW                                  */}
                  {/* ========================================================= */}

                  <motion.button
                    type="button"
                    onClick={openPreview}
                    className="
                      relative
                      aspect-[3/4]
                      rounded-xl
                      overflow-hidden
                      bg-[#F3F6FB]
                      group
                      cursor-zoom-in
                      text-left
                      focus:outline-none
                      focus-visible:ring-4
                      focus-visible:ring-[#1170CD]/30
                    "
                    whileHover={
                      prefersReducedMotion
                        ? undefined
                        : {
                            scale: 1.03,
                          }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    aria-label={`Preview ${current.name} resume template`}
                  >
                    <img
                      src={current.image}
                      alt={`${current.name} resume template`}
                      className="
                        absolute
                        inset-0
                        w-full
                        h-full
                        object-cover
                      "
                    />

                    {/* Hover overlay */}
                    <div
                      className="
                        absolute
                        inset-0
                        bg-[#0F1E38]/0
                        group-hover:bg-[#0F1E38]/35
                        transition-colors
                        duration-300
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <div
                        className="
                          px-4 py-2
                          rounded-full
                          bg-white/95
                          backdrop-blur-sm
                          text-[#0F1E38]
                          text-sm
                          font-semibold
                          shadow-lg
                          opacity-0
                          group-hover:opacity-100
                          translate-y-2
                          group-hover:translate-y-0
                          transition-all
                          duration-300
                        "
                      >
                        Click to preview
                      </div>
                    </div>
                  </motion.button>

                  {/* ========================================================= */}
                  {/* TEMPLATE INFORMATION                                      */}
                  {/* ========================================================= */}

                  <div className="space-y-3">
                    <div>
                      <motion.span
                        className="
                          text-[#1170CD]
                          text-xs
                          font-semibold
                          tracking-[0.15em]
                          uppercase
                        "
                        initial={{
                          opacity: 0,
                          x: -20,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          delay: 0.2,
                        }}
                      >
                        {current.tagline}
                      </motion.span>

                      <motion.h3
                        className="
                          text-2xl
                          sm:text-3xl
                          font-bold
                          text-[#0F1E38]
                          tracking-tight
                          mt-1
                        "
                        initial={{
                          opacity: 0,
                          y: 20,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay: 0.3,
                          type: "spring",
                          stiffness: 100,
                        }}
                      >
                        {current.name}
                      </motion.h3>
                    </div>

                    <motion.p
                      className="
                        text-sm
                        text-[#425066]
                        leading-relaxed
                      "
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      transition={{
                        delay: 0.4,
                      }}
                    >
                      {current.description}
                    </motion.p>

                    <motion.div
                      className="
                        flex
                        flex-wrap
                        gap-2
                      "
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      transition={{
                        delay: 0.5,
                      }}
                    >
                      {current.tags.map((tag) => (
                        <span
                          key={tag}
                          className="
                            px-2.5 py-1
                            bg-[#1170CD]/8
                            rounded-full
                            text-xs
                            font-medium
                            text-[#1170CD]
                          "
                        >
                          {tag}
                        </span>
                      ))}
                    </motion.div>

                    <motion.button
                      className="
                        px-5 py-2.5
                        rounded-lg
                        font-semibold
                        text-sm
                        w-full sm:w-auto
                        relative
                        overflow-hidden
                        bg-[#1170CD]
                        text-white
                        mt-2
                      "
                      whileHover={
                        prefersReducedMotion
                          ? undefined
                          : { scale: 1.02 }
                      }
                      whileTap={
                        prefersReducedMotion
                          ? undefined
                          : { scale: 0.98 }
                      }
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                      initial={{
                        opacity: 0,
                        y: 20,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                    >
                      <motion.span
                        className="
                          absolute
                          inset-0
                          bg-white/20
                        "
                        initial={{
                          x: "-100%",
                        }}
                        whileHover={{
                          x: "100%",
                        }}
                        transition={{
                          duration: 0.5,
                        }}
                      />

                      <span className="relative z-10">
                        Use this template
                      </span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* ----------------------------------------------------------------- */}
          {/* DESKTOP NEXT BUTTON                                               */}
          {/* ----------------------------------------------------------------- */}

          <motion.button
            onClick={() => paginate(1)}
            className="
              hidden md:flex
              w-11 h-11 shrink-0
              rounded-full
              border-2 border-[#0F1E38]/15
              items-center justify-center
              text-[#0F1E38]
              hover:bg-[#0F1E38]
              hover:text-white
              hover:border-[#0F1E38]
              transition-colors
            "
            whileHover={
              prefersReducedMotion
                ? undefined
                : {
                    scale: 1.1,
                    rotate: 5,
                  }
            }
            whileTap={
              prefersReducedMotion
                ? undefined
                : { scale: 0.9 }
            }
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
            }}
            aria-label="Next template"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* ================================================================= */}
        {/* MOBILE NAVIGATION                                                  */}
        {/* ================================================================= */}

        <div className="flex md:hidden justify-center gap-4 mt-5">
          <motion.button
            onClick={() => paginate(-1)}
            className="
              w-10 h-10
              rounded-full
              border-2 border-[#0F1E38]/15
              flex
              items-center
              justify-center
              text-[#0F1E38]
            "
            whileTap={{ scale: 0.9 }}
            aria-label="Previous template"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={() => paginate(1)}
            className="
              w-10 h-10
              rounded-full
              border-2 border-[#0F1E38]/15
              flex
              items-center
              justify-center
              text-[#0F1E38]
            "
            whileTap={{ scale: 0.9 }}
            aria-label="Next template"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* ================================================================= */}
        {/* DOT NAVIGATION                                                     */}
        {/* ================================================================= */}

        <div className="flex justify-center gap-2 mt-5">
          {TEMPLATES.map((tpl, index) => (
            <motion.button
              key={tpl.id}
              onClick={() => goToTemplate(index)}
              className="h-2 rounded-full"
              style={{
                backgroundColor:
                  index === currentIndex
                    ? "#1170CD"
                    : "#1B2A4A20",
              }}
              animate={{
                width:
                  index === currentIndex
                    ? 26
                    : 8,
              }}
              whileHover={{
                scale: 1.2,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              aria-label={`Go to ${tpl.name} template`}
              aria-current={
                index === currentIndex
                  ? "true"
                  : undefined
              }
            />
          ))}
        </div>
      </div>

        {/* ===================================================================== */}
        {/* FULL-SCREEN RESUME PREVIEW                                            */}
        {/* ===================================================================== */}

        <AnimatePresence>
          {isPreviewOpen && (
            <motion.div
              className="
                fixed
                left-0
                right-0
                bottom-0
                top-[64px]
                sm:top-[72px]
                z-[40]
                bg-[#07111f]/75
                backdrop-blur-sm
                flex
                items-center
                justify-center
                p-4
                sm:p-6
              "
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0 }
              }
              animate={{
                opacity: 1,
              }}
              exit={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0 }
              }
              transition={{
                duration: 0.25,
              }}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closePreview()
                }
              }}
            >
              {/* ----------------------------------------------------------------- */}
              {/* CLOSE BUTTON                                                      */}
              {/* ----------------------------------------------------------------- */}

              <motion.button
                type="button"
                onClick={closePreview}
                className="
                  absolute
                  top-3
                  right-3
                  sm:top-4
                  sm:right-5
                  z-10
                  w-10
                  h-10
                  rounded-full
                  bg-white
                  text-[#0F1E38]
                  shadow-xl
                  flex
                  items-center
                  justify-center
                  border
                  border-[#0F1E38]/10
                "
                initial={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: 0,
                        scale: 0.8,
                      }
                }
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: 1.08,
                        rotate: 90,
                      }
                }
                whileTap={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: 0.92,
                      }
                }
                aria-label="Close resume preview"
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* ----------------------------------------------------------------- */}
              {/* EXPANDED RESUME                                                   */}
              {/* ----------------------------------------------------------------- */}

              <motion.div
                className="
                  relative
                  w-full
                  h-full
                  flex
                  items-center
                  justify-center
                  pointer-events-none
                "
                initial={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: 0,
                        scale: 0.92,
                        y: 15,
                      }
                }
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: 0,
                        scale: 0.94,
                        y: 10,
                      }
                }
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 25,
                }}
              >
                <img
                  src={current.image}
                  alt={`${current.name} resume template preview`}
                  className="
                    block
                    w-auto
                    h-auto
                    max-w-full
                    max-h-full
                    object-contain
                    rounded-sm
                    shadow-2xl
                    select-none
                  "
                  draggable={false}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

    </>
  )
}

// ---------------------------------------------------------------------------
// Hero content — badge, two-line reveal headline, description, CTAs, and
// the metrics row. Reordered on mobile via DOM order + grid placement:
// mobile shows Text -> Visual -> Metrics; desktop shows a 2-column layout
// with Visual beside Text+Metrics stacked.
// ---------------------------------------------------------------------------
export default function HeroSection() {
  const prefersReducedMotion = useReducedMotion()

  const headlineLines = ["Your career has a direction.", "Let's pursue it faster."]

  return (
    <>
      <HeroNav />

      <section className="relative bg-[#EFF2F9] min-h-screen overflow-hidden">
        {/* Ambient animated background */}
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

        <div
          id="hero-content"
          className="relative z-10 max-w-[1180px] 2xl:max-w-[1320px] mx-auto px-6 sm:px-7 pt-24 sm:pt-28 lg:pt-16 pb-16 sm:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start lg:items-center"
        >
          {/* Text block: badge, headline, description, CTAs */}
          <div className="lg:col-start-1 lg:row-start-1">
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-[#1170CD]/10 px-3 py-1.5 rounded-full mb-5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1170CD]" />
              <span className="text-[#1170CD] text-xs font-semibold tracking-[0.15em] uppercase">
                Built for Filipino job seekers
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-bold leading-[1.05] tracking-tight text-[#0F1E38] mb-5">
              {headlineLines.map((line, i) => (
                <span key={line} className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={prefersReducedMotion ? undefined : { y: "100%" }}
                    animate={prefersReducedMotion ? undefined : { y: 0 }}
                    transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1], delay: 0.15 + i * 0.1 }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg text-[#425066] leading-relaxed max-w-[46ch] mb-8"
            >
              Kursoha reads the job posting, tailors your resume, fills out the application, and tracks
              what actually gets you interviews — whether you&apos;re staying local or going global.
            </motion.p>

            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              <motion.button
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="group relative overflow-hidden bg-[#1170CD] hover:bg-[#0F5FB3] text-white font-semibold px-7 py-3.5 rounded-lg transition-colors flex items-center gap-2"
              >
                {!prefersReducedMotion && (
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full"
                    whileHover={{ x: "200%" }}
                    transition={{ duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">Start for free</span>
                <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </motion.button>
              <motion.button
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="bg-white hover:bg-[#F3F6FB] border border-[#1B2A4A]/12 text-[#0F1E38] font-semibold px-6 py-3.5 rounded-lg transition-colors"
              >
                Browse templates
              </motion.button>
            </motion.div>
          </div>

          {/* Visual: template showcase — appears between CTAs and metrics on
              mobile (DOM order), beside them on desktop (grid placement). */}
          <div className="order-none lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
            <TemplateShowcase />
          </div>

          {/* Metrics row */}
          <div className="lg:col-start-1 lg:row-start-2 flex flex-wrap gap-7">
            {[
              { value: "<30 sec", label: "per tailored application" },
              { value: "₱0", label: "no subscription, ever" },
              { value: "8", label: "templates, built for PH careers" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={prefersReducedMotion ? undefined : { opacity: 0, x: -16 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                className="flex flex-col"
              >
                <span className="text-xl font-semibold text-[#0F1E38]">{stat.value}</span>
                <span className="text-sm text-[#6B7A90]">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}