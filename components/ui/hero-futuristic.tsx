'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useAspect, useTexture, Preload } from '@react-three/drei';
import { useMemo, useRef, useState, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { EffectComposer, Bloom, Scanline } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { ChevronDown } from 'lucide-react';

const TEXTUREMAP = { src: 'https://i.postimg.cc/XYwvXN8D/img-4.png' };
const DEPTHMAP = { src: 'https://i.postimg.cc/2SHKQh2q/raw-4.webp' };

// Custom shader material for depth-based parallax effect
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform sampler2D uDepthMap;
  uniform vec2 uPointer;
  uniform float uProgress;
  uniform float uTime;
  varying vec2 vUv;

  // Simple cell noise approximation
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float cellNoise(vec2 p) {
    vec2 i = floor(p);
    return hash(i);
  }

  void main() {
    float depth = texture2D(uDepthMap, vUv).r;
    
    // Parallax effect based on pointer and depth
    vec2 offset = uPointer * depth * 0.01;
    vec2 distortedUv = vUv + offset;
    
    vec4 color = texture2D(uTexture, distortedUv);
    
    // Dot matrix effect
    float aspect = 1.0;
    vec2 tUv = vec2(vUv.x * aspect, vUv.y);
    vec2 tiling = vec2(120.0);
    vec2 tiledUv = mod(tUv * tiling, 2.0) - 1.0;
    
    float brightness = cellNoise(tUv * tiling / 2.0);
    float dist = length(tiledUv);
    float dot = smoothstep(0.5, 0.49, dist) * brightness;
    
    // Scanning line effect
    float flow = 1.0 - smoothstep(0.0, 0.02, abs(depth - uProgress));
    vec3 mask = vec3(10.0, 0.0, 0.0) * dot * flow;
    
    // Blend screen
    vec3 finalColor = 1.0 - (1.0 - color.rgb) * (1.0 - mask);
    
    gl_FragColor = vec4(finalColor, color.a);
  }
`;

const Scene = () => {
    const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src]);

    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (rawMap && depthMap) {
            setVisible(true);
        }
    }, [rawMap, depthMap]);

    const uniforms = useMemo(() => ({
        uTexture: { value: rawMap },
        uDepthMap: { value: depthMap },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uProgress: { value: 0 },
        uTime: { value: 0 },
    }), [rawMap, depthMap]);

    const [w, h] = useAspect(300, 300);

    useFrame(({ clock, pointer }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uProgress.value =
                Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5;
            materialRef.current.uniforms.uPointer.value.set(pointer.x, pointer.y);
            materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
        }

        // Fade in effect
        if (meshRef.current) {
            const currentOpacity = meshRef.current.material instanceof THREE.ShaderMaterial
                ? (meshRef.current.material as any).opacity
                : 1;
            const targetOpacity = visible ? 1 : 0;
            if (meshRef.current.material instanceof THREE.ShaderMaterial) {
                (meshRef.current.material as any).opacity = THREE.MathUtils.lerp(
                    currentOpacity,
                    targetOpacity,
                    0.07
                );
            }
        }
    });

    const scaleFactor = 0.40;

    return (
        <mesh ref={meshRef} scale={[w * scaleFactor, h * scaleFactor, 1]}>
            <planeGeometry />
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
            />
        </mesh>
    );
};

// Animated scan line overlay
const ScanLineOverlay = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const { viewport } = useThree();

    const scanUniforms = useMemo(() => ({
        uTime: { value: 0 },
        uScanProgress: { value: 0 },
    }), []);

    const scanVertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const scanFragmentShader = `
        uniform float uScanProgress;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
            float scanWidth = 0.03;
            float scanLine = smoothstep(0.0, scanWidth, abs(vUv.y - uScanProgress));
            
            vec3 redGlow = vec3(1.0, 0.0, 0.0) * (1.0 - scanLine) * 0.5;
            
            // Add subtle horizontal lines
            float lines = sin(vUv.y * 800.0) * 0.5 + 0.5;
            lines = smoothstep(0.4, 0.6, lines) * 0.03;
            
            float alpha = (1.0 - scanLine) * 0.4 + lines;
            
            gl_FragColor = vec4(redGlow + vec3(lines * 0.5), alpha);
        }
    `;

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uScanProgress.value =
                Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5;
            materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 0, 1]} scale={[viewport.width, viewport.height, 1]}>
            <planeGeometry />
            <shaderMaterial
                ref={materialRef}
                vertexShader={scanVertexShader}
                fragmentShader={scanFragmentShader}
                uniforms={scanUniforms}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
};

// Post-processing effects
// Post-processing effects
const Effects = ({ isMobile }: { isMobile: boolean }) => {
    // Restore Bloom for everyone, relying on "pause when hidden" for performance
    return (
        <EffectComposer>
            <Bloom
                intensity={0.8}
                luminanceThreshold={0.4}
                luminanceSmoothing={0.9}
                mipmapBlur
            />
            <Scanline
                blendFunction={BlendFunction.OVERLAY}
                density={1.2}
                opacity={0.08}
            />
        </EffectComposer>
    );
};


interface HeroFuturisticProps {
    onExploreClick?: () => void;
}

export const Html = ({ onExploreClick }: HeroFuturisticProps) => {
    const titleWords = 'Mustafa Siddiqui'.split(' ');
    const subtitle = 'AI & Data Science Undergraduate | Systems Builder';
    const [visibleWords, setVisibleWords] = useState(0);
    const [subtitleVisible, setSubtitleVisible] = useState(false);
    const [delays, setDelays] = useState<number[]>([]);
    const [subtitleDelay, setSubtitleDelay] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [isInView, setIsInView] = useState(true);
    const heroRef = useRef<HTMLDivElement>(null);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Intersection Observer to pause Canvas when out of view
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0 } // Trigger when even 1px is visible
        );

        if (heroRef.current) {
            observer.observe(heroRef.current);
        }

        return () => {
            if (heroRef.current) {
                observer.unobserve(heroRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setDelays(titleWords.map(() => Math.random() * 0.07));
        setSubtitleDelay(Math.random() * 0.1);
    }, [titleWords.length]);

    useEffect(() => {
        if (visibleWords < titleWords.length) {
            const timeout = setTimeout(() => setVisibleWords(visibleWords + 1), 600);
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => setSubtitleVisible(true), 800);
            return () => clearTimeout(timeout);
        }
    }, [visibleWords, titleWords.length]);

    const handleExploreClick = () => {
        // Scroll to next section
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        });
        if (onExploreClick) {
            onExploreClick();
        }
    };

    return (
        <div ref={heroRef} className="h-svh relative">
            {/* Text overlay */}
            <div className="h-svh uppercase items-center w-full absolute z-10 pointer-events-none px-10 flex justify-center flex-col">
                <div className="text-3xl md:text-5xl xl:text-6xl 2xl:text-7xl font-extrabold">
                    <div className="flex space-x-2 lg:space-x-6 overflow-hidden text-white">
                        {titleWords.map((word, index) => (
                            <div
                                key={index}
                                className={index < visibleWords ? 'fade-in' : ''}
                                style={{ animationDelay: `${index * 0.13 + (delays[index] || 0)}s`, opacity: index < visibleWords ? undefined : 0 }}
                            >
                                {word}
                            </div>
                        ))}
                    </div>
                </div>
                <div
                    className="text-xs md:text-xl xl:text-2xl 2xl:text-3xl mt-2 overflow-hidden text-white font-bold text-center"
                    style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.6)' }}
                >
                    <div
                        className={subtitleVisible ? 'fade-in-subtitle' : ''}
                        style={{ animationDelay: `${titleWords.length * 0.13 + 0.2 + subtitleDelay}s`, opacity: subtitleVisible ? undefined : 0 }}
                    >
                        {subtitle}
                    </div>
                </div>
            </div>

            {/* Centered explore button - scroll indicator */}
            <button
                onClick={handleExploreClick}
                className="explore-btn"
                style={{ animationDelay: '2.2s' }}
            >
                Scroll to explore
                <span className="explore-arrow">
                    <ChevronDown className="w-6 h-6" />
                </span>
            </button>

            {/* Canvas - Restored for all devices */}
            <Canvas
                frameloop={isInView ? "always" : "never"}
                gl={{ antialias: true, alpha: true }}
                camera={{ position: [0, 0, 5], fov: 50 }}
                className="absolute inset-0"
            >
                <Suspense fallback={null}>
                    <Scene />
                    <ScanLineOverlay />
                    <Preload all />
                </Suspense>
                {/* Effects: Heavy Bloom disabled on mobile, Scanlines always enabled */}
                <Effects isMobile={isMobile} />
            </Canvas>
        </div>
    );
};

export default Html;

