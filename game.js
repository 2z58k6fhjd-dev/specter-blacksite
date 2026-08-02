// SPECTER 2.2.1 audited build: static-world collision isolation, LOS fixes, tracer alignment, mobile swap, and completion guard.
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const root = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020504);
scene.fog = new THREE.FogExp2(0x020605, 0.026);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.04, 120);
camera.position.set(0, 1.72, 7);
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.object);

const hemi = new THREE.HemisphereLight(0x466052, 0x080a09, 0.12); scene.add(hemi);
const emergency = new THREE.PointLight(0xff2400, 10, 16, 2); emergency.position.set(0,2.8,-16); scene.add(emergency);
const mainLights = [];
const wallMat = new THREE.MeshStandardMaterial({color:0x38403d,roughness:.9,metalness:.08});
const floorMat = new THREE.MeshStandardMaterial({color:0x202724,roughness:.72,metalness:.18});
const metalMat = new THREE.MeshStandardMaterial({color:0x161c1a,roughness:.48,metalness:.72});
const trimMat = new THREE.MeshStandardMaterial({color:0x0b0f0e,roughness:.55,metalness:.5});

function box(name,x,y,z,w,h,d,mat=wallMat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
function addRoom(){
  box('floor',0,-.15,-12,18,.3,42,floorMat); box('ceiling',0,4.1,-12,18,.25,42,wallMat);
  box('left wall',-9,2,-12,.35,4.2,42,wallMat); box('right wall',9,2,-12,.35,4.2,42,wallMat);
  box('rear wall',0,2,9,18,4.2,.35,wallMat); box('front wall',0,2,-33,18,4.2,.35,wallMat);
  for(let z=6;z>-31;z-=4){ box('beam',0,3.78,z,18,.22,.28,trimMat); box('pipeL',-7.7,3.48,z,1.7,.18,.18,metalMat); }
  // side rooms and cover
  box('partition',-4.8,2,-9,.35,4,12,wallMat); box('partition',4.8,2,-19,.35,4,14,wallMat);
  box('crate',-2.4,.7,-3.5,2.2,1.4,1.6,metalMat); box('crate',3.2,.6,-11,2.4,1.2,1.7,metalMat); box('crate',-2.7,.9,-22,1.8,1.8,1.8,metalMat);
  for (let i=0;i<6;i++){
    const z=4-i*7;
    const fixture=box('light fixture',0,3.78,z,3.3,.10,.5,metalMat);
    const light=new THREE.PointLight(0xc8ffe6,0,12,2); light.position.set(0,3.55,z); light.castShadow=true; light.shadow.mapSize.set(512,512); scene.add(light); mainLights.push(light);
  }
  // exit zone
  const exitMat=new THREE.MeshStandardMaterial({color:0x102b1c,emissive:0x20ff78,emissiveIntensity:.5});
  const exit=box('extraction',0,.06,-31,4,.12,2,exitMat); exit.userData.exit=true;
}
addRoom();

// Power switch
const switchGroup=new THREE.Group(); switchGroup.position.set(-7.9,1.45,5.4); switchGroup.rotation.y=Math.PI/2;
const plate=new THREE.Mesh(new THREE.BoxGeometry(.12,.9,.55),metalMat); plate.castShadow=true; switchGroup.add(plate);
const lever=new THREE.Mesh(new THREE.BoxGeometry(.12,.44,.12),new THREE.MeshStandardMaterial({color:0xd9c8a1,roughness:.45,metalness:.5})); lever.position.set(-.10,.08,0); switchGroup.add(lever);
const indicator=new THREE.Mesh(new THREE.SphereGeometry(.07,12,12),new THREE.MeshStandardMaterial({color:0xff7a00,emissive:0xff4200,emissiveIntensity:3}));indicator.position.set(-.08,-.26,0);switchGroup.add(indicator);
switchGroup.userData.interactive='power';scene.add(switchGroup);

// Only static world geometry participates in player collision, AI sight checks, and bullet-world hits.
// Capturing it here prevents the camera-mounted weapon and enemy meshes from blocking movement or line of sight.
const collisionMeshes=[];
scene.traverse(o=>{
  if(o.isMesh && !o.userData.enemy && !o.userData.exit && !['floor','ceiling','beam','pipeL','light fixture'].includes(o.name)) collisionMeshes.push(o);
});

// Player flashlight
const flashlight=new THREE.SpotLight(0xe8fff3,85,24,Math.PI/7,.42,1.4); flashlight.position.set(.18,-.10,-.12); flashlight.target.position.set(0,0,-8); flashlight.castShadow=true; flashlight.shadow.mapSize.set(1024,1024); camera.add(flashlight); camera.add(flashlight.target);

// Detailed first-person weapons
const weaponRoot=new THREE.Group(); camera.add(weaponRoot);
const gunDark=new THREE.MeshStandardMaterial({color:0x111413,roughness:.28,metalness:.88});
const gunPoly=new THREE.MeshStandardMaterial({color:0x2d332f,roughness:.58,metalness:.35});
const gunRubber=new THREE.MeshStandardMaterial({color:0x080a09,roughness:.92,metalness:.05});
function part(g,w,h,d,x,y,z,mat=gunDark){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m}
function cyl(g,r,l,x,y,z,rotX=Math.PI/2,mat=gunDark,segments=18){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,segments),mat);m.rotation.x=rotX;m.position.set(x,y,z);m.castShadow=true;g.add(m);return m}

