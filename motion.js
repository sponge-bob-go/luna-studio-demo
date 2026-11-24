const film = document.querySelector('.film');
const stage = document.querySelector('.stage');
const cuts = [...document.querySelectorAll('[data-cut]')];
const frames = [...document.querySelectorAll('.schedule figure, .hallFrame, .pricePhoto, .entrance')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = value => Math.min(1, Math.max(0, value));
let still = 0;
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
    page.inert = i !== Math.round(position);
    reelButtons[i].setAttribute('aria-pressed', String(!page.inert));
  });
}
reelButtons.forEach((button,i) => {
  button.onclick = () => {
    manualPage = i;
    if (reduced.matches) drawReel();
    else scrollTo({top:scrollY+reel.getBoundingClientRect().top+(reel.offsetHeight-reelScreen.offsetHeight)*i/2,behavior:'smooth'});
  };
});
function paint() {
  drawReel();
  queued = false;
  const bounds = film.getBoundingClientRect();
  const distance = Math.max(1, bounds.height - stage.offsetHeight);
  const progress = reduced.matches ? still : clamp(-bounds.top / distance);
  stage.style.setProperty('--progress', progress);
  stage.style.setProperty('--wipe', clamp((progress - .16) / .68));
  cuts.forEach((button, index) => button.setAttribute('aria-pressed', String(index === Math.round(progress))));
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
cuts.forEach((button, index) => {
  button.onclick = () => {
    still = index;
    if (reduced.matches) paint();
    else scrollTo({top:scrollY + film.getBoundingClientRect().top + index * (film.offsetHeight - stage.offsetHeight),behavior:'smooth'});
  };
});
addEventListener('scroll', invalidate, {passive:true});
addEventListener('resize', invalidate);
reduced.addEventListener('change', invalidate);
paint();

// Keep one moving selection surface per control, including wrapped filter rows.
for (const group of document.querySelectorAll('.filters, .modes, .reelControls')) {
  function alignSelection() {
    const active = group.querySelector('[aria-pressed="true"]');
    if (!active) return;
    group.style.setProperty('--pill-x', active.offsetLeft + 'px');
    group.style.setProperty('--pill-y', active.offsetTop + 'px');
    group.style.setProperty('--pill-width', active.offsetWidth + 'px');
    group.style.setProperty('--pill-height', active.offsetHeight + 'px');
    group.classList.add('selectionTrack');
  }
  new ResizeObserver(alignSelection).observe(group);
  new MutationObserver(changes => {
    if (changes.some(change => change.oldValue !== change.target.getAttribute('aria-pressed'))) alignSelection();
  }).observe(group,{subtree:true,attributes:true,attributeFilter:['aria-pressed'],attributeOldValue:true});
  alignSelection();
}
