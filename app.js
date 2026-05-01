
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut as fbSignOut, indexedDBLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FB = { apiKey:"AIzaSyAYit-D2L4WL9EGyxIoLj3XmIlnVFQWgiQ", authDomain:"flow-dashboard-83f95.firebaseapp.com", projectId:"flow-dashboard-83f95", storageBucket:"flow-dashboard-83f95.firebasestorage.app", messagingSenderId:"397280852022", appId:"1:397280852022:web:e015175ca72fa66fe20097" };
const app = initializeApp(FB);
const auth = getAuth(app);
const db = getFirestore(app);
const prov = new GoogleAuthProvider();
prov.setCustomParameters({ prompt: 'select_account' });
auth.useDeviceLanguage();
setPersistence(auth, indexedDBLocalPersistence).catch(e => console.log('Persistence:', e));

const FAMILY_UID = 'bBBPgVPurfdxth5b03EZtX66VLI2';
const PARENT_EMAILS = ['shashwat.b@gmail.com', 'ila.badoni@gmail.com'];
const DEFAULT_TASKS = [
  {text:'\uD83D\uDCDA Complete homework', done:false},
  {text:'\uD83C\uDFC3 Physical activity (30 mins)', done:false},
  {text:'\uD83E\uDD57 Clean, healthy food choices', done:false},
  {text:'\uD83D\uDCF1 Take permission before using devices', done:false},
  {text:'\u2764\uFE0F Show kindness to staff and guards', done:false}
];
const LEVELS = [
  {name:'Rookie', emoji:'\uD83E\uDD49', weeks:0, next:5},
  {name:'Explorer', emoji:'\uD83D\uDDFA\uFE0F', weeks:5, next:10},
  {name:'Warrior', emoji:'\u2694\uFE0F', weeks:10, next:20},
  {name:'Hero', emoji:'\uD83E\uDDB8', weeks:20, next:30},
  {name:'Champion', emoji:'\uD83C\uDFC6', weeks:30, next:null}
];
const MOOD_COLORS = {great:'#34d399', good:'#a78bfa', ok:'#fbbf24', low:'#f97316', sad:'#f87171'};
const MOOD_EMOJIS = {great:'\uD83D\uDE04', good:'\uD83D\uDE0A', ok:'\uD83D\uDE10', low:'\uD83D\uDE1F', sad:'\uD83D\uDE22'};

const MOS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
let now = new Date(), cY = now.getFullYear(), cM = now.getMonth();
let uid = null, isParent = false, kidName = '';
let tasks=[], habits=[], notes=[], reminders=[], bills=[], energy={};
let iT=[], iR={emoji:"\uD83C\uDF81",name:"Complete all tasks!",sub:"Budget: \u20B91,000",value:1000};
let selR2={emoji:"\uD83C\uDF66",name:"Ice Cream",sub:"Any flavour, up to \u20B9300",value:300};
let honoured=false;
let bk={balance:0,transactions:[],pending:[]};
let wa1='', wa2='', pin='';
let savingsGoal={name:'',target:0};
let streak=0, bookRating=5;
let moodData={}, photoData=[], bookData=[], groceryData=[], famGoals=[];
let selMoodVal='', selMoodCats=[];
let pendingPhotoData='';

// EmailJS
window.addEventListener('load', () => { if(typeof emailjs!=='undefined') emailjs.init({publicKey:'V9NqLDtVaGzB173ee'}); });

// Toast
let toastTimer;
function toast(msg, type='ok') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// Confetti
function launchConfetti() {
  const c = document.getElementById('confetti-container');
  c.innerHTML = '';
  const colors = ['#7c6ef7','#a78bfa','#38bdf8','#f59e0b','#34d399','#f87171'];
  for(let i=0;i<80;i++) {
    const el = document.createElement('div');
    el.className='cp';
    el.style.cssText=`left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*1.5}s;animation-duration:${2+Math.random()*2}s;transform:rotate(${Math.random()*360}deg)`;
    c.appendChild(el);
  }
  setTimeout(()=>c.innerHTML='', 5000);
}

function showApprovalBanner(item) {
  const msgs={reward_claim:`\uD83C\uDF89 Reward approved! \u20B9${item.amount}`,withdrawal:`\uD83D\uDCB8 Withdrawal of \u20B9${item.amount} approved!`,achievement:`\uD83C\uDFC6 Achievement approved! \u20B9${item.amount} added!`};
  document.getElementById('abanner-text').textContent = msgs[item.type]||`\u2705 \u20B9${item.amount} approved!`;
  document.getElementById('abanner').classList.add('show');
  launchConfetti();
  setTimeout(()=>document.getElementById('abanner').classList.remove('show'), 6000);
}

// Redirect result
getRedirectResult(auth).then(r => {
  if(r&&r.user) console.log('Redirect sign-in:', r.user.email);
}).catch(e => {
  if(e.code!=='auth/no-current-user'&&e.code!=='auth/null-user') {
    console.error('Redirect error:', e.code);
    if(e.code==='auth/unauthorized-domain') toast('Domain not authorized in Firebase', 'err');
  }
});

function isStandalone() { return window.navigator.standalone===true||window.matchMedia('(display-mode: standalone)').matches; }

window.doSignIn = async () => {
  const btn = document.getElementById('signin-btn');
  btn.textContent = 'Signing in...'; btn.style.opacity='0.7'; btn.style.pointerEvents='none';
  try {
    await setPersistence(auth, indexedDBLocalPersistence);
    await signInWithPopup(auth, prov);
  } catch(e) {
    btn.innerHTML=`<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Continue with Google`;
    btn.style.opacity='1'; btn.style.pointerEvents='auto';
    if(e.code!=='auth/popup-closed-by-user'&&e.code!=='auth/cancelled-popup-request') alert('Sign-in error: '+e.code);
  }
};
window.doSignOut = async () => await fbSignOut(auth);

onAuthStateChanged(auth, user => {
  if(user) {
    uid = user.uid;
    isParent = PARENT_EMAILS.includes(user.email);
    document.getElementById('ls').style.display='none';
    if(isParent) {
      document.getElementById('db-parent').style.display='block';
      document.getElementById('db-kid').style.display='none';
      const a=document.getElementById('av-parent');
      if(user.photoURL)a.innerHTML=`<img src="${user.photoURL}">`;else a.textContent=(user.displayName||'P')[0];
      initDash();
    } else {
      document.getElementById('db-parent').style.display='none';
      document.getElementById('db-kid').style.display='block';
      const a=document.getElementById('av-kid');
      if(user.photoURL)a.innerHTML=`<img src="${user.photoURL}">`;else a.textContent=(user.displayName||user.email[0].toUpperCase())[0];
      kidName=(user.displayName||'').split(' ')[0]||'Ishaan';
      document.getElementById('kid-greeting').textContent=`Hey ${kidName}! \uD83C\uDF1F`;
    }
    listen();
    checkAutoReset();
  } else {
    uid=null;
    document.getElementById('ls').style.display='flex';
    document.getElementById('db-parent').style.display='none';
    document.getElementById('db-kid').style.display='none';
    const btn=document.getElementById('signin-btn');
    btn.innerHTML=`<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Continue with Google`;
    btn.style.opacity='1'; btn.style.pointerEvents='auto';
  }
});

function checkAutoReset() {
  const lastReset=localStorage.getItem('flow_last_reset');
  const today=now.toISOString().slice(0,10);
  if(now.getDay()===1&&lastReset!==today) {
    localStorage.setItem('flow_last_reset',today);
    setTimeout(()=>{
      if(iT.length>0&&iT.every(t=>t.done)) streak=(streak||0)+1;
      iT=iT.length===0?DEFAULT_TASKS.map((t,i)=>({id:Date.now()+i,...t})):iT.map(t=>({...t,done:false}));
      svO('iT',{items:iT,reward:iR,streak,savingsGoal,lastReset:today});
      sendWeeklySummary();
      toast('New week! Tasks reset automatically.');
    },2000);
  }
}