const rifle=new THREE.Group(); weaponRoot.add(rifle);
part(rifle,.20,.18,.68,0,0,0);                         // receiver
part(rifle,.16,.15,.82,0,.015,-.73);                   // handguard
for(let i=0;i<7;i++) part(rifle,.175,.018,.055,0,.105,-.48-i*.105,gunPoly); // top rail
cyl(rifle,.047,.48,0,.01,-1.37,Math.PI/2,gunDark,20);   // barrel
cyl(rifle,.068,.28,0,.01,-1.72,Math.PI/2,gunDark,20);   // suppressor
part(rifle,.15,.18,.34,0,-.18,-.18,gunPoly).rotation.x=-.25; // mag
part(rifle,.11,.34,.20,0,-.26,.20,gunRubber).rotation.x=-.22; // grip
part(rifle,.18,.12,.45,0,.01,.53,gunPoly);              // buffer/stock stem
part(rifle,.25,.28,.34,0,-.02,.86,gunRubber);           // stock
part(rifle,.11,.09,.30,.11,-.04,-.82,gunPoly);          // flashlight body
cyl(rifle,.065,.30,.11,-.04,-.82,Math.PI/2,gunPoly,16);
// LPVO body with open glass
cyl(rifle,.105,.48,0,.22,-.34,Math.PI/2,gunDark,24);
const scopeRear=new THREE.Mesh(new THREE.TorusGeometry(.085,.012,10,28),gunDark);scopeRear.position.set(0,.22,-.095);scopeRear.rotation.x=Math.PI/2;rifle.add(scopeRear);
const scopeFront=new THREE.Mesh(new THREE.TorusGeometry(.088,.012,10,28),gunDark);scopeFront.position.set(0,.22,-.585);scopeFront.rotation.x=Math.PI/2;rifle.add(scopeFront);
const glassMat=new THREE.MeshPhysicalMaterial({color:0x7fcab0,transparent:true,opacity:.16,roughness:.02,metalness:0,transmission:.78,thickness:.015,side:THREE.DoubleSide,depthWrite:false});
const glass=new THREE.Mesh(new THREE.CircleGeometry(.078,28),glassMat);glass.position.set(0,.22,-.59);rifle.add(glass);
const dotMat=new THREE.MeshBasicMaterial({color:0xff3c2e,transparent:true,opacity:.85,depthTest:false});
const dot=new THREE.Mesh(new THREE.CircleGeometry(.005,12),dotMat);dot.position.set(0,.22,-.596);rifle.add(dot);

const pistol=new THREE.Group(); weaponRoot.add(pistol); pistol.visible=false;
part(pistol,.18,.15,.52,0,.02,-.12);                    // slide
part(pistol,.15,.12,.40,0,-.08,-.05,gunPoly);           // frame
part(pistol,.14,.42,.20,0,-.28,.10,gunRubber).rotation.x=-.15;
cyl(pistol,.035,.46,0,.01,-.17,Math.PI/2,gunDark,16);
part(pistol,.055,.055,.08,0,.125,-.31,gunPoly);          // front sight
part(pistol,.09,.055,.05,0,.125,.12,gunPoly);            // rear sight

weaponRoot.position.set(.38,-.34,-.72); weaponRoot.rotation.set(-.05,-.08,0);
const muzzleFlash=new THREE.Group(); weaponRoot.add(muzzleFlash); muzzleFlash.visible=false;
const flashMat=new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending});
const flashA=new THREE.Mesh(new THREE.ConeGeometry(.10,.42,8),flashMat);flashA.rotation.x=-Math.PI/2;muzzleFlash.add(flashA);
const flashB=new THREE.Mesh(new THREE.SphereGeometry(.10,8,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));muzzleFlash.add(flashB);
const muzzleLight=new THREE.PointLight(0xffa54a,0,5,2);muzzleFlash.add(muzzleLight);
let currentWeapon='rifle';
function placeMuzzle(){ if(currentWeapon==='rifle') muzzleFlash.position.set(0,.01,-1.93); else muzzleFlash.position.set(0,.02,-.42); }
placeMuzzle();

