import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.161/examples/jsm/loaders/GLTFLoader.js";

let scene,camera,renderer,clock;
let player, gun;
let zombies=[];
let bullets=[];
let particles=[];
let keys={};
let running=false, gameOver=false;
let health=100, ammo=30, score=0, wave=1, spawnLeft=0, spawnTimer=0, shootCooldown=0;
let yaw=0, pitch=0;
let moveX=0, moveY=0, firing=false;
const loader=new GLTFLoader();
let survivorModel=null, zombieModel=null;

const healthEl=document.getElementById("health");
const ammoEl=document.getElementById("ammo");
const scoreEl=document.getElementById("score");
const waveEl=document.getElementById("wave");
const msg=document.getElementById("message");
const start=document.getElementById("startScreen");

init();

function init(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x111820);
  scene.fog=new THREE.Fog(0x111820,25,90);

  camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,150);
  camera.position.set(0,2.1,8);

  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;
  document.body.appendChild(renderer.domElement);

  clock=new THREE.Clock();

  scene.add(new THREE.HemisphereLight(0x9fb7cf,0x273019,1.7));
  const sun=new THREE.DirectionalLight(0xffffff,2);
  sun.position.set(-20,30,10); sun.castShadow=true; scene.add(sun);

  createWorld();
  createPlayer();
  loader.load("https://cdn.3dassets.dev/assets/11984/v1/model.glb",(gltf)=>{
    zombieModel=gltf.scene;
    zombieModel.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  });
  createGun();
  setupInput();
  renderer.setAnimationLoop(loop);
}

function createWorld(){
  const ground=new THREE.Mesh(
    new THREE.PlaneGeometry(140,140),
    new THREE.MeshStandardMaterial({color:0x29312a,roughness:1})
  );
  ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

  const grid=new THREE.GridHelper(140,70,0x56605a,0x39423c);
  grid.position.y=.01; scene.add(grid);

  for(let i=0;i<45;i++){
    const h=1+Math.random()*5;
    const box=new THREE.Mesh(
      new THREE.BoxGeometry(1.5+Math.random()*2,h,1.5+Math.random()*2),
      new THREE.MeshStandardMaterial({color:0x3d4546})
    );
    box.position.set((Math.random()-.5)*100,h/2,(Math.random()-.5)*100);
    if(Math.hypot(box.position.x,box.position.z)<13){i--;continue}
    box.castShadow=true; box.receiveShadow=true; scene.add(box);
  }

  const moon=new THREE.Mesh(
    new THREE.SphereGeometry(5,20,20),
    new THREE.MeshBasicMaterial({color:0xc8d4df})
  );
  moon.position.set(-35,35,-55); scene.add(moon);
}

function createPlayer(){
  player=new THREE.Group();
  player.position.set(0,0,8);
  player.visible=false;
  scene.add(player);

  loader.load("https://cdn.3dassets.dev/assets/32699/v1/model.glb",(gltf)=>{
    survivorModel=gltf.scene;
    survivorModel.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
    player.add(survivorModel);
    player.visible=true;
  },undefined,()=>{
    const body=new THREE.Mesh(new THREE.BoxGeometry(.8,1.2,.55),new THREE.MeshStandardMaterial({color:0x263b52}));
    body.position.y=1.25;
    const head=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),new THREE.MeshStandardMaterial({color:0xc78b62}));
    head.position.y=2.1;
    player.add(body,head);
    player.visible=true;
  });
}

function createGun(){
  gun=new THREE.Group();
  const barrel=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.8),new THREE.MeshStandardMaterial({color:0x171717,metalness:.7}));
  barrel.position.set(.35,-.15,-.75); barrel.rotation.x=-.1;
  const grip=new THREE.Mesh(new THREE.BoxGeometry(.16,.4,.18),new THREE.MeshStandardMaterial({color:0x4a2b1d}));
  grip.position.set(.35,-.35,-.45); grip.rotation.x=-.25;
  gun.add(barrel,grip); camera.add(gun); scene.add(camera);
}

function setupInput(){
  addEventListener("resize",()=>{
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight);
  });
  addEventListener("keydown",e=>{
    keys[e.code]=true;
    if(e.code==="KeyR" && gameOver) resetGame();
  });
  addEventListener("keyup",e=>keys[e.code]=false);
  renderer.domElement.addEventListener("click",()=>{if(running) renderer.domElement.requestPointerLock?.()});
  addEventListener("mousemove",e=>{
    if(document.pointerLockElement===renderer.domElement && running){
      yaw-=e.movementX*.0025; pitch-=e.movementY*.0025;
      pitch=Math.max(-1.1,Math.min(1.1,pitch));
    }
  });
  renderer.domElement.addEventListener("mousedown",()=>{if(running) firing=true});
  addEventListener("mouseup",()=>firing=false);

  document.getElementById("startBtn").onclick=()=>{start.style.display="none"; resetGame(); running=true};
  const stick=document.getElementById("stick"), knob=document.getElementById("knob");
  let active=false;
  function stickMove(e){
    const r=stick.getBoundingClientRect(), p=e.touches?e.touches[0]:e;
    let x=p.clientX-(r.left+r.width/2), y=p.clientY-(r.top+r.height/2);
    const max=42, len=Math.hypot(x,y); if(len>max){x=x/len*max;y=y/len*max}
    knob.style.transform=`translate(${x}px,${y}px)`; moveX=x/max; moveY=y/max;
  }
  stick.addEventListener("touchstart",e=>{active=true;stickMove(e);e.preventDefault()},{passive:false});
  stick.addEventListener("touchmove",e=>{if(active)stickMove(e);e.preventDefault()},{passive:false});
  stick.addEventListener("touchend",()=>{active=false;moveX=moveY=0;knob.style.transform="translate(0,0)"});
  const fire=document.getElementById("fire");
  fire.addEventListener("touchstart",e=>{firing=true;e.preventDefault()},{passive:false});
  fire.addEventListener("touchend",()=>firing=false);
}