function setSyn(s) { const el=document.getElementById('ss'); if(el)el.innerHTML=s?'<span class="sd syn"></span><span style="color:var(--t3)">Syncing...</span>':'<span class="sd"></span><span style="color:var(--t3)">Synced</span>'; }
async function sv(col,items){if(!uid)return;setSyn(true);try{await setDoc(doc(db,"users",FAMILY_UID,col,"data"),{items});setSyn(false);}catch(e){console.error(e);}}
async function svO(col,obj){if(!uid)return;setSyn(true);try{await setDoc(doc(db,"users",FAMILY_UID,col,"data"),obj);setSyn(false);}catch(e){console.error(e);}}

function listen() {
  ['tasks','habits','notes','reminders','iT','bk','cfg','mood','photos','books','grocery','famGoals','energy'].forEach(col=>{
    onSnapshot(doc(db,"users",FAMILY_UID,col,"data"),snap=>{
      if(!snap.exists()){
        if(col==='habits'){habits=[{id:1,name:"Meditate",done:[],emoji:"\uD83E\uDDD8"},{id:2,name:"Exercise",done:[],emoji:"\uD83D\uDCAA"},{id:3,name:"Read",done:[],emoji:"\uD83D\uDCD6"},{id:4,name:"Hydrate",done:[],emoji:"\uD83D\uDCA7"}];sv('habits',habits);}
        if(col==='iT'){iT=DEFAULT_TASKS.map((t,i)=>({id:Date.now()+i,...t}));svO('iT',{items:iT,reward:iR,streak:0,savingsGoal:{},lastReset:''});}
        return;
      }
      const d=snap.data();
      if(col==='tasks'){tasks=d.items||[];renderTasks();}
      else if(col==='habits'){habits=d.items||[];renderHabits();}
      else if(col==='notes'){notes=d.items||[];renderNotes();}
      else if(col==='reminders'){reminders=d.items||[];renderRems();renderCal();}
      else if(col==='iT'){iT=d.items||[];iR=d.reward||iR;streak=d.streak||0;savingsGoal=d.savingsGoal||{};renderIT();updIS();updRUI();updStreak();updLevel();updSavingsGoal();}
      else if(col==='bk'){
        if(!isParent&&bk.pending){
          const oldApprovedIds=(bk.pending||[]).filter(p=>p.status==='approved').map(p=>p.id);
          (d.pending||[]).filter(p=>p.status==='approved').forEach(p=>{if(!oldApprovedIds.includes(p.id))showApprovalBanner(p);});
        }
        bk=d;renderBank();
      }
      else if(col==='cfg'){wa1=d.wa1||'';wa2=d.wa2||'';pin=d.pin||'';const e1=document.getElementById('wan1');const e2=document.getElementById('wan2');if(e1)e1.value=wa1;if(e2)e2.value=wa2;}
      else if(col==='mood'){moodData=d.entries||{};renderMoodCalendars();renderMoodChart();renderMoodEntries();}
      else if(col==='photos'){photoData=d.items||[];renderPhotos();}
      else if(col==='books'){bookData=d.items||[];renderBooks();}
      else if(col==='grocery'){groceryData=d.items||[];renderGrocery();}
      else if(col==='famGoals'){famGoals=d.items||[];renderFamGoals();}
      else if(col==='energy'){energy=d.entries||{};renderEnergyChart();updEnergyToday();}
      updStats();
    });
  });
}

function initDash() {
  const h=now.getHours(),g=h<12?'Good morning':h<17?'Good afternoon':'Good evening';
  document.getElementById('gtx').textContent=g+' \u2726';
  document.getElementById('gsb').textContent=DYS[now.getDay()]+', '+MOS[now.getMonth()]+' '+now.getDate();
  renderCal();
}

function updStats() {
  const st=document.getElementById('st');if(st)st.textContent=tasks.filter(t=>!t.done).length;
  const sr=document.getElementById('sr');if(sr)sr.textContent=reminders.length;
  const tk=tdKey(),tH=habits.length,dH=tH?habits.filter(h=>h.done&&h.done.includes(tk)).length:0;
  const sh=document.getElementById('sh');if(sh)sh.textContent=(tH?Math.round(dH/tH*100):0)+'%';
  const tT=tasks.length,dT=tasks.filter(t=>t.done).length;
  const op=document.getElementById('op');if(op)op.style.width=(tT?Math.round(dT/tT*100):0)+'%';
}

function updStreak() {
  const s=streak||0;
  const el=document.getElementById('kid-streak');if(el)el.textContent=`\uD83D\uDD25 ${s} week streak`;
  const sel=document.getElementById('streak-display');if(sel)sel.textContent=`\uD83D\uDD25 ${s} week streak`;
}

function updLevel() {
  const s=streak||0;
  let lvl=LEVELS[0];
  for(const l of LEVELS){if(s>=l.weeks)lvl=l;}
  const badge=document.getElementById('level-badge');
  const ltxt=document.getElementById('level-text');
  const lnxt=document.getElementById('level-next');
  if(badge&&ltxt&&lnxt){
    badge.querySelector('.level-emoji').textContent=lvl.emoji;
    ltxt.textContent=lvl.name;
    if(lvl.next){
      const nextLvl=LEVELS.find(l=>l.weeks===lvl.next);
      lnxt.textContent=`${lvl.next-s} more weeks to ${nextLvl?.name}`;
    } else {
      lnxt.textContent='You are a Champion! \uD83C\uDFC6';
    }
  }
}

function updSavingsGoal() {
  const has=savingsGoal&&savingsGoal.name&&savingsGoal.target>0;
  const bal=bk.balance||0;
  ['kid-sg-section','kid-sg-bank'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=has?'block':'none';});
  if(has){
    const pct=Math.min(100,Math.round(bal/savingsGoal.target*100));
    ['sg-name','sg-name-bank'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=savingsGoal.name;});
    ['sg-current','sg-cur-bank'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=bal;});
    ['sg-target','sg-tgt-bank'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=savingsGoal.target;});
    ['sg-fill','sg-fill-bank'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.width=pct+'%';});
  }
}

window.setSavingsGoal=()=>{
  const name=document.getElementById('sg-name-inp').value.trim(),amt=parseInt(document.getElementById('sg-amt-inp').value);
  if(!name||!amt){toast('Enter a goal name and amount','err');return;}
  savingsGoal={name,target:amt};
  svO('iT',{items:iT,reward:iR,streak,savingsGoal,lastReset:localStorage.getItem('flow_last_reset')||''});
  document.getElementById('sg-name-inp').value='';document.getElementById('sg-amt-inp').value='';
  toast('Savings goal set!');
};

// TASKS
window.addTask=()=>{const inp=document.getElementById('tinp'),txt=inp.value.trim();if(!txt)return;tasks.unshift({id:Date.now(),text:txt,done:false,priority:document.getElementById('tpri').value});inp.value='';sv('tasks',tasks);};
window.togTask=id=>{const t=tasks.find(x=>x.id===id);if(t)t.done=!t.done;sv('tasks',tasks);};
window.delTask=id=>{tasks=tasks.filter(x=>x.id!==id);sv('tasks',tasks);};
function renderTasks(){
  const el=document.getElementById('tl');if(!el)return;
  if(!tasks.length){el.innerHTML='<div class="es">No tasks yet!</div>';return;}
  el.innerHTML=tasks.map(t=>`<div class="titem ${t.done?'dn':''}"><div class="ck ${t.done?'on':''}" onclick="togTask(${t.id})"><svg class="cksv" width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="tt">${t.text}</span><div class="pd ${t.priority==='high'?'ph2':t.priority==='low'?'pl2':'pm'}"></div><button class="tdel" onclick="delTask(${t.id})">\u2715</button></div>`).join('');
}

