id:uid(),img:heroArt('satchel','#b87a3d',0),badge:'کلکسیون جدید',title:'اصالت چرم، شیکی هر روز',sub:'کیف‌های دست‌دوز با ضمانت اصالت',productId:products[2].id},
        {id:uid(),img:heroArt('tote','#26221f',1),badge:'پرفروش هفته',title:'کیف دوشی آوین',sub:'فضای کافی برای همه‌چیز',productId:products[0].id},
        {id:uid(),img:heroArt('clutch','#7a2236',2),badge:'برای شب‌های خاص',title:'مجلسی‌ها رسیدند',sub:'کلاچ‌های زنجیردار با ارسال سریع',productId:products[1].id}],
  menu:{banner:bannerArt(),title:'SISE',sub:'منوی فروشگاه',items:[
    {id:uid(),label:'صفحه اصلی',icon:'home',color:'#4a7fe0',target:'view:home'},{id:uid(),label:'دسته‌بندی محصولات',icon:'grid',color:'#e0594f',target:'view:categories'},
    {id:uid(),label:'سبد خرید',icon:'bag',color:'#5fb35f',target:'view:cart'},{id:uid(),label:'پیگیری سفارش',icon:'truck',color:'#e8b93a',target:'view:track'},
    {id:uid(),label:'درباره فروشگاه',icon:'info',color:'#9a72d8',target:'about'},{id:uid(),label:'تماس با ما',icon:'phone',color:'#3fb5b5',target:'contact'}]},
  stories,categories:cats,products,
  features:[{id:uid(),icon:'bolt',title:'ارسال سریع',text:'ارسال به سراسر کشور طی ۲۴ تا ۴۸ ساعت.'},{id:uid(),icon:'shield',title:'ضمانت اصالت',text:'کیفیت تضمینی روی تمام محصولات.'},
    {id:uid(),icon:'gift',title:'بسته‌بندی هدیه',text:'جعبه و کیسه‌ی مخصوص بدون هزینه.'},{id:uid(),icon:'undo',title:'۷ روز بازگشت',text:'ضمانت بازگشت کالا تا ۷ روز.'}],
  about:{kicker:'یک انتخاب کامل',introTitle:'با SISE آشنا شو',introText:'SISE انتخاب کاملی برای علاقه‌مندان به کیف چرم است؛ از کلاچ‌های مجلسی تا کیف‌های اداری، با کیفیتی که حسش می‌کنی.',
    title:'SISE',text:'طراحی‌شده برای کسانی که به جزئیات اهمیت می‌دهند و دنبال یک استایل متفاوت‌اند.',nightTitle:'حالت شب',nightHint:'لمس کن برای فعال‌سازی'},
  socials:[{id:uid(),icon:'instagram',name:'اینستاگرام',url:'https://instagram.com'},{id:uid(),icon:'telegram',name:'تلگرام',url:'https://t.me'},{id:uid(),icon:'whatsapp',name:'واتساپ',url:'https://wa.me/'}],
  links:[{id:uid(),label:'درباره ما',target:'page:about'},{id:uid(),label:'قوانین و مقررات',target:'page:rules'},{id:uid(),label:'تماس با پشتیبانی',target:'call'}],
  nav:[{id:'n1',label:'سبد خرید',icon:'bag',view:'cart'},{id:'n2',label:'دسته‌بندی',icon:'grid',view:'categories'},{id:'n3',label:'خانه',icon:'home',view:'home'},{id:'n4',label:'پیگیری خرید',icon:'truck',view:'track'},{id:'n5',label:'گفتگو',icon:'comment',view:'chat'}],
  pay:{card:'6037-9917-0000-0000',owner:'به نام فروشگاه SISE',bank:'بانک ملی',note:'پس از واریز، شماره پیگیری را ثبت کنید.',gateway:''},
  orders:[],users:[],admin:{}}}

