import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { api } from "../services/api";
import { Community } from "../types";
import { Info } from "lucide-react";

const CATEGORY_COLOR: Record<string, number> = {
  CRITICAL: 0xe1443f,
  "VERY HIGH": 0xef8c2b,
  HIGH: 0xef8c2b,
  MODERATE: 0xe0b93f,
  LOW: 0x3fb279,
};

export default function Terrain3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selected, setSelected] = useState<Community | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.communityRanking(200).then((r) => setCommunities(r.results));
  }, []);

  useEffect(() => {
    if (!mountRef.current || communities.length === 0) return;
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c16);
    scene.fog = new THREE.FogExp2(0x060c16, 0.028);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(38, 30, 46);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 15;
    controls.maxDistance = 110;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.target.set(0, 2, 0);

    // ---- lighting ----
    scene.add(new THREE.AmbientLight(0x9fb8c9, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(30, 45, 20);
    scene.add(dir);
    const rim = new THREE.PointLight(0x2fc0ae, 1.2, 120);
    rim.position.set(-30, 20, -30);
    scene.add(rim);

    // ---- ground grid ----
    const grid = new THREE.GridHelper(70, 28, 0x1f374e, 0x14293d);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.55;
    scene.add(grid);

    const groundGeo = new THREE.PlaneGeometry(70, 70);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0b1826, roughness: 1, metalness: 0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    // ---- normalize community coordinates into plane space ----
    const lats = communities.map((c) => c.lat);
    const lons = communities.map((c) => c.lon);
    const latMin = Math.min(...lats), latMax = Math.max(...lats);
    const lonMin = Math.min(...lons), lonMax = Math.max(...lons);
    const SPAN = 58;

    const barGroup = new THREE.Group();
    const meshToCommunity = new Map<THREE.Object3D, Community>();

    communities.forEach((c) => {
      const nx = (c.lon - lonMin) / (lonMax - lonMin || 1);
      const nz = (c.lat - latMin) / (latMax - latMin || 1);
      const x = (nx - 0.5) * SPAN;
      const z = (nz - 0.5) * SPAN;

      const h = Math.max(0.3, (c.priority_score / 100) * 12);
      const size = c.priority_category === "CRITICAL" ? 0.85 : 0.6;

      const geo = new THREE.BoxGeometry(size, h, size);
      const color = CATEGORY_COLOR[c.priority_category] ?? 0x8fa4b6;
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: c.priority_category === "CRITICAL" ? 0.45 : 0.12,
        roughness: 0.4, metalness: 0.15,
      });
      const bar = new THREE.Mesh(geo, mat);
      bar.position.set(x, h / 2, z);
      barGroup.add(bar);
      meshToCommunity.set(bar, c);
    });
    scene.add(barGroup);

    // ---- interaction: raycast on click ----
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(barGroup.children);
      if (hits.length > 0) {
        const c = meshToCommunity.get(hits[0].object);
        if (c) setSelected(c);
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    setLoaded(true);

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.dispose();
      barGroup.children.forEach((m) => {
        const mesh = m as THREE.Mesh;
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [communities]);

  return (
    <div className="relative h-screen w-full">
      <div ref={mountRef} className="h-full w-full" />

      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-xs rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/90 p-4 shadow-panel backdrop-blur">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-monsoon-400" />
          <p className="font-display text-sm font-semibold">3D Risk Terrain</p>
        </div>
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
          Each bar is a community — height and glow encode WASH priority score. Drag to rotate,
          scroll to zoom, click a bar for details.
        </p>
        {!loaded && <p className="mt-2 text-xs text-monsoon-400">Loading scene…</p>}
      </div>

      {selected && (
        <div className="absolute bottom-4 right-4 z-10 w-72 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/95 p-4 shadow-2xl backdrop-blur">
          <p className="text-xs text-[var(--text-muted)]">{selected.district}</p>
          <p className="font-display text-base font-semibold">{selected.name}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-display text-2xl font-semibold tabular">{selected.priority_score}</span>
            <span className="text-xs text-[var(--text-muted)]">/ 100 · {selected.priority_category}</span>
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {selected.estimated_population_affected.toLocaleString()} people estimated affected · Zone {selected.response_zone}
          </p>
        </div>
      )}
    </div>
  );
}
