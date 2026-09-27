const state = {
  selectedZones: new Map(), symptom:"", intensity:5, duration:"", triggers:new Set(), notes:"", activeView:"full", mode:"dentate"
};

const sceneEl=document.getElementById("scene"), selectedChips=document.getElementById("selectedChips"),
  clearBtn=document.getElementById("clearBtn"), continueBtn=document.getElementById("continueBtn"),
  errorEl=document.getElementById("error"), summarySection=document.getElementById("summarySection"),
  summaryContent=document.getElementById("summaryContent");

if(!window.THREE) throw new Error("Three.js n'est pas chargé.");
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(40,1,.1,100); camera.position.set(0,8.8,16.5);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace;
sceneEl.appendChild(renderer.domElement);
const root=new THREE.Group(); scene.add(root);
scene.add(new THREE.HemisphereLight(0xffffff,0xc7d6d3,2));
const key=new THREE.DirectionalLight(0xffffff,2.6); key.position.set(4,10,10); scene.add(key);
const fill=new THREE.DirectionalLight(0xd8efec,1.6); fill.position.set(-8,6,4); scene.add(fill);
const rim=new THREE.DirectionalLight(0xffd9df,.9); rim.position.set(0,2,-9); scene.add(rim);

const M={
  enamel:new THREE.MeshPhysicalMaterial({color:0xf7f2e7,roughness:.28,clearcoat:.28,clearcoatRoughness:.28}),
  enamelSel:new THREE.MeshPhysicalMaterial({color:0x1f8f88,roughness:.25,clearcoat:.35,emissive:0x083f3c,emissiveIntensity:.22}),
  gum:new THREE.MeshPhysicalMaterial({color:0xe4a3a0,roughness:.55,clearcoat:.18}),
  mucosa:new THREE.MeshPhysicalMaterial({color:0xd98d9e,roughness:.62,clearcoat:.10}),
  palate:new THREE.MeshPhysicalMaterial({color:0xecb7bd,roughness:.68,clearcoat:.08}),
  tongue:new THREE.MeshPhysicalMaterial({color:0xc96f84,roughness:.50,clearcoat:.12}),
  tongueSel:new THREE.MeshPhysicalMaterial({color:0x1f8f88,roughness:.43,clearcoat:.16,emissive:0x083f3c,emissiveIntensity:.22}),
  ridge:new THREE.MeshPhysicalMaterial({color:0xe4a3a0,roughness:.58}),
  accent:new THREE.MeshStandardMaterial({color:0xdca4ad,roughness:.75})
};
function mat(type,sel=false){if(sel&&type==="tooth")return M.enamelSel;if(sel&&type==="tongue")return M.tongueSel;return M[type]||M.mucosa;}
function interactive(o,type,name,meta={}){o.userData.interactive=true;o.userData.type=type;o.userData.zoneName=name;Object.assign(o.userData,meta);o.material=mat(type);return o;}

