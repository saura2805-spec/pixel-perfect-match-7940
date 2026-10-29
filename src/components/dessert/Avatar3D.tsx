import { useEffect, useRef } from "react";
import type { Emotion, Mode } from "@/lib/dessert-api";
import { AVATAR_POSES, easePose, type AvatarPose } from "@/lib/dessert-state";
import { greetingPose, GREETING_DURATION } from "@/lib/dessert-greeting";
import { armJointRotation, easeGesture, gesturePose } from "@/lib/dessert-gestures";

type Greeting = { sessionId: number; claim: (id: number) => boolean; onStart: () => void; onEnd: () => void };

// Procedural 3D Dessert built with three.js (loaded only in the browser).
// Emotion is a prop so real backend emotion metadata can drive it later.
export function Avatar3D({ emotion = "neutral", mode = "companion", size = 280, greeting }: { emotion?: Emotion; mode?: Mode; size?: number; greeting?: Greeting | undefined }) {
  const mount = useRef<HTMLDivElement>(null);
  const target = useRef<AvatarPose>(AVATAR_POSES[emotion]);
  target.current = AVATAR_POSES[emotion];
  const welcome = useRef(greeting);
  welcome.current = greeting;
  const context = useRef({ emotion, mode });
  context.current = { emotion, mode };

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import("three").then((T) => {
      if (disposed || !mount.current) return;
      const el = mount.current;
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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
      scene.add(new T.HemisphereLight(color("light"), color("shadow"), 1.5));
      const key = new T.DirectionalLight(color("light"), 2); key.position.set(2, 3, 4); scene.add(key);
      const rim = new T.DirectionalLight(color("key"), 1.2); rim.position.set(-3, 1, -2); scene.add(rim);
      const fill = new T.DirectionalLight(color("light"), 0.7); fill.position.set(-3, 0, 4); scene.add(fill);

      const mat = (c: string, r = 0.6) => new T.MeshStandardMaterial({ color: color(c), roughness: r });
      const root = new T.Group(); scene.add(root);
      const head = new T.Group(); head.position.y = 0.55; root.add(head);

      const fabricCanvas = document.createElement("canvas"); fabricCanvas.width = 64; fabricCanvas.height = 64;
      const fabricContext = fabricCanvas.getContext("2d");
      if (fabricContext) {
        fabricContext.fillStyle = color("dress"); fabricContext.fillRect(0, 0, 64, 64);
        fabricContext.globalAlpha = 0.12; fabricContext.strokeStyle = color("collar");
        for (let i = 0; i < 64; i += 3) {
          fabricContext.beginPath(); fabricContext.moveTo(i, 0); fabricContext.lineTo(i, 64); fabricContext.stroke();
          fabricContext.beginPath(); fabricContext.moveTo(0, i); fabricContext.lineTo(64, i); fabricContext.stroke();
        }
      }
      const fabric = new T.CanvasTexture(fabricCanvas); fabric.colorSpace = T.SRGBColorSpace;
      fabric.wrapS = fabric.wrapT = T.RepeatWrapping; fabric.repeat.set(3, 3);
      const dressMaterial = mat("collar", 0.85); dressMaterial.map = fabric;
      const skinMaterial = new T.MeshPhysicalMaterial({ color: color("skin"), roughness: 0.62, clearcoat: 0.12, clearcoatRoughness: 0.7 });
      const body = new T.Mesh(new T.CapsuleGeometry(0.66, 0.48, 8, 32), dressMaterial);
      body.scale.z = 0.7;
      body.position.y = -1.05; root.add(body);
      const neck = new T.Mesh(new T.CapsuleGeometry(0.21, 0.17, 6, 16), skinMaterial);
      neck.position.set(0, -0.42, 0.05); root.add(neck);
      const collar = new T.Mesh(new T.CylinderGeometry(0.27, 0.32, 0.26, 32, 1, true), dressMaterial);
      collar.position.set(0, -0.5, 0.03); root.add(collar);
      const collarRoll = new T.Mesh(new T.TorusGeometry(0.29, 0.05, 12, 32), dressMaterial);
      collarRoll.rotation.x = Math.PI / 2; collarRoll.position.set(0, -0.4, 0.03); root.add(collarRoll);

      // Jointed sleeves and hands extend the same character, without external assets.
      const arms = new T.Group(); root.add(arms);
      const shoulders: InstanceType<typeof T.Group>[] = [];
      const elbows: InstanceType<typeof T.Group>[] = [];
      const wrists: InstanceType<typeof T.Group>[] = [];
      const fingers: InstanceType<typeof T.Group>[][] = [];
      for (const side of [-1, 1]) {
        const shoulder = new T.Group(); shoulder.position.set(side * 0.65, -0.62, 0.14); arms.add(shoulder);
        const sleeve = new T.Mesh(new T.CapsuleGeometry(0.14, 0.25, 4, 12), dressMaterial);
        sleeve.position.y = -0.16; shoulder.add(sleeve);
        const elbow = new T.Group(); elbow.position.y = -0.34; shoulder.add(elbow);
        const forearm = new T.Mesh(new T.CapsuleGeometry(0.082, 0.22, 4, 12), skinMaterial);
        forearm.position.y = -0.13; elbow.add(forearm);
        const wrist = new T.Group(); wrist.position.y = -0.29; elbow.add(wrist);
        const palm = new T.Mesh(new T.SphereGeometry(0.115, 16, 12), skinMaterial);
        palm.scale.set(0.92, 1.15, 0.48); palm.position.y = -0.075; wrist.add(palm);
        const handFingers: InstanceType<typeof T.Group>[] = [];
        for (let finger = 0; finger < 4; finger++) {
          const joint = new T.Group();
          joint.position.set((finger - 1.5) * 0.05, -0.15, 0);
          joint.rotation.z = (finger - 1.5) * -0.09; wrist.add(joint);
          const length = finger === 0 || finger === 3 ? 0.07 : 0.105;
          const digit = new T.Mesh(new T.CapsuleGeometry(0.023, length, 3, 8), skinMaterial);
          digit.position.y = -length / 2; joint.add(digit);
          const nail = new T.Mesh(new T.SphereGeometry(0.019, 8, 6), mat("nail", 0.4));
          nail.scale.set(0.8, 1.1, 0.18); nail.position.set(0, -length + 0.015, 0.022); joint.add(nail);
          handFingers.push(joint);
        }
        const thumb = new T.Mesh(new T.CapsuleGeometry(0.032, 0.08, 3, 8), skinMaterial);
        thumb.position.set(-side * 0.105, -0.08, 0.015); thumb.rotation.z = -side * 0.65; wrist.add(thumb);
        shoulders.push(shoulder); elbows.push(elbow); wrists.push(wrist);
        fingers.push(handFingers);
      }

      const faceGeometry = new T.SphereGeometry(1, 40, 32);
      const vertices = faceGeometry.getAttribute("position");
      for (let i = 0; i < vertices.count; i++) {
        const y = vertices.getY(i);
        vertices.setX(i, vertices.getX(i) * (y < -0.2 ? 1 + (y + 0.2) * 0.16 : 1));
      }
      faceGeometry.computeVertexNormals(); head.add(new T.Mesh(faceGeometry, skinMaterial));
      const nose = new T.Mesh(new T.SphereGeometry(0.085, 16, 12), skinMaterial);
      nose.scale.set(0.65, 1.1, 0.85); nose.position.set(0, -0.14, 0.99); head.add(nose);
      for (const side of [-1, 1]) {
        const ear = new T.Mesh(new T.SphereGeometry(0.16, 16, 12), skinMaterial);
        ear.scale.set(0.7, 1.2, 0.6); ear.position.set(side * 0.96, -0.08, 0.06); head.add(ear);
      }
      // A fitted hair shell and tapered curved locks, rather than intersecting capsules.
      const hairM = mat("hair", 0.5);
      const hairGeometry = new T.SphereGeometry(1.045, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.52);
      const hairVertices = hairGeometry.getAttribute("position");
      for (let i = 0; i < hairVertices.count; i++) {
        const y = hairVertices.getY(i), z = hairVertices.getZ(i);
        if (z > 0 && y < 0.78) hairVertices.setY(i, y + (0.78 - y) * z / 1.045);
      }
      hairGeometry.computeVertexNormals(); head.add(new T.Mesh(hairGeometry, hairM));
      const back = new T.Mesh(new T.SphereGeometry(1, 32, 24), hairM);
      back.scale.set(1.12, 1.5, 0.48); back.position.set(0, -0.43, -0.6); head.add(back);
      const makeLock = (points: InstanceType<typeof T.Vector3>[], radius: number, material: InstanceType<typeof T.Material>) => {
        const curve = new T.CatmullRomCurve3(points);
        const geometry = new T.TubeGeometry(curve, 32, radius, 8, false);
        const positions = geometry.getAttribute("position");
        for (let ring = 0; ring <= 32; ring++) {
          const u = ring / 32, center = curve.getPointAt(u);
          const taper = 0.15 + 0.85 * Math.sin(Math.PI * (0.12 + u * 0.86));
          for (let j = 0; j <= 8; j++) {
            const idx = ring * 9 + j;
            positions.setXYZ(idx, center.x + (positions.getX(idx) - center.x) * taper, center.y + (positions.getY(idx) - center.y) * taper, center.z + (positions.getZ(idx) - center.z) * taper);
          }
        }
        geometry.computeVertexNormals(); head.add(new T.Mesh(geometry, material));
      };
      const strandMaterial = mat("hair-detail", 0.55);
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
        const points = [new T.Vector3(side * (0.1 + i * 0.12), 1.04, 0.18 - i * 0.18), new T.Vector3(side * (0.68 + i * 0.1), 0.72, 0.59 - i * 0.24), new T.Vector3(side * (0.94 + i * 0.08), -0.1, 0.24 - i * 0.24), new T.Vector3(side * (0.9 + i * 0.09), -0.85, 0.15 - i * 0.2), new T.Vector3(side * (1.13 + i * 0.035), -1.48, 0.08 - i * 0.18), new T.Vector3(side * (0.97 + i * 0.035), -1.7, 0.12 - i * 0.18)];
        makeLock(points, 0.22, hairM);
        for (let strand = 0; strand < 3; strand++) makeLock(points.map((p) => new T.Vector3(p.x + side * (strand - 1) * 0.045, p.y, p.z + 0.19)), 0.009, strandMaterial);
      }

      const eyes: InstanceType<typeof T.Group>[] = [];
      const cheeks: InstanceType<typeof T.Mesh>[] = [];
      const brows: InstanceType<typeof T.Mesh>[] = [];
      for (const x of [-1, 1]) {
        const eye = new T.Group(); eye.position.set(x * 0.36, 0.02, 0.947); eye.rotation.y = x * 0.25;
        const white = new T.Mesh(new T.SphereGeometry(0.2, 24, 20), mat("sclera", 0.35));
        white.scale.set(1, 1.08, 0.45); eye.add(white);
        const iris = new T.Mesh(new T.SphereGeometry(0.132, 24, 20), mat("iris", 0.28));
        iris.scale.set(1, 1.14, 0.45); iris.position.z = 0.055; eye.add(iris);
        const pupil = new T.Mesh(new T.SphereGeometry(0.084, 16, 16), mat("eye", 0.2));
        pupil.scale.set(1, 1.1, 0.4); pupil.position.z = 0.097; eye.add(pupil);
        const shine = new T.Mesh(new T.SphereGeometry(0.045, 12, 12), new T.MeshBasicMaterial({ color: color("shine") }));
        shine.scale.setScalar(0.7); shine.position.set(0.03, 0.04, 0.125); eye.add(shine);
        head.add(eye); eyes.push(eye);
        const brow = new T.Mesh(new T.CapsuleGeometry(0.018, 0.17, 4, 8), hairM);
        brow.position.set(x * 0.36, 0.37, 0.95); brow.rotation.z = Math.PI / 2;
        head.add(brow); brows.push(brow);
        const cheek = new T.Mesh(new T.SphereGeometry(0.14, 20, 12), new T.MeshBasicMaterial({ color: color("blush"), transparent: true, opacity: 0.4, depthWrite: false }));
        cheek.scale.set(1.2, 0.65, 0.08); cheek.position.set(x * 0.55, -0.2, 0.83); cheek.rotation.y = x * 0.55; head.add(cheek); cheeks.push(cheek);
        // Round dark-framed glasses and light freckles, as in the reference.
        const lens = new T.Mesh(new T.TorusGeometry(0.27, 0.035, 12, 40), mat("bow", 0.35));
        lens.position.set(x * 0.38, 0.02, 1.08); lens.rotation.y = x * 0.28; head.add(lens);
        const temple = new T.Mesh(new T.CapsuleGeometry(0.022, 0.6, 4, 8), mat("bow", 0.35));
        temple.rotation.x = Math.PI / 2; temple.position.set(x * 0.9, 0.06, 0.62); temple.rotation.z = x * 0.15; head.add(temple);
        for (let f = 0; f < 4; f++) {
          const freckle = new T.Mesh(new T.CircleGeometry(0.012, 8), mat("freckle", 0.8));
          const fx = x * (0.14 + f * 0.075), fy = -0.18 - (f % 2) * 0.035;
          freckle.position.set(fx, fy, Math.sqrt(1 - fx * fx - fy * fy) + 0.009); freckle.lookAt(fx * 2, fy * 2, freckle.position.z * 2); head.add(freckle);
        }
      }
      const bridge = new T.Mesh(new T.CapsuleGeometry(0.018, 0.12, 4, 8), mat("bow", 0.35));
      bridge.rotation.z = Math.PI / 2; bridge.position.set(0, 0.08, 1.15); head.add(bridge);
      const mouth = new T.Mesh(new T.TorusGeometry(0.13, 0.025, 8, 24, Math.PI), mat("mouth"));
      mouth.position.set(0, -0.32, 0.99); head.add(mouth);
      const openMouth = new T.Mesh(new T.CircleGeometry(0.11, 24), mat("mouth"));
      openMouth.position.set(0, -0.33, 0.98); head.add(openMouth);

      let cur = { ...target.current };
      let joints = gesturePose(context.current.emotion, context.current.mode, 0, true);
      let raf = 0; const t0 = performance.now(); let previous = t0; let nextBlink = 3; let elapsed = 0;
      let lastDraw = 0;
      let seenSession = 0; let greetingStarted: number | null = null;
      const loop = (now = performance.now()) => {
        raf = requestAnimationFrame(loop);
        if (now - lastDraw < 1000 / 30) return;
        lastDraw = now;
        const delta = Math.min((now - previous) / 1000, 0.05); previous = now;
        elapsed += delta;
        const t = elapsed;
        const config = welcome.current;
        arms.visible = true;
        if (config && seenSession !== config.sessionId) {
          seenSession = config.sessionId;
          greetingStarted = config.claim(config.sessionId) ? now : null;
          if (greetingStarted !== null) config.onStart();
        }
        const seconds = greetingStarted === null ? GREETING_DURATION : (now - greetingStarted) / 1000;
        const wave = greetingPose(seconds, motion.matches);
        if (greetingStarted !== null && !wave.active) { greetingStarted = null; config?.onEnd(); }
        el.dataset["greetingActive"] = String(wave.active);
        el.dataset["waveLift"] = wave.lift.toFixed(3);
        const p = { ...target.current };
        const desiredJoints = gesturePose(context.current.emotion, context.current.mode, t, motion.matches);
        for (const side of ["left", "right"] as const) {
          const idleArm = gesturePose("neutral", context.current.mode, t, true)[side];
          for (const k of Object.keys(idleArm) as (keyof typeof idleArm)[]) desiredJoints[side][k] += (idleArm[k] - desiredJoints[side][k]) * wave.warmth;
        }
        desiredJoints.right.shoulder += wave.lift * 1.65;
        desiredJoints.right.elbow += wave.lift * 1.15;
        desiredJoints.right.wrist += wave.wrist;
        desiredJoints.right.curl *= 1 - wave.lift;
        for (const k of Object.keys(p) as (keyof AvatarPose)[]) p[k] += (AVATAR_POSES.happy[k] - p[k]) * wave.warmth;
        const settledHands = (["left", "right"] as const).every((side) => Object.keys(desiredJoints[side]).every((k) => Math.abs(joints[side][k as keyof typeof joints.left] - desiredJoints[side][k as keyof typeof joints.left]) < 0.001));
        if (motion.matches && !wave.active && settledHands && el.dataset["sceneReady"] && Object.keys(p).every((k) => Math.abs(cur[k as keyof AvatarPose] - p[k as keyof AvatarPose]) < 0.001)) return;
        cur = motion.matches ? { ...p } : easePose(cur, p, delta);
        joints = motion.matches ? desiredJoints : easeGesture(joints, desiredJoints, delta);
        const idle = motion.matches ? 0 : 1;
        root.position.y = idle * Math.sin(t * (1.4 + cur.open)) * cur.float;
        root.scale.setScalar(1 + idle * Math.sin(t * 1.4) * 0.008);
        root.rotation.y = wave.turn;
        const hands = [joints.left, joints.right];
        const rotations = hands.map((hand, i) => armJointRotation(hand, i === 0 ? -1 : 1));
        shoulders.forEach((shoulder, i) => { const joint = rotations[i]; if (joint) shoulder.rotation.set(joint.forward, 0, joint.shoulder); });
        elbows.forEach((elbow, i) => { const joint = rotations[i]; if (joint) elbow.rotation.set(joint.elbowForward, 0, joint.elbowSide); });
        wrists.forEach((wrist, i) => { const hand = hands[i]; if (hand) wrist.rotation.set(0, hand.palm, hand.wrist); });
        fingers.forEach((handFingers, i) => { const joint = rotations[i]; if (joint) handFingers.forEach((finger) => { finger.rotation.x = joint.curl; }); });
        el.dataset["gestureMode"] = context.current.mode;
        el.dataset["handPose"] = context.current.emotion;
        head.rotation.z = cur.tilt + idle * Math.sin(t * 0.7) * 0.025;
        head.rotation.y = cur.gaze + idle * Math.sin(t * 0.5) * 0.06;
        head.rotation.x = cur.nod + idle * Math.sin(t * 1.3) * Math.abs(cur.nod) * 0.5;
        let blink = 1;
        if (!motion.matches && t > nextBlink) { const d = t - nextBlink; blink = d < 0.22 ? Math.abs(1 - d / 0.11) : 1; if (d > 0.22) nextBlink = t + 3 + Math.random() * 4; }
        eyes.forEach((e) => e.scale.set(1, Math.max(0.05, cur.eye * blink), 1));
        brows.forEach((b, i) => { b.rotation.z = Math.PI / 2 + (i === 0 ? -1 : 1) * cur.brow; b.position.y = 0.37 + Math.abs(cur.brow) * 0.1; });
        const s = cur.smile;
        mouth.rotation.z = s >= 0 ? Math.PI : 0;
        mouth.scale.set(0.6 + Math.abs(s) * 0.6, 0.3 + Math.abs(s) * 0.9, 1);
        mouth.position.y = s >= 0 ? -0.28 : -0.4;
        mouth.visible = true;
        openMouth.scale.set(1, Math.max(0.01, cur.open * 1.25), 1);
        openMouth.visible = cur.open > 0.1;
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
        fabric.dispose(); materials.forEach((m) => m.dispose()); renderer.dispose(); renderer.domElement.remove();
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
