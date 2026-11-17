tton',{class:'btn',type:'submit'},'ارسال');
  const mine=m=>CM_V2&&!m.is_admin&&!!m.uid&&m.uid===idn.uid&&!isTmp(m);
  const drawBar=()=>{bar.innerHTML='';bar.hidden=!(editing||replying);if(editing||replying)add(bar,[h('span',{},editing?'در حال ویرایش نظر':'پاسخ به '+replying.name+': '+rqSnip(replying)),h('button',{type:'button',class:'sb dg','aria-label':'لغو',html:ic('close',16),onclick:()=>cancel()})])};
  const cancel=()=>{editing=null;replying=null;inp.value='';sbtn.textContent='ارسال';drawBar()};
  const startEdit=m=>{editing=m;replying=null;inp.value=m.text||'';sbtn.textContent='ذخیره';drawBar();inp.focus()};
  const startReply=m=>{editing=null;replying=m;inp.value='';sbtn.textContent='ارسال';drawBar();inp.focus()};
  const jump=id=>{const e=lst.querySelector('[data-cid="'+id+'"]');if(e){e.scrollIntoView({block:'nearest',behavior:'smooth'});e.classList.add('flash');setTimeout(()=>e.classList.remove('flash'),1400)}else toast('نظر اصلی پیدا نشد')};
  const del=async(m,b)=>{if(!b.dataset.s){b.dataset.s=1;b.textContent='مطمئنید؟';setTimeout(()=>{b.dataset.s='';b.textContent='حذف'},3000);return}
   try{if(adm){const r=await sbFetch('/rest/v1/story_comments?id=eq.'+enc(m.id)+'&select=id',{method:'DELETE',auth:true,headers:{Prefer:'return=representation'}});if(Array.isArray(r)&&!r.length)return toast('اجازه حذف این نظر را ندارید')}
    else{const ok=await sbFetch('/rest/v1/rpc/sc_delete',{method:'POST',body:{p_id:String(m.id),p_uid:idn.uid,p_tok:idn.tok}});if(ok===false)return toast('اجازه حذف این نظر را ندارید')}
    CM.all=CM.all.filter(x=>x!==m);if(editing===m)cancel();draw();paint();toast('نظر حذف شد')}catch(e){toast('حذف نشد: '+e.message)}};
  const saveEdit=async t=>{const m=editing;if(!m)return;const tx=t.slice(0,300);
   try{let ok;if(adm){const r=await sbFetch('/rest/v1/story_comments?id=eq.'+enc(m.id)+'&select=id',{method:'PATCH',auth:true,headers:{Prefer:'return=representation'},body:{text:tx,edited:true}});ok=!(Array.isArray(r)&&!r.length)}
    else ok=await sbFetch('/rest/v1/rpc/sc_edit',{method:'POST',body:{p_id:String(m.id),p_uid:idn.uid,p_tok:idn.tok,p_text:tx}});
    if(ok===false)return toast('اجازه ویرایش این نظر را ندارید');
    m.text=tx;m.edited=true;cancel();draw();paint();toast('نظر ویرایش شد')}catch(e){toast('ویرایش نشد: '+e.message)}};
  const draw=stick=>{const keep=lst.scrollTop;lst.innerHTML='';const l=cmOf(s.id);
   add(lst,l.length?l.map(m=>{const bs=[],real=!isTmp(m);
    if(real&&CM_V2)bs.push(h('button',{type:'button',onclick:()=>startReply(m)},'پاسخ'));
    if(real&&CM_V2&&(mine(m)||adm))bs.push(h('button',{type:'button',onclick:()=>startEdit(m)},'ویرایش'));
    if(real&&(adm||mine(m))){const d=h('button',{type:'button',onclick:()=>del(m,d)},'حذف');bs.push(d)}
    return h('div',{class:'cmi'+(m.is_admin?' isadm':''),'data-cid':m.id},cmAvatar(m),h('div',{},h('b',{},(m.is_admin?admName():m.name)+' '),m.is_admin?h('span',{class:'adb'},'ادمین'):null,h('small',{},ago(Date.parse(m.created_at)||Date.now())),m.edited?h('small',{class:'ed'},' · ویرایش‌شده'):null,rqEl(m,jump),h('p',{},m.text),bs.length?h('div',{class:'act'},bs):null))
   }):h('div',{class:'empty',style:{padding:'16px'}},'اولین نظر را شما بنویسید'));lst.scrollTop=stick?lst.scrollHeight:keep};
  const send=async()=>{const t=inp.value.trim();if(!t)return;if(editing)return saveEdit(t);
   const u=curUser(),rp=CM_V2?replying:null,nm=adm?(admName()):(u?uName(u):'مهمان'),lg=S.store.logo,
    av=adm?((lg&&/^https?:/.test(lg)&&lg.length<400)?lg:''):(u&&u.avatar?await smallAvatar(u.avatar):''),
    ex=CM_V2?Object.assign({uid:adm?'admin':idn.uid,is_admin:adm},rp?{reply_to:String(rp.id),rname:rp.name,rtext:rqSnip(rp)}:{}):{},
    tokh=CM_V2&&!adm?await chSha(idn.tok):'',
    cm=Object.assign({id:'tmp'+uid(),story_id:s.id,name:nm,text:t.slice(0,300),avatar:av,created_at:new Date().toISOString(),edited:false},ex);
   CM.all=CM.all||[];CM.all.push(cm);cancel();draw(true);paint();
   const base=Object.assign({story_id:s.id,name:nm,text:cm.text},ex,tokh?{tokh}:{}),
    post=b=>sbFetch('/rest/v1/story_comments',{method:'POST',auth:adm,headers:{Prefer:'return=minimal'},body:b,timeout:10000});
   post(av?Object.assign({avatar:av},base):base).catch(e=>av?post(base):Promise.reject(e)).then(()=>{buzz(12);return loadComments(true)}).then(()=>{draw(true);paint()}).catch(e=>{CM.all=CM.all.filter(x=>x!==cm);draw();paint();toast('نظر ارسال نشد: '+e.message)})};
  draw(true);loadComments(true).then(()=>{draw(true);paint()});
  c=sheetIn(h('div',{class:'sh'},h('div',{class:'grab'}),h('button',{class:'xb',style:{background:'var(--field)',color:'var(--fg)'},'aria-label':'بستن',html:ic('close',18),onclick:()=>c()}),h('h3',{},'نظرات'),lst,bar,
   h('form',{class:'row',onsubmit:e=>{e.preventDefault();send()}},inp,sbtn)))};
 cmOv.onclick=()=>cmB.onclick();
 shB.onclick=()=>{const s=list[i],url=location.href.split('#')[0]+'#story-'+s.id,txt=encodeURIComponent(S.store.name+' · '+s.title+'\n'+(s.caption||'')),u=encodeURIComponent(url);let c;
  c=sheetIn(h('div',{class:'sh'},h('div',{class:'grab'}),h('button',{class:'xb',style:{background:'var(--field)',color:'var(--fg)'},'aria-label':'بستن',html:ic('close',18),onclick:()=>c()}),h('h3',{},'اشتراک‌گذاری استوری'),
   h('div',{class:'sharel'},h('a',{href:`https://t.me/share/url?url=${u}&text=${txt}`,target:'_blank',rel:'noopener'},I('telegram',26),'تلگرام'),h('a',{href:`https://wa.me/?text=${txt}%20${u}`,target:'_blank',rel:'noopener'},I('whatsapp',26),'واتساپ'),h('button',{onclick:()=>copyText(url)},I('link',26),'کپی لینک'))))};
 const root=h('div',{class:'sv',role:'dialog','aria-label':'استوری'},h('div',{class:'sv-in'},media,watermark,h('div',{class:'sv-sh'}),bars,h('div',{class:'sv-hd'},hdImg,h('div',{},hdT,hdS),h('span',{class:'sp'}),closeB),zones,h('div',{class:'sv-ft'},cmOv,cap,h('div',{class:'sv-act'},likeB,cmB,shB,prB))));
 document.body.append(root);document.body.classList.add('lock');load(i);last=performance.now();raf=requestAnimationFrame(frame);loadComments().then(()=>paint())}