const impactMat=new THREE.MeshBasicMaterial({color:0x171717,transparent:true,opacity:.92,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4});
const impacts=[];
function spawnImpact(hit){
  const mark=new THREE.Mesh(new THREE.CircleGeometry(.045,12),impactMat.clone());
  const worldNormal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
  mark.position.copy(hit.point).addScaledVector(worldNormal,.006);
  mark.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),worldNormal);
  scene.add(mark); impacts.push({mesh:mark,born:performance.now()});
  if(impacts.length>80){const old=impacts.shift();scene.remove(old.mesh)}
  const sparkGeo=new THREE.BufferGeometry().setFromPoints([hit.point,hit.point.clone().add(new THREE.Vector3((Math.random()-.5)*.2,Math.random()*.18,(Math.random()-.5)*.2))]);
  const spark=new THREE.Line(sparkGeo,new THREE.LineBasicMaterial({color:0xffc46b,transparent:true,opacity:1}));scene.add(spark);setTimeout(()=>scene.remove(spark),90);
}
const enemies=[];
const AI={
  alertLevel:0,
  lastKnownPlayer:new THREE.Vector3(),
  globalAlertUntil:0,
  reinforcementsCalled:false,
  reinforcementsArrived:false,
  nextId:1,
  soundEvents:[],
  radioCooldown:0,
  totalHostiles:3
};
const patrolRoutes=[
  [new THREE.Vector3(-2.5,0,-8),new THREE.Vector3(2.8,0,-8),new THREE.Vector3(2.8,0,-13),new THREE.Vector3(-2.2,0,-13)],
  [new THREE.Vector3(2.9,0,-18),new THREE.Vector3(-2.7,0,-18),new THREE.Vector3(-2.7,0,-23),new THREE.Vector3(3.2,0,-23)],
  [new THREE.Vector3(-1.2,0,-27),new THREE.Vector3(3.0,0,-27),new THREE.Vector3(3.0,0,-30),new THREE.Vector3(-3.1,0,-30)]
];
const coverPoints=[
  new THREE.Vector3(-3.8,0,-4.2),new THREE.Vector3(-1.2,0,-4.2),
  new THREE.Vector3(2.0,0,-10.8),new THREE.Vector3(4.2,0,-11.2),
  new THREE.Vector3(-3.8,0,-21.8),new THREE.Vector3(-1.6,0,-23.0),
  new THREE.Vector3(4.0,0,-18.5),new THREE.Vector3(4.0,0,-25.0)
];
function radio(text,enemy=null){
  const now=performance.now();
  if(now<AI.radioCooldown)return;
  AI.radioCooldown=now+900;
  const prefix=enemy?`VOLK ${enemy.userData.id}`:'VOLK';
  toast(`${prefix}: ${text}`);
}
function emitSound(position,radius,type='generic'){
  AI.soundEvents.push({position:position.clone(),radius,type,time:performance.now()});
  if(AI.soundEvents.length>12)AI.soundEvents.shift();
}
function createEnemy(x,z,heavy=false,personality='cautious',routeIndex=0){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  g.userData={
    id:AI.nextId++,health:heavy?170:100,dead:false,phase:Math.random()*6,heavy,
    personality,state:'patrol',route:patrolRoutes[routeIndex%patrolRoutes.length],routeIndex:0,
    target:null,lastSeen:new THREE.Vector3(x,0,z),lastHeard:new THREE.Vector3(x,0,z),
    suspicion:0,stateTime:0,fireCooldown:Math.random()*.6,burstLeft:0,burstGap:0,
    searchAngle:Math.random()*Math.PI*2,cover:null,flankSide:Math.random()<.5?-1:1,
    callTimer:0,hasCalled:false,home:new THREE.Vector3(x,0,z),speed:heavy?.72:.95
  };
  const black=new THREE.MeshStandardMaterial({color:heavy?0x111514:0x171b19,roughness:.72,metalness:.22});
  const armor=new THREE.MeshStandardMaterial({color:0x090b0a,roughness:.48,metalness:.42});
  const skin=new THREE.MeshStandardMaterial({color:0x7b5542,roughness:.8});
  const legs=new THREE.Mesh(new THREE.BoxGeometry(.55,.95,.32),black);legs.position.y=.52;g.add(legs);
  const torso=new THREE.Mesh(new THREE.BoxGeometry(heavy?.82:.68,.82,.38),black);torso.position.y=1.37;g.add(torso);
  const vest=new THREE.Mesh(new THREE.BoxGeometry(heavy?.86:.72,.57,.14),armor);vest.position.set(0,1.39,-.25);g.add(vest);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.22,16,12),skin);head.position.y=1.98;g.add(head);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.25,16,10,0,Math.PI*2,0,Math.PI*.62),armor);helmet.position.y=2.04;g.add(helmet);
  const mask=new THREE.Mesh(new THREE.BoxGeometry(.31,.17,.09),armor);mask.position.set(0,1.92,-.20);g.add(mask);
  const rifleMesh=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.9),gunDark);rifleMesh.position.set(.20,1.35,-.46);rifleMesh.rotation.z=-.15;g.add(rifleMesh);
  const statusLamp=new THREE.PointLight(0xff3000,0,.7,2);statusLamp.position.set(.2,1.4,-.8);g.add(statusLamp);g.userData.muzzle=statusLamp;
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.enemy=g}});
  scene.add(g); enemies.push(g); return g;
}
createEnemy(-2.5,-8,false,'cautious',0);
createEnemy(2.9,-18,false,'aggressive',1);
createEnemy(-1.2,-27,true,'defensive',2);

