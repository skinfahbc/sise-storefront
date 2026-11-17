eated_at||0)-(+a.createdAt||+a.created_at||0));sec.append(pagedGrid(newest,()=>sec.parentElement));return sec})()),
 sh.features&&h('section',{class:'feat'},S.features.map(f=>h('div',{class:'fc glass'},h('span',{class:'fi',html:ic(f.icon,26)}),h('b',{},f.title),h('span',{},f.text)))),
 sh.night&&h('button',{class:'night glass',onclick:toggleMode},h('span',{class:'ni',html:ic('moon',24)}),h('span',{class:'nt'},h('small',{},A.nightHint),h('b',{},A.nightTitle)),h('span',{class:'tg'+(isDark()?' on':'')})),
 sh.about&&h('section',{class:'about glass',id:'about'},h('h3',{},A.title),h('p',{},A.text),
  sh.social&&h('div',{class:'soc'},S.socials.map(s=>h('a',{href:s.url,target:'_blank',rel:'noopener','aria-label':s.name,title:s.name,html:ic(s.icon,24)}))),
  h('div',{class:'links'},S.links.map(l=>h('a',{href:'#',onclick:e=>{e.preventDefault();runTarget(l.target)}},l.label)))),
 h('div',{class:'copy'},S.store.copy)]}
function hero(panel){const sl=S.hero;if(!sl.length)return null;let i=0,timer,moved=false,sx=0;
 const slides=sl.map(s=>h('div',{class:'sl',onclick:()=>{if(moved)return;prod(s.productId)?openProduct(s.productId):go('categories')}},h('img',{src:s.img,alt:s.title}),
  h('div',{class:'tx'},s.badge&&h('span',{class:'chip'},I('sparkle',14),s.badge),h('h2',{},s.title),s.sub&&h('p',{},s.sub),h('span',{class:'btn-g'},'مشاهده جزئیات',I('chl',16)))));
 const dots=h('div',{class:'dots'},sl.map((_,k)=>h('i',{onclick:()=>{show(k);run()}})));const root=h('div',{class:'hero'+(panel?' has-st':'')},slides,dots,h('button',{class:'ib hero-search','aria-label':'جستجو',html:ic('search',20),onclick:openSearch}),panel);
 let pv=-1;const show=n=>{const o=i;i=(n+sl.length)%sl.length;if(i===o&&pv>=0)return;pv=o;slides.forEach((e,k)=>{e.classList.toggle('on',k===i);e.classList.toggle('prev',k===o&&o!==i)});[...dots.children].forEach((e,k)=>e.classList.toggle('on',k===i))};
 const run=()=>{clearInterval(timer);if(sl.length>1)timer=setInterval(()=>{if(!root.isConnected)return clearInterval(timer);show(i+1)},5200)};
 root.addEventListener('pointerdown',e=>{sx=e.target.closest('.hero-st,.hero-search')?null:e.clientX;moved=false});root.addEventListener('pointerup',e=>{if(sx==null)return;const d=e.clientX-sx;if(Math.abs(d)>40){moved=true;show(i+(d<0?1:-1));run()}});
 show(0);run();return root}
function thumbEl(s){if(s.type==='video'&&!s.thumb){const im=h('img',{alt:s.title,src:'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='});vidThumb(s.src).then(d=>{if(d)im.src=d});return im}return h('img',{src:s.thumb||s.src,alt:s.title,loading:'lazy'})}
function storiesSec(inPanel){const list=S.stories,seen=list.filter(s=>V.seen[s.id]).length,all=seen===list.length;
 const row=h('div',{class:'stories',role:'list'},list.map((s,i)=>h('button',{class:'st',role:'listitem',onclick:()=>openStory(i)},h('div',{class:'ring'+(V.seen[s.id]?' seen':'')},thumbEl(s),s.type==='video'?h('span',{class:'pl',html:ic('play',11)}):null),h('span',{},s.title))));
 return h('section',{id:'stories-sec',class:inPanel?'hero-st glass':''},inPanel?h('div',{class:'st-h'},h('span',{html:ic('sparkle',16)}),h('b',{},'استوری‌ها')):null,row,h('div',{class:inPanel?'hint':'hint glass'},h('button',{class:'nb','aria-label':'بعدی',onclick:()=>row.scrollBy({left:-240,behavior:'smooth'}),html:ic('chl',18)}),
  h('span',{class:'bar'},h('b',{style:{width:(list.length?seen/list.length*100:0)+'%'}})),
  h('span',{},list.length?(all?`${fa(list.length)} استوری · ${S.store.storiesHintDone}`:`${fa(list.length-seen)} استوری جدید · ${fa(seen)} دیده شده`):'هنوز استوری‌ای نیست')))}
