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
  mark.position.copy(hit.point).addScaledVector(hit.face.normal,.006);
  mark.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),hit.face.normal.clone().transformDirection(hit.object.matrixWorld));
  scene.add(mark); impacts.push({mesh:mark,born:performance.now()});
  if(impacts.length>80){const old=impacts.shift();scene.remove(old.mesh)}
  const sparkGeo=new THREE.BufferGeometry().setFromPoints([hit.point,hit.point.clone().add(new THREE.Vector3((Math.random()-.5)*.2,Math.random()*.18,(Math.random()-.5)*.2))]);
  const spark=new THREE.Line(sparkGeo,new THREE.LineBasicMaterial({color:0xffc46b,transparent:true,opacity:1}));scene.add(spark);setTimeout(()=>scene.remove(spark),90);
}
const enemies=[];
function createEnemy(x,z,heavy=false){
  const g=new THREE.Group(); g.position.set(x,0,z); g.userData={health:heavy?170:100,dead:false,phase:Math.random()*6,heavy};
  const black=new THREE.MeshStandardMaterial({color:heavy?0x111514:0x171b19,roughness:.72,metalness:.22});
  const armor=new THREE.MeshStandardMaterial({color:0x090b0a,roughness:.48,metalness:.42});
  const skin=new THREE.MeshStandardMaterial({color:0x7b5542,roughness:.8});
  const legs=new THREE.Mesh(new THREE.BoxGeometry(.55,.95,.32),black);legs.position.y=.52;g.add(legs);
  const torso=new THREE.Mesh(new THREE.BoxGeometry(heavy?.82:.68,.82,.38),black);torso.position.y=1.37;g.add(torso);
  const vest=new THREE.Mesh(new THREE.BoxGeometry(heavy?.86:.72,.57,.14),armor);vest.position.set(0,1.39,-.25);g.add(vest);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.22,16,12),skin);head.position.y=1.98;g.add(head);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.25,16,10,0,Math.PI*2,0,Math.PI*.62),armor);helmet.position.y=2.04;g.add(helmet);
  const mask=new THREE.Mesh(new THREE.BoxGeometry(.31,.17,.09),armor);mask.position.set(0,1.92,-.20);g.add(mask);
  const rifle=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.9),gunDark);rifle.position.set(.20,1.35,-.46);rifle.rotation.z=-.15;g.add(rifle);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.enemy=g}}); scene.add(g); enemies.push(g); return g;
}
createEnemy(-2.5,-8); createEnemy(2.9,-18); createEnemy(-1.2,-27,true);

const collisionMeshes=[];scene.traverse(o=>{if(o.isMesh && !o.userData.enemy && !o.userData.exit) collisionMeshes.push(o)});
const keys={}; let started=false,powerOn=false,flashOn=true,aiming=false,reloading=false,reloadStart=0,ammo=30,reserve=120,pistolAmmo=15,pistolReserve=60,hp=100,armor=50,kills=0,lastShot=0,flashUntil=0;
const raycaster=new THREE.Raycaster(); const clock=new THREE.Clock();
const prompt=document.getElementById('prompt'), msg=document.getElementById('message');
function toast(t){msg.textContent=t;msg.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>msg.style.opacity=0,1700)}
function updateHud(){document.getElementById('hp').textContent=Math.max(0,Math.round(hp));document.getElementById('armor').textContent=Math.max(0,Math.round(armor));document.getElementById('weaponName').textContent=currentWeapon==='rifle'?'HK416':'M9A4';document.getElementById('ammo').textContent=currentWeapon==='rifle'?`${ammo}/${reserve}`:`${pistolAmmo}/${pistolReserve}`;document.getElementById('secure').textContent=`${kills}/3`;document.getElementById('lightState').textContent=flashOn?'ON':'OFF';document.getElementById('powerState').textContent=powerOn?'ONLINE':'OFFLINE'}
function togglePower(){if(powerOn)return;powerOn=true;mainLights.forEach((l,i)=>setTimeout(()=>l.intensity=18,120*i));emergency.intensity=1;indicator.material.color.set(0x2dff81);indicator.material.emissive.set(0x00ff55);lever.rotation.z=-.65;document.getElementById('objective').textContent='OBJECTIVE: ELIMINATE VOLK TEAM';toast('FACILITY POWER RESTORED');updateHud()}
function interact(){raycaster.setFromCamera(new THREE.Vector2(0,0),camera);const hit=raycaster.intersectObject(switchGroup,true)[0];if(hit&&hit.distance<2.6)togglePower()}
function shoot(){
  const now=performance.now(); const delay=currentWeapon==='rifle'?105:230;
  if(!started||reloading||now-lastShot<delay)return;
  const activeAmmo=currentWeapon==='rifle'?ammo:pistolAmmo;
  if(activeAmmo<=0){reload();return}
  lastShot=now;if(currentWeapon==='rifle')ammo--;else pistolAmmo--;
  weaponRoot.position.z+=currentWeapon==='rifle'?.07:.035;camera.rotation.x+=currentWeapon==='rifle'?.010:.006;
  muzzleFlash.visible=true;muzzleLight.intensity=9;flashUntil=now+55;placeMuzzle();
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const allTargets=[...enemies,...collisionMeshes];const hits=raycaster.intersectObjects(allTargets,true);
  if(hits.length){const hit=hits[0],obj=hit.object,enemy=obj.userData.enemy;
    if(enemy&&!enemy.userData.dead){enemy.userData.health-=obj.geometry.type==='SphereGeometry'?(currentWeapon==='rifle'?72:55):(currentWeapon==='rifle'?35:28);spawnImpact(hit);
      if(enemy.userData.health<=0){enemy.userData.dead=true;kills++;enemy.rotation.z=Math.PI/2;enemy.position.y=.30;enemy.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({color:0x111211,roughness:.9})});toast('HOSTILE NEUTRALIZED');if(kills===3){document.getElementById('objective').textContent='OBJECTIVE: REACH EXTRACTION';toast('AREA SECURE — EXTRACT')}}
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
addEventListener('mousedown',e=>{if(e.button===0)shoot();if(e.button===2)aiming=true});addEventListener('mouseup',e=>{if(e.button===2)aiming=false});addEventListener('contextmenu',e=>e.preventDefault());
document.getElementById('startButton').onclick=()=>{started=true;document.getElementById('startPanel').style.display='none';if(matchMedia('(pointer:fine)').matches)controls.lock();};
renderer.domElement.addEventListener('click',()=>{if(started&&matchMedia('(pointer:fine)').matches&&!controls.isLocked)controls.lock()});

// Mobile controls
let moveVec={x:0,y:0},lookVec={x:0,y:0};
function bindPad(id,target){const el=document.getElementById(id),stick=el.querySelector('.stick');let active=null,start={x:0,y:0};el.addEventListener('pointerdown',e=>{active=e.pointerId;start={x:e.clientX,y:e.clientY};el.setPointerCapture(active)});el.addEventListener('pointermove',e=>{if(e.pointerId!==active)return;let dx=e.clientX-start.x,dy=e.clientY-start.y;const len=Math.hypot(dx,dy),max=38;if(len>max){dx*=max/len;dy*=max/len}stick.style.transform=`translate(${dx}px,${dy}px)`;target.x=dx/max;target.y=dy/max});const end=e=>{if(e.pointerId!==active)return;active=null;target.x=target.y=0;stick.style.transform=''};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end)}
bindPad('movePad',moveVec);bindPad('lookPad',lookVec);
document.querySelectorAll('#mobileControls button').forEach(b=>{const a=b.dataset.action;b.addEventListener('pointerdown',e=>{e.preventDefault();if(a==='fire')shoot();if(a==='use')interact();if(a==='reload')reload();if(a==='flashlight'){flashOn=!flashOn;flashlight.visible=flashOn;updateHud()}if(a==='aim')aiming=true});b.addEventListener('pointerup',()=>{if(a==='aim')aiming=false})});

