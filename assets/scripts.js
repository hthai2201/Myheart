import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/postprocessing/RenderPass.js";
import { AfterimagePass } from "https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/postprocessing/AfterimagePass.js";
import { makeMat } from "./mins.js";
if (!window["Heartlove"]) {
  window.Heartlove = {
    data: {
      messages: ["Anh yêu em", "mãi yêu em"],
      images: [],
      heartColor: "#ff9090",
    },
  };
}
(function () {
  const e = new URLSearchParams(window["location"]["search"])["get"]("data");
  if (e) {
    try {
      const o = decodeURIComponent(escape(atob(e)));
      const a = JSON["parse"](o);
      window["Heartlove"] = {
        data: {
          messages: a.messages || [],
          images: a["images"] || [],
          heartColor: a["heartColor"] || "#ff9090",
          music: a["music"] || null,
        },
      };
      console.log("Heartlove data đã được load:", window.Heartlove);
      if (window["Heartlove"]["data"]["music"]) {
        const e = new Audio(window["Heartlove"]["data"]["music"]);
        e.loop = true;
        const o = document["createElement"]("button");
        o.id = "musicToggle";
        o["innerHTML"] = '<i class="fas fa-volume-high"></i>';
        document["body"]["appendChild"](o);
        let a = false;
        const s = () => {
          o["innerHTML"] =
            '<i class="fas ' +
            (a ? "fa-volume-high" : "fa-volume-xmark") +
            '"></i>';
        };
        const r = () => {
          e["play"]()
            ["then"](() => {
              a = true;
              s();
            })
            ["catch"](() => {
              console.log("Tự động phát bị chặn.");
            });
        };
        const n = () => {
          e["pause"]();
          a = false;
          s();
        };
        o["addEventListener"]("click", () => {
          if (a) {
            n();
          } else {
            r();
          }
        });
        e["play"]()
          ["then"](() => {
            a = true;
            s();
          })
          ["catch"](() => {
            const o = () => {
              r();
              document["removeEventListener"]("click", o);
            };
            document.addEventListener("click", o);
          });
      }
    } catch (e) {
      console["error"]("Dữ liệu không hợp lệ:", e);
      window["Heartlove"] = null;
    }
  } else {
    console["warn"](
      "Không tìm thấy dữ liệu trong link. Sử dụng dữ liệu mặc định."
    );
  }
})();
const appData = window["Heartlove"]["data"];
let allWordsFlat = [];
const originalTexts = appData["messages"] || [];
originalTexts["forEach"]((t) => {
  const o = t["split"](" ");
  allWordsFlat["push"](...o);
});
let currentWordIndex = 0;
let nextWordSpawnTime = 0;
const IMAGE_CONFIG = {
  paths: appData["images"] || [],
  count: appData["images"]?.["length"] || 0,
  scale: 2.5,
  glowIntensity: 0.4,
  spawnRate: 0.18,
  maxActiveImages: 45,
  spawnInterval: 400,
};

console["log"]("Image config:", IMAGE_CONFIG);
const useCustomColor =
  appData["heartColor"] &&
  /^#([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6})$/["test"](appData["heartColor"]);