// HABITS
function tdKey(){return now.toISOString().slice(0,10);}
function wkDays(){const a=[];for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);a.push(d);}return a;}
window.addHabit=()=>{const inp=document.getElementById('hinp'),txt=inp.value.trim();if(!txt)return;habits.push({id:Date.now(),name:txt,done:[],emoji:'\u2726'});inp.value='';sv('habits',habits);};
window.togHabit=(id,k)=>{const h=habits.find(x=>x.id===id);if(!h)return;if(!h.done)h.done=[];const i=h.done.indexOf(k);if(i>-1)h.done.splice(i,1);else h.done.push(k);sv('habits',habits);};
function renderHabits(){
  const el=document.getElementById('hg');if(!el)return;
  if(!habits.length){el.innerHTML='<div class="es">Add habits to track</div>';return;}
  const days=wkDays(),tk=tdKey();
  el.innerHTML=habits.map(h=>{const dn=h.done||[],dc=days.filter(d=>dn.includes(d.toISOString().slice(0,10))).length;const pct=Math.round(dc/7*100),pc=pct>=70?'var(--ok)':pct>=40?'var(--warn)':'var(--err)';return`<div class="hr"><span class="hn">${h.emoji} ${h.name.length>9?h.name.slice(0,8)+'\u2026':h.name}</span><div class="hds">${days.map(d=>{const k=d.toISOString().slice(0,10);return`<div class="hd ${dn.includes(k)?'on':''} ${k===tk?'td2':''}" onclick="togHabit(${h.id},'${k}')">${d.getDate()}</div>`;}).join('')}</div><span class="hp" style="color:${pc}">${pct}%</span></div>`;}).join('');
}

// NOTES
window.openNote=()=>{document.getElementById('ne2').classList.add('on');document.getElementById('nnb').style.display='none';};
window.closeNote=()=>{document.getElementById('ne2').classList.remove('on');document.getElementById('nnb').style.display='block';document.getElementById('nti').value='';document.getElementById('nbi').value='';};
window.saveNote=()=>{const t=document.getElementById('nti').value.trim(),b=document.getElementById('nbi').value.trim();if(!t&&!b)return;notes.unshift({id:Date.now(),title:t||'Untitled',body:b,created:new Date().toISOString()});sv('notes',notes);closeNote();};
window.delNote=id=>{notes=notes.filter(n=>n.id!==id);sv('notes',notes);};
function renderNotes(){
  const el=document.getElementById('nl2');if(!el)return;
  if(!notes.length){el.innerHTML='<div class="es">No notes yet</div>';return;}
  el.innerHTML=notes.map(n=>`<div class="nc"><div style="display:flex;justify-content:space-between"><div class="nt2">${n.title}</div><button onclick="delNote(${n.id})" style="background:transparent;border:none;cursor:pointer;color:var(--t3);font-size:13px">\u2715</button></div><div class="np">${n.body||'\u2014'}</div><div class="nm">${new Date(n.created).toLocaleDateString('en',{month:'short',day:'numeric'})}</div></div>`).join('');
}

// BILLS
window.addBill=()=>{
  const name=document.getElementById('bill-name').value.trim(),date=document.getElementById('bill-date').value,amt=document.getElementById('bill-amt').value;
  if(!name)return;
  bills.push({id:Date.now(),name,date,amount:amt?parseInt(amt):0,paid:false});
  document.getElementById('bill-name').value='';document.getElementById('bill-date').value='';document.getElementById('bill-amt').value='';
  sv('reminders',reminders);renderBills();toast('Bill reminder added!');
};
window.togBill=id=>{const b=bills.find(x=>x.id===id);if(b)b.paid=!b.paid;renderBills();};
function renderBills(){
  const el=document.getElementById('bill-list');if(!el)return;
  if(!bills.length){el.innerHTML='<div class="es">No bill reminders yet</div>';return;}
  el.innerHTML=bills.map(b=>`<div class="titem ${b.paid?'dn':''}"><div class="ck ${b.paid?'on':''}" onclick="togBill(${b.id})"><svg class="cksv" width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="tt">${b.name}${b.amount?` \u2014 \u20B9${b.amount}`:''}</span><span style="font-size:11px;color:var(--t3)">${b.date?new Date(b.date).toLocaleDateString('en',{month:'short',day:'numeric'}):''}</span></div>`).join('');
}

