import { useEffect, useRef } from "react";
import type { Emotion } from "@/lib/dessert-api";

// Procedural 3D Dessert built with three.js (loaded only in the browser).
// Emotion is a prop so real backend emotion metadata can drive it later.
type Pose = { smile: number; eye: number; bounce: number; tilt: number; blush: number };
const POSES: Record<Emotion, Pose> = {
  neutral: { smile: 0.2, eye: 1, bounce: 1, tilt: 0, blush: 0.4 },
  happy: { smile: 0.8, eye: 0.9, bounce: 1.6, tilt: 0.08, blush: 0.7 },
  excited: { smile: 1, eye: 1.2, bounce: 2.6, tilt: 0, blush: 0.9 },
  affectionate: { smile: 0.7, eye: 0.55, bounce: 1, tilt: 0.18, blush: 1 },
  sad: { smile: -0.6, eye: 0.8, bounce: 0.5, tilt: -0.1, blush: 0.15 },
  thinking: { smile: 0, eye: 0.85, bounce: 0.7, tilt: -0.22, blush: 0.3 },
  listening: { smile: 0.35, eye: 1.1, bounce: 0.9, tilt: 0.14, blush: 0.5 },
};

export function Avatar3D({ emotion = "neutral", size = 280 }: { emotion?: Emotion; size?: number }) {
  const mount = useRef<HTMLDivElement>(null);
  const target = useRef<Pose>(POSES[emotion]);
  target.current = POSES[emotion];

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import("three").then((T) => {
      if (disposed || !mount.current) return;
      const el = mount.current;
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(size, size);
      el.appendChild(renderer.domElement);
      const scene = new T.Scene();
      const cam = new T.PerspectiveCamera(32, 1, 0.1, 50);
      cam.position.set(0, 0.3, 6.2);
      scene.add(new T.HemisphereLight(0xffe6f2, 0x3a1f3a, 1.4));
      const key = new T.DirectionalLight(0xffd1e3, 2.2); key.position.set(2, 3, 4); scene.add(key);
      const rim = new T.DirectionalLight(0xb9a3ff, 2); rim.position.set(-3, 1, -2); scene.add(rim);

      const mat = (c: number, r = 0.6) => new T.MeshStandardMaterial({ color: c, roughness: r });
      const root = new T.Group(); scene.add(root);
      const head = new T.Group(); head.position.y = 0.55; root.add(head);

      const body = new T.Mesh(new T.CapsuleGeometry(0.62, 0.5, 8, 24), mat(0xb59ad6));
      body.position.y = -1.05; root.add(body);
      const collar = new T.Mesh(new T.TorusGeometry(0.42, 0.08, 12, 32), mat(0xfff1f6));
      collar.rotation.x = Math.PI / 2; collar.position.y = -0.48; root.add(collar);

      head.add(new T.Mesh(new T.SphereGeometry(1, 48, 48), mat(0xffe0d6, 0.75)));
      const hairM = mat(0xc58bd0, 0.45);
      const hair = new T.Mesh(new T.SphereGeometry(1.08, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM);
      hair.rotation.x = -0.35; head.add(hair);
      const back = new T.Mesh(new T.SphereGeometry(1.05, 32, 32), hairM);
      back.scale.set(1.05, 1.25, 0.8); back.position.set(0, -0.35, -0.35); head.add(back);
      for (const x of [-1, 1]) {
        const bun = new T.Mesh(new T.SphereGeometry(0.32, 24, 24), hairM);
        bun.position.set(x * 0.75, 0.8, -0.1); head.add(bun);
        const bow = new T.Mesh(new T.ConeGeometry(0.12, 0.25, 12), mat(0xff8fb8));
        bow.position.set(x * 0.9, 1.0, 0.1); bow.rotation.z = x * 1.2; head.add(bow);
      }

      const eyes: InstanceType<typeof T.Group>[] = [];
      const cheeks: InstanceType<typeof T.Mesh>[] = [];
      for (const x of [-1, 1]) {
        const eye = new T.Group(); eye.position.set(x * 0.36, 0.02, 0.9);
        const iris = new T.Mesh(new T.SphereGeometry(0.15, 24, 24), mat(0x3b1e4a, 0.2));
        iris.scale.set(0.9, 1.15, 0.5); eye.add(iris);
        const shine = new T.Mesh(new T.SphereGeometry(0.045, 12, 12), new T.MeshBasicMaterial({ color: 0xffffff }));
        shine.position.set(0.04, 0.06, 0.07); eye.add(shine);
        head.add(eye); eyes.push(eye);
        const cheek = new T.Mesh(new T.CircleGeometry(0.14, 24), new T.MeshBasicMaterial({ color: 0xff8fb0, transparent: true, opacity: 0.4 }));
        cheek.position.set(x * 0.55, -0.2, 0.84); cheek.rotation.y = x * 0.55; head.add(cheek); cheeks.push(cheek);
      }
      const mouth = new T.Mesh(new T.TorusGeometry(0.13, 0.025, 8, 24, Math.PI), mat(0x8a3550));
      mouth.position.set(0, -0.32, 0.95); head.add(mouth);

      const cur = { ...target.current };
      let raf = 0; const t0 = performance.now(); let nextBlink = 2;
      const loop = () => {
        const t = (performance.now() - t0) / 1000;
        const p = target.current;
        (Object.keys(cur) as (keyof Pose)[]).forEach((k) => (cur[k] += (p[k] - cur[k]) * 0.08));
        root.position.y = Math.sin(t * 1.6 * cur.bounce) * 0.06 * cur.bounce;
        root.scale.setScalar(1 + Math.sin(t * 1.4) * 0.008);
        head.rotation.z = cur.tilt + Math.sin(t * 0.7) * 0.03;
        head.rotation.y = Math.sin(t * 0.5) * 0.12;
        let blink = 1;
        if (t > nextBlink) { const d = t - nextBlink; blink = d < 0.15 ? Math.abs(1 - d / 0.075) : 1; if (d > 0.15) nextBlink = t + 2 + Math.random() * 3; }
        eyes.forEach((e) => e.scale.set(1, Math.max(0.05, cur.eye * blink), 1));
        const s = cur.smile;
        mouth.rotation.z = s >= 0 ? Math.PI : 0;
        mouth.scale.set(0.6 + Math.abs(s) * 0.6, 0.3 + Math.abs(s) * 0.9, 1);
        mouth.position.y = s >= 0 ? -0.28 : -0.4;
        cheeks.forEach((c) => ((c.material as InstanceType<typeof T.MeshBasicMaterial>).opacity = cur.blush * 0.6));
        renderer.render(scene, cam);
        raf = requestAnimationFrame(loop);
      };
      loop();
      cleanup = () => { cancelAnimationFrame(raf); renderer.dispose(); el.removeChild(renderer.domElement); };
    });
    return () => { disposed = true; cleanup(); };
  }, [size]);

  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Dessert, feeling ${emotion}`}>
      <div className="absolute inset-6 rounded-full halo animate-halo blur-2xl" />
      <div ref={mount} className="relative" />
    </div>
  );
}