function updateHd(){const hd=$('#hd');if(!hd)return;const hr=$('.hero');hd.classList.toggle('over',cur==='home'&&!!hr&&scrollY<70)}
addEventListener('scroll',updateHd,{passive:true});
function openSearch(){let close;const inp=h('input',{id:'s-q',placeholder:'جستجوی کیف، رنگ یا دسته…','aria-label':'جستجو',autocomplete:'off'}),res=h('div',{class:'grid'});
 const draw=()=>{const q=inp.value.trim();res.innerHTML='';const l=S.products.filter(p=>!q||(p.title+' '+p.desc+' '+(S.categories.find(c=>c.id===p.cat)?.name||'')+' '+p.colors.map(c=>c.name).join(' ')).includes(q));
  add(res,l.length?l.map(p=>{const c=pcard(p);c.onclick=()=>{close();openProduct(p.id)};return c}):h('div',{class:'empty',style:{gridColumn:'1/-1'}},I('search',40),'محصولی پیدا نشد'))};
 inp.addEventListener('input',draw);draw();
 close=openModal(h('div',{class:'sh',style:{minHeight:'70vh'}},h('div',{class:'grab'}),h('div',{class:'search glass'},I('search',20),inp),h('div',{style:{height:'14px'}}),res),'b');setTimeout(()=>inp.focus(),150)}
