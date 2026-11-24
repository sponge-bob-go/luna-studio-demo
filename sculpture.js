import * as THREE from './assets/three.module.min.js';

const mount = document.querySelector('#sculpt');
const buttons = [...document.querySelectorAll('[data-mode]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let mode = 0;
let refresh = () => {};
buttons.forEach((button, index) => button.addEventListener('click', () => {
  mode = index;
  buttons.forEach((item, n) => item.setAttribute('aria-pressed', String(n === mode)));
  document.querySelector('#orbitCourse').dataset.course = mode ? 'Растяжка' : 'Танцы на пилоне';
  mount.style.backgroundImage = mount.classList.contains('ready') ? 'none' : 'url(assets/' + (mode ? 'red-stretch.jpg' : 'inversion.jpg') + ')';
  document.dispatchEvent(new CustomEvent('orbit-course', {detail:document.querySelector('#orbitCourse').dataset.course}));
  refresh();
}));

// A ribbon is a swept surface. The two profiles share vertices for continuous morphing.
function ribbon(stretched) {
  const vertices = [], indices = [];
  for (let i = 0; i <= 220; i++) {
    const t = i / 220, angle = t * Math.PI * (stretched ? 2.9 : 4.6);
    const radius = .37 + Math.sin(t * Math.PI) * (stretched ? .88 : 1.36);
    const width = .035 + .31 * Math.pow(Math.sin(t * Math.PI), .65);
    for (let j = 0; j <= 8; j++) {
      const edge = (j / 4 - 1) * width, fold = angle * .64;
      const r = radius + Math.cos(fold) * edge;
      vertices.push(r * Math.cos(angle), (t - .5) * 3.7 + edge * Math.sin(fold) + .08 * Math.sin(j / 8 * Math.PI), r * Math.sin(angle));
      if (i && j) { const n = i * 9 + j; indices.push(n-10,n-9,n,n-10,n,n-1); }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function build(renderer) {
  mount.append(renderer.domElement);
  mount.classList.add('ready');
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36,1,.1,50);
  camera.position.set(0,.25,7.8); camera.lookAt(0,0,0);
  const group = new THREE.Group(); scene.add(group);

  const studio = document.createElement('canvas');
  studio.width=512; studio.height=256;
  const ctx=studio.getContext('2d');
  const gradient=ctx.createLinearGradient(0,0,0,256);
  for(const [stop,color] of [[0,'#fff0db'],[.29,'#9e6a74'],[.47,'#1c101b'],[.54,'#ffe0bb'],[.63,'#796071'],[1,'#160e1a']]) gradient.addColorStop(stop,color);
  ctx.fillStyle=gradient; ctx.fillRect(0,0,512,256);
  ctx.fillStyle='#ffffff';ctx.fillRect(68,22,38,170);ctx.fillRect(333,30,12,182);
  const env=new THREE.CanvasTexture(studio);
  env.mapping=THREE.EquirectangularReflectionMapping; env.colorSpace=THREE.SRGBColorSpace; scene.environment=env;
  const surface=ribbon(false), alternate=ribbon(true);
  surface.morphAttributes.position=[alternate.attributes.position];
  surface.morphAttributes.normal=[alternate.attributes.normal];
  const silk=new THREE.Mesh(surface,new THREE.MeshStandardMaterial({color:0xffc2a5,metalness:.84,roughness:.2,side:THREE.DoubleSide}));
  group.add(silk);
  const chrome=new THREE.MeshStandardMaterial({color:0xf7e7dd,metalness:.95,roughness:.14});
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(.042,.042,4.65,32),chrome));
  const light=new THREE.DirectionalLight(0xffe7d6,2.8);light.position.set(-3,4,5);scene.add(light);
  group.rotation.z=-.23;
  let angle=.4, shape=mode, visible=false, pending=false, startX=null, last=0;
  function draw(now) {
    pending=false;
    if(!visible || document.hidden)return;
    const rect=mount.getBoundingClientRect();
    const progress=THREE.MathUtils.clamp((innerHeight-rect.top)/(innerHeight+rect.height),0,1);
    const elapsed=Math.min(now-last,50);last=now;
    shape=reducedMotion.matches?mode:THREE.MathUtils.damp(shape,mode,7,elapsed/1000);
    silk.morphTargetInfluences[0]=shape;
    group.rotation.y=angle+(reducedMotion.matches?0:progress*2.3);
    group.rotation.x=.12+shape*.24;
    renderer.render(scene,camera);
    if(Math.abs(shape-mode)>.001)requestDraw();
  }
  function requestDraw(){if(!pending && visible){pending=true;requestAnimationFrame(draw);}}
  refresh=requestDraw;
  new ResizeObserver(()=>{const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();requestDraw();}).observe(mount);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;requestDraw();}).observe(mount);
  addEventListener('scroll',requestDraw,{passive:true});
  document.addEventListener('visibilitychange',requestDraw);
  mount.onpointerdown=e=>{startX=e.clientX;mount.setPointerCapture(e.pointerId);};
  mount.onpointermove=e=>{if(startX!==null){angle+=(e.clientX-startX)*.012;startX=e.clientX;requestDraw();}};
  mount.onlostpointercapture=()=>{startX=null;};
  mount.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();angle+=e.key==='ArrowLeft'?-.25:.25;requestDraw();}};
}
try { build(new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'})); }
catch { mount.removeAttribute('tabindex');document.querySelector('.orbitCopy p').textContent='Выберите движение и посмотрите занятия в расписании.'; }
