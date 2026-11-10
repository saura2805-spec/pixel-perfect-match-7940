import { useEffect, useRef, useState } from "react";
import type { Emotion, Mode } from "@/lib/dessert-api";
import { GREETING_DURATION } from "@/lib/dessert-greeting";
import { easeRig, rigPose, waveOverlay, type RigPose } from "@/lib/dessert-expressions";
import modelAsset from "@/assets/dessert-base.vrm.asset.json";
import skinUrl from "@/assets/dessert-skin.webp";

type Greeting = { sessionId: number; claim: (id: number) => boolean; onStart: () => void; onEnd: () => void };
type Props = { emotion?: Emotion; mode?: Mode; size?: number; greeting?: Greeting | undefined };

// Interactive VRM Dessert: real facial expressions + humanoid bones, drag to turn her.
export function Avatar3D({ emotion = "neutral", mode = "companion", greeting }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const live = useRef({ emotion, mode, greetStart: -1 });
  const [ready, setReady] = useState(false);
  const [waving, setWaving] = useState(false);
  live.current.emotion = emotion; live.current.mode = mode;

  const sessionId = greeting?.sessionId;
  useEffect(() => {
    if (!ready || !greeting || !greeting.claim(greeting.sessionId)) return;
    greeting.onStart(); setWaving(true); live.current.greetStart = performance.now();
    const t = window.setTimeout(() => { setWaving(false); greeting.onEnd(); }, GREETING_DURATION * 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, ready]);

  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __dessert?: unknown }).__dessert = { setEmotion: (e: Emotion) => { live.current.emotion = e; } };
    const el = mount.current; if (!el) return;
    let disposed = false; let raf = 0; let cleanup = () => {};
    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { VRMLoaderPlugin, VRMUtils } = await import("@pixiv/three-vrm");
      if (disposed) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 20);
      scene.add(new THREE.HemisphereLight(0xfff1f4, 0x553344, 1.6));
      const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(1, 2, 3); scene.add(key);
      const rim = new THREE.DirectionalLight(0xff9ad0, 1.2); rim.position.set(-2, 1.5, -2); scene.add(rim);

      const loader = new GLTFLoader(); loader.register((p) => new VRMLoaderPlugin(p));
      const gltf = await loader.loadAsync(modelAsset.url);
      if (disposed) return;
      const vrm = gltf.userData.vrm;
      VRMUtils.rotateVRM0(vrm);
      const tex = await new THREE.TextureLoader().loadAsync(skinUrl);
      tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace;
      vrm.scene.traverse((o: import("three").Object3D) => {
        const m = (o as import("three").Mesh).material as unknown as Record<string, unknown> | undefined;
        if (!m) return; (o as import("three").Mesh).frustumCulled = false;
        for (const mat of Array.isArray(m) ? m : [m]) {
          if ("map" in mat) mat.map = tex;
          if ("shadeMultiplyTexture" in mat && mat.shadeMultiplyTexture) mat.shadeMultiplyTexture = tex;
          (mat as { needsUpdate?: boolean }).needsUpdate = true;
        }
      });
      scene.add(vrm.scene);
      const bone = (n: string) => vrm.humanoid.getNormalizedBoneNode(n) as import("three").Object3D | null;
      const head = bone("head")!;

      // Round dark glasses on the head bone.
      const glasses = new THREE.Group();
      const frame = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.4, metalness: 0.3 });
      for (const x of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.0055, 12, 48), frame); ring.position.x = x * 0.068; glasses.add(ring); }
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.02), frame); bridge.rotation.z = Math.PI / 2; glasses.add(bridge);
      head.add(glasses);
      const hairMat = new THREE.MeshToonMaterial({ color: getComputedStyle(el).getPropertyValue("--avatar-hair").trim() || "#2a1914" });
      const hair = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const a = -1.25 + (i / 8) * 2.5; const len = 0.22 + Math.cos(a) * 0.06;
        const pts = Array.from({ length: 7 }, (_, k) => new THREE.Vector3(Math.sin(a) * (0.13 + k * 0.006) + Math.sin(k * 1.4 + i) * 0.012, 0.1 - k * len / 6, Math.cos(a) * 0.1 + 0.02 + Math.cos(k * 1.4 + i) * 0.008));
        const lock = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.045, 10), hairMat);
        hair.add(lock);
      }
      head.add(hair);
      scene.updateMatrixWorld(true);
      const headPos = head.getWorldPosition(new THREE.Vector3());
      glasses.position.set(0, 0.118, -0.17);
      Object.assign(window as object, import.meta.env.DEV ? { __dessertGlasses: glasses } : {});

      const target = new THREE.Vector3(0, headPos.y + 0.04, 0);
      let yaw = 0, drag = false, lastX = 0;
      const down = (e: PointerEvent) => { drag = true; lastX = e.clientX; };
      const move = (e: PointerEvent) => { if (drag) { yaw = Math.max(-0.8, Math.min(0.8, yaw + (e.clientX - lastX) * 0.01)); lastX = e.clientX; } };
      const up = () => { drag = false; };
      renderer.domElement.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);

      const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
      const ro = new ResizeObserver(resize); ro.observe(el); resize();

      let pose: RigPose = rigPose(live.current.emotion as Emotion, live.current.mode);
      let last = performance.now(), t = 0, blinkAt = 2, first = true;
      const setArm = (side: "left" | "right", a: RigPose["left"], wave = 0, lift = 0) => {
        const s = side === "left" ? -1 : 1;
        const ua = bone(side + "UpperArm"), la = bone(side + "LowerArm"), hand = bone(side + "Hand");
        if (!ua || !la) return;
        const mix = (v: number, w: number) => v * (1 - lift) + w * lift;
        ua.rotation.set(mix(a.forward, 0), 0, -s * mix(a.down, 1.1));
        la.rotation.set(0, s * mix(a.elbow, 2.5), s * (mix(a.lift, 0.9) + wave));
        if (hand) hand.rotation.set(0, 0, s * wave * 0.5);
      };
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt * (reduced ? 0.3 : 1);
        pose = easeRig(pose, rigPose(live.current.emotion as Emotion, live.current.mode), dt);
        const g = live.current.greetStart >= 0 && !reduced ? waveOverlay((now - live.current.greetStart) / 1000, GREETING_DURATION) : { weight: 0, wave: 0 };
        const em = vrm.expressionManager;
        if (em) {
          const f = pose.face, gw = g.weight;
          em.setValue("happy", Math.max(f.happy, gw)); em.setValue("sad", f.sad * (1 - gw)); em.setValue("relaxed", f.relaxed * (1 - gw));
          em.setValue("surprised", f.surprised); em.setValue("angry", f.angry); em.setValue("lookUp", f.lookUp); em.setValue("lookDown", f.lookDown);
          em.setValue("oh", f.oh); em.setValue("aa", f.aa + (reduced ? 0 : Math.max(0, Math.sin(t * 0.7)) * f.aa * 0.5));
          blinkAt -= dt; let blink = f.lids;
          if (blinkAt < 0) { blink = Math.max(blink, 1 - Math.abs(blinkAt + 0.08) / 0.08); if (blinkAt < -0.16) blinkAt = 2 + Math.random() * 3; }
          em.setValue("blink", Math.min(1, blink));
        }
        const breathe = reduced ? 0 : Math.sin(t * 1.6 * pose.motion.speed);
        const spine = bone("spine"), chest = bone("chest") ?? bone("upperChest");
        if (spine) spine.rotation.x = -pose.spine + breathe * 0.012 * pose.motion.bounce;
        if (chest) chest.rotation.x = breathe * 0.01;
        const neck = bone("neck");
        const mo = pose.motion, r = reduced ? 0 : 1;
        head.rotation.set(-pose.headPitch - r * Math.sin(t * 3 * mo.speed) * mo.nod - r * Math.sin(t * 0.9) * 0.02, pose.headYaw + r * Math.sin(t * 0.5) * 0.06 + r * Math.sin(t * 9) * mo.shake - g.weight * 0.15, pose.headRoll + r * Math.sin(t * 0.7 * mo.speed) * mo.sway + g.weight * 0.1);
        if (neck) neck.rotation.x = -pose.headPitch * 0.3;
        vrm.scene.position.y = reduced ? 0 : Math.abs(Math.sin(t * 2 * pose.motion.speed)) * 0.006 * pose.motion.bounce;
        vrm.scene.rotation.y = yaw + Math.PI;
        setArm("left", pose.left);
        setArm("right", pose.right, g.wave, g.weight);
        vrm.update(dt);
        camera.position.set(0, target.y + 0.01, 1.75); camera.lookAt(target);
        renderer.render(scene, camera);
        if (first) { first = false; setReady(true); }
      };
      raf = requestAnimationFrame(loop);
      cleanup = () => {
        cancelAnimationFrame(raf); ro.disconnect();
        renderer.domElement.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
        VRMUtils.deepDispose(vrm.scene); tex.dispose(); renderer.dispose(); renderer.domElement.remove();
      };
    })();
    return () => { disposed = true; cleanup(); };
  }, []);

  return (
    <div className="dessert-avatar dessert-portrait relative shrink-0" data-emotion={emotion} data-mode={mode} data-greeting-active={String(waving)} data-scene-ready={ready ? "true" : undefined} role="img" aria-label={`Dessert, feeling ${emotion}. Drag to turn her.`}>
      <div className="dessert-portrait-glow" aria-hidden="true" />
      <div ref={mount} className="absolute inset-0 cursor-grab touch-pan-y" />
    </div>
  );
}
