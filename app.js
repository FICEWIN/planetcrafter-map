/* خريطة كوكب الصنعة — PWA مستقل */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const LANG = { cur: localStorage.getItem('pc_lang') || 'ar' };
const lang = () => LANG.cur;

const RESOURCES = [
  { id:'iridium', name: { ar:'إيريديوم', en:'Iridium' }, color:'#b91c1c', icon:'🔴', type:'ore' },
  { id:'sulfur', name: { ar:'كبريت', en:'Sulfur' }, color:'#eab308', icon:'🟡', type:'ore' },
  { id:'iron', name: { ar:'حديد', en:'Iron' }, color:'#64748b', icon:'⚪', type:'ore' },
  { id:'silicon', name: { ar:'سيليكون', en:'Silicon' }, color:'#f59e0b', icon='🟠', type:'ore' },
  { id:'osmium', name: { ar:'أسموديوم', en:'Osmium' }, color:'#3b82f6', icon='🔵', type:'ore' },
  { id:'urea', name: { ar:'يوريا', en:'Urea' }, color:'#10b981', icon='🟢', type:'plant' },
  { id:'seeds', name: { ar:'بذور', en:'Seeds' }, color:'#22c55e', icon='🌱', type:'plant' }
];

const MAP_BOUNDS = [[0,0],[1000,1000]];
const center = [500,500];
const map = L.map('map', { crs: L.CRS.Simple, minZoom:1, maxZoom:5 }).setView(center, 2);

L.rectangle(MAP_BOUNDS, {color:'#d4c5b8', weight:0, fill:true, fillColor:'#e7dfd6', fillOpacity:1}).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:5,noWrap:true}).addTo(map);

const layers = {};
RESOURCES.forEach(r => { layers[r.id] = L.layerGroup().addTo(map); });

function addResource(r, lat, lng, name='') {
  const marker = L.marker([lat,lng], {icon: L.divIcon({
    className:'', html:`<div style="font-size:1.4rem">${r.icon}</div>`, iconSize:[28,28], iconAnchor:[14,14]
  }))}.addTo(layers[r.id]);
  marker.bindPopup(`<b>${r.name[lang()]||r.name.ar}</b><br>${name||''}<br>${r.id}`);
}

const samples = [
  {r:'iridium',lat:180,lng:220,name:'صندوق إيريديوم 1'},
  {r:'iridium',lat:320,lng:410,name:'صندوق إيريديوم 2'},
  {r:'sulfur',lat:260,lng:340,name:'صندوق كبريت 1'},
  {r:'sulfur',lat:580,lng:710,name:'صندوق كبريت 2'},
  {r:'iron',lat:110,lng:90,name:'صندوق حديد'},
  {r:'silicon',lat:430,lng:150,name:'سيليكون'},
  {r:'osmium',lat:770,lng:840,name:'أسموديوم'},
  {r:'urea',lat:310,lng:890,name:'يوريا'},
  {r:'seeds',lat:620,lng:480,name:'بذور'}
];
samples.forEach(s=>{ const r=RESOURCES.find(x=>x.id===s.r); addResource(r,s.lat,s.lng,s.name); });

let active = RESOURCES.map(r=>r.id);
function applyFilter(){
  RESOURCES.forEach(r=>{ if(active.includes(r.id)) layers[r.id].addTo(map); else layers[r.id].removeFrom(map); });
}
function renderFilters(){
  document.getElementById('filters').innerHTML = RESOURCES.map(r=>`
<label><input type="checkbox" id="f-${r.id}" ${active.includes(r.id)?'checked':''}>${r.icon} ${r.name[lang()]||r.name.ar}</label>
`).join('');
  $$('#filters input').forEach(inp=>{
    inp.onchange=e=>{ active = $$('#filters input:checked').map(i=>i.id.replace('f-','')); applyFilter(); };
  });
}
document.getElementById('closeFilter').onclick=()=>{ document.getElementById('filterModal').hidden=true; };
document.getElementById('filterBtn').onclick=()=>{ renderFilters(); document.getElementById('filterModal').hidden=false; };
renderFilters();

const searchInput = document.getElementById('searchInput');
const results = document.getElementById('searchResults');
searchInput.oninput = e=>{
  const q = e.target.value.trim().toLowerCase();
  results.innerHTML='';
  if(!q) return;
  samples.filter(s=> (s.name||'').toLowerCase().includes(q) || s.r.includes(q)).forEach(s=>{
    const li=document.createElement('li');
    li.textContent = `${s.name} — ${RESOURCES.find(x=>x.id===s.r).name[lang()]||s.r}`;
    li.onclick=()=>{ map.setView([s.lat,s.lng],3); document.getElementById('searchBox').hidden=true; };
    results.appendChild(li);
  });
};
document.getElementById('searchBtn').onclick=()=>{ document.getElementById('searchBox').hidden=false; searchInput.focus(); };

const lb = document.getElementById('langBtn');
const ib = document.getElementById('installBtn');
function paintLang(){
  document.documentElement.lang = lang();
  document.documentElement.dir = lang()==='en'?'ltr':'rtl';
  lb.textContent = lang()==='en'?'عربي':'EN';
  lb.setAttribute('aria-label', lang()==='en'?'Switch to Arabic':'التبديل إلى الإنجليزية');
  renderFilters();
  document.querySelector('title').textContent = lang()==='en'?'Planet Crafter Map':'خريطة كوكب الصنعة';
}
lb.onclick=()=>{ LANG.cur = lang()==='ar'?'en':'ar'; localStorage.setItem('pc_lang',LANG.cur); paintLang(); };
paintLang();

let deferred = null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferred=e; ib.hidden=false; });
ib.onclick = async()=>{ if(!deferred)return; deferred.prompt(); try{await deferred.userChoice;}catch{} deferred=null; ib.hidden=true; };

map.on('click', e=>{
  const panel = document.getElementById('panel');
  const info = document.getElementById('info');
  info.innerHTML = `<p>الإحداثيات: ${Math.round(e.latlng.lat)}, ${Math.round(e.latlng.lng)}</p>`;
  panel.style.display='block';
});
document.getElementById('closePanel').onclick=()=>{ document.getElementById('panel').style.display='none'; };