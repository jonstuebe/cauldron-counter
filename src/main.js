import './style.css';
import {
  rand, shuffle, PER_DAY, MAX_ING, LAST_DAY, TIMER_DAY, FADE_DAY, BONUS_WINDOW,
  TIMER_STEP, TIMER_FLOOR, patienceFor, dayCfg, untimedBonus, apply, genOrders, mixColor,
} from './logic.js';
import { GLYPH, CUSTOMERS, LINES, THANKS } from './data.js';

const $=s=>document.querySelector(s);

function jarSVG(g,uid){
  const body='M20 12h20v6c10 4 14 12 14 22 0 18-10 30-24 30S6 58 6 40c0-10 4-18 14-22z';
  return `<svg viewBox="0 0 60 74" aria-hidden="true">
    <rect class="cork" x="21" y="2" width="18" height="10" rx="2.5" fill="#8a6440"/>
    <clipPath id="c-${uid}"><path d="${body}"/></clipPath>
    <path d="${body}" fill="var(--glass)"/>
    <rect x="0" y="30" width="60" height="46" fill="${g.color}" clip-path="url(#c-${uid})"/>
    <path d="${body}" fill="none" stroke="var(--glass-edge)" stroke-width="1.5"/>
    <path d="M13 31c-3 5-3 14 0 20" stroke="rgba(255,255,255,.55)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <g transform="translate(19,38) scale(.95)" fill="rgba(30,22,40,.6)" color="rgba(30,22,40,.6)">${GLYPH[g.glyph]}</g>
  </svg>`;
}
function jarHTML(g,i,mini){
  const faded=!mini&&S.day>=FADE_DAY;
  return `<button class="jar" ${mini?'tabindex="-1" aria-hidden="true"':`data-i="${i}" aria-label="${g.name}${faded?'':`, ${g.op} ${g.v}`}"`}>
    ${jarSVG(g,(mini?'m':'s')+g.id)}<span class="name">${g.name}</span><span class="op${faded?' faded':''}">${faded?'?':g.op+g.v}</span></button>`;
}
function portrait(c,mood){
  const mouth=mood==='happy'?'M34 42 Q40 48 46 42':mood==='cross'?'M34 46 Q40 40 46 46':'M35 44 L45 44';
  const brow=mood==='cross'?'<path d="M31 30 L37 32 M49 30 L43 32" stroke="#2a2236" stroke-width="2" stroke-linecap="round"/>':'';
  let back='',front='';
  if(c.hat==='hood'){back=`<circle cx="40" cy="38" r="21" fill="${c.cloak}"/><circle cx="40" cy="38" r="21" fill="#000" opacity=".15"/>`}
  if(c.hat==='pointed'){front=`<path d="M22 28 L46 0 L58 26 Z" fill="${c.hatc}"/><ellipse cx="40" cy="27" rx="25" ry="5" fill="${c.hatc}"/>`}
  if(c.hat==='cap'){front=`<path d="M25 30 Q40 12 55 30 Z" fill="${c.hatc}"/><rect x="22" y="28" width="36" height="4" rx="2" fill="${c.hatc}"/>`}
  if(c.hat==='hair'){front=`<path d="M25 36 Q24 19 40 19 Q56 19 55 36 Q51 26 40 26 Q29 26 25 36Z" fill="${c.hatc}"/>`}
  return `<svg viewBox="0 0 80 80" aria-hidden="true">
    ${back}<path d="M10 82 C12 62 24 53 40 53 C56 53 68 62 70 82Z" fill="${c.cloak}"/>
    <circle cx="40" cy="37" r="14" fill="${c.skin}"/>
    <circle cx="35" cy="36" r="1.9" fill="#2a2236"/><circle cx="45" cy="36" r="1.9" fill="#2a2236"/>${brow}
    <path d="${mouth}" stroke="#2a2236" stroke-width="2" fill="none" stroke-linecap="round"/>${front}</svg>`;
}

