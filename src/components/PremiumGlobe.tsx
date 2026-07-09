import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Site = {
  name: string;
  country: string;
  status: "Live" | "Coming soon";
  icon: "airport" | "stadium" | "pin";
  lat: number;
  lon: number;
  text: string;
};

const SITES: Site[] = [
  {
    name: "Dallas",
    country: "USA",
    status: "Live",
    icon: "airport",
    lat: 32.9,
    lon: -97.0,
    text: "DFW International Airport — solar towers powering one of the busiest airports in the US. Also deployed across FIFA World Cup fan zones.",
  },
  {
    name: "Houston",
    country: "USA",
    status: "Live",
    icon: "stadium",
    lat: 29.76,
    lon: -95.37,
    text: "FIFA World Cup fan zones — clean power for the world's biggest sporting event.",
  },
  {
    name: "Munich",
    country: "Germany",
    status: "Coming soon",
    icon: "pin",
    lat: 48.14,
    lon: 11.58,
    text: "Next deployment underway in the heart of Germany.",
  },
  {
    name: "Malaga",
    country: "Spain",
    status: "Coming soon",
    icon: "pin",
    lat: 36.72,
    lon: -4.42,
    text: "Upcoming installation on the Spanish coast.",
  },
];

function latLonToVec3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function Icon({ type }: { type: Site["icon"] }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (type === "airport")
    return (
      <svg {...common}>
        <path d="M2 14l20-6-2.5 8-5 1-3.5 4-1-4-8-3Z" />
      </svg>
    );
  if (type === "stadium")
    return (
      <svg {...common}>
        <ellipse cx="12" cy="10" rx="9" ry="4" />
        <path d="M3 10v4c0 2.2 4 4 9 4s9-1.8 9-4v-4" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function PremiumGlobe() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<Site | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    mount.appendChild(renderer.domElement);

    const earthGroup = new THREE.Group();
    earthGroup.rotation.x = 0.42;
    scene.add(earthGroup);

    const RADIUS = 1;
    const loader = new THREE.TextureLoader();

    const dayTex = loader.load("/earth.jpg");
    dayTex.colorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.SphereGeometry(RADIUS, 64, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTex },
        warmth: { value: 1.05 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform float warmth;
        varying vec2 vUv;
        void main() {
          vec3 tex = texture2D(dayTexture, vUv).rgb;

          float lum = dot(tex, vec3(0.299, 0.587, 0.114));
          float maxChan = max(max(tex.r, tex.g), tex.b);
          float minChan = min(min(tex.r, tex.g), tex.b);
          float sat = maxChan - minChan;
          float blueLead = tex.b - max(tex.r, tex.g);

          float isDeepOcean = smoothstep(0.1, 0.28, blueLead);
          float isShallowOcean = smoothstep(0.03, 0.14, blueLead) * (1.0 - smoothstep(0.08, 0.2, blueLead));
          float isVegetation = smoothstep(0.02, 0.14, tex.g - tex.r * 0.88) * smoothstep(0.0, 0.1, tex.g - tex.b * 0.92);
          float isDesert = smoothstep(0.06, 0.2, tex.r - tex.g) * smoothstep(0.04, 0.16, tex.r - tex.b * 0.95);
          float isIce = smoothstep(0.62, 0.78, lum) * smoothstep(0.04, 0.22, sat);

          vec3 dayColor = tex;

          vec3 deepTurquoise = vec3(0.28, 0.74, 0.94);
          vec3 shallowTurquoise = vec3(0.42, 0.92, 1.0);
          dayColor = mix(dayColor, mix(deepTurquoise, dayColor, 0.28), isDeepOcean);
          dayColor = mix(dayColor, vec3(tex.r * 0.48, min(tex.g * 1.08, 1.0), min(tex.b * 1.38, 1.0)), isDeepOcean);
          dayColor = mix(dayColor, shallowTurquoise, isShallowOcean * 0.52);
          dayColor = mix(dayColor, vec3(tex.r * 0.52, min(tex.g * 1.12, 1.0), min(tex.b * 1.45, 1.0)), isShallowOcean);

          vec3 lushGreen = vec3(0.48, 0.96, 0.52);
          dayColor = mix(dayColor, lushGreen, isVegetation * 0.38);
          dayColor = mix(dayColor, vec3(tex.r * 0.68, min(tex.g * 1.45, 1.0), tex.b * 0.68), isVegetation);

          dayColor = mix(dayColor, vec3(min(tex.r * 1.1, 1.0), tex.g * 0.94, tex.b * 0.76), isDesert);
          dayColor = mix(dayColor, vec3(min(tex.r * 1.06, 1.0), min(tex.g * 1.06, 1.0), min(tex.b * 1.02, 1.0)), isIce);
          dayColor = min(dayColor * vec3(1.05 * warmth, 1.08 * warmth, 1.06 * warmth), vec3(1.0));

          gl_FragColor = vec4(dayColor, 1.0);
        }`,
    });
    const earth = new THREE.Mesh(geometry, material);
    earthGroup.add(earth);

    const cloudTex = loader.load("/clouds.jpg");
    const cloudGeo = new THREE.SphereGeometry(RADIUS * 1.01, 64, 64);
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      alphaMap: cloudTex,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(clouds);

    const markers: { mesh: THREE.Mesh; site: Site }[] = [];
    SITES.forEach((site) => {
      const pos = latLonToVec3(site.lat, site.lon, RADIUS * 1.02);
      const mGeo = new THREE.SphereGeometry(0.024, 16, 16);
      const mMat = new THREE.MeshBasicMaterial({
        color: 0xa67a0e,
        transparent: site.status === "Coming soon",
        opacity: site.status === "Coming soon" ? 0.55 : 1,
      });
      const marker = new THREE.Mesh(mGeo, mMat);
      marker.position.copy(pos);
      earthGroup.add(marker);
      markers.push({ mesh: marker, site });
    });

    const ambient = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambient);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let dragging = false;
    let lastX = 0;
    const velocity = 0.0015;
    let manualRot = 0;

    function checkHover(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(markers.map((m) => m.mesh));
      if (hits.length > 0) {
        const hit = markers.find((m) => m.mesh === hits[0].object);
        if (hit) setActive(hit.site);
      } else {
        setActive(null);
      }
    }

    function onPointerDown(e: PointerEvent) {
      dragging = true;
      lastX = e.clientX;
    }
    function onPointerMove(e: PointerEvent) {
      if (dragging) {
        const dx = e.clientX - lastX;
        manualRot += dx * 0.005;
        lastX = e.clientX;
      } else {
        checkHover(e);
      }
    }
    function onPointerUp() {
      dragging = false;
    }

    const el = renderer.domElement;
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);

    let frame = 0;
    function animate() {
      frame = requestAnimationFrame(animate);
      if (!dragging) manualRot += velocity;
      earthGroup.rotation.y = manualRot;
      clouds.rotation.y += 0.0004;
      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      const w = mountRef.current!.clientWidth;
      const h = mountRef.current!.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section className="janta-globe" aria-label="Global deployments">
      <div className="janta-globe__header">
        <p className="janta-globe__eyebrow">Janta in the world</p>
        <h2 className="janta-globe__title">Powering the world, one tower at a time.</h2>
      </div>

      <div className="janta-globe__stage">
        <div className="janta-globe__canvas" ref={mountRef} />

        {active && (
          <div className="janta-globe__panel">
            <div className="janta-globe__panel-icon">
              <Icon type={active.icon} />
            </div>
            <span className="janta-globe__panel-loc">
              {active.name} · {active.country}
            </span>
            <span className="janta-globe__panel-status" data-status={active.status}>
              {active.status}
            </span>
            <p className="janta-globe__panel-text">{active.text}</p>
          </div>
        )}
      </div>

      <p className="janta-globe__hint">Drag to rotate · hover a point to explore</p>

      <style>{`
        .janta-globe {
          position: relative;
          color: var(--web-ink, #1a1a1f);
          padding: clamp(3rem, 7vh, 4.5rem) 1.5rem clamp(3.5rem, 7vh, 4.5rem);
          overflow: visible;
          background: transparent;
        }
        .janta-globe__header {
          text-align: center;
          margin-bottom: 2rem;
          margin-top: clamp(0.5rem, 2vh, 1.25rem);
          position: relative;
          z-index: 2;
        }
        .janta-globe__eyebrow {
          margin: 0 0 0.9rem;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #8a6208;
        }
        .janta-globe__title {
          margin: 0 auto;
          max-width: 16ch;
          font-size: clamp(1.6rem, 4vw, 2.6rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          color: var(--web-ink, #1a1a1f);
        }
        .janta-globe__title-accent {
          color: #1e5a9e;
        }
        .janta-globe__stage {
          position: relative;
          max-width: 100%;
          margin: 0 auto;
          z-index: 1;
        }
        .janta-globe__canvas {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 620px;
          cursor: default;
          filter: drop-shadow(0 18px 36px rgba(42, 96, 175, 0.1));
        }
        .janta-globe__panel {
          position: absolute;
          left: 5%;
          bottom: 5%;
          width: min(320px, 80%);
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(30, 82, 158, 0.24);
          border-radius: 16px;
          padding: 1.5rem;
          text-align: left;
          backdrop-filter: blur(10px);
          pointer-events: none;
          z-index: 2;
          box-shadow:
            0 16px 40px rgba(42, 108, 190, 0.12),
            0 8px 24px rgba(168, 118, 8, 0.08);
        }
        .janta-globe__panel-icon {
          color: #7a5606;
          margin-bottom: 0.85rem;
        }
        .janta-globe__panel-loc {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #1e5a9e;
          margin-bottom: 0.6rem;
        }
        .janta-globe__panel-status {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.25rem 0.7rem;
          border-radius: 999px;
          border: 1px solid rgba(138, 98, 8, 0.5);
          color: #7a5606;
          background: rgba(176, 124, 6, 0.14);
          margin-bottom: 0.85rem;
        }
        .janta-globe__panel-text {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.6;
          color: rgba(30, 30, 35, 0.72);
        }
        .janta-globe__hint {
          text-align: center;
          margin: 2rem 0 0;
          font-size: 0.78rem;
          letter-spacing: 0.05em;
          color: rgba(30, 30, 35, 0.45);
          position: relative;
          z-index: 2;
        }
      `}</style>
    </section>
  );
}