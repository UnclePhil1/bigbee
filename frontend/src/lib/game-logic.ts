import * as THREE from "three";
import { generateRows } from "./generateRows"; 

const minTileIndex = -8;
const maxTileIndex = 8;
const tilesPerRow = maxTileIndex - minTileIndex + 1;
const tileSize = 42;

function Camera(canvasWidth?: number, canvasHeight?: number) {
  const size = 300;
  const width = canvasWidth || window.innerWidth;
  const height = canvasHeight || window.innerHeight;
  const viewRatio = width / height;
  const cameraWidth = viewRatio < 1 ? size : size * viewRatio;
  const cameraHeight = viewRatio < 1 ? size / viewRatio : size;
  const camera = new THREE.OrthographicCamera(
    cameraWidth / -2, // left
    cameraWidth / 2, // right
    cameraHeight / 2, // top
    cameraHeight / -2, // bottom
    100, // near
    900 // far,
  );
  camera.up.set(0, 0, 1);
  camera.position.set(300, -300, 300);
  camera.lookAt(0, 0, 0);
  return camera;
}

export function Texture(
  width: number,
  height: number,
  rects: { x: number; y: number; w: number; h: number }[]
) {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get 2D context");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(0,0,0,0.6)";
  rects.forEach((rect) => {
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
  });
  return new THREE.CanvasTexture(canvas);
}

const carFrontTexture = Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = Texture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = Texture(110, 40, [
  { x: 10, y: 0, w: 50, h: 30 },
  { x: 70, y: 0, w: 30, h: 30 },
]);
const carLeftSideTexture = Texture(110, 40, [
  { x: 10, y: 10, w: 50, h: 30 },
  { x: 70, y: 10, w: 30, h: 30 },
]);

const truckFrontTexture = Texture(30, 30, [{ x: 5, y: 0, w: 10, h: 30 }]);
const truckRightSideTexture = Texture(25, 30, [{ x: 15, y: 5, w: 10, h: 10 }]);
const truckLeftSideTexture = Texture(25, 30, [{ x: 15, y: 15, w: 10, h: 10 }]);

function Car(initialTileIndex: number, direction: boolean, color: number) {
  const car = new THREE.Group();
  car.position.x = initialTileIndex * tileSize;
  if (!direction) car.rotation.z = Math.PI;
  const main = new THREE.Mesh(
    new THREE.BoxGeometry(60, 30, 15),
    new THREE.MeshLambertMaterial({ color, flatShading: true })
  );
  main.position.z = 12;
  main.castShadow = true;
  main.receiveShadow = true;
  car.add(main);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(33, 24, 12), [
    new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      flatShading: true,
      map: carBackTexture,
    }),
    new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      flatShading: true,
      map: carFrontTexture,
    }),
    new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      flatShading: true,
      map: carRightSideTexture,
    }),
    new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      flatShading: true,
      map: carLeftSideTexture,
    }),
    new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }), // top
    new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }), // bottom
  ]);
  cabin.position.x = -6;
  cabin.position.z = 25.5;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add(cabin);
  const frontWheel = Wheel(18);
  car.add(frontWheel);
  const backWheel = Wheel(-18);
  car.add(backWheel);
  return car;
}

function DirectionalLight() {
  const dirLight = new THREE.DirectionalLight();
  dirLight.position.set(-100, -100, 200);
  dirLight.up.set(0, 0, 1);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.up.set(0, 0, 1);
  dirLight.shadow.camera.left = -400;
  dirLight.shadow.camera.right = 400;
  dirLight.shadow.camera.top = 400;
  dirLight.shadow.camera.bottom = -400;
  dirLight.shadow.camera.near = 50;
  dirLight.shadow.camera.far = 400;
  return dirLight;
}

function Grass(rowIndex: number) {
  const grass = new THREE.Group();
  grass.position.y = rowIndex * tileSize;
  const createSection = (color: number) =>
    new THREE.Mesh(
      new THREE.BoxGeometry(tilesPerRow * tileSize, tileSize, 3),
      new THREE.MeshLambertMaterial({ color })
    );
  const middle = createSection(0xbaf455);
  middle.receiveShadow = true;
  grass.add(middle);
  const left = createSection(0x99c846);
  left.position.x = -tilesPerRow * tileSize;
  grass.add(left);
  const right = createSection(0x99c846);
  right.position.x = tilesPerRow * tileSize;
  grass.add(right);
  return grass;
}

// Enhanced Honey Jar with proper materials and glow effect
function HoneyJar(tileIndex: number) {
  const jar = new THREE.Group();
  jar.position.x = tileIndex * tileSize;
  jar.position.z = 15;

  // Main jar body - rounded cylinder
  const jarGeometry = new THREE.CylinderGeometry(5, 6, 10, 16);
  // Round the edges by modifying vertices
  const jarPositions = jarGeometry.attributes.position;
  for (let i = 0; i < jarPositions.count; i++) {
    const y = jarPositions.getY(i);
    const x = jarPositions.getX(i);
    const z = jarPositions.getZ(i);

    // Create rounded edges
    if (Math.abs(y) > 4) {
      const factor = 1 - Math.abs(Math.abs(y) - 5) * 0.1;
      jarPositions.setX(i, x * factor);
      jarPositions.setZ(i, z * factor);
    }
  }
  jarGeometry.attributes.position.needsUpdate = true;

  const jarMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700, // Gold
    transparent: true,
    opacity: 0.9,
    emissive: 0xffc000, // Soft glow
    emissiveIntensity: 0.3, // Increased glow for visibility on roads
    roughness: 0.3,
    metalness: 0.1,
  });

  const jarBody = new THREE.Mesh(jarGeometry, jarMaterial);
  jar.add(jarBody);

  // Inner honey - semi-transparent
  const honeyGeometry = new THREE.CylinderGeometry(4, 5, 8, 12);
  const honeyMaterial = new THREE.MeshStandardMaterial({
    color: 0xffb000,
    transparent: true,
    opacity: 0.6,
    emissive: 0xffd700,
    emissiveIntensity: 0.2,
  });
  const honey = new THREE.Mesh(honeyGeometry, honeyMaterial);
  honey.position.y = -1;
  jar.add(honey);

  // Lid
  const lidGeometry = new THREE.CylinderGeometry(5.5, 5.5, 1.5, 16);
  const lidMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513, // Brown
    roughness: 0.8,
    metalness: 0.1,
  });
  const lid = new THREE.Mesh(lidGeometry, lidMaterial);
  lid.position.y = 5.5;
  jar.add(lid);

  // Lid handle
  const handleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
  const handle = new THREE.Mesh(handleGeometry, lidMaterial);
  handle.position.y = 7;
  jar.add(handle);

  // Simple "HONEY" label using geometry
  const labelGeometry = new THREE.PlaneGeometry(6, 2);
  const labelMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    transparent: true,
    opacity: 0.8,
  });
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.set(0, 0, 5.1);
  jar.add(label);

  jar.name = "honey-jar";
  jar.castShadow = true;
  jar.receiveShadow = true;
  return jar;
}