let best=0; try{best=+localStorage.getItem('nk-best')||0}catch(e){}
const S={day:1,gen:0,serving:false,coins:0,queue:[],cur:null,brew:[],value:0,t:0,paused:true,today:{served:0,perfect:0,left:0,coins:0}};

function renderShelf(){
  const c=dayCfg(S.day);
  $('#shelf').innerHTML=c.ings.map((g,i)=>jarHTML(g,i,false)).join('');
}
function renderHeader(){
  $('#day').textContent=`Day ${S.day}/${LAST_DAY}`;
  $('#coins').textContent=S.coins;
  const waiting=S.queue.length+(S.cur?1:0);
  $('#queue').innerHTML=Array.from({length:PER_DAY},(_,i)=>`<i class="${i<waiting?'on':''}"></i>`).join('');
}
function renderBrew(brew=S.brew,value=S.value){
  $('#strength').textContent=value;
  const col=mixColor(brew);
  $('#liquid').style.fill=col;
  document.querySelectorAll('#vapor circle').forEach(c=>c.style.fill=brew.length?col:'var(--muted)');
  $('#chips').innerHTML=brew.length?brew.map(g=>`<span class="chip"><i style="background:${g.color}"></i>${g.op}${g.v}</span>`).join('')
    :'<span class="empty-note">The cauldron is empty. Tap an ingredient to drop it in.</span>';
  $('#count').textContent=`${brew.length} of ${MAX_ING} ingredients`;
  const ready=S.cur&&value===S.cur.t&&brew.length>0;
  $('#cauldron').classList.toggle('ready',!!ready);
  $('#serve').classList.toggle('lit',!!ready);
}
function bump(){const p=$('#plate');p.classList.remove('pop');void p.getBBox();p.classList.add('pop')}
function note(msg){const n=$('#note');n.textContent=msg;clearTimeout(note.t);note.t=setTimeout(()=>n.textContent='',2400)}
function toast(main,sub){
  const t=document.createElement('div');t.className='toast';t.innerHTML=main+(sub?`<small>${sub}</small>`:'');
  document.body.appendChild(t);setTimeout(()=>t.remove(),2300);
}
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let pourChain=Promise.resolve(), flyId=0;
// Every pour animation goes through go() so a new tap can fast-forward whatever is still playing.
const live=new Set(), BASE=1.6, FAST=3.5; let pending=0, skipAll=false;
function go(el,kf,o){
  const a=el.animate(kf,o);a.playbackRate=pending>1?FAST:BASE;
  live.add(a);const rm=()=>live.delete(a);a.finished.then(rm,rm);
  if(skipAll){try{a.finish()}catch(e){}}
  return a;
}
// Jump every running and queued pour straight to its end.
function skipToEnd(){skipAll=true;live.forEach(a=>{try{a.finish()}catch(e){}})}
function hurry(){live.forEach(a=>{if(a.playbackRate<FAST){try{a.updatePlaybackRate(FAST)}catch(e){a.playbackRate=FAST}}})}
function splash(color){
  const w=$('#pot');const s=document.createElement('div');s.className='splash';s.style.borderColor=color;w.appendChild(s);setTimeout(()=>s.remove(),520);
}
function showSnap(snap){if(snap.gen!==S.gen)return;renderBrew(snap.brew,snap.value);bump()}