function refreshStories(){const e=$('#stories-sec');if(e&&S.show.stories)e.replaceWith(storiesSec(e.classList.contains('hero-st')))}
function toggleWish(id,btn){buzz(V.wish[id]?8:[10,40,10]);V.wish[id]=!V.wish[id];if(!V.wish[id])delete V.wish[id];saveV();btn&&btn.classList.toggle('on',!!V.wish[id]);toast(V.wish[id]?'به علاقه‌مندی‌ها اضافه شد':'از علاقه‌مندی‌ها حذف شد')}
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const fxOn=k=>!!(S.fx&&S.fx[k])&&!RM;
const buzz=ms=>{if(S.fx&&S.fx.haptic)try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
function fly(from,src){if(!fxOn('fly')||!from)return;const t=(()=>{const q=document.getElementById('tote');if(q){const r=q.getBoundingClientRect();if(r.width&&r.bottom>0&&r.top<innerHeight)return q}return document.querySelector('.nv-b[data-v="cart"]')})();if(!t)return;const a=from.getBoundingClientRect(),b=t.getBoundingClientRect();if(!a.width||!b.width)return;
 const s=Math.min(64,Math.max(40,a.width/2)),el=h('img',{src:src||'',alt:'',class:'flyer',style:{width:s+'px',height:s+'px',left:(a.left+a.width/2-s/2)+'px',top:(a.top+a.height/2-s/2)+'px'}});document.body.append(el);
 const dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
 const an=el.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.55}px,${dy*.55-70}px) scale(.8)`,opacity:1,offset:.5},{transform:`translate(${dx}px,${dy}px) scale(.2)`,opacity:.4}],{duration:750,easing:'cubic-bezier(.5,0,.4,1)'});
 an.onfinish=()=>{el.remove();t.classList.remove('bump');void t.offsetWidth;t.classList.add('bump')}}
const fmtCd=ms=>{const s=Math.max(0,Math.floor(ms/1000)),d=Math.floor(s/86400),hh=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),c=s%60,p=n=>fa(String(n).padStart(2,'0'));return (d?fa(d)+' روز و ':'')+p(hh)+':'+p(m)+':'+p(c)};
function cdEl(p,cls){if(!(p.endAt>Date.now()))return null;return h('span',{class:'cd '+(cls||''),'data-end':p.endAt,html:ic('clock',13)+'<b>'+fmtCd(p.endAt-Date.now())+'</b>'})}
setInterval(()=>document.querySelectorAll('.cd[data-end]').forEach(e=>{const l=+e.dataset.end-Date.now();if(l<=0)e.remove();else e.lastChild.textContent=fmtCd(l)}),1000);
function revealInit(){if(!fxOn('reveal')||!('IntersectionObserver'in window))return;const els=document.querySelectorAll('#app section,#app .pc,#app .fc,#app .night,#app .copy');if(!els.length)return;
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('rvd');io.unobserve(e.target)}}),{rootMargin:'0px 0px -6% 0px',threshold:.08});
 els.forEach((e,i)=>{if(e.closest('.hero'))return;e.classList.add('rv');e.style.setProperty('--d',(i%2)*70+'ms');io.observe(e)})}
function skImg(src,alt){const i=h('img',{src,alt,loading:'lazy',decoding:'async'}),ok=()=>i.parentNode&&i.parentNode.classList.remove('sk');i.addEventListener('load',ok);i.addEventListener('error',ok);if(i.complete&&src)setTimeout(ok,0);return i}
function pcard(p){const d=disc(p),so=qtyOf(p)<=0;return h('article',{class:'pc glass'+(so?' so':''),title:p.title,'aria-label':p.title,onclick:()=>openProduct(p.id)},
 h('div',{class:'im'+(fxOn('skeleton')?' sk':'')},skImg(p.images[0]||'',p.title),p.badge?h('div',{class:'bd k-'+(p.badgeKind||'gold')},p.badge):null,d?h('span',{class:'off'},fa(d)+'٪ تخفیف'):null,
  so?h('span',{class:'sold'},'اتمام موجودی'):null,
  h('button',{class:'rb fav'+(V.wish[p.id]?' on':''),'aria-label':'علاقه‌مندی',html:ic('heart',20),onclick:e=>{e.stopPropagation();toggleWish(p.id,e.currentTarget)}})),
 h('div',{class:'in'},cdEl(p,'sm'),h('div',{class:'old'},p.oldPrice>p.price?money(p.oldPrice):''),h('div',{class:'price'},fa(p.price),' ',h('small',{},S.store.currency)),revs(p).length?h('div',{class:'xrt'},h('b',{},'★ '),fa1(revAvg(p))+' ('+fa(revs(p).length)+')'):null))}
function pageSize(){return innerWidth>=900?10:8}
function pgList(n,cur,tot){const a=[];const add=x=>a.push(x);if(tot<=7){for(let i=1;i<=tot;i++)add(i)}else{add(1);let s=Math.max(2,cur-1),e=Math.min(tot-1,cur+1);if(cur<=3){s=2;e=4}if(cur>=tot-2){s=tot-3;e=tot-1}if(s>2)add('…');for(let i=s;i<=e;i++)add(i);if(e<tot-1)add('…');add(tot)}return a}
function pagedGrid(list,scrollEl){let page=1;const box=h('div',{});
 const draw=(jump)=>{box.innerHTML='';const ps=pageSize(),tot=Math.max(1,Math.ceil(list.length/ps));if(page>tot)page=tot;
  const g=h('div',{class:'grid'},list.slice((page-1)*ps,page*ps).map(pcard));box.append(g);
  if(tot>1){const go2=n=>()=>{page=n;draw(true)};const bar=h('nav',{class:'pgn','aria-label':'صفحه‌بندی'});
   bar.append(h('button',{'aria-label':'صفحه قبل',disabled:page===1,html:ic('chl',16),onclick:go2(page-1)}));
   pgList(list.length,page,tot).forEach(x=>bar.append(x==='…'?h('span',{class:'dd'},'…'):h('button',{class:x===page?'on':'','aria-current':x===page?'page':null,onclick:go2(x)},fa(x))));
   bar.append(h('button',{'aria-label':'صفحه بعد',disabled:page===tot,html:ic('chr',16),onclick:go2(page+1)}));box.append(bar)}
  if(jump){const t=scrollEl&&scrollEl();t&&t.scrollIntoView({behavior:'smooth',block:'start'});revealInit()}};
 draw();return box}

/* ---------- product sheet + gallery ---------- */
function openProduct(id){const p=prod(id);if(!p)return;let sel=p.colors[0]?.id||'',qty=1;
 const all=[...new Set([...p.images,...p.colors.map(c=>c.img).filter(Boolean)])];
 const mainImg=h('img',{src:p.images[0]||all[0]||'',alt:p.title});
 const thumbs=p.images.map((src,k)=>h('button',{class:k?'':'on','aria-label':'تصویر '+fa(k+1),onclick:()=>{mainImg.src=src;mark(k)}},h('img',{src,alt:''})));
 const mark=k=>thumbs.forEach((b,j)=>b.classList.toggle('on',j===k));
 const fav=h('button',{class:'rb fav'+(V.wish[p.id]?' on':''),style:{position:'absolute',top:'10px',left:'10px',bottom:'auto',right:'auto'},'aria-label':'علاقه‌مندی',html:ic('heart',20),onclick:e=>{e.stopPropagation();toggleWish(p.id,fav)}});
 const main=h('div',{class:'main',onclick:()=>openLightbox(all,Math.max(0,all.indexOf(mainImg.getAttribute('src'))))},mainImg,h('span',{class:'hn'},'برای بزرگ‌نمایی لمس کن'),fav);
 const cname=h('span',{},p.colors[0]?.name||''),cbtn=p.colors.map(c=>h('button',{class:c.id===sel?'on':'','aria-label':c.name,title:c.name,onclick:()=>{sel=c.id;cbtn.forEach((b,j)=>b.classList.toggle('on',p.colors[j].id===sel));cname.textContent=c.name;if(c.img){mainImg.src=c.img;mark(-1)}}},h('i',{style:{background:c.hex}})));
 const qv=h('b',{},fa(1)),d=disc(p);
 const similar=S.products.filter(x=>x.id!==p.id&&x.cat===p.cat).slice(0,6);
 let close;const addNow=()=>addCart(p.id,sel,qty);const rvBox=rvSection(p);
 const sheet=h('div',{class:'sh',role:'dialog','aria-label':p.title},h('div',{class:'grab'}),h('button',{class:'xb','aria-label':'بستن',html:ic('close',20),onclick:()=>close()}),
  h('div',{class:'pg'},main,h('div',{class:'th'},h('div',{class:'th-in'},thumbs))),
  h('h2',{class:'pt'},p.title),revs(p).length?h('a',{class:'xrl',href:'#',onclick:e=>{e.preventDefault();rvBox&&rvBox.scrollIntoView({behavior:'smooth',block:'center'})}},starsEl(revAvg(p)),h('span',{},fa1(revAvg(p))+' ('+fa(revs(p).length)+' نظر)')):null,h('div',{class:'pp'},h('span',{class:'price'},money(p.price)),p.oldPrice>p.price?h('span',{class:'old'},money(p.oldPrice)):null,d?h('span',{class:'disc'},fa(d)+'٪ تخفیف'):null,cdEl(p,'big')),
  p.colors.length?[h('div',{class:'cl-t'},'رنگ‌بندی',cname),h('div',{class:'cl'},cbtn)]:null,
  h('div',{class:'cl-t'},'تعداد',h('span',{},qtyOf(p)>0?`موجود: ${fa(qtyOf(p))} عدد`:'اتمام موجودی')),
  h('div',{class:'qty',style:{marginInline:'2px'}},h('button',{'aria-label':'افزایش',html:ic('plus',16),onclick:()=>{qty=Math.min(qty+1,Math.max(1,qtyOf(p)||99));qv.textContent=fa(qty)}}),qv,h('button',{'aria-label':'کاهش',html:ic('down',16),onclick:()=>{qty=Math.max(1,qty-1);qv.textContent=fa(qty)}})),
  h('div',{class:'desc'},p.desc),trustRow(),rvBox,
  similar.length?[h('div',{class:'cl-t'},'محصولات مشابه'),h('div',{class:'sim'},similar.map(x=>{const c=pcard(x);c.onclick=()=>{close();openProduct(x.id)};return c}))]:null,
  qtyOf(p)<=0?h('div',{class:'actions'},h('button',{class:'pbtn',onclick:()=>notifyMe(p)},I('bell',20),'خبرم کن وقتی موجود شد')):h('div',{class:'actions'},h('button',{class:'pbtn',onclick:()=>{if(addNow()===false)return;fly(mainImg,mainImg.getAttribute('src'));toast('به سبد خرید اضافه شد');close()}},I('bag',20),'افزودن به سبد'),h('button',{class:'pbtn ghost',onclick:()=>{if(addNow()===false)return;close();go('cart')}},'سفارش مستقیم')));
 close=openModal(sheet,'b')}
function openLightbox(list,start){if(!list.length)return;let i=start,x0=0;const img=h('img',{alt:'',draggable:false}),cnt=h('span',{}),th=list.map((s,k)=>h('button',{'aria-label':'تصویر '+fa(k+1),onclick:()=>set(k)},h('img',{src:s,alt:''})));
 const set=n=>{i=(n+list.length)%list.length;img.src=list[i];img.classList.remove('z');cnt.textContent=`${fa(i+1)} / ${fa(list.length)}`;th.forEach((b,k)=>b.classList.toggle('on',k===i))};
 const close=()=>{root.remove();unlock()};
 img.addEventListener('click',e=>{const r=img.getBoundingClientRect();img.style.transformOrigin=`${(e.clientX-r.left)/r.width*100}% ${(e.clientY-r.top)/r.height*100}%`;img.classList.toggle('z')});
 const st=h('div',{class:'lb-st'},img,list.length>1?[h('button',{class:'lb-n p','aria-label':'قبلی',html:ic('chr',24),onclick:()=>set(i-1)}),h('button',{class:'lb-n n','aria-label':'بعدی',html:ic('chl',24),onclick:()=>set(i+1)})]:null);
 st.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});st.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>60&&!img.classList.contains('z'))set(i+(d<0?1:-1))});
 const root=h('div',{class:'lb',role:'dialog','aria-label':'گالری تصاویر'},h('div',{class:'lb-top'},cnt,h('button',{class:'ib','aria-label':'بستن',html:ic('close'),onclick:close})),st,list.length>1?h('div',{class:'lb-th'},th):null);
 document.body.append(root);document.body.classList.add('lock');set(i);
 const esc=e=>{if(e.key==='Escape'){close();removeEventListener('keydown',esc)}};addEventListener('keydown',esc)}

/* ---------- cart / orders ---------- */
function addCart(pid,color,qty){const pp=prod(pid),mx=pp?qtyOf(pp):99,have=V.cart.filter(c=>c.pid===pid).reduce((a,c)=>a+c.qty,0);if(have+qty>mx){toast(mx<=0?'این محصول تمام شده است':'حداکثر موجودی این محصول '+fa(mx)+' عدد است');return false}buzz(18);const l=V.cart.find(c=>c.pid===pid&&c.color===color);l?l.qty+=qty:V.cart.push({pid,color,qty});saveV();cartBadge()}
const lineInfo=l=>{const p=prod(l.pid);if(!p)return null;const c=p.colors.find(x=>x.id===l.color);return{p,c,img:(c&&c.img)||p.images[0],price:p.price*l.qty}};
function cartView(){const lines=V.cart.map(l=>({l,i:lineInfo(l)})).filter(x=>x.i);V.cart=lines.map(x=>x.l);
 if(!lines.length)return[h('h2',{class:'pg-h'},'سبد خرید'),h('div',{class:'empty glass'},I('bag',46),h('div',{},'سبد خرید شما خالی است'),h('button',{class:'btn',onclick:()=>go('home')},'مشاهده محصولات'))];
 const total=lines.reduce((a,x)=>a+x.i.price,0);
 loadStock();
 const SM=((S.ship&&S.ship.methods)||[]).filter(m=>m.on!==false),shSel=SM.find(m=>m.id===V.ship)||SM[0]||null,shp=shSel?(+shSel.price||0):0;
 const cps=V.cpCode?cpState(V.cpCode):null,disc=cps&&cps.p?Math.floor(total*cps.p/100):0,pay=total-disc+shp;
 const shipBox=SM.length?h('div',{class:'shp glass'},h('h3',{style:{margin:0,fontSize:'15px'}},'روش ارسال'),SM.map(m=>h('button',{type:'button',class:'sho'+(shSel&&m.id===shSel.id?' on':''),onclick:()=>{V.ship=m.id;saveV();renderMain()}},h('span',{class:'dot'}),h('span',{class:'t'},h('b',{},m.title),m.desc?h('small',{},m.desc):null),h('span',{class:'p'},+m.price?money(+m.price):(m.courier?'هماهنگی با ادمین':'رایگان'))))):null;
 const cin=h('input',{class:'in',id:'o-cpn',placeholder:'کد تخفیف',value:V.cpCode||'',autocomplete:'off',autocapitalize:'off',style:{direction:'ltr',textAlign:'right',flex:1,minWidth:0}});
 const applyCp=()=>{V.cpCode=cin.value.trim();saveV();renderMain()};
 cin.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyCp()}});
 const cpBox=h('div',{class:'cpn glass'},h('div',{class:'cr'},cin,h('button',{class:'btn',type:'button',onclick:applyCp},'اعمال')),V.cpCode?(cps.err?h('small',{class:'cpm bad'},cps.err):h('small',{class:'cpm ok'},'کد «'+cps.c.code+'» اعمال شد · '+fa(cps.p)+'٪ تخفیف')):null);
 const name=h('input',{class:'in',id:'o-name',placeholder:'نام و نام خانوادگی',value:curUser()?uName(curUser()):''}),phone=h('input',{class:'in',id:'o-phone',type:'