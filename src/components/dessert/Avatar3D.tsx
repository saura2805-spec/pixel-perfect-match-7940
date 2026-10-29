import { useEffect, useRef } from "react";
import type { Emotion } from "@/lib/dessert-api";
import { AVATAR_POSES, easePose, type AvatarPose } from "@/lib/dessert-state";

// Procedural 3D Dessert built with three.js (loaded only in the browser).
// Emotion is a prop so real backend emotion metadata can drive it later.
export function Avatar3D({ emotion = "neutral", size = 280 }: { emotion?: Emotion; size?: number }) {
  const mount = useRef<HTMLDivElement>(null);
  const target = useRef<AvatarPose>(AVATAR_POSES[emotion]);
  target.current = AVATAR_POSES[emotion];

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import("three").then((T) => {
      if (disposed || !mount.current) return;
      const el = mount.current;
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(size, size);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.setAttribute("aria-hidden", "true");
      el.appendChild(renderer.domElement);
      const tokens = getComputedStyle(el);
      const color = (name: string) => tokens.getPropertyValue(`--avatar-${name}`).trim();
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const scene = new T.Scene();
      const cam = new T.PerspectiveCamera(32, 1, 0.1, 50);
      cam.position.set(0, 0, 8.1);
      cam.lookAt(0, -0.06, 0);
      scene.add(new T.HemisphereLight(color("light"), color("shadow"), 1.4));
      const key = new T.DirectionalLight(color("key"), 2.2); key.position.set(2, 3, 4); scene.add(key);
      const rim = new T.DirectionalLight(color("rim"), 2); rim.position.set(-3, 1, -2); scene.add(rim);

      const mat = (c: string, r = 0.6) => new T.MeshStandardMaterial({ color: color(c), roughness: r });
      const root = new T.Group(); scene.add(root);
      const head = new T.Group(); head.position.y = 0.55; root.add(head);

      const body = new T.Mesh(new T.CapsuleGeometry(0.62, 0.5, 8, 24), mat("dress"));
      body.position.y = -1.05; root.add(body);
      const collar = new T.Mesh(new T.TorusGeometry(0.42, 0.08, 12, 32), mat("collar"));
      collar.rotation.x = Math.PI / 2; collar.position.y = -0.48; root.add(collar);

      head.add(new T.Mesh(new T.SphereGeometry(1, 32, 32), mat("skin", 0.75)));
      const hairM = mat("hair", 0.45);
      const hair = new T.Mesh(new T.SphereGeometry(1.08, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM);
      hair.rotation.x = -0.35; head.add(hair);
      const back = new T.Mesh(new T.SphereGeometry(1.05, 32, 32), hairM);
      back.scale.set(1.05, 1.25, 0.8); back.position.set(0, -0.35, -0.35); head.add(back);
      for (const x of [-1, 1]) {
        const bun = new T.Mesh(new T.SphereGeometry(0.32, 24, 24), hairM);
        bun.position.set(x * 0.75, 0.8, -0.1); head.add(bun);
        const bow = new T.Mesh(new T.ConeGeometry(0.12, 0.25, 12), mat("bow"));
        bow.position.set(x * 0.9, 1.0, 0.1); bow.rotation.z = x * 1.2; head.add(bow);
      }

      const eyes: InstanceType<typeof T.Group>[] = [];
      const cheeks: InstanceType<typeof T.Mesh>[] = [];
      const brows: InstanceType<typeof T.Mesh>[] = [];
      for (const x of [-1, 1]) {
        const eye = new T.Group(); eye.position.set(x * 0.36, 0.02, 0.9);
        const iris = new T.Mesh(new T.SphereGeometry(0.15, 20, 20), mat("eye", 0.2));
        iris.scale.set(0.9, 1.15, 0.5); eye.add(iris);
        const shine = new T.Mesh(new T.SphereGeometry(0.045, 12, 12), new T.MeshBasicMaterial({ color: color("shine") }));
        shine.position.set(0.04, 0.06, 0.07); eye.add(shine);
        head.add(eye); eyes.push(eye);
        const brow = new T.Mesh(new T.CapsuleGeometry(0.018, 0.17, 4, 8), hairM);
        brow.position.set(x * 0.36, 0.29, 0.97); brow.rotation.z = Math.PI / 2;
        head.add(brow); brows.push(brow);
        const cheek = new T.Mesh(new T.CircleGeometry(0.14, 24), new T.MeshBasicMaterial({ color: color("blush"), transparent: true, opacity: 0.4 }));
        cheek.position.set(x * 0.55, -0.2, 0.84); cheek.rotation.y = x * 0.55; head.add(cheek); cheeks.push(cheek);
      }
      const mouth = new T.Mesh(new T.TorusGeometry(0.13, 0.025, 8, 24, Math.PI), mat("mouth"));
      mouth.position.set(0, -0.32, 0.95); head.add(mouth);
      const openMouth = new T.Mesh(new T.CircleGeometry(0.11, 24), mat("mouth"));
      openMouth.position.set(0, -0.33, 0.98); head.add(openMouth);

      let cur = { ...target.current };
      let raf = 0; const t0 = performance.now(); let previous = t0; let nextBlink = 3;
      let lastDraw = 0;
      const loop = (now = performance.now()) => {
        raf = requestAnimationFrame(loop);
        if (now - lastDraw < 1000 / 30) return;
        lastDraw = now;
        const delta = (now - previous) / 1000; previous = now;
        const t = (performance.now() - t0) / 1000;
        const p = target.current;
        if (motion.matches && el.dataset["sceneReady"] && Object.keys(p).every((k) => Math.abs(cur[k as keyof AvatarPose] - p[k as keyof AvatarPose]) < 0.001)) return;
        cur = motion.matches ? { ...p } : easePose(cur, p, delta);
        const idle = motion.matches ? 0 : 1;
        root.position.y = idle * Math.sin(t * (1.4 + cur.open)) * cur.float;
        root.scale.setScalar(1 + idle * Math.sin(t * 1.4) * 0.008);
        head.rotation.z = cur.tilt + idle * Math.sin(t * 0.7) * 0.025;
        head.rotation.y = cur.gaze + idle * Math.sin(t * 0.5) * 0.06;
        head.rotation.x = cur.nod + idle * Math.sin(t * 1.3) * Math.abs(cur.nod) * 0.5;
        let blink = 1;
        if (!motion.matches && t > nextBlink) { const d = t - nextBlink; blink = d < 0.22 ? Math.abs(1 - d / 0.11) : 1; if (d > 0.22) nextBlink = t + 3 + Math.random() * 4; }
        eyes.forEach((e) => e.scale.set(1, Math.max(0.05, cur.eye * blink), 1));
        brows.forEach((b, i) => { b.rotation.z = Math.PI / 2 + (i === 0 ? -1 : 1) * cur.brow; b.position.y = 0.29 + Math.abs(cur.brow) * 0.13; });
        const s = cur.smile;
        mouth.rotation.z = s >= 0 ? Math.PI : 0;
        mouth.scale.set(0.6 + Math.abs(s) * 0.6, 0.3 + Math.abs(s) * 0.9, 1);
        mouth.position.y = s >= 0 ? -0.28 : -0.4;
        mouth.visible = cur.open < 0.5;
        openMouth.scale.set(1, Math.max(0.01, cur.open * 1.25), 1);
        openMouth.visible = cur.open > 0.01;
        cheeks.forEach((c) => ((c.material as InstanceType<typeof T.MeshBasicMaterial>).opacity = cur.blush * 0.6));
        renderer.render(scene, cam);
        el.dataset["sceneReady"] = "true";
      };
      loop();
      cleanup = () => {
        cancelAnimationFrame(raf);
        const materials = new Set<InstanceType<typeof T.Material>>();
        scene.traverse((object) => {
          if (object instanceof T.Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) => materials.add(m)); }
        });
        materials.forEach((m) => m.dispose()); renderer.dispose(); renderer.domElement.remove();
      };
    }).catch(() => { if (mount.current) mount.current.dataset["sceneError"] = "true"; });
    return () => { disposed = true; cleanup(); };
  }, [size]);

  return (
    <div className="dessert-avatar relative shrink-0" role="img" aria-label={`Dessert, feeling ${emotion}`}>
      <div ref={mount} className="h-full w-full" />
    </div>
  );
}