/* ---------- boot ---------- */
let rT=0;function refreshStore(){clearTimeout(rT);rT=setTimeout(()=>{applySplashSettings();applyTheme();applyFav();renderHeader();buildNav();renderMain();setNav(false);drawBanner()},120)}
async function boot(){
 try{
  window.__siseBootSetPhase('history');siseBackInit();
  window.__siseBootSetPhase('load-state');await loadState();
  window.__siseBootSetPhase('customer-oauth');custOAuthCallback();
  window.__siseBootSetPhase('splash-settings');applySplashSettings();
  window.__siseBootSetPhase('theme');applyTheme();
  window.__siseBootSetPhase('header');renderHeader();
  window.__siseBootSetPhase('navigation');buildNav();
  window.__siseBootSetPhase('home-render');renderMain();
  window.__siseBootSetPhase('banner');drawBanner();
  window.__siseBootSetPhase('stock');loadStock(true);
  window.__siseBootSetPhase('navigation-position');requestAnimationFrame(()=>setNav(false));
  document.fonts&&document.fonts.ready.then(()=>setNav(false));
  let hs='';try{hs=location.hash}catch(e){}
  if(hs==='#admin'||window.OPEN_ADMIN){window.__siseBootSetPhase('admin-login');openAdminLogin()}
  const seoProductId=new URLSearchParams(location.search).get('product');
  if(seoProductId)setTimeout(()=>openProduct(seoProductId),350);
  window.__siseBootSetPhase('hide-splash');hideSplash();
  window.__siseBootMarkReady();
  // Remote data and customer-session recovery must never block the first storefront render.
  sbPull(HAD_CACHE?4000:6000).then(r=>{if(applyRemote(r))refreshStore()})
   .catch(e=>console.warn('Remote store sync deferred:',e.message))
   .finally(()=>{custRestore().catch(e=>console.warn('Customer session restore deferred:',e.message));retryOrders().catch(e=>console.warn('Order retry deferred:',e.message))});
 }catch(e){
  window.__siseBootReport(e,'boot-catch');
 }
}
function applySplashSettings(){const st=S.store||{},sp=document.getElementById('splash');if(!sp)return;sp.style.setProperty('--splash-bg',st.loadingBg||'#efe2d2');sp.style.setProperty('--splash-mid',st.loadingBg||'#f6eee5');sp.style.setProperty('--splash-deep',st.loadingBg||'#e7d5c1');sp.style.setProperty('--splash-accent',st.loadingAccent||'#68442e');sp.style.setProperty('--splash-text',S.theme&&S.theme.accent2||'#f4dcae');const title=document.getElementById('sp-name'),sub=document.getElementById('sp-text'),mark=document.getElementById('sp-mark');if(title)title.textContent=st.loadingTitle||st.name||'SISE';if(sub)sub.textContent=st.loadingText||'DISCOVER YOUR STYLE';if(mark){const logo=st.loadingLogo||st.logo;if(logo){mark.innerHTML='<img class="sp-logo" alt=""><i class="sp-ring"></i><i class="sp-ring r2"></i>';mark.querySelector('img').src=logo}else{mark.innerHTML='<svg viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="sp-bag" d="M16 23h32l3.5 31h-39z"/><path class="sp-h" d="M24 23v-5a8 8 0 0116 0v5"/><circle class="sp-k" cx="32" cy="37" r="2.6"/></svg><i class="sp-ring"></i><i class="sp-ring r2"></i>'}}}
function hideSplash(){const sp=document.getElementById('splash');if(!sp)return;if(S.store&&S.store.loadingEnabled===false){sp.remove();return}const ms=Math.max(0,Math.min(10000,+S.store.loadingDuration||0));const w=Math.max(0,ms-performance.now());setTimeout(()=>{sp.classList.add('out');setTimeout(()=>sp.remove(),700)},w)}
/* ---------- stock ---------- */
const ST={map:null,t:0,busy:false};
const qtyOf=p=>{const v=ST.map&&ST.map[p.id];return v!=null?v:(+p.stock||0)};
const soldKey=()=>(S&&S.products?S.products.filter(p=>qtyOf(p)<=0).map(p=>p.id).join():'');
async function loadStock(force){if(ST.busy||(!force&&ST.map&&Date.now()-ST.t<20000))return;ST.busy=true;
 try{const before=S&&S.products?soldKey():'',r=await sbFetch('/rest/v1/stock?select=pid,qty',{timeout:7000}),m={};(r||[]).forEach(x=>m[x.pid]=x.qty);ST.map=m;ST.t=Date.now();
  stockBack();const after=soldKey();if(before!==after&&['home','categories'].includes(cur)&&!document.querySelector('.ov,.sv,.lb,.adm'))renderMain()}
 catch(e){}finally{ST.busy=false}}