// Shared-element pour: the jar lifts off the shelf, uncorks, pours, recorks and flies home.
async function pour(g,btn,snap){
  const svg=btn&&btn.querySelector('svg');
  if(!svg||RM.matches){splash(g.color);showSnap(snap);return}
  const r=svg.getBoundingClientRect(), pot=$('#pot').getBoundingClientRect();
  const fly=document.createElement('div');fly.className='flyjar';
  Object.assign(fly.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
  fly.innerHTML=jarSVG(g,'f'+(++flyId));
  document.body.appendChild(fly);
  btn._out=(btn._out||0)+1;svg.style.visibility='hidden';

  const s=Math.max(1,Math.min(1.6,pot.width*0.3/r.width)), h=r.height*s;
  const theta=118, rad=theta*Math.PI/180;
  const mx=0.34*h*Math.sin(rad), my=-0.34*h*Math.cos(rad);   // mouth offset from jar centre once tilted
  const liquidY=pot.top+pot.height*78/230, cx=pot.left+pot.width/2;
  const jarCY=Math.max(h/2+10,liquidY-pot.height*0.42), jarCX=cx-mx;
  const dx=jarCX-(r.left+r.width/2), dy=jarCY-(r.top+r.height/2);
  const T=(rot,sc,x=dx,y=dy)=>`translate(${x}px,${y}px) rotate(${rot}deg) scale(${sc})`;

  // rise from the shelf in a little arc
  await go(fly,[
    {transform:T(0,1,0,0)},
    {transform:T(-12,(1+s)/2,dx*.45,dy*.62-30),offset:.55},
    {transform:T(0,s)}
  ],{duration:380,easing:'cubic-bezier(.3,.7,.35,1)',fill:'forwards'}).finished;

  // pop the cork
  const cork=fly.querySelector('.cork');
  cork.style.transformBox='fill-box';cork.style.transformOrigin='center';
  const corkOff='translate(-8px,-18px) rotate(-35deg)';
  go(cork,[{transform:'none',opacity:1},{transform:corkOff,opacity:1,offset:.6},{transform:corkOff,opacity:0}],{duration:200,easing:'cubic-bezier(.3,1.5,.5,1)',fill:'forwards'});
  await go(fly,[],{duration:130}).finished;

  // tilt
  await go(fly,[{transform:T(0,s)},{transform:T(theta,s)}],{duration:240,easing:'cubic-bezier(.5,0,.3,1)',fill:'forwards'}).finished;

  // pour stream
  const mX=jarCX+mx, mY=jarCY+my, sw=Math.round(5*s);
  const st=document.createElement('div');st.className='stream';
  Object.assign(st.style,{left:(mX-sw/2)+'px',top:mY+'px',width:sw+'px',height:Math.max(12,liquidY-mY)+'px',background:g.color});
  document.body.appendChild(st);
  await go(st,[{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:130,easing:'ease-in',fill:'forwards'}).finished;
  splash(g.color);showSnap(snap);
  go(fly,[{transform:T(theta,s)},{transform:T(theta+6,s)},{transform:T(theta,s)}],{duration:240});
  await go(st,[],{duration:230}).finished;
  await go(st,[{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(100% 0 0 0)'}],{duration:130,easing:'ease-in',fill:'forwards'}).finished;
  st.remove();

  // right it and cork it
  await go(fly,[{transform:T(theta,s)},{transform:T(0,s)}],{duration:210,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished;
  go(cork,[{transform:corkOff,opacity:0},{transform:corkOff,opacity:1,offset:.35},{transform:'none',opacity:1}],{duration:170,easing:'ease-in',fill:'forwards'});
  await go(fly,[],{duration:150}).finished;

  // fly home (not awaited, so the next pour can start)
  const r2=svg.getBoundingClientRect(), bx=r2.left-r.left, by=r2.top-r.top;
  go(fly,[
    {transform:T(0,s)},
    {transform:T(8,(1+s)/2,(dx+bx)*.5,(dy+by)*.5-24),offset:.45},
    {transform:T(0,1,bx,by)}
  ],{duration:340,easing:'cubic-bezier(.5,0,.3,1)',fill:'forwards'}).finished.then(()=>{
    fly.remove();if(--btn._out<=0)svg.style.visibility='';
  });
}

function addIngredient(i,btn){
  if(S.paused||!S.cur) return;
  const g=dayCfg(S.day).ings[i]; if(!g) return;
  const shake=()=>{btn&&(btn.classList.remove('shake'),void btn.offsetWidth,btn.classList.add('shake'))};
  if(S.brew.length>=MAX_ING){note('The cauldron is full. Undo or empty it first.');shake();return}
  const r=apply(S.value,g);
  if(r.err){note(r.err);shake();return}
  S.brew.push(g);S.value=r.v;
  const snap={brew:S.brew.slice(),value:S.value,gen:S.gen};
  pending++;if(pending>1)hurry();
  pourChain=pourChain.then(()=>pour(g,btn,snap)).catch(()=>showSnap(snap)).then(()=>{pending--});
}
function recompute(){S.gen++;S.value=0;for(const g of S.brew)S.value=apply(S.value,g).v;renderBrew();bump()}
function undo(){if(S.paused||!S.brew.length)return;S.brew.pop();recompute()}
function emptyPot(){if(S.paused||!S.brew.length)return;S.brew=[];recompute()}

function setSays(t){$('#says').textContent=t}
function nextCustomer(){
  if(!S.queue.length){endDay();return}
  S.cur=S.queue.shift();S.brew=[];S.value=0;S.gen++;
  const c=dayCfg(S.day);S.cur.max=c.patience;S.t=c.patience;S.cur.timed=c.timed;S.el=0;
  $('#patience').classList.toggle('bonus',!c.timed);$('#patience').classList.remove('low');$('#patienceFill').style.width='100%';
  const p=$('#portrait');p.className='portrait';void p.offsetWidth;p.classList.add('arrive');
  p.innerHTML=portrait(S.cur.c,'neutral');
  $('#who').textContent=S.cur.c.name;setSays(S.cur.line(S.cur.t));
  $('#target').textContent=S.cur.t;
  $('#par').textContent=`Master’s tip: use ${S.cur.par}`;
  renderHeader();renderBrew();$('#strength').textContent=0;
  S.paused=false;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function finishCustomer(mood,msg,hold=1100){
  S.paused=true;
  $('#portrait').innerHTML=portrait(S.cur.c,mood);setSays(msg);
  await new Promise(r=>{const t=setTimeout(r,hold);S.skip=()=>{clearTimeout(t);r()}});
  S.skip=null;
  const p=$('#portrait');p.classList.remove('arrive');p.classList.add('depart');
  await sleep(RM.matches?0:260);
  S.cur=null;nextCustomer();
}
// Tap anywhere (or press Enter/space) to wave the customer off early.
document.addEventListener('pointerdown',()=>{if(S.skip&&$('#overlay').hidden)S.skip()});
document.addEventListener('keydown',e=>{if(S.skip&&$('#overlay').hidden&&(e.key==='Enter'||e.key===' ')){e.preventDefault();S.skip()}});

function flaskSVG(col){
  const id='fk'+(++flyId);
  return `<svg viewBox="0 0 40 56" aria-hidden="true">
    <rect x="14" y="0" width="12" height="7" rx="2" fill="#8a6440"/>
    <clipPath id="${id}"><circle cx="20" cy="36" r="17"/><rect x="15" y="6" width="10" height="16"/></clipPath>
    <g fill="var(--glass)"><circle cx="20" cy="36" r="17"/><rect x="15" y="6" width="10" height="16"/></g>
    <rect x="0" y="25" width="40" height="32" fill="${col}" clip-path="url(#${id})"/>
    <circle cx="20" cy="36" r="17" fill="none" stroke="var(--glass-edge)" stroke-width="1.5"/>
    <path d="M15 7v13M25 7v13" stroke="var(--glass-edge)" stroke-width="1.5"/>
    <path d="M10 31c-1 4 0 8 2 10" stroke="rgba(255,255,255,.6)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;
}
// A filled flask rises out of the cauldron and flies to the customer (or falls short if it's wrong).
function flyFlask(col,miss){
  const pot=$('#pot').getBoundingClientRect(), pr=$('#portrait').getBoundingClientRect();
  const w=Math.max(40,pot.width*.17), h=w*1.4;
  const sx=pot.left+pot.width/2, sy=pot.top+pot.height*78/230;
  const dx=pr.left+pr.width/2-sx, dy=pr.top+pr.height/2-sy, up=-pot.height*.35;
  const el=document.createElement('div');el.className='flyjar';
  Object.assign(el.style,{left:(sx-w/2)+'px',top:(sy-h/2)+'px',width:w+'px',height:h+'px'});
  el.innerHTML=flaskSVG(col);document.body.appendChild(el);
  const P=(x,y,s,r=0)=>`translate(${x}px,${y}px) scale(${s}) rotate(${r}deg)`;
  const kf=miss?[
    {transform:P(0,0,.3),opacity:0},
    {transform:P(0,up,1,-8),opacity:1,offset:.3},
    {transform:P(dx*.8,dy*.8,.8),opacity:1,offset:.62},
    {transform:P(dx*.78,dy*.78+18,.8,-25),opacity:1,offset:.74},
    {transform:P(dx*.6,dy*.6+140,.6,-130),opacity:0}
  ]:[
    {transform:P(0,0,.3),opacity:0},
    {transform:P(0,up,1,-8),opacity:1,offset:.35},
    {transform:P(dx,dy,.55,6),opacity:1,offset:.9},
    {transform:P(dx,dy,.2),opacity:0}
  ];
  const a=el.animate(kf,{duration:miss?760:520,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
  return a.finished.then(()=>el.remove());
}
// Coins burst from the customer into the purse, ticking the count up as each lands.
function flyCoins(n,from,to,onLand){
  for(let i=0;i<n;i++){
    const c=document.createElement('div');c.className='flycoin';
    Object.assign(c.style,{left:from.x+'px',top:from.y+'px'});document.body.appendChild(c);
    const dx=to.x-from.x, dy=to.y-from.y, jx=(Math.random()-.5)*60;
    c.animate([
      {transform:'translate(0,0) scale(.4)',opacity:0},
      {transform:`translate(${jx}px,${-30-Math.random()*30}px) scale(1)`,opacity:1,offset:.3},
      {transform:`translate(${dx}px,${dy}px) scale(.7)`,opacity:1}
    ],{duration:480,delay:i*60,easing:'cubic-bezier(.5,0,.4,1)',fill:'forwards'}).finished.then(()=>{c.remove();onLand(i+1,n)});
  }
}
function center(el){const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}}
function serve(){
  if(S.paused||!S.cur||S.serving) return;
  S.serving=true;skipToEnd();
  pourChain.then(()=>{skipAll=false;S.serving=false;doServe()});
}
function doServe(){
  if(S.paused||!S.cur) return;
  if(!S.brew.length){note('Add some ingredients first.');return}
  const {t,par}=S.cur;
  if(S.value===t){
    const n=S.brew.length;
    const speed=S.cur.timed?Math.round(Math.max(0,S.t/S.cur.max)*6):untimedBonus(S.el);
    const tip=n===par?6:n===par+1?3:0, total=10+tip+speed;
    const parts=['10 for the potion'];if(tip)parts.push(`${tip} ${n===par?'master’s tip':'tip'}`);if(speed)parts.push(`${speed} for speed`);
    const col=mixColor(S.brew), old=S.coins;
    S.coins+=total;S.today.coins+=total;S.today.served++;if(n===par)S.today.perfect++;
    S.paused=true;S.brew=[];S.value=0;S.gen++;renderBrew();bump();
    renderHeader();$('#coins').textContent=old;
    toast(`+${total} coins`,parts.join(', '));
    (async()=>{
      if(!RM.matches) await flyFlask(col,false);
      const thanks=THANKS[rand(0,THANKS.length-1)];
      if(RM.matches){$('#coins').textContent=S.coins}
      else flyCoins(Math.min(8,Math.ceil(total/3)),center($('#portrait')),center($('.coin')),(k,m)=>{
        $('#coins').textContent=Math.round(old+(S.coins-old)*k/m);
        const pile=$('.coins');pile.classList.remove('pop');void pile.offsetWidth;pile.classList.add('pop');
      });
      finishCustomer('happy',thanks,650);
    })();
  } else {
    const v=S.value, col=mixColor(S.brew);
    S.coins=Math.max(0,S.coins-2);S.today.coins-=2;if(S.cur.timed)S.t-=S.cur.max*.2;
    toast('−2 coins','Wasted ingredients');
    S.brew=[];recompute();renderHeader();
    const react=()=>{
      if(!S.cur||S.paused)return;
      $('#portrait').innerHTML=portrait(S.cur.c,'cross');
      setSays(`That’s a ${v}. I asked for ${t}.`);
      clearTimeout(serve.t);serve.t=setTimeout(()=>{if(S.cur&&!S.paused){$('#portrait').innerHTML=portrait(S.cur.c,'neutral');setSays(S.cur.line(S.cur.t))}},2400);
    };
    if(RM.matches) react(); else {flyFlask(col,true);setTimeout(react,470)}
  }
}

let last=performance.now();
function loop(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(!S.paused&&S.cur){
    S.el+=dt;
    const clock=$('#clock');
    if(S.cur.timed){
      S.t-=dt;const f=Math.max(0,S.t/S.cur.max);
      $('#patienceFill').style.width=(f*100)+'%';
      $('#patience').classList.toggle('low',f<.3);
      clock.classList.toggle('low',f<.3);
      clock.textContent=`${Math.max(0,Math.ceil(S.t))}s left`;
      if(S.t<=0){S.today.left++;finishCustomer('cross','Hmph. I’ll try the shop across the bridge.')}
    } else {
      const b=untimedBonus(S.el);
      $('#patienceFill').style.width=(Math.max(0,1-S.el/BONUS_WINDOW)*100)+'%';
      clock.classList.remove('low');
      clock.textContent=b?`Speed bonus +${b}`:'No rush';
    }
  }
  requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange',()=>{last=performance.now()});

function openCard(html,onGo){
  S.paused=true;$('#card').innerHTML=html;$('#overlay').hidden=false;
  const b=$('#card .btn.primary');b.focus();b.onclick=()=>{$('#overlay').hidden=true;onGo()};
}
const DAY_NOTES={
  2:{title:'A delivery of cold things',text:'Shadow salt and Frost leaf take strength away. Sometimes it’s quicker to overshoot and pull back.'},
  3:{title:'The clock starts',text:`Word is out, and customers won’t wait forever. Today they’ll give you ${patienceFor(TIMER_DAY)} seconds each, and ${TIMER_STEP} seconds less every day after, down to ${TIMER_FLOOR}.`},
  5:{title:'Moonwater season',text:'Moonwater doubles whatever is already in the cauldron, so the order matters. Bone dust before Moonwater counts twice.'},
  7:{title:'The spice merchant visits',text:'Dragon pepper triples the brew. Add it early and everything after it counts for less.'},
  9:{title:'Fog off the marsh',text:'Mist moss halves the brew, but only when the strength is even.'},
  11:{title:'A troll pays in sweat',text:'Troll sweat takes away 12 in one go. Handy for big brews that overshoot.'},
  13:{title:'Starflower blooms',text:'Starflower divides the brew by three, but only when it splits evenly. 27 works. 28 doesn’t.'},
  26:{title:'A goblin settles his tab',text:'Goblin gold adds 25 in one go. Big orders get a lot shorter.'},
  30:{title:'A wyrm sheds its skin',text:'Wyrm scale multiplies the brew by four. Small numbers early can become huge ones.'},
  34:{title:'The hag next door is crying again',text:'Hag’s tear takes away 20. Useful for trimming a big multiplied brew down to size.'},
  38:{title:'Ashes from the old phoenix',text:'Phoenix ash divides the brew by five, but only when it ends in 0 or 5.'},
  42:{title:'Quicksilver from the mines',text:'Quicksilver divides the brew by four, but only when it splits evenly.'},
  46:{title:'The labels have faded',text:'Years of steam have worn the numbers off your jars. From now on you’ll have to remember what each ingredient does.'},
};
const FLAVOR=['The queue is longer than yesterday.','A travelling bard has been singing about your potions.','The night market is busy.','Someone left a five-star review on the tavern door.','A storm rolls in. Everyone wants something warming.','The rival shop across the bridge has closed for repairs.','The royal court has heard of you.','Pilgrims are passing through on their way north.','A festival is in town and nobody is sleeping.','The guild inspector is watching from the corner.'];

function startDay(){
  const c=dayCfg(S.day);
  const orders=genOrders(S.day),ppl=shuffle(CUSTOMERS),lines=shuffle(LINES);
  S.queue=orders.map((o,i)=>({...o,c:ppl[i],line:lines[i]}));
  S.today={served:0,perfect:0,left:0,coins:0};
  renderShelf();renderHeader();
  const go=()=>nextCustomer();
  if(S.day===1){
    openCard(`<h2>Cauldron Counter</h2>
      <p>Customers come to your stall for potions of an exact strength. Drop ingredients into the cauldron to reach it, then serve.</p>
      <p class="muted">Use the fewest ingredients you can for a bigger tip. There’s no clock for the first two days, but quick potions earn a speed bonus.</p>
      <div class="mini-shelf">${c.ings.map(g=>jarHTML(g,0,true)).join('')}</div>
      <button class="btn primary">Open the shop</button>`,go);
  } else if(DAY_NOTES[S.day]){
    const n=DAY_NOTES[S.day],fresh=c.ings.filter(g=>g.day===S.day);
    const wait=c.timed&&S.day!==TIMER_DAY?` <span class="muted">Customers will wait ${c.patience} seconds.</span>`:'';
    openCard(`<h2>Day ${S.day}</h2><p><strong>${n.title}.</strong> ${n.text}${wait}</p>
      <div class="mini-shelf">${fresh.map(g=>jarHTML(g,0,true)).join('')}</div>
      <button class="btn primary">Open the shop</button>`,go);
  } else {
    openCard(`<h2>Day ${S.day}</h2><p>${FLAVOR[S.day%FLAVOR.length]} Customers will wait <strong>${c.patience} seconds</strong> today.</p>
      <button class="btn primary">Open the shop</button>`,go);
  }
}
function endDay(){
  if(S.coins>best){best=S.coins;try{localStorage.setItem('nk-best',best)}catch(e){}}
  renderHeader();
  openCard(`<h2>Closing time</h2><p class="muted">Day ${S.day} is done.</p>
    <div class="tally">
      <span>Customers served</span><b>${S.today.served} of ${PER_DAY}</b>
      <span>Master’s tips earned</span><b>${S.today.perfect}</b>
      <span>Walked out</span><b>${S.today.left}</b>
      <span>Coins today</span><b>${S.today.coins}</b>
      <span>Purse</span><b>${S.coins}</b>
      <span>Best purse</span><b>${best}</b>
    </div>
    <button class="btn primary">${S.day<LAST_DAY?`Start day ${S.day+1}`:'See how you did'}</button>`,()=>{
      if(S.day<LAST_DAY){S.day++;startDay();return}
      openCard(`<h2>Master of the cauldron</h2>
        <p>You’ve brewed through all ${LAST_DAY} days.</p>
        <div class="tally"><span>Final purse</span><b>${S.coins}</b><span>Best purse</span><b>${best}</b></div>
        <button class="btn primary">Play again</button>`,()=>{S.day=1;S.coins=0;startDay()});
    });
}

$('#shelf').addEventListener('click',e=>{const b=e.target.closest('.jar');if(b)addIngredient(+b.dataset.i,b)});
$('#undo').onclick=undo;$('#empty').onclick=emptyPot;$('#serve').onclick=serve;
document.addEventListener('keydown',e=>{
  if(!$('#overlay').hidden) return;
  if(/^[1-9]$/.test(e.key)){const i=+e.key-1;addIngredient(i,document.querySelector(`.jar[data-i="${i}"]`))}
  else if(e.key==='Backspace'){e.preventDefault();undo()}
  else if(e.key==='Enter'&&document.activeElement.tagName!=='BUTTON'){serve()}
});

renderBrew();startDay();requestAnimationFrame(loop);
