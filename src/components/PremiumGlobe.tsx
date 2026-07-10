import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Icon, SITES, type Site } from "./globeSites";

function latLonToVec3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export function PremiumGlobe() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  // Detail card follows the hovered/selected site; default to the first so the
  // right-hand panel is never empty on load.
  const [active, setActive] = useState<Site>(SITES[0]);
  // Index of the site the globe should rotate to face (set from the list);
  // null = free auto-rotation. Read inside the three.js loop.
  const focusRef = useRef<number | null>(null);

  const selectSite = (i: number) => {
    setActive(SITES[i]);
    focusRef.current = i;
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    // Cap the pixel ratio lower on phones/tablets — a 3x device would otherwise
    // do ~2x the fragment work this section needs.
    const coarse =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
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
    const nightTex = loader.load("/earth_night.jpg");
    nightTex.colorSpace = THREE.SRGBColorSpace;

    // Sun fixed in view space (upper-left, toward camera) so the side facing the
    // viewer stays well lit, with a soft terminator + city lights on the limb.
    const sunDirection = new THREE.Vector3(-0.55, 0.35, 0.75).normalize();

    const geometry = new THREE.SphereGeometry(RADIUS, 64, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTex },
        nightTexture: { value: nightTex },
        sunDirection: { value: sunDirection },
        warmth: { value: 1.05 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vViewPos = mv.xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;
        uniform float warmth;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPos;
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

          // —— lighting: view-space sun terminator ——
          vec3 N = normalize(vNormal);
          float sun = dot(N, normalize(sunDirection));
          float dayAmount = smoothstep(-0.16, 0.24, sun);

          // shade the lit side by sun angle for real dimensionality
          vec3 lit = dayColor * (0.42 + 0.72 * clamp(sun, 0.0, 1.0));

          // warm city lights on the night side (earth_night.jpg)
          vec3 nightSample = texture2D(nightTexture, vUv).rgb;
          vec3 cityLights = nightSample * vec3(1.3, 1.02, 0.6) * 2.3;

          vec3 color = mix(cityLights, lit, dayAmount);

          // atmospheric rim (fresnel), stronger on the lit limb
          vec3 V = normalize(-vViewPos);
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
          color += vec3(0.34, 0.6, 1.0) * fresnel * (0.35 + 0.65 * dayAmount) * 0.9;

          gl_FragColor = vec4(color, 1.0);
        }`,
    });
    const earth = new THREE.Mesh(geometry, material);
    earthGroup.add(earth);

    // Clouds, shaded by the same sun so they darken on the night side.
    const cloudTex = loader.load("/clouds.jpg");
    const cloudGeo = new THREE.SphereGeometry(RADIUS * 1.012, 64, 64);
    const cloudMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        cloudTexture: { value: cloudTex },
        sunDirection: { value: sunDirection },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D cloudTexture;
        uniform vec3 sunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          float c = texture2D(cloudTexture, vUv).r;
          float sun = dot(normalize(vNormal), normalize(sunDirection));
          float dayAmount = smoothstep(-0.1, 0.32, sun);
          vec3 col = vec3(1.0) * (0.16 + 0.84 * dayAmount);
          float a = c * 0.5 * (0.22 + 0.78 * dayAmount);
          gl_FragColor = vec4(col, a);
        }`,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(clouds);

    // (No outer halo — an additive atmosphere glow needs a dark backdrop; on
    // this light section the earth's own rim-fresnel provides the blue edge.)

    const up = new THREE.Vector3(0, 1, 0);
    const markers: { mesh: THREE.Mesh; site: Site }[] = [];
    SITES.forEach((site) => {
      const normal = latLonToVec3(site.lat, site.lon, 1).normalize();
      const pos = normal.clone().multiplyScalar(RADIUS * 1.02);
      const live = site.status === "Live";

      // Marker dot at the surface.
      const mGeo = new THREE.SphereGeometry(0.022, 16, 16);
      const mMat = new THREE.MeshBasicMaterial({
        color: 0xffbf14,
        transparent: !live,
        opacity: live ? 1 : 0.55,
      });
      const marker = new THREE.Mesh(mGeo, mMat);
      marker.position.copy(pos);
      earthGroup.add(marker);
      markers.push({ mesh: marker, site });

      // Beam of light rising radially out of the deployment.
      const beamH = live ? 0.36 : 0.22;
      const beamGeo = new THREE.CylinderGeometry(0.005, 0.02, beamH, 16, 1, true);
      beamGeo.translate(0, beamH / 2, 0); // base at origin
      const beamMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { intensity: { value: live ? 1.0 : 0.5 } },
        vertexShader: `
          varying float vY;
          void main() {
            vY = uv.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform float intensity;
          varying float vY;
          void main() {
            float a = pow(1.0 - vY, 1.6) * intensity;
            vec3 col = vec3(1.0, 0.78, 0.2);
            gl_FragColor = vec4(col, a * 0.8);
          }`,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.copy(pos);
      beam.quaternion.setFromUnitVectors(up, normal);
      earthGroup.add(beam);
    });

    const ambient = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambient);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let dragging = false;
    let lastX = 0;
    const slowVel = 0.0006; // near a deployment — lingers
    const fastVel = 0.0042; // empty ocean stretches — glides
    let manualRot = 0;
    const siteDirs = SITES.map((s) => latLonToVec3(s.lat, s.lon, 1).normalize());
    const tmpDir = new THREE.Vector3();
    const tmpEuler = new THREE.Euler(earthGroup.rotation.x, 0, 0);

    // The y-rotation that brings a site's marker closest to facing the viewer
    // (max +z after the group's fixed x-tilt). Found by a coarse-then-fine sweep.
    function facingZ(dir: THREE.Vector3, y: number) {
      tmpEuler.set(earthGroup.rotation.x, y, 0);
      return tmpDir.copy(dir).applyEuler(tmpEuler).z;
    }
    function targetRotFor(idx: number) {
      const d = siteDirs[idx];
      let best = 0;
      let bestZ = -Infinity;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 45) {
        const z = facingZ(d, a);
        if (z > bestZ) { bestZ = z; best = a; }
      }
      for (let a = best - 0.08; a <= best + 0.08; a += 0.004) {
        const z = facingZ(d, a);
        if (z > bestZ) { bestZ = z; best = a; }
      }
      return best;
    }
    let lastFocus: number | null | undefined = undefined;
    let focusTarget: number | null = null;

    function checkHover(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(markers.map((m) => m.mesh));
      if (hits.length > 0) {
        const hit = markers.find((m) => m.mesh === hits[0].object);
        if (hit) setActive(hit.site);
      }
      // No hit → keep the last site shown so the detail card stays populated.
    }

    function onPointerDown(e: PointerEvent) {
      dragging = true;
      lastX = e.clientX;
      focusRef.current = null; // dragging hands control back to the user
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

    // Only render while the globe is on-screen and the tab is visible — the
    // section stays mounted after scroll, so without this the loop would keep
    // burning GPU/battery on mobile the whole time you're further down the page.
    let frame = 0;
    let onScreen = true;
    function loop() {
      if (!onScreen || document.hidden) {
        frame = 0; // pause; kick() restarts when we're visible again
        return;
      }
      frame = requestAnimationFrame(loop);
      animateStep();
    }
    function kick() {
      if (!frame && onScreen && !document.hidden) frame = requestAnimationFrame(loop);
    }
    function animateStep() {
      // Recompute the focus target only when the selected site changes.
      if (focusRef.current !== lastFocus) {
        lastFocus = focusRef.current;
        focusTarget = focusRef.current == null ? null : targetRotFor(focusRef.current);
      }

      if (!dragging) {
        if (focusTarget != null) {
          // Ease toward the selected site along the shortest arc, then hold.
          let diff = focusTarget - manualRot;
          diff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
          manualRot += diff * 0.09;
        } else {
          // Slow down when a deployment is rotating toward the viewer.
          let maxFacing = -1;
          for (const d of siteDirs) {
            tmpDir.copy(d).applyEuler(earthGroup.rotation);
            if (tmpDir.z > maxFacing) maxFacing = tmpDir.z;
          }
          const proximity = THREE.MathUtils.smoothstep(maxFacing, 0.2, 0.9);
          manualRot += fastVel + (slowVel - fastVel) * proximity;
        }
      }
      earthGroup.rotation.y = manualRot;
      clouds.rotation.y += 0.0004;
      renderer.render(scene, camera);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        kick();
      },
      { threshold: 0 },
    );
    io.observe(mount);
    const onVisibility = () => kick();
    document.addEventListener("visibilitychange", onVisibility);
    kick();

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
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
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
        <ul className="janta-globe__sites" aria-label="Deployment sites">
          {SITES.map((site, i) => (
            <li key={site.name}>
              <button
                type="button"
                className={
                  "janta-globe__site" +
                  (active.name === site.name ? " is-active" : "")
                }
                onClick={() => selectSite(i)}
                onMouseEnter={() => setActive(site)}
              >
                <span className="janta-globe__site-icon">
                  <Icon type={site.icon} />
                </span>
                <span className="janta-globe__site-main">
                  <span className="janta-globe__site-name">
                    {site.name} <em>{site.country}</em>
                  </span>
                  <span
                    className="janta-globe__site-status"
                    data-status={site.status}
                  >
                    {site.status}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="janta-globe__canvas" ref={mountRef} />

        <div className="janta-globe__panel" key={active.name}>
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
      </div>

      <p className="janta-globe__hint">
        Select a site or drag the globe to explore
      </p>

      <style>{`
        .janta-globe {
          position: relative;
          color: var(--web-ink, #1a1a1f);
          padding: clamp(2rem, 4.5vh, 3rem) 1.5rem clamp(2.25rem, 5vh, 3.25rem);
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
          color: #c8930a;
        }
        .janta-globe__title {
          margin: 0 auto;
          max-width: 16ch;
          font-size: clamp(1.6rem, 4vw, 2.6rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          color: var(--web-slate-ink, #1a2332);
        }
        .janta-globe__title-accent {
          color: #1e5a9e;
        }
        .janta-globe__stage {
          position: relative;
          max-width: 1180px;
          margin: 0 auto;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(190px, 230px) minmax(0, 1fr) minmax(200px, 260px);
          align-items: center;
          gap: clamp(0.75rem, 2vw, 1.75rem);
        }
        .janta-globe__canvas {
          position: relative;
          z-index: 1;
          width: 100%;
          height: clamp(480px, 62vh, 640px);
          cursor: default;
          filter: drop-shadow(0 18px 36px rgba(42, 96, 175, 0.12));
        }
        .janta-globe__sites {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 2;
        }
        .janta-globe__site {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          width: 100%;
          text-align: left;
          padding: 0.7rem 0.8rem;
          border-radius: 12px;
          border: 1px solid rgba(30, 82, 158, 0.14);
          background: rgba(255, 255, 255, 0.55);
          color: inherit;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease,
            transform 0.18s ease, box-shadow 0.18s ease;
        }
        .janta-globe__site:hover {
          background: rgba(255, 255, 255, 0.88);
          border-color: rgba(30, 82, 158, 0.28);
        }
        .janta-globe__site.is-active {
          background: #ffffff;
          border-color: rgba(30, 82, 158, 0.4);
          box-shadow: 0 10px 26px rgba(42, 108, 190, 0.14);
          transform: translateX(3px);
        }
        .janta-globe__site-icon {
          color: #c8930a;
          display: flex;
          flex: none;
        }
        .janta-globe__site-main {
          display: flex;
          flex-direction: column;
          gap: 0.22rem;
          min-width: 0;
        }
        .janta-globe__site-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--web-slate-ink, #1a2332);
        }
        .janta-globe__site-name em {
          font-style: normal;
          font-weight: 600;
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(30, 30, 35, 0.5);
          margin-left: 0.2rem;
        }
        .janta-globe__site-status {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .janta-globe__site-status[data-status="Live"] {
          color: #1f8a4c;
        }
        .janta-globe__site-status[data-status="Coming soon"] {
          color: #a6790a;
        }
        .janta-globe__panel {
          width: 100%;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(30, 82, 158, 0.24);
          border-radius: 16px;
          padding: 1.5rem;
          text-align: left;
          backdrop-filter: blur(10px);
          z-index: 2;
          box-shadow:
            0 16px 40px rgba(42, 108, 190, 0.12),
            0 8px 24px rgba(168, 118, 8, 0.08);
          animation: janta-globe-panel-in 0.28s ease both;
        }
        @keyframes janta-globe-panel-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @media (max-width: 920px) {
          .janta-globe__stage {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .janta-globe__sites {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 0.35rem;
          }
          .janta-globe__site {
            min-width: 190px;
            flex: 0 0 auto;
          }
          .janta-globe__panel {
            max-width: 560px;
            margin: 0 auto;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .janta-globe__panel {
            animation: none;
          }
        }
        .janta-globe__panel-icon {
          color: #c8930a;
          margin-bottom: 0.85rem;
        }
        .janta-globe__panel-loc {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--web-brand-blue, #3a84dc);
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
          border: 1px solid rgba(200, 147, 10, 0.5);
          color: #a6790a;
          background: rgba(200, 147, 10, 0.14);
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