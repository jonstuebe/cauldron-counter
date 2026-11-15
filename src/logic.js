// Pure game rules: no DOM access, so they can be unit tested.
export const INGS=[
  {id:'dew',   name:'Dewdrop',      op:'+',v:1, color:'#7fc8e8',glyph:'drop',  day:1},
  {id:'bone',  name:'Bone dust',    op:'+',v:4, color:'#d9cfb8',glyph:'bone',  day:1},
  {id:'newt',  name:'Newt eye',     op:'+',v:6, color:'#8fd16a',glyph:'eye',   day:1},
  {id:'ember', name:'Ember root',   op:'+',v:10,color:'#f08a4b',glyph:'flame', day:1},
  {id:'salt',  name:'Shadow salt',  op:'−',v:3, color:'#9a8fd0',glyph:'crystal',day:2},
  {id:'frost', name:'Frost leaf',   op:'−',v:7, color:'#a8e6e0',glyph:'leaf',  day:2},
  {id:'moon',  name:'Moonwater',    op:'×',v:2, color:'#cfc8ff',glyph:'moon',  day:5},
  {id:'dragon',name:'Dragon pepper',op:'×',v:3, color:'#e2504a',glyph:'pepper',day:7},
  {id:'mist',  name:'Mist moss',    op:'÷',v:2, color:'#a6c49f',glyph:'moss',  day:9, err:'Mist moss only halves an even brew.'},
  {id:'troll', name:'Troll sweat',  op:'−',v:12,color:'#c9b45a',glyph:'drops', day:11},
  {id:'star',  name:'Starflower',   op:'÷',v:3, color:'#f5e27a',glyph:'star',  day:13,err:'Starflower only works when the strength splits evenly into three.'},
  {id:'gold',  name:'Goblin gold',  op:'+',v:25,color:'#e3b93f',glyph:'coin',  day:26},
  {id:'wyrm',  name:'Wyrm scale',   op:'×',v:4, color:'#4fa38a',glyph:'scale', day:30},
  {id:'tear',  name:'Hag’s tear',  op:'−',v:20,color:'#9fc3e8',glyph:'tear',  day:34},
  {id:'ash',   name:'Phoenix ash',  op:'÷',v:5, color:'#c95b8f',glyph:'feather',day:38,err:'Phoenix ash only works when the strength divides evenly by five.'},
  {id:'quick', name:'Quicksilver',  op:'÷',v:4, color:'#c8ccd4',glyph:'blob',  day:42,err:'Quicksilver only works when the strength divides evenly by four.'},
];

export const rand=(a,b,rng=Math.random)=>a+Math.floor(rng()*(b-a+1));
export const shuffle=(a,rng=Math.random)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rand(0,i,rng);[a[i],a[j]]=[a[j],a[i]]}return a};
export const PER_DAY=5, MAX_ING=6;

export const LAST_DAY=50, TIMER_DAY=3, FADE_DAY=46, BONUS_WINDOW=36;
// [from day, lowest target, highest target, fewest steps, most steps]
export const TIERS=[[1,7,30,2,4],[2,5,38,2,4],[4,10,50,3,4],[5,18,80,3,5],[7,20,99,3,5],[9,30,140,3,5],[11,30,160,4,5],[13,40,200,4,5],[16,60,260,4,6],[20,80,360,4,6],[23,100,450,5,6],[26,100,450,4,6],[30,120,520,5,6],[34,150,600,5,6],[38,150,650,5,6],[42,200,700,5,6],[46,150,600,4,6],[48,250,800,5,6]];
// 30s on the first timed day, 5s less each day after, never below 10s.
export const TIMER_START=30, TIMER_STEP=5, TIMER_FLOOR=10;
export function patienceFor(d){return d<TIMER_DAY?0:Math.max(TIMER_FLOOR,TIMER_START-TIMER_STEP*(d-TIMER_DAY))}
export function dayCfg(d){
  const ings=INGS.filter(g=>g.day<=d);
  const [,lo,hi,minD,maxD]=TIERS.filter(t=>t[0]<=d).pop();
  const patience=patienceFor(d);
  return {ings,lo,hi,minD,maxD,patience,timed:patience>0};
}
export function untimedBonus(el){return Math.max(0,6-Math.floor(el/6))}
export function apply(v,g){
  if(g.op==='+') return {v:v+g.v};
  if(g.op==='−'){const r=v-g.v;return r<0?{err:`Too weak for ${g.name}. Strength can’t drop below zero.`}:{v:r}}
  if(g.op==='×'){const r=v*g.v;return r>999?{err:'The cauldron can’t hold a brew that strong.'}:{v:r}}
  if(g.op==='÷'){return v%g.v?{err:g.err}:{v:v/g.v}}
}
export function solveMap(ings,maxD){
  const dist=new Map([[0,0]]);let fr=[0];
  for(let d=1;d<=maxD;d++){const nx=[];
    for(const v of fr)for(const g of ings){const r=apply(v,g);if(r.err||r.v>800)continue;if(!dist.has(r.v)){dist.set(r.v,d);nx.push(r.v)}}
    fr=nx}
  return dist;
}
export function genOrders(d,rng=Math.random){
  const c=dayCfg(d),dist=solveMap(c.ings,c.maxD);
  let cands=[...dist].filter(([t,m])=>t>=c.lo&&t<=c.hi&&m>=c.minD);
  if(cands.length<PER_DAY) cands=[...dist].filter(([t,m])=>t>=c.lo&&m>=2);
  return shuffle(cands,rng).slice(0,PER_DAY).map(([t,par])=>({t,par}));
}

export function mixColor(brew){
  if(!brew.length) return 'var(--broth)';
  let r=0,g=0,b=0;
  for(const x of brew){const n=parseInt(x.color.slice(1),16);r+=n>>16&255;g+=n>>8&255;b+=n&255}
  const k=brew.length;return `rgb(${r/k|0},${g/k|0},${b/k|0})`;
}