function canMove(next){const p=new THREE.Vector3(next.x,1,next.z);if(Math.abs(p.x)>8.45||p.z>8.3||p.z<-32.4)return false;for(const m of collisionMeshes){if(['floor','ceiling','beam','pipeL','light fixture'].includes(m.name))continue;const b=new THREE.Box3().setFromObject(m).expandByScalar(.30);if(b.containsPoint(p))return false}return true}
function updateMovement(dt){let f=(keys.KeyW?1:0)-(keys.KeyS?1:0)-moveVec.y;let s=(keys.KeyD?1:0)-(keys.KeyA?1:0)+moveVec.x;const v=new THREE.Vector3(s,0,-f);if(v.lengthSq()>1)v.normalize();v.applyAxisAngle(new THREE.Vector3(0,1,0),camera.rotation.y);const speed=(keys.ShiftLeft?6.2:3.7)*dt;const next=controls.object.position.clone().addScaledVector(v,speed);if(canMove(next))controls.object.position.copy(next);if(Math.abs(lookVec.x)+Math.abs(lookVec.y)>.01){controls.object.rotation.y-=lookVec.x*dt*2.2;camera.rotation.x=Math.max(-1.3,Math.min(1.3,camera.rotation.x-lookVec.y*dt*1.8))}}
function updateEnemies(dt,t){for(const e of enemies){if(e.userData.dead)continue;const to=camera.getWorldPosition(new THREE.Vector3()).sub(e.position);const dist=to.length();e.rotation.y=Math.atan2(to.x,to.z)+Math.PI;e.position.y=Math.sin(t*2+e.userData.phase)*.015;if(dist<16&&powerOn){if(dist>4.2){to.y=0;to.normalize();const next=e.position.clone().addScaledVector(to,dt*(e.userData.heavy?.55:.8));if(canMove(next))e.position.copy(next)}if(Math.random()<dt*(e.userData.heavy?.7:.45)){damagePlayer(e.userData.heavy?12:8)}}}}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;if(started){updateMovement(dt);updateEnemies(dt,t);const hip=currentWeapon==='rifle'?new THREE.Vector3(.38,-.34,-.72):new THREE.Vector3(.34,-.31,-.61);const ads=currentWeapon==='rifle'?new THREE.Vector3(0,-.22,-.52):new THREE.Vector3(0,-.205,-.47);const target=aiming?ads:hip;weaponRoot.position.lerp(target,1-Math.pow(.001,dt));weaponRoot.position.x+=Math.sin(t*1.6)*.0015;weaponRoot.position.y+=Math.sin(t*3.2)*.001;weaponRoot.rotation.x+=(0-weaponRoot.rotation.x)*dt*8;weaponRoot.position.z+=(target.z-weaponRoot.position.z)*dt*9;if(reloading){const rp=Math.min(1,(performance.now()-reloadStart)/(currentWeapon==='rifle'?1450:1100));weaponRoot.rotation.z=Math.sin(rp*Math.PI)*.95;weaponRoot.rotation.x=Math.sin(rp*Math.PI)*.55;weaponRoot.position.y-=Math.sin(rp*Math.PI)*.20;}else weaponRoot.rotation.z*=Math.max(0,1-dt*12);if(performance.now()>flashUntil){muzzleFlash.visible=false;muzzleLight.intensity=0}else{muzzleFlash.rotation.z=Math.random()*Math.PI;muzzleFlash.scale.setScalar(.75+Math.random()*.5)}raycaster.setFromCamera(new THREE.Vector2(0,0),camera);const h=raycaster.intersectObject(switchGroup,true)[0];prompt.textContent=h&&h.distance<2.6&&!powerOn?'PRESS E / USE — RESTORE POWER':'';if(kills===3&&controls.object.position.z<-29.5){toast('MISSION COMPLETE');document.getElementById('objective').textContent='BLACKSITE SECURED';}}
renderer.render(scene,camera)}animate();updateHud();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