const keys={}; let started=false,powerOn=false,flashOn=true,aiming=false,reloading=false,reloadStart=0,ammo=30,reserve=120,pistolAmmo=15,pistolReserve=60,hp=100,armor=50,kills=0,lastShot=0,flashUntil=0,missionComplete=false;
const raycaster=new THREE.Raycaster(); const clock=new THREE.Clock();
const prompt=document.getElementById('prompt'), msg=document.getElementById('message');
function toast(t){msg.textContent=t;msg.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>msg.style.opacity=0,1700)}
function updateHud(){document.getElementById('hp').textContent=Math.max(0,Math.round(hp));document.getElementById('armor').textContent=Math.max(0,Math.round(armor));document.getElementById('weaponName').textContent=currentWeapon==='rifle'?'HK416':'M9A4';document.getElementById('ammo').textContent=currentWeapon==='rifle'?`${ammo}/${reserve}`:`${pistolAmmo}/${pistolReserve}`;document.getElementById('secure').textContent=`${kills}/${AI.totalHostiles}`;document.getElementById('lightState').textContent=flashOn?'ON':'OFF';document.getElementById('powerState').textContent=powerOn?'ONLINE':'OFFLINE'}
function togglePower(){if(powerOn)return;powerOn=true;mainLights.forEach((l,i)=>setTimeout(()=>l.intensity=18,120*i));emergency.intensity=1;indicator.material.color.set(0x2dff81);indicator.material.emissive.set(0x00ff55);lever.rotation.z=-.65;document.getElementById('objective').textContent='OBJECTIVE: ELIMINATE VOLK TEAM';emitSound(controls.object.position,18,'power');toast('FACILITY POWER RESTORED');updateHud()}
function interact(){raycaster.setFromCamera(new THREE.Vector2(0,0),camera);const hit=raycaster.intersectObject(switchGroup,true)[0];if(hit&&hit.distance<2.6)togglePower()}
function shoot(){
  const now=performance.now(); const delay=currentWeapon==='rifle'?105:230;
  if(!started||reloading||now-lastShot<delay)return;
  const activeAmmo=currentWeapon==='rifle'?ammo:pistolAmmo;
  if(activeAmmo<=0){reload();return}
  lastShot=now;if(currentWeapon==='rifle')ammo--;else pistolAmmo--;emitSound(controls.object.position,currentWeapon==='rifle'?24:17,'gunshot');AI.alertLevel=Math.max(AI.alertLevel,1);
  weaponRoot.position.z+=currentWeapon==='rifle'?.07:.035;camera.rotation.x+=currentWeapon==='rifle'?.010:.006;
  muzzleFlash.visible=true;muzzleLight.intensity=9;flashUntil=now+55;placeMuzzle();
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const allTargets=[...enemies,...collisionMeshes];const hits=raycaster.intersectObjects(allTargets,true);
  if(hits.length){const hit=hits[0],obj=hit.object,enemy=obj.userData.enemy;
    if(enemy&&!enemy.userData.dead){enemy.userData.state='combat';enemy.userData.lastSeen.copy(controls.object.position);enemy.userData.suspicion=1;enemy.userData.health-=obj.geometry.type==='SphereGeometry'?(currentWeapon==='rifle'?72:55):(currentWeapon==='rifle'?35:28);spawnImpact(hit);
      if(enemy.userData.health<=0){enemy.userData.dead=true;kills++;enemy.rotation.z=Math.PI/2;enemy.position.y=.30;enemy.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({color:0x111211,roughness:.9})});toast('HOSTILE NEUTRALIZED');if(kills===AI.totalHostiles&&AI.reinforcementsArrived){document.getElementById('objective').textContent='OBJECTIVE: REACH EXTRACTION';toast('AREA SECURE — EXTRACT')}}
    }else spawnImpact(hit);
  }
  updateHud();
}
function reload(){
  const cap=currentWeapon==='rifle'?30:15,cur=currentWeapon==='rifle'?ammo:pistolAmmo,res=currentWeapon==='rifle'?reserve:pistolReserve;
  if(reloading||cur===cap||res<=0)return;reloading=true;reloadStart=performance.now();toast('RELOADING');
  setTimeout(()=>{const c=currentWeapon==='rifle'?ammo:pistolAmmo,r=currentWeapon==='rifle'?reserve:pistolReserve,take=Math.min(cap-c,r);if(currentWeapon==='rifle'){ammo+=take;reserve-=take}else{pistolAmmo+=take;pistolReserve-=take}reloading=false;updateHud()},currentWeapon==='rifle'?1450:1100);
}
function switchWeapon(type){if(reloading)return;currentWeapon=type;rifle.visible=type==='rifle';pistol.visible=type==='pistol';placeMuzzle();toast(type==='rifle'?'HK416 READY':'M9A4 READY');updateHud()}
function damagePlayer(amount){let left=amount;if(armor>0){const absorb=Math.min(armor,left*.65);armor-=absorb;left-=absorb}hp-=left;document.getElementById('damage').style.opacity=.7;setTimeout(()=>document.getElementById('damage').style.opacity=0,120);if(hp<=0){hp=0;toast('MISSION FAILED');setTimeout(()=>location.reload(),1800)}updateHud()}

addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE')interact();if(e.code==='KeyF'){flashOn=!flashOn;flashlight.visible=flashOn;updateHud()}if(e.code==='KeyR')reload();if(e.code==='Digit1')switchWeapon('rifle');if(e.code==='Digit2')switchWeapon('pistol')});addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('mousedown',e=>{if(e.button===0)shoot();if(e.button===2)aiming=true});addEventListener('mouseup',e=>{if(e.button===2)aiming=false});addEventListener('blur',()=>{aiming=false});addEventListener('contextmenu',e=>e.preventDefault());
document.getElementById('startButton').onclick=()=>{started=true;document.getElementById('startPanel').style.display='none';if(matchMedia('(pointer:fine)').matches)controls.lock();};
renderer.domElement.addEventListener('click',()=>{if(started&&matchMedia('(pointer:fine)').matches&&!controls.isLocked)controls.lock()});

// Mobile controls
let moveVec={x:0,y:0},lookVec={x:0,y:0};
function bindPad(id,target){const el=document.getElementById(id),stick=el.querySelector('.stick');let active=null,start={x:0,y:0};el.addEventListener('pointerdown',e=>{active=e.pointerId;start={x:e.clientX,y:e.clientY};el.setPointerCapture(active)});el.addEventListener('pointermove',e=>{if(e.pointerId!==active)return;let dx=e.clientX-start.x,dy=e.clientY-start.y;const len=Math.hypot(dx,dy),max=38;if(len>max){dx*=max/len;dy*=max/len}stick.style.transform=`translate(${dx}px,${dy}px)`;target.x=dx/max;target.y=dy/max});const end=e=>{if(e.pointerId!==active)return;active=null;target.x=target.y=0;stick.style.transform=''};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end)}
bindPad('movePad',moveVec);bindPad('lookPad',lookVec);
document.querySelectorAll('#mobileControls button').forEach(b=>{const a=b.dataset.action;b.addEventListener('pointerdown',e=>{e.preventDefault();if(a==='fire')shoot();if(a==='use')interact();if(a==='reload')reload();if(a==='flashlight'){flashOn=!flashOn;flashlight.visible=flashOn;updateHud()}if(a==='swap')switchWeapon(currentWeapon==='rifle'?'pistol':'rifle');if(a==='aim')aiming=true});const release=()=>{if(a==='aim')aiming=false};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release)});

