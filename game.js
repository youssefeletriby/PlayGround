import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.domElement.className = 'world-renderer';
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#101916');
scene.fog = new THREE.Fog('#101916', 24, 76);
scene.add(new THREE.HemisphereLight(0xc3d7c3, 0x25362d, 2.0));
const moon = new THREE.DirectionalLight(0xc2d6c3, 2.5);
moon.position.set(-14, 25, 16); scene.add(moon);
const warm = new THREE.PointLight(0xffcf83, 24, 19, 2); warm.position.set(13, 6, 0); scene.add(warm);
const mat = (color, roughness=.8, extra={}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const materials = {
  grass: mat('#344b3b'), darkGrass: mat('#253b30'), path: mat('#77796b'), concrete: mat('#77786d'),
  wall: mat('#9c9885'), cream: mat('#c3b89e'), brick: mat('#69594b'), wood: mat('#694f39'),
  darkWood: mat('#3c3b31'), metal: mat('#45534e', .55, {metalness:.45}), leaf: mat('#344d38'),
  leaf2: mat('#536845'), blue: mat('#557b86'), yellow: mat('#d1a950'), red: mat('#a95243'),
  white: mat('#ded8c4'), black: mat('#212925'), lime: mat('#c8ee62'), ball: mat('#c6e657',.4),
  window: new THREE.MeshStandardMaterial({color:'#394d50',roughness:.25,emissive:'#718b84',emissiveIntensity:.23}),
  dog: mat('#a87349'), dogLight: mat('#d4ad78'), human: mat('#587583'), kid: mat('#b57c54'),
  shadow: new THREE.MeshBasicMaterial({color:0x111912,transparent:true,opacity:.35,depthWrite:false})
};
const boxGeo = new THREE.BoxGeometry(1,1,1);
const sphereGeo = new THREE.SphereGeometry(1,14,10);
const cylGeo = new THREE.CylinderGeometry(.5,.5,1,10);
const capsuleGeo = new THREE.CapsuleGeometry(.22,.48,4,8);
function addMesh(parent, geometry, material, pos, scale, rotY=0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...pos); mesh.scale.set(...scale); mesh.rotation.y=rotY;
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function box(parent, material, pos, scale, rot=0){return addMesh(parent,boxGeo,material,pos,scale,rot)}
function sphere(parent, material, pos, scale){return addMesh(parent,sphereGeo,material,pos,scale)}
function cylinder(parent, material, pos, scale, rot=0){return addMesh(parent,cylGeo,material,pos,scale,rot)}

const ZONES = [
  {name:'THE FRONT YARD', floor:'#344738', wall:'#9d987f', accent:'#c2a46e', kind:'yard'},
  {name:'MAPLE WALK', floor:'#555b4b', wall:'#787f6f', accent:'#d1b877', kind:'path'},
  {name:'SUNROOM', floor:'#5d5948', wall:'#a99b7c', accent:'#d7ad6b', kind:'patio'},
  {name:'LOADING BAY', floor:'#4a514b', wall:'#72796c', accent:'#c1a06e', kind:'bay'}
];
const centers = [-15,-5,5,15];
const cameras = [];
const feedEls = [...document.querySelectorAll('.feed')];
const props = [];

function tree(parent,x,z,size=1, autumn=false){
  cylinder(parent,materials.wood,[x,.52,z],[.19,1.05,.19]);
  const leaves = autumn ? materials.leaf2 : materials.leaf;
  sphere(parent,leaves,[x,.98,z],[.76*size,.88*size,.7*size]);
  sphere(parent,autumn?materials.yellow:materials.leaf2,[x-.3,.78,z+.09],[.43*size,.48*size,.43*size]);
  sphere(parent,leaves,[x+.32,1.24,z-.05],[.48*size,.55*size,.46*size]);
}
function lamp(parent,x,z){
  cylinder(parent,materials.metal,[x,1.45,z],[.08,2.9,.08]);
  box(parent,materials.metal,[x,2.86,z],[.54,.08,.14]);
  sphere(parent,mat('#f0d99d',.25,{emissive:'#edc77a',emissiveIntensity:1.6}),[x-.18,2.78,z],[.19,.12,.17]);
  const glow=new THREE.PointLight('#f0c77e',5,5,2);glow.position.set(x-.18,2.6,z);parent.add(glow);
}
function bench(parent,x,z){
  box(parent,materials.wood,[x,.58,z],[1.35,.13,.42]);
  box(parent,materials.wood,[x,.8,z-.17],[1.35,.5,.1]);
  for(const dx of [-.48,.48]) cylinder(parent,materials.metal,[x+dx,.31,z],[.08,.54,.08]);
}
function fence(parent,x,z,width=8){
  box(parent,materials.wood,[x,.7,z],[width,.12,.12]);
  box(parent,materials.wood,[x,.34,z],[width,.1,.1]);
  for(let i=0;i<width*1.1;i++){
    const px=x-width/2+.18+i*.8;
    if(px>x+width/2)break;
    box(parent,materials.wood,[px,.52,z],[.08,.65,.1]);
  }
}
function buildZone(index){
  const cx=centers[index], data=ZONES[index], root=new THREE.Group();root.position.x=cx;scene.add(root);
  const floor=mat(data.floor);box(root,floor,[0,-.22,0],[9,.4,7.4]);
  // enclosed rear boundary and a strong stripe of readable paving
  box(root,mat(data.wall),[0,1.25,-3.8],[9,3.2,.35]);
  box(root,materials.darkWood,[0,2.92,-3.58],[9,.18,.16]);
  for(let i=0;i<5;i++) box(root,materials.window,[-3.4+i*1.7,1.75,-3.59],[.95,1.05,.035]);
  box(root,materials.cream,[0,.08,-3.54],[9,.13,.12]);
  if(index===0){
    box(root,materials.path,[0,.005,.55],[2.25,.04,6.1]);
    for(let i=0;i<5;i++) box(root,materials.cream,[0,.035,2.8-i*1.12],[1.75,.05,.72]);
    tree(root,-3.35,.2,1.05);tree(root,3.25,-.6,.9,true);tree(root,-2.8,-2.2,.72,true);
    fence(root,0,3.45,8.2);bench(root,2.15,1.75);lamp(root,-1.7,-1.5);
    // mailbox and a small porch stoop
    box(root,materials.brick,[3.55,.65,-2.6],[.52,1.3,.42]);box(root,materials.metal,[3.55,1.28,-2.6],[.62,.12,.48]);
  } else if(index===1){
    box(root,materials.path,[0,.005,0],[3.3,.04,7.2]);
    for(let i=0;i<6;i++) box(root,materials.cream,[0,.035,2.85-i*1.1],[2.8,.045,.58]);
    tree(root,-3.35,-1.8,.9,true);tree(root,3.35,1.65,1.1);tree(root,-3.45,2.4,.75);
    lamp(root,2.15,-1.5);bench(root,-2.05,.5);
    for(let i=0;i<4;i++){sphere(root,materials.leaf2,[-1.2+i*.55,.08,-2.7],[.09,.07,.07]);}
  } else if(index===2){
    box(root,materials.path,[0,.015,0],[7.5,.06,3.35]);
    for(let i=0;i<3;i++){box(root,materials.wood,[-2.7+i*2.7,.45,-2.8],[2.5,.8,.18]);box(root,materials.cream,[-2.7+i*2.7,.9,-2.8],[2.5,.12,.2]);}
    box(root,materials.wood,[2.8,.55,2.35],[1.3,1,.55]);box(root,materials.cream,[2.8,1.08,2.35],[1.4,.12,.62]);
    tree(root,-3.5,2.8,.8,true);tree(root,3.6,-1.9,.85);lamp(root,-2.5,-1.8);
    // garden pots
    for(const [x,z] of [[-2.4,.65],[1.9,-1.8],[3.2,.5]]){cylinder(root,materials.brick,[x,.22,z],[.42,.44,.42]);sphere(root,materials.leaf2,[x,.63,z],[.42,.48,.42]);}
  } else {
    box(root,materials.concrete,[0,.015,0],[8.7,.06,7]);
    box(root,materials.darkWood,[-2,.65,-3.55],[2.8,1.25,.15]);
    for(let i=0;i<4;i++){box(root,materials.yellow,[-3.05+i*.72,.66,-3.45],[.36,.9,.025],.28);}
    for(let i=0;i<3;i++){box(root,materials.wood,[2.55,.45,-2.9+i*.9],[1.15,.85,.82]);box(root,materials.cream,[2.55,.9,-2.9+i*.9],[1.2,.08,.86]);}
    box(root,materials.path,[0,.045,2.35],[6.8,.05,.16]);
    for(let i=0;i<4;i++) box(root,materials.yellow,[-2.6+i*1.7,.08,2.35],[.75,.07,.14]);
    lamp(root,-3.3,-1.6);bench(root,-1.5,.5);
  }
  // small site plaque for tangible, miniature 3D geometry
  const plaque=box(root,materials.metal,[-4.34,1.02,3.1],[.09,.63,.74]);
  for(let j=0;j<3;j++) box(root,materials.lime,[-4.27,1.2-j*.17,3.1],[.018,.025,.32]);
  const cam=new THREE.OrthographicCamera(-4.9,4.9,3.2,-3.2,.1,80);
  cam.position.set(cx,8.3,10.5);cam.lookAt(cx,.4,0);cameras.push(cam);
  return root;
}
const zoneRoots=ZONES.map((_,i)=>buildZone(i));

// A visitor is assembled from familiar low-poly parts, so the disguise can change without loading assets.
const visitorPalette=['#627d85','#a65346','#bc8c53','#647a5b','#896a83','#d1d1bf','#424c5c'];
function createVisitor(kind, isThief, tell){
  const group=new THREE.Group();
  const variant=kind;
  const cloth=isThief?mat('#303a34'):mat(visitorPalette[Math.floor(Math.random()*visitorPalette.length)]);
  const skin=mat(isThief?'#c2a27e':'#d0ad8e');
  let limbs=[];
  if(variant==='dog'||variant==='raccoon'){
    const fur=variant==='dog'?materials.dog:mat('#55594b');
    sphere(group,fur,[0,.55,0],[.48,.33,.28]);
    sphere(group,variant==='dog'?materials.dogLight:materials.darkWood,[.34,.66,-.02],[.25,.23,.22]);
    sphere(group,fur,[.47,.69,.01],[.21,.17,.18]);
    sphere(group,materials.black,[.53,.73,.11],[.035,.035,.035]);
    sphere(group,fur,[.26,.9,-.08],[.1,.19,.09]);
    sphere(group,fur,[-.5,.65,-.04],[.12,.1,.11]);
    for(const x of [-.28,.25])for(const z of [-.15,.15])limbs.push(cylinder(group,fur,[x,.26,z],[.09,.42,.09]));
  } else if(variant==='parcel'){
    box(group,mat('#a7794d'),[0,.53,0],[.8,.92,.66]);
    box(group,mat('#ddc28a'),[0,.54,.338],[.15,.91,.018]);
    box(group,mat('#ddc28a'),[0,1.01,0],[.82,.12,.68]);
    // tiny sneakers peek below the suspicious walking parcel
    for(const x of [-.27,.27]){sphere(group,materials.black,[x,.08,.02],[.19,.08,.27]);}
  } else if(variant==='ball'){
    sphere(group,materials.ball,[0,.42,0],[.42,.42,.42]);
    const seam=new THREE.Mesh(new THREE.TorusGeometry(.24,.018,5,18),materials.white);seam.position.set(0,.42,.28);seam.rotation.y=.35;group.add(seam);
    sphere(group,materials.shadow,[0,.045,0],[.48,.045,.28]);
  } else {
    const isKid=variant==='child';
    const scale=isKid?.82:1;
    group.scale.setScalar(scale);
    cylinder(group,cloth,[0,.96,0],[.44,.63,.28]);
    sphere(group,skin,[0,1.48,0],[.25,.29,.24]);
    sphere(group,mat(isThief?'#302e2a':'#564333'),[0,1.64,-.015],[.255,.16,.25]);
    // neck and backpack add readable silhouette
    cylinder(group,skin,[0,1.29,0],[.16,.19,.16]);
    if(!isThief && Math.random()>.53)box(group,materials.red,[0,.94,-.21],[.4,.43,.16]);
    for(const x of [-.13,.13]){
      const leg=cylinder(group,mat(isThief?'#343b37':'#333b37'),[x,.37,0],[.14,.58,.15]);limbs.push(leg);
      sphere(group,materials.black,[x,.08,.07],[.15,.09,.24]);
      const arm=cylinder(group,cloth,[x*2,.94,.03],[.12,.53,.13],x<0?-.2:.2);limbs.push(arm);
    }
  }
  // Every disguise shares a tell, but regular visitors do not.
  if(isThief){
    if(tell.type==='bandana'){
      const wrap= new THREE.Mesh(new THREE.TorusGeometry(.265,.055,6,16),materials.lime);wrap.position.set(0,1.39,0);group.add(wrap);
      if(variant==='dog'||variant==='raccoon')wrap.position.set(.03,.78,0);
      if(variant==='parcel')box(group,materials.lime,[0,.86,.35],[.22,.13,.03]);
      if(variant==='ball')sphere(group,materials.lime,[.17,.69,.1],[.12,.12,.12]);
    } else if(tell.type==='cap'){
      const cap=cylinder(group,materials.red,[0,1.72,0],[.25,.12,.25]);
      if(variant==='dog'||variant==='raccoon')cap.position.set(.31,.9,0);
      if(variant==='parcel')box(group,materials.red,[0,1.1,0],[.58,.12,.52]);
      if(variant==='ball')sphere(group,materials.red,[0,.79,0],[.13,.08,.13]);
    } else if(tell.type==='badge'){
      const badge=box(group,materials.yellow,[0,1.02,.16],[.17,.2,.04]);
      if(variant==='dog'||variant==='raccoon')badge.position.set(.14,.64,.2);
      if(variant==='parcel')badge.position.set(.14,.7,.35);
      if(variant==='ball')badge.position.set(.28,.42,0);
    } else {
      const pack=box(group,materials.red,[0,1.0,-.22],[.36,.44,.2]);
      if(variant==='dog'||variant==='raccoon')pack.position.set(-.13,.54,-.22);
      if(variant==='parcel')pack.position.set(0,.5,-.35);
      if(variant==='ball')pack.position.set(0,.42,-.33);
    }
  }
  const shadow=sphere(group,materials.shadow,[0,.018,0],[.48,.025,.27]);
  props.push({group,limbs,variant,shadow,phase:Math.random()*10});
  return group;
}

const CLUES=[
 {type:'bandana',text:'Spot the lime-green bandana.'},
 {type:'cap',text:'Look for a tiny red cap.'},
 {type:'badge',text:'Find the visitor with a gold badge.'},
 {type:'pack',text:'Watch for a red backpack.'}
];
const kinds=['jogger','child','dog','raccoon','parcel','ball'];
const kindNames={jogger:'Late-night walker',child:'Neighborhood kid',dog:'Loose dog',raccoon:'Garden visitor',parcel:'Moving parcel',ball:'Rolling ball'};
const kindIcons={jogger:'♟',child:'♟',dog:'⌁',raccoon:'◉',parcel:'▣',ball:'●'};
let active=[],started=false,score=0,good=0,bad=0,streak=0,spawnTimer=1.5,thiefTimer=5.5,elapsed=0,toastTimer=0,soundOn=true,audioCtx=null,lastTime=0;
let clue=CLUES[0];
const $=id=>document.getElementById(id);
const scoreEl=$('score'), goodEl=$('good-calls'), badEl=$('bad-calls'), listEl=$('activity-list');

function announce(message,isBad=false){
 const el=$('toast');el.textContent=message;el.classList.toggle('bad',isBad);el.classList.add('show');toastTimer=2.1;
 if(soundOn) beep(isBad?210:620,isBad?.13:.09);
}
function beep(freq,duration){
 try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.frequency.value=freq;osc.type='sine';gain.gain.setValueAtTime(.055,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+duration)}catch{}
}
function updateScore(){scoreEl.textContent=String(score).padStart(3,'0');goodEl.textContent=good;badEl.textContent=bad;$('streak').innerHTML=`✦ &nbsp;STREAK ${streak}`;$('score-fill').style.width=`${Math.min(100,score%100)}%`;}
function addSighting(event,success){
 const empty=listEl.querySelector('.empty-state');if(empty)empty.remove();
 const row=document.createElement('div');row.className=`sighting${success?'':' bad'}`;
 const label=success?'SUSPECT CAUGHT':'FALSE ALARM';
 row.innerHTML=`<span class="s-icon">${kindIcons[event.kind]||'◉'}</span><div>${label}<small>${ZONES[event.zone].name} · ${kindNames[event.kind]}</small></div><time>NOW</time>`;
 listEl.prepend(row);while(listEl.children.length>5)listEl.lastElementChild.remove();$('history-count').textContent=`${Math.min(5,listEl.children.length)} / 5`;
}
function startShift(){
 started=true;elapsed=0;score=0;good=0;bad=0;streak=0;active.forEach(e=>scene.remove(e.object));active=[];
 clue=CLUES[Math.floor(Math.random()*CLUES.length)];$('clue-text').textContent=clue.text;
 $('intro-overlay').classList.add('hidden');$('case-clock').textContent='00:00';
 announce('Shift started. Keep watch across all four feeds.');
 spawnTimer=1.7;thiefTimer=7;
}
function spawnEvent(isThief=false){
 if(!started||active.length>5)return;
 let zone=Math.floor(Math.random()*4);
 const kind=kinds[Math.floor(Math.random()*kinds.length)];
 const visitorKind=isThief?kind:(kind==='ball'?'ball':kind);
 const object=createVisitor(visitorKind,isThief,clue);
 const direction=Math.random()<.5?1:-1;
 const event={object,zone,kind:visitorKind,isThief,direction,x:direction>0?-4.1:4.1,speed:isThief?.42+Math.random()*.16:.55+Math.random()*.55,life:0,duration:isThief?10.5:7+Math.random()*3,phase:Math.random()*10};
 object.position.set(centers[zone]+event.x,0,(Math.random()-.5)*2.8);
 scene.add(object);active.push(event);
 if(!isThief && Math.random()<.48)beep(370,.04);
}
function resolve(event,success){
 active=active.filter(e=>e!==event);scene.remove(event.object);
 addSighting(event,success);
 const feed=feedEls[event.zone];feed.classList.remove('caught','missed');
 if(success){good++;streak++;score+=100+Math.max(0,streak-1)*25;feed.classList.add('caught');announce(streak>1?`Nice catch — ${streak} in a row!`:"That's our thief. Nice work.");}
 else{bad++;streak=0;feed.classList.add('missed');announce(event.isThief?'They got away. Watch for the clue next time.':'Just a neighbor. Keep watching.',true);}
 updateScore();setTimeout(()=>feed.classList.remove('caught','missed'),850);
}
feedEls.forEach((feed,index)=>{
 feed.querySelector('.feed-hit').addEventListener('click',()=>{
  if(!started){announce('Start your shift to begin monitoring.',true);return;}
  const suspect=active.find(e=>e.zone===index&&e.isThief);
  if(suspect){resolve(suspect,true);}
  else{const innocent=active.find(e=>e.zone===index);bad++;streak=0;updateScore();feed.classList.add('missed');setTimeout(()=>feed.classList.remove('missed'),500);announce(innocent?'False alarm — that one belongs here.':'No activity to report on this feed.',true);if(innocent)addSighting(innocent,false);}
 });
});
$('start-button').addEventListener('click',startShift);
$('sound-toggle').addEventListener('click',()=>{soundOn=!soundOn;$('sound-state').textContent=soundOn?'ON':'OFF';$('sound-state').style.color=soundOn?'var(--lime)':'#78857f';});

