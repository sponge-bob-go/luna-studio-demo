const classes = {
  "Пилон с нуля": [[1,20],[2,18],[4,19]],
  "Растяжка": [[0,18],[2,19],[4,18],[6,18]],
  "Танцы на пилоне": [[2,12],[2,20],[3,20],[4,12],[6,16],[6,17]],
  "Силовой пилон": [[0,19],[1,19],[3,19],[4,20],[5,12]],
  "Силовой пилон 12+": [[2,17],[5,13]],
  "Ягодицы и пресс": [[0,17],[3,18],[4,17]]
};
const days = ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
const el = id => document.getElementById(id);
const modal = el("dialog"), panel = el("panel"), key = "luna.demo.requests.v1";
const records = () => JSON.parse(localStorage.getItem(key) || "[]");
const calm = matchMedia('(prefers-reduced-motion: reduce)');
const easeOut = 'cubic-bezier(.2,.76,.18,1)';
function revealContent(node, delay = 0) {
  if (calm.matches) return;
  node.animate([{opacity:0, translate:'0 7px'}, {opacity:1, translate:'0 0'}],
    {duration:290, delay, easing:easeOut, fill:'backwards'});
}
function show(html) {
  const previousHeight = modal.open ? panel.offsetHeight : 0;
  panel.innerHTML = html;
  if (!modal.open) modal.showModal();
  else if (!calm.matches) {
    panel.getAnimations().forEach(animation => animation.cancel());
    revealContent(panel);
    // The journal may append rows immediately after show() returns.
    requestAnimationFrame(() => {
      if (modal.open && previousHeight) panel.animate(
        [{height: previousHeight + 'px'}, {height: panel.scrollHeight + 'px'}],
        {duration:290, easing:easeOut});
    });
  }
}
el("close").onclick = () => modal.close();
modal.onclick = event => { if (event.target === modal) { const r = modal.getBoundingClientRect(); if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) modal.close(); } };
function book(course, time) {
  show('<h3>Пробное занятие</h3><p>'+course+'<br>'+time+' · 400 ₽</p><form><label>Имя<input name="visitor" required maxlength="60" autocomplete="given-name"></label><label>Телефон или ник в VK / MAX<input name="contact" required maxlength="100"></label><small>Демо сохраняет заявку в этом браузере. Можно ввести вымышленные данные.</small><button>Оставить демо-заявку</button><p role="status"></p></form>');
  panel.querySelector("form").onsubmit = event => {
    event.preventDefault();
    const form = event.currentTarget, fields = new FormData(form);
    const name = fields.get("visitor").trim(), contact = fields.get("contact").trim();
    if (!name || !contact) {form.querySelector('[role=status]').textContent="Введите имя и контакт.";return;}
    try {
      const list = records();
      list.unshift({id:Date.now(),name,contact,course,time,confirmed:false});
      localStorage.setItem(key,JSON.stringify(list));
      show('<h3>Заявка сохранена</h3><p>'+course+'<br>'+time+'</p><small>Демо-заявка ожидает подтверждения.</small><button class="confirm">Посмотреть заявки</button>');
      panel.querySelector("button").onclick = admin;
    } catch { form.querySelector('[role=status]').textContent="Разрешите локальное хранение данных в браузере и попробуйте снова."; }
  };
}
let selectedCourse = '';
function select(course) {
  if (selectedCourse === course) return;
  const animateChange = Boolean(selectedCourse) && !calm.matches;
  selectedCourse = course;
  for (const b of el("filters").children) b.setAttribute("aria-pressed",String(b.textContent===course));
  el("caption").textContent=course;
  const photos = {"Растяжка":"red-stretch", "Ягодицы и пресс":"stretch", "Танцы на пилоне":"solo", "Силовой пилон":"inversion", "Силовой пилон 12+":"inversion"};
  const photo = el("classPhoto");
  const source = "assets/" + (photos[course] || "duet") + ".jpg";
  if (source !== photo.getAttribute("src")) {
    const frame = photo.parentElement;
    frame.querySelector('.outgoingPhoto')?.remove();
    const previous = photo.cloneNode(false);
    previous.removeAttribute('id');
    previous.className = 'outgoingPhoto';
    previous.alt = '';
    if (animateChange) photo.after(previous);
    photo.src = source;
    if (animateChange) photo.decode().catch(() => {}).then(() => {
      if (!previous.isConnected) return;
      const fade = previous.animate([{opacity:1},{opacity:0}], {duration:380,easing:easeOut,fill:'forwards'});
      fade.onfinish = () => previous.remove();
    });
  }
  if (animateChange) revealContent(el("caption"));
  el("slots").replaceChildren();
  for(const [day,hour] of classes[course]){
    const time=days[day]+", "+hour+":00";
    const b=document.createElement("button");b.className="slot";
    b.innerHTML='<span>'+days[day]+'</span><strong>'+hour+':00</strong><small>Выбрать <span class="ui-arrow ui-arrow--diagonal" aria-hidden="true"></span></small>';
    b.onclick=()=>book(course,time);el("slots").append(b);
    if (animateChange) revealContent(b, (el("slots").childElementCount - 1) * 24);
  }
}
for(const course of Object.keys(classes)){const b=document.createElement("button");b.textContent=course;b.onclick=()=>select(course);el("filters").append(b);}
select("Пилон с нуля");
function admin(){
  show("<h3>Заявки студии</h3><p>Демонстрационный журнал этого браузера.</p>");
  try{
    const list=records();
    if(!list.length)panel.insertAdjacentHTML("beforeend","<small>Пока пусто. Выберите занятие в расписании и оставьте пробную заявку.</small>");
    for(const item of list){
      const row=document.createElement("article");
      for(const value of [item.name,item.contact,item.course,item.time,item.confirmed?"Подтверждена":"Ожидает подтверждения"]){const p=document.createElement("p");p.textContent=value;row.append(p);}
      if(!item.confirmed){const b=document.createElement("button");b.className="confirm";b.textContent="Подтвердить";b.onclick=()=>{try{const data=records();const entry=data.find(r=>r.id===item.id);if(entry)entry.confirmed=true;localStorage.setItem(key,JSON.stringify(data));admin();}catch{b.textContent="Не удалось сохранить";}};row.append(b);}
      panel.append(row);
    }
  }catch{panel.insertAdjacentHTML("beforeend","<p>Журнал недоступен. Проверьте настройки хранилища браузера.</p>");}
}
el("admin").onclick=admin;

document.querySelectorAll('[data-course]').forEach(link => {
  link.addEventListener('click', () => select(link.dataset.course));
});

function showOrbitTimes(course) {
  const target = el("orbitTimes");
  target.replaceChildren();
  const shortDays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  for (const [day, hour] of classes[course].slice(0, 2)) {
    const button = document.createElement("button");
    button.textContent = shortDays[day] + " " + hour + ":00";
    button.setAttribute("aria-label", "Пробное: " + course + ", " + days[day] + ", " + hour + ":00");
    button.onclick = () => book(course, days[day] + ", " + hour + ":00");
    target.append(button);
    revealContent(button, (target.childElementCount - 1) * 45);
  }
}
showOrbitTimes(el("orbitCourse").dataset.course);
document.addEventListener("orbit-course", event => showOrbitTimes(event.detail));