// Updated 3D Stylized Honey Bee Model - Low-poly, cute and round
export function BeeModel() {
  const bee = new THREE.Group();

  // Materials
  const yellowMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdd00,
    roughness: 0.6,
    metalness: 0.1,
  });
  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.7,
    metalness: 0.1,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.1,
    metalness: 0.9,
  });

  // Main body - large, round and chubby (single sphere with stripes via vertex colors)
  const bodyGeometry = new THREE.SphereGeometry(12, 16, 12); // Larger, rounder body

  // Create vertex colors for stripes
  const bodyColors = [];
  const bodyPositions = bodyGeometry.attributes.position;
  for (let i = 0; i < bodyPositions.count; i++) {
    const y = bodyPositions.getY(i);
    // Create horizontal stripes based on Y position
    const stripePattern = Math.sin(y * 0.8) > 0 ? 1 : 0;
    if (stripePattern) {
      bodyColors.push(1, 0.87, 0); // Yellow
    } else {
      bodyColors.push(0.1, 0.1, 0.1); // Black
    }
  }
  bodyGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(bodyColors, 3)
  );

  const bodyMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.6,
    metalness: 0.1,
  });

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 0, 10);
  bee.add(body);

  // Head - smaller sphere, positioned in front
  const headGeometry = new THREE.SphereGeometry(8, 12, 10);
  const head = new THREE.Mesh(headGeometry, yellowMaterial);
  head.position.set(15, 0, 10);
  bee.add(head);

  // Big cute eyes - larger and more prominent
  const eyeGeometry = new THREE.SphereGeometry(3, 8, 6);

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(20, -4, 12);
  bee.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(20, 4, 12);
  bee.add(rightEye);

  // Small antennae with balls at the ends
  const antennaGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 4);
  const antennaTipGeometry = new THREE.SphereGeometry(1, 4, 4);

  const leftAntenna = new THREE.Mesh(antennaGeometry, blackMaterial);
  leftAntenna.position.set(18, -3, 18);
  leftAntenna.rotation.z = Math.PI / 6;
  bee.add(leftAntenna);

  const leftAntennaTip = new THREE.Mesh(antennaTipGeometry, blackMaterial);
  leftAntennaTip.position.set(20, -5, 21);
  bee.add(leftAntennaTip);

  const rightAntenna = new THREE.Mesh(antennaGeometry, blackMaterial);
  rightAntenna.position.set(18, 3, 18);
  rightAntenna.rotation.z = -Math.PI / 6;
  bee.add(rightAntenna);

  const rightAntennaTip = new THREE.Mesh(antennaTipGeometry, blackMaterial);
  rightAntennaTip.position.set(20, 5, 21);
  bee.add(rightAntennaTip);

  // Wings - semi-transparent with slight curve
  const wingGeometry = new THREE.PlaneGeometry(18, 25, 2, 3); // Simpler geometry for low-poly

  // Curve the wings slightly
  const wingPositions = wingGeometry.attributes.position;
  for (let i = 0; i < wingPositions.count; i++) {
    const x = wingPositions.getX(i);
    wingPositions.getY(i);
    const z = Math.sin(x * 0.1) * 2;
    wingPositions.setZ(i, z);
  }
  wingGeometry.attributes.position.needsUpdate = true;

  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    roughness: 0.1,
    metalness: 0.1,
  });

  const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
  leftWing.name = "leftWing";
  leftWing.position.set(-2, -10, 15);
  leftWing.rotation.x = Math.PI / 2;
  leftWing.rotation.z = Math.PI / 12;
  bee.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
  rightWing.name = "rightWing";
  rightWing.position.set(-2, 10, 15);
  rightWing.rotation.x = Math.PI / 2;
  rightWing.rotation.z = -Math.PI / 12;
  bee.add(rightWing);

  // Simple legs (optional, very minimal for low-poly)
  const legGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 3);

  for (let i = 0; i < 6; i++) {
    const leg = new THREE.Mesh(legGeometry, blackMaterial);
    const angle = (i / 6) * Math.PI * 2;
    const radius = 8;
    leg.position.set(Math.cos(angle) * radius - 3, Math.sin(angle) * radius, 6);
    leg.rotation.x = Math.PI / 2;
    leg.rotation.z = angle;
    bee.add(leg);
  }

  bee.position.z = 10;
  bee.castShadow = true;
  bee.receiveShadow = true;
  return bee;
}

function WaspModel() {
  const wasp = new THREE.Group();

  // Materials
  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.7,
    metalness: 0.2,
  });

  const redMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    emissive: 0x440000,
    emissiveIntensity: 0.3,
  });

  // Thorax (front body segment) - more angular
  const thoraxGeometry = new THREE.BoxGeometry(8, 6, 12);
  const thorax = new THREE.Mesh(thoraxGeometry, blackMaterial);
  thorax.position.set(8, 0, 10);
  wasp.add(thorax);

  // Abdomen (rear body segment) - elongated and striped
  const abdomenGeometry = new THREE.CylinderGeometry(4, 2, 16, 8);
  abdomenGeometry.rotateZ(Math.PI / 2);

  // Create vertex colors for stripes
  const abdomenColors = [];
  const abdomenPositions = abdomenGeometry.attributes.position;
  for (let i = 0; i < abdomenPositions.count; i++) {
    const x = abdomenPositions.getX(i);
    // Create stripes based on X position
    const stripePattern = Math.sin(x * 0.8) > 0 ? 1 : 0;
    if (stripePattern) {
      abdomenColors.push(1, 0.84, 0); // Yellow
    } else {
      abdomenColors.push(0.1, 0.1, 0.1); // Black
    }
  }
  abdomenGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(abdomenColors, 3)
  );

  const abdomenMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.6,
    metalness: 0.1,
  });

  const abdomen = new THREE.Mesh(abdomenGeometry, abdomenMaterial);
  abdomen.position.set(-4, 0, 10);
  wasp.add(abdomen);

  // Head - smaller and more angular
  const headGeometry = new THREE.BoxGeometry(6, 5, 6);
  const head = new THREE.Mesh(headGeometry, blackMaterial);
  head.position.set(14, 0, 10);
  wasp.add(head);

  // Angry red eyes
  const eyeGeometry = new THREE.SphereGeometry(1.5, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeometry, redMaterial);
  leftEye.position.set(16, -2, 11);
  wasp.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, redMaterial);
  rightEye.position.set(16, 2, 11);
  wasp.add(rightEye);

  // Antennae - thinner and more aggressive
  const antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 4);

  const leftAntenna = new THREE.Mesh(antennaGeometry, blackMaterial);
  leftAntenna.position.set(16, -1.5, 14);
  leftAntenna.rotation.z = Math.PI / 8;
  wasp.add(leftAntenna);

  const rightAntenna = new THREE.Mesh(antennaGeometry, blackMaterial);
  rightAntenna.position.set(16, 1.5, 14);
  rightAntenna.rotation.z = -Math.PI / 8;
  wasp.add(rightAntenna);

  // Wings - jagged and translucent
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(12, 2);
  wingShape.lineTo(15, 8);
  wingShape.lineTo(10, 12);
  wingShape.lineTo(3, 10);
  wingShape.lineTo(0, 4);
  wingShape.lineTo(0, 0);

  const wingGeometry = new THREE.ShapeGeometry(wingShape);
  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    roughness: 0.1,
    metalness: 0.1,
  });

  const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
  leftWing.name = "leftWing";
  leftWing.position.set(4, -6, 15);
  leftWing.rotation.x = Math.PI / 2;
  leftWing.rotation.z = Math.PI / 6;
  wasp.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
  rightWing.name = "rightWing";
  rightWing.position.set(4, 6, 15);
  rightWing.rotation.x = Math.PI / 2;
  rightWing.rotation.z = -Math.PI / 6;
  rightWing.scale.z = -1; // Mirror the wing
  wasp.add(rightWing);

  // Stinger - dangerous looking
  const stingerGeometry = new THREE.ConeGeometry(1, 4, 6);
  const stinger = new THREE.Mesh(stingerGeometry, blackMaterial);
  stinger.position.set(-12, 0, 10);
  stinger.rotation.z = Math.PI / 2;
  wasp.add(stinger);

  // Legs - more angular and aggressive
  const legGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 4);

  for (let i = 0; i < 6; i++) {
    const leg = new THREE.Mesh(legGeometry, blackMaterial);
    const angle = (i / 6) * Math.PI * 2;
    const radius = 4;
    leg.position.set(Math.cos(angle) * radius + 2, Math.sin(angle) * radius, 7);
    leg.rotation.x = Math.PI / 2;
    leg.rotation.z = angle;
    wasp.add(leg);
  }

  wasp.position.z = 10;
  wasp.castShadow = true;
  wasp.receiveShadow = true;
  return wasp;
}

function LostBeeModel() {
  const lostBee = new THREE.Group();

  // Materials - slightly different colors to distinguish from player
  const lightBlueMaterial = new THREE.MeshStandardMaterial({
    color: 0x87ceeb, // Sky blue
    roughness: 0.6,
    metalness: 0.1,
    emissive: 0x4169e1,
    emissiveIntensity: 0.1,
  });
  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.7,
    metalness: 0.1,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.1,
    metalness: 0.9,
  });

  // Smaller body than player bee
  const bodyGeometry = new THREE.SphereGeometry(8, 12, 10);

  // Create vertex colors for stripes
  const bodyColors = [];
  const bodyPositions = bodyGeometry.attributes.position;
  for (let i = 0; i < bodyPositions.count; i++) {
    const y = bodyPositions.getY(i);
    const stripePattern = Math.sin(y * 0.8) > 0 ? 1 : 0;
    if (stripePattern) {
      bodyColors.push(0.53, 0.81, 0.92); // Light blue
    } else {
      bodyColors.push(0.1, 0.1, 0.1); // Black
    }
  }
  bodyGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(bodyColors, 3)
  );

  const bodyMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.6,
    metalness: 0.1,
  });

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 0, 8);
  lostBee.add(body);

  // Head
  const headGeometry = new THREE.SphereGeometry(6, 10, 8);
  const head = new THREE.Mesh(headGeometry, lightBlueMaterial);
  head.position.set(10, 0, 8);
  lostBee.add(head);

  // Sad/worried eyes - slightly larger
  const eyeGeometry = new THREE.SphereGeometry(2.5, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(14, -3, 10);
  lostBee.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(14, 3, 10);
  lostBee.add(rightEye);

  // Droopy antennae
  const antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 4);
  const antennaTipGeometry = new THREE.SphereGeometry(0.8, 4, 4);

  const leftAntenna = new THREE.Mesh(antennaGeometry, blackMaterial);
  leftAntenna.position.set(12, -2, 14);
  leftAntenna.rotation.z = Math.PI / 4; // Droopy
  lostBee.add(leftAntenna);

  const leftAntennaTip = new THREE.Mesh(antennaTipGeometry, blackMaterial);
  leftAntennaTip.position.set(14, -4, 16);
  lostBee.add(leftAntennaTip);

  const rightAntenna = new THREE.Mesh(antennaGeometry, blackMaterial);
  rightAntenna.position.set(12, 2, 14);
  rightAntenna.rotation.z = -Math.PI / 4; // Droopy
  lostBee.add(rightAntenna);

  const rightAntennaTip = new THREE.Mesh(antennaTipGeometry, blackMaterial);
  rightAntennaTip.position.set(14, 4, 16);
  lostBee.add(rightAntennaTip);

  // Wings - slightly transparent blue tint
  const wingGeometry = new THREE.PlaneGeometry(12, 16, 2, 2);

  const wingPositions = wingGeometry.attributes.position;
  for (let i = 0; i < wingPositions.count; i++) {
    const x = wingPositions.getX(i);
    wingPositions.getY(i);
    const z = Math.sin(x * 0.1) * 1.5;
    wingPositions.setZ(i, z);
  }
  wingGeometry.attributes.position.needsUpdate = true;

  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0xadd8e6, // Light blue tint
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    roughness: 0.1,
    metalness: 0.1,
  });

  const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
  leftWing.name = "leftWing";
  leftWing.position.set(-2, -7, 12);
  leftWing.rotation.x = Math.PI / 2;
  leftWing.rotation.z = Math.PI / 12;
  lostBee.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
  rightWing.name = "rightWing";
  rightWing.position.set(-2, 7, 12);
  rightWing.rotation.x = Math.PI / 2;
  rightWing.rotation.z = -Math.PI / 12;
  lostBee.add(rightWing);

  // Smaller legs
  const legGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 3);

  for (let i = 0; i < 6; i++) {
    const leg = new THREE.Mesh(legGeometry, blackMaterial);
    const angle = (i / 6) * Math.PI * 2;
    const radius = 6;
    leg.position.set(Math.cos(angle) * radius - 2, Math.sin(angle) * radius, 5);
    leg.rotation.x = Math.PI / 2;
    leg.rotation.z = angle;
    lostBee.add(leg);
  }

  lostBee.position.z = 8;
  lostBee.scale.set(0.7, 0.7, 0.7); // Smaller than player
  lostBee.castShadow = true;
  lostBee.receiveShadow = true;
  return lostBee;
}