document.addEventListener('keydown',e=>{if(e.key===' '&& !started)startShift();if(['1','2','3','4'].includes(e.key))feedEls[Number(e.key)-1].querySelector('.feed-hit').click();});

function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min(.05,(now-lastTime)/1000||0);lastTime=now;
 if(started){
  elapsed+=dt;spawnTimer-=dt;thiefTimer-=dt;
  $('case-clock').textContent=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(Math.floor(elapsed%60)).padStart(2,'0')}`;
  const clock=$('shift-clock');clock.textContent=`SHIFT ${String(1+Math.floor(elapsed/60)).padStart(2,'0')}:${String(Math.floor(elapsed%60)).padStart(2,'0')} AM`;
  if(spawnTimer<=0){spawnEvent(false);spawnTimer=2.3+Math.random()*2.9;}
  if(thiefTimer<=0&&!active.some(e=>e.isThief)){spawnEvent(true);thiefTimer=14+Math.random()*8;}
  for(const event of [...active]){
   event.life+=dt;event.x+=event.direction*event.speed*dt;
   event.object.position.x=centers[event.zone]+event.x;
   event.object.position.z+=Math.sin(event.life*1.6+event.phase)*.0015;
   event.object.position.y=event.kind==='ball'?Math.abs(Math.sin(event.life*7))*.12:Math.sin(event.life*5)*.018;
   event.object.rotation.y=event.kind==='ball'?event.life*event.direction*2.3:(event.direction<0?Math.PI:0)+Math.sin(event.life*2)*.035;
   event.object.traverse(child=>{if(child.isMesh&&child.geometry===cylGeo&&child.parent===event.object)child.rotation.x=Math.sin(event.life*8+event.phase)*.16;});
   if(event.life>event.duration||Math.abs(event.x)>4.8){if(event.isThief)resolve(event,false);else{active=active.filter(e=>e!==event);scene.remove(event.object);}}
  }
 }
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show');}
 // One WebGL renderer paints each camera into its matching screen rectangle.
 renderer.setSize(window.innerWidth,window.innerHeight,false);
 renderer.setScissorTest(true);
 for(let i=0;i<feedEls.length;i++){
  const r=feedEls[i].getBoundingClientRect();
  const x=Math.max(0,r.left),right=Math.min(window.innerWidth,r.right),top=Math.max(0,r.top),bottom=Math.min(window.innerHeight,r.bottom);
  if(right<=x||bottom<=top)continue;
  const w=right-x,h=bottom-top;
  renderer.setViewport(Math.floor(x),Math.floor(window.innerHeight-bottom),Math.ceil(w),Math.ceil(h));
  renderer.setScissor(Math.floor(x),Math.floor(window.innerHeight-bottom),Math.ceil(w),Math.ceil(h));
  const camera=cameras[i];const aspect=w/h;camera.left=-3.9*aspect;camera.right=3.9*aspect;camera.top=3.9;camera.bottom=-3.9;camera.updateProjectionMatrix();
  renderer.render(scene,camera);
 }
 renderer.setScissorTest(false);
}
window.addEventListener('resize',()=>renderer.setSize(window.innerWidth,window.innerHeight));
updateScore();requestAnimationFrame(frame);
