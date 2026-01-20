'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRef, useEffect, ReactNode, useState } from 'react';
import { ArrowUpRight, Zap, Code, Brain, Database, Globe, Sparkles, Layers, Heart, UtensilsCrossed } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, useGSAP);

// Dynamic imports with SSR disabled for Three.js components
const HeroFuturistic = dynamic(
  () => import('@/components/ui/hero-futuristic'),
  {
    ssr: false,
    loading: () => (
      <div className="h-svh w-full bg-black flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    )
  }
);

const SyntheticHeroBackground = dynamic(
  () => import('@/components/ui/synthetic-hero').then(mod => {
    const BackgroundOnly = () => {
      const { Canvas, useFrame, useThree } = require('@react-three/fiber');
      const { useMemo, useRef } = require('react');
      const THREE = require('three');

      const ShaderPlane = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const meshRef = useRef(null) as React.MutableRefObject<any>;
        const { size } = useThree();

        const uniforms = useMemo(() => ({
          u_time: { value: 0 },
          u_resolution: { value: new THREE.Vector3(1, 1, 1) },
        }), []);

        const vertexShader = `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `;

        const fragmentShader = `
          precision highp float;
          varying vec2 vUv;
          uniform float u_time;
          uniform vec3 u_resolution;

          vec2 toPolar(vec2 p) {
              float r = length(p);
              float a = atan(p.y, p.x);
              return vec2(r, a);
          }

          void mainImage(out vec4 fragColor, in vec2 fragCoord) {
              vec2 p = 6.0 * ((fragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y);
              vec2 polar = toPolar(p);
              float r = polar.x;
              vec2 i = p;
              float c = 0.0;
              float rot = r + u_time + p.x * 0.100;
              for (float n = 0.0; n < 4.0; n++) {
                  float rr = r + 0.15 * sin(u_time*0.7 + float(n) + r*2.0);
                  p *= mat2(
                      cos(rot - sin(u_time / 10.0)), sin(rot),
                      -sin(cos(rot) - u_time / 10.0), cos(rot)
                  ) * -0.25;
                  float t = r - u_time / (n + 30.0);
                  i -= p + sin(t - i.y) + rr;
                  c += 2.2 / length(vec2(
                      (sin(i.x + t) / 0.15),
                      (cos(i.y + t) / 0.15)
                  ));
              }
              c /= 8.0;
              vec3 baseColor = vec3(0.2, 0.7, 0.5);
              vec3 finalColor = baseColor * smoothstep(0.0, 1.0, c * 0.6);
              fragColor = vec4(finalColor, 1.0);
          }

          void main() {
              vec4 fragColor;
              vec2 fragCoord = vUv * u_resolution.xy;
              mainImage(fragColor, fragCoord);
              gl_FragColor = fragColor;
          }
        `;

        useFrame((state: { clock: { elapsedTime: number } }) => {
          if (meshRef.current) {
            const material = (meshRef.current as { material: { uniforms: { u_time: { value: number }, u_resolution: { value: { set: (x: number, y: number, z: number) => void } } } } }).material;
            if (material.uniforms) {
              material.uniforms.u_time.value = state.clock.elapsedTime * 0.5;
              material.uniforms.u_resolution.value.set(size.width, size.height, 1.0);
            }
          }
        });

        return (
          <mesh ref={meshRef}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
              vertexShader={vertexShader}
              fragmentShader={fragmentShader}
              uniforms={uniforms}
              side={THREE.FrontSide}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
        );
      };

      return (
        <Canvas>
          <ShaderPlane />
        </Canvas>
      );
    };
    return BackgroundOnly;
  }),
  { ssr: false }
);

const ContactEndScreen = dynamic(
  () => import('@/components/ui/contact-end-screen'),
  { ssr: false }
);

// Projects data
const projects = [
  {
    title: "WasteWise Pantry",
    subtitle: "AI-Powered Food Management",
    description: "The Problem: Food Waste is normalized negligence. The Response: Accountability, built into daily habits.",
    features: [
      "📸 AI image recognition to log groceries from a single photo",
      "🎙️ Voice-based logging when your hands are busy",
      "🍳 Zero-waste recipe suggestions using only what you have",
      "📈 Predictive buying hints based on consumption patterns",
      "🏢 Direct NGO donation support for surplus food",
      "💰 Savings tracker & analytics dashboard"
    ],
    tags: ["React", "Gemini API", "AI/ML"],
    image: "/wastewise-thumbnail.webp",
    icon: Zap,
    link: "https://wastewiseproject-jet.vercel.app",
    featured: true,
  },
  {
    title: "ACE",
    subtitle: "Mental Wellness Platform",
    description: "A digital sanctuary for mental restoration. Designed to facilitate deep relaxation through structured breathing and sound.",
    features: [
      "Scientifically-backed breathing techniques",
      "Guided meditation sessions",
      "Curated atmospheric playlists"
    ],
    tags: ["React", "Audio API", "Wellness"],
    image: "/ace.webp",
    icon: Heart,
    link: "#",
    featured: false,
  },
  {
    title: "Restaurant POS",
    subtitle: "Hospitality Operations System",
    description: "Precision management for local hospitality. A high-velocity system for inventory to final billing.",
    features: [
      "Item & ingredient management",
      "Streamlined order & billing",
      "Data intelligence & search",
      "Customer index integration"
    ],
    tags: ["React", "Node.js", "Database"],
    image: "/pos.webp",
    icon: UtensilsCrossed,
    link: "#",
    featured: false,
  }
];

// Skills data with enhanced descriptions
const skills = [
  { name: "Python & C++", icon: Code, description: "Building ML pipelines, automation scripts, and performance-critical systems" },
  { name: "Machine Learning", icon: Brain, description: "Model training, evaluation, and deployment with scikit-learn & TensorFlow" },
  { name: "Data Engineering", icon: Database, description: "ETL pipelines, data wrangling with Pandas/NumPy, and database design" },
  { name: "Web Development", icon: Globe, description: "Full-stack apps with React, Next.js, Node.js, and REST/GraphQL APIs" },
  { name: "AI APIs", icon: Sparkles, description: "Production integrations with OpenAI, Gemini, and custom AI services" },
  { name: "UI/UX Design", icon: Layers, description: "User-centered design in Figma, prototyping, and design system creation" },
];

// Animated Section Component with hero-style scroll-triggered animations
interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

const AnimatedSection = ({ children, className = '', staggerDelay = 0.08 }: AnimatedSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    // Find all direct animatable children
    const animatableElements = sectionRef.current.querySelectorAll('[data-animate]');

    if (animatableElements.length === 0) return;

    // Set initial state (matching hero animation)
    gsap.set(animatableElements, {
      opacity: 0,
      y: 40,
      filter: 'blur(12px)',
      scale: 1.02,
    });

    // Create scroll-triggered animation
    gsap.to(animatableElements, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      scale: 1,
      duration: 0.8,
      ease: 'power3.out',
      stagger: staggerDelay,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        end: 'top 20%',
        toggleActions: 'play none none reverse',
      },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={className}>
      {children}
    </section>
  );
};

const PortfolioContent = () => {
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get featured project and other projects
  const featuredProject = projects.find(p => p.featured);
  const otherProjects = projects.filter(p => !p.featured);

  return (
    <div className="relative z-10">
      {/* Vision Section: Headline & Quote */}
      <AnimatedSection className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 data-animate className="text-4xl md:text-6xl font-bold text-white mb-12 tracking-tight">
            Utility is the Only Benchmark
          </h2>
          <blockquote data-animate className="text-xl md:text-2xl text-emerald-100/90 font-light leading-relaxed italic border-l-4 border-emerald-400 pl-6 text-left max-w-3xl mx-auto">
            &quot;I trade hype for utility, architecting complete systems that feel like a natural extension of thought through Artificial Intelligence.&quot;
          </blockquote>
        </div>
      </AnimatedSection>

      {/* Academic Snapshot Section */}
      <AnimatedSection className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 data-animate className="text-3xl md:text-4xl font-bold text-white mb-16 text-center tracking-tight">
            Academic Snapshot
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-12">
            {[
              { label: "Current Year", value: "3rd" },
              { label: "CGPA", value: "8.76" },
              { label: "Graduation", value: "2027" },
              { label: "Focus", value: "AI" },
            ].map((stat, i) => (
              <div data-animate key={i} className="p-6 md:p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-emerald-400/30 transition-all duration-300 hover:scale-105">
                <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-3">{stat.value}</div>
                <div className="text-sm md:text-base text-emerald-100/60">{stat.label}</div>
              </div>
            ))}
          </div>
          <div data-animate className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <p className="text-lg md:text-xl text-white font-medium mb-2">
              AI & Data Science Undergraduate
            </p>
            <p className="text-emerald-100/60">
              K.B.T. College of Engineering, Nashik
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Skills Section - Enhanced */}
      <AnimatedSection className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-5xl mx-auto w-full">
          <h2 data-animate className="text-4xl md:text-5xl font-bold text-white mb-16 text-center tracking-tight">
            Skills & Expertise
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {skills.map((skill, i) => (
              <div
                data-animate
                key={i}
                className="group p-4 md:p-6 rounded-xl md:rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-emerald-400/50 transition-all duration-500 hover:scale-105 hover:bg-white/10"
              >
                <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
                  <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 transition-colors duration-300">
                    <skill.icon className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-sm md:text-lg font-semibold text-white">{skill.name}</h3>
                </div>
                <p className="text-emerald-100/70 text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-none">{skill.description}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Featured Project Section */}
      {featuredProject && (
        <AnimatedSection className="min-h-screen flex items-center justify-center px-6 py-20">
          <div className="max-w-5xl mx-auto w-full">
            <h2 data-animate className="text-4xl md:text-5xl font-bold text-white mb-16 text-center tracking-tight">
              Featured Project
            </h2>
            <div data-animate className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-emerald-400/50 transition-all duration-500">
              {/* Desktop Layout */}
              <div className="hidden md:grid md:grid-cols-2 gap-0">
                <div className="aspect-square overflow-hidden relative">
                  <Image
                    src={featuredProject.image}
                    alt={featuredProject.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQRBRIhBhMxQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEQA/AKOn6hquoWsF1bXFvHFMgkjEkbHKkZGcH5VWiigEcCKKKosxZj//2Q=="
                  />
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <featuredProject.icon className="w-7 h-7 text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-medium uppercase tracking-wider">{featuredProject.subtitle}</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">{featuredProject.title}</h3>
                  <p className="text-emerald-100/80 mb-6 text-base leading-relaxed">{featuredProject.description}</p>

                  <div className="space-y-2 mb-6">
                    {featuredProject.features.slice(0, 4).map((feature, j) => (
                      <p key={j} className="text-emerald-100/70 text-sm">{feature}</p>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {featuredProject.tags.map((tag, j) => (
                      <span key={j} className="px-4 py-2 text-sm bg-white/10 text-emerald-200 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a
                    href={featuredProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full transition-all duration-300 group/btn w-fit"
                  >
                    View Live Project
                    <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="aspect-video overflow-hidden relative">
                  <Image
                    src={featuredProject.image}
                    alt={featuredProject.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    loading="lazy"
                    decoding="async"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQRBRIhBhMxQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEQA/AKOn6hquoWsF1bXFvHFMgkjEkbHKkZGcH5VWiigEcCKKKosxZj//2Q=="
                  />
                </div>
                <div className="p-6 bg-white/5 backdrop-blur-md border-t border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <featuredProject.icon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-400 text-xs font-medium uppercase tracking-wider">{featuredProject.subtitle}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{featuredProject.title}</h3>
                  <p className="text-emerald-100/80 mb-4 text-sm leading-relaxed">{featuredProject.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {featuredProject.tags.map((tag, j) => (
                      <span key={j} className="px-3 py-1.5 text-xs bg-white/10 text-emerald-200 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a
                    href={featuredProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-full transition-all duration-300"
                  >
                    View Live Project
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Other Projects Section */}
      <AnimatedSection className="min-h-[70vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-5xl mx-auto w-full">
          <h2 data-animate className="text-3xl md:text-4xl font-bold text-white mb-12 text-center tracking-tight">
            More Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {otherProjects.map((project, i) => (
              <div
                data-animate
                key={i}
                className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-emerald-400/50 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="aspect-video overflow-hidden relative">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQRBRIhBhMxQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEQA/AKOn6hquoWsF1bXFvHFMgkjEkbHKkZGcH5VWiigEcCKKKosxZj//2Q=="
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <project.icon className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-medium uppercase tracking-wider">{project.subtitle}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                  <p className="text-emerald-100/70 text-sm mb-4 line-clamp-2">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, j) => (
                      <span key={j} className="px-3 py-1 text-xs bg-white/10 text-emerald-200 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Contact End Screen */}
      <ContactEndScreen
        title="I build things that run, not just slides that impress."
        subtitle="Ready to collaborate? Let's create utility-first solutions together."
        email="mustafa.siddiqui.work@gmail.com"
        linkedIn="linkedin.com/in/mustafa-siddiqui-work"
        github="github.com/Arghgone"
        instagram="@goesbymustafa"
        location="Nashik, Maharashtra, India"
        ctaText="Back to Top"
        firstName="MUSTAFA"
        lastName="SIDDIQUI"
        onCtaClick={handleBackToTop}
      />
    </div>
  );
};

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll to top on page load/refresh
  useEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    // Scroll to top immediately
    window.scrollTo(0, 0);
  }, []);

  return (
    <main ref={mainRef} className="bg-black">
      {/* Fixed background - WebGL animation restored */}
      <div className="fixed inset-0 z-0">
        <SyntheticHeroBackground />
      </div>

      {/* Hero Section */}
      <section className="relative z-10">
        <HeroFuturistic />
      </section>

      {/* Scrollable Portfolio Content */}
      <div className="relative z-10">
        <PortfolioContent />
      </div>
    </main>
  );
}