/* ---------- storage ---------- */
let S=null;const IDBN='kifara-db';
const idb=()=>new Promise((res,rej)=>{try{const r=indexedDB.open(IDBN,1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}});
async function dbGet(){try{const d=await idb();return await new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get('state');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}catch(e){return null}}
let saveT=0,saveNote=true;
function persist(){clearTimeout(saveT);saveT=setTimeout(async()=>{try{const d=await idb();d.transaction('kv','readwrite').objectStore('kv').put(JSON.parse(JSON.stringify(S)),'state')}catch(e){if(saveNote){saveNote=false;toast('ذخیره‌سازی مرورگر در دسترس نیست؛ تغییرات فقط تا بستن صفحه می‌مانند.')}}},350)}
let HAD_CACHE=false;
function nmFix(o,d){d=d||0;if(d>12||!o||typeof o!=='object')return;for(const k in o){const v=o[k];if(typeof v==='string'){if(v.length<400&&!/^(data|blob|http)/.test(v)&&/کیف[\u200c ]?آرا/.test(v))o[k]=v.replace(/کیف[\u200c ]?آرا/g,'SISE')}else if(v&&typeof v==='object')nmFix(v,d+1)}}
const DEF_FAV=document.getElementById('fav')?document.getElementById('fav').href:'';
function applyFav(){try{const u=(S&&S.store&&S.store.favicon)||DEF_FAV;['fav','fav2'].forEach(id=>{const e=document.getElementById(id);if(e&&e.getAttribute('href')!==u)e.setAttribute('href',u)});setupPWA()}catch(e){}}
const stExpired=s=>(+s.life>0)&&Date.now()>(+s.created||0)+(+s.life)*3600000;
function purgeSt(st){if(!st||!Array.isArray(st.stories))return false;const n=st.stories.length;st.stories=st.stories.filter(s=>!stExpired(s));return st.stories.length!==n}
function stLeft(s){if(!(+s.life>0))return'بدون انقضا؛ خودکار حذف نمی‌شود';const ms=(+s.created||0)+(+s.life)*3600000-Date.now();if(ms<=0)return'منقضی شده؛ با انتشار بعدی حذف می‌شود';const m=Math.ceil(ms/60000);if(m<60)return'باقی‌مانده: '+fa(m)+' دقیقه';const h2=Math.floor(m/60);if(h2<48)return'باقی‌مانده: '+fa(h2)+' ساعت';return'باقی‌مانده: '+fa(Math.floor(h2/24))+' روز'}
const WEBP=(()=>{try{return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp')===0}catch(e){return false}})();
const revs=p=>Array.isArray(p.reviews)?p.reviews.filter(r=>r&&+r.stars>0):[];
const revAvg=p=>{const r=revs(p);return r.length?r.reduce((a,x)=>a+(+x.stars||0),0)/r.length:0};
const fa1=v=>fa(v.toFixed(1)).replace('.','٫');
const starsEl=(v,sz=14)=>h('span',{class:'xst','aria-label':fa1(v)+' از ۵'},[1,2,3,4,5].map(n=>h('i',{class:n<=Math.round(v)?'on':'',html:ic('star',sz)})));
const trustRow=()=>h('div',{class:'xtr'},[['shield','پرداخت امن'],['truck','ارسال به سراسر کشور'],['check','ضمانت ۷ روز بازگشت'],['star','اصالت کالا']].map(([i,t])=>h('span',{class:'xtr-i'},h('i',{html:ic(i,18)}),t)),S.store.enamadImg?h('a',{class:'xenm',href:S.store.enamadLink||'#',target:'_blank',rel:'noopener'},h('img',{src:S.store.enamadImg,alt:'نماد اعتماد الکترونیکی'})):null);
const rvSection=p=>{const l=revs(p);return l.length?h('div',{class:'xrv'},h('div',{class:'cl-t'},'نظر مشتریان',h('span',{},fa1(revAvg(p))+' از ۵ · '+fa(l.length)+' نظر')),l.map(r=>h('div',{class:'xrv-i'},h('div',{class:'xrv-h'},h('b',{},r.name||'مشتری'),starsEl(+r.stars,13)),h('p',{},r.text||''),r.date?h('small',{},r.date):null))):null};
const lgw=()=>{const w=h('span',{class:'lgw'},h('img',{src:S.store.logo,alt:S.store.name}));w.style.setProperty('--lg','url("'+S.store.logo+'")');return w};
let deferredInstall=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});
const isStandalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone}catch(e){return false}};
let _pwaIcon='';
function setupPWA(){try{const src=(S&&S.store&&S.store.favicon)||DEF_FAV;if(!src||src===_pwaIcon)return;_pwaIcon=src;const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#14100b';x.fillRect(0,0,512,512);const r=Math.min(380/im.width,380/im.height);x.drawImage(im,(512-im.width*r)/2,(512-im.height*r)/2,im.width*r,im.height*r);const ic512=c.toDataURL('image/png'),base=location.href.split('#')[0].split('?')[0];
 const man={name:(S.store.name||'SISE')+' | فروشگاه کیف',short_name:S.store.name||'SISE',lang:'fa',dir:'rtl',start_url:base,scope:base.replace(/[^/]*$/,''),display:'standalone',background_color:'#0e0c0a',theme_color:'#0e0c0a',icons:[{src:ic512,sizes:'512x512',type:'image/png',purpose:'any'},{src:ic512,sizes:'192x192',type:'image/png'}]};
 const old=document.getElementById('pwa-man');if(old)old.remove();const l=document.createElement('link');l.id='pwa-man';l.rel='manifest';l.href=URL.createObjectURL(new Blob([JSON.stringify(man)],{type:'application/manifest+json'}));document.head.append(l);
 let a=document.getElementById('pwa-ati');if(!a){a=document.createElement('link');a.id='pwa-ati';a.rel='apple-touch-icon';document.head.append(a)}a.href=ic512;
 [['apple-mobile-web-app-capable','yes'],['mobile-web-app-capable','yes'],['apple-mobile-web-app-title',S.store.name||'SISE']].forEach(([n,v])=>{let m=document.querySelector('meta[name="'+n+'"]');if(!m){m=document.createElement('meta');m.name=n;document.head.append(m)}m.content=v})}catch(e){}};im.src=src}catch(e){}}