const heartInitialColor = new THREE["Color"](
  useCustomColor ? appData.heartColor : "#ff69b4"
);
let imageTextures = [];
let imageLoadingComplete = false;
let imagePool = [];
let activeImages = new Map();
let freeImageIndices = [];
let currentImageIndex = 0;
let lastImageSpawnTime = 0;
let imageSpawnQueue = [];
let minActiveImages = 8;
let maxConcurrentImages = 24;
let lastStatusLogTime = 0;
let independentImageSprites = [];
let nextIndependentSpawnTime = 0;
const textureLoader = new THREE["TextureLoader"]();
async function fetchAndPrepareImageTextures() {
  try {
    const e = IMAGE_CONFIG["paths"].map(
      (e) =>
        new Promise((o, a) => {
          textureLoader["load"](
            e,
            (t) => {
              t["minFilter"] = THREE["LinearFilter"];
              t.magFilter = THREE["LinearFilter"];
              t["format"] = THREE.RGBAFormat;
              t["needsUpdate"] = true;
              o(t);
            },
            undefined,
            (t) => {
              const a = document["createElement"]("canvas");
              a["width"] = a["height"] = 512;
              const r = a.getContext("2d");
              const n = r["createRadialGradient"](256, 256, 0, 256, 256, 256);
              n.addColorStop(0, "#ff69b400");
              n["addColorStop"](1, "#ff149300");
              r["fillStyle"] = n;
              r["fillRect"](0, 0, 512, 512);
              const i = new THREE["CanvasTexture"](a);
              i["needsUpdate"] = true;
              o(i);
            }
          );
        })
    );
    imageTextures = await Promise["all"](e);
    return true;
  } catch (t) {
    return false;
  }
}
function buildImageSpriteMaterial(t, e = 1) {
  return new THREE.SpriteMaterial({
    map: t,
    transparent: true,
    opacity: e,
    depthWrite: false,
    alphaTest: 0.1,
    sizeAttenuation: true,
  });
}
function getAspectRatioAdjustedScale(t, e = 2.5) {
  if (!t || !t["image"]) {
    return e;
  }
  const a = t["image"]["width"] / t["image"]["height"];
  return {
    x: a > 1 ? e : e * a,
    y: a > 1 ? e / a : e,
  };
}
async function setupImageStreaming() {
  imageLoadingComplete = await fetchAndPrepareImageTextures();
  if (imageLoadingComplete) {
    tweakSpawnParametersByImageCount();
  }
}
function tweakSpawnParametersByImageCount() {
  const e = IMAGE_CONFIG["count"];
  if (e <= 2) {
    IMAGE_CONFIG.spawnInterval = 300;
    minActiveImages = 6;
    maxConcurrentImages = Math["min"](15, 7.5 * e);
  } else if (e <= 5) {
    IMAGE_CONFIG["spawnInterval"] = 400;
    minActiveImages = 8;
    maxConcurrentImages = Math["min"](18, 3.5 * e);
  } else {
    IMAGE_CONFIG["spawnInterval"] = 500;
    minActiveImages = 8;
    maxConcurrentImages = Math.min(30, Math["ceil"](2.5 * e));
  }
}
function printImageSystemReport() {
  activeImages["size"];
  independentImageSprites["length"];
  freeImageIndices["length"];
  imageSpawnQueue["length"];
}
function setupImageObjectPool() {
  if (imageLoadingComplete && streamHeart) {
    imagePool["forEach"]((e) => {
      if (e && e.parent) {
        e["parent"]["remove"](e);
      }
    });
    imagePool.length = 0;
    activeImages["clear"]();
    freeImageIndices.length = 0;
    for (let e = 0; e < 45; e++) {
      const o = e % IMAGE_CONFIG["count"];
      const a = imageTextures[o];
      const s = buildImageSpriteMaterial(a, 1);
      const r = new THREE["Sprite"](s);
      const n = getAspectRatioAdjustedScale(a, IMAGE_CONFIG["scale"]);
      r["scale"]["set"](n.x, n.y, 1);
      r["visible"] = false;
      r["userData"] = {
        poolIndex: e,
        textureIndex: o,
        isActive: false,
        particleIndex: -1,
        aspectScale: n,
      };
      streamHeart["add"](r);
      imagePool["push"](r);
      freeImageIndices["push"](e);
    }
  }
}
function retrieveImageFromPool(t) {
  if (0 === freeImageIndices["length"]) {
    return null;
  }
  const o = freeImageIndices.pop();
  const a = imagePool[o];
  const s = currentImageIndex % IMAGE_CONFIG.count;
  const r = imageTextures[s];
  a.material["map"] = r;
  a.material["needsUpdate"] = true;
  const n = getAspectRatioAdjustedScale(r, 2.5);
  a["scale"]["set"](n.x, n.y, 1);
  a["userData"] = {
    ...a.userData,
    aspectScale: n,
    textureIndex: s,
    isActive: true,
    particleIndex: t,
  };
  activeImages["set"](t, o);
  currentImageIndex = (currentImageIndex + 1) % IMAGE_CONFIG.count;
  return a;
}
function releaseImageToPool(t) {
  const o = activeImages["get"](t);
  if (undefined !== o) {
    const a = imagePool[o];
    a["visible"] = false;
    a.material["opacity"] = 0;
    a["userData"]["isActive"] = false;
    a.userData["particleIndex"] = -1;
    activeImages["delete"](t);
    freeImageIndices["push"](o);
  }
}
function controlImageSpawningLogic(t) {
  const o = activeImages["size"] + independentImageSprites["length"];
  const a = o < minActiveImages;
  const s =
    t - lastImageSpawnTime >= IMAGE_CONFIG["spawnInterval"] &&
    o < maxConcurrentImages;
  if (!a && !s) {
    return;
  }
  if (a || t >= nextIndependentSpawnTime) {
    createFloatingImageSprite(t);
  }
  let r = selectBestParticleForImageSpawn();
  if (-1 !== r && freeImageIndices["length"] > 0) {
    imageSpawnQueue["push"]({
      particleIndex: r,
      imageIndex: currentImageIndex % IMAGE_CONFIG.count,
      spawnTime: t,
      isForced: a,
    });
    currentImageIndex = (currentImageIndex + 1) % IMAGE_CONFIG["count"];
    lastImageSpawnTime = t;
  }
}
function createFloatingImageSprite(t) {
  const o = Math["ceil"](0.8 * maxConcurrentImages);
  if (independentImageSprites["length"] >= o) {
    return;
  }
  const a = currentImageIndex % IMAGE_CONFIG["count"];
  const s = imageTextures[a];
  const r = buildImageSpriteMaterial(s, 1);
  const n = new THREE["Sprite"](r);
  const i = getAspectRatioAdjustedScale(s, IMAGE_CONFIG["scale"]);
  n.scale.set(i.x, i.y, 1);
  n["visible"] = false;
  n["userData"] = {
    isIndependent: true,
    imageIndex: a,
    spawnTime: t,
    lifeDuration: 6e3 + 2e3 * Math["random"](),
    startY: maxY,
    startX: 0,
    startZ: 0,
    aspectScale: i,
  };
  streamHeart.add(n);
  independentImageSprites["push"](n);
  currentImageIndex = (currentImageIndex + 1) % IMAGE_CONFIG["count"];
  lastImageSpawnTime = t;
  nextIndependentSpawnTime = t + 1.2 * IMAGE_CONFIG["spawnInterval"];
}
function animateFloatingImageSprites(t) {
  for (let o = independentImageSprites["length"] - 1; o >= 0; o--) {
    const a = independentImageSprites[o];
    const s = a["userData"];
    const r = (t - s.spawnTime) / s["lifeDuration"];
    if (r >= 1) {
      streamHeart.remove(a);
      independentImageSprites["splice"](o, 1);
      continue;
    }
    a["visible"] = true;
    const n = 1 - Math["pow"](1 - r, 2);
    const c = 10 + 4 * Math["sin"](r * Math.PI * 2);
    const l = THREE["MathUtils"].lerp(planeYCenter, c, n);
    const x = 1.5 + (s["imageIndex"] % 5) * 0.3;
    const m = s.imageIndex % 2 == 0 ? 1 : -1;
    const _ = r * x * Math.PI * 2 * m;
    const d = (1 - n) * (6 + 3 * Math["sin"](s.imageIndex));
    const p = Math.cos(_) * d;
    const h = Math.sin(_) * d;
    a["position"]["set"](p, l, h);
    if (r < 0.1) {
      a.material["opacity"] = r / 0.1;
      const t = s.aspectScale || {
        x: IMAGE_CONFIG["scale"],
        y: IMAGE_CONFIG["scale"],
      };
      a.scale["set"](t.x * (0.5 + 5 * r), t.y * (0.5 + 5 * r), 1);
    } else if (r > 0.4) {
      const t = (r - 0.4) / 0.6;
      a.material["opacity"] = 1 - t;
      const o = 1 - 0.9 * t;
      const s = a.userData["aspectScale"] || {
        x: 2.5,
        y: IMAGE_CONFIG["scale"],
      };
      a.scale["set"](s.x * o, s.y * o, 1);
      if (t > 0.9) {
        a["visible"] = false;
      }
    } else {
      a.material["opacity"] = 1;
      const t = s.aspectScale || {
        x: IMAGE_CONFIG["scale"],
        y: IMAGE_CONFIG["scale"],
      };
      a["scale"]["set"](t.x, t.y, 1);
    }
  }
}
function selectBestParticleForImageSpawn() {
  const e = [];
  for (let o = 0; o < streamCount; o++) {
    if (!activeImages.has(o)) {
      const a = streamState[o];
      e["push"]({
        index: o,
        state: a,
        priority: a === 1 ? 3 : a === 0 ? 2 : 1,
      });
    }
  }
  return 0 === e["length"]
    ? -1
    : (e.sort((e, o) => o["priority"] - e["priority"]), e[0]["index"]);
}
function handleQueuedImageSpawns() {
  for (; imageSpawnQueue.length > 0; ) {
    const { particleIndex: e, imageIndex: o } = imageSpawnQueue["shift"]();
    if (!activeImages["has"](e) && freeImageIndices["length"] > 0) {
      retrieveImageFromPool(e);
    }
  }
}
function applyMobileSpecificSettings() {
  if (!document["querySelector"]('meta[name="viewport"]')) {
    const e = document["createElement"]("meta");
    e.name = "viewport";
    e["content"] = "width=device-width, initial-scale=1.0, user-scalable=no";
    document["head"]["appendChild"](e);
  }
  document["body"]["style"].overflow = "hidden";
  document.body["style"].position = "fixed";
  document["body"].style["width"] = "100%";
  document.body["style"]["height"] = "100%";
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator["userAgent"]
    )
  ) {
    renderer["setPixelRatio"](Math["min"](window.devicePixelRatio, 2));
  }
}
setupImageStreaming();
let STAR_COUNT = 0;
let starAlpha = null;
let starPhase = null;
let starGeo = null;
const RingText = [...appData["messages"]];
let cameraAnimationStart = null;
let CAMERA_START_POSITION = {
  x: 0,
  y: 90,
  z: 30,
};
let userHasMovedCamera = false;
let streamHeartStarted = false;
let streamHeartActiveRatio = 0;
let firstResetCompleted = false;
const scene = new THREE["Scene"]();
const heartScene = new THREE["Scene"]();
const renderer = new THREE["WebGLRenderer"]({
  antialias: true,
  alpha: true,
});
let heartbeatEnabled = false;
const fadeObjects = [];
const explosionEffects = [];
const effectPool = {
  waves: [],
  sparkles: [],
  texts: [],
};
const activeTexts = new Map();
let isPulsing = false;
let pulseStartTime = 0;
let revealStart = null;
const STAGE = {
  RIBBON: 0,
  STREAM: 1,
  STAR: 2,
  SHOOT: 3,
  HEART: 4,
};
renderer["setPixelRatio"](window["devicePixelRatio"]);
renderer["setSize"](window["innerWidth"], window.innerHeight);
document["body"].appendChild(renderer["domElement"]);
applyMobileSpecificSettings();
let staticBottomHeart = null;
let staticTopHeart = null;
const camera = new THREE.PerspectiveCamera(
  45,
  window["innerWidth"] / window["innerHeight"],
  0.1,
  300
);
camera.position["set"](0, 90, 25);
camera.lookAt(0, 0, 0);
const controls = new OrbitControls(camera, renderer["domElement"]);
controls.enableDamping = true;
controls["minDistance"] = 5;
controls["maxDistance"] = 100;
controls["enableZoom"] = true;
controls.minPolarAngle = THREE["MathUtils"]["degToRad"](60);
controls.maxPolarAngle = THREE["MathUtils"]["degToRad"](135);
controls["enablePan"] = true;
const planeGeo1 = new THREE["PlaneGeometry"](30, 30);
const planeMat = new THREE["MeshBasicMaterial"]({
  color: 16711935,
  side: THREE["DoubleSide"],
  visible: false,
});
const invisiblePlane = new THREE["Mesh"](planeGeo1, planeMat);
invisiblePlane["rotation"].z = Math.PI;
invisiblePlane["position"].y = 10;
scene["add"](invisiblePlane);
const composerMain = new EffectComposer(renderer);
const renderPassMain = new RenderPass(scene, camera);
renderPassMain["clear"] = false;
composerMain["addPass"](renderPassMain);
const composerHeart = new EffectComposer(renderer);
composerHeart["addPass"](new RenderPass(heartScene, camera));
const afterimagePass = new AfterimagePass();
afterimagePass["uniforms"]["damp"]["value"] = 0.9;
composerHeart["addPass"](afterimagePass);
scene["add"](new THREE.AmbientLight(16777215, 0.6));
const p1 = new THREE["PointLight"](16777215, 1.2);
p1["position"]["set"](10, 10, 10);
scene["add"](p1);
const p2 = new THREE["PointLight"](16738047, 0.8);
function generateGlowCircleTexture() {
  const e = document["createElement"]("canvas");
  e["width"] = 256;
  e.height = 256;
  const o = e["getContext"]("2d");
  const s = o["createRadialGradient"](
    128,
    128,
    50.800000000000004,
    128,
    128,
    127
  );
  s.addColorStop(0, "rgba(255,105,180,0.6)");
  s["addColorStop"](1, "rgba(255,20,147,0)");
  o["fillStyle"] = s;
  o["beginPath"]();
  o["arc"](128, 128, 127, 0, 2 * Math.PI);
  o["closePath"]();
  o["fill"]();
  const r = o.createRadialGradient(128, 128, 0, 128, 128, 76.2);
  r["addColorStop"](0, "rgba(255,255,255,1)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  o.fillStyle = r;
  o.beginPath();
  o["arc"](128, 128, 76.2, 0, 2 * Math.PI);
  o["closePath"]();
  o["fill"]();
  const n = new THREE["CanvasTexture"](e);
  n["minFilter"] = THREE.LinearFilter;
  n["magFilter"] = THREE["LinearFilter"];
  n["needsUpdate"] = true;
  return n;
}
p2.position["set"](-10, -10, -10);
scene["add"](p2);
const circleTexture = generateGlowCircleTexture();
const heartShape = new THREE.Shape();
heartShape["moveTo"](5, 5);
heartShape["bezierCurveTo"](5, 5, 4, 0, 0, 0);
heartShape["bezierCurveTo"](-6, 0, -6, 7, -6, 7);
heartShape["bezierCurveTo"](-6, 11, -3, 15.4, 5, 19);
heartShape["bezierCurveTo"](12, 15.4, 16, 11, 16, 7);
heartShape["bezierCurveTo"](16, 7, 16, 0, 10, 0);
heartShape["bezierCurveTo"](7, 0, 5, 5, 5, 5);
const polyPts = heartShape["getPoints"](100);
function isPointInsidePolygon(t, e) {
  let o = false;
  let a = 0;
  for (let s = e["length"] - 1; a < e.length; s = a++) {
    const r = e[a].x;
    const n = e[a].y;
    const i = e[s].x;
    const c = e[s].y;
    if (n > t.y != c > t.y && t.x < ((i - r) * (t.y - n)) / (c - n) + r) {
      o = !o;
    }
  }
  return o;
}
const polyShift = polyPts["map"]((t) => ({
  x: t.x - 5,
  y: t.y - 7,
}));
const BORDER_THRESHOLD =
  0.1 *
  (Math["max"](...polyPts["map"]((t) => t.x)) -
    Math["min"](...polyPts["map"]((t) => t.x)));
function calculateMinimumDistanceToBorder(t, e) {
  let a = Infinity;
  for (let s = 0; s < polyShift.length; s++) {
    const r = polyShift[s];
    const n = polyShift[(s + 1) % polyShift["length"]];
    const i = n.x - r.x;
    const c = n.y - r.y;
    const l = ((t - r.x) * i + (e - r.y) * c) / (i * i + c * c);
    const x = Math["max"](0, Math.min(1, l));
    const m = (t - (r.x + x * i)) ** 2 + (e - (r.y + x * c)) ** 2;
    if (m < a) {
      a = m;
    }
  }
  return Math["sqrt"](a);
}
const raycaster = new THREE.Raycaster();
const mouse = new THREE["Vector2"]();
const HEART_CENTER_TARGET = new THREE["Vector3"](0, 10, 0);
function createHeartExplosion(t) {
  mouse.x = (t.clientX / window["innerWidth"]) * 2 - 1;
  mouse.y = (-t["clientY"] / window["innerHeight"]) * 2 + 1;
  raycaster["setFromCamera"](mouse, camera);
  const o = new THREE["Vector3"]();
  raycaster["ray"].at(explosionDistance, o);
  const a = new THREE["Group"]();
  const s = makeMat({
    map: circleTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    alphaSupport: true,
    vertexColors: true,
  });
  const r = 30 + 20 * Math["random"]();
  const n = [];
  const i = [];
  const c = [];
  const l = [];
  const x = new THREE["Color"]()["setHSL"](Math.random(), 0.9, 0.7);
  for (let t = 0; t < r; t++) {
    n["push"](o.x, o.y, o.z);
    const t = x["clone"]()["offsetHSL"](0.2 * Math["random"]() - 0.1, 0, 0);
    i.push(t.r, t.g, t.b);
    c["push"](0.8 * Math["random"]() + 0.2);
    const a = Math["random"]() * Math.PI * 2;
    const s = Math["acos"](2 * Math["random"]() - 1);
    const r = 15 * Math["random"]() + 10;
    const m = new THREE["Vector3"]();
    m["setFromSphericalCoords"](1, a, s);
    l["push"](m["multiplyScalar"](r));
  }
  const m = new THREE["BufferGeometry"]();
  m["setAttribute"]("position", new THREE["Float32BufferAttribute"](n, 3));
  m["setAttribute"]("color", new THREE["Float32BufferAttribute"](i, 3));
  m["setAttribute"]("size", new THREE.Float32BufferAttribute(c, 1));
  const _ = new THREE.Points(m, s);
  a["add"](_);
  a.userData["velocities"] = l;
  a.userData["life"] = 1;
  scene["add"](a);
  explosionEffects["push"](a);
}
function setupEffectPools() {
  const e = document["createElement"]("canvas");
  e["width"] = 256;
  e["height"] = 256;
  const o = e["getContext"]("2d");
  const a = o.createRadialGradient(128, 128, 0, 128, 128, 128);
  a["addColorStop"](0, "rgba(255,255,255,1)");
  a["addColorStop"](0.3, "rgba(255,255,255,0.5)");
  a.addColorStop(1, "rgba(255,255,255,0)");
  o["fillStyle"] = a;
  o.fillRect(0, 0, 256, 256);
  const s = new THREE["CanvasTexture"](e);
  for (let e = 0; e < 5; e++) {
    const e = new THREE["MeshBasicMaterial"]({
      map: s,
      blending: THREE["AdditiveBlending"],
      transparent: true,
      depthWrite: false,
    });
    const o = new THREE["Mesh"](new THREE["PlaneGeometry"](20, 20), e);
    o["visible"] = false;
    o["userData"]["active"] = false;
    scene["add"](o);
    effectPool.waves["push"](o);
    const r = new THREE["BufferGeometry"]();
    r["setAttribute"](
      "position",
      new THREE["BufferAttribute"](new Float32Array(300), 3)["setUsage"](
        THREE["DynamicDrawUsage"]
      )
    );
    const n = makeMat({
      map: circleTexture,
      blending: THREE["AdditiveBlending"],
      alphaSupport: true,
      depthWrite: false,
    });
    const i = new THREE["Points"](r, n);
    i["visible"] = false;
    i["userData"]["active"] = false;
    scene["add"](i);
    effectPool["sparkles"]["push"](i);
  }
  const r = appData?.["messages"] || [];
  const n = (appData?.messages || [])["join"](" ")["split"](" ");
  [...new Set(n["filter"]((e) => e["length"] > 0))]["forEach"]((e) => {
    const a = createFlyingTextTexture(e);
    const s = new THREE["SpriteMaterial"]({
      map: a,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const r = new THREE["Sprite"](s);
    const n = a["image"]["width"] / a["image"]["height"];
    r.scale["set"](1.5 * n, 1.5, 1);
    r["visible"] = false;
    r["userData"]["active"] = false;
    r["userData"].text = e;
    streamHeart.add(r);
    effectPool["texts"]["push"](r);
  });
  r["forEach"]((e) => {
    const a = createFlyingTextTexture(e);
    const s = new THREE.SpriteMaterial({
      map: a,
      transparent: true,
      depthWrite: false,
      blending: THREE["AdditiveBlending"],
    });
    const r = new THREE["Sprite"](s);
    const n = a["image"]["width"] / a["image"]["height"];
    r.scale.set(2 * n, 2, 1);
    r["visible"] = false;
    r["userData"]["active"] = false;
    streamHeart.add(r);
    effectPool["texts"]["push"](r);
  });
}
function releaseTextToPool(t) {
  if (activeTexts["has"](t)) {
    const o = activeTexts["get"](t);
    o["visible"] = false;
    o["userData"]["active"] = false;
    activeTexts.delete(t);
  }
}
function createFlyingTextTexture(t) {
  const o = document["createElement"]("canvas");
  o.width = 1024;
  o["height"] = 128;
  const a = o["getContext"]("2d");
  a["font"] = 'bold 70px "Mali", sans-serif';
  a.textAlign = "center";
  a["textBaseline"] = "middle";
  a["strokeStyle"] = "rgba(160, 30, 95, 0.9)";
  a.lineWidth = 8;
  a.strokeText(t, o.width / 2, o["height"] / 2);
  a["fillStyle"] = "#ffffff";
  a["fillText"](t, o.width / 2, o["height"] / 2);
  const s = new THREE["CanvasTexture"](o);
  s["minFilter"] = THREE["LinearFilter"];
  s["magFilter"] = THREE.LinearFilter;
  return s;
}
const positions = [];
const xs = polyPts.map((t) => t.x);
const ys = polyPts.map((t) => t.y);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math["max"](...ys);
const threshold = minY + (maxY - minY) / 6;
for (; positions["length"] / 3 < 7e3; ) {
  const t = Math["random"]() * (maxX - minX) + minX;
  const e = Math["random"]() * (maxY - minY) + minY;
  if (
    isPointInsidePolygon(
      {
        x: t,
        y: e,
      },
      polyPts
    )
  ) {
    let o = Infinity;
    for (let a = 0; a < polyPts.length; a++) {
      const s = polyPts[a];
      const r = polyPts[(a + 1) % polyPts.length];
      const n = r.x - s.x;
      const i = r.y - s.y;
      const c = ((t - s.x) * n + (e - s.y) * i) / (n * n + i * i);
      const l = Math["max"](0, Math["min"](1, c));
      const x = t - (s.x + l * n);
      const m = e - (s.y + l * i);
      const _ = x * x + m * m;
      if (_ < o) {
        o = _;
      }
    }
    const a = 1 / (1 + 2 * Math["sqrt"](o));
    if (Math.random() < a) {
      const o = 3.6 * (Math["random"]() - 0.5);
      positions.push(t - 5, e - 7, o);
    }
  }
}
let minZ = Infinity;
let maxZval = -Infinity;
for (let t = 2; t < positions["length"]; t += 3) {
  const e = positions[t];
  if (e < minZ) {
    minZ = e;
  }
  if (e > maxZval) {
    maxZval = e;
  }
}
const heartWidth = maxX - minX;
const rVortex = 0.6 * heartWidth;
const INDENT_Y = maxY - 0.25 * (maxY - minY);
const INDENT_HALF_WIDTH = 0.35 * heartWidth;
const staticGeo = new THREE.BufferGeometry();
const originalPositions = positions.slice();
staticGeo.setAttribute(
  "position",
  new THREE["Float32BufferAttribute"](originalPositions, 3)
);
const colors = [];
for (let t = 0; t < positions.length; t += 3) {
  colors["push"](heartInitialColor.r, heartInitialColor.g, heartInitialColor.b);
}
staticGeo["setAttribute"](
  "color",
  new THREE["Float32BufferAttribute"](colors, 3)
);
const staticSizes = new Float32Array(positions.length / 3);
for (let t = 0; t < staticSizes["length"]; t++) {
  staticSizes[t] = 2 * (0.3 * Math["random"]() + 0.2);
}
staticGeo["setAttribute"](
  "size",
  new THREE["Float32BufferAttribute"](staticSizes, 1)
);
const topIndices = [];
for (let t = 0; t < positions["length"]; t += 3) {
  if (
    positions[t + 1] >
    threshold + 0.1 * (Math["random"]() - 0.5) * (maxY - minY)
  ) {
    topIndices["push"](t / 3);
  }
}
const topSet = new Set(topIndices);
let bottomPositions = [];
const bottomColors = [];
const bottomSizes = [];
const topPositionsArr = [];
const topColors = [];
const topSizes = [];
const topAlpha = [];
const idxToTopIdx = new Int32Array(positions["length"] / 3).fill(-1);
let t = 0;
for (let e = 0; t < positions["length"]; t += 3) {
  const o = t / 3;
  const a = staticSizes[o];
  const s = positions[t];
  const r = positions[t + 1];
  const n = positions[t + 2];
  if (topSet["has"](o)) {
    topPositionsArr["push"](s, r, n);
    topColors["push"](
      heartInitialColor.r,
      heartInitialColor.g,
      heartInitialColor.b
    );
    topSizes["push"](a);
    const t = Math["abs"](s) < INDENT_HALF_WIDTH && r > INDENT_Y;
    topAlpha["push"](t ? 0 : 1);
    idxToTopIdx[o] = e++;
  } else {
    bottomPositions["push"](s, r, n);
    bottomColors["push"](
      heartInitialColor.r,
      heartInitialColor.g,
      heartInitialColor.b
    );
    bottomSizes["push"](a);
  }
}
staticGeo["setAttribute"](
  "position",
  new THREE["Float32BufferAttribute"](topPositionsArr, 3)
);
staticGeo["setAttribute"](
  "color",
  new THREE.Float32BufferAttribute(topColors, 3)
);
staticGeo["setAttribute"](
  "size",
  new THREE["Float32BufferAttribute"](topSizes, 1)
);
staticGeo["setAttribute"](
  "alpha",
  new THREE["BufferAttribute"](new Float32Array(topAlpha), 1)
);
staticGeo["attributes"]["position"]["needsUpdate"] = true;
staticGeo["attributes"]["alpha"]["needsUpdate"] = true;
const topCount = topPositionsArr.length / 3;
const topRadiusArr = new Float32Array(topCount);
const topPhaseArr = new Float32Array(topCount);
const topDelayArr = new Float32Array(topCount);
for (let t = 0; t < topCount; t++) {
  const e = topPositionsArr[3 * t];
  const o = topPositionsArr[3 * t + 2];
  const a = Math["sqrt"](e * e + o * o);
  topRadiusArr[t] = a;
  topPhaseArr[t] = Math["atan2"](o, e);
  topDelayArr[t] = 10 * Math["random"]();
}
const BASE_OMEGA = (-1 * Math.PI) / 10;
let minBottomY = Infinity;
let maxBottomY = -Infinity;
for (let t = 1; t < bottomPositions["length"]; t += 3) {
  const e = bottomPositions[t];
  if (e < minBottomY) {
    minBottomY = e;
  }
  if (e > maxBottomY) {
    maxBottomY = e;
  }
}
const Y_THRESHOLD = minBottomY + 0.5 * (maxBottomY - minBottomY);

{
  const t = [];
  const e = [];
  const o = [];
  for (let a = 0; a < bottomPositions.length; a += 3) {
    const s = bottomPositions[a + 1];
    if (s >= Y_THRESHOLD) {
      for (let r = 1; r < 2; r++) {
        t["push"](bottomPositions[a], s, bottomPositions[a + 2]);
        e["push"](
          heartInitialColor.r,
          heartInitialColor.g,
          heartInitialColor.b
        );
        o["push"](bottomSizes[a / 3]);
      }
    }
  }
  bottomPositions["push"](...t);
  bottomColors["push"](...e);
  bottomSizes["push"](...o);
}
const rotPos = [];
const rotColors = [];
const rotSizes = [];
const staticBotPos = [];
const staticBotColors = [];
const staticBotSizes = [];
for (let t = 0; t < bottomPositions.length; t += 3) {
  if (Math["random"]() < 0.2) {
    rotPos["push"](
      bottomPositions[t],
      bottomPositions[t + 1],
      bottomPositions[t + 2]
    );
    rotColors["push"](
      heartInitialColor.r,
      heartInitialColor.g,
      heartInitialColor.b
    );
    rotSizes["push"](bottomSizes[t / 3]);
  } else {
    staticBotPos.push(
      bottomPositions[t],
      bottomPositions[t + 1],
      bottomPositions[t + 2]
    );
    staticBotColors.push(
      heartInitialColor.r,
      heartInitialColor.g,
      heartInitialColor.b
    );
    staticBotSizes["push"](bottomSizes[t / 3]);
  }
}
bottomPositions["length"] = 0;
bottomPositions.push(...rotPos);
bottomColors["length"] = 0;
bottomColors.push(...rotColors);
bottomSizes.length = 0;
bottomSizes.push(...rotSizes);
const bottomCount = bottomPositions["length"] / 3;
const bottomRadiusArr = new Float32Array(bottomCount);
const bottomPhaseArr = new Float32Array(bottomCount);
const bottomDelayArr = new Float32Array(bottomCount);
const bottomAlphaArr = new Float32Array(bottomCount)["fill"](1);
const bottomIsLow = new Uint8Array(bottomCount);
for (let t = 0; t < bottomCount; t++) {
  const e = bottomPositions[3 * t];
  const o = bottomPositions[3 * t + 1];
  const a = bottomPositions[3 * t + 2];
  const s = o < Y_THRESHOLD;
  bottomIsLow[t] = s ? 1 : 0;
  if (s) {
    const e = 0 + ((o - minBottomY) / (Y_THRESHOLD - minBottomY)) * 0.3;
    bottomAlphaArr[t] = Math["random"]() < e ? 1 : 0;
  } else {
    bottomAlphaArr[t] = 1;
  }
  const r = Math["sqrt"](e * e + a * a);
  const n = Math.atan2(a, e);
  const i = Math["min"](1, Math["abs"](e) / (0.25 * heartWidth));
  const c = 1.5 * Math["pow"](1 - i, 3) + 1;
  bottomRadiusArr[t] = r * c;
  bottomPhaseArr[t] = n;
  bottomDelayArr[t] = 10 * Math["random"]();
}
const bottomAlphaBase = Float32Array["from"](bottomAlphaArr);
const bottomGeo = new THREE["BufferGeometry"]();
bottomGeo.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(bottomPositions, 3)
);
bottomGeo["setAttribute"](
  "color",
  new THREE["Float32BufferAttribute"](bottomColors, 3)["setUsage"](
    THREE["DynamicDrawUsage"]
  )
);
bottomGeo["setAttribute"](
  "size",
  new THREE.Float32BufferAttribute(bottomSizes, 1)
);
bottomGeo["setAttribute"](
  "alpha",
  new THREE["BufferAttribute"](bottomAlphaArr, 1)
);
const matBottom = makeMat({
  map: circleTexture,
  alphaSupport: true,
  vClipSlope: 0.3,
  clipFrontZ: 0.3,
});
matBottom["alphaTest"] = 0.5;
const bottomHeart = new THREE["Points"](bottomGeo, matBottom);
bottomHeart.rotation.z = Math.PI;
bottomHeart.renderOrder = 0;
scene["add"](bottomHeart);
const topPointVisibility = new Array(topIndices["length"])["fill"](true);
let hiddenTopCount = 0;
const matStatic = makeMat({
  map: circleTexture,
  alphaSupport: true,
});
matStatic.alphaTest = 0.5;
const staticHeart = new THREE["Points"](staticGeo, matStatic);
staticHeart["rotation"].z = Math.PI;
staticHeart.renderOrder = 0;
scene.add(staticHeart);
{
  const t = [];
  const e = [];
  const o = [];
  for (let a = 0; a < topPositionsArr.length; a += 3) {
    const s =
      calculateMinimumDistanceToBorder(
        topPositionsArr[a] + 5,
        topPositionsArr[a + 1] + 7
      ) < BORDER_THRESHOLD || Math["random"]() < 0.3;
    if (Math.random() < 0.5 && s) {
      t["push"](
        topPositionsArr[a],
        topPositionsArr[a + 1],
        topPositionsArr[a + 2]
      );
      e["push"](heartInitialColor.r, heartInitialColor.g, heartInitialColor.b);
      o["push"](topSizes[Math["floor"](a / 3)]);
    }
  }
  if (t["length"]) {
    const a = new THREE["BufferGeometry"]();
    a["setAttribute"]("position", new THREE["Float32BufferAttribute"](t, 3));
    a["setAttribute"](
      "color",
      new THREE["Float32BufferAttribute"](e, 3)["setUsage"](
        THREE.DynamicDrawUsage
      )
    );
    a["setAttribute"]("size", new THREE["Float32BufferAttribute"](o, 1));
    const s = makeMat({
      map: circleTexture,
      alphaSupport: true,
    });
    s["alphaTest"] = 0.5;
    staticTopHeart = new THREE["Points"](a, s);
    staticTopHeart["rotation"].z = Math.PI;
    staticTopHeart.renderOrder = 0;
    scene["add"](staticTopHeart);
  }
}
if (staticBotPos["length"] > 0) {
  const t = new THREE["BufferGeometry"]();
  t.setAttribute("position", new THREE.Float32BufferAttribute(staticBotPos, 3));
  t["setAttribute"](
    "color",
    new THREE["Float32BufferAttribute"](staticBotColors, 3)["setUsage"](
      THREE["DynamicDrawUsage"]
    )
  );
  t["setAttribute"](
    "size",
    new THREE["Float32BufferAttribute"](staticBotSizes, 1)
  );
  const e = makeMat({
    map: circleTexture,
    alphaSupport: true,
  });
  e["alphaTest"] = 0.5;
  staticBottomHeart = new THREE["Points"](t, e);
  staticBottomHeart["rotation"].z = Math.PI;
  staticBottomHeart["renderOrder"] = 0;
  scene["add"](staticBottomHeart);
}
const rimIndices = [];
for (const t of topIndices)
  if (
    calculateMinimumDistanceToBorder(positions[3 * t], positions[3 * t + 1]) <
    BORDER_THRESHOLD
  ) {
    rimIndices.push(t);
  }
const streamSource = rimIndices.length ? rimIndices : topIndices;
const streamCount = Math["floor"](0.2 * streamSource["length"]);
const targetIdxArr = new Uint32Array(streamCount);
for (let t = 0; t < streamCount; t++) {
  targetIdxArr[t] = streamSource[t % streamSource["length"]];
}
const planeIdxForStream = new Int32Array(streamCount)["fill"](-1);
const streamPositions = new Float32Array(3 * streamCount);
const streamGeo = new THREE.BufferGeometry();
const streamAlpha = new Float32Array(streamCount)["fill"](1);
streamGeo.setAttribute("alpha", new THREE["BufferAttribute"](streamAlpha, 1));
streamGeo.setAttribute(
  "position",
  new THREE["BufferAttribute"](streamPositions, 3)["setUsage"](
    THREE.DynamicDrawUsage
  )
);
const streamColors = new Float32Array(3 * streamCount);
for (let t = 0; t < streamCount; t++) {
  streamColors[3 * t] = heartInitialColor.r;
  streamColors[3 * t + 1] = heartInitialColor.g;
  streamColors[3 * t + 2] = heartInitialColor.b;
}
streamGeo["setAttribute"](
  "color",
  new THREE["BufferAttribute"](streamColors, 3)
);
const streamSizes = new Float32Array(streamCount);
for (let t = 0; t < streamCount; t++) {
  streamSizes[t] = 2 * (0.3 * Math["random"]() + 0.2 + 0.1) * 1;
}
for (let t = 0; t < streamCount; t++) {
  if (Math["random"]() < 0.1) {
    streamSizes[t] *= 1.5;
    streamColors[3 * t] = heartInitialColor.r;
    streamColors[3 * t + 1] = heartInitialColor.g;
    streamColors[3 * t + 2] = heartInitialColor.b;
  }
}
streamGeo["setAttribute"]("size", new THREE["BufferAttribute"](streamSizes, 1));
const matStream = makeMat({
  map: circleTexture,
  alphaSupport: true,
  clipBandWidth: INDENT_HALF_WIDTH,
  clipFrontZ: 0.3,
});
matStream["alphaTest"] = 0.5;
const streamHeart = new THREE["Points"](streamGeo, matStream);
streamHeart.rotation.z = Math.PI;
streamHeart.renderOrder = 1;
scene["add"](streamHeart);
streamHeart.visible = false;
fadeObjects["push"](streamHeart);
streamHeart.userData.fadeStage = 1;
const PLANE_COUNT = Math["floor"](120 * rVortex);
const planePositions = [];
const planeColors = [];
const planeSizes = [];
const planeAlphaArr = new Float32Array(PLANE_COUNT)["fill"](1);
for (let t = 0; t < PLANE_COUNT; t++) {
  const t = Math["random"]() * Math.PI * 2;
  const e = Math.sqrt(Math.random()) * rVortex;
  planePositions.push(Math.cos(t) * e, maxY - 7.5, Math["sin"](t) * e);
  planeColors["push"](
    heartInitialColor.r,
    heartInitialColor.g,
    heartInitialColor.b
  );
  planeSizes["push"](1 * Math["random"]() + 0.25);
}
const planeGeo = new THREE["BufferGeometry"]();
planeGeo.setAttribute(
  "position",
  new THREE["Float32BufferAttribute"](planePositions, 3)
);
planeGeo.setAttribute(
  "color",
  new THREE["Float32BufferAttribute"](planeColors, 3)
);
planeGeo.setAttribute(
  "size",
  new THREE["Float32BufferAttribute"](planeSizes, 1)
);
planeGeo["setAttribute"]("alpha", new THREE.BufferAttribute(planeAlphaArr, 1));
const matPlane = makeMat({
  map: circleTexture,
  alphaSupport: true,
});
matPlane.alphaTest = 0.5;
const planeLayer = new THREE["Points"](planeGeo, matPlane);
planeLayer.rotation.z = Math.PI;
scene.add(planeLayer);
fadeObjects["push"](planeLayer);
if (fadeObjects["includes"](planeLayer)) {
  fadeObjects["splice"](fadeObjects["indexOf"](planeLayer), 1);
}
planeLayer["visible"] = true;
function createTextSpriteTexture(t) {
  const o = document.createElement("canvas");
  o["width"] = o.height = 128;
  const a = o["getContext"]("2d");
  a["fillStyle"] = "rgba(0,0,0,0)";
  a["fillRect"](0, 0, 128, 128);
  a.textAlign = "center";
  a.textBaseline = "middle";
  a["font"] =
    '300 70.4px "Mali","Comfortaa","Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",sans-serif';
  a["lineWidth"] = 7.68;
  a["strokeStyle"] = "rgba(160, 30, 95, 0.9)";
  a.strokeText(t, 64, 64);
  a.fillStyle = "#ffffff";
  a["fillText"](t, 64, 64);
  const s = new THREE["CanvasTexture"](o);
  s["minFilter"] = s["magFilter"] = THREE["LinearFilter"];
  return s;
}
planeGeo["attributes"]["color"].setUsage(THREE["DynamicDrawUsage"]);
const ringCharsFull = RingText["join"]("");
const ringChars = Array["from"](ringCharsFull);
const charMatMap = {};
function generateTextRingTexture(t) {
  const o = document["createElement"]("canvas");
  o.width = 2048;
  o["height"] = 256;
  const a = o["getContext"]("2d");
  a["fillStyle"] = "rgba(0,0,0,0)";
  a.fillRect(0, 0, o["width"], o["height"]);
  a["font"] = 'bold 80px "Mali", sans-serif';
  a.textAlign = "center";
  a.textBaseline = "middle";
  const s = o.height / t["length"];
  t["forEach"]((t, r) => {
    const i = (r + 0.5) * s;
    a["shadowColor"] = "#ff40c8";
    a["shadowBlur"] = 0;
    a.fillStyle = "#ff40c8";
    a.fillText(t, o.width / 2, i);
    a["shadowBlur"] = 0;
    a["strokeStyle"] = "rgba(160, 30, 95, 0.9)";
    a["lineWidth"] = 3;
    a["strokeText"](t, o["width"] / 2, i);
    a["fillStyle"] = "#ffffff";
    a.fillText(t, o["width"] / 2, i);
  });
  const r = new THREE.CanvasTexture(o);
  r["needsUpdate"] = true;
  return r;
}
[...new Set(ringChars)].forEach((t) => {
  charMatMap[t] = new THREE["SpriteMaterial"]({
    map: createTextSpriteTexture(t),
    transparent: true,
    depthWrite: false,
  });
});
const RING_Y_OFFSET = 2 * -maxY - 0.5;
const ringGeo = new THREE["CylinderGeometry"](
  rVortex,
  rVortex,
  1,
  128,
  1,
  true
);
const RING_COUNT = Math.ceil((rVortex - 0.25) / 2);
const RING_FLIP_Y = Math.PI;
const ribbon = new THREE.Group();
ribbon.position.set(0, maxY + RING_Y_OFFSET, 0);
ribbon.rotation.z = Math.PI;
scene["add"](ribbon);
ribbon["visible"] = true;
for (let t = 0; t < RING_COUNT; t++) {
  const e = generateTextRingTexture([RingText[t % RingText.length]]);
  e["wrapS"] = THREE.RepeatWrapping;
  e["repeat"]["set"](2, 1);
  e["offset"].x = 1;
  const o = new THREE["MeshBasicMaterial"]({
    map: e,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const a = new THREE["Mesh"](ringGeo, o);
  a["rotation"].x = Math.PI;
  const s = rVortex - 2 * t;
  const r = 2 * (Math["random"]() - 0.5) * 0.3;
  a["userData"]["radius"] = s + r;
  a["userData"]["phase"] = Math["random"]() * Math.PI * 2;
  const n = s / rVortex;
  a["scale"]["set"](n, 3.5, n);
  a.material["opacity"] = 1;
  a["material"]["transparent"] = true;
  a["material"]["depthWrite"] = false;
  a["renderOrder"] = t;
  ribbon["add"](a);
}
const vortexIndices = [];
for (let t = 0; t < positions.length / 3; t++) {
  if (!topIndices["includes"](t)) {
    vortexIndices.push(t);
  }
}
const vortexCount = vortexIndices["length"];
const vortexPositions = new Float32Array(3 * vortexCount);
const vortexPhase = new Float32Array(vortexCount);
const vortexRadius = new Float32Array(vortexCount);
for (let t = 0; t < vortexCount; t++) {
  vortexPhase[t] = Math["random"]() * Math.PI * 2;
  const e = Math["random"]() * rVortex;
  vortexRadius[t] = e;
  vortexPositions[3 * t] = Math["cos"](vortexPhase[t]) * e;
  vortexPositions[3 * t + 1] = maxY;
  vortexPositions[3 * t + 2] = Math["sin"](vortexPhase[t]) * e;
}
const vortexGeo = new THREE["BufferGeometry"]();
vortexGeo["setAttribute"](
  "position",
  new THREE["BufferAttribute"](vortexPositions, 3).setUsage(
    THREE.DynamicDrawUsage
  )
);
const vortexColors = new Float32Array(3 * vortexCount);
for (let t = 0; t < vortexCount; t++) {
  vortexColors[3 * t] = heartInitialColor.r;
  vortexColors[3 * t + 1] = heartInitialColor.g;
  vortexColors[3 * t + 2] = heartInitialColor.b;
}
vortexGeo["setAttribute"](
  "color",
  new THREE["BufferAttribute"](vortexColors, 3)
);
const vortexSizes = new Float32Array(vortexCount);
for (let t = 0; t < vortexCount; t++) {
  vortexSizes[t] = 0.2 * Math.random() + 0.15;
}
vortexGeo.setAttribute("size", new THREE["BufferAttribute"](vortexSizes, 1));
const vortexMat = makeMat({
  map: circleTexture,
  blending: THREE["AdditiveBlending"],
  opacity: 0.8,
});
vortexMat["onBeforeCompile"] = function (t) {
  t["vertexShader"] = t["vertexShader"]["replace"](
    "uniform float size;",
    "attribute float size;"
  );
};
const heartLayers = [
  staticHeart,
  bottomHeart,
  staticBottomHeart,
  staticTopHeart,
];
heartLayers["forEach"]((t) => {
  if (t) {
    scene["remove"](t);
    heartScene["add"](t);
  }
});
heartLayers["forEach"]((t) => {
  if (t) {
    t["visible"] = false;
    t["userData"]["fadeStage"] = STAGE["HEART"];
    if (!fadeObjects["includes"](t)) {
      fadeObjects["push"](t);
    }
  }
});
[staticHeart, bottomHeart, staticTopHeart, staticBottomHeart]["forEach"](
  (t) => {
    if (t) {
      t["position"].y += 10;
    }
  }
);
[streamHeart, ribbon]["forEach"]((t) => {
  if (t) {
    t["position"].y += 8;
  }
});
const startTimes = new Float32Array(streamCount);
const streamState = new Uint8Array(streamCount);
const curRadiusArr = new Float32Array(streamCount);
const ascendStart = new Float32Array(streamCount);
const spiralPhase = new Float32Array(streamCount);
const initialRadius = new Float32Array(streamCount);
const extraRotArr = new Float32Array(streamCount);
const MAX_TOP_HIDE = Math["floor"](1 * topIndices.length);
const streamRiseDuration = new Float32Array(streamCount);
const streamOffsets = new Float32Array(3 * streamCount);
for (let t = 0; t < streamCount; t++) {
  const e = 3 * t;
  const o = Math["random"]() * Math.PI * 2;
  const a = Math["acos"](2 * Math["random"]() - 1);
  streamOffsets[e] = 0.4 * Math["sin"](a) * Math["cos"](o);
  streamOffsets[e + 1] = 0.4 * Math["sin"](a) * Math["sin"](o);
  streamOffsets[e + 2] = 0.4 * Math.cos(a);
}
function initializeStreamParticleState(t, e) {
  const a = 3 * t;
  const s = targetIdxArr[t];
  let r = -1;
  for (let t = 0; t < 100; t++) {
    const t = Math["floor"](Math["random"]() * PLANE_COUNT);
    const e = planePositions[3 * t];
    const a = planePositions[3 * t + 2];
    if (Math["hypot"](e, a) <= 0.26) {
      r = t;
      break;
    }
  }
  if (-1 === r) {
    r = Math["floor"](Math["random"]() * PLANE_COUNT);
  }
  planeIdxForStream[t] = r;
  const n = Math["random"]() * Math.PI * 2;
  planePositions[3 * r] = Math["cos"](n) * rVortex;
  planePositions[3 * r + 2] = Math.sin(n) * rVortex;
  planeGeo.attributes.position["needsUpdate"] = true;
  const i = planeLayer["rotation"].y;
  const c = Math["cos"](i);
  const l = Math["sin"](i);
  const x = c * planePositions[3 * r] - l * planePositions[3 * r + 2];
  const m = l * planePositions[3 * r] + c * planePositions[3 * r + 2];
  streamPositions[a] = x;
  streamPositions[a + 1] = planePositions[3 * r + 1];
  streamPositions[a + 2] = m;
  const _ = 0.25 + (rVortex - 0.25) * Math.random();
  const d = Math.random() * Math.PI * 2;
  streamPositions[a] = Math["cos"](d) * _;
  streamPositions[a + 1] = maxY;
  streamPositions[a + 2] = Math["sin"](d) * _;
  curRadiusArr[t] = _;
  spiralPhase[t] = d;
  streamState[t] = 0;
  startTimes[t] = e - (Math["random"]() * (rVortex - 0.25)) / 0.9;
  ascendStart[t] = 10 * Math["random"]();
  streamRiseDuration[t] = 8 + 4 * Math.random();
  const p = 0.5 + 1.5 * Math["random"]();
  const h = Math.random() < 0.5 ? -1 : 1;
  extraRotArr[t] = 2 * p * Math.PI * h;
  const u = idxToTopIdx[s];
  if (-1 !== u) {
    topAlpha[u] = 1;
    staticGeo["attributes"]["alpha"]["needsUpdate"] = true;
  }
  if (activeImages.has(t)) {
    releaseImageToPool(t);
  }
  if (activeTexts["has"](t)) {
    releaseTextToPool(t);
  }
  streamAlpha[t] = 1;
  streamGeo.attributes.alpha.needsUpdate = true;
}
for (let t = 0; t < streamCount; t++) {
  initializeStreamParticleState(t, 0);
}
streamGeo["attributes"]["position"]["needsUpdate"] = true;
streamGeo.attributes["alpha"]["needsUpdate"] = true;
const clock = new THREE["Clock"]();
let initialColorApplied = false;
function mainAnimationLoop() {
  requestAnimationFrame(mainAnimationLoop);
  let e = clock["getDelta"]();
  const o = clock.getElapsedTime();
  if (e > 0.1) {
    e = 0.1;
  }
  for (let l = 0; l < PLANE_COUNT; l++) {
    const x = 3 * l;
    let m = planePositions[x];
    let _ = planePositions[x + 2];
    let d = Math["hypot"](m, _);
    if (d > 0.25) {
      d = Math["max"](0.25, d - 0.9 * e);
      const p = Math.atan2(_, m);
      planePositions[x] = Math["cos"](p) * d;
      planePositions[x + 2] = Math.sin(p) * d;
    }
  }
  planeGeo.attributes["position"]["needsUpdate"] = true;
  if (planeLayer["visible"]) {
    planeLayer["visible"] = true;
  }
  planeLayer["rotation"].y = BASE_OMEGA * o;
  if (undefined !== ribbon) {
    ribbon["rotation"].y = planeLayer["rotation"].y + RING_FLIP_Y;
  }
  if (undefined !== ribbon && ribbon.children["length"]) {
    const h = rVortex - 0.25;
    ribbon["children"]["forEach"]((o, a) => {
      o["userData"]["radius"] -= 0.9 * e;
      if (o.userData.radius - 1.75 < 0.25) {
        o["userData"]["radius"] += h + 2;
      }
      const r = o["userData"].radius - 1.75;
      if (r < 1.25) {
        const t = THREE["MathUtils"].clamp((r - 0.25) / 1, 0, 1);
        o["material"]["opacity"] = t;
      }
      if (r < 0.25) {
        o["userData"].radius += h + 2;
        o["material"]["opacity"] = 0;
      }
      if (o["material"]["opacity"] < 1) {
        o["material"]["opacity"] = Math["min"](
          1,
          o["material"]["opacity"] + 2 * e
        );
      }
      const n = o["userData"]["radius"] / rVortex;
      o["scale"]["set"](n, 3.5, n);
      o["material"]["color"].set(16777215);
      o["rotation"].y = o.userData["phase"];
    });
  }
  camera["updateMatrixWorld"]();
  const a = camera["matrixWorldInverse"];
  cosmicDust["rotation"].y += 15e-5;
  if (streamHeartStarted) {
    streamHeart["matrixWorld"];
    new THREE["Vector3"]();
    new THREE["Vector3"]();
    const u = 1e3 * o;
    controlImageSpawningLogic(u);
    handleQueuedImageSpawns();
    animateFloatingImageSprites(u);
    if (u - lastStatusLogTime > 3e3) {
      printImageSystemReport();
      lastStatusLogTime = u;
    }
    for (let A = 0; A < streamCount; A++) {
      const I = 3 * A;
      const S = startTimes[A];
      const f = o - (S + (A % 5) * 1.6);
      const T = targetIdxArr[A];
      if (streamState[A] === 0) {
        const P = spiralPhase[A] + BASE_OMEGA * (o - startTimes[A]);
        streamPositions[I] = Math.cos(P) * curRadiusArr[A];
        streamPositions[I + 1] = maxY;
        streamPositions[I + 2] = Math["sin"](P) * curRadiusArr[A];
        if (activeImages["has"](A)) {
          releaseImageToPool(A);
        }
        streamAlpha[A] = 1;
        if (f >= ascendStart[A]) {
          streamState[A] = 1;
          startTimes[A] = o;
          initialRadius[A] = curRadiusArr[A];
        }
        continue;
      }
      if (f < -1.5) {
        const C = spiralPhase[A] + BASE_OMEGA * (o - S);
        streamPositions[I] = initialRadius[A] * Math["cos"](C);
        streamPositions[I + 1] = maxY;
        streamPositions[I + 2] = initialRadius[A] * Math["sin"](C);
        streamAlpha[A] = 0;
        continue;
      }
      if (f < 0) {
        const w = (f + 1.5) / 1.5;
        const b = w * w * (3 - 2 * w);
        streamAlpha[A] = b;
        if (activeImages["has"](A)) {
          releaseImageToPool(A);
        }
        const E = spiralPhase[A] + BASE_OMEGA * (o - S);
        streamPositions[I] = initialRadius[A] * Math["cos"](E);
        streamPositions[I + 1] = maxY;
        streamPositions[I + 2] = initialRadius[A] * Math["sin"](E);
        continue;
      }
      const g = streamRiseDuration[A];
      if (f >= g) {
        const y = (f - g) / 1.5;
        if (y < 1) {
          const O = y * y * (3 - 2 * y);
          streamAlpha[A] = 1 - O;
          if (activeImages["has"](A)) {
            const G = activeImages["get"](A);
            imagePool[G]["material"].opacity *= 1 - O;
          }
          const v = spiralPhase[A] + BASE_OMEGA * (o - S);
          streamPositions[I] = initialRadius[A] * Math["cos"](v);
          streamPositions[I + 1] = maxY;
          streamPositions[I + 2] = initialRadius[A] * Math["sin"](v);
          continue;
        }
        streamAlpha[A] = 1;
        if (activeImages["has"](A)) {
          releaseImageToPool(A);
        }
        initializeStreamParticleState(A, o);
        if (!firstResetCompleted) {
          firstResetCompleted = true;
        }
        continue;
      }
      streamAlpha[A] = 1;
      const M = f / g;
      if (M < 0.01) {
        let R;
        let H;
        let N;
        const D = spiralPhase[A] + BASE_OMEGA * (o - S);
        {
          const F = initialRadius[A];
          R = Math["cos"](D) * F;
          N = Math.sin(D) * F;
          const L = Math.min(1, M / 0.01);
          H = THREE["MathUtils"].lerp(maxY, maxY, L);
        }
        streamPositions[I] = R;
        streamPositions[I + 1] = H;
        streamPositions[I + 2] = N;
      } else {
        const B = (M - 0.01) / 0.99;
        const z = 1 - Math.pow(1 - B, 3);
        const Y = spiralPhase[A] + BASE_OMEGA * (o - S);
        const U = initialRadius[A];
        const W = Math["cos"](Y) * U;
        const k = Math["sin"](Y) * U;
        const V = 3 * T;
        const X = positions[V];
        const Z = positions[V + 1] - 4 + 2;
        const K = positions[V + 2];
        let Q = THREE["MathUtils"]["lerp"](W, X, z);
        let q = THREE["MathUtils"]["lerp"](maxY, Z, z);
        let J = THREE["MathUtils"]["lerp"](k, K, z);
        const $ = 1 + 0.1 * (1 - z);
        Q *= $;
        J *= $;
        const tt = (1 - z) * extraRotArr[A];
        const et = Math["cos"](tt);
        const ot = Math["sin"](tt);
        const at = Q * et - J * ot;
        const st = Q * ot + J * et;
        streamPositions[I] = at;
        streamPositions[I + 1] = q;
        streamPositions[I + 2] = st;
      }
      if (M < 0.01) {
        streamAlpha[A] = 1;
        if (activeImages.has(A)) {
          releaseImageToPool(A);
        }
      } else {
        const rt = (M - 0.01) / 0.99;
        let nt = null;
        if (activeImages.has(A)) {
          const it = activeImages["get"](A);
          nt = imagePool[it];
        }
        if (nt) {
          streamAlpha[A] = 0;
          nt["visible"] = true;
          const ct = 1 - Math["pow"](1 - rt, 3);
          const lt = 3 * T;
          const xt = positions[lt];
          const mt = positions[lt + 1] - 4 + 2;
          const _t = positions[lt + 2];
          const dt = 1 + (A % 5) * 0.2;
          const pt = A % 2 == 0 ? 1 : -1;
          const ht = spiralPhase[A] + ct * dt * Math.PI * 2 * pt;
          const ut = (1 - ct) * (2 + 1 * Math["sin"](A));
          const At = THREE["MathUtils"].lerp(0, xt, ct);
          const It = THREE.MathUtils.lerp(maxY, mt, ct);
          const St = THREE["MathUtils"]["lerp"](0, _t, ct);
          const ft = At + Math["cos"](ht) * ut;
          const gt = St + Math["sin"](ht) * ut;
          nt.position["set"](ft, It, gt);
          if (ct > 0.4) {
            const Mt = (ct - 0.4) / 0.6;
            nt["material"]["opacity"] = 1 * (1 - Mt);
            const Ct = 1 - 0.9 * Mt;
            const wt = nt.userData["aspectScale"] || {
              x: IMAGE_CONFIG["scale"],
              y: IMAGE_CONFIG["scale"],
            };
            nt["scale"].set(wt.x * Ct, wt.y * Ct, 1);
            if (Mt > 0.9) {
              nt["visible"] = false;
              releaseImageToPool(A);
            }
          } else {
            nt["material"].opacity = 1;
            const bt = nt["userData"]["aspectScale"] || {
              x: IMAGE_CONFIG["scale"],
              y: 2.5,
            };
            nt["scale"].set(bt.x, bt.y, 1);
          }
        } else {
          streamAlpha[A] = 1;
        }
      }
      streamGeo["attributes"]["size"]["needsUpdate"] = true;
      if (M > 0.95) {
        const Et = topIndices["indexOf"](T);
        if (topPointVisibility[Et] && hiddenTopCount < MAX_TOP_HIDE) {
          topPointVisibility[Et] = false;
          const yt = idxToTopIdx[T];
          if (-1 !== yt) {
            topAlpha[yt] = 0;
            staticGeo["attributes"]["alpha"]["needsUpdate"] = true;
          }
          hiddenTopCount++;
        }
      }
    }
  } else {
    for (let Ot = 0; Ot < streamCount; Ot++) {
      if (streamHeartActiveRatio < 1 && Ot / streamCount > 0.1) {
        const Rt = 3 * Ot;
        const Ht = spiralPhase[Ot] + BASE_OMEGA * o;
        streamPositions[Rt] = Math.cos(Ht) * curRadiusArr[Ot];
        streamPositions[Rt + 1] = maxY;
        streamPositions[Rt + 2] = Math["sin"](Ht) * curRadiusArr[Ot];
        streamAlpha[Ot] = 0;
        continue;
      }
      if (!firstResetCompleted && Ot / streamCount > 1e-4) {
        const Nt = 3 * Ot;
        const Dt = spiralPhase[Ot] + BASE_OMEGA * o;
        streamPositions[Nt] = Math["cos"](Dt) * curRadiusArr[Ot];
        streamPositions[Nt + 1] = maxY;
        streamPositions[Nt + 2] = Math.sin(Dt) * curRadiusArr[Ot];
        streamAlpha[Ot] = 0;
        continue;
      }
      const vt = 3 * Ot;
      const Gt = spiralPhase[Ot] + BASE_OMEGA * o;
      streamPositions[vt] = Math["cos"](Gt) * curRadiusArr[Ot];
      streamPositions[vt + 1] = maxY;
      streamPositions[vt + 2] = Math["sin"](Gt) * curRadiusArr[Ot];
      streamAlpha[Ot] = 0;
    }
    streamGeo["attributes"]["position"]["needsUpdate"] = true;
    streamGeo.attributes["alpha"].needsUpdate = true;
  }
  streamGeo["attributes"].position["needsUpdate"] = true;
  streamGeo.attributes["alpha"].needsUpdate = true;
  for (let Ft = 0; Ft < vortexCount; Ft++) {
    const Lt = 3 * Ft;
    const Bt = (1 * Math.PI) / 10;
    const zt = vortexRadius[Ft];
    const Yt = o * Bt;
    const Ut = 0.3 * Math["sin"](Yt + vortexPhase[Ft]);
    const Wt = 0.2 * Math["cos"](0.7 * Yt + vortexPhase[Ft]);
    const kt = Yt + vortexPhase[Ft] + Ut;
    const jt = zt * (1 + Wt);
    vortexPositions[Lt] = Math["cos"](kt) * jt;
    vortexPositions[Lt + 1] = maxY + 0.5 * Math["sin"](Yt + vortexPhase[Ft]);
    vortexPositions[Lt + 2] = Math["sin"](kt) * jt;
  }
  vortexGeo["attributes"].position["needsUpdate"] = true;
  const s = bottomGeo["attributes"].position["array"];
  for (let Vt = 0; Vt < bottomCount; Vt++) {
    if (o < bottomDelayArr[Vt]) {
      continue;
    }
    const Xt = bottomPhaseArr[Vt];
    const Zt = bottomRadiusArr[Vt];
    const Kt = Math["cos"](Xt) * Zt;
    if (Math.abs(Xt) < 0.25 * Math.PI) {
      const te = Math["min"](1, Math["abs"](Kt) / (0.25 * heartWidth));
      const ee = 1.5 * Math["pow"](1 - te, 3) + 1;
      const oe = Kt >= 0 ? 1 : -1;
      s[3 * Vt] = Kt + oe * (Math["abs"](Kt) * (ee - 1));
    } else {
      s[3 * Vt] = Kt;
    }
    s[3 * Vt + 2] = Math.sin(Xt) * Zt;
    const Qt = s[3 * Vt];
    const qt = s[3 * Vt + 1];
    const Jt = s[3 * Vt + 2];
    const $t = new THREE["Vector3"](Qt, qt, Jt).applyMatrix4(
      bottomHeart["matrixWorld"]
    );
    new THREE["Vector3"]()["copy"]($t)["applyMatrix4"](a);
    bottomAlphaArr[Vt] = bottomAlphaBase[Vt];
  }
  bottomGeo["attributes"]["position"]["needsUpdate"] = true;
  bottomGeo["attributes"]["alpha"]["needsUpdate"] = true;
  const r = controls["getAzimuthalAngle"]();
  if (staticHeart) {
    staticHeart["rotation"].y = r;
  }
  if (bottomHeart) {
    bottomHeart["rotation"].y = r;
  }
  if (staticBottomHeart) {
    staticBottomHeart["rotation"].y = r;
  }
  if (staticTopHeart) {
    staticTopHeart["rotation"].y = r;
  }
  if (heartbeatEnabled) {
    const ae = 1 + 0.05 * Math["sin"](0.5 * o * Math.PI * 2);
    if (staticHeart) {
      staticHeart["scale"]["set"](ae, ae, ae);
    }
    if (bottomHeart) {
      bottomHeart["scale"].set(ae, ae, ae);
    }
    if (staticBottomHeart) {
      staticBottomHeart.scale.set(ae, ae, ae);
    }
    if (staticTopHeart) {
      staticTopHeart["scale"]["set"](ae, ae, ae);
    }
  }
  controls["update"]();
  renderer["clear"]();
  composerHeart.render();
  renderer["clearDepth"]();
  renderer["autoClear"] = false;
  composerMain.render();
  renderer["autoClear"] = true;
  if (hiddenTopCount < MAX_TOP_HIDE) {
    for (let se = 0; se < 5 && hiddenTopCount < MAX_TOP_HIDE; se++) {
      const re = Math.floor(Math["random"]() * topIndices["length"]);
      const ne = topIndices[re];
      if (topPointVisibility[re]) {
        topPointVisibility[re] = false;
        const ie = idxToTopIdx[ne];
        if (-1 !== ie) {
          topAlpha[ie] = 0;
          hiddenTopCount++;
        }
      }
    }
    staticGeo["attributes"]["position"]["needsUpdate"] = true;
    staticGeo["attributes"].alpha["needsUpdate"] = true;
  }
  for (let ce = explosionEffects["length"] - 1; ce >= 0; ce--) {
    const le = explosionEffects[ce];
    le["userData"]["life"] -= e;
    if (le["userData"]["life"] <= 0) {
      if (!isPulsing) {
        isPulsing = true;
        pulseStartTime = o;
        triggerCosmicRipple();
      }
      scene.remove(le);
      explosionEffects["splice"](ce, 1);
    } else {
      const xe = le["children"][0];
      const me = xe["geometry"].attributes["position"]["array"];
      const _e = le["userData"]["velocities"];
      for (let pe = 0; pe < _e.length; pe++) {
        const he = 3 * pe;
        const ue = new THREE.Vector3(me[he], me[he + 1], me[he + 2]);
        const Ae = _e[pe];
        const Ie = HEART_CENTER_TARGET["clone"]().sub(ue);
        Ae["lerp"](Ie, 0.04);
        me[he] += Ae.x * e;
        me[he + 1] += Ae.y * e;
        me[he + 2] += Ae.z * e;
      }
      xe.geometry["attributes"]["position"].needsUpdate = true;
      if (le["userData"].life < 1) {
        xe.material["opacity"] = le["userData"]["life"] / 1;
      }
    }
  }
  effectPool["waves"]["forEach"]((e) => {
    if (!e["userData"]["active"]) {
      return;
    }
    const s = (o - e["userData"]["creationTime"]) / 1.8;
    if (s >= 1) {
      e["userData"]["active"] = false;
      e["visible"] = false;
    } else {
      e.lookAt(camera["position"]);
      e["scale"]["set"](1 + 6 * s, 1 + 6 * s, 1);
      e.material.opacity = 0.6 * (1 - s);
    }
  });
  effectPool["sparkles"]["forEach"]((a) => {
    if (!a["userData"]["active"]) {
      return;
    }
    const r = (o - a["userData"]["creationTime"]) / 1.8;
    if (r >= 1) {
      a["userData"].active = false;
      a["visible"] = false;
    } else {
      const t = a["geometry"]["attributes"]["position"].array;
      const o = a["userData"]["velocities"];
      for (let a = 0; a < 100; a++) {
        const s = 3 * a;
        t[s] += o[s] * e;
        t[s + 1] += o[s + 1] * e;
      }
      a["geometry"]["attributes"]["position"]["needsUpdate"] = true;
      a["material"]["opacity"] = 1 - Math["pow"](r, 2);
    }
  });
  if (
    streamHeartStarted &&
    allWordsFlat["length"] > 0 &&
    o > nextWordSpawnTime
  ) {
    const Se = allWordsFlat[currentWordIndex];
    let fe = -1;
    for (let Te = 0; Te < streamCount; Te++) {
      const ge = (o - startTimes[Te]) / streamRiseDuration[Te];
      if (
        streamState[Te] === 1 &&
        ge > 0 &&
        ge < 0.1 &&
        !activeImages["has"](Te) &&
        !activeTexts["has"](Te)
      ) {
        fe = Te;
        break;
      }
    }
    if (-1 !== fe) {
      const Me = effectPool.texts["find"](
        (e) => !e["userData"]["active"] && e["userData"]["text"] === Se
      );
      if (Me) {
        Me["userData"].active = true;
        Me["userData"]["spawnTime"] = o;
        Me["visible"] = true;
        Me.material["opacity"] = 0;
        activeTexts.set(fe, Me);
        currentWordIndex = (currentWordIndex + 1) % allWordsFlat["length"];
        nextWordSpawnTime = o + 0.4;
      }
    }
  }
  activeTexts["forEach"]((e, a) => {
    const r = streamPositions[3 * a];
    const n = streamPositions[3 * a + 1];
    const i = streamPositions[3 * a + 2];
    e["position"]["set"](r, n + 1.5, i);
    const c = o - e["userData"]["spawnTime"];
    const l = (o - startTimes[a]) / streamRiseDuration[a];
    if (c < 0.8) {
      e.material["opacity"] = c / 0.8;
    } else if (l > 0.7) {
      e.material.opacity = Math.max(0, 1 - (l - 0.7) / 0.3);
    } else {
      e["material"].opacity = 1;
    }
    if (streamState[a] === 0 || l >= 1) {
      releaseTextToPool(a);
    }
  });
  activeTexts["forEach"]((e, a) => {
    const r = streamPositions[3 * a];
    const n = streamPositions[3 * a + 1];
    const i = streamPositions[3 * a + 2];
    e["position"]["set"](r, n + 1.5, i);
    const c = o - e["userData"].spawnTime;
    const l = (o - startTimes[a]) / streamRiseDuration[a];
    if (c < 1) {
      e["material"].opacity = c / 1;
    } else if (l > 0.7) {
      e["material"].opacity = Math["max"](0, 1 - (l - 0.7) / 0.3);
    } else {
      e.material["opacity"] = 1;
    }
    if (streamState[a] === 0) {
      releaseTextToPool(a);
    }
  });
  const n = [staticHeart, bottomHeart, staticBottomHeart, staticTopHeart];
  let i = new THREE["Color"]();
  if (useCustomColor) {
    i["copy"](heartInitialColor);
  } else {
    i["setHSL"]((0.05 * o) % 1, 0.8, 0.6);
  }
  if (isPulsing) {
    const Pe = Math["min"]((o - pulseStartTime) / 0.6, 1);
    const Ce = Math["sin"](Pe * Math.PI);
    const we = 1 + 0.15 * Ce;
    n["forEach"]((e) => {
      if (e) {
        e.scale["set"](we, we, we);
      }
    });
    const be = new THREE["Color"](16777215);
    i.lerp(be, 0.8 * Ce);
    if (Pe >= 1) {
      isPulsing = false;
      n["forEach"]((e) => {
        if (e) {
          e["scale"].set(1, 1, 1);
        }
      });
    }
  }
  if (!useCustomColor || isPulsing || !initialColorApplied) {
    const Ee = i.r;
    const ye = i.g;
    const Oe = i.b;
    function c(e) {
      if (e) {
        for (let t = 0; t < e["length"]; t += 3) {
          e[t] = Ee;
          e[t + 1] = ye;
          e[t + 2] = Oe;
        }
      }
    }
    c(planeGeo["attributes"].color["array"]);
    c(staticGeo["attributes"]["color"]["array"]);
    c(bottomGeo["attributes"]["color"].array);
    if (staticBottomHeart) {
      c(staticBottomHeart["geometry"]["attributes"]["color"].array);
    }
    if (staticTopHeart) {
      c(staticTopHeart["geometry"]["attributes"].color.array);
    }
    c(vortexGeo.attributes.color["array"]);
    c(streamGeo.attributes["color"].array);
    planeGeo.attributes["color"]["needsUpdate"] = true;
    staticGeo.attributes["color"]["needsUpdate"] = true;
    bottomGeo["attributes"]["color"]["needsUpdate"] = true;
    if (staticBottomHeart) {
      staticBottomHeart["geometry"]["attributes"]["color"][
        "needsUpdate"
      ] = true;
    }
    if (staticTopHeart) {
      staticTopHeart.geometry.attributes["color"]["needsUpdate"] = true;
    }
    vortexGeo["attributes"]["color"]["needsUpdate"] = true;
    streamGeo.attributes["color"]["needsUpdate"] = true;
    ribbon["children"]["forEach"]((e) => {
      e["material"].color["setRGB"](Ee, ye, Oe);
    });
    initialColorApplied = true;
  }
  if (o >= nextShootTime) {
    for (let ve = 0; ve < 10; ve++) {
      if (shootLife[ve] <= 0) {
        const Ge = 3 * ve;
        const He = new THREE["Vector3"](
          2 * (Math["random"]() - 0.5),
          2 * (Math.random() - 0.5),
          2 * (Math.random() - 0.5)
        )
          ["normalize"]()
          ["multiplyScalar"](200);
        shootPositions[Ge] = He.x;
        shootPositions[Ge + 1] = He.y;
        shootPositions[Ge + 2] = He.z;
        const Ne = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math["random"]() - 0.5
        )["normalize"]();
        const De = new THREE.Vector3()["crossVectors"](He, Ne).normalize();
        const Fe = 40 + 30 * Math["random"]();
        shootVel[Ge] = De.x * Fe;
        shootVel[Ge + 1] = De.y * Fe;
        shootVel[Ge + 2] = De.z * Fe;
        shootBirth[ve] = o;
        shootLife[ve] = 150 / Fe;
        shootAlpha[ve] = 0.8 + 0.2 * Math["random"]();
        break;
      }
    }
    nextShootTime = o + 0.5 + Math["random"]();
  }
  for (let Le = 0; Le < 10; Le++) {
    if (shootLife[Le] > 0) {
      const Be = 3 * Le;
      shootPositions[Be] += shootVel[Be] * e;
      shootPositions[Be + 1] += shootVel[Be + 1] * e;
      shootPositions[Be + 2] += shootVel[Be + 2] * e;
      const ze = Math["hypot"](
        shootPositions[Be],
        shootPositions[Be + 1],
        shootPositions[Be + 2]
      );
      shootBirth[Le];
      shootLife[Le];
      if (ze > 350) {
        shootLife[Le] = 0;
        shootAlpha[Le] = 0;
      } else {
        const ke = ze / 350;
        shootAlpha[Le] = ke > 0.9 ? 1 - (ke - 0.9) / 0.09999999999999998 : 1;
      }
      const Ye = Le * 261;
      const Ue = 3 * Ye;
      tailPositions[Ue] = shootPositions[Be];
      tailPositions[Ue + 1] = shootPositions[Be + 1];
      tailPositions[Ue + 2] = shootPositions[Be + 2];
      tailAlphas[Ye] = shootAlpha[Le];
      for (let je = 1; je <= 260; je++) {
        const Ve = Le * 261 + je;
        const Xe = 3 * Ve;
        tailPositions[Xe] = shootPositions[Be] - shootVel[Be] * je * 0.001;
        tailPositions[Xe + 1] =
          shootPositions[Be + 1] - shootVel[Be + 1] * je * 0.001;
        tailPositions[Xe + 2] =
          shootPositions[Be + 2] - shootVel[Be + 2] * je * 0.001;
        const Ze = 1 - je / 260;
        tailAlphas[Ve] = shootAlpha[Le] * Ze;
      }
    }
  }
  tailGeo["attributes"]["position"].needsUpdate = true;
  tailGeo["attributes"]["alpha"].needsUpdate = true;
  if (heartbeatEnabled) {
    const Ke = 1 + 0.05 * Math["sin"](0.5 * o * Math.PI * 2);
    if (staticHeart) {
      staticHeart["scale"]["set"](Ke, Ke, Ke);
    }
    if (bottomHeart) {
      bottomHeart["scale"]["set"](Ke, Ke, Ke);
    }
    if (staticBottomHeart) {
      staticBottomHeart.scale["set"](Ke, Ke, Ke);
    }
    if (staticTopHeart) {
      staticTopHeart["scale"]["set"](Ke, Ke, Ke);
    }
  }
  if (null !== revealStart) {
    fadeObjects["forEach"]((e) => {
      if (!e || e === ribbon) {
        return;
      }
      const s = e["userData"]["fadeStage"] ?? 0;
      const r = THREE["MathUtils"].clamp(
        (o - revealStart - 0.15 * s) / 0.15,
        0,
        1
      );
      const n = r * r * (3 - 2 * r);
      e["traverse"]?.((t) => {
        const o = t.material;
        if (!o) {
          return;
        }
        if (
          t["isSprite"] &&
          t["userData"].text &&
          false === t["userData"].active
        ) {
          return void (o["opacity"] = 0);
        }
        const s = t["userData"]["baseOpacity"] ?? 1;
        o["opacity"] = s * n;
      });
      if (s === STAGE["STREAM"] && n > 0.1) {
        streamHeartStarted = true;
        streamHeartActiveRatio = n;
      }
    });
    if (o - revealStart > 0.15 * (STAGE["HEART"] + 1)) {
      revealStart = null;
    }
  }
  if (null !== cameraAnimationStart) {
    const Qe = o - cameraAnimationStart;
    const qe = THREE.MathUtils.clamp(Qe / 2.5, 0, 1);
    const Je = qe * qe * (3 - 2 * qe);
    camera["position"].x = THREE["MathUtils"]["lerp"](
      CAMERA_START_POSITION.x,
      0,
      Je
    );
    camera.position.y = THREE["MathUtils"]["lerp"](
      CAMERA_START_POSITION.y,
      25,
      Je
    );
    camera["position"].z = THREE.MathUtils["lerp"](
      CAMERA_START_POSITION.z,
      65,
      Je
    );
    camera.lookAt(0, 0, 0);
    if (qe >= 1) {
      cameraAnimationStart = null;
      camera["position"]["set"](0, 25, 65);
      camera["lookAt"](0, 0, 0);
    }
  }
}
function triggerCosmicRipple() {
  const e = new THREE["Color"]()["setHSL"](
    (0.05 * clock["getElapsedTime"]()) % 1,
    0.9,
    0.7
  );
  const o = effectPool["waves"].find((e) => !e["userData"]["active"]);
  if (o) {
    o["userData"].active = true;
    o.visible = true;
    o["userData"]["creationTime"] = clock["getElapsedTime"]();
    o.position["copy"](HEART_CENTER_TARGET);
    o["rotation"].z = Math.PI;
    o["scale"]["set"](1, 1, 1);
    o.material["color"].copy(e);
  }
  const a = effectPool["sparkles"]["find"]((e) => !e["userData"]["active"]);
  if (a) {
    a["userData"].active = true;
    a["visible"] = true;
    a["userData"]["creationTime"] = clock["getElapsedTime"]();
    a.position["copy"](HEART_CENTER_TARGET);
    a["rotation"].z = Math.PI;
    a["material"]["color"]["copy"](e);
    const o = a.geometry["attributes"].position.array;
    for (let e = 0; e < 100; e++) {
      const s = Math["random"]() * Math.PI * 2;
      const n = 20 * Math.random() + 20;
      const i = 3 * e;
      o[i] = Math["cos"](s) * 9;
      o[i + 1] = Math["sin"](s) * 9;
      o[i + 2] = 5 * (Math.random() - 0.5);
      if (!a["userData"]["velocities"]) {
        a["userData"]["velocities"] = [];
      }
      a["userData"]["velocities"][i] = Math["cos"](s) * n;
      a["userData"]["velocities"][i + 1] = Math["sin"](s) * n;
      a["userData"]["velocities"][i + 2] = 5 * (Math["random"]() - 0.5);
    }
    a["geometry"]["attributes"]["position"]["needsUpdate"] = true;
  }
}
setupEffectPools();
window["addEventListener"]("resize", () => {
  camera["aspect"] = window["innerWidth"] / window["innerHeight"];
  camera["updateProjectionMatrix"]();
  renderer["setSize"](window["innerWidth"], window["innerHeight"]);
});
const refinedBottomPos = [];
const refinedBottomColors = [];
const refinedBottomSizes = [];
for (let t = 0; t < bottomPositions["length"]; t += 3) {
  const e = bottomPositions[t];
  const o = bottomPositions[t + 1];
  const a = bottomPositions[t + 2];
  if (
    calculateMinimumDistanceToBorder(e, o) < BORDER_THRESHOLD ||
    Math["random"]() < 0.9
  ) {
    refinedBottomPos["push"](e, o, a);
    refinedBottomColors.push(
      heartInitialColor.r,
      heartInitialColor.g,
      heartInitialColor.b
    );
    refinedBottomSizes["push"](bottomSizes[t / 3]);
  }
}
bottomPositions = refinedBottomPos;
bottomColors["length"] = 0;
bottomColors.push(...refinedBottomColors);
bottomSizes["length"] = 0;
bottomSizes["push"](...refinedBottomSizes);
const starLayers = [];
function createStarLayer({
  count: t,
  radius: e,
  colors: o,
  minSize: a,
  maxSize: s,
  opacity: r = 1.2,
}) {
  const i = new Float32Array(3 * t);
  const c = new Float32Array(3 * t);
  const l = new Float32Array(t);
  const x = new Float32Array(t);
  const m = new Float32Array(t);
  const _ = new Float32Array(t);
  for (let r = 0; r < t; r++) {
    const t = 3 * r;
    const d = Math["acos"](2 * Math["random"]() - 1);
    const p = Math["random"]() * Math.PI * 2;
    i[t] = e * Math["cos"](p) * Math["sin"](d);
    i[t + 1] = e * Math["sin"](p) * Math["sin"](d);
    i[t + 2] = e * Math["cos"](d);
    const h = o[Math["floor"](Math["random"]() * o["length"])];
    c[t] = h.r;
    c[t + 1] = h.g;
    c[t + 2] = h.b;
    l[r] = Math.random() * (s - a) + a;
    x[r] = 1;
    m[r] = Math["random"]() * Math.PI * 2;
    _[r] = 0.5 + 1.5 * Math["random"]();
  }
  const d = new THREE["BufferGeometry"]();
  d.setAttribute("position", new THREE.BufferAttribute(i, 3));
  d["setAttribute"]("color", new THREE["BufferAttribute"](c, 3));
  d["setAttribute"]("size", new THREE.BufferAttribute(l, 1));
  d["setAttribute"](
    "alpha",
    new THREE["BufferAttribute"](x, 1)["setUsage"](THREE.DynamicDrawUsage)
  );
  d["userData"]["phase"] = m;
  d.userData["twinkleSpeed"] = _;
  const p = makeMat({
    map: circleTexture,
    blending: THREE["AdditiveBlending"],
    depthWrite: false,
    alphaSupport: true,
    opacity: r,
    sizeAttenuation: false,
    vertexColors: true,
  });
  p.onBeforeCompile = function (t) {
    t["vertexShader"] = t["vertexShader"].replace(
      "uniform float size;",
      "attribute float size; attribute float alpha; varying float vAlpha;"
    );
    t["vertexShader"] = t["vertexShader"]["replace"](
      "#include <project_vertex>",
      "#include <project_vertex>\n  vAlpha = alpha;"
    );
    t["fragmentShader"] = t["fragmentShader"]["replace"](
      "void main() {",
      "varying float vAlpha;\nvoid main(){"
    );
    t.fragmentShader = t["fragmentShader"].replace(
      "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
      "gl_FragColor = vec4( outgoingLight, diffuseColor.a * vAlpha );"
    );
  };
  return new THREE.Points(d, p);
}
const starColors = [
  new THREE.Color(16777215),
  new THREE["Color"](11197695),
  new THREE.Color(16777184),
  new THREE["Color"](16767153),
];
const farStars = createStarLayer({
  count: 6e3,
  radius: 250,
  colors: [new THREE.Color(11197695), new THREE.Color(16777215)],
  minSize: 0.5,
  maxSize: 1.5,
  opacity: 0.8,
});
const midStars = createStarLayer({
  count: 3e3,
  radius: 180,
  colors: starColors,
  minSize: 1,
  maxSize: 2.5,
  opacity: 1,
});
const nearStars = createStarLayer({
  count: 1e3,
  radius: 120,
  colors: starColors,
  minSize: 1.5,
  maxSize: 4,
  opacity: 1.2,
});
starLayers["push"](farStars, midStars, nearStars);
starLayers["forEach"]((t) => {
  scene["add"](t);
  t.visible = false;
  fadeObjects["push"](t);
  t.userData["fadeStage"] = STAGE["STAR"];
});
const dustPositions = new Float32Array(150);
const dustColors = new Float32Array(150);
const dustColor = new THREE["Color"](16777215);
for (let t = 0; t < 50; t++) {
  const e = 3 * t;
  const o = Math["acos"](2 * Math["random"]() - 1);
  const a = Math["random"]() * Math.PI * 2;
  const s = 200 * Math["random"]() + 50;
  dustPositions[e] = s * Math["cos"](a) * Math["sin"](o);
  dustPositions[e + 1] = s * Math["sin"](a) * Math["sin"](o);
  dustPositions[e + 2] = s * Math["cos"](o);
  const r = 0.5 * Math["random"]() + 0.5;
  dustColors[e] = dustColor.r * r;
  dustColors[e + 1] = dustColor.g * r;
  dustColors[e + 2] = dustColor.b * r;
}
const dustGeometry = new THREE["BufferGeometry"]();
dustGeometry.setAttribute(
  "position",
  new THREE["BufferAttribute"](dustPositions, 3)
);
dustGeometry.setAttribute("color", new THREE.BufferAttribute(dustColors, 3));
const dustMaterial = new THREE["PointsMaterial"]({
  size: 0.2,
  vertexColors: true,
  blending: THREE["AdditiveBlending"],
  transparent: true,
  opacity: 0.7,
});
const cosmicDust = new THREE["Points"](dustGeometry, dustMaterial);
scene["add"](cosmicDust);
STAR_COUNT = 0;
starAlpha = null;
starPhase = null;
starGeo = null;
const shootPositions = new Float32Array(30);
const shootVel = new Float32Array(30);
const shootBirth = new Float32Array(10);
const shootLife = new Float32Array(10)["fill"](0);
const shootAlpha = new Float32Array(10).fill(0);
const shootSize = new Float32Array(10);
for (let t = 0; t < 10; t++) {
  shootSize[t] = 3;
}
const tailPositions = new Float32Array(7830);
const tailColors = new Float32Array(7830);
const tailSizes = new Float32Array(2610);
const tailAlphas = new Float32Array(2610)["fill"](0);
for (let t = 0; t < 10; t++) {
  tailSizes[t * 261] = 6;
  for (let e = 1; e <= 260; e++) {
    const o = t * 261 + e;
    const a = 1 - e / 260;
    tailSizes[o] = 4 * a;
    const s = 3 * o;
    tailColors[s] = 0.7 * a;
    tailColors[s + 1] = 0.8 * a;
    tailColors[s + 2] = 1 * a;
  }
}
for (let t = 0; t < 10; t++) {
  const e = t * 261 * 3;
  tailColors[e] = 1;
  tailColors[e + 1] = 1;
  tailColors[e + 2] = 1;
}
const tailGeo = new THREE["BufferGeometry"]();
tailGeo.setAttribute(
  "position",
  new THREE.BufferAttribute(tailPositions, 3).setUsage(
    THREE["DynamicDrawUsage"]
  )
);
tailGeo["setAttribute"]("color", new THREE["BufferAttribute"](tailColors, 3));
tailGeo.setAttribute("size", new THREE["BufferAttribute"](tailSizes, 1));
tailGeo.setAttribute(
  "alpha",
  new THREE["BufferAttribute"](tailAlphas, 1)["setUsage"](
    THREE["DynamicDrawUsage"]
  )
);
const tailMat = makeMat({
  map: circleTexture,
  blending: THREE["AdditiveBlending"],
  depthWrite: false,
  alphaSupport: true,
  vertexColors: true,
  opacity: 2,
  sizeAttenuation: false,
});
tailMat["onBeforeCompile"] = function (t) {
  t.vertexShader = t["vertexShader"]["replace"](
    "uniform float size;",
    "attribute float size; attribute float alpha; varying float vAlpha;"
  );
  t["vertexShader"] = t["vertexShader"]["replace"](
    "#include <project_vertex>",
    "#include <project_vertex>\n  vAlpha = alpha;"
  );
  t["fragmentShader"] = t["fragmentShader"]["replace"](
    "void main() {",
    "varying float vAlpha;\nvoid main(){"
  );
  t["fragmentShader"] = t["fragmentShader"]["replace"](
    "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
    "gl_FragColor = vec4( outgoingLight, diffuseColor.a * vAlpha );"
  );
};
const shootingStars = new THREE["Points"](tailGeo, tailMat);
scene["add"](shootingStars);
shootingStars["userData"]["fadeStage"] = STAGE["SHOOT"];
let nextShootTime = 0;
function triggerSceneActivation(t) {
  if (!heartbeatEnabled) {
    heartbeatEnabled = true;
    setupImageObjectPool();
    lastImageSpawnTime = 0;
    imageSpawnQueue.length = 0;
    currentImageIndex = 0;
    lastStatusLogTime = 0;
    nextIndependentSpawnTime = 0;
    independentImageSprites.forEach((t) => {
      if (t && t["parent"]) {
        t["parent"].remove(t);
      }
    });
    independentImageSprites["length"] = 0;
    fadeObjects["forEach"]((t) => {
      if (t) {
        t["visible"] = true;
        t["traverse"]?.((t) => {
          const a = t["material"];
          if (a) {
            if (t["material"] && undefined === t["userData"]["baseOpacity"]) {
              t.userData["baseOpacity"] = t["material"].opacity ?? 1;
            }
            a["opacity"] = 0;
          }
        });
      }
    });
    revealStart = clock["getElapsedTime"]();
    cameraAnimationStart = clock.getElapsedTime();
    if (userHasMovedCamera) {
      CAMERA_START_POSITION = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      };
    }
  }
}

fadeObjects["push"](streamHeart, shootingStars);
[streamHeart, shootingStars]["forEach"]((t) => {
  if (t) {
    t.visible = false;
    t["traverse"]?.((t) => {
      if (t["material"] && undefined === t.userData["baseOpacity"]) {
        t["userData"]["baseOpacity"] = t["material"]["opacity"] ?? 1;
      }
    });
  }
});
renderer.domElement["addEventListener"]("pointerdown", (t) => {
  createHeartExplosion(t);
});
triggerSceneActivation();
let lastTouchEnd = 0;
document["addEventListener"](
  "touchend",
  function (t) {
    const o = new Date().getTime();
    if (o - lastTouchEnd <= 300) {
      t["preventDefault"]();
    }
    lastTouchEnd = o;
  },
  false
);
document["addEventListener"](
  "gesturestart",
  function (t) {
    t["preventDefault"]();
  },
  {
    passive: false,
  }
);
document["addEventListener"](
  "gesturechange",
  function (t) {
    t["preventDefault"]();
  },
  {
    passive: false,
  }
);
document["addEventListener"](
  "gestureend",
  function (t) {
    t.preventDefault();
  },
  {
    passive: false,
  }
);
mainAnimationLoop();
scene["add"](staticBottomHeart);
[staticTopHeart].forEach((t) => {
  if (t) {
    t["visible"] = false;
    t["userData"]["fadeStage"] = 4;
    fadeObjects["push"](t);
  }
});
controls["addEventListener"]("change", () => {
  if (!userHasMovedCamera) {
    CAMERA_START_POSITION = {
      x: camera["position"].x,
      y: camera.position.y,
      z: camera.position.z,
    };
    userHasMovedCamera = true;
  }
});
const current = window.location["hostname"];
// if (current !== "panbap.github.io") {
//   document.body['innerHTML'] = "";
//   texts['innerText'] = " ";
//   divs['appendChild'](texts);
//   document['body']['appendChild'](divs);
// }
