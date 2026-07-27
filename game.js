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

// Real 3D first-person weapon
const weapon=new THREE.Group(); camera.add(weapon); weapon.position.set(.38,-.34,-.72); weapon.rotation.set(-.05,-.08,0);
const gunDark=new THREE.MeshStandardMaterial({color:0x121514,roughness:.34,metalness:.82});
const gunPoly=new THREE.MeshStandardMaterial({color:0x272c29,roughness:.58,metalness:.3});
function part(g,w,h,d,x,y,z,mat=gunDark){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m}
part(weapon,.17,.15,.62,0,0,0); part(weapon,.13,.12,.72,0,.01,-.62); part(weapon,.10,.10,.5,0,.01,-1.18); part(weapon,.06,.06,.34,0,.01,-1.59);
part(weapon,.14,.16,.32,0,-.16,-.20,gunPoly).rotation.x=-.24; part(weapon,.10,.30,.18,0,-.25,.18,gunPoly).rotation.x=-.22;
part(weapon,.13,.12,.21,0,.16,-.14,gunPoly); const scopeTube=new THREE.Mesh(new THREE.CylinderGeometry(.09,.10,.45,18),gunDark);scopeTube.rotation.x=Math.PI/2;scopeTube.position.set(0,.22,-.40);scopeTube.castShadow=true;weapon.add(scopeTube);
const lens=new THREE.Mesh(new THREE.CircleGeometry(.075,18),new THREE.MeshStandardMaterial({color:0x15352b,metalness:.5,roughness:.12,emissive:0x03130c,emissiveIntensity:1}));lens.position.set(0,.22,-.631);weapon.add(lens);
const weaponLight=new THREE.PointLight(0xdffff0,.8,1);weaponLight.position.set(.09,.02,-1.1);weapon.add(weaponLight);

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
const keys={}; let started=false,powerOn=false,flashOn=true,aiming=false,reloading=false,ammo=30,reserve=120,hp=100,armor=50,kills=0,lastShot=0;
const raycaster=new THREE.Raycaster(); const clock=new THREE.Clock();
const prompt=document.getElementById('prompt'), msg=document.getElementById('message');
function toast(t){msg.textContent=t;msg.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>msg.style.opacity=0,1700)}
function updateHud(){document.getElementById('hp').textContent=Math.max(0,Math.round(hp));document.getElementById('armor').textContent=Math.max(0,Math.round(armor));document.getElementById('ammo').textContent=`${ammo}/${reserve}`;document.getElementById('secure').textContent=`${kills}/3`;document.getElementById('lightState').textContent=flashOn?'ON':'OFF';document.getElementById('powerState').textContent=powerOn?'ONLINE':'OFFLINE'}
function togglePower(){if(powerOn)return;powerOn=true;mainLights.forEach((l,i)=>setTimeout(()=>l.intensity=18,120*i));emergency.intensity=1;indicator.material.color.set(0x2dff81);indicator.material.emissive.set(0x00ff55);lever.rotation.z=-.65;document.getElementById('objective').textContent='OBJECTIVE: ELIMINATE VOLK TEAM';toast('FACILITY POWER RESTORED');updateHud()}
function interact(){raycaster.setFromCamera(new THREE.Vector2(0,0),camera);const hit=raycaster.intersectObject(switchGroup,true)[0];if(hit&&hit.distance<2.6)togglePower()}
function shoot(){const now=performance.now();if(!started||reloading||now-lastShot<115)return;if(ammo<=0){reload();return}lastShot=now;ammo--;weapon.position.z+=.055;camera.rotation.x+=.008;raycaster.setFromCamera(new THREE.Vector2(0,0),camera);const hits=raycaster.intersectObjects(enemies,true);if(hits.length){const obj=hits[0].object;const enemy=obj.userData.enemy;if(enemy&&!enemy.userData.dead){enemy.userData.health-=obj.geometry.type==='SphereGeometry'?70:34;if(enemy.userData.health<=0){enemy.userData.dead=true;kills++;enemy.rotation.z=Math.PI/2;enemy.position.y=.30;enemy.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({color:0x111211,roughness:.9})});toast('HOSTILE NEUTRALIZED');if(kills===3){document.getElementById('objective').textContent='OBJECTIVE: REACH EXTRACTION';toast('AREA SECURE — EXTRACT')}}}}updateHud()}
function reload(){if(reloading||ammo===30||reserve<=0)return;reloading=true;toast('RELOADING');const take=Math.min(30-ammo,reserve);setTimeout(()=>{ammo+=take;reserve-=take;reloading=false;updateHud()},1250)}
function damagePlayer(amount){let left=amount;if(armor>0){const absorb=Math.min(armor,left*.65);armor-=absorb;left-=absorb}hp-=left;document.getElementById('damage').style.opacity=.7;setTimeout(()=>document.getElementById('damage').style.opacity=0,120);if(hp<=0){hp=0;toast('MISSION FAILED');setTimeout(()=>location.reload(),1800)}updateHud()}

addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE')interact();if(e.code==='KeyF'){flashOn=!flashOn;flashlight.visible=flashOn;updateHud()}if(e.code==='KeyR')reload()});addEventListener('keyup',e=>keys[e.code]=false);
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
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;if(started){updateMovement(dt);updateEnemies(dt,t);const target=aiming?new THREE.Vector3(0,-.23,-.58):new THREE.Vector3(.38,-.34,-.72);weapon.position.lerp(target,1-Math.pow(.001,dt));weapon.position.x+=Math.sin(t*1.6)*.0015;weapon.position.y+=Math.sin(t*3.2)*.001;weapon.rotation.x+=(0-weapon.rotation.x)*dt*8;weapon.position.z+=(target.z-weapon.position.z)*dt*9;raycaster.setFromCamera(new THREE.Vector2(0,0),camera);const h=raycaster.intersectObject(switchGroup,true)[0];prompt.textContent=h&&h.distance<2.6&&!powerOn?'PRESS E / USE — RESTORE POWER':'';if(kills===3&&controls.object.position.z<-29.5){toast('MISSION COMPLETE');document.getElementById('objective').textContent='BLACKSITE SECURED';}}
renderer.render(scene,camera)}animate();updateHud();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
