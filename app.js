const LS_KEY = 'bolkhata_v1';
let entries = [];
let pending = null;
let listening = false;
let recognition = null;

function todayStr(){ return new Date().toISOString().slice(0,10); }
function seed(){
  const t = todayStr();
  return [
    {id:1, date:t, customer:'Ramesh', item:'1 kilo chawal', amount:1000, type:'udhaar'},
    {id:2, date:t, customer:'Ramesh', item:'1 packet namak', amount:150, type:'udhaar'},
    {id:3, date:t, customer:'Rakesh', item:'2 kilo chini', amount:850, type:'udhaar'},
    {id:4, date:t, customer:'Suresh', item:'1 litre tel', amount:420, type:'udhaar'}
  ];
}
function load(){
  try { const raw = localStorage.getItem(LS_KEY); entries = raw ? JSON.parse(raw) : seed(); }
  catch(e){ entries = seed(); }
  if(!entries.length) entries = seed();
}
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(entries)); }
function totalDue(name){
  let s = 0;
  entries.forEach(function(e){ if(e.customer===name) s += (e.type==='udhaar' ? e.amount : -e.amount); });
  return s;
}
function customers(){
  const map = {};
  entries.forEach(function(e){ if(!map[e.customer]) map[e.customer]={name:e.customer,total:0,last:e.date,count:0}; });
  Object.keys(map).forEach(function(n){ map[n].total = totalDue(n); map[n].count = entries.filter(function(e){return e.customer===n;}).length; });
  return Object.values(map).sort(function(a,b){ return b.total - a.total; });
}
function speak(text){
  const el = document.getElementById('appReply');
  if(el) el.textContent = text;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'hi-IN'; u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch(e){}
}
function render(){
  const all = customers();
  let grand = 0; all.forEach(function(c){ grand += c.total; });
  document.getElementById('grandTotal').textContent = '₹' + grand.toLocaleString('en-IN');
  const t = todayStr();
  let tu = 0, tp = 0;
  entries.forEach(function(e){ if(e.date===t){ if(e.type==='udhaar') tu += e.amount; else tp += e.amount; } });
  document.getElementById('todayTotal').textContent = '₹' + tu;
  document.getElementById('todayPaid').textContent = '₹' + tp;
  const led = document.getElementById('ledger');
  led.innerHTML = '';
  all.forEach(function(c){
    const div = document.createElement('div');
    div.className = 'ledger-item';
    div.innerHTML = '<div class="ledger-top"><span>' + c.name + '</span><span class="amount-due">₹' + c.total + '</span></div><div class="ledger-sub">' + c.count + ' entries | Baaki: ₹' + c.total + '</div>';
    div.onclick = function(){ handleVoice(c.name + ' ka total kitna hai', 0.99); };
    led.appendChild(div);
  });
  const rem = document.getElementById('reminders');
  rem.innerHTML = '';
  all.filter(function(c){ return c.total > 0; }).forEach(function(c){
    const d = document.createElement('div');
    d.className = 'reminder';
    d.textContent = 'Namaste ' + c.name + ' ji, aapka ₹' + c.total + ' udhaar baaki hai. Kal tak de dena, dhanyavaad.';
    rem.appendChild(d);
  });
}
function toAscii(s){
  const map = {'०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9'};
  return s.replace(/[०-९]/g, function(ch){ return map[ch]; });
}
const WORD_NUM = {ek:1,do:2,teen:3,chaar:4,paanch:5,chhe:6,saat:7,aath:8,nau:9,das:10,bees:20,tees:30,chalis:40,pachaas:50,saath:60,sattar:70,assi:80,nabbe:90,sau:100,hazaar:1000,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100,thousand:1000};
function parseAmount(text){
  const m = text.match(/(\d[\d,]*)/);
  if(m) return parseInt(m[1].replace(/,/g,''), 10);
  const words = text.split(/\s+/);
  for(let i=0;i<words.length;i++){ if(WORD_NUM[words[i]]) return WORD_NUM[words[i]]; }
  return null;
}
function findName(text){
  const known = ['ramesh','rakesh','suresh','anita','mohan','sunita'];
  const found = known.filter(function(n){ return text.includes(n); });
  if(found.length===1) return found[0].charAt(0).toUpperCase() + found[0].slice(1);
  if(found.length>1) return 'AMBIGUOUS';
  return null;
}
function showConfirm(p){
  pending = p;
  document.getElementById('confirmCard').classList.remove('hidden');
  let txt = '';
  if(p.kind==='udhaar') txt = p.customer + ', udhaar ₹' + p.amount + ', total ₹' + (totalDue(p.customer)+p.amount) + '. Sahi hai?';
  if(p.kind==='payment') txt = p.customer + ' ne ₹' + p.amount + ' diye, baaki ₹' + (totalDue(p.customer)-p.amount) + '. Sahi hai?';
  if(p.amount>1000) txt += ' Amount bada hai, pakka confirm karo.';
  document.getElementById('confirmText').textContent = txt;
  speak(txt);
}
function hideConfirm(){ pending=null; document.getElementById('confirmCard').classList.add('hidden'); }
function handleVoice(rawText, confidence){
  const text = toAscii(String(rawText||'').toLowerCase().trim());
  document.getElementById('heardText').textContent = rawText || '—';
  if(!text){ speak('Phir se bolo, awaaz saaf nahi aayi.'); return; }
  if(confidence && confidence < 0.6){ speak('Phir se bolo, awaaz saaf nahi aayi. Maine suna: ' + rawText); return; }
  if(pending){
    if(text.includes('haan') || text.includes('sahi') || text.includes('yes')){ confirmYes(); return; }
    if(text.includes('nahi') || text.includes('galat') || text.includes('no')){ hideConfirm(); speak('Theek hai, cancel kar diya. Phir se bolo.'); return; }
  }
  if(text.includes('aaj ka udhaar') || text.includes('aaj ka hisaab') || text.includes('aaj ka hisab')){
    const list = customers().filter(function(c){return c.total>0;});
    if(!list.length){ speak('Aaj koi udhaar baaki nahi hai.'); return; }
    const parts = list.map(function(c){ return c.name + ' ' + c.total + ' rupaye'; });
    speak('Aaj ka udhaar: ' + parts.join(', ') + '.');
    return;
  }
  const name = findName(text);
  if(name==='AMBIGUOUS'){ speak('Ramesh ya Rakesh? Phir se naam bolo.'); return; }
  if(text.includes('total kitna') || text.includes('kitna hai') || text.includes('kitna baaki') || text.includes('kitna baki')){
    const n = name || 'Ramesh';
    const tot = totalDue(n);
    const last = entries.filter(function(e){return e.customer===n;}).slice(-3);
    speak(n + ' ka total ' + tot + ' rupaye baaki hai.');
    document.getElementById('appReply').textContent = n + ' ka total ₹' + tot + ' baaki hai. Last entries: ' + last.map(function(e){return e.item + ' ₹' + e.amount;}).join(', ');
    return;
  }
  const amount = parseAmount(text);
  if(!amount){ speak('Amount samajh nahi aaya. Phir se bolo, jaise 90 rupaye.'); return; }
  if(!name){
    speak('Naam samajh nahi aaya. Pehle naam bolo, jaise Ramesh ko 90 rupaye udhaar.');
    return;
  }
  let item = 'udhaar';
  const itemMatch = text.match(/kilo\s+([a-z]+)|([a-z]+)\s*,/);
  if(text.includes('atta')) item = 'atta';
  else if(text.includes('chini')) item = 'chini';
  else if(text.includes('chawal')) item = 'chawal';
  else if(text.includes('tel')) item = 'tel';
  else if(text.includes('dal')) item = 'dal';
  if(text.includes('de diye') || text.includes('de diya') || text.includes('payment') || text.includes('paise de')){
    showConfirm({kind:'payment', customer:name, amount:amount, item:item});
    return;
  }
  showConfirm({kind:'udhaar', customer:name, amount:amount, item:item});
}
function confirmYes(){
  if(!pending) return;
  const p = pending;
  entries.push({id: Date.now(), date: todayStr(), customer:p.customer, item:p.item, amount:p.amount, type:p.kind});
  save(); hideConfirm(); render();
  if(navigator.onLine===false){ speak('Offline save ho gaya, net aate hi sync hoga.'); }
  else { speak('Save ho gaya. ' + p.customer + ' ka total ab ' + totalDue(p.customer) + ' rupaye hai.'); }
}
function startListen(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ speak('Is browser me mic voice nahi chalega. Chrome use karo, ya demo button dabao.'); return; }
  if(listening){ try{ recognition.stop(); }catch(e){} return; }
  recognition = new SR();
  recognition.lang = 'hi-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = function(){ listening=true; document.getElementById('micBtn').classList.add('listening'); document.getElementById('listenStatus').textContent = 'Sun raha hoon... bolo.'; };
  recognition.onend = function(){ listening=false; document.getElementById('micBtn').classList.remove('listening'); document.getElementById('listenStatus').textContent = 'Mic band hai.'; };
  recognition.onresult = function(ev){
    const res = ev.results[0][0];
    handleVoice(res.transcript, res.confidence);
  };
  recognition.onerror = function(ev){ listening=false; document.getElementById('micBtn').classList.remove('listening'); speak('Mic me dikkat hai. Phir se try karo, ya demo button dabao.'); };
  try{ recognition.start(); }catch(e){ speak('Mic start nahi hua. Permission allow karo.'); }
}
function updateNet(){
  const el = document.getElementById('netStatus');
  if(navigator.onLine){ el.textContent = 'Online - sab save hoga'; el.style.background = '#1e7a4c'; }
  else { el.textContent = 'Offline - save ho jayega, net aate hi sync hoga'; el.style.background = '#b7791f'; }
}
document.getElementById('micBtn').addEventListener('click', startListen);
document.getElementById('yesBtn').addEventListener('click', confirmYes);
document.getElementById('noBtn').addEventListener('click', function(){ hideConfirm(); speak('Theek hai, cancel kar diya. Phir se bolo.'); });
document.querySelectorAll('.demo-btn').forEach(function(b){ b.addEventListener('click', function(){ handleVoice(b.getAttribute('data-say'), 0.99); }); });
document.getElementById('manualForm').addEventListener('submit', function(ev){
  ev.preventDefault();
  const name = document.getElementById('mName').value.trim();
  const item = document.getElementById('mItem').value.trim() || 'udhaar';
  const amount = parseInt(document.getElementById('mAmount').value, 10);
  const type = document.getElementById('mType').value;
  if(!name || !amount) return;
  entries.push({id: Date.now(), date: todayStr(), customer:name.charAt(0).toUpperCase()+name.slice(1), item:item, amount:amount, type:type});
  save(); render(); speak('Save ho gaya.');
  ev.target.reset();
});
document.getElementById('resetBtn').addEventListener('click', function(){ entries = seed(); save(); render(); speak('Demo data reset ho gaya.'); });
window.addEventListener('online', updateNet);
window.addEventListener('offline', updateNet);
load(); render(); updateNet();