// ENERGY TRACKER
window.logEnergy=level=>{
  const today=tdKey();
  energy[today]=level;
  svO('energy',{entries:energy});
  updEnergyToday();renderEnergyChart();
  toast('Energy logged!');
};
function updEnergyToday(){
  const today=tdKey(),level=energy[today];
  ['low','med','hi'].forEach(l=>{const el=document.getElementById('egy-'+l);if(el){el.style.filter='grayscale(60%)';el.style.border='2px solid transparent';}});
  if(level){
    const map={low:'low',medium:'med',high:'hi'};
    const el=document.getElementById('egy-'+map[level]);
    if(el){el.style.filter='none';el.style.border='2px solid var(--a2)';el.style.background='rgba(124,110,247,0.15)';}
  }
}
function renderEnergyChart(){
  const el=document.getElementById('energy-chart');if(!el)return;
  const days=wkDays();
  const colors={low:'#f87171',medium:'#fbbf24',high:'#34d399'};
  const heights={low:20,medium:40,high:60};
  el.innerHTML=days.map(d=>{
    const k=d.toISOString().slice(0,10),level=energy[k];
    const h=level?heights[level]:4,c=level?colors[level]:'var(--gb)';
    return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="width:100%;height:${h}px;background:${c};border-radius:3px 3px 0 0"></div><div style="font-size:9px;color:var(--t3)">${d.getDate()}</div></div>`;
  }).join('');
}

// REMINDERS
const TICONS={work:'\uD83D\uDCBC',health:'\uD83C\uDF3F',personal:'\u2B50',urgent:'\u26A1'};
const TCLS={work:'rpu',health:'rbl',personal:'ram',urgent:'rrd'};
const TCSS={work:'tw2',health:'th',personal:'tp',urgent:'tu'};
function fmtRT(iso){const d=new Date(iso),diff=Math.round((d-new Date())/60000);if(diff<0)return'Past due';if(diff<60)return`In ${diff}m`;if(diff<1440)return`In ${Math.round(diff/60)}h`;return d.toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
window.openRemMo=()=>{const v=document.getElementById('rinp').value.trim();if(v)document.getElementById('rm-t').value=v;const def=new Date();def.setHours(def.getHours()+1,0,0,0);document.getElementById('rm-d').value=def.toISOString().slice(0,16);openMo('mo-rem');};
window.saveRem=()=>{const t=document.getElementById('rm-t').value.trim(),d=document.getElementById('rm-d').value,tag=document.getElementById('rm-tag').value;if(!t)return;reminders.unshift({id:Date.now(),title:t,time:d?new Date(d).toISOString():new Date().toISOString(),tag});reminders.sort((a,b)=>new Date(a.time)-new Date(b.time));sv('reminders',reminders);closeMo('mo-rem');};
window.delRem=id=>{reminders=reminders.filter(r=>r.id!==id);sv('reminders',reminders);};
function renderRems(){
  const el=document.getElementById('rl');if(!el)return;
  if(!reminders.length){el.innerHTML='<div class="es">No upcoming reminders</div>';return;}
  el.innerHTML=reminders.slice(0,5).map(r=>`<div class="ri2"><div class="ric ${TCLS[r.tag]||'rpu'}">${TICONS[r.tag]||'\uD83D\uDCCC'}</div><div class="rct"><div class="rtl">${r.title}</div><div class="rtm">${fmtRT(r.time)}</div><span class="rtg ${TCSS[r.tag]||'tw2'}">${r.tag}</span></div><button onclick="delRem(${r.id})" style="background:transparent;border:none;cursor:pointer;color:var(--t3);font-size:12px;align-self:flex-start">\u2715</button></div>`).join('');
}

// CALENDAR
window.chMo=d=>{cM+=d;if(cM>11){cM=0;cY++;}if(cM<0){cM=11;cY--;}renderCal();};
function renderCal(){
  const el=document.getElementById('clbl');if(!el)return;
  el.textContent=MOS[cM]+' '+cY;
  const first=new Date(cY,cM,1),last=new Date(cY,cM+1,0),sd=first.getDay();
  const evD=new Set(reminders.map(r=>{const d=new Date(r.time);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}));
  let cells='',prev=new Date(cY,cM,0).getDate();
  for(let i=sd-1;i>=0;i--)cells+=`<div class="cc om">${prev-i}</div>`;
  for(let d=1;d<=last.getDate();d++){const isT=d===now.getDate()&&cM===now.getMonth()&&cY===now.getFullYear();const hasE=evD.has(cY+'-'+(cM+1)+'-'+d);cells+=`<div class="cc ${isT?'td3':''} ${hasE?'he':''}">${d}</div>`;}
  const rem=(7-((sd+last.getDate())%7))%7;for(let i=1;i<=rem;i++)cells+=`<div class="cc om">${i}</div>`;
  document.getElementById('cg').innerHTML=cells;
}

// ISHAAN TASKS
window.addIT=()=>{const inp=document.getElementById('itinp'),txt=inp.value.trim();if(!txt)return;iT.push({id:Date.now(),text:txt,done:false});inp.value='';svIT();toast('Task added!');};
window.togIT=id=>{
  const t=iT.find(x=>x.id===id);if(!t)return;t.done=!t.done;svIT();
  if(iT.length>0&&iT.every(t=>t.done)){setTimeout(()=>{launchConfetti();showRewardMo();},300);}
};
window.delIT=id=>{iT=iT.filter(x=>x.id!==id);svIT();};
function svIT(){svO('iT',{items:iT,reward:iR,streak:streak||0,savingsGoal,lastReset:localStorage.getItem('flow_last_reset')||''});}

window.selR=(el,emoji,name,sub,value)=>{document.querySelectorAll('.ro').forEach(o=>o.classList.remove('on'));el.classList.add('on');selR2={emoji,name,sub,value};};
window.setCustomR=()=>{const name=document.getElementById('crn').value.trim(),emoji=document.getElementById('cre').value.trim()||'\uD83C\uDF81',value=parseInt(document.getElementById('crv').value)||1000;if(!name)return;selR2={emoji,name,sub:`Up to \u20B9${value}`,value};document.querySelectorAll('.ro').forEach(o=>o.classList.remove('on'));document.getElementById('crn').value='';document.getElementById('cre').value='';document.getElementById('crv').value='';toast(`Reward "${name}" selected \u2705`);};
window.saveReward=()=>{iR=selR2;svIT();updRUI();toast('Reward saved!');};
window.resetWeek=()=>{iT=iT.map(t=>({...t,done:false}));svIT();toast('Week reset!');};

function updRUI(){
  ['rpe','kid-reward-emoji'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=iR.emoji;});
  ['rpn','kid-reward-name'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=iR.name;});
  ['rps','kid-reward-sub'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=iR.sub;});
}

function renderIT(){
  const pel=document.getElementById('itl-parent');
  if(pel){if(!iT.length){pel.innerHTML='<div class="es">No tasks set yet</div>';}else{pel.innerHTML=iT.map(t=>`<div class="titem ${t.done?'dn':''}"><div class="ck ${t.done?'on':''}">${t.done?'<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}</div><span class="tt">${t.text}</span></div>`).join('');}}
  const kel=document.getElementById('kid-task-list');
  if(kel){if(!iT.length){kel.innerHTML='<div class="es">No tasks yet!</div>';}else{kel.innerHTML=iT.map(t=>`<div class="titem ${t.done?'dn':''}" onclick="togIT(${t.id})" style="cursor:pointer;padding:14px"><div class="ck ${t.done?'on':''}" style="width:22px;height:22px;border-radius:6px">${t.done?'<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}</div><span class="tt" style="font-size:15px">${t.text}</span></div>`).join('');}}
}

function updIS(){
  const total=iT.length,done=iT.filter(t=>t.done).length,pct=total?Math.round(done/total*100):0;
  ['ipf2','kid-prog'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.width=pct+'%';});
  const kp=document.getElementById('kid-pct');if(kp)kp.textContent=pct+'%';
  const ibp=document.getElementById('ibp');if(ibp)ibp.textContent=pct+'%';
  const itc=document.getElementById('itc');if(itc)itc.textContent=`${done} of ${total} done`;
  checkGameUnlock();
}

// REWARD MODAL
function showRewardMo(){
  document.getElementById('rme').textContent=iR.emoji;
  document.getElementById('rmn').textContent=iR.name+' '+iR.emoji;
  document.getElementById('rmsb').textContent=iR.sub;
  honoured=false;
  document.getElementById('hck').classList.remove('on');
  document.getElementById('clbtn').disabled=true;
  document.getElementById('bibtn').disabled=true;
  openMo('mo-reward');
}
window.togHonour=()=>{honoured=!honoured;document.getElementById('hck').classList.toggle('on',honoured);document.getElementById('clbtn').disabled=!honoured;document.getElementById('bibtn').disabled=!honoured;};
window.claimNow=()=>{
  if(!honoured)return;
  const amt=iR.value||1000;
  if(!bk.pending)bk.pending=[];
  bk.pending.push({id:Date.now(),type:'reward_claim',title:`Reward: ${iR.name}`,amount:amt,status:'pending',date:new Date().toISOString()});
  svO('bk',bk);
  sendEmail(`\uD83C\uDF89 ${kidName} completed all weekly tasks! Wants to claim: ${iR.name} (\u20B9${amt}). Approve at: https://shashwatbadoni.github.io/flow`);
  closeMo('mo-reward');
  setTimeout(()=>goKidPg('bank',document.querySelectorAll('#db-kid .ntab')[4]),800);
};
window.bankIt=()=>{
  if(!honoured)return;
  const amt=iR.value||1000;
  if(!bk.transactions)bk.transactions=[];
  if(!bk.balance)bk.balance=0;
  bk.balance+=amt;
  bk.transactions.unshift({id:Date.now(),type:'in',emoji:'\uD83C\uDFC6',title:`Banked reward: ${iR.name}`,amount:amt,date:new Date().toISOString(),status:'approved'});
  svO('bk',bk);
  toast(`\u20B9${amt} banked! \uD83C\uDFE6 Balance: \u20B9${bk.balance}`);
  closeMo('mo-reward');
  setTimeout(()=>goKidPg('bank',document.querySelectorAll('#db-kid .ntab')[4]),800);
};

// BANK
function renderBank(){
  const bal=bk.balance||0;
  ['bbd','ibs','kid-bal','wdav'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=bal;});
  const txns=bk.transactions||[];
  document.getElementById('bte').textContent=txns.filter(t=>t.type==='in'&&t.status==='approved').reduce((a,t)=>a+t.amount,0);
  document.getElementById('btw').textContent=txns.filter(t=>t.type==='out'&&t.status==='approved').reduce((a,t)=>a+t.amount,0);
  document.getElementById('btp').textContent=(bk.pending||[]).filter(p=>p.status==='pending').reduce((a,p)=>a+p.amount,0);
  const txHTML=txns.length?txns.slice(0,20).map(t=>`<div class="ti2"><div class="tic ${t.type==='in'?'tin':'tout'}">${t.emoji||'\uD83D\uDCB0'}</div><div class="tit"><div class="titl">${t.title}</div><div class="titm">${new Date(t.date).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}</div></div><div class="tia ${t.type==='in'?'in':'out'}">${t.type==='in'?'+':'-'}\u20B9${t.amount}</div></div>`).join(''):'<div class="es">No transactions yet</div>';
  ['txl','kid-txl'].forEach(id=>{const e=document.getElementById(id);if(e)e.innerHTML=txHTML;});
  const pend=(bk.pending||[]).filter(p=>p.status==='pending');
  const psec=document.getElementById('psec');if(psec)psec.style.display=pend.length?'block':'none';
  const pl2=document.getElementById('pl2');
  if(pl2)pl2.innerHTML=pend.map(p=>`<div class="api"><div class="aph"><div><div class="apt">${p.title}</div><div style="font-size:11px;color:var(--t3)">${new Date(p.date).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div><div class="apa">\u20B9${p.amount}</div></div><div class="apac"><button class="appr" onclick="approve(${p.id})">\u2713 Approve</button><button class="aprj" onclick="reject2(${p.id})">\u2715 Reject</button></div></div>`).join('');
  updSavingsGoal();
}

window.approve=id=>{const p=(bk.pending||[]).find(x=>x.id===id);if(!p||p.status!=='pending'){toast('Already handled!','err');return;}p.status='approved';if(!bk.transactions)bk.transactions=[];if(p.type==='achievement'){bk.balance=(bk.balance||0)+p.amount;bk.transactions.unshift({id:Date.now(),type:'in',emoji:'\u2705',title:p.title,amount:p.amount,date:new Date().toISOString(),status:'approved'});}else if(p.type==='withdrawal'||p.type==='reward_claim'){bk.balance=Math.max(0,(bk.balance||0)-p.amount);bk.transactions.unshift({id:Date.now(),type:'out',emoji:'\uD83D\uDCB8',title:p.title,amount:p.amount,date:new Date().toISOString(),status:'approved'});}svO('bk',bk);toast('Approved!');};
window.reject2=id=>{const p=(bk.pending||[]).find(x=>x.id===id);if(p)p.status='rejected';svO('bk',bk);toast('Rejected');};
window.openWD=()=>{document.getElementById('wdamt').value='';document.getElementById('wdreason').value='';openMo('mo-wd');};
window.subWD=()=>{
  const amt=parseInt(document.getElementById('wdamt').value),reason=document.getElementById('wdreason').value.trim();
  if(!amt||amt<1){toast('Enter a valid amount','err');return;}
  if(amt>(bk.balance||0)){toast(`Only \u20B9${bk.balance||0} available`,'err');return;}
  if(!reason){toast("What's it for?",'err');return;}
  if(!bk.pending)bk.pending=[];
  bk.pending.push({id:Date.now(),type:'withdrawal',title:`Withdrawal: ${reason}`,amount:amt,status:'pending',date:new Date().toISOString()});
  svO('bk',bk);
  sendEmail(`\uD83D\uDCB8 ${kidName} wants to withdraw \u20B9${amt} for: "${reason}". Balance: \u20B9${bk.balance}. Approve at: https://shashwatbadoni.github.io/flow`);
  closeMo('mo-wd');
  toast('Request sent! Parents notified');
};
window.subAch=(emoji,name,amount)=>{if(!bk.pending)bk.pending=[];bk.pending.push({id:Date.now(),type:'achievement',title:`${emoji} ${name}`,amount,status:'pending',date:new Date().toISOString()});svO('bk',bk);sendEmail(`\uD83C\uDFC6 ${kidName} completed: "${name}" \u2014 requesting \u20B9${amount}. Approve at: https://shashwatbadoni.github.io/flow`);toast(`"${name}" submitted! Parents notified \uD83D\uDCE7`);};
window.openCA=()=>{document.getElementById('can').value='';document.getElementById('caa').value='';openMo('mo-ca');};
window.subCA=()=>{const name=document.getElementById('can').value.trim(),amt=parseInt(document.getElementById('caa').value);if(!name||!amt){toast('Fill both fields','err');return;}subAch('\u2728',name,amt);closeMo('mo-ca');};

// MOOD TRACKER
window.selMood=(mood,emoji)=>{
  selMoodVal=mood;
  document.querySelectorAll('.me').forEach(e=>{e.classList.remove('selected');e.style.filter='grayscale(50%)';e.style.transform='';});
  const el=document.querySelector(`.me[data-mood="${mood}"]`);
  if(el){el.classList.add('selected');el.style.filter='none';el.style.transform='scale(1.2)';}
};
window.togMoodCat=(el,cat)=>{
  el.classList.toggle('on');
  if(el.classList.contains('on')){if(!selMoodCats.includes(cat))selMoodCats.push(cat);}
  else{selMoodCats=selMoodCats.filter(c=>c!==cat);}
};
window.saveMood=()=>{
  if(!selMoodVal){toast('Please select how you feel first!','err');return;}
  const today=tdKey();
  moodData[today]={mood:selMoodVal,emoji:MOOD_EMOJIS[selMoodVal],categories:[...selMoodCats],note:document.getElementById('mood-note').value.trim(),date:today,time:new Date().toISOString()};
  svO('mood',{entries:moodData});
  selMoodVal='';selMoodCats=[];
  document.querySelectorAll('.me').forEach(e=>{e.classList.remove('selected');e.style.filter='grayscale(50%)';e.style.transform='';});
  document.querySelectorAll('.mcat').forEach(e=>e.classList.remove('on'));
  document.getElementById('mood-note').value='';
  toast('Mood saved!');
};

function getLast30Days(){const days=[];for(let i=29;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);days.push(d);}return days;}
function renderMoodCalendars(){
  ['mood-calendar-parent','mood-calendar-kid'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    const days=getLast30Days();
    el.style.gridTemplateColumns=`repeat(${Math.min(days.length,7)},1fr)`;
    el.innerHTML=days.map(d=>{
      const k=d.toISOString().slice(0,10),entry=moodData[k];
      const isT=k===tdKey();
      return`<div class="mood-day ${isT?'today-mood':''}" style="${entry?`background:${MOOD_COLORS[entry.mood]}22;border-color:${MOOD_COLORS[entry.mood]}44`:''}" title="${k}${entry?': '+entry.mood:''}">${entry?entry.emoji:''}<span class="day-num">${d.getDate()}</span></div>`;
    }).join('');
  });
}

function renderMoodChart(){
  ['mood-chart-parent'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    const days=wkDays();
    const moodVals={great:5,good:4,ok:3,low:2,sad:1};
    el.innerHTML=days.map(d=>{
      const k=d.toISOString().slice(0,10),entry=moodData[k];
      const val=entry?moodVals[entry.mood]||3:0;
      const h=val?val*12:4;
      const c=entry?MOOD_COLORS[entry.mood]:'var(--gb)';
      return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px"><div style="width:100%;height:${h}px;background:${c};border-radius:3px 3px 0 0;transition:height 0.5s" title="${entry?entry.mood:''}"></div><div style="font-size:10px;color:var(--t3)">${DYS[d.getDay()].slice(0,2)}</div></div>`;
    }).join('');
  });
}

function renderMoodEntries(){
  const el=document.getElementById('mood-entries-parent');if(!el)return;
  const entries=Object.values(moodData).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);
  if(!entries.length){el.innerHTML='<div class="es">No mood entries yet</div>';return;}
  el.innerHTML=entries.map(e=>`<div style="padding:10px;background:rgba(0,0,0,0.2);border:1px solid ${MOOD_COLORS[e.mood]}33;border-radius:var(--rs);margin-bottom:8px;animation:fu 0.3s ease">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
      <span style="font-size:20px">${e.emoji}</span>
      <div>
        <div style="font-size:13px;font-weight:500;color:${MOOD_COLORS[e.mood]}">${e.mood.charAt(0).toUpperCase()+e.mood.slice(1)}</div>
        <div style="font-size:11px;color:var(--t3)">${new Date(e.date).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})}</div>
      </div>
    </div>
    ${e.categories&&e.categories.length?`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:4px">${e.categories.map(c=>`<span style="font-size:10px;padding:2px 6px;background:rgba(124,110,247,0.15);border-radius:4px;color:var(--a2)">${c}</span>`).join('')}</div>`:''}
    ${e.note?`<div style="font-size:12px;color:var(--t2);font-style:italic">"${e.note}"</div>`:''}
  </div>`).join('');
}

function renderMoodSummary(){
  const el=document.getElementById('mood-summary');if(!el)return;
  const entries=Object.values(moodData);
  if(!entries.length){el.innerHTML='<div class="es">No data yet</div>';return;}
  const counts={great:0,good:0,ok:0,low:0,sad:0};
  entries.forEach(e=>{if(counts[e.mood]!==undefined)counts[e.mood]++;});
  const total=entries.length;
  el.innerHTML=Object.entries(counts).map(([mood,count])=>{
    if(!count)return'';
    const pct=Math.round(count/total*100);
    return`<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span>${MOOD_EMOJIS[mood]} ${mood}</span><span style="color:var(--t2)">${count} days (${pct}%)</span></div><div style="height:4px;background:rgba(255,255,255,0.08);border-radius:2px"><div style="height:100%;width:${pct}%;background:${MOOD_COLORS[mood]};border-radius:2px"></div></div></div>`;
  }).join('');
}

// PHOTOS
window.handlePhoto=e=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    pendingPhotoData=ev.target.result;
    document.getElementById('photo-preview-img').src=pendingPhotoData;
    document.getElementById('photo-preview').style.display='block';
  };
  reader.readAsDataURL(file);
};

window.savePhoto=async()=>{
  if(!pendingPhotoData){toast('No photo selected','err');return;}
  const caption=document.getElementById('photo-caption').value.trim();
  const today=tdKey();
  const todayMood=moodData[today];
  // Store base64 directly for simplicity (works without Firebase Storage billing)
  const photo={id:Date.now(),url:pendingPhotoData,caption,date:today,mood:todayMood?.emoji||'',time:new Date().toISOString()};
  photoData.unshift(photo);
  sv('photos',photoData);
  pendingPhotoData='';
  document.getElementById('photo-preview').style.display='none';
  document.getElementById('photo-caption').value='';
  document.getElementById('photo-input').value='';
  toast('Photo saved!');
};

function renderPhotos(){
  ['kid-photo-grid','parent-photo-grid'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    if(!photoData.length){el.innerHTML='<div class="es" style="grid-column:1/-1">No photos yet</div>';return;}
    const items=photoData.slice(0,12).map(p=>`<div class="photo-item" onclick="openPhoto(${p.id})">
      <img src="${p.url}" alt="${p.caption||''}"/>
      ${p.mood?`<div class="mood-overlay">${p.mood}</div>`:''}
      <div class="photo-date">${new Date(p.date).toLocaleDateString('en',{month:'short',day:'numeric'})}${p.caption?` \u00B7 ${p.caption.slice(0,15)}${p.caption.length>15?'\u2026':''}`:''}</div>
    </div>`).join('');
    if(id==='kid-photo-grid'){
      el.innerHTML=`<div class="photo-upload" onclick="document.getElementById('photo-input').click()"><span>\uD83D\uDCF7</span><p>Add today's photo</p></div>`+items;
    } else {
      el.innerHTML=items||'<div class="es" style="grid-column:1/-1">No photos yet</div>';
    }
  });
}

window.openPhoto=id=>{
  const p=photoData.find(x=>x.id===id);if(!p)return;
  document.getElementById('modal-photo-img').src=p.url;
  document.getElementById('modal-photo-caption').textContent=p.caption||'';
  document.getElementById('modal-photo-date').textContent=new Date(p.date).toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'});
  document.getElementById('modal-photo-mood').textContent=p.mood||'';
  openMo('mo-photo');
};

// BOOKS
let pendingBookRating=5;
window.setBookRating=n=>{
  pendingBookRating=n;
  document.querySelectorAll('#book-rating-stars .star').forEach((s,i)=>{s.style.filter=i<n?'none':'grayscale(80%)';});
};
window.addBook=()=>{
  const title=document.getElementById('book-title-inp').value.trim();
  if(!title){toast('Enter a book title','err');return;}
  const author=document.getElementById('book-author').value.trim();
  bookData.unshift({id:Date.now(),title,author,rating:pendingBookRating,date:tdKey()});
  sv('books',bookData);
  document.getElementById('book-title-inp').value='';
  document.getElementById('book-author').value='';
  pendingBookRating=5;
  document.querySelectorAll('#book-rating-stars .star').forEach(s=>s.style.filter='none');
  toast('Book added! +Rs200 if parent approves');
};
function renderBooks(){
  const el=document.getElementById('book-list');if(!el)return;
  if(!bookData.length){el.innerHTML='<div class="es">No books yet \u2014 add your first one!</div>';return;}
  el.innerHTML=bookData.map(b=>`<div class="book-item"><div class="book-cover">\uD83D\uDCD6</div><div class="book-info"><div class="book-title">${b.title}</div>${b.author?`<div class="book-meta">by ${b.author}</div>`:''}<div class="book-stars">${'\u2B50'.repeat(b.rating||0)}${'\u2606'.repeat(5-(b.rating||0))}</div></div><div style="font-size:11px;color:var(--t3)">${new Date(b.date).toLocaleDateString('en',{month:'short',day:'numeric'})}</div></div>`).join('');
}

// GROCERY
window.addGrocery=()=>{
  const item=document.getElementById('groc-inp').value.trim(),who=document.getElementById('groc-who').value;
  if(!item)return;
  groceryData.push({id:Date.now(),text:item,who,done:false,added:new Date().toISOString()});
  sv('grocery',groceryData);
  document.getElementById('groc-inp').value='';
  toast('Added to list!');
};
window.togGrocery=id=>{const g=groceryData.find(x=>x.id===id);if(g)g.done=!g.done;sv('grocery',groceryData);};
window.delGrocery=id=>{groceryData=groceryData.filter(x=>x.id!==id);sv('grocery',groceryData);};
function renderGrocery(){
  const el=document.getElementById('grocery-list');if(!el)return;
  if(!groceryData.length){el.innerHTML='<div class="es">List is empty \u2014 add items above!</div>';return;}
  const whoMap={family:'\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC66',me:'\uD83D\uDC64',ishaan:'\u2B50'};
  el.innerHTML=groceryData.map(g=>`<div class="fam-item ${g.done?'dn':''}">
    <div class="ck ${g.done?'on':''}" onclick="togGrocery(${g.id})"><svg class="cksv" width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <span class="fam-text">${g.text}</span>
    <span class="fam-who">${whoMap[g.who]||'\uD83D\uDC64'}</span>
    <button onclick="delGrocery(${g.id})" style="background:transparent;border:none;cursor:pointer;color:var(--t3);font-size:12px;opacity:0.5">\u2715</button>
  </div>`).join('');
}

// FAMILY GOALS
window.addFamGoal=()=>{
  const text=document.getElementById('goal-inp').value.trim(),date=document.getElementById('goal-date').value;
  if(!text)return;
  famGoals.push({id:Date.now(),text,date,done:false,created:new Date().toISOString()});
  sv('famGoals',famGoals);
  document.getElementById('goal-inp').value='';document.getElementById('goal-date').value='';
  toast('Family goal added!');
};
window.togFamGoal=id=>{const g=famGoals.find(x=>x.id===id);if(g)g.done=!g.done;sv('famGoals',famGoals);};
function renderFamGoals(){
  const el=document.getElementById('goal-list');if(!el)return;
  if(!famGoals.length){el.innerHTML='<div class="es">No family goals yet \u2014 add one above!</div>';return;}
  el.innerHTML=famGoals.map(g=>`<div class="fam-item ${g.done?'dn':''}">
    <div class="ck ${g.done?'on':''}" onclick="togFamGoal(${g.id})"><svg class="cksv" width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <span class="fam-text">${g.text}</span>
    ${g.date?`<span style="font-size:11px;color:var(--t3)">${new Date(g.date).toLocaleDateString('en',{month:'short',day:'numeric'})}</span>`:''}
  </div>`).join('');
}

window.showGame=type=>{
  ['game-picker','game-quiz','game-snake'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
  if(type==='picker'){const e=document.getElementById('game-picker');if(e)e.style.display='block';}
  else if(type==='quiz'){const e=document.getElementById('game-quiz');if(e)e.style.display='block';startQuiz();}
  else if(type==='snake'){const e=document.getElementById('game-snake');if(e)e.style.display='block';initSnakeCanvas();}
};

// SNAKE GAME
let snakeGame=null,snakeBest=parseInt(localStorage.getItem('snakeBest')||'0');
function initSnakeCanvas(){
  const canvas=document.getElementById('snake-canvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#0a0d1a';ctx.fillRect(0,0,300,300);
  ctx.fillStyle='rgba(255,255,255,0.1)';ctx.font='16px DM Sans';
  ctx.textAlign='center';ctx.fillText('Press Start to play \uD83D\uDC0D',150,150);
  document.getElementById('snake-best').textContent=snakeBest;
}
window.startSnake=()=>{
  stopSnake();
  const canvas=document.getElementById('snake-canvas');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const GRID=15,CELL=Math.floor(300/GRID);
  let snake=[{x:7,y:7}],dir={x:1,y:0},nextDir={x:1,y:0},food=spawnFood(snake,GRID),score=0,running=true;
  document.getElementById('snake-score').textContent=0;
  document.getElementById('snake-msg').textContent='Use arrows or swipe to move!';
  document.getElementById('snake-start-btn').textContent='\uD83D\uDD04 Restart';

  function spawnFood(s,g){let f;do{f={x:Math.floor(Math.random()*g),y:Math.floor(Math.random()*g)};}while(s.some(p=>p.x===f.x&&p.y===f.y));return f;}

  function draw(){
    ctx.fillStyle='#0a0d1a';ctx.fillRect(0,0,300,300);
    // Draw grid
    ctx.strokeStyle='rgba(255,255,255,0.03)';ctx.lineWidth=0.5;
    for(let i=0;i<GRID;i++){ctx.beginPath();ctx.moveTo(i*CELL,0);ctx.lineTo(i*CELL,300);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*CELL);ctx.lineTo(300,i*CELL);ctx.stroke();}
    // Food
    ctx.fillStyle='#f59e0b';ctx.shadowColor='#f59e0b';ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(food.x*CELL+CELL/2,food.y*CELL+CELL/2,CELL/2-1,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    // Snake
    snake.forEach((p,i)=>{
      const t=1-i/snake.length;
      ctx.fillStyle=`rgba(${Math.round(52+t*72)},${Math.round(211-t*80)},${Math.round(153-t*50)},${0.7+t*0.3})`;
      ctx.shadowColor='#34d399';ctx.shadowBlur=i===0?6:0;
      ctx.beginPath();ctx.fillRect(p.x*CELL+1,p.y*CELL+1,CELL-2,CELL-2);
    });
    ctx.shadowBlur=0;
  }

  function step(){
    if(!running)return;
    dir=nextDir;
    const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
    if(head.x<0||head.x>=GRID||head.y<0||head.y>=GRID||snake.some(p=>p.x===head.x&&p.y===head.y)){
      gameOver();return;
    }
    snake.unshift(head);
    if(head.x===food.x&&head.y===food.y){
      score++;document.getElementById('snake-score').textContent=score;
      food=spawnFood(snake,GRID);
      if(score>snakeBest){snakeBest=score;localStorage.setItem('snakeBest',snakeBest);document.getElementById('snake-best').textContent=snakeBest;}
    }else{snake.pop();}
    draw();
  }

  function gameOver(){
    running=false;stopSnake();
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,300,300);
    ctx.fillStyle='#f87171';ctx.font='bold 20px Syne';ctx.textAlign='center';ctx.fillText('Game Over! \uD83D\uDC80',150,130);
    ctx.fillStyle='#fbbf24';ctx.font='16px DM Sans';ctx.fillText(`Score: ${score}`,150,160);
    ctx.fillStyle='#a0a8c8';ctx.font='13px DM Sans';ctx.fillText('Press Restart to play again',150,190);
    document.getElementById('snake-msg').textContent=`Game over! Score: ${score}`;
    document.getElementById('snake-start-btn').textContent='\uD83D\uDD04 Restart';
    if(score>=5)launchConfetti();
  }

  snakeGame=setInterval(step,150);

  // Keyboard controls
  const keyHandler=e=>{
    if(e.key==='ArrowUp'&&dir.y!==1)nextDir={x:0,y:-1};
    else if(e.key==='ArrowDown'&&dir.y!==-1)nextDir={x:0,y:1};
    else if(e.key==='ArrowLeft'&&dir.x!==1)nextDir={x:-1,y:0};
    else if(e.key==='ArrowRight'&&dir.x!==-1)nextDir={x:1,y:0};
  };
  document.addEventListener('keydown',keyHandler);

  // Touch/swipe controls
  let tx=0,ty=0;
  canvas.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
  canvas.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
    if(Math.abs(dx)>Math.abs(dy)){if(dx>20&&dir.x!==-1)nextDir={x:1,y:0};else if(dx<-20&&dir.x!==1)nextDir={x:-1,y:0};}
    else{if(dy>20&&dir.y!==-1)nextDir={x:0,y:1};else if(dy<-20&&dir.y!==1)nextDir={x:0,y:-1};}
  },{passive:true});

  draw();
};
window.stopSnake=()=>{if(snakeGame){clearInterval(snakeGame);snakeGame=null;}};
window.setSnakeDir=(dx,dy)=>{
  // Will be applied on next step via nextDir - we expose this for button controls
  const canvas=document.getElementById('snake-canvas');if(!canvas||!snakeGame)return;
  // Dispatch as if keyboard
  const keys={'-1,0':'ArrowLeft','1,0':'ArrowRight','0,-1':'ArrowUp','0,1':'ArrowDown'};
  document.dispatchEvent(new KeyboardEvent('keydown',{key:keys[`${dx},${dy}`]}));
};
const QUESTIONS = [
  {q:"What is the largest planet in our solar system?",opts:["Earth","Jupiter","Saturn","Mars"],ans:1},
  {q:"How many continents are there on Earth?",opts:["5","6","7","8"],ans:2},
  {q:"What is the capital of France?",opts:["London","Berlin","Paris","Rome"],ans:2},
  {q:"Which animal is the fastest on land?",opts:["Lion","Cheetah","Horse","Leopard"],ans:1},
  {q:"How many sides does a hexagon have?",opts:["5","6","7","8"],ans:1},
  {q:"What is the largest ocean on Earth?",opts:["Atlantic","Indian","Arctic","Pacific"],ans:3},
  {q:"Which planet is known as the Red Planet?",opts:["Venus","Mars","Jupiter","Saturn"],ans:1},
  {q:"What is 12 \u00D7 12?",opts:["124","144","134","114"],ans:1},
  {q:"Which is the longest river in the world?",opts:["Amazon","Nile","Yangtze","Mississippi"],ans:1},
  {q:"What gas do plants absorb from the air?",opts:["Oxygen","Nitrogen","Carbon Dioxide","Hydrogen"],ans:2},
  {q:"How many bones are in the human body?",opts:["106","206","306","406"],ans:1},
  {q:"What is the capital of India?",opts:["Mumbai","Kolkata","New Delhi","Chennai"],ans:2},
  {q:"Which is the smallest country in the world?",opts:["Monaco","Vatican City","San Marino","Liechtenstein"],ans:1},
  {q:"How many colors are in a rainbow?",opts:["5","6","7","8"],ans:2},
  {q:"What is the currency of Japan?",opts:["Yuan","Won","Yen","Ringgit"],ans:2},
  {q:"Which ocean is the Titanic resting in?",opts:["Pacific","Indian","Atlantic","Arctic"],ans:2},
  {q:"What is the square root of 64?",opts:["6","7","8","9"],ans:2},
  {q:"Which sport uses a shuttlecock?",opts:["Tennis","Badminton","Squash","Pickle ball"],ans:1},
  {q:"What is the national animal of India?",opts:["Lion","Elephant","Tiger","Leopard"],ans:2},
  {q:"How many hours are in a week?",opts:["148","158","168","178"],ans:2}
];

let quizQs=[], quizIdx=0, quizScore=0, quizTimer=null, quizTimeLeft=15, quizAnswered=false;

function checkGameUnlock(){
  const total=iT.length,done=iT.filter(t=>t.done).length,allDone=total>0&&done===total;
  const locked=document.getElementById('game-locked'),unlocked=document.getElementById('game-unlocked');
  const gp=document.getElementById('game-prog'),gpct=document.getElementById('game-pct');
  const pct=total?Math.round(done/total*100):0;
  if(gp)gp.style.width=pct+'%';if(gpct)gpct.textContent=pct+'%';
  if(locked&&unlocked){
    if(allDone){
      locked.style.display='none';unlocked.style.display='block';
      // Show picker by default
      const picker=document.getElementById('game-picker');
      if(picker&&picker.style.display==='none'){
        ['game-quiz','game-snake'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
        picker.style.display='block';
      }
    }else{locked.style.display='block';unlocked.style.display='none';}
  }
}

window.startQuiz=()=>{
  quizQs=[...QUESTIONS].sort(()=>Math.random()-0.5).slice(0,10);
  quizIdx=0;quizScore=0;quizAnswered=false;
  document.getElementById('quiz-result').style.display='none';
  document.getElementById('quiz-area').style.display='block';
  showQuestion();
};

function showQuestion(){
  if(quizIdx>=quizQs.length){endQuiz();return;}
  const q=quizQs[quizIdx];
  quizAnswered=false;
  document.getElementById('quiz-question').textContent=q.q;
  document.getElementById('quiz-qnum').textContent=`${quizIdx+1}/10`;
  document.getElementById('quiz-score').textContent=quizScore;
  document.getElementById('quiz-feedback').style.display='none';
  document.getElementById('quiz-options').innerHTML=q.opts.map((opt,i)=>`
    <button onclick="answerQ(${i})" style="background:rgba(0,0,0,0.2);border:1px solid var(--gb);border-radius:10px;padding:12px 16px;color:var(--t1);font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;text-align:left;transition:all 0.2s;width:100%" onmouseover="if(!this.disabled)this.style.borderColor='var(--a2)'" onmouseout="if(!this.disabled)this.style.borderColor='var(--gb)'">${String.fromCharCode(65+i)}. ${opt}</button>
  `).join('');
  startTimer();
}

function startTimer(){
  clearInterval(quizTimer);quizTimeLeft=15;
  document.getElementById('quiz-timer').textContent=quizTimeLeft;
  document.getElementById('quiz-timer').style.color='var(--a3)';
  quizTimer=setInterval(()=>{
    quizTimeLeft--;
    document.getElementById('quiz-timer').textContent=quizTimeLeft;
    if(quizTimeLeft<=5)document.getElementById('quiz-timer').style.color='var(--err)';
    if(quizTimeLeft<=0){clearInterval(quizTimer);if(!quizAnswered)timeOut();}
  },1000);
}

window.answerQ=i=>{
  if(quizAnswered)return;
  quizAnswered=true;clearInterval(quizTimer);
  const q=quizQs[quizIdx];
  const btns=document.querySelectorAll('#quiz-options button');
  btns.forEach((b,idx)=>{b.disabled=true;if(idx===q.ans)b.style.background='rgba(52,211,153,0.2)';});
  const fb=document.getElementById('quiz-feedback');
  if(i===q.ans){
    quizScore++;
    btns[i].style.background='rgba(52,211,153,0.2)';btns[i].style.borderColor='var(--ok)';
    fb.style.display='block';fb.style.background='rgba(52,211,153,0.1)';fb.style.color='var(--ok)';fb.textContent='\u2705 Correct! Well done!';
  }else{
    btns[i].style.background='rgba(248,113,113,0.2)';btns[i].style.borderColor='var(--err)';
    fb.style.display='block';fb.style.background='rgba(248,113,113,0.1)';fb.style.color='var(--err)';fb.textContent=`\u274C Wrong! Answer was: ${q.opts[q.ans]}`;
  }
  document.getElementById('quiz-score').textContent=quizScore;
  setTimeout(()=>{quizIdx++;showQuestion();},1800);
};

function timeOut(){
  quizAnswered=true;
  const q=quizQs[quizIdx];
  const btns=document.querySelectorAll('#quiz-options button');
  btns.forEach((b,idx)=>{b.disabled=true;if(idx===q.ans)b.style.background='rgba(52,211,153,0.2)';});
  const fb=document.getElementById('quiz-feedback');
  fb.style.display='block';fb.style.background='rgba(251,191,36,0.1)';fb.style.color='var(--warn)';fb.textContent=`\u23F0 Time's up! Answer was: ${q.opts[q.ans]}`;
  setTimeout(()=>{quizIdx++;showQuestion();},1800);
}

function endQuiz(){
  clearInterval(quizTimer);
  document.getElementById('quiz-area').style.display='none';
  document.getElementById('quiz-result').style.display='block';
  const pct=Math.round(quizScore/10*100);
  const emoji=pct>=90?'\uD83C\uDFC6':pct>=70?'\uD83C\uDF89':pct>=50?'\uD83D\uDE0A':'\uD83D\uDCAA';
  const title=pct>=90?'Perfect Score!':pct>=70?'Great Job!':pct>=50?'Good Try!':'Keep Practising!';
  const msg=pct>=90?'You got everything right! You are a genius! \uD83E\uDDE0':pct>=70?'Really impressive knowledge!':pct>=50?'More than half right \u2014 well done!':'Every attempt makes you smarter!';
  document.getElementById('result-emoji').textContent=emoji;
  document.getElementById('result-title').textContent=title;
  document.getElementById('result-score').textContent=`You scored ${quizScore}/10 (${pct}%)`;
  document.getElementById('result-msg').textContent=msg;
  if(pct>=70)launchConfetti();
}
  try{
    emailjs.init({publicKey:'V9NqLDtVaGzB173ee'});
    emailjs.send('service_k84ebeh','template_232ecf8',{message:msg})
      .then(()=>console.log('Email sent'))
      .catch(e=>console.error('Email error:',e.status,e.text));
  }catch(e){console.error('EmailJS:',e);}
}

function sendWeeklySummary(){
  const done=iT.filter(t=>t.done).length,total=iT.length;
  const msg=`\uD83D\uDCCA Weekly Summary for ${kidName}:\n\n\u2705 Tasks completed: ${done}/${total}\n\uD83D\uDD25 Streak: ${streak} weeks\n\uD83C\uDFE6 Bank balance: \u20B9${bk.balance||0}\n\uD83D\uDCF8 Photos this week: ${photoData.filter(p=>{const d=new Date(p.date);const weekAgo=new Date(now);weekAgo.setDate(weekAgo.getDate()-7);return d>=weekAgo;}).length}\n\nView at: https://shashwatbadoni.github.io/flow`;
  sendEmail(msg);
}

// SETTINGS
window.saveWA=()=>{wa1=(document.getElementById('wan1').value||'').trim();wa2=(document.getElementById('wan2').value||'').trim();svO('cfg',{wa1,wa2,pin});toast('Settings saved!');};
window.savePIN=()=>{const np=document.getElementById('npi').value.trim();if(!np||np.length<4){toast('PIN must be at least 4 digits','err');return;}pin=np;svO('cfg',{wa1,wa2,pin});document.getElementById('npi').value='';toast('PIN saved!');};
window.unlockPC=()=>{const e=document.getElementById('pcpi').value;if(!pin||e===pin){document.getElementById('pcl').style.display='none';document.getElementById('pcu').style.display='block';document.getElementById('pcpe').style.display='none';}else{document.getElementById('pcpe').style.display='block';}document.getElementById('pcpi').value='';};
window.lockPC=()=>{document.getElementById('pcl').style.display='block';document.getElementById('pcu').style.display='none';};
window.unlockWA=()=>{const e=document.getElementById('wapi').value;if(!pin||e===pin){document.getElementById('wal2').style.display='none';document.getElementById('wau').style.display='block';document.getElementById('wape').style.display='none';document.getElementById('wan1').value=wa1;document.getElementById('wan2').value=wa2;}else{document.getElementById('wape').style.display='block';}document.getElementById('wapi').value='';};
window.lockWA=()=>{document.getElementById('wal2').style.display='block';document.getElementById('wau').style.display='none';};

// TABS
window.goTab=(tab,btn)=>{['pt','ph3','pn','pbills','penergy'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});const map={tasks:'pt',habits:'ph3',notes:'pn',bills:'pbills',energy:'penergy'};const el=document.getElementById(map[tab]);if(el)el.style.display='block';document.querySelectorAll('.it').forEach(b=>b.classList.remove('on'));btn.classList.add('on');};
window.goPg=(pg,btn)=>{document.querySelectorAll('#db-parent .pg').forEach(p=>p.classList.remove('on'));const el=document.getElementById('pg-'+pg);if(el)el.classList.add('on');document.querySelectorAll('#db-parent .ntab').forEach(b=>b.classList.remove('on'));btn.classList.add('on');if(pg!=='family')lockPC();if(pg==='mood-parent'){renderMoodCalendars();renderMoodChart();renderMoodEntries();renderMoodSummary();}};
window.goFamTab=(tab,btn)=>{['ft-tasks','ft-photos','ft-grocery','ft-goals'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});const el=document.getElementById('ft-'+tab);if(el)el.style.display='block';document.querySelectorAll('#pg-family .it-bar .it').forEach(b=>b.classList.remove('on'));btn.classList.add('on');};
window.goKidPg=(pg,btn)=>{document.querySelectorAll('#db-kid .pg').forEach(p=>{p.classList.remove('on');p.style.display='none';});const el=document.getElementById('kpg-'+pg);if(el){el.classList.add('on');el.style.display='block';}document.querySelectorAll('#db-kid .ntab').forEach(b=>b.classList.remove('on'));btn.classList.add('on');if(pg==='game')checkGameUnlock();};

// MODAL HELPERS
window.openMo=id=>document.getElementById(id).classList.add('on');
window.closeMo=id=>document.getElementById(id).classList.remove('on');
['mo-rem','mo-reward','mo-wd','mo-ca','mo-photo'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('click',function(e){if(e.target===this)this.classList.remove('on');});});