function LostBeeNPC(tileIndex: number) {
  const npc = new THREE.Group();
  npc.position.x = tileIndex * tileSize;
  npc.position.z = 20;

  const lostBee = LostBeeModel();
  npc.add(lostBee);

  npc.name = "lost-bee";
  npc.userData = {
    isFollowing: false,
    targetPosition: new THREE.Vector3(),
    idleTime: Math.random() * Math.PI * 2, // Random start for idle animation
    rescued: false,
  };

  return npc;
}

function WaspEnemy(tileIndex: number) {
  const enemy = new THREE.Group();
  enemy.position.x = tileIndex * tileSize;
  enemy.position.z = 25;

  const wasp = WaspModel();
  enemy.add(wasp);

  enemy.name = "wasp-enemy";
  enemy.userData = {
    targetPosition: new THREE.Vector3(),
    attackMode: false,
    hoverTime: Math.random() * Math.PI * 2,
    speed: 150 + Math.random() * 50, // Variable speed
  };

  return enemy;
}

// Player function now always returns the BeeModel
function Player() {
  const playerContainer = new THREE.Group();
  const beeAvatar = BeeModel();
  playerContainer.add(beeAvatar);
  return playerContainer;
}

function Road(rowIndex: number) {
  const road = new THREE.Group();
  road.position.y = rowIndex * tileSize;
  const createSection = (color: number) =>
    new THREE.Mesh(
      new THREE.PlaneGeometry(tilesPerRow * tileSize, tileSize),
      new THREE.MeshLambertMaterial({ color })
    );
  const middle = createSection(0x454a59);
  middle.receiveShadow = true;
  road.add(middle);
  const left = createSection(0x393d49);
  left.position.x = -tilesPerRow * tileSize;
  road.add(left);
  const right = createSection(0x393d49);
  right.position.x = tilesPerRow * tileSize;
  road.add(right);
  return road;
}

function Tree(tileIndex: number, height: number) {
  const tree = new THREE.Group();
  tree.position.x = tileIndex * tileSize;
  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(15, 15, 20),
    new THREE.MeshLambertMaterial({
      color: 0x4d2926,
      flatShading: true,
    })
  );
  trunk.position.z = 10;
  tree.add(trunk);
  const crown = new THREE.Mesh(
    new THREE.BoxGeometry(30, 30, height),
    new THREE.MeshLambertMaterial({
      color: 0x7aa21d,
      flatShading: true,
    })
  );
  crown.position.z = height / 2 + 20;
  crown.castShadow = true;
  crown.receiveShadow = true;
  tree.add(crown);
  return tree;
}

// Starting line for Stage 4 (Timed Dash)
function StartingLine() {
  const line = new THREE.Group();
  
  // Create a wide starting line
  const lineGeometry = new THREE.PlaneGeometry(tileSize * 15, 3);
  const lineMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x00ff00, // Green
    transparent: true,
    opacity: 0.8,
    emissive: 0x00ff00,
    emissiveIntensity: 0.3
  });
  const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
  lineMesh.rotation.x = -Math.PI / 2;
  lineMesh.position.z = 1;
  line.add(lineMesh);
  
  // Add green flag
  const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8);
  const flagPoleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
  const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
  flagPole.position.set(0, 0, 5);
  line.add(flagPole);
  
  const flagGeometry = new THREE.PlaneGeometry(3, 2);
  const flagMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x00ff00, // Green
    emissive: 0x00ff00,
    emissiveIntensity: 0.2
  });
  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.set(1.5, 0, 8);
  flag.rotation.y = Math.PI / 2;
  line.add(flag);
  
  // Add "START" text using geometry
  const textGeometry = new THREE.PlaneGeometry(8, 2);
  const textMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  });
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.rotation.x = -Math.PI / 2;
  textMesh.position.z = 2;
  textMesh.name = "start-text";
  line.add(textMesh);
  
  line.name = "starting-line";
  return line;
}

// Finish line for Stage 4 (Timed Dash)
function FinishLine() {
  const line = new THREE.Group();
  
  // Create a wide finish line with checkered pattern
  const lineGeometry = new THREE.PlaneGeometry(tileSize * 15, 4);
  const lineMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000, // Red
    transparent: true,
    opacity: 0.9,
    emissive: 0xff0000,
    emissiveIntensity: 0.4
  });
  const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
  lineMesh.rotation.x = -Math.PI / 2;
  lineMesh.position.z = 1;
  line.add(lineMesh);
  
  // Add red flag
  const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8);
  const flagPoleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
  const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
  flagPole.position.set(0, 0, 5);
  line.add(flagPole);
  
  const flagGeometry = new THREE.PlaneGeometry(3, 2);
  const flagMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000, // Red
    emissive: 0xff0000,
    emissiveIntensity: 0.3
  });
  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.set(1.5, 0, 8);
  flag.rotation.y = Math.PI / 2;
  line.add(flag);
  
  // Add "FINISH" text using geometry
  const textGeometry = new THREE.PlaneGeometry(8, 2);
  const textMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  });
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.rotation.x = -Math.PI / 2;
  textMesh.position.z = 2;
  textMesh.name = "finish-text";
  line.add(textMesh);
  
  line.name = "finish-line";
  return line;
}

// Progress indicator for Stage 4
function ProgressIndicator(currentRow: number, totalRows: number) {
  const progress = new THREE.Group();
  
  // Background bar
  const bgGeometry = new THREE.PlaneGeometry(20, 1);
  const bgMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    transparent: true,
    opacity: 0.7
  });
  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  bgMesh.rotation.x = -Math.PI / 2;
  bgMesh.position.z = 0.5;
  progress.add(bgMesh);
  
  // Progress bar
  const progressPercent = Math.min(currentRow / totalRows, 1);
  const progressGeometry = new THREE.PlaneGeometry(20 * progressPercent, 0.8);
  const progressMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x00ff00,
    transparent: true,
    opacity: 0.8,
    emissive: 0x00ff00,
    emissiveIntensity: 0.2
  });
  const progressMesh = new THREE.Mesh(progressGeometry, progressMaterial);
  progressMesh.rotation.x = -Math.PI / 2;
  progressMesh.position.z = 0.6;
  progressMesh.position.x = (20 * progressPercent - 20) / 2; // Align to left
  progress.add(progressMesh);
  
  progress.name = "progress-indicator";
  return progress;
}

function Truck(initialTileIndex: number, direction: boolean, color: number) {
  const truck = new THREE.Group();
  truck.position.x = initialTileIndex * tileSize;
  if (!direction) truck.rotation.z = Math.PI;
  const cargo = new THREE.Mesh(
    new THREE.BoxGeometry(70, 35, 35),
    new THREE.MeshLambertMaterial({
      color: 0xb4c6fc,
      flatShading: true,
    })
  );
  cargo.position.x = -15;
  cargo.position.z = 25;
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  truck.add(cargo);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), [
    new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      map: truckFrontTexture,
    }), // front
    new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      map: truckLeftSideTexture,
    }),
    new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      map: truckRightSideTexture,
    }),
    new THREE.MeshPhongMaterial({ color, flatShading: true }), // top
    new THREE.MeshPhongMaterial({ color, flatShading: true }), // bottom
  ]);
  cabin.position.x = 35;
  cabin.position.z = 20;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  truck.add(cabin);
  const frontWheel = Wheel(37);
  truck.add(frontWheel);
  const middleWheel = Wheel(5);
  truck.add(middleWheel);
  const backWheel = Wheel(-35);
  truck.add(backWheel);
  return truck;
}

function Wheel(x: number) {
  const wheel = new THREE.Mesh(
    new THREE.BoxGeometry(12, 33, 12),
    new THREE.MeshLambertMaterial({
      color: 0x333333,
      flatShading: true,
    })
  );
  wheel.position.x = x;
  wheel.position.z = 6;
  return wheel;
}

function calculateFinalPosition(
  currentPosition: { rowIndex: number; tileIndex: number },
  moves: string[]
) {
  return moves.reduce((position, direction) => {
    if (direction === "forward")
      return {
        rowIndex: position.rowIndex + 1,
        tileIndex: position.tileIndex,
      };
    if (direction === "backward")
      return {
        rowIndex: position.rowIndex - 1,
        tileIndex: position.tileIndex,
      };
    if (direction === "left")
      return {
        rowIndex: position.rowIndex,
        tileIndex: position.tileIndex - 1,
      };
    if (direction === "right")
      return {
        rowIndex: position.rowIndex,
        tileIndex: position.tileIndex + 1,
      };
    return position;
  }, currentPosition);
}

function endsUpInValidPosition(
  currentPosition: { rowIndex: number; tileIndex: number },
  moves: string[],
  metadata: any[]
) {
  const finalPosition = calculateFinalPosition(currentPosition, moves);

  if (
    finalPosition.rowIndex === -1 ||
    finalPosition.tileIndex === minTileIndex - 1 ||
    finalPosition.tileIndex === maxTileIndex + 1
  ) {
    return false;
  }

  const finalRow = metadata[finalPosition.rowIndex - 1];
  if (
    finalRow &&
    finalRow.type === "forest" &&
    finalRow.trees.some(
      (tree: { tileIndex: number }) =>
        tree.tileIndex === finalPosition.tileIndex
    )
  ) {
    return false;
  }
  return true;
}

function __generateRow(_stageId = 1) {
  return generateForesMetadata();
}

export function generateStage1HoneyJars() {
  const jars = [];
  const used = new Set();
  while (jars.length < 20) {
    const rowIndex = Math.floor(Math.random() * 15) + 2; // adjust range as needed
    const tileIndex = Math.floor(Math.random() * 13) - 6; // adjust range as needed
    const environments = ["grass", "road", "forest"];
    const environment =
      environments[Math.floor(Math.random() * environments.length)];
    const key = `${rowIndex},${tileIndex},${environment}`;
    if (!used.has(key)) {
      jars.push({ rowIndex, tileIndex, environment });
      used.add(key);
    }
  }
  return jars;
}

export function generateStage2HoneyJars() {
  const jars = [];
  const used = new Set();
  while (jars.length < 25) { // More jars for stage 2
    const rowIndex = Math.floor(Math.random() * 18) + 2; // More rows
    const tileIndex = Math.floor(Math.random() * 13) - 6;
    const environments = ["grass", "road", "forest"];
    const environment =
      environments[Math.floor(Math.random() * environments.length)];
    const key = `${rowIndex},${tileIndex},${environment}`;
    if (!used.has(key)) {
      jars.push({ rowIndex, tileIndex, environment });
      used.add(key);
    }
  }
  return jars;
}

export function generateStage3HoneyJars() {
  const jars = [];
  const used = new Set();
  
  // Generate more honey jars for Stage 3 to ensure enough are accessible
  // Target: 25-30 jars to ensure player can collect 10
  const targetJars = 30;
  
  while (jars.length < targetJars) {
    const rowIndex = Math.floor(Math.random() * 20) + 2; // Focus on early rows for better accessibility
    const tileIndex = Math.floor(Math.random() * 11) - 5; // Slightly smaller range to avoid edges
    const environments = ["grass", "road", "forest"];
    const environment =
      environments[Math.floor(Math.random() * environments.length)];
    const key = `${rowIndex},${tileIndex},${environment}`;
    if (!used.has(key)) {
      jars.push({ rowIndex, tileIndex, environment });
      used.add(key);
    }
  }
  
  console.log(`Stage 3: Generated ${jars.length} honey jars for collection target of 10`);
  return jars;
}

function _generateWaspLaneMetadata() {
  const occupiedTiles = new Set();
  const wasps = Array.from({ length: 2 }, () => {
    let tileIndex: number;
    do {
      tileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(tileIndex));
    occupiedTiles.add(tileIndex);
    return { tileIndex };
  });
  return { type: "wasp", wasps };
}

function _generateLostBeeLaneMetadata() {
  const occupiedTiles = new Set();
  const lostBees = Array.from({ length: 3 }, () => {
    let tileIndex: number;
    do {
      tileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(tileIndex));
    occupiedTiles.add(tileIndex);
    return { tileIndex };
  });
  return { type: "lost-bees", lostBees };
}

function randomElement(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateForesMetadata() {
  const occupiedTiles = new Set();
  const trees = Array.from({ length: 4 }, () => {
    let tileIndex: number;
    do {
      tileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(tileIndex));
    occupiedTiles.add(tileIndex);
    const height = randomElement([20, 45, 60]);
    return { tileIndex, height };
  });
  return { type: "forest", trees };
}

function _generateCarLaneMetadata(stageId = 1) {
  const direction = randomElement([true, false]);
  // Increase speed based on stage
  const baseSpeed = 125;
  const speed = randomElement([
    baseSpeed + (stageId - 1) * 25,
    baseSpeed + (stageId - 1) * 31,
    baseSpeed + (stageId - 1) * 38,
  ]);

  const occupiedTiles = new Set();
  const vehicleCount = Math.max(2, 4 - stageId); // Fewer cars in harder stages

  const vehicles = Array.from({ length: vehicleCount }, () => {
    let initialTileIndex: number;
    do {
      initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(initialTileIndex));
    occupiedTiles.add(initialTileIndex - 1);
    occupiedTiles.add(initialTileIndex);
    occupiedTiles.add(initialTileIndex + 1);
    const color = randomElement([0xa52523, 0xbdb638, 0x78b14b]);
    return { initialTileIndex, color };
  });

  const result: any = { type: "car", direction, speed, vehicles };

  return result;
}

function _generateTruckLaneMetadata(stageId = 1) {
  const direction = randomElement([true, false]);
  const baseSpeed = 125;
  const speed = randomElement([
    baseSpeed + (stageId - 1) * 25,
    baseSpeed + (stageId - 1) * 31,
    baseSpeed + (stageId - 1) * 38,
  ]);

  const occupiedTiles = new Set();
  const vehicles = Array.from({ length: 2 }, () => {
    let initialTileIndex: number;
    do {
      initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(initialTileIndex));
    occupiedTiles.add(initialTileIndex - 2);
    occupiedTiles.add(initialTileIndex - 1);
    occupiedTiles.add(initialTileIndex);
    occupiedTiles.add(initialTileIndex + 1);
    occupiedTiles.add(initialTileIndex + 2);
    const color = randomElement([0xa52523, 0xbdb638, 0x78b14b]);
    return { initialTileIndex, color };
  });

  const result: any = { type: "truck", direction, speed, vehicles };

  return result;
}

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private player: THREE.Group;
  private map: THREE.Group;
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private enemies: THREE.Group[] = [];
  private npcs: THREE.Group[] = [];

  private metadata: any[] = [];
  private position = { currentRow: 0, currentTile: 0 };
  private movesQueue: string[] = [];
  private moveClock = new THREE.Clock(false);
  private clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private jumpSound: HTMLAudioElement;
  private soundPlayedThisHop = false;
  private stageId: number;
  private collectibles: THREE.Group[] = [];
  private onHoneyJarCollected?: () => void;

  // Stage 4 specific properties
  private finishLineRow: number = 0;
  private progressIndicator: THREE.Group | null = null;
  private stage4Completed: boolean = false;

  // Multiplayer racing properties
  private opponent: THREE.Group | null = null;
  private opponentPosition = { currentRow: 0, currentTile: 0 };
  private isMultiplayerMode: boolean = false;
  private racingStarted: boolean = false;
  private onPositionUpdate?: (position: { row: number; tile: number; progress: number }) => void;
  private onFinish?: () => void;
  private onCollision?: () => void; // New collision callback
  private isRacingMode: boolean = false;

  private setScore: (score: number) => void;
  private setGameOver: (isOver: boolean) => void;
  private setFinalScore: (score: number) => void;

  private resizeHandler?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    setScore: (score: number) => void,
    setGameOver: (isOver: boolean) => void,
    setFinalScore: (score: number) => void,
    stageId = 1,
    onHoneyJarCollected?: () => void
  ) {
    this.setScore = setScore;
    this.setGameOver = setGameOver;
    this.setFinalScore = setFinalScore;
    this.stageId = stageId;
    this.onHoneyJarCollected = onHoneyJarCollected;

    this.scene = new THREE.Scene();
    this.player = Player();
    this.map = new THREE.Group();

    this.scene.add(this.player);
    this.scene.add(this.map);

    this.ambientLight = new THREE.AmbientLight();
    this.scene.add(this.ambientLight);

    this.dirLight = DirectionalLight();
    this.dirLight.target = this.player;
    this.player.add(this.dirLight);

    this.camera = Camera(canvas.clientWidth, canvas.clientHeight);
    this.player.add(this.camera);

    this.renderer = this.createRenderer(canvas);

    this.jumpSound = new Audio(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pixel-jump-319167-M5gdjTE3GvOz01C7CKE00zM0SANYH6.mp3"
    );
    this.jumpSound.volume = 0.5;

    this.initializeGame();
  }

  private createRenderer(canvas: HTMLCanvasElement) {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: canvas,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.shadowMap.enabled = true;
    return renderer;
  }

  private initializePlayer() {
    this.player.position.x = 0;
    this.player.position.y = 0;
    if (this.player.children[0]) {
      this.player.children[0].position.z = 10;
    }
    this.position.currentRow = 0;
    this.position.currentTile = 0;
    this.movesQueue.length = 0;
  }

  private initializeMap() {
    this.metadata.length = 0;
    this.collectibles.length = 0;
    this.enemies.length = 0;
    this.npcs.length = 0;
    this.map.remove(...this.map.children);
    for (let rowIndex = 0; rowIndex > -10; rowIndex--) {
      const grass = Grass(rowIndex);
      this.map.add(grass);
    }
    this.addRows();
  }

  private addRows() {
    const newMetadata = generateRows(20, this.stageId);
    const startIndex = this.metadata.length;
    this.metadata.push(...newMetadata);

    // Stage 4 setup - add starting line and set finish line position
    if (this.stageId === 4 && startIndex === 0) {
      // Add starting line at the beginning
      const startingLine = StartingLine();
      startingLine.position.y = 0;
      this.map.add(startingLine);
      
      // Set finish line position (around row 25-30 for a good race distance)
      this.finishLineRow = 28;
      console.log(`Stage 4: Finish line set at row ${this.finishLineRow}`);
      
      // Add initial progress indicator
      this.updateProgressIndicator();
    }

    // Get predefined honey jar positions for honey rush stages (skip in racing mode)
    let honeyJars: any[] = [];
    if (startIndex === 0 && !this.isRacingMode) {
      if (this.stageId === 1) {
        honeyJars = generateStage1HoneyJars();
      } else if (this.stageId === 2) {
        honeyJars = generateStage2HoneyJars();
      } else if (this.stageId === 3) {
        honeyJars = generateStage3HoneyJars();
      }
    }

    newMetadata.forEach((rowData, index) => {
      const rowIndex = startIndex + index + 1;

      if (rowData.type === "forest") {
        const row = Grass(rowIndex);
        rowData.trees.forEach(
          ({ tileIndex, height }: { tileIndex: number; height: number }) => {
            const tree = Tree(tileIndex, height);
            row.add(tree);
          }
        );

        // Add honey jars to forest rows for honey rush stages (skip in racing mode)
        if (this.stageId >= 1 && this.stageId <= 3 && !this.isRacingMode) {
          const honeyJarsForThisRow = honeyJars.filter(
            (jar: any) =>
              jar.rowIndex === rowIndex &&
              (jar.environment === "forest" || jar.environment === "grass")
          );
          console.log(`Stage ${this.stageId}, Row ${rowIndex}: Found ${honeyJarsForThisRow.length} honey jars for forest/grass`);
          honeyJarsForThisRow.forEach(({ tileIndex }: { tileIndex: number }) => {
            // Make sure honey jar doesn't conflict with trees
            const hasTree = rowData.trees.some(
              (tree: any) => tree.tileIndex === tileIndex
            );
            if (!hasTree) {
              const honeyJar = HoneyJar(tileIndex);
              honeyJar.name = "honey-jar"; // Ensure the name is set
              row.add(honeyJar);
              this.collectibles.push(honeyJar);
              console.log(`Added honey jar at tile ${tileIndex} in forest row ${rowIndex}`);
            } else {
              // Try to place the jar slightly offset if there's a tree conflict
              const offsetTile = tileIndex + (Math.random() > 0.5 ? 1 : -1);
              if (offsetTile >= -6 && offsetTile <= 6) {
                const hasTreeAtOffset = rowData.trees.some(
                  (tree: any) => tree.tileIndex === offsetTile
                );
                if (!hasTreeAtOffset) {
                  const honeyJar = HoneyJar(offsetTile);
                  honeyJar.name = "honey-jar";
                  row.add(honeyJar);
                  this.collectibles.push(honeyJar);
                  console.log(`Added honey jar at offset tile ${offsetTile} in forest row ${rowIndex} (original ${tileIndex} had tree)`);
                } else {
                  console.log(`Skipped honey jar at tile ${tileIndex} due to tree conflict in row ${rowIndex}`);
                }
              } else {
                console.log(`Skipped honey jar at tile ${tileIndex} due to tree conflict in row ${rowIndex}`);
              }
            }
          });
        }

        this.map.add(row);
      }

      // Add honey jars to grass-only rows for better accessibility (skip in racing mode)
      if (rowData.type === "grass" && this.stageId >= 1 && this.stageId <= 3 && !this.isRacingMode) {
        const row = Grass(rowIndex);
        
        // Add some extra honey jars to grass rows for better accessibility
        const extraJarsCount = this.stageId === 3 ? 2 : 1; // More jars for Stage 3
        for (let i = 0; i < extraJarsCount; i++) {
          const tileIndex = Math.floor(Math.random() * 11) - 5;
          const honeyJar = HoneyJar(tileIndex);
          honeyJar.name = "honey-jar";
          row.add(honeyJar);
          this.collectibles.push(honeyJar);
          console.log(`Added extra honey jar at tile ${tileIndex} in grass row ${rowIndex} for Stage ${this.stageId}`);
        }
        
        this.map.add(row);
      }

      if (rowData.type === "car") {
        const row = Road(rowIndex);
        rowData.vehicles.forEach((vehicle: any) => {
          const car = Car(
            vehicle.initialTileIndex,
            rowData.direction,
            vehicle.color
          );
          vehicle.ref = car;
          row.add(car);
        });

        // Add honey jars to car roads for honey rush stages (skip in racing mode)
        if (this.stageId >= 1 && this.stageId <= 3 && !this.isRacingMode) {
          const honeyJarsForThisRow = honeyJars.filter(
            (jar: any) => jar.rowIndex === rowIndex && jar.environment === "road"
          );
          console.log(`Stage ${this.stageId}, Row ${rowIndex}: Found ${honeyJarsForThisRow.length} honey jars for car road`);
          honeyJarsForThisRow.forEach(({ tileIndex }: { tileIndex: number }) => {
            // Make sure honey jar doesn't conflict with cars
            const hasVehicle = rowData.vehicles.some(
              (vehicle: any) =>
                Math.abs(vehicle.initialTileIndex - tileIndex) < 2
            );
            if (!hasVehicle) {
              const honeyJar = HoneyJar(tileIndex);
              honeyJar.name = "honey-jar"; // Ensure the name is set
              row.add(honeyJar);
              this.collectibles.push(honeyJar);
              console.log(`Added honey jar at tile ${tileIndex} in car road row ${rowIndex}`);
            } else {
              // Try to place the jar slightly offset if there's a vehicle conflict
              const offsetTile = tileIndex + (Math.random() > 0.5 ? 1 : -1);
              if (offsetTile >= -6 && offsetTile <= 6) {
                const hasVehicleAtOffset = rowData.vehicles.some(
                  (vehicle: any) =>
                    Math.abs(vehicle.initialTileIndex - offsetTile) < 2
                );
                if (!hasVehicleAtOffset) {
                  const honeyJar = HoneyJar(offsetTile);
                  honeyJar.name = "honey-jar";
                  row.add(honeyJar);
                  this.collectibles.push(honeyJar);
                  console.log(`Added honey jar at offset tile ${offsetTile} in car road row ${rowIndex} (original ${tileIndex} had vehicle)`);
                } else {
                  console.log(`Skipped honey jar at tile ${tileIndex} due to vehicle conflict in car road row ${rowIndex}`);
                }
              } else {
                console.log(`Skipped honey jar at tile ${tileIndex} due to vehicle conflict in car road row ${rowIndex}`);
              }
            }
          });
        }

        this.map.add(row);
      }

      if (rowData.type === "truck") {
        const row = Road(rowIndex);
        rowData.vehicles.forEach((vehicle: any) => {
          const truck = Truck(
            vehicle.initialTileIndex,
            rowData.direction,
            vehicle.color
          );
          vehicle.ref = truck;
          row.add(truck);
        });

        // Add honey jars to truck roads for honey rush stages (skip in racing mode)
        if (this.stageId >= 1 && this.stageId <= 3 && !this.isRacingMode) {
          const honeyJarsForThisRow = honeyJars.filter(
            (jar: any) => jar.rowIndex === rowIndex && jar.environment === "road"
          );
          console.log(`Stage ${this.stageId}, Row ${rowIndex}: Found ${honeyJarsForThisRow.length} honey jars for truck road`);
          honeyJarsForThisRow.forEach(({ tileIndex }: { tileIndex: number }) => {
            // Make sure honey jar doesn't conflict with trucks
            const hasVehicle = rowData.vehicles.some(
              (vehicle: any) =>
                Math.abs(vehicle.initialTileIndex - tileIndex) < 3
            );
            if (!hasVehicle) {
              const honeyJar = HoneyJar(tileIndex);
              honeyJar.name = "honey-jar"; // Ensure the name is set
              row.add(honeyJar);
              this.collectibles.push(honeyJar);
              console.log(`Added honey jar at tile ${tileIndex} in truck road row ${rowIndex}`);
            } else {
              // Try to place the jar slightly offset if there's a vehicle conflict
              const offsetTile = tileIndex + (Math.random() > 0.5 ? 1 : -1);
              if (offsetTile >= -6 && offsetTile <= 6) {
                const hasVehicleAtOffset = rowData.vehicles.some(
                  (vehicle: any) =>
                    Math.abs(vehicle.initialTileIndex - offsetTile) < 3
                );
                if (!hasVehicleAtOffset) {
                  const honeyJar = HoneyJar(offsetTile);
                  honeyJar.name = "honey-jar";
                  row.add(honeyJar);
                  this.collectibles.push(honeyJar);
                  console.log(`Added honey jar at offset tile ${offsetTile} in truck road row ${rowIndex} (original ${tileIndex} had vehicle)`);
                } else {
                  console.log(`Skipped honey jar at tile ${tileIndex} due to vehicle conflict in truck road row ${rowIndex}`);
                }
              } else {
                console.log(`Skipped honey jar at tile ${tileIndex} due to vehicle conflict in truck road row ${rowIndex}`);
              }
            }
          });
        }

        this.map.add(row);
      }

      // Handle other row types (wasp, lost-bees) as before
      if (rowData.type === "wasp") {
        const row = Grass(rowIndex);
        rowData.wasps.forEach(({ tileIndex }: { tileIndex: number }) => {
          const wasp = WaspEnemy(tileIndex);
          row.add(wasp);
          this.enemies.push(wasp);
        });
        this.map.add(row);
      }
      if (rowData.type === "lost-bees") {
        const row = Grass(rowIndex);
        rowData.lostBees.forEach(({ tileIndex }: { tileIndex: number }) => {
          const lostBee = LostBeeNPC(tileIndex);
          row.add(lostBee);
          this.npcs.push(lostBee);
        });
        this.map.add(row);
      }
    });
    
    // Log summary of honey jar placement
    if (this.stageId >= 1 && this.stageId <= 3 && startIndex === 0) {
      console.log(`Stage ${this.stageId}: Generated ${honeyJars.length} honey jars, placed ${this.collectibles.length} collectibles`);
      console.log(`Stage ${this.stageId}: Target collection is ${this.stageId === 1 ? 4 : this.stageId === 2 ? 7 : 10} honey jars`);
    }
  }

  // Update progress indicator for Stage 4
  private updateProgressIndicator() {
    if (this.stageId !== 4) return;
    
    // Remove old progress indicator
    if (this.progressIndicator) {
      this.map.remove(this.progressIndicator);
    }
    
    // Create new progress indicator
    this.progressIndicator = ProgressIndicator(this.position.currentRow, this.finishLineRow);
    this.progressIndicator.position.set(0, 0, 50); // Position above the game area
    this.map.add(this.progressIndicator);
    
    // Also add a floating progress indicator above the player
    this.updateFloatingProgressIndicator();
  }

  // Add floating progress indicator above player
  private updateFloatingProgressIndicator() {
    if (this.stageId !== 4) return;
    
    // Remove old floating indicator
    const oldFloatingIndicator = this.player.children.find(child => child.name === "floating-progress");
    if (oldFloatingIndicator) {
      this.player.remove(oldFloatingIndicator);
    }
    
    // Create floating progress bar
    const progressPercent = Math.min(this.position.currentRow / this.finishLineRow, 1);
    const floatingIndicator = new THREE.Group();
    floatingIndicator.name = "floating-progress";
    
    // Background
    const bgGeometry = new THREE.PlaneGeometry(4, 0.3);
    const bgMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      transparent: true,
      opacity: 0.7
    });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.z = 25;
    floatingIndicator.add(bgMesh);
    
    // Progress bar
    const progressGeometry = new THREE.PlaneGeometry(4 * progressPercent, 0.2);
    const progressMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.9,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3
    });
    const progressMesh = new THREE.Mesh(progressGeometry, progressMaterial);
    progressMesh.position.z = 25.1;
    progressMesh.position.x = (4 * progressPercent - 4) / 2; // Align to left
    floatingIndicator.add(progressMesh);
    
    this.player.add(floatingIndicator);
  }

  // Add finish line when player gets close
  private checkFinishLine() {
    if (this.stageId !== 4) return;
    
    // Add finish line when player is within 5 rows
    if (this.position.currentRow >= this.finishLineRow - 5 && this.position.currentRow <= this.finishLineRow) {
      // Check if finish line already exists
      const existingFinishLine = this.map.children.find(child => child.name === "finish-line");
      if (!existingFinishLine) {
        const finishLine = FinishLine();
        finishLine.position.y = this.finishLineRow * tileSize;
        this.map.add(finishLine);
        console.log(`Stage 4: Finish line added at row ${this.finishLineRow}`);
      }
    }
  }

  // Add celebration effect when reaching finish line
  private addFinishLineCelebration() {
    if (this.stageId !== 4) return;
    
    // Create celebration particles
    for (let i = 0; i < 20; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(1, 4, 4),
        new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0xffd700 : 0xff0000, // Gold or red
          emissive: 0xffd700,
          emissiveIntensity: 0.5
        })
      );
      
      // Position particles around the finish line
      particle.position.set(
        (Math.random() - 0.5) * 200,
        this.finishLineRow * tileSize + (Math.random() - 0.5) * 50,
        20 + Math.random() * 30
      );
      
      particle.name = "celebration-particle";
      this.map.add(particle);
    }
    
    console.log("Stage 4: Added celebration effect!");
  }

  public queueMove(direction: string) {
    // Don't allow moves if racing hasn't started in multiplayer mode
    if (this.isMultiplayerMode && !this.racingStarted) {
      console.log('Move blocked: Racing not started yet');
      return;
    }
    
    console.log(`Queueing move: ${direction} (Racing: ${this.racingStarted}, Multiplayer: ${this.isMultiplayerMode})`);
    
    const isValidMove = endsUpInValidPosition(
      {
        rowIndex: this.position.currentRow,
        tileIndex: this.position.currentTile,
      },
      [...this.movesQueue, direction],
      this.metadata
    );
    if (!isValidMove) {
      console.log('Move invalid');
      return;
    }
    this.movesQueue.push(direction);
  }

  private stepCompleted() {
    const direction = this.movesQueue.shift();
    if (direction === "forward") this.position.currentRow += 1;
    if (direction === "backward") this.position.currentRow -= 1;
    if (direction === "left") this.position.currentTile -= 1;
    if (direction === "right") this.position.currentTile += 1;

    if (this.position.currentRow > this.metadata.length - 10) this.addRows();
    this.setScore(this.position.currentRow);
    this.soundPlayedThisHop = false;
    this.checkCollectibles();
    
    // Multiplayer position update
    if (this.isMultiplayerMode && this.onPositionUpdate) {
      this.onPositionUpdate({
        row: this.position.currentRow,
        tile: this.position.currentTile,
        progress: this.moveClock.getElapsedTime() / 0.2
      });
    }
    
    // Stage 4 specific updates
    if (this.stageId === 4) {
      this.updateProgressIndicator();
      this.checkFinishLine();
      
      // Check if player reached finish line
      if (this.position.currentRow >= this.finishLineRow && !this.stage4Completed) {
        console.log(`Stage 4: Player reached finish line!`);
        
        // Add celebration effect
        this.addFinishLineCelebration();
        
        this.stage4Completed = true;
        this.setGameOver(true);
        this.setFinalScore(this.position.currentRow);
        
        // Multiplayer finish callback
        if (this.isMultiplayerMode && this.onFinish) {
          this.onFinish();
        }
      }
    }
  }

  private checkCollectibles() {
    const playerBoundingBox = new THREE.Box3();
    playerBoundingBox.setFromObject(this.player);

    this.collectibles.forEach((collectible, index) => {
      if (collectible.parent && collectible.name === "honey-jar") {
        const collectibleBoundingBox = new THREE.Box3();
        collectibleBoundingBox.setFromObject(collectible);

        if (playerBoundingBox.intersectsBox(collectibleBoundingBox)) {
          console.log(`Honey jar collected! Total collectibles: ${this.collectibles.length}`);
          
          // Remove collectible from scene
          collectible.parent.remove(collectible);
          this.collectibles.splice(index, 1);

          // Call honey jar collection callback for honey rush stages (skip in racing mode)
          if (this.stageId >= 1 && this.stageId <= 3 && this.onHoneyJarCollected && !this.isRacingMode) {
            this.onHoneyJarCollected();
            console.log(`Honey jar collection callback called for stage ${this.stageId}`);
          }

          // Regular score increase for movement
          this.setScore(this.position.currentRow);
        }
      }
    });
  }

  private animatePlayer() {
    if (!this.movesQueue.length) return;
    if (!this.moveClock.running) this.moveClock.start();

    const stepTime = 0.2;
    const progress = Math.min(1, this.moveClock.getElapsedTime() / stepTime);

    this.setPosition(progress);
    this.setRotation(progress);

    // Animate wing flapping and bobbing
    const time = this.clock.getElapsedTime();
    const wingFlapSpeed = 15;
    const bobbingSpeed = 3;
    const wingAngle = Math.sin(time * wingFlapSpeed) * (Math.PI / 6);
    const bobbingOffset = Math.sin(time * bobbingSpeed) * 2;

    if (this.player.children[0]) {
      const beeModel = this.player.children[0] as THREE.Group;

      const leftWing = beeModel.children.find(
        (child: { name: string }) => child.name === "leftWing"
      );
      const rightWing = beeModel.children.find(
        (child: { name: string }) => child.name === "rightWing"
      );

      if (leftWing) {
        leftWing.rotation.y = Math.PI / 12 + wingAngle;
        leftWing.position.z = 15 + Math.abs(wingAngle) * 2;
      }
      if (rightWing) {
        rightWing.rotation.y = -Math.PI / 12 - wingAngle;
        rightWing.position.z = 15 + Math.abs(wingAngle) * 2;
      }

      beeModel.position.z = 10 + bobbingOffset;
    }

    if (progress > 0.4 && progress < 0.6 && !this.soundPlayedThisHop) {
      this.jumpSound.currentTime = 0;
      this.jumpSound
        .play()
        .catch((e) => console.error("Error playing sound:", e));
      this.soundPlayedThisHop = true;
    }

    if (progress >= 1) {
      this.stepCompleted();
      this.moveClock.stop();
    }
  }

  private setPosition(progress: number) {
    const startX = this.position.currentTile * tileSize;
    const startY = this.position.currentRow * tileSize;
    let endX = startX;
    let endY = startY;

    if (this.movesQueue[0] === "left") endX -= tileSize;
    if (this.movesQueue[0] === "right") endX += tileSize;
    if (this.movesQueue[0] === "forward") endY += tileSize;
    if (this.movesQueue[0] === "backward") endY -= tileSize;

    this.player.position.x = THREE.MathUtils.lerp(startX, endX, progress);
    this.player.position.y = THREE.MathUtils.lerp(startY, endY, progress);
    if (this.player.children[0]) {
      this.player.children[0].position.z =
        10 + Math.sin(progress * Math.PI) * 8;
    }
  }

  private setRotation(progress: number) {
    let endRotation = 0;
    if (this.movesQueue[0] == "forward") endRotation = 0;
    if (this.movesQueue[0] == "left") endRotation = Math.PI / 2;
    if (this.movesQueue[0] == "right") endRotation = -Math.PI / 2;
    if (this.movesQueue[0] == "backward") endRotation = Math.PI;
    if (this.player.children[0]) {
      this.player.children[0].rotation.z = THREE.MathUtils.lerp(
        this.player.children[0].rotation.z,
        endRotation,
        progress
      );
    }
  }

  private animateVehicles() {
    const delta = this.clock.getDelta();
    this.metadata.forEach((rowData) => {
      if (rowData.type === "car" || rowData.type === "truck") {
        const beginningOfRow = (minTileIndex - 2) * tileSize;
        const endOfRow = (maxTileIndex + 2) * tileSize;
        rowData.vehicles.forEach(({ ref }: { ref: THREE.Group }) => {
          if (!ref) throw Error("Vehicle reference is missing");
          if (rowData.direction) {
            ref.position.x =
              ref.position.x > endOfRow
                ? beginningOfRow
                : ref.position.x + rowData.speed * delta;
          } else {
            ref.position.x =
              ref.position.x < beginningOfRow
                ? endOfRow
                : ref.position.x - rowData.speed * delta;
          }
        });
      }
    });
  }

  private hitTest() {
    const row = this.metadata[this.position.currentRow - 1];
    if (!row) return;

    if (row.type === "car" || row.type === "truck") {
      const playerBoundingBox = new THREE.Box3();
      playerBoundingBox.setFromObject(this.player);

      // Make collision detection more sensitive by expanding the vehicle hitbox slightly
      row.vehicles.forEach(({ ref }: { ref: THREE.Group }) => {
        if (!ref) throw Error("Vehicle reference is missing");
        const vehicleBoundingBox = new THREE.Box3();
        vehicleBoundingBox.setFromObject(ref);

        // Expand vehicle collision box slightly for more immediate detection
        vehicleBoundingBox.expandByScalar(2);

        if (playerBoundingBox.intersectsBox(vehicleBoundingBox)) {
          if (this.isMultiplayerMode) {
            // In multiplayer mode, reset player to starting point
            console.log(`Multiplayer: Player hit by vehicle, resetting to start`);
            this.resetPlayerToStart();
          } else {
            // In single player mode, end the game
            console.log(`Stage ${this.stageId}: Player hit by vehicle at row ${this.position.currentRow}`);
            this.setGameOver(true);
            this.setFinalScore(0); // No score for failing
            this.stop(); // Stop game immediately

            // Immediately trigger mission complete with failure
            setTimeout(() => {
              // This will be handled by the useEffect in the main component
            }, 0);
          }
          return;
        }
      });
    }

    // Handle other collision types based on stage
    if (row.type === "wasp") {
      const playerBoundingBox = new THREE.Box3();
      playerBoundingBox.setFromObject(this.player);

      row.wasps.forEach(({ tileIndex }: { tileIndex: number }) => {
        const waspEnemy = this.map.children[
          this.position.currentRow
        ].children.find(
          (child: any) =>
            child.name === "wasp-enemy" &&
            child.position.x === tileIndex * tileSize
        );
        if (!waspEnemy) return;

        const waspBoundingBox = new THREE.Box3();
        waspBoundingBox.setFromObject(waspEnemy);

        if (playerBoundingBox.intersectsBox(waspBoundingBox)) {
          if (this.isMultiplayerMode) {
            // In multiplayer mode, reset player to starting point
            console.log(`Multiplayer: Player hit by wasp, resetting to start`);
            this.resetPlayerToStart();
          } else {
            // Only wasps cause game over in stages that have them (Stage 3)
            if (this.stageId === 3) {
              this.setGameOver(true);
              this.setFinalScore(0);
              this.stop();
            }
          }
        }
      });
    }

    if (row.type === "lost-bees") {
      const playerBoundingBox = new THREE.Box3();
      playerBoundingBox.setFromObject(this.player);

      row.lostBees.forEach(({ tileIndex }: { tileIndex: number }) => {
        const lostBeeNPC = this.map.children[
          this.position.currentRow
        ].children.find(
          (child: any) =>
            child.name === "lost-bee" &&
            child.position.x === tileIndex * tileSize
        );
        if (!lostBeeNPC) return;

        const lostBeeBoundingBox = new THREE.Box3();
        lostBeeBoundingBox.setFromObject(lostBeeNPC);

        if (playerBoundingBox.intersectsBox(lostBeeBoundingBox)) {
          // Lost bees are harmless - just rescue them
          lostBeeNPC.parent?.remove(lostBeeNPC);
          console.log("Stage 4: Rescued a lost bee!");
        }
      });
    }
  }

  private animateEnemies() {
    const time = this.clock.getElapsedTime();
    const delta = this.clock.getDelta();

    this.enemies.forEach((enemy) => {
      if (enemy.name === "wasp-enemy") {
        const wasp = enemy.children[0] as THREE.Group;
        const userData = enemy.userData;

        // Hover animation
        userData.hoverTime += delta * 3;
        enemy.position.z = 25 + Math.sin(userData.hoverTime) * 3;

        // Wing flapping - much faster than bee
        const wingFlapSpeed = 25;
        const wingAngle = Math.sin(time * wingFlapSpeed) * (Math.PI / 4);

        const leftWing = wasp.children.find(
          (child: any) => child.name === "leftWing"
        );
        const rightWing = wasp.children.find(
          (child: any) => child.name === "rightWing"
        );

        if (leftWing) {
          leftWing.rotation.y = Math.PI / 6 + wingAngle;
        }
        if (rightWing) {
          rightWing.rotation.y = -Math.PI / 6 - wingAngle;
        }

        // Chase behavior for Stage 3
        if (this.stageId === 3) {
          const playerPos = this.player.position;
          const direction = new THREE.Vector3();
          direction.subVectors(playerPos, enemy.position).normalize();

          enemy.position.x += direction.x * userData.speed * delta;
          enemy.position.y += direction.y * userData.speed * delta;

          // Look at player
          wasp.lookAt(playerPos);
        }
      }
    });
  }

  private animateNPCs() {
    const time = this.clock.getElapsedTime();
    const delta = this.clock.getDelta();

    this.npcs.forEach((npc) => {
      if (npc.name === "lost-bee" && !npc.userData.rescued) {
        const lostBee = npc.children[0] as THREE.Group;
        const userData = npc.userData;

        // Idle hover animation
        userData.idleTime += delta * 2;
        npc.position.z = 20 + Math.sin(userData.idleTime) * 2;

        // Slow wing flapping
        const wingFlapSpeed = 8;
        const wingAngle = Math.sin(time * wingFlapSpeed) * (Math.PI / 8);

        const leftWing = lostBee.children.find(
          (child: any) => child.name === "leftWing"
        );
        const rightWing = lostBee.children.find(
          (child: any) => child.name === "rightWing"
        );

        if (leftWing) {
          leftWing.rotation.y = Math.PI / 12 + wingAngle;
        }
        if (rightWing) {
          rightWing.rotation.y = -Math.PI / 12 - wingAngle;
        }

        // Follow behavior when player is close
        const playerPos = this.player.position;
        const distance = npc.position.distanceTo(playerPos);

        if (distance < 50 && !userData.isFollowing) {
          userData.isFollowing = true;
        }

        if (userData.isFollowing) {
          const direction = new THREE.Vector3();
          direction.subVectors(playerPos, npc.position).normalize();

          npc.position.x += direction.x * 80 * delta;
          npc.position.y += direction.y * 80 * delta;

          // Look at player
          lostBee.lookAt(playerPos);

          // Check if reached safe zone (player position)
          if (distance < 15) {
            userData.rescued = true;
            // Add rescue effect or remove from scene
            npc.visible = false;
          }
        }
      }
    });
  }

  public initializeGame() {
    this.initializePlayer();
    this.initializeMap();
    this.setScore(0);
    this.setGameOver(false);
    this.soundPlayedThisHop = false;
  }

  public animate = () => {
    this.animateVehicles();
    this.animatePlayer();
    this.animateEnemies();
    this.animateNPCs();

    // Call hitTest multiple times per frame for more immediate collision detection
    this.hitTest();

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  public start() {
    if (!this.animationFrameId) {
      this.animate();
    }
    
    // Add resize handler
    const handleResize = () => {
      if (this.renderer && this.renderer.domElement) {
        const canvas = this.renderer.domElement;
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        
        // Update camera
        if (this.camera) {
          const size = 300;
          const viewRatio = canvas.clientWidth / canvas.clientHeight;
          const cameraWidth = viewRatio < 1 ? size : size * viewRatio;
          const cameraHeight = viewRatio < 1 ? size / viewRatio : size;
          
          this.camera.left = cameraWidth / -2;
          this.camera.right = cameraWidth / 2;
          this.camera.top = cameraHeight / 2;
          this.camera.bottom = cameraHeight / -2;
          this.camera.updateProjectionMatrix();
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Store the handler for cleanup
    this.resizeHandler = handleResize;
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Remove resize handler
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }
  }

  public dispose() {
    this.stop();
    this.scene.clear();
    this.renderer.dispose();
  }

  // Check if Stage 4 is completed
  public isStage4Completed(): boolean {
    return this.stage4Completed;
  }

  // Multiplayer racing methods
  public setMultiplayerMode(enabled: boolean) {
    console.log(`Setting multiplayer mode: ${enabled}`);
    this.isMultiplayerMode = enabled;
    this.isRacingMode = enabled; // Enable racing mode for multiplayer
    if (enabled) {
      this.initializeOpponent();
    }
  }

  public setMultiplayerCallbacks(
    onPositionUpdate?: (position: { row: number; tile: number; progress: number }) => void,
    onFinish?: () => void,
    onCollision?: () => void
  ) {
    this.onPositionUpdate = onPositionUpdate;
    this.onFinish = onFinish;
    this.onCollision = onCollision;
  }

  public startRacing() {
    console.log('Racing started! Enabling player movement...');
    this.racingStarted = true;
  }

  public updateOpponent(data: { position: { row: number; tile: number; progress: number }; username: string; finished: boolean }) {
    if (!this.opponent) return;
    
    this.opponentPosition = { currentRow: data.position.row, currentTile: data.position.tile };
    
    // Smooth interpolation for opponent movement
    const targetX = data.position.tile * tileSize;
    const targetY = data.position.row * tileSize;
    
    // Faster interpolation for more responsive movement
    const lerpFactor = 0.3; // Increased from 0.1 for faster response
    this.opponent.position.x += (targetX - this.opponent.position.x) * lerpFactor;
    this.opponent.position.y += (targetY - this.opponent.position.y) * lerpFactor;
    
    // Add some animation and visual feedback
    this.opponent.rotation.z = Math.sin(this.clock.getElapsedTime() * 10) * 0.1;
    
    // Add a subtle glow effect when opponent is moving
    if (Math.abs(targetX - this.opponent.position.x) > 1 || Math.abs(targetY - this.opponent.position.y) > 1) {
      this.opponent.children.forEach((child: any) => {
        if (child.material && child.material.emissive) {
          child.material.emissive.setHex(0xff6b6b);
          child.material.emissiveIntensity = 0.2;
        }
      });
    } else {
      this.opponent.children.forEach((child: any) => {
        if (child.material && child.material.emissive) {
          child.material.emissiveIntensity = 0;
        }
      });
    }
    
    // Update opponent's floating progress indicator
    this.updateOpponentFloatingProgressIndicator();
  }

  // Add floating progress indicator above opponent
  private updateOpponentFloatingProgressIndicator() {
    if (!this.opponent || this.stageId !== 4) return;
    
    // Remove old floating indicator
    const oldFloatingIndicator = this.opponent.children.find(child => child.name === "floating-progress");
    if (oldFloatingIndicator) {
      this.opponent.remove(oldFloatingIndicator);
    }
    
    // Create floating progress bar for opponent
    const progressPercent = Math.min(this.opponentPosition.currentRow / this.finishLineRow, 1);
    const floatingIndicator = new THREE.Group();
    floatingIndicator.name = "floating-progress";
    
    // Background
    const bgGeometry = new THREE.PlaneGeometry(4, 0.3);
    const bgMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      transparent: true,
      opacity: 0.7
    });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.z = 25;
    floatingIndicator.add(bgMesh);
    
    // Progress bar (red for opponent)
    const progressGeometry = new THREE.PlaneGeometry(4 * progressPercent, 0.2);
    const progressMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.9,
      emissive: 0xff0000,
      emissiveIntensity: 0.3
    });
    const progressMesh = new THREE.Mesh(progressGeometry, progressMaterial);
    progressMesh.position.z = 25.1;
    progressMesh.position.x = (4 * progressPercent - 4) / 2; // Align to left
    floatingIndicator.add(progressMesh);
    
    this.opponent.add(floatingIndicator);
  }

  private initializeOpponent() {
    if (this.opponent) return;
    
    this.opponent = BeeModel();
    // Make opponent slightly different color to distinguish
    this.opponent.children.forEach((child: any) => {
      if (child.material && child.material.color) {
        child.material.color.setHex(0xff6b6b); // Reddish bee
      }
    });
    this.opponent.position.set(0, 0, 15);
    this.opponent.castShadow = true;
    this.opponent.receiveShadow = true;
    this.scene.add(this.opponent);
  }

  public getPosition() {
    return { ...this.position };
  }

  // Reset player to starting point (for multiplayer collisions)
  private resetPlayerToStart() {
    console.log('Resetting player to starting point...');
    
    // Reset position
    this.position.currentRow = 0;
    this.position.currentTile = 0;
    
    // Clear any pending moves
    this.movesQueue.length = 0;
    
    // Reset player position in 3D world
    this.player.position.set(0, 0, 10);
    
    // Reset score
    this.setScore(0);
    
    // Reset game over state
    this.setGameOver(false);
    
    // Reset sound flag
    this.soundPlayedThisHop = false;
    
    // Update progress indicator
    if (this.stageId === 4) {
      this.updateProgressIndicator();
    }
    
    // Send position update to other player
    if (this.isMultiplayerMode && this.onPositionUpdate) {
      this.onPositionUpdate({
        row: this.position.currentRow,
        tile: this.position.currentTile,
        progress: 0
      });
    }
    
    // Notify collision callback
    if (this.isMultiplayerMode && this.onCollision) {
      this.onCollision();
    }
    
    console.log('Player reset complete');
  }
}