function addTooth(label,x,z,archSide){
  const g=new THREE.Group(); g.position.set(x,archSide==="upper"?.52:-.55,z);
  const n=Number(label.slice(1)); const inc=n<=2||n===1, canine=n===3, prem=n===4||n===5;
  const w=inc?.78:(canine?.88:(prem?.98:1.05));
  const crown=new THREE.Mesh(new THREE.CapsuleGeometry(.43*w,.60*w,6,16),M.enamel);
  crown.scale.set(1,inc?1.18:(canine?1.25:1.05),.86); crown.position.y=.03;
  interactive(crown,"tooth",`Dent ${label}`,{toothLabel:label,arch:archSide,anatomy:"dent"}); g.add(crown);
  const rootMesh=new THREE.Mesh(new THREE.CylinderGeometry(.16*w,.29*w,.65*w,12),M.enamel);
  rootMesh.position.y=-.52*w; rootMesh.scale.z=.72;
  interactive(rootMesh,"tooth",`Dent ${label}`,{toothLabel:label,arch:archSide,anatomy:"dent"}); g.add(rootMesh);
  const cusps=inc?[[0,.39,0]]:canine?[[0,.47,0]]:prem?[[-.18,.37,.06],[.18,.37,.06]]:[[-.20,.36,.06],[.20,.36,.06],[-.16,.29,-.07],[.16,.29,-.07]];
  cusps.forEach(([cx,cy,cz])=>{const c=new THREE.Mesh(new THREE.SphereGeometry(.13*w,14,8),M.enamel);c.position.set(cx,cy,cz);c.scale.y=.45;interactive(c,"tooth",`Dent ${label}`,{toothLabel:label,arch:archSide,anatomy:"dent"});g.add(c);});
  g.userData.arch=archSide; g.userData.toothLabel=label; root.add(g);
}
function buildArch(archSide,zOffset){
  const labels=archSide==="upper"?["18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28"]:["48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38"];
  labels.forEach((label,i)=>{const t=i/15,angle=-Math.PI*.93+Math.PI*1.86*t,r=4.50;addTooth(label,Math.sin(angle)*r,Math.cos(angle)*r*.62+zOffset,archSide);});
}
function addTorus(name,y,z,type,major,minor){const o=new THREE.Mesh(new THREE.TorusGeometry(major,minor,20,132,Math.PI*1.86),M[type]);o.rotation.x=Math.PI/2;o.position.set(0,y,z);interactive(o,type,name,{anatomy:type==="gum"?"gencive":type});root.add(o);}
function addSoft(name,pos,scale,type){const o=new THREE.Mesh(new THREE.SphereGeometry(1,42,28),M[type]);o.position.set(...pos);o.scale.set(...scale);interactive(o,type,name,{anatomy:type});root.add(o);}
function addPalate(){
  const hard=new THREE.Mesh(new THREE.SphereGeometry(1,52,34),M.palate);hard.position.set(0,1.03,.40);hard.scale.set(3.5,.55,3.55);hard.rotation.x=-.10;interactive(hard,"palate","Palais dur",{anatomy:"palais"});root.add(hard);
  for(let i=0;i<6;i++){const rug=new THREE.Mesh(new THREE.TorusGeometry(.78+i*.27,.035,8,36,Math.PI*.75),M.accent);rug.rotation.x=Math.PI/2;rug.position.set(0,1.49,-1.28+i*.36);rug.scale.x=1.48-i*.08;interactive(rug,"palate","Rugae palatines",{anatomy:"palais"});root.add(rug);}
  const soft=new THREE.Mesh(new THREE.SphereGeometry(1,40,24),M.palate);soft.position.set(0,.78,3.38);soft.scale.set(2.25,.40,1.24);interactive(soft,"palate","Voile du palais",{anatomy:"palais"});root.add(soft);
}
function addTongue(){
  const body=new THREE.Mesh(new THREE.SphereGeometry(1,52,34),M.tongue);body.position.set(0,-.88,1.60);body.scale.set(2.25,.73,3.18);body.rotation.x=-.12;interactive(body,"tongue","Langue — face dorsale",{anatomy:"langue"});root.add(body);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(1,46,28),M.tongue);tip.position.set(0,-.80,-1.10);tip.scale.set(1.72,.56,1.90);tip.rotation.x=-.16;interactive(tip,"tongue","Langue — pointe",{anatomy:"langue"});root.add(tip);
}
function addMucosa(){
  addSoft("Muqueuse labiale supérieure",[0,.06,-4.05],[4.8,.82,.52],"mucosa");
  addSoft("Muqueuse labiale inférieure",[0,-.26,-4.02],[4.7,.66,.55],"mucosa");
  addSoft("Muqueuse jugale droite",[4.22,-.03,.65],[.62,1.06,3.10],"mucosa");
  addSoft("Muqueuse jugale gauche",[-4.22,-.03,.65],[.62,1.06,3.10],"mucosa");
  addSoft("Plancher buccal",[0,-1.07,1.03],[3.38,.35,3.54],"mucosa");
  [["droit",4.02],["gauche",-4.02]].forEach(([side,x])=>{const p=new THREE.Mesh(new THREE.SphereGeometry(1,30,22),M.mucosa);p.position.set(x,-.68,3.05);p.scale.set(.64,.48,.98);interactive(p,"mucosa",`Triangle rétromolaire ${side}`,{anatomy:"muqueuse"});root.add(p);});
}
buildArch("upper",0);buildArch("lower",.18);
addTorus("Gencive marginale maxillaire",.38,0,"gum",4.50,.32);
addTorus("Gencive marginale mandibulaire",-.45,.16,"gum",4.46,.32);
addTorus("Crête alvéolaire maxillaire",.24,.06,"ridge",3.86,.63);
addTorus("Crête alvéolaire mandibulaire",-.50,.23,"ridge",3.86,.63);
addPalate();addTongue();addMucosa();

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let dragging=false,lastX=0,lastY=0,dragMoved=false;
const tooltip=document.createElement("div");tooltip.className="zone-tooltip";sceneEl.appendChild(tooltip);
function resize(){const w=sceneEl.clientWidth||600,h=sceneEl.clientHeight||470;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}window.addEventListener("resize",resize);resize();
function hitAt(e){const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(root.children,true).find(h=>h.object.userData.interactive);}
sceneEl.addEventListener("pointerdown",e=>{dragging=true;dragMoved=false;lastX=e.clientX;lastY=e.clientY;});window.addEventListener("pointerup",()=>dragging=false);
window.addEventListener("pointermove",e=>{if(!dragging){const h=hitAt(e);if(h){tooltip.textContent=h.object.userData.zoneName;tooltip.classList.add("visible");}else tooltip.classList.remove("visible");return;}const dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.abs(dx)+Math.abs(dy)>2)dragMoved=true;root.rotation.y+=dx*.0065;root.rotation.x=Math.max(-.5,Math.min(.5,root.rotation.x+dy*.0035));lastX=e.clientX;lastY=e.clientY;});
sceneEl.addEventListener("wheel",e=>{e.preventDefault();camera.position.z=Math.max(9.5,Math.min(21,camera.position.z+e.deltaY*.009));},{passive:false});
function updateSelected(){root.traverse(o=>{if(!o.userData.interactive)return;const k=`${o.userData.type}|${o.userData.zoneName}`;o.material=mat(o.userData.type,state.selectedZones.has(k));});}
sceneEl.addEventListener("click",e=>{if(dragMoved)return;const h=hitAt(e);if(!h)return;const o=h.object,k=`${o.userData.type}|${o.userData.zoneName}`;if(state.selectedZones.has(k))state.selectedZones.delete(k);else state.selectedZones.set(k,{name:o.userData.zoneName,type:o.userData.type,arch:o.userData.arch||null});updateSelected();renderChips();});
function renderChips(){if(!state.selectedZones.size){selectedChips.innerHTML='<span class="empty-chip">Aucune zone</span>';return;}selectedChips.innerHTML=[...state.selectedZones.values()].map(z=>`<span class="chip">${escapeHtml(z.name)}</span>`).join("");}
clearBtn.addEventListener("click",()=>{state.selectedZones.clear();updateSelected();renderChips();});