function stockBack(){if(!S||!S.products)return;const nf=V.nf||{},back=Object.keys(nf).map(prod).filter(p=>p&&qtyOf(p)>0);
 if(back.length){back.forEach(p=>delete nf[p.id]);saveV();toast('دوباره موجود شد: '+back.map(p=>p.title).join('، ')+' 🎉')}}
setInterval(()=>{if(!document.hidden)loadStock()},45000);
async function notifyMe(p){const u=curUser();if(!u){toast('برای اطلاع‌رسانی ابتدا وارد شوید یا ثبت‌نام کنید');openAuth();return}
 if((V.nf||{})[p.id]){toast('قبلاً ثبت شده؛ وقتی موجود شد خبرت می‌کنیم');return}
 try{await sbFetch('/rest/v1/stock_notify',{method:'POST',headers:{Prefer:'return=minimal'},body:{pid:p.id,phone:u.phone,name:uName(u)},timeout:10000})}
 catch(e){if(!/duplicate|unique|23505|409/i.test(e.message||'')){toast(/relation|schema cache|does not exist|404/i.test(e.message||'')?'این قابلیت هنوز راه‌اندازی نشده است':'ثبت نشد: '+e.message);return}}
 (V.nf||(V.nf={}))[p.id]=1;saveV();buzz(12);toast('ثبت شد؛ وقتی «'+p.title+'» موجود شد خبرت می‌کنیم 🔔')}
function courierSheet(code){const phone=(S.ship&&S.ship.phone)||S.store.phone||'',tel=normNum(phone);let close;
 const sh=h('div',{class:'sh',role:'dialog','aria-label':'هماهنگی ارسال'},h('div',{class:'grab'}),h('button',{class:'xb','aria-label':'بستن',html:ic('close',18),onclick:()=>close()}),
  h('h3',{},'ارسال با پیک / اسنپ'),h('p',{style:{lineHeight:1.9,margin:'0 0 8px'}},(S.ship&&S.ship.courierText)||'هماهنگی ارسال با ادمین فروشگاه'),
  h('p',{style:{color:'var(--muted)',margin:'0 0 10px',fontSize:'13px'}},'کد پیگیری سفارش شما: '+code),
  phone?h('div',{class:'tot glass',style:{marginBottom:'10px'}},h('div',{class:'g'},h('span',{},'شماره تماس'),h('span',{style:{direction:'ltr'}},phone))):null,
  tel?h('a',{class:'pbtn',href:'tel:'+tel,style:{textDecoration:'none',justifyContent:'center',marginBottom:'8px'}},I('phone',20),'تماس با فروشگاه'):null,
  h('button',{class:'pbtn ghost',type:'button',onclick:()=>close()},'متوجه شدم'));
 close=openModal(sh,'b')}