function canMove(next){const p=new THREE.Vector3(next.x,1,next.z);if(Math.abs(p.x)>8.45||p.z>8.3||p.z<-32.4)return false;for(const m of collisionMeshes){if(['floor','ceiling','beam','pipeL','light fixture'].includes(m.name))continue;const b=new THREE.Box3().setFromObject(m).expandByScalar(.30);if(b.containsPoint(p))return false}return true}
function updateMovement(dt){let f=(keys.KeyW?1:0)-(keys.KeyS?1:0)-moveVec.y;let s=(keys.KeyD?1:0)-(keys.KeyA?1:0)+moveVec.x;const v=new THREE.Vector3(s,0,-f);if(v.lengthSq()>1)v.normalize();v.applyAxisAngle(new THREE.Vector3(0,1,0),camera.rotation.y);const speed=(keys.ShiftLeft?6.2:3.7)*dt;const next=controls.object.position.clone().addScaledVector(v,speed);if(canMove(next))controls.object.position.copy(next);if(Math.abs(lookVec.x)+Math.abs(lookVec.y)>.01){controls.object.rotation.y-=lookVec.x*dt*2.2;camera.rotation.x=Math.max(-1.3,Math.min(1.3,camera.rotation.x-lookVec.y*dt*1.8))}}
function hasLineOfSight(from,to){
  const direction=to.clone().sub(from);const distance=direction.length();
  if(distance<.01)return true;direction.normalize();
  raycaster.set(from,direction);raycaster.far=distance;
  const hit=raycaster.intersectObjects(collisionMeshes,true)[0];
  raycaster.far=Infinity;return !hit||hit.distance>distance-.25;
}
function setEnemyState(e,state,target=null){
  if(e.userData.state===state&&(!target||e.userData.target?.distanceToSquared(target)<.05))return;
  e.userData.state=state;e.userData.stateTime=0;e.userData.target=target?target.clone():null;
  if(state==='combat')AI.alertLevel=2;
}
function moveEnemyToward(e,target,dt,mult=1){
  if(!target)return false;const delta=target.clone().sub(e.position);delta.y=0;const dist=delta.length();
  if(dist<.22)return true;delta.normalize();
  const next=e.position.clone().addScaledVector(delta,e.userData.speed*mult*dt);
  if(canMove(next)){e.position.copy(next);return false}
  const side=new THREE.Vector3(-delta.z,0,delta.x).multiplyScalar(e.userData.flankSide*.8);
  const alternate=e.position.clone().addScaledVector(side,e.userData.speed*dt);
  if(canMove(alternate))e.position.copy(alternate);else e.userData.flankSide*=-1;
  return false;
}
function chooseCover(e,playerPos){
  let best=null,bestScore=Infinity;
  for(const c of coverPoints){const travel=e.position.distanceTo(c);if(travel>10)continue;
    const hidden=!hasLineOfSight(c.clone().add(new THREE.Vector3(0,1.25,0)),playerPos.clone().add(new THREE.Vector3(0,1.35,0)));
    const score=travel+(hidden?-4:3)+Math.abs(c.distanceTo(playerPos)-7)*.15;
    if(score<bestScore){bestScore=score;best=c}}
  return best?best.clone():null;
}
function chooseFlank(e,playerPos){
  const toPlayer=playerPos.clone().sub(e.position);toPlayer.y=0;toPlayer.normalize();
  const side=new THREE.Vector3(-toPlayer.z,0,toPlayer.x).multiplyScalar(e.userData.flankSide*(e.userData.heavy?2.2:3.6));
  const behind=playerPos.clone().addScaledVector(toPlayer,-3.2).add(side);behind.y=0;
  if(canMove(behind))return behind;
  e.userData.flankSide*=-1;return playerPos.clone().add(side.multiplyScalar(-1));
}
function spawnEnemyTracer(e,playerPos){
  const from=e.localToWorld(new THREE.Vector3(.18,1.38,-.72));const to=playerPos.clone().add(new THREE.Vector3((Math.random()-.5)*.35,1.35+(Math.random()-.5)*.25,(Math.random()-.5)*.35));
  const geometry=new THREE.BufferGeometry().setFromPoints([from,to]);
  const tracer=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0xffaa55,transparent:true,opacity:.75}));scene.add(tracer);setTimeout(()=>scene.remove(tracer),55);
  e.userData.muzzle.intensity=5;setTimeout(()=>{if(e.userData.muzzle)e.userData.muzzle.intensity=0},45);
}
function enemyFire(e,playerPos,dist){
  if(e.userData.fireCooldown>0)return;
  if(e.userData.burstLeft<=0){e.userData.burstLeft=e.userData.heavy?4:2+Math.floor(Math.random()*2);e.userData.burstGap=e.userData.heavy?.11:.16}
  e.userData.fireCooldown=e.userData.burstGap;e.userData.burstLeft--;
  spawnEnemyTracer(e,playerPos);
  const base=e.userData.heavy?.55:.44;const movementPenalty=(keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD)?.10:0;
  const chance=Math.max(.12,base-dist*.025-movementPenalty+(e.userData.personality==='aggressive'?.08:0));
  if(Math.random()<chance)damagePlayer(e.userData.heavy?10:7);
  if(e.userData.burstLeft===0)e.userData.fireCooldown=e.userData.heavy?.75:1.0+Math.random()*.5;
}
function alertNearby(source,position,radius=14){
  for(const other of enemies){if(other===source||other.userData.dead)continue;if(other.position.distanceTo(position)<radius){other.userData.lastHeard.copy(position);other.userData.suspicion=Math.max(other.userData.suspicion,.72);if(other.userData.state==='patrol')setEnemyState(other,'investigate',position)}}
}
function callReinforcements(e){
  if(AI.reinforcementsCalled||e.userData.dead)return;
  AI.reinforcementsCalled=true;e.userData.hasCalled=true;radio('CONTACT! REQUESTING BACKUP!',e);
  setTimeout(()=>{
    if(AI.reinforcementsArrived)return;
    AI.reinforcementsArrived=true;AI.totalHostiles+=2;
    createEnemy(6.7,-29,false,'aggressive',2);createEnemy(-6.7,-29,false,'cautious',2);
    radio('REINFORCEMENTS ENTERING SOUTH CORRIDOR');updateHud();
  },4200);
}
function updateEnemies(dt,t){
  const now=performance.now();const playerPos=controls.object.position.clone();
  AI.soundEvents=AI.soundEvents.filter(s=>now-s.time<2600);AI.radioCooldown=Math.max(0,AI.radioCooldown);
  for(const e of enemies){
    if(e.userData.dead)continue;const u=e.userData;u.stateTime+=dt;u.fireCooldown=Math.max(0,u.fireCooldown-dt);u.callTimer=Math.max(0,u.callTimer-dt);
    const eye=e.position.clone().add(new THREE.Vector3(0,1.65,0));const playerEye=playerPos.clone().add(new THREE.Vector3(0,.05,0));
    const toPlayer=playerPos.clone().sub(e.position);const dist=toPlayer.length();const forward=new THREE.Vector3(0,0,-1).applyQuaternion(e.quaternion);const planar=toPlayer.clone();planar.y=0;planar.normalize();
    const fov=u.state==='combat'?Math.cos(THREE.MathUtils.degToRad(82)):Math.cos(THREE.MathUtils.degToRad(55));
    const visible=dist<(powerOn?18:flashOn?12:7)&&forward.dot(planar)>fov&&hasLineOfSight(eye,playerEye);
    const flashlightSeen=flashOn&&dist<16&&hasLineOfSight(playerEye,eye)&&new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).dot(e.position.clone().sub(playerPos).normalize())>.94;
    let heard=null;for(const sound of AI.soundEvents){if(e.position.distanceTo(sound.position)<sound.radius){heard=sound;break}}
    if(visible||flashlightSeen){u.lastSeen.copy(playerPos);u.suspicion=Math.min(1,u.suspicion+dt*(flashlightSeen?1.8:2.8));AI.lastKnownPlayer.copy(playerPos);AI.globalAlertUntil=now+9000;if(u.suspicion>.35&&u.state!=='combat'){setEnemyState(e,'combat',playerPos);radio(flashlightSeen?'FLASHLIGHT! CONTACT!':'CONTACT FRONT!',e);alertNearby(e,playerPos,17)}}
    else u.suspicion=Math.max(0,u.suspicion-dt*.08);
    if(heard&&u.state!=='combat'){u.lastHeard.copy(heard.position);u.suspicion=Math.max(u.suspicion,heard.type==='gunshot'?.9:.55);setEnemyState(e,'investigate',heard.position);if(heard.type==='gunshot')radio('GUNSHOTS — INVESTIGATING',e)}
    if(u.state==='patrol'){
      const target=u.route[u.routeIndex%u.route.length];if(moveEnemyToward(e,target,dt,.55)){u.routeIndex=(u.routeIndex+1)%u.route.length;u.stateTime=0}
      if(u.stateTime>4&&Math.random()<dt*.3){u.routeIndex=(u.routeIndex+1)%u.route.length;u.stateTime=0}
    }else if(u.state==='investigate'){
      if(moveEnemyToward(e,u.target||u.lastHeard,dt,.72)){setEnemyState(e,'search',u.target||u.lastHeard);u.searchAngle=Math.random()*Math.PI*2}
      if(u.stateTime>8)setEnemyState(e,'patrol');
    }else if(u.state==='search'){
      e.rotation.y+=dt*.55*u.flankSide;
      if(u.stateTime>5){const offset=new THREE.Vector3(Math.cos(u.searchAngle)*2.3,0,Math.sin(u.searchAngle)*2.3);u.searchAngle+=2.1;setEnemyState(e,'investigate',u.lastSeen.clone().add(offset))}
    }else if(u.state==='combat'){
      if(!u.hasCalled&&!AI.reinforcementsCalled&&u.stateTime>2.5)callReinforcements(e);
      const hasShot=visible&&hasLineOfSight(eye,playerEye);
      if(!visible&&now>AI.globalAlertUntil){setEnemyState(e,'search',u.lastSeen);radio('LOST VISUAL — SEARCHING',e);continue}
      if(u.personality==='defensive'){
        if(!u.cover)u.cover=chooseCover(e,playerPos);
        if(u.cover&&!moveEnemyToward(e,u.cover,dt,.68)){/* moving to cover */}else if(hasShot)enemyFire(e,playerPos,dist);
      }else if(u.personality==='aggressive'){
        if(dist>5.2)moveEnemyToward(e,playerPos,dt,1.05);else if(dist<2.8)moveEnemyToward(e,e.position.clone().add(e.position.clone().sub(playerPos).normalize().multiplyScalar(2)),dt,.9);
        if(hasShot)enemyFire(e,playerPos,dist);
      }else{
        if(u.stateTime>3.5&&(!u.target||u.target.distanceTo(playerPos)<1)){u.target=chooseFlank(e,playerPos);u.stateTime=0}
        if(u.target&&e.position.distanceTo(u.target)>.5)moveEnemyToward(e,u.target,dt,.9);else if(hasShot)enemyFire(e,playerPos,dist);
      }
    }
    const faceTarget=(u.state==='combat'?playerPos:u.target)||u.route[u.routeIndex%u.route.length];if(faceTarget){const d=faceTarget.clone().sub(e.position);e.rotation.y=Math.atan2(d.x,d.z)+Math.PI}
    e.position.y=Math.sin(t*2+u.phase)*.015;
  }
  if(!AI.reinforcementsCalled&&kills===AI.totalHostiles){AI.reinforcementsArrived=true;document.getElementById('objective').textContent='OBJECTIVE: REACH EXTRACTION';toast('AREA SECURE — EXTRACT')}
}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;if(started){updateMovement(dt);updateEnemies(dt,t);const hip=currentWeapon==='rifle'?new THREE.Vector3(.38,-.34,-.72):new THREE.Vector3(.34,-.31,-.61);const ads=currentWeapon==='rifle'?new THREE.Vector3(0,-.22,-.52):new THREE.Vector3(0,-.205,-.47);const target=aiming?ads:hip;weaponRoot.position.lerp(target,1-Math.pow(.001,dt));weaponRoot.position.x+=Math.sin(t*1.6)*.0015;weaponRoot.position.y+=Math.sin(t*3.2)*.001;weaponRoot.rotation.x+=(0-weaponRoot.rotation.x)*dt*8;weaponRoot.position.z+=(target.z-weaponRoot.position.z)*dt*9;if(reloading){const rp=Math.min(1,(performance.now()-reloadStart)/(currentWeapon==='rifle'?1450:1100));weaponRoot.rotation.z=Math.sin(rp*Math.PI)*.95;weaponRoot.rotation.x=Math.sin(rp*Math.PI)*.55;weaponRoot.position.y-=Math.sin(rp*Math.PI)*.20;}else weaponRoot.rotation.z*=Math.max(0,1-dt*12);if(performance.now()>flashUntil){muzzleFlash.visible=false;muzzleLight.intensity=0}else{muzzleFlash.rotation.z=Math.random()*Math.PI;muzzleFlash.scale.setScalar(.75+Math.random()*.5)}raycaster.setFromCamera(new THREE.Vector2(0,0),camera);const h=raycaster.intersectObject(switchGroup,true)[0];prompt.textContent=h&&h.distance<2.6&&!powerOn?'PRESS E / USE — RESTORE POWER':'';if(!missionComplete&&kills===AI.totalHostiles&&controls.object.position.z<-29.5&&Math.abs(controls.object.position.x)<2.4){missionComplete=true;toast('MISSION COMPLETE');document.getElementById('objective').textContent='BLACKSITE SECURED';}}
renderer.render(scene,camera)}animate();updateHud();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
