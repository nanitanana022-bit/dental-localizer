const state = {
  selectedZones: new Map(),
  symptom: "",
  intensity: 5,
  duration: "",
  triggers: new Set(),
  notes: ""
};

const sceneEl = document.getElementById("scene");
const selectedChips = document.getElementById("selectedChips");
const clearBtn = document.getElementById("clearBtn");
const continueBtn = document.getElementById("continueBtn");
const errorEl = document.getElementById("error");
const summarySection = document.getElementById("summarySection");
const summaryContent = document.getElementById("summaryContent");

const zoneNames = [
  "11 — Incisive centrale", "12 — Incisive latérale", "13 — Canine",
  "14 — 1re prémolaire", "15 — 2e prémolaire", "16 — 1re molaire", "17 — 2e molaire",
  "21 — Incisive centrale", "22 — Incisive latérale", "23 — Canine",
  "24 — 1re prémolaire", "25 — 2e prémolaire", "26 — 1re molaire", "27 — 2e molaire",
  "31 — Incisive centrale", "32 — Incisive latérale", "33 — Canine",
  "34 — 1re prémolaire", "35 — 2e prémolaire", "36 — 1re molaire", "37 — 2e molaire",
  "41 — Incisive centrale", "42 — Incisive latérale", "43 — Canine",
  "44 — 1re prémolaire", "45 — 2e prémolaire", "46 — 1re molaire", "47 — 2e molaire"
];

// Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 8.4, 12.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
sceneEl.appendChild(renderer.domElement);

const root = new THREE.Group();
scene.add(root);

scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd8d5, 2.1));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(5, 10, 8);
scene.add(key);
const fill = new THREE.DirectionalLight(0xcde7e4, 1.5);
fill.position.set(-7, 5, 2);
scene.add(fill);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;

function toothMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xf7f3e9,
    roughness: .34,
    metalness: 0,
    clearcoat: .25,
    clearcoatRoughness: .35
  });
}

function makeTooth(index, x, y, z, scale, arch) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.x = arch;
  group.scale.set(scale, scale * 1.18, scale);

  const geo = new THREE.CapsuleGeometry(.42, .78, 5, 12);
  const mesh = new THREE.Mesh(geo, toothMaterial());
  mesh.name = zoneNames[index];
  mesh.userData.zoneIndex = index;
  mesh.userData.baseScale = mesh.scale.clone();
  group.add(mesh);

  // A subtle crown/cusp cap gives the tooth a more anatomical 3D appearance.
  const cap = new THREE.SphereGeometry(.43, 16, 10);
  const capMesh = new THREE.Mesh(cap, toothMaterial());
  capMesh.scale.set(1, .45, 1);
  capMesh.position.y = .47;
  capMesh.userData.zoneIndex = index;
  group.add(capMesh);

  root.add(group);
  return group;
}

function buildArch(startIndex, count, y, z, mirror = 1) {
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const angle = (-Math.PI * .92) + (Math.PI * 1.84) * t;
    const radius = 4.05;
    const x = Math.cos(angle) * radius;
    const zz = z + Math.sin(angle) * radius * .62;
    const scale = i === 0 || i === count-1 ? .86 : (i < 3 || i > count-4 ? .94 : 1.02);
    const rot = -Math.sin(angle) * .34 * mirror;
    makeTooth(startIndex + i, x, y, zz, scale, rot);
  }
}

buildArch(0, 14, .25, 0, 1);
buildArch(14, 14, -.48, .15, -1);

// Gingival bases
const gumMat = new THREE.MeshPhysicalMaterial({ color: 0xe6a7a4, roughness: .55, clearcoat: .15 });
const gum1 = new THREE.Mesh(new THREE.TorusGeometry(4.08, .16, 12, 80, Math.PI * 1.85), gumMat);
gum1.rotation.x = Math.PI / 2;
gum1.position.set(0, .03, 0);
root.add(gum1);

function resize() {
  const w = sceneEl.clientWidth, h = sceneEl.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
window.addEventListener("resize", resize);
resize();

let dragging = false, lastX = 0, lastY = 0;
sceneEl.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener("pointerup", () => dragging = false);
window.addEventListener("pointermove", e => {
  if (!dragging) return;
  root.rotation.y += (e.clientX - lastX) * .008;
  root.rotation.x = Math.max(-.5, Math.min(.5, root.rotation.x + (e.clientY - lastY) * .004));
  lastX = e.clientX; lastY = e.clientY;
});

sceneEl.addEventListener("wheel", e => {
  e.preventDefault();
  camera.position.z = Math.max(8, Math.min(17, camera.position.z + e.deltaY * .008));
}, {passive:false});

sceneEl.addEventListener("pointermove", e => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(root.children, true).filter(h => h.object.userData.zoneIndex !== undefined);
  if (hovered && hovered !== hits[0]?.object) hovered.scale.set(1,1,1);
  hovered = hits[0]?.object || null;
  if (hovered && !state.selectedZones.has(hovered.userData.zoneIndex)) {
    hovered.scale.set(1.08,1.08,1.08);
  }
});

sceneEl.addEventListener("click", e => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(root.children, true).filter(h => h.object.userData.zoneIndex !== undefined);
  if (!hits.length) return;
  const idx = hits[0].object.userData.zoneIndex;
  const zone = zoneNames[idx];
  if (state.selectedZones.has(idx)) {
    state.selectedZones.delete(idx);
  } else {
    state.selectedZones.set(idx, zone);
  }
  updateToothVisuals();
  renderChips();
});

function updateToothVisuals() {
  root.traverse(obj => {
    if (obj.userData.zoneIndex === undefined || !obj.material) return;
    const selected = state.selectedZones.has(obj.userData.zoneIndex);
    obj.material.color.setHex(selected ? 0x1f8f88 : 0xf7f3e9);
    obj.material.emissive.setHex(selected ? 0x0a3937 : 0x000000);
    obj.material.emissiveIntensity = selected ? .35 : 0;
    obj.scale.setScalar(selected ? 1.12 : 1);
  });
}

function renderChips() {
  if (!state.selectedZones.size) {
    selectedChips.innerHTML = '<span class="empty-chip">Aucune zone</span>';
    return;
  }
  selectedChips.innerHTML = [...state.selectedZones.entries()]
    .map(([i, name]) => `<span class="chip">${name.split(" — ")[0]}</span>`).join("");
}
clearBtn.addEventListener("click", () => {
  state.selectedZones.clear();
  updateToothVisuals();
  renderChips();
});

document.querySelectorAll("#symptoms .symptom").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#symptoms .symptom").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.symptom = btn.dataset.value;
  });
});

const intensity = document.getElementById("intensity");
const intensityValue = document.getElementById("intensityValue");
intensity.addEventListener("input", () => {
  state.intensity = intensity.value;
  intensityValue.textContent = `${intensity.value}/10`;
});

document.getElementById("duration").addEventListener("change", e => state.duration = e.target.value);

document.querySelectorAll("#triggers button").forEach(btn => {
  btn.addEventListener("click", () => {
    const value = btn.dataset.value;
    if (state.triggers.has(value)) {
      state.triggers.delete(value); btn.classList.remove("selected");
    } else {
      state.triggers.add(value); btn.classList.add("selected");
    }
  });
});

document.getElementById("notes").addEventListener("input", e => state.notes = e.target.value);

continueBtn.addEventListener("click", () => {
  errorEl.textContent = "";
  if (!state.selectedZones.size) {
    errorEl.textContent = "Veuillez sélectionner au moins une zone sur le modèle 3D.";
    return;
  }
  state.notes = document.getElementById("notes").value.trim();
  showSummary();
});

function showSummary() {
  document.querySelector(".workspace").classList.add("hidden");
  summarySection.classList.remove("hidden");
  document.getElementById("progressText").textContent = "3 / 3";
  document.getElementById("progressBar").style.width = "100%";
  document.querySelectorAll(".steps span")[1].classList.add("active");
  document.querySelectorAll(".steps span")[2].classList.add("active");

  const zones = [...state.selectedZones.values()].map(z => z.split(" — ")[0]).join(", ");
  const symptom = state.symptom || "Non précisé";
  const triggers = state.triggers.size ? [...state.triggers].join(", ") : "Non précisé";
  const duration = state.duration || "Non précisé";
  const notes = state.notes || "Aucune précision";

  summaryContent.innerHTML = `
    <div class="summary-item"><small>Zones</small><strong>${zones}</strong></div>
    <div class="summary-item"><small>Gêne</small><strong>${symptom}</strong></div>
    <div class="summary-item"><small>Intensité</small><strong>${state.intensity}/10</strong></div>
    <div class="summary-item"><small>Durée</small><strong>${duration}</strong></div>
    <div class="summary-item"><small>Déclencheurs</small><strong>${triggers}</strong></div>
    <div class="summary-item wide"><small>Précisions</small><strong>${escapeHtml(notes)}</strong></div>
  `;
  window.scrollTo({top: summarySection.offsetTop - 30, behavior:"smooth"});
}

document.getElementById("editBtn").addEventListener("click", () => {
  summarySection.classList.add("hidden");
  document.querySelector(".workspace").classList.remove("hidden");
  document.getElementById("progressText").textContent = "1 / 3";
  document.getElementById("progressBar").style.width = "33%";
  window.scrollTo({top: document.querySelector(".workspace").offsetTop - 20, behavior:"smooth"});
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function animate() {
  requestAnimationFrame(animate);
  root.rotation.y += .0012;
  renderer.render(scene, camera);
}
animate();