/* ---------- coupons ---------- */
function cpState(code){const v=String(code||'').trim().toLowerCase();if(!v)return null;const c=(S.coupons||[]).find(x=>String(x.code||'').trim().toLowerCase()===v);
 if(!c)return{err:'کد تخفیف معتبر نیست'};if(c.active===false)return{err:'این کد تخفیف فعال نیست'};
 const end=c.expires?Date.parse(c.expires+'T23:59:59'):0;if(end&&Date.now()>end)return{err:'این کد تخفیف منقضی شده است'};
 const p=Math.min(100,Math.max(0,+c.percent||0));if(!p)return{err:'کد تخفیف معتبر نیست'};return{c,p}}
/* ---------- draw (lottery) banner ---------- */
const bnKey=()=>S.draw.id+':'+(S.draw.rev||0);
const cdParts=ms=>{const s=Math.max(0,Math.floor(ms/1000));return[Math.floor(s/86400),Math.floor(s%86400/3600),Math.floor(s%3600/60),s%60]};
async function drawJoin(btn){const D=S.draw,u=curUser();
 if(!u){toast('برای شرکت در قرعه‌کشی ابتدا وارد شوید یا ثبت‌نام کنید');openAuth();return}
 if(!myOrders().some(o=>o.status!=='canceled')){toast('فقط کسانی که حداقل یک خرید ثبت‌شده دارند می‌توانند شرکت کنند');return}
 if(btn)btn.disabled=true;
 try{await sbFetch('/rest/v1/draw_entries',{method:'POST',headers:{Prefer:'return=minimal'},body:{draw_id:D.id,phone:u.phone,name:uName(u)},timeout:10000})}
 catch(e){if(!/duplicate|unique|23505|409/i.test(e.message||'')){if(btn)btn.disabled=false;toast(/relation|schema cache|does not exist|404/i.test(e.message||'')?'قرعه‌کشی هنوز راه‌اندازی نشده است':'ثبت نشد: '+e.message);return}}
 (V.dr||(V.dr={}))[D.id]=1;saveV();toast('شما در قرعه‌کشی ثبت شدید 🎉');buzz(15);drawBanner()}
function drawBanner(){let el=document.getElementById('draw-bn');const D=S.draw||{};
 const show=D.enabled&&!window.ADMIN_PAGE&&!(V.dh||{})[bnKey()];
 if(!show){if(el)el.remove();return}
 const end=Date.parse(D.date)||0,ended=!!end&&end<=Date.now(),won=Array.isArray(D.result)&&D.result.length>0,reg=!!(V.dr||{})[D.id];
 const sig=JSON.stringify([D.title,D.text,D.prize,D.date,D.btn,D.cancel,D.result,ended,reg,S.store.name,S.store.logo?1:0]);
 if(el&&el.dataset.sig===sig)return;
 const was=!!el;if(el)el.remove();
 const close=()=>{(V.dh||(V.dh={}))[bnKey()]=1;saveV();const e=document.getElementById('draw-bn');if(e){e.style.transition='.3s';e.style.opacity='0';e.style.transform='translate(-50%,-24px)';setTimeout(()=>e.remove(),300)}};
 const cd=h('div',{class:'bn-cd'},['روز','ساعت','دقیقه','ثانیه'].map(l=>h('div',{},h('b',{},'۰'),h('small',{},l))));
 const closed=ended||won,join=h('button',{type:'button',disabled:reg||closed,onclick:e=>drawJoin(e.currentTarget)},I(reg?'check':'gift',18),reg?'ثبت‌نام شما انجام شد':(closed?'ثبت‌نام بسته شد':(D.btn||'ثبت در قرعه‌کشی')));
 el=h('div',{id:'draw-bn',class:was?'still':'',role:'status','data-sig':sig},
  h('div',{class:'bn-h'},h('span',{class:'ico'},S.store.logo?h('img',{src:S.store.logo,alt:''}):I('gift',14)),h('span',{},S.store.name||'فروشگاه'),h('span',{class:'sp'}),h('button',{type:'button',class:'bn-x','aria-label':'بستن',html:ic('close',16),onclick:close})),
  h('div',{class:'bn-b'},h('div',{class:'bn-