const prostheticModes={dentate:"Patient denté",ppa:"PPA",pac:"PAC"};
function applyMode(mode){
  state.mode=mode;
  root.traverse(o=>{
    if(!o.userData.interactive) return;
    let visible=true;
    if(mode==="pac" && o.userData.type==="tooth") visible=false;
    if(mode==="ppa" && o.userData.type==="tooth"){
      const n=o.userData.toothLabel||"";
      // Keep a representative set of pillar teeth visible for the prototype.
      visible=["16","14","24","26","36","34","44","46"].includes(n);
    }
    o.visible=visible;
  });
  // In PAC mode, keep soft tissues and edentulous ridges emphasized.
  document.querySelectorAll(".mode-btn").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
}
document.querySelectorAll(".mode-btn").forEach(btn=>btn.addEventListener("click",()=>{applyMode(btn.dataset.mode);}));
document.querySelectorAll(".view-btn").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".view-btn").forEach(b=>b.classList.remove("active"));btn.classList.add("active");state.activeView=btn.dataset.view;
  root.traverse(o=>{
    if(!o.userData.interactive) return;
    let v=true;
    if(state.activeView==="maxilla") v=o.userData.arch==="upper"||["palais","gencive","ridge"].includes(o.userData.anatomy);
    if(state.activeView==="mandible") v=o.userData.arch==="lower"||["langue","muqueuse","gencive","ridge"].includes(o.userData.anatomy);
    if(state.activeView==="soft") v=["muqueuse","palais","langue","gencive","ridge"].includes(o.userData.anatomy);
    if(state.mode==="pac" && o.userData.type==="tooth") v=false;
    if(state.mode==="ppa" && o.userData.type==="tooth") v=["16","14","24","26","36","34","44","46"].includes(o.userData.toothLabel||"");
    o.visible=v;
  });
}));
applyMode(state.mode);

document.querySelectorAll("#symptoms .symptom").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("#symptoms .symptom").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");state.symptom=b.dataset.value;}));
const intensity=document.getElementById("intensity"),intensityValue=document.getElementById("intensityValue");intensity.addEventListener("input",()=>{state.intensity=intensity.value;intensityValue.textContent=`${intensity.value}/10`;});
document.getElementById("duration").addEventListener("change",e=>state.duration=e.target.value);
document.querySelectorAll("#triggers button").forEach(b=>b.addEventListener("click",()=>{const v=b.dataset.value;if(state.triggers.has(v)){state.triggers.delete(v);b.classList.remove("selected")}else{state.triggers.add(v);b.classList.add("selected")}}));
document.getElementById("notes").addEventListener("input",e=>state.notes=e.target.value.trim());
continueBtn.addEventListener("click",()=>{errorEl.textContent="";if(!state.selectedZones.size){errorEl.textContent="Veuillez toucher au moins une zone de la bouche.";return;}showSummary();});
function showSummary(){document.querySelector(".workspace").classList.add("hidden");summarySection.classList.remove("hidden");document.getElementById("progressText").textContent="3 / 3";document.getElementById("progressBar").style.width="100%";document.querySelectorAll(".steps span")[1].classList.add("active");document.querySelectorAll(".steps span")[2].classList.add("active");const zones=[...state.selectedZones.values()].map(z=>z.name).join(", "),symptom=state.symptom||"Non précisé",triggers=state.triggers.size?[...state.triggers].join(", "):"Non précisé",duration=state.duration||"Non précisé",notes=state.notes||"Aucune précision";summaryContent.innerHTML=`<div class="summary-item wide"><small>Localisations sélectionnées</small><strong>${escapeHtml(zones)}</strong></div><div class="summary-item"><small>Gêne</small><strong>${escapeHtml(symptom)}</strong></div><div class="summary-item"><small>Intensité</small><strong>${state.intensity}/10</strong></div><div class="summary-item"><small>Durée</small><strong>${escapeHtml(duration)}</strong></div><div class="summary-item wide"><small>Déclencheurs</small><strong>${escapeHtml(triggers)}</strong></div><div class="summary-item wide"><small>Précisions</small><strong>${escapeHtml(notes)}</strong></div>`;window.scrollTo({top:summarySection.offsetTop-30,behavior:"smooth"});}
document.getElementById("editBtn").addEventListener("click",()=>{summarySection.classList.add("hidden");document.querySelector(".workspace").classList.remove("hidden");document.getElementById("progressText").textContent="1 / 3";document.getElementById("progressBar").style.width="33%";window.scrollTo({top:document.querySelector(".workspace").offsetTop-20,behavior:"smooth"});});
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function animate(){requestAnimationFrame(animate);root.rotation.y+=.00055;renderer.render(scene,camera);}animate();