function installApp(){if(deferredInstall){const d=deferredInstall;deferredInstall=null;d.prompt();return}openPage('install',{title:'نصب برنامه SISE روی گوشی',text:'اندروید (مرورگر کروم): روی منوی سه‌نقطه بالای مرورگر بزنید، بعد «افزودن به صفحه اصلی» یا «نصب برنامه» را انتخاب کنید.\n\nآیفون (مرورگر سافاری): روی دکمه اشتراک‌گذاری (مربع با فلش رو به بالا) بزنید و «Add to Home Screen» را انتخاب کنید.\n\nبعد از آن، آیکون SISE روی صفحه اصلی گوشی شما می‌نشیند و سایت مثل یک برنامه باز می‌شود.',img:''})}
const DEF_PAGES=()=>[{id:'about',title:'درباره ما',img:'',text:'SISE یک فروشگاه تخصصی کیف‌های دست‌دوز و اصیل است. ما با دقت در جزئیات، چرم مرغوب و دوخت ماندگار، کیف‌هایی می‌سازیم و انتخاب می‌کنیم که هم شیک باشند و هم سال‌ها همراه شما بمانند.\n\nهدف ما این است که خرید برای شما ساده، مطمئن و دلپذیر باشد؛ از انتخاب محصول تا رسیدن بسته به دست شما. برای هر سؤالی از طریق بخش «تماس با پشتیبانی» در کنارتان هستیم.'},{id:'rules',title:'قوانین و مقررات',img:'',text:'۱. قیمت‌ها به تومان است و در لحظه ثبت سفارش، ملاک محاسبه قرار می‌گیرد.\n\n۲. سفارش پس از پرداخت و تایید، آماده‌سازی و ارسال می‌شود. زمان تحویل بسته به روش ارسال انتخابی متفاوت است.\n\n۳. در صورت مغایرت کالا با سفارش یا وجود ایراد ساخت، تا ۷ روز پس از تحویل می‌توانید درخواست مرجوعی بدهید. کالا باید استفاده‌نشده و با بسته‌بندی اصلی باشد.\n\n۴. اطلاعات شما (نام، شماره تماس و نشانی) فقط برای ثبت و ارسال سفارش استفاده می‌شود و در اختیار شخص ثالث قرار نمی‌گیرد.\n\n۵. ثبت سفارش به معنی پذیرش این قوانین است. متن این صفحه ممکن است به‌روزرسانی شود.'}];
function openPage(id,obj){const p=obj||(S.pages||[]).find(x=>x.id===id)||(S.pages||[])[0];if(!p)return;let done=false,y0=0;
 const body=h('div',{class:'tc-b'},h('p',{},p.text||'')),
  card=h('div',{class:'tc glass',role:'dialog','aria-label':p.title},p.img?h('div',{class:'tc-im'},h('img',{src:p.img,alt:p.title})):null,
   h('div',{class:'tc-h'},h('span',{class:'tc-ic',html:ic(id==='rules'?'shield':'info',18)}),h('b',{},p.title),h('button',{class:'tc-x','aria-label':'بستن',html:ic('close',18),onclick:()=>cl()})),
   body,h('button',{class:'btn tc-ok',onclick:()=>cl()},'متوجه شدم')),
  ov=h('div',{class:'tc-ov',onclick:e=>{if(e.target===ov)cl()}},card);
 function cl(){if(done)return;done=true;ov.classList.remove('in');setTimeout(()=>{ov.remove();const k=stack.indexOf(o);if(k>-1)stack.splice(k,1);if(!stack.length&&!$('.sv,.lb,.adm'))document.body.classList.remove('lock')},420)}
 const o={ov,close:cl};stack.push(o);document.body.append(ov);document.body.classList.add('lock');
 card.addEventListener('touchstart',e=>{y0=e.touches[0].clientY},{passive:true});
 card.addEventListener('touchend',e=>{if(y0-e.changedTouches[0].clientY>70&&body.scrollTop<=0||y0-e.changedTouches[0].clientY>70&&body.scrollHeight<=body.clientHeight)cl()},{passive:true});
 requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('in')))}
function callSupport(){const n=normNum(S.store.phone);if(!n){toast('شماره پشتیبانی هنوز ثبت نشده');return}location.href='tel:'+n}
function fixup(s){nmFix(s);s.store=s.store||{};if(s.store.name==='\u0627\u0644\u0627\u06cc'||s.store.name==='ال آی')s.store.name='SISE';Object.assign(s.store,{loadingLogo:s.store.loadingLogo||'',loadingTitle:s.store.loadingTitle||'SISE',loadingText:s.store.loadingText||'DISCOVER YOUR STYLE',loadingBg:(s.store.loadingBg==='#17110b'?'#efe2d2':(s.store.loadingBg||'#efe2d2')),loadingAccent:(s.store.loadingAccent==='#e0b374'?'#68442e':(s.store.loadingAccent||'#68442e')),loadingDuration:s.store.loadingDuration==null?1500:s.store.loadingDuration,loadingEnabled:s.store.loadingEnabled!==false});if(!Array.isArray(s.pages)||!s.pages.length)s.pages=DEF_PAGES();(s.links||[]).forEach(l=>{if(l.target==='about')l.target='page:about';else if(/^url:https?:\/\/example\.com\/?$/.test(l.target||'')&&/قوانین/.test(l.label||''))l.target='page:rules';else if(l.target==='contact')l.target='call'});(s.stories||[]).forEach(x=>{if(!x.created)x.created=Date.now();if(x.life==null)x.life=0});purgeSt(s);s.rack=Object.assign({title:'تخفیف‌خورده‌ها',hint:'انگشت یا موس را روی کیف‌ها بکشید · برای دیدن پشت کیف کلیک کنید',limit:10},s.rack||{});delete s.adminOpen;s.fx=Object.assign({reveal:true,skeleton:true,lift:true,haptic:true,fly:true},s.fx||{});s.store.logoH=s.store.logoH||52;s.orders=s.orders||[];s.users=s.users||[];s.admin=s.admin||{pass:'1234'};s.coupons=Array.isArray(s.coupons)?s.coupons:[];s.ship=Object.assign({phone:'',courierText:'هماهنگی ارسال با ادمین فروشگاه',methods:[{id:'post',title:'پست',price:60000,desc:'ارسال با پست معمولی (۵ تا ۱۰ روز کاری)',on:true},{id:'express',title:'پست پیشتاز',price:90000,desc:'ارسال سریع‌تر (۲ تا ۴ روز کاری)',on:true},{id:'courier',title:'پیک / اسنپ',price:0,desc:'هزینه طبق تعرفه، هماهنگی با ادمین فروشگاه',on:true,courier:true}]},s.ship||{});s.draw=Object.assign({enabled:false,id:uid(),rev:0,title:'قرعه‌کشی ویژه مشتریان',text:'با ثبت‌نام و خرید از فروشگاه در قرعه‌کشی شرکت کنید و برنده جایزه شوید.',prize:'',date:'',btn:'ثبت در قرعه‌کشی',cancel:'فعلاً نه',winners:1,result:[]},s.draw||{});
 if(!s.navChat){s.navChat=1;if(Array.isArray(s.nav)&&!s.nav.some(n=>n.view==='chat')){const i=s.nav.findIndex(n=>n.view==='pay');if(i>=0)s.nav[i]={id:s.nav[i].id,label:'گفتگو',icon:'comment',view:'chat'}}}
 return s}
async function loadState(){let s=null;try{s=await Promise.race([dbGet(),new Promise(resolve=>setTimeout(()=>resolve(null),2500))])}catch(e){}HAD_CACHE=!!(s&&s.v===1);if(!s||s.v!==1)s=seed();if(s.mv!==2){s.theme.mode='light';s.mv=2}fixup(s);S=s;persist()}

/* ---------- Supabase (REST, no SDK) ---------- */
const SB={url:'https://vwprdviufqukdvcroynt.supabase.co',key:'sb_publishable_bw_w5gHwbMaejALHhrmgFQ_kcknv4Z7'};
const PRIV=['admin','users','orders','mv','v','adminOpen','_ts'];
const pubData=()=>{const o={};for(const k in S)if(!PRIV.includes(k))o[k]=S[k];return o};
const sbSess=()=>{try{return JSON.parse(localStorage.getItem('kifara_sb')||'null')}catch(e){return null}};
const sbSave=s=>{try{s?localStorage.setItem('kifara_sb',JSON.stringify(s)):localStorage.removeItem('kifara_sb')}catch(e){}};
async function sbToken(){let s=sbSess();if(!s)return null;if(s.exp-60>Date.now()/1000)return s.access;
 try{const r=await sbFetch('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:s.refresh}});s={access:r.access_token,refresh:r.refresh_token,exp:Date.now()/1000+r.expires_in,email:s.email};sbSave(s);return s.access}catch(e){sbSave(null);return null}}
async function sbFetch(path,{method='GET',body,auth=false,headers={},raw=false,timeout=8000}={}){
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),timeout),hd={apikey:SB.key};
 if(auth){const tok=await sbToken();if(!tok){clearTimeout(t);throw new Error('نشست مدیر منقضی شده؛ دوباره وارد شوید')}hd.Authorization='Bearer '+tok}
 if(!raw)hd['Content-Type']='application/json';
 try{const r=await fetch(SB.url+path,{method,signal:ctl.signal,headers:Object.assign(hd,headers),body:body==null?undefined:(raw?body:JSON.stringify(body))});
  if(!r.ok){let m='';try{const j=await r.json();m=j.message||j.msg||j.error_description||(typeof j.error==='string'?j.error:'')}catch(e){}throw new Error(m||('خطای سرور '+r.status))}
  const tx=await r.text();if(!tx)return null;try{return JSON.parse(tx)}catch(e){return tx}}
 catch(e){if(e.name==='AbortError')throw new Error('پاسخی از سرور نیامد (اینترنت یا فیلتر)');throw e}finally{clearTimeout(t)}}
async function sbLogin(email,pw){const r=await sbFetch('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password:pw}});sbSave({access:r.access_token,refresh:r.refresh_token,exp:Date.now()/1000+r.expires_in,email})}

const CUST_KEY='sise_customer_session';
const custSess=()=>{try{return JSON.parse(localStorage.getItem(CUST_KEY)||'null')}catch(e){return null}};
const custSave=s=>{try{s?localStorage.setItem(CUST_KEY,JSON.stringify(s)):localStorage.removeItem(CUST_KEY)}catch(e){}};
async function custFetch(path,{method='GET',body,token,timeout=12000}={}){
 const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),timeout);
 try{const headers={apikey:SB.key,'Content-Type':'application/json'};if(token)headers.Authorization='Bearer '