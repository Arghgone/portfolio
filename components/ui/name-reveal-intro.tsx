"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";

interface NameRevealIntroProps {
    firstName?: string;
    lastName?: string;
}

interface LetterConfig {
    char: string;
    axis: "x" | "y";
    direction: number;
    speed: number;
    delay: number;
}

// Hook to safely create scroll-linked transforms
function useLetterTransform(
    scrollYProgress: MotionValue<number>,
    config: LetterConfig,
    isMobile: boolean,
    isFirstName: boolean
) {
    const baseDistance = isMobile ? 600 : 1200;
    const distance = baseDistance * config.speed;

    const start = config.delay;
    const end = Math.min(0.55 + config.delay, 0.7);

    // Always create both transforms, but only use the relevant one
    const xTransform = useTransform(
        scrollYProgress,
        [start, end],
        [distance * config.direction, 0]
    );

    const yDistance = isFirstName ? -distance : distance;
    const yTransform = useTransform(
        scrollYProgress,
        [start, end],
        [yDistance * config.direction, 0]
    );

    const smoothX = useSpring(xTransform, { stiffness: 35, damping: 22 });
    const smoothY = useSpring(yTransform, { stiffness: 35, damping: 22 });

    if (config.speed === 0) {
        return { x: 0, y: 0, isAnchor: true };
    }

    if (config.axis === "x") {
        return { x: smoothX, y: 0, isAnchor: false };
    } else {
        return { x: 0, y: smoothY, isAnchor: false };
    }
}

const NameRevealIntro = ({
    firstName = "MUSTAFA",
    lastName = "SIDDIQUI",
}: NameRevealIntroProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // === LETTER CONFIGURATIONS ===
    // First name: M U S T A F A - T is anchor at index 3
    // Last name: S I D D I Q U I - spread from center
    const firstNameLetters: LetterConfig[] = useMemo(() => [
        { char: "M", axis: "x", direction: -1, speed: 1.0, delay: 0.08 },
        { char: "U", axis: "x", direction: -1, speed: 0.75, delay: 0.06 },
        { char: "S", axis: "x", direction: -1, speed: 0.45, delay: 0.04 },
        { char: "T", axis: "x", direction: 0, speed: 0, delay: 0 }, // Anchor
        { char: "A", axis: "x", direction: 1, speed: 0.45, delay: 0.04 },
        { char: "F", axis: "x", direction: 1, speed: 0.75, delay: 0.06 },
        { char: "A", axis: "x", direction: 1, speed: 1.0, delay: 0.08 },
    ], []);

    const lastNameLetters: LetterConfig[] = useMemo(() => [
        { char: "S", axis: "x", direction: -1, speed: 0.95, delay: 0.1 },
        { char: "I", axis: "x", direction: -1, speed: 0.78, delay: 0.08 },
        { char: "D", axis: "x", direction: -1, speed: 0.58, delay: 0.06 },
        { char: "D", axis: "x", direction: -1, speed: 0.35, delay: 0.04 },
        { char: "I", axis: "y", direction: 1, speed: 0.25, delay: 0.02 },
        { char: "Q", axis: "x", direction: 1, speed: 0.35, delay: 0.04 },
        { char: "U", axis: "x", direction: 1, speed: 0.58, delay: 0.06 },
        { char: "I", axis: "x", direction: 1, speed: 0.78, delay: 0.08 },
    ], []);

    // Call hooks at top level for all letters
    const m0 = useLetterTransform(scrollYProgress, firstNameLetters[0], isMobile, true);
    const u1 = useLetterTransform(scrollYProgress, firstNameLetters[1], isMobile, true);
    const s2 = useLetterTransform(scrollYProgress, firstNameLetters[2], isMobile, true);
    const t3 = useLetterTransform(scrollYProgress, firstNameLetters[3], isMobile, true);
    const a4 = useLetterTransform(scrollYProgress, firstNameLetters[4], isMobile, true);
    const f5 = useLetterTransform(scrollYProgress, firstNameLetters[5], isMobile, true);
    const a6 = useLetterTransform(scrollYProgress, firstNameLetters[6], isMobile, true);
    const firstNameTransforms = [m0, u1, s2, t3, a4, f5, a6];

    const s0 = useLetterTransform(scrollYProgress, lastNameLetters[0], isMobile, false);
    const i1 = useLetterTransform(scrollYProgress, lastNameLetters[1], isMobile, false);
    const d2 = useLetterTransform(scrollYProgress, lastNameLetters[2], isMobile, false);
    const d3 = useLetterTransform(scrollYProgress, lastNameLetters[3], isMobile, false);
    const i4 = useLetterTransform(scrollYProgress, lastNameLetters[4], isMobile, false);
    const q5 = useLetterTransform(scrollYProgress, lastNameLetters[5], isMobile, false);
    const u6 = useLetterTransform(scrollYProgress, lastNameLetters[6], isMobile, false);
    const i7 = useLetterTransform(scrollYProgress, lastNameLetters[7], isMobile, false);
    const lastNameTransforms = [s0, i1, d2, d3, i4, q5, u6, i7];

    // === THE 'T' SCALE ANIMATION ===
    // The T scales from massively large (fills the screen with its form) to normal size
    const tScale = useTransform(scrollYProgress, [0, 0.55], [150, 1]);
    const smoothTScale = useSpring(tScale, { stiffness: 30, damping: 22 });

    // Background: Starts black, transitions to white as name assembles
    const bgProgress = useTransform(scrollYProgress, [0.35, 0.6], [0, 1]);
    const smoothBgProgress = useSpring(bgProgress, { stiffness: 40, damping: 25 });

    // Letters fade in as they approach
    const letterOpacity = useTransform(scrollYProgress, [0.08, 0.25], [0, 1]);
    const smoothLetterOpacity = useSpring(letterOpacity, { stiffness: 50, damping: 22 });

    // T opacity - starts visible (to create black screen), stays visible
    const tOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 1]);
    const smoothTOpacity = useSpring(tOpacity, { stiffness: 60, damping: 25 });

    // Scroll indicator
    const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
    const smoothScrollIndicator = useSpring(scrollIndicatorOpacity, { stiffness: 60, damping: 25 });

    // Final glow effect
    const glowOpacity = useTransform(scrollYProgress, [0.65, 0.8], [0, 0.6]);
    const smoothGlowOpacity = useSpring(glowOpacity, { stiffness: 40, damping: 20 });

    return (
        <div ref={containerRef} className="relative h-[450vh]">
            {/* Sticky viewport container */}
            <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">

                {/* Layer 1: Pure Black Base */}
                <div className="absolute inset-0 z-0 bg-black" />

                {/* Layer 2: White Background - fades in */}
                <motion.div
                    style={{ opacity: smoothBgProgress }}
                    className="absolute inset-0 z-[1] bg-white"
                />

                {/* Layer 3: The Name Assembly Container */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-[5]">

                    {/* First Name Row: MUSTAFA */}
                    <div className="flex items-center justify-center">
                        {firstNameLetters.map((letter, index) => {
                            const transform = firstNameTransforms[index];

                            if (transform.isAnchor) {
                                // The 'T' - scales from massive to normal
                                return (
                                    <motion.span
                                        key={`first-${index}`}
                                        style={{
                                            scale: smoothTScale,
                                            opacity: smoothTOpacity,
                                            transformOrigin: "center center",
                                        }}
                                        className="font-serif font-black text-[3rem] md:text-[8rem] lg:text-[10rem] tracking-[-0.02em] text-black inline-block leading-none"
                                    >
                                        {letter.char}
                                    </motion.span>
                                );
                            }

                            return (
                                <motion.span
                                    key={`first-${index}`}
                                    style={{
                                        x: transform.x,
                                        y: transform.y,
                                        opacity: smoothLetterOpacity,
                                    }}
                                    className="font-serif font-black text-[3rem] md:text-[8rem] lg:text-[10rem] tracking-[-0.02em] text-black inline-block leading-none"
                                >
                                    {letter.char}
                                </motion.span>
                            );
                        })}
                    </div>

                    {/* Second Name Row: SIDDIQUI */}
                    <div className="flex items-center justify-center -mt-2 md:-mt-6">
                        {lastNameLetters.map((letter, index) => {
                            const transform = lastNameTransforms[index];

                            return (
                                <motion.span
                                    key={`last-${index}`}
                                    style={{
                                        x: transform.x,
                                        y: transform.y,
                                        opacity: smoothLetterOpacity,
                                    }}
                                    className="font-serif font-black text-[3rem] md:text-[8rem] lg:text-[10rem] tracking-[-0.02em] text-black inline-block leading-none"
                                >
                                    {letter.char}
                                </motion.span>
                            );
                        })}
                    </div>

                    {/* Subtle emerald glow when locked */}
                    <motion.div
                        style={{ opacity: smoothGlowOpacity }}
                        className="absolute inset-0 pointer-events-none flex items-center justify-center"
                    >
                        <div className="w-[500px] h-[150px] md:w-[900px] md:h-[300px] bg-emerald-500/15 blur-[100px] rounded-full" />
                    </motion.div>
                </div>

                {/* Layer 4: Scroll Indicator */}
                <motion.div
                    style={{ opacity: smoothScrollIndicator }}
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[10] flex flex-col items-center gap-4"
                >
                    <span className="text-white/50 text-xs md:text-sm font-light tracking-[0.3em] uppercase">
                        Scroll to reveal
                    </span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="w-5 h-9 border border-white/30 rounded-full flex items-start justify-center p-1.5"
                    >
                        <motion.div className="w-1 h-2.5 bg-white/50 rounded-full" />
                    </motion.div>
                </motion.div>

            </div>
        </div>
    );
};

export default NameRevealIntro;