function resetGame(){
  zombies.forEach(z=>scene.remove(z.mesh)); zombies=[];
  bullets.forEach(b=>scene.remove(b.mesh)); bullets=[];
  health=100; ammo=30; score=0; wave=1; spawnLeft=6; spawnTimer=0; gameOver=false;
  player.position.set(0,0,8); yaw=0; pitch=0; updateHUD();
  msg.textContent="SURVIVE!";
}

function spawnZombie(){
  const a=Math.random()*Math.PI*2;
  const d=24+Math.random()*20;
  const z=new THREE.Group();
  z.position.set(player.position.x+Math.cos(a)*d,0,player.position.z+Math.sin(a)*d);

  if(zombieModel){
    const model=zombieModel.clone(true);
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
    z.add(model);
  }else{
    const skin=new THREE.MeshStandardMaterial({color:0x557b4c});
    const body=new THREE.Mesh(new THREE.BoxGeometry(.9,1.35,.55),skin); body.position.y=1.15;
    const head=new THREE.Mesh(new THREE.SphereGeometry(.38,12,10),skin); head.position.y=2.05;
    z.add(body,head);
  }
  scene.add(z);
  zombies.push({mesh:z,hp:2,speed:1.25+Math.random()*.55,hit:0});
}

function shoot(){
  if(shootCooldown>0||ammo<=0)return;
  ammo--; shootCooldown=.16;
  const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).normalize();
  const b=new THREE.Mesh(new THREE.SphereGeometry(.07,8,8),new THREE.MeshBasicMaterial({color:0xffdd77}));
  b.position.copy(camera.position); scene.add(b);
  bullets.push({mesh:b,dir,life:1.3});
  gun.position.z=.08;
  setTimeout(()=>gun.position.z=0,50);
  if(ammo===0)setTimeout(()=>{ammo=30},800);
}

function damagePlayer(n){
  health-=n; updateHUD();
  if(health<=0){
    health=0; gameOver=true; running=false;
    msg.textContent="GAME OVER — PRESS R";
    document.exitPointerLock?.();
  }
}

function updateHUD(){
  healthEl.textContent=Math.max(0,Math.round(health));
  ammoEl.textContent=ammo;
  scoreEl.textContent=score;
  waveEl.textContent=wave;
}

function spawnBurst(pos){
  for(let i=0;i<8;i++){
    const p=new THREE.Mesh(new THREE.SphereGeometry(.035,6,6),new THREE.MeshBasicMaterial({color:0xff5533}));
    p.position.copy(pos); scene.add(p);
    particles.push({mesh:p,v:new THREE.Vector3((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3),life:.5});
  }
}

function update(dt){
  if(!running)return;

  shootCooldown=Math.max(0,shootCooldown-dt);
  if(firing)shoot();

  const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  let mx=(keys.KeyD?1:0)-(keys.KeyA?1:0)+moveX;
  let mz=(keys.KeyS?1:0)-(keys.KeyW?1:0)+moveY;
  const mv=new THREE.Vector3().addScaledVector(right,mx).addScaledVector(forward,mz);
  if(mv.length()>1)mv.normalize();
  player.position.addScaledVector(mv,6*dt);
  player.position.x=THREE.MathUtils.clamp(player.position.x,-58,58);
  player.position.z=THREE.MathUtils.clamp(player.position.z,-58,58);

  camera.position.set(player.position.x,2.15,player.position.z);
  camera.rotation.set(pitch,yaw,0,"YXZ");

  spawnTimer-=dt;
  if(spawnLeft>0 && spawnTimer<=0){spawnZombie();spawnLeft--;spawnTimer=.7}
  if(spawnLeft===0 && zombies.length===0){
    wave++; spawnLeft=5+wave*2; msg.textContent=`WAVE ${wave}`;
    setTimeout(()=>{if(running)msg.textContent=""},1000);
  }

  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i]; b.mesh.position.addScaledVector(b.dir,35*dt); b.life-=dt;
    let hit=false;
    for(let j=zombies.length-1;j>=0;j--){
      const z=zombies[j];
      if(b.mesh.position.distanceTo(z.mesh.position.clone().add(new THREE.Vector3(0,1.2,0)))<.8){
        z.hp--;z.hit=.1;hit=true;spawnBurst(b.mesh.position);
        if(z.hp<=0){score+=10;scene.remove(z.mesh);zombies.splice(j,1);updateHUD()}
        break;
      }
    }
    if(hit||b.life<=0){scene.remove(b.mesh);bullets.splice(i,1)}
  }

  for(let i=zombies.length-1;i>=0;i--){
    const z=zombies[i], pos=z.mesh.position;
    const target=new THREE.Vector3(player.position.x,0,player.position.z);
    const dir=target.clone().sub(pos); dir.y=0;
    const d=dir.length();
    if(d>.9){dir.normalize();pos.addScaledVector(dir,z.speed*dt);z.mesh.rotation.y=Math.atan2(dir.x,dir.z)}
    else if(Math.random()<dt*1.8)damagePlayer(5);
    if(z.hit>0){z.hit-=dt;z.mesh.scale.setScalar(1.08)}else z.mesh.scale.setScalar(1);
  }

  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.mesh.position.addScaledVector(p.v,dt);p.v.y-=6*dt;p.life-=dt;
    if(p.life<=0){scene.remove(p.mesh);particles.splice(i,1)}
  }
  updateHUD();
}

function loop(){
  const dt=Math.min(clock.getDelta(),.05);
  update(dt);
  renderer.render(scene,camera);
}
