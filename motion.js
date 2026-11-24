const film = document.querySelector('.opening');
const stage = document.querySelector('.cover');
const title = stage.querySelector('.cover-title');
function fitTitle() {
  stage.style.setProperty('--title-width', (stage.clientWidth * .974) / title.offsetWidth);
}
document.fonts.ready.then(fitTitle);
new ResizeObserver(fitTitle).observe(stage);
const frames = [...document.querySelectorAll('[data-parallax]')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = value => Math.min(1, Math.max(0, value));

let queued = false;

const reel = document.querySelector('.reel');
const reelScreen = reel.querySelector('.reelScreen');
const pages = [...reel.querySelectorAll('.reelPage')];
const reelButtons = [...reel.querySelectorAll('[data-reel]')];
let manualPage = 0;
function drawReel() {
  const rect = reel.getBoundingClientRect();
  if (rect.top > innerHeight || rect.bottom < 0) return;
  const travel = Math.max(1, rect.height - reelScreen.offsetHeight);
  const position = reduced.matches ? manualPage : 2 * clamp(-rect.top / travel);
  pages.forEach((page, i) => {
    const reveal = i === 0 ? 1 : clamp((position - i + .72) / .44);
    page.style.setProperty('--open', reveal);
    page.style.setProperty('--pan', reduced.matches ? 0 : Math.max(-1,Math.min(1,position-i)));
    const inactive = i !== Math.round(position);
    if (page.inert !== inactive) {
      page.inert = inactive;
      reelButtons[i].setAttribute('aria-pressed', String(!inactive));
    }
  });
}
reelButtons.forEach((button,i) => {
  button.onclick = () => {
    manualPage = i;
    if (reduced.matches) drawReel();
    else scrollTo({top:scrollY+reel.getBoundingClientRect().top+(reel.offsetHeight-reelScreen.offsetHeight)*i/2,behavior:'smooth'});
  };
});

const trial = document.querySelector('.tariff-intro');
function drawTrial() {
  const rect = trial.getBoundingClientRect();
  if (rect.top >= innerHeight || rect.bottom <= 0) return;
  const travel = (innerHeight - rect.top) / (innerHeight + rect.height);
  trial.style.setProperty('--depth', reduced.matches ? 0 : travel * 2 - 1);
}
function paint() {
  drawReel();
  drawTrial();
  queued = false;
  const bounds = film.getBoundingClientRect();
  const distance = Math.max(1, bounds.height - stage.offsetHeight);
  const progress = reduced.matches ? 0 : clamp(-bounds.top / distance);
  if (bounds.bottom > 0 && bounds.top < innerHeight) {
    stage.style.setProperty('--progress', progress);
    const blend = clamp((progress - .16) / .68);
    stage.style.setProperty('--blend', blend * blend * (3 - 2 * blend));
  }
  for (const frame of frames) {
    const rect = frame.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < innerHeight) {
      const position = clamp((innerHeight - rect.top) / (innerHeight + rect.height));
      frame.style.setProperty('--drift', (reduced.matches ? 0 : (position - .5) * 30) + 'px');
    }
  }
}
function invalidate() {
  if (!queued) { queued = true; requestAnimationFrame(paint); }
}
addEventListener('scroll', invalidate, {passive:true});
addEventListener('resize', invalidate);
reduced.addEventListener('change', invalidate);
paint();

const sculptureMount = document.querySelector('#sculpt');
const loadSculpture = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) return;
  loadSculpture.disconnect();
  import('./sculpture.js?v=2').catch(() => {
    sculptureMount.removeAttribute('tabindex');
  });
}, {rootMargin:'320px'});
loadSculpture.observe(sculptureMount);
