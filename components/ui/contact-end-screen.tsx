"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useTransform, useSpring, useMotionValue, useMotionTemplate, MotionValue, useInView } from "framer-motion";
import { ArrowRight, Mail, Linkedin, MapPin, Github, Instagram, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactEndScreenProps {
    title?: string;
    subtitle?: string;
    email?: string;
    linkedIn?: string;
    github?: string;
    instagram?: string;
    location?: string;
    ctaText?: string;
    firstName?: string;
    lastName?: string;
    onCtaClick?: () => void;
}

// Letter configuration for the Void Assembly effect
interface LetterConfig {
    char: string;
    axis: "x" | "y";
    direction: 1 | -1; // 1 = right/down, -1 = left/up
    speed: "slowest" | "medium" | "fast";
    isAnchor?: boolean;
}

// Speed multipliers - controls starting distance
const SPEED_MAP = {
    slowest: 1.8,
    medium: 1.2,
    fast: 0.7,
};

// End time multipliers - slower letters finish LATER (after T is stable)
const END_TIME_MAP = {
    slowest: 0.95,  // Finishes last
    medium: 0.85,   // Finishes mid
    fast: 0.70,     // Finishes first (but still after T)
};

// === EASTER EGG CONFIGURATION ===
const HOLD_DURATION_MS = 1200; // Reduced for easier mobile triggering
const ANIMATION_DURATION_MS = 3000; // How long the reveal animation takes
const SCROLL_IDLE_TIMEOUT_MS = 400; // Increased tolerance for mobile

// Custom hook for animation-progress-linked letter transforms
function useLetterTransform(
    animationProgress: MotionValue<number>,
    config: LetterConfig,
    isMobile: boolean
): { x: MotionValue<number> | number; y: MotionValue<number> | number } {
    const baseDistance = isMobile ? 400 : 800;
    const speedMultiplier = SPEED_MAP[config.speed];
    const distance = baseDistance * speedMultiplier;

    const startProgress = 0.1;
    const endProgress = END_TIME_MAP[config.speed];

    const xTransform = useTransform(
        animationProgress,
        [startProgress, endProgress],
        config.axis === "x" ? [distance * config.direction, 0] : [0, 0]
    );

    const yTransform = useTransform(
        animationProgress,
        [startProgress, endProgress],
        config.axis === "y" ? [distance * config.direction, 0] : [0, 0]
    );

    const smoothX = useSpring(xTransform, { stiffness: 30, damping: 20 });
    const smoothY = useSpring(yTransform, { stiffness: 30, damping: 20 });

    if (config.isAnchor) {
        return { x: 0, y: 0 };
    }

    return { x: smoothX, y: smoothY };
}

// Easing function for smooth animation
function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Circular Progress Loader Component
const CircularLoader = ({ progress, isVisible }: { progress: number; isVisible: boolean }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
                opacity: isVisible ? 1 : 0,
                scale: isVisible ? 1 : 0.8,
                y: isVisible ? 0 : 20
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col items-center gap-2"
        >
            <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 44 44">
                    <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="3"
                    />
                    <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <ChevronUp className="w-5 h-5 text-emerald-400" />
                </div>
            </div>
        </motion.div>
    );
};

const ContactEndScreen = ({
    title = "Let's Build Something Amazing",
    subtitle = "Ready to collaborate? Let's create the future together.",
    email = "hello@example.com",
    linkedIn = "linkedin.com/in/yourprofile",
    github = "github.com/yourprofile",
    instagram = "@yourhandle",
    location = "San Francisco, CA",
    ctaText = "Back to Top",
    firstName = "MUSTAFA",
    lastName = "SIDDIQUI",
    onCtaClick,
}: ContactEndScreenProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Content entrance animation state
    const isContentInView = useInView(contentRef, { once: true, margin: "-10% 0px" });
    const [hasAnimated, setHasAnimated] = useState(false);

    // Trigger animation when content comes into view
    useEffect(() => {
        if (isContentInView && !hasAnimated) {
            setHasAnimated(true);
        }
    }, [isContentInView, hasAnimated]);

    // === EASTER EGG STATE ===
    const [holdProgress, setHoldProgress] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);

    // Programmatic animation progress (0 = contact visible, 1 = void assembly complete)
    const animationProgress = useMotionValue(0);

    // Refs for animation control
    const holdStartTimeRef = useRef<number | null>(null);
    const holdAnimationRef = useRef<number | null>(null);
    const revealAnimationRef = useRef<number | null>(null);
    const scrollIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isOverscrollingRef = useRef(false);
    const holdTriggeredRef = useRef(false); // Prevents loader from looping after triggering

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // === CHECK IF SECTION IS IN VIEW ===
    const isSectionInView = useCallback(() => {
        if (!containerRef.current) return false;
        const rect = containerRef.current.getBoundingClientRect();
        // Section is "at the bottom" when its top is near the viewport top
        // and its bottom extends to or past the viewport bottom
        return rect.top <= 10 && rect.bottom >= window.innerHeight - 10;
    }, []);

    // === SECTION SETTLE STATE ===
    // Prevents overscroll from triggering during momentum scroll into the section
    const [sectionSettled, setSectionSettled] = useState(false);
    const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const checkSettle = () => {
            if (isSectionInView()) {
                // Section is in view - start settle timer if not already started
                if (!settleTimeoutRef.current && !sectionSettled) {
                    settleTimeoutRef.current = setTimeout(() => {
                        setSectionSettled(true);
                    }, 100); // Wait 100ms before allowing overscroll detection
                }
            } else {
                // Section left view - reset settle state
                if (settleTimeoutRef.current) {
                    clearTimeout(settleTimeoutRef.current);
                    settleTimeoutRef.current = null;
                }
                setSectionSettled(false);
            }
        };

        // Check on scroll
        window.addEventListener('scroll', checkSettle, { passive: true });
        checkSettle(); // Initial check

        return () => {
            window.removeEventListener('scroll', checkSettle);
            if (settleTimeoutRef.current) {
                clearTimeout(settleTimeoutRef.current);
            }
        };
    }, [isSectionInView, sectionSettled]);

    // === START REVEAL ANIMATION (forward: 0 → 1) ===
    const startRevealAnimation = useCallback(() => {
        if (isAnimating) return;

        setIsAnimating(true);
        setShowLoader(false);

        const startTime = performance.now();
        const startProgress = animationProgress.get();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
            const easedProgress = easeInOutCubic(progress);

            const newProgress = startProgress + (1 - startProgress) * easedProgress;
            animationProgress.set(newProgress);

            if (progress < 1) {
                revealAnimationRef.current = requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
                setAnimationComplete(true);
            }
        };

        revealAnimationRef.current = requestAnimationFrame(animate);
    }, [isAnimating, animationProgress]);

    // === START REVERSE ANIMATION (backward: 1 → 0) ===
    const startReverseAnimation = useCallback(() => {
        if (isAnimating) return;

        setIsAnimating(true);
        setAnimationComplete(false);

        const startTime = performance.now();
        const startProgress = animationProgress.get();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
            const easedProgress = easeInOutCubic(progress);

            // Animate from current progress back to 0
            const newProgress = startProgress - startProgress * easedProgress;
            animationProgress.set(newProgress);

            if (progress < 1) {
                revealAnimationRef.current = requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
                animationProgress.set(0);
                // Reset all states so Easter egg can be triggered again cleanly
                holdTriggeredRef.current = false;
                setHoldProgress(0);
                setShowLoader(false);
            }
        };

        revealAnimationRef.current = requestAnimationFrame(animate);
    }, [isAnimating, animationProgress]);

    // === CANCEL ANIMATION (Interrupt) ===
    const cancelAnimation = useCallback(() => {
        if (revealAnimationRef.current) {
            cancelAnimationFrame(revealAnimationRef.current);
            revealAnimationRef.current = null;
        }
        setIsAnimating(false);
    }, []);

    // === RESET OVERSCROLL STATE ===
    const resetOverscrollState = useCallback(() => {
        // Don't reset if we already triggered the animation
        if (holdTriggeredRef.current) return;

        if (holdAnimationRef.current) {
            cancelAnimationFrame(holdAnimationRef.current);
            holdAnimationRef.current = null;
        }
        holdStartTimeRef.current = null;
        isOverscrollingRef.current = false;
        setHoldProgress(0);
        setShowLoader(false);
    }, []);

    // === HOLD ANIMATION (tracks continuous overscroll) ===
    const updateHoldProgress = useCallback(() => {
        if (!holdStartTimeRef.current || !isOverscrollingRef.current || holdTriggeredRef.current) return;

        const elapsed = performance.now() - holdStartTimeRef.current;
        const progress = Math.min(elapsed / HOLD_DURATION_MS, 1);
        setHoldProgress(progress);

        if (progress >= 1) {
            // Hold complete - immediately trigger reveal animation
            // Mark as triggered to prevent any more resets/loops
            holdTriggeredRef.current = true;
            isOverscrollingRef.current = false;
            holdStartTimeRef.current = null;

            // Clear any pending idle timeout
            if (scrollIdleTimeoutRef.current) {
                clearTimeout(scrollIdleTimeoutRef.current);
                scrollIdleTimeoutRef.current = null;
            }
            if (holdAnimationRef.current) {
                cancelAnimationFrame(holdAnimationRef.current);
                holdAnimationRef.current = null;
            }

            // Start the reveal animation
            startRevealAnimation();
        } else {
            holdAnimationRef.current = requestAnimationFrame(updateHoldProgress);
        }
    }, [startRevealAnimation]);

    // === OVERSCROLL DETECTION FOR FORWARD (Easter Egg Trigger) ===
    useEffect(() => {
        // Only detect when: animation hasn't played, not animating, and section has settled
        if (animationComplete || isAnimating || !sectionSettled) return;

        const handleWheel = (e: WheelEvent) => {
            if (!isSectionInView()) {
                resetOverscrollState();
                return;
            }

            // User is trying to scroll DOWN past the "last" screen
            if (e.deltaY > 0) {
                if (!isOverscrollingRef.current) {
                    isOverscrollingRef.current = true;
                    holdStartTimeRef.current = performance.now();
                    setShowLoader(true);
                    holdAnimationRef.current = requestAnimationFrame(updateHoldProgress);
                }

                if (scrollIdleTimeoutRef.current) {
                    clearTimeout(scrollIdleTimeoutRef.current);
                }

                scrollIdleTimeoutRef.current = setTimeout(() => {
                    resetOverscrollState();
                }, SCROLL_IDLE_TIMEOUT_MS);

                e.preventDefault();
            } else if (e.deltaY < 0) {
                resetOverscrollState();
            }
        };

        // Touch tracking refs
        let touchStartY = 0;
        let lastTouchY = 0;
        let isTouchActive = false;

        const handleTouchStart = (e: TouchEvent) => {
            if (!isSectionInView()) return;
            touchStartY = e.touches[0].clientY;
            lastTouchY = touchStartY;
            isTouchActive = true;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isTouchActive || !isSectionInView()) {
                if (isOverscrollingRef.current) resetOverscrollState();
                return;
            }

            const touchCurrentY = e.touches[0].clientY;
            const totalDelta = touchStartY - touchCurrentY; // Total movement from start
            const frameDelta = lastTouchY - touchCurrentY; // Movement since last frame
            lastTouchY = touchCurrentY;

            // User is swiping UP (scrolling down) with significant movement
            if (totalDelta > 15) {
                // Prevent native scroll behavior
                e.preventDefault();

                if (!isOverscrollingRef.current) {
                    isOverscrollingRef.current = true;
                    holdStartTimeRef.current = performance.now();
                    setShowLoader(true);
                    holdAnimationRef.current = requestAnimationFrame(updateHoldProgress);
                }

                // Reset idle timeout on continued movement
                if (scrollIdleTimeoutRef.current) {
                    clearTimeout(scrollIdleTimeoutRef.current);
                }

                scrollIdleTimeoutRef.current = setTimeout(() => {
                    resetOverscrollState();
                }, SCROLL_IDLE_TIMEOUT_MS);
            } else if (totalDelta < -15) {
                // User is swiping down - reset
                resetOverscrollState();
            }
        };

        const handleTouchEnd = () => {
            isTouchActive = false;
            // Only reset after a delay if not triggered
            if (isOverscrollingRef.current && !holdTriggeredRef.current) {
                if (scrollIdleTimeoutRef.current) {
                    clearTimeout(scrollIdleTimeoutRef.current);
                }
                scrollIdleTimeoutRef.current = setTimeout(() => {
                    resetOverscrollState();
                }, 150);
            }
        };

        // Use passive: false for both wheel and touch to allow preventDefault
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            if (scrollIdleTimeoutRef.current) {
                clearTimeout(scrollIdleTimeoutRef.current);
            }
        };
    }, [isSectionInView, animationComplete, isAnimating, sectionSettled, updateHoldProgress, resetOverscrollState]);

    // === SCROLL UP DETECTION FOR REVERSE (After void assembly complete) ===
    useEffect(() => {
        // Only detect reverse when animation is complete and not currently animating
        if (!animationComplete || isAnimating) return;

        const handleWheel = (e: WheelEvent) => {
            if (!isSectionInView()) return;

            // Block ALL scrolling when animation is complete - user must trigger reverse
            e.preventDefault();

            // User scrolls UP - trigger reverse animation
            if (e.deltaY < 0) {
                startReverseAnimation();
            }
        };

        let touchStartY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            if (!isSectionInView()) return;
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isSectionInView()) return;

            // Block ALL touch scrolling when on name screen
            e.preventDefault();

            const touchCurrentY = e.touches[0].clientY;
            const deltaY = touchStartY - touchCurrentY;

            // Swiping DOWN (finger moves down = scrolling up) - trigger reverse
            if (deltaY < -20) {
                startReverseAnimation();
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [isSectionInView, animationComplete, isAnimating, startReverseAnimation]);

    // === BLOCK ALL SCROLL DURING ANIMATION ===
    useEffect(() => {
        if (!isAnimating) return;

        const blockScroll = (e: WheelEvent) => {
            if (isSectionInView()) {
                e.preventDefault();
            }
        };

        const blockTouch = (e: TouchEvent) => {
            if (isSectionInView()) {
                e.preventDefault();
            }
        };

        window.addEventListener('wheel', blockScroll, { passive: false });
        window.addEventListener('touchmove', blockTouch, { passive: false });

        return () => {
            window.removeEventListener('wheel', blockScroll);
            window.removeEventListener('touchmove', blockTouch);
        };
    }, [isAnimating, isSectionInView]);

    // === INTERRUPT HANDLERS (for any animation) ===
    useEffect(() => {
        if (!isAnimating) return;

        const handleInterrupt = () => {
            cancelAnimation();
        };

        // Only interrupt on key press, not on scroll (scroll controls the animation direction)
        window.addEventListener('keydown', handleInterrupt);

        return () => {
            window.removeEventListener('keydown', handleInterrupt);
        };
    }, [isAnimating, cancelAnimation]);

    // === CLEANUP ===
    useEffect(() => {
        return () => {
            if (holdAnimationRef.current) {
                cancelAnimationFrame(holdAnimationRef.current);
            }
            if (revealAnimationRef.current) {
                cancelAnimationFrame(revealAnimationRef.current);
            }
            if (scrollIdleTimeoutRef.current) {
                clearTimeout(scrollIdleTimeoutRef.current);
            }
        };
    }, []);

    // === LETTER CONFIGURATIONS ===
    const firstRowConfigs: LetterConfig[] = [
        { char: "M", axis: "y", direction: -1, speed: "slowest" },
        { char: "U", axis: "x", direction: -1, speed: "medium" },
        { char: "S", axis: "y", direction: 1, speed: "fast" },
        { char: "T", axis: "x", direction: 1, speed: "fast", isAnchor: true },
        { char: "A", axis: "x", direction: 1, speed: "fast" },
        { char: "F", axis: "y", direction: -1, speed: "medium" },
        { char: "A", axis: "y", direction: 1, speed: "slowest" },
    ];

    const secondRowConfigs: LetterConfig[] = [
        { char: "S", axis: "x", direction: -1, speed: "slowest" },
        { char: "I", axis: "y", direction: -1, speed: "medium" },
        { char: "D", axis: "y", direction: 1, speed: "fast" },
        { char: "D", axis: "x", direction: 1, speed: "fast" },
        { char: "I", axis: "y", direction: -1, speed: "medium" },
        { char: "Q", axis: "x", direction: -1, speed: "slowest" },
        { char: "U", axis: "y", direction: 1, speed: "medium" },
        { char: "I", axis: "x", direction: 1, speed: "fast" },
    ];

    // First row transforms
    const m0 = useLetterTransform(animationProgress, firstRowConfigs[0], isMobile);
    const u1 = useLetterTransform(animationProgress, firstRowConfigs[1], isMobile);
    const s2 = useLetterTransform(animationProgress, firstRowConfigs[2], isMobile);
    const t3 = useLetterTransform(animationProgress, firstRowConfigs[3], isMobile);
    const a4 = useLetterTransform(animationProgress, firstRowConfigs[4], isMobile);
    const f5 = useLetterTransform(animationProgress, firstRowConfigs[5], isMobile);
    const a6 = useLetterTransform(animationProgress, firstRowConfigs[6], isMobile);
    const firstRowTransforms = [m0, u1, s2, t3, a4, f5, a6];

    // Second row transforms
    const s0 = useLetterTransform(animationProgress, secondRowConfigs[0], isMobile);
    const i1 = useLetterTransform(animationProgress, secondRowConfigs[1], isMobile);
    const d2 = useLetterTransform(animationProgress, secondRowConfigs[2], isMobile);
    const d3 = useLetterTransform(animationProgress, secondRowConfigs[3], isMobile);
    const i4 = useLetterTransform(animationProgress, secondRowConfigs[4], isMobile);
    const q5 = useLetterTransform(animationProgress, secondRowConfigs[5], isMobile);
    const u6 = useLetterTransform(animationProgress, secondRowConfigs[6], isMobile);
    const i7 = useLetterTransform(animationProgress, secondRowConfigs[7], isMobile);
    const secondRowTransforms = [s0, i1, d2, d3, i4, q5, u6, i7];

    // === ANIMATION TRANSFORMS (linked to programmatic progress) ===
    const tScale = useTransform(animationProgress, [0.1, 0.80], [100, 1]);
    // Use higher damping to prevent overshoot, clamp to prevent negative values
    const tScaleSpring = useSpring(tScale, { stiffness: 50, damping: 30 });
    // Clamp scale to minimum 0.5 to prevent flip (negative scale = upside down)
    const smoothTScale = useTransform(tScaleSpring, (value) => Math.max(0.5, value));

    const bgWhiteOpacity = useTransform(animationProgress, [0.4, 0.7], [0, 1]);
    const smoothBgWhite = useSpring(bgWhiteOpacity, { stiffness: 40, damping: 25 });

    const letterOpacity = useTransform(animationProgress, [0.1, 0.75], [0, 1]);
    const smoothLetterOpacity = useSpring(letterOpacity, { stiffness: 30, damping: 20 });

    const letterBlur = useTransform(animationProgress, [0.1, 0.85], [25, 0]);
    const smoothLetterBlur = useSpring(letterBlur, { stiffness: 25, damping: 18 });
    const blurFilter = useMotionTemplate`blur(${smoothLetterBlur}px)`;

    // Contact content fades when animation starts (pure fade, no movement)
    const contentOpacity = useTransform(animationProgress, [0, 0.15], [1, 0]);
    const smoothContentOpacity = useSpring(contentOpacity, { stiffness: 60, damping: 25 });

    // Dynamic touch action - only block when actively overscrolling or animation is active
    const shouldBlockTouch = showLoader || isAnimating || animationComplete;

    return (
        <div
            ref={containerRef}
            className="relative h-screen"
            style={{
                // Prevent native browser overscroll bounce on this element
                overscrollBehaviorY: 'contain',
                // Only restrict touch when we need to (during easter egg interaction)
                touchAction: shouldBlockTouch ? 'none' : 'auto',
            }}
        >
            {/* Single screen container - appears as the "final" section */}
            <div className="relative w-full h-full overflow-hidden">

                {/* Layer 0: Solid Black Base */}
                <div className="absolute inset-0 z-0 bg-black" />

                {/* Layer 1: White Background - fades in during animation */}
                <motion.div
                    style={{ opacity: smoothBgWhite }}
                    className="absolute inset-0 z-[1] bg-white"
                />

                {/* Layer 2: The Void Assembly - Name Letters (hidden Easter egg) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-[10] pointer-events-none">

                    {/* First Row: MUSTAFA */}
                    <div className="flex items-center justify-center">
                        {firstRowConfigs.map((config, index) => {
                            const transform = firstRowTransforms[index];

                            if (config.isAnchor) {
                                return (
                                    <motion.span
                                        key={`first-${index}`}
                                        style={{
                                            scaleX: smoothTScale,
                                            scaleY: smoothTScale,
                                            transformOrigin: "52% 50%",
                                        }}
                                        className="text-black font-serif-bold text-4xl md:text-8xl tracking-tight leading-none inline-block"
                                    >
                                        {config.char}
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
                                        filter: blurFilter,
                                    }}
                                    className="text-black font-serif-bold text-4xl md:text-8xl tracking-tight leading-none inline-block"
                                >
                                    {config.char}
                                </motion.span>
                            );
                        })}
                    </div>

                    {/* Second Row: SIDDIQUI */}
                    <div className="flex items-center justify-center">
                        {secondRowConfigs.map((config, index) => {
                            const transform = secondRowTransforms[index];

                            return (
                                <motion.span
                                    key={`second-${index}`}
                                    style={{
                                        x: transform.x,
                                        y: transform.y,
                                        opacity: smoothLetterOpacity,
                                        filter: blurFilter,
                                    }}
                                    className="text-black font-serif-bold text-4xl md:text-8xl tracking-tight leading-none inline-block"
                                >
                                    {config.char}
                                </motion.span>
                            );
                        })}
                    </div>
                </div>

                {/* Layer 3: Contact Content - THE "FINAL" SCREEN */}
                <motion.div
                    ref={contentRef}
                    style={{
                        opacity: smoothContentOpacity,
                        pointerEvents: (isAnimating || animationComplete) ? 'none' : 'auto',
                    }}
                    className="relative z-[20] w-full h-full flex flex-col items-center justify-center"
                >
                    <div className="relative z-10 flex flex-col items-center text-center px-6 py-20">
                        <motion.h2
                            initial={{ opacity: 0, y: 40, filter: 'blur(12px)', scale: 1.02 }}
                            animate={hasAnimated ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : {}}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0 }}
                            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight max-w-4xl"
                        >
                            {title}
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 40, filter: 'blur(12px)', scale: 1.02 }}
                            animate={hasAnimated ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : {}}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                            className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light"
                        >
                            {subtitle}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 40, filter: 'blur(12px)', scale: 1.02 }}
                            animate={hasAnimated ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : {}}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                            className="flex flex-col md:flex-row gap-6 md:gap-12 mb-12 text-white/90"
                        >
                            <a
                                href={`mailto:${email}`}
                                className="flex items-center gap-3 hover:text-white transition-colors group"
                            >
                                <Mail className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300" />
                                <span className="text-sm md:text-base">{email}</span>
                            </a>

                            <a
                                href={`https://${linkedIn}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 hover:text-white transition-colors group"
                            >
                                <Linkedin className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300" />
                                <span className="text-sm md:text-base">{linkedIn}</span>
                            </a>

                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-emerald-400" />
                                <span className="text-sm md:text-base">{location}</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 40, filter: 'blur(12px)', scale: 1.02 }}
                            animate={hasAnimated ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : {}}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                            className="flex gap-6 mb-12"
                        >
                            <a
                                href={`https://${github}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Github className="w-6 h-6 cursor-pointer hover:text-white/60 transition-colors text-white" />
                            </a>
                            <a
                                href={`https://instagram.com/${instagram.replace("@", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Instagram className="w-6 h-6 cursor-pointer hover:text-white/60 transition-colors text-white" />
                            </a>
                            <a
                                href={`https://${linkedIn}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Linkedin className="w-6 h-6 cursor-pointer hover:text-white/60 transition-colors text-white" />
                            </a>
                            <a href={`mailto:${email}`}>
                                <Mail className="w-6 h-6 cursor-pointer hover:text-white/60 transition-colors text-white" />
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 40, filter: 'blur(12px)', scale: 1.02 }}
                            animate={hasAnimated ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : {}}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                        >
                            <Button
                                onClick={onCtaClick}
                                className="px-10 py-4 rounded-full text-lg font-semibold bg-emerald-500 text-black hover:bg-emerald-400 shadow-2xl shadow-emerald-900/30 transition-all duration-300 hover:scale-105 flex items-center gap-3 cursor-pointer"
                            >
                                {ctaText}
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 40, filter: 'blur(12px)', scale: 1.02 }}
                            animate={hasAnimated ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : {}}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                            className="mt-16 text-white/40 text-sm"
                        >
                            © 2026 All rights reserved.
                        </motion.p>
                    </div>
                </motion.div>

                {/* Layer 4: Overscroll Loader - appears only during hold, disappears on animation */}
                {showLoader && !isAnimating && !animationComplete && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[25] pointer-events-none">
                        <CircularLoader
                            progress={holdProgress}
                            isVisible={showLoader}
                        />
                    </div>
                )}

            </div>
        </div>
    );
};

export default ContactEndScreen;
