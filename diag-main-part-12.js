t'},D.title||'قرعه‌کشی'),D.text?h('div',{class:'bn-p'},D.text):null,D.prize?h('div',{class:'bn-p'},'🎁 جایزه: '+D.prize):null,
   end?h('div',{class:'bn-d'},'زمان قرعه‌کشی: '+new Date(end).toLocaleString('fa-IR',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})):null,
   end&&!ended?cd:(ended&&!won?h('div',{class:'bn-d'},'زمان قرعه‌کشی رسیده؛ نتیجه به‌زودی اعلام می‌شود.'):null),
   won?h('div',{class:'bn-w'},h('b',{},'🏆 برنده‌ها'),D.result.map(w=>h('div',{},w.name+' · '+w.phone))):null),
  h('div',{class:'bn-a'},won?null:join,h('button',{type:'button',class:'no',onclick:close},h('span',{class:'xc',html:ic('close',12)}),D.cancel||'فعلاً نه')));
 document.body.append(el);drawTick()}
function drawTick(){const el=document.getElementById('draw-bn');if(!el||!S||!S.draw)return;const end=Date.parse(S.draw.date)||0;if(!end)return;const ms=end-Date.now(),bs=el.querySelectorAll('.bn-cd b');
 if(ms<=0){if(bs.length)drawBanner();return}cdParts(ms).forEach((v,k)=>{if(bs[k])bs[k].textContent=fa(v)})}
setInterval(drawTick,1000);
/* ---------- admin ---------- */
const commit=()=>{persist();refreshStore();sbQueue()};
/* ----- server sync (admin only) ----- */
let syncT=0,syncBusy=false,syncDirty=false;const MEDIA=new Map();
function setSt(k,m){const e=document.getElementById('sync-st');if(!e)return;e.dataset.k=k;e.textContent={wait:'تغییرات ذخیره نشده…',busy:'در حال ذخیره روی سرور…',ok:'✓ روی سرور ذخیره شد',err:'⚠ ذخیره نشد: '+(m||''),idle:''}[k]||''}
function sbQueue(){if(!sbSess()||!ADM.open)return;clearTimeout(syncT);setSt('wait');syncT=setTimeout(sbPush,1800)}
async function sbUpload(dataUrl){const m=/^data:([^;,]+)/.exec(dataUrl),type=m?m[1]:'application/octet-stream',blob=await (await fetch(dataUrl)).blob();
 const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/svg+xml':'svg','video/mp4':'mp4','video/webm':'webm','image/gif':'gif'})[type]||'bin',path=Date.now().toString(36)+Math.random().toString(36).slice(2,8)+'.'+ext;
 await sbFetch('/storage/v1/object/media/'+path,{method:'POST',auth:true,raw:true,body:blob,headers:{'Content-Type':type},timeout:90000});return SB.url+'/storage/v1/object/public/media/'+path}
async function uploadMedia(){const jobs=[];(function walk(o){for(const k in o){const v=o[k];if(typeof v==='string'){if(v.startsWith('data:')&&v.length>200)jobs.push([o,k,v])}else if(v&&typeof v==='object')walk(v)}})(pubData());
 for(let i=0;i<jobs.length;i+=4){await Promise.all(jobs.slice(i,i+4).map(async([o,k,v])=>{let u=MEDIA.get(v);if(!u){u=await sbUpload(v);MEDIA.set(v,u)}if(o[k]===v)o[k]=u}))}
 if(jobs.length)persist()}
async function sbPush(){if(syncBusy){syncDirty=true;return}syncBusy=true;try{do{syncDirty=false;setSt('busy');await uploadMedia();const ts=new Date().toISOString();
  await sbFetch('/rest/v1/site',{method:'POST',auth:true,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{id:'main',data:pubData(),updated_at:ts},timeout:30000});S._ts=ts;persist()}while(syncDirty);setSt('ok')}catch(e){setSt('err',e.message)}finally{syncBusy=false}}
async function loadAdminOrders(){const r=await sbFetch('/rest/v1/orders?select=data&order=created_at.desc',{auth:true});S.orders=r.map(x=>x.data);persist()}
const sbSaveOrder=o=>sbFetch('/rest/v1/orders?code=eq.'+encodeURIComponent(o.code),{method:'PATCH',auth:true,headers:{Prefer:'return=minimal'},body:{data:o}}).then(()=>toast('وضعیت ذخیره شد')).catch(e=>toast('ذخیره نشد: '+e.message));
const fld=(label,input,hint)=>h('label',{class:'f'},h('span',{class:'fl'},label),input,hint?h('small',{class:'fh'},hint):null);
function tx(o,k,{area,rows=3,ph='',num,type='text'}={}){const i=h(area?'textarea':'input',{class:'in',type:area?null:(num?'number':type),value:o[k]??'',rows:area?rows:null,placeholder:ph});i.addEventListener('input',()=>{o[k]=num?(+i.value||0):i.value;commit()});return i}
function pctF(p){const i=h('input',{class:'in',type:'number',min:0,max:99,step:1,value:disc(p)});i.addEventListener('change',()=>{const n=Math.min(99,Math.max(0,+i.value||0));p.oldPrice=n>0&&+p.price>0?Math.round(+p.price/(1-n/100)):0;commit();i.value=disc(p)});return i}
function pick(o,k,opts,cb){const s=h('select',{class:'in'},opts.map(([v,l])=>h('option',{value:v},l)));s.value=o[k]??'';s.addEventListener('change',()=>{o[k]=s.value;cb&&cb();commit()});return s}
function colorF(o,k){const c=h('input',{type:'color',value:o[k]||'#000000'}),t=h('input',{class:'in',value:o[k]||'',style:{direction:'ltr'}});c.addEventListener('input',()=>{o[k]=c.value;t.value=c.value;commit()});t.addEventListener('change',()=>{if(/^#[0-9a-f]{6}$/i.test(t.value)){o[k]=t.value;c.value=t.value;commit()}});return h('div',{class:'cp'},c,t)}
function range(o,k,min,max,unit,label){const out=h('b',{},fa(o[k])+unit),r=h('input',{type:'range',class:'rg',min,max,value:o[k]});r.addEventListener('input',()=>{o[k]=+r.value;out.textContent=fa(o[k])+unit;commit()});return fld(label,h('div',{},r),null)}
function tog(o,k,label,cb){const t=h('button',{type:'button',class:'tg'+(o[k]?' on':''),role:'switch','aria-checked':!!o[k],'aria-label':label,onclick:()=>{o[k]=!o[k];t.classList.toggle('on',o[k]);t.setAttribute('aria-checked',o[k]);cb&&cb();commit()}});return h('div',{class:'tgl'},h('span',{},label),t)}
function cdIn(p){const i=h('input',{class:'in',type:'number',min:0,placeholder:'مثلاً ۴۸',value:p.endAt>Date.now()?Math.ceil((p.endAt-Date.now())/36e5):''});i.addEventListener('change',()=>{const v=+i.value||0;p.endAt=v>0?Date.now()+v*36e5:0;commit()});return i}
function imgField(o,k,opts={}){const pv=h('div',{class:'pv'}),url=h('input',{class:'in',placeholder:'یا لینک تصویر',value:o[k]&&!String(o[k]).startsWith('data:')?o[k]:'',style:{direction:'ltr'}});
 const draw=()=>{pv.innerHTML='';const v=o[k];v?pv.append(opts.video&&o.type==='video'?h('video',{src:v,muted:true,preload:'metadata'}):h('img',{src:v,alt:''})):pv.append(I('image',26))};
 const file=h('input',{type:'file',accept:opts.video?'image/*,video/*':'image/*','aria-label':'انتخاب فایل'});
 file.onchange=async()=>{const f=file.files[0];if(!f)return;try{o[k]=await readFile(f,{max:opts.max||1400,q:opts.q||.84,keepAlpha:opts.alpha});if(opts.video){o.type=f.type.startsWith('video/')?'video':'image';if(o.type==='video'){const d=await vidThumb(o[k],400);if(d)o.thumb=d}else o.thumb=''}url.value='';draw();commit();toast('بارگذاری شد');if(opts.video&&typeof ADM!=='undefined'&&ADM.go)ADM.go('stories')}catch(e){toast(e.message||'بارگذاری انجام نشد')}file.value=''};
 url.onchange=()=>{o[k]=url.value.trim();if(opts.video)o.type=/\.(mp4|webm|mov)(\?|$)/i.test(o[k])?'video':'image';draw();commit()};
 draw();return h('div',{class:'imf'},pv,h('div',{class:'ct'},h('div',{class:'row'},h('span',{class:'up btn sec'},I('plus',18),opts.video?'عکس یا ویدیو':'انتخاب تصویر',file),opts.clearable?h('button',{class:'btn dg',type:'button',onclick:()=>{o[k]='';url.value='';draw();commit()}},I('trash',16)):null),url))}
function listEd(arr,render,mk,{title,addLabel='افزودن',fixed,min=0,thumb,collapse,editAction=false}={}){const box=h('div',{class:'lst'}),OPEN=new Set();
 const draw=()=>{box.innerHTML='';arr.forEach((it,i)=>{const mv=d=>()=>{const j=i+d;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];commit();draw()};
  const key=it.id||i,isOpen=!collapse||OPEN.has(key),rich=!!(thumb||collapse),tt=title?title(it,i):'#'+fa(i+1),src=thumb?thumb(it):'';
  const bd=h('div',{style:{display:isOpen?'flex':'none',flexDirection:'column',gap:'12px'}},isOpen?render(it,i,draw):null);
  const lab=rich?h('span',{style:{display:'flex',alignItems:'center',gap:'10px',flex:'1',minWidth:'0',cursor:collapse?'pointer':'default'},onclick:collapse?()=>{OPEN.has(key)?OPEN.delete(key):OPEN.add(key);draw()}:null},
    h('span',{style:{flex:'none',minWidth:'30px',height:'30px',borderRadius:'10px',display:'grid',placeItems:'center',background:'linear-gradient(135deg,var(--accent2),var(--accent))',color:'var(--on-accent)',fontWeight:'800',fontSize:'13px'}},fa(i+1)),
    src?h('img',{src,alt:'',style:{width:'48px',height:'48px',borderRadius:'12px',objectFit:'cover',flex:'none'}}):null,
    h('b',{style:{flex:'1',minWidth:'0',lineHeight:'1.5'}},tt),collapse?h('span',{html:ic(isOpen?'up':'down',18),style:{flex:'none',color:'var(--muted)'}}):null):h('b',{},tt);
  box.append(h('div',{class:'li'+(rich?' li-x':'')},h('div',{class:'li-h'},lab,h('span',{class:'li-a'},editAction&&collapse?h('button',{class:'btn sec sm',type:'button',onclick:()=>{OPEN.has(key)?OPEN.delete(key):OPEN.add(key);draw()}},I('edit',14),isOpen?'بستن ویرایش':'ویرایش'):null,h('button',{class:'sb','aria-label':'بالا',html:ic('up',16),onclick:mv(-1)}),h('button',{class:'sb','aria-label':'پایین',html:ic('down',16),onclick:mv(1)}),
   fixed||arr.length<=min?null:(editAction?h('button',{class:'btn dg sm',type:'button',onclick:e=>{const b=e.currentTarget;if(b.dataset.confirm!=='1'){b.dataset.confirm='1';b.textContent='تأیید حذف؟';return}arr.splice(i,1);commit();draw()}},I('trash',14),'حذف'):h('button',{class:'sb dg','aria-label':'حذف',html:ic('trash',16),onclick:()=>{arr.splice(i,1);commit();draw()}})))),bd))});
  if(!fixed)box.append(h('button',{class:'btn add',onclick:()=>{const n=mk();arr.push(n);if(n.id)OPEN.add(n.id);commit();draw()}},I('plus',18),addLabel))};draw();return box}
function dateF(o,k,cb,type='date'){const i=h('input',{class:'in',type,value:o[k]||'',style:{direction:'ltr',textAlign:'right'}});i.addEventListener('change',()=>{o[k]=i.value;commit();cb&&cb()});return i}
function onoff(o,k,on='فعال',off='غیرفعال',cb){const s=h('select',{class:'in'},h('option',{value:'1'},on),h('option',{value:'0'},off));s.value=o[k]?'1':'0';s.addEventListener('change',()=>{o[k]=s.value==='1';commit();cb&&cb()});return s}
const card=(t,...k)=>h('section',{class:'ac glass'},t?h('h3',{},t):null,...k);
const g2=(...k)=>h('div',{class:'g2'},...k);
const ICON_OPTS=Object.keys(ICONS).map(k=>[k,k]);
const TARGETS=()=>[['view:home','صفحه اصلی'],['view:categories','دسته‌بندی'],['view:cart','سبد خرید'],['view:track','پیگیری سفارش'],['view:pay','پرداخت'],['view:chat','گفتگوی همگانی'],['call','تماس تلفنی مستقیم با پشتیبانی'],['contact','کارت اطلاعات تماس'],['about','رفتن به کارت «درباره» صفحه اصلی'],...(S.pages||[]).map(p=>['page:'+p.id,'صفحه: '+p.title]),['login','ورود / ثبت‌نام'],...S.products.map(p=>['product:'+p.id,'محصول: '+p.title])];
function targetF(o,k){const opts=TARGETS(),isUrl=String(o[k]||'').startsWith('url:');const s=pick(o,k,[...opts,['url:','آدرس اینترنتی…']]);if(isUrl)s.value='url:';
 const u=h('input',{class:'in',placeholder:'https://…',style:{direction:'ltr',display:isUrl?'':'none'},value:isUrl?o[k].slice(4):''});
 s.addEventListener('change',()=>{u.style.display=s.value==='url:'?'':'none';if(s.value==='url:')o[k]='url:'+u.value;commit()});u.addEventListener('input',()=>{o[k]='url:'+u.value;commit()});return h('div',{style:{display:'grid',gap:'8px'}},s,u)}
const prodOpts=(none='بدون لینک')=>[['',none],...S.products.map(p=>[p.id,p.title])];

function stockF(p){const inp=h('input',{class:'in',type:'text',inputmode:'numeric',placeholder:'تعداد',style:{width:'110px',flex:'none',textAlign:'center',direction:'ltr',fontSize:'16px',fontWeight:'700'},onfocus:e=>e.target.select()}),st=h('small',{class:'fh'},'در حال بارگیری…');
 const step=(l,d)=>h('button',{class:'btn sec',type:'button',onclick:()=>{inp.value=Math.max(0,(+normNum(inp.value)||0)+d)}},l);
 const save=async()=>{const v=Math.max(0,Math.floor(+normNum(inp.value))||0);try{await sbFetch('/rest/v1/stock?on_conflict=pid',{method:'POST',auth:true,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{pid:p.id,qty:v,updated_at:new Date().toISOString()}});inp.value=v;ST.map=Object.assign(ST.map||{},{[p.id]:v});ST.t=Date.now();p.stock=v;st.textContent='✓ ذخیره شد: '+fa(v)+' عدد';toast('موجودی ذخیره شد')}catch(e){st.textContent='ذخیره نشد: '+e.message;toast('ذخیره نشد: '+e.message)}};
 sbFetch('/rest/v1/stock?pid=eq.'+encodeURIComponent(p.id)+'&select=qty',{auth:true}).then(r=>{if(r&&r[0]){inp.value=r[0].qty;st.textContent='موجودی فعلی روی سرور'}else{inp.value=+p.stock||0;st.textContent='هنوز در انبار ثبت نشده؛ با «ذخیره موجودی» ثبت می‌شود'}}).catch(e=>{inp.value=+p.stock||0;st.textContent='خطا: '+e.message});
 return h('div',{style:{display:'grid',gap:'6px'}},h('div',{class:'row',style:{flexWrap:'wrap'}},step('−۱',-1),inp,step('+۱',1),step('+۱۰',10),h('button',{class:'btn',type:'button',onclick:save},'ذخیره موجودی')),st)}
function lifeF(s){const info=h('small',{class:'fh'},stLeft(s)),sel=h('select',{class:'in',onchange:()=>{s.life=+sel.value;s.created=Date.now();commit();info.textContent=stLeft(s)}},[[24,'۲۴ ساعت'],[72,'۳ روز'],[168,'یک هفته'],[720,'یک ماه'],[0,'بدون انقضا']].map(([v,l])=>h('option',{value:String(v)},l)));sel.value=String(+s.life||0);return h('div',{style:{display:'grid',gap:'6px'}},sel,info,h('small',{class:'fh'},'شمارش از لحظه ثبت یا تغییر مدت شروع می‌شود و بعد از اتمام، استوری در سایت دیده نمی‌شود و با انتشار بعدی از سرور پاک می‌شود.'))}
const TABS=[['dash','نمای کلی','list'],['general','اطلاعات فروشگاه','gear'],['theme','رنگ و شیشه','palette'],['content','صفحه اصلی','home'],['hero','اسلایدر','image'],['menu','منوی کشویی','menu'],['stories','استوری‌ها','play'],['products','محصولات','box'],['rack','مدیریت رگال','hanger'],['nav','منوی پایین','grid'],['orders','سفارش‌ها','truck'],['inventory','موجودی','box'],['shipping','هزینه ارسال','truck'],['reports','گزارش فروش','list'],['comments','نظرات استوری','comment'],['chat','گفتگوی همگانی','users'],['coupons','کد تخفیف','tag'],['draw','قرعه‌کشی','gift'],['settings','تنظیمات','lock']];
const ADM={open:false};
const enDigits=s=>String(s||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
function openAdminLogin(){if(ADM.open)return;let c;const ss=sbSess();
 const enter=async()=>{const b=document.getElementById('ad-go');if(b){b.disabled=true;b.textContent='در حال اتصال…'}
  try{let r=null,pulled=false;try{r=await sbPull(8000);pulled=true}catch(e){}if(r)applyRemote(r);await loadAdminOrders().catch(()=>{});c();openAdmin();
   if(pulled&&!r)setTimeout(sbPush,500);else if(!pulled)setTimeout(()=>setSt('err','اتصال به سرور برقرار نشد؛ بعداً «انتشار» را بزنید'),300);else setSt('ok')}
  catch(e){toast(e.message);if(b){b.disabled=false;b.textContent='ورود'}}};
 const em=h('input',{class:'in',id:'ad-em',type:'email',placeholder:'ایمیل مدیر',autocomplete:'username',autocapitalize:'off',autocorrect:'off',spellcheck:'false',style:{direction:'ltr'},value:ss?.email||''}),pw=h('input',{class:'in',id:'ad-pw',type:'password',placeholder:'رمز عبور مدیر',autocomplete:'current-password',autocapitalize:'off',autocorrect:'off',spellcheck:'false',style:{direction:'ltr'}});
 const go1=async e=>{e.preventDefault();const b=document.getElementById('ad-go');b.disabled=true;b.textContent='در حال ورود…';try{await sbLogin(em.value.trim().toLowerCase(),pw.value.trim())}catch(er){toast(/credentials/i.test(er.message)?'ایمیل یا رمز اشتباه است (پیام سرور: '+er.message+')':'خطا: '+er.message);b.disabled=false;b.textContent='ورود';pw.value='';return}enter()};
 c=openModal(h('form',{class:'sh',onsubmit:go1},h('div',{class:'grab'}),h('h3',{},'ورود به پنل مدیریت'),h('div',{style:{display:'grid',gap:'12px'}},
  ss?h('button',{class:'pbtn',type:'button',id:'ad-go',onclick:enter},I('lock',18),'ادامه با '+ss.email):null,ss?h('small',{class:'fh',style:{textAlign:'center'}},'یا با حساب دیگری وارد شوید:'):null,
  em,h('div',{class:'row',style:{gap:'8px',alignItems:'center'}},pw,h('button',{type:'button',class:'btn sec',style:{padding:'10px 14px'},onclick:e=>{pw.type=pw.type==='password'?'text':'password';e.currentTarget.textContent=pw.type==='password'?'نمایش':'مخفی'}},'نمایش')),h('button',{class:ss?'pbtn ghost':'pbtn',type:'submit',id:ss?'':'ad-go'},I('lock',18),'ورود'))),'c');setTimeout(()=>(ss?pw:em).focus(),80)}
let admTab='dash';
function openAdmin(){const body=h('div',{class:'adm-b'}),tabs=h('div',{class:'tabs',role:'tablist'});
 const close=()=>{if(syncT){clea