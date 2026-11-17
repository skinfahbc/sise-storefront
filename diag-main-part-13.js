rTimeout(syncT);syncT=0;sbPush()}root.remove();document.body.classList.remove('lock');ADM.open=false;if(window.ADMIN_PAGE){try{location.href='index.html'}catch(e){}return}try{if(location.hash==='#admin')history.replaceState(null,'',location.pathname+location.search)}catch(e){}refreshStore()};
 const draw=()=>{tabs.innerHTML='';add(tabs,TABS.map(([k,l,i])=>h('button',{class:'tb'+(k===admTab?' on':''),role:'tab','aria-selected':k===admTab,onclick:()=>{ADM.go(k)}},I(i,16),l)));body.innerHTML='';add(body,PANELS[admTab]());root.scrollTo({top:0})};
 const root=h('div',{class:'adm',role:'dialog','aria-label':'پنل مدیریت'},h('div',{class:'adm-top'},h('div',{class:'adm-t'},h('h2',{},'پنل مدیریت'),h('button',{class:'btn sec',onclick:close},I('eye',18),'مشاهده سایت')),h('div',{class:'sync-row'},h('small',{id:'sync-st',class:'sync'},'متصل به سرور'),h('button',{class:'btn sm',onclick:()=>{clearTimeout(syncT);sbPush()}},'انتشار روی سرور')),tabs),body);
 ADM.go=k=>{if(admTab!==k&&!sisePopHandling){try{history.pushState({...(history.state||{}),siseAdminTab:k},'',location.href)}catch(e){}}admTab=k;draw()};try{history.pushState({siseAdminRoot:true,siseAdminTab:'dash'},'',location.href)}catch(e){}document.body.append(root);document.body.classList.add('lock');ADM.open=true;draw()}

const PANELS={
rack(){
 const R=S.rack||(S.rack={title:'منتخب‌های SISE',hint:'انگشت یا موس را روی کیف‌ها بکشید · برای دیدن کیف کلیک کنید',limit:10,items:[]});
 if(!Array.isArray(R.items))R.items=[];
 // First-time setup: copy the exact products currently shown by the legacy rack
 // into editable independent rack entries. Never replace an existing custom list.
 if(!R.items.some(x=>x&&x.image)){
  const starter=S.products.filter(p=>p.featured!==false&&disc(p)>0&&(p.rackImage||(p.images&&p.images[0]))).sort((a,b)=>disc(b)-disc(a)).slice(0,Math.min(10,Math.max(3,+R.limit||10)));
  if(starter.length){
   R.items=[...R.items,...starter.map(p=>({id:uid(),title:p.title||'کیف منتخب',desc:p.desc||p.description||'',price:+p.price||0,oldPrice:+p.oldPrice||0,discount:disc(p),image:p.rackImage||(p.images&&p.images[0])||'',backImage:(p.images&&p.images[1])||'',active:true,productId:p.id||'',label:p.label||''}))];
   commit();
  }
 }
 const productOpts=[['','بدون اتصال به محصول'],...S.products.map(p=>[p.id,p.title])];
 const items=listEd(R.items,(it)=>[
  g2(fld('نام کیف',tx(it,'title')),fld('محصول مرتبط (اختیاری)',pick(it,'productId',productOpts))),
  fld('توضیحات و نوشته کیف',tx(it,'desc',{area:true,rows:3})),
  g2(fld('قیمت فروش',tx(it,'price',{num:true})),fld('قیمت قبل از تخفیف',tx(it,'oldPrice',{num:true}))),
  g2(fld('درصد تخفیف (قیمت قبل از تخفیف خودکار محاسبه می‌شود)',pctF(it)),tog(it,'active','نمایش در رگال')),
  fld('عکس اصلی کیف · پس‌زمینه شفاف پیشنهاد می‌شود',imgField(it,'image',{max:2200,q:.94,clearable:true,alpha:true})),
  fld('عکس پشت کیف (اختیاری)',imgField(it,'backImage',{max:2200,q:.94,clearable:true,alpha:true})),
  fld('متن دکمه/برچسب (اختیاری)',tx(it,'label'))
 ],()=>({id:uid(),title:'کیف جدید',desc:'',price:0,oldPrice:0,discount:0,image:'',backImage:'',active:true,productId:'',label:''}),
 {title:it=>it.title||'کیف بدون نام',addLabel:'افزودن کیف به رگال',thumb:it=>it.image||'',collapse:true,editAction:true});
 return[
  card('مدیریت مستقل رگال',h('p',{},'کیف‌های این بخش مستقل از گالری محصولات مدیریت می‌شوند. عکس، نوشته و قیمت هر کیف را همین‌جا وارد کنید. برای اتصال دکمه خرید به صفحه محصول، محصول مرتبط را انتخاب کنید؛ در غیر این صورت کیف فقط در رگال و پیش‌نمایش نمایش داده می‌شود.'),
   g2(fld('عنوان رگال',tx(R,'title')),fld('تعداد نمایش (۳ تا ۱۰)',tx(R,'limit',{num:true}))),
   fld('متن راهنمای زیر رگال',tx(R,'hint',{area:true,rows:2})),items,
   h('div',{class:'row'},h('button',{class:'btn',onclick:()=>{commit();sbPush();toast('تنظیمات رگال ذخیره و برای انتشار ارسال شد')}},I('check',16),'ذخیره و انتشار رگال'))),
  card('راهنمای مدیریت',h('small',{class:'fh'},'ترتیب کیف‌ها را با فلش‌های بالا و پایین عوض کنید. خاموش‌کردن «نمایش در رگال» کیف را از سایت پنهان می‌کند؛ حذف، فقط همان آیتم رگال را پاک می‌کند و محصول اصلی دست‌نخورده می‌ماند.'))]
},
inventory(){let map=null,err='',nf={};const box=h('div',{class:'lst'}),LOW=3;
 const mAdm=p=>map&&map[p.id]!=null?map[p.id]:null;
 const upsert=rows=>sbFetch('/rest/v1/stock?on_conflict=pid',{method:'POST',auth:true,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:rows});
 const save=async(p,v)=>{v=Math.max(0,Math.floor(+v)||0);const was=mAdm(p);
  try{await upsert({pid:p.id,qty:v,updated_at:new Date().toISOString()});map=map||{};map[p.id]=v;ST.map=Object.assign(ST.map||{},{[p.id]:v});ST.t=Date.now();draw();refreshStore();
   toast((was!=null&&was<=0&&v>0&&(nf[p.id]||[]).length)?'موجودی ذخیره شد؛ به افراد منتظر پایین همین محصول اطلاع بده':'موجودی ذخیره شد')}catch(e){toast('ذخیره نشد: '+e.message)}};
 const syncAll=async()=>{const rows=S.products.filter(p=>mAdm(p)==null).map(p=>({pid:p.id,qty:Math.max(0,Math.floor(+p.stock)||0),updated_at:new Date().toISOString()}));if(!rows.length)return toast('همه محصولات قبلاً ثبت شده‌اند');
  try{await upsert(rows);toast('همه محصولات ثبت شد');load()}catch(e){toast('ثبت نشد: '+e.message)}};
 const draw=()=>{box.innerHTML='';
  if(err){add(box,h('div',{class:'li'},h('p',{style:{margin:0}},/relation|does not exist|schema cache|404/i.test(err)?'جدول موجودی ساخته نشده.':'بارگیری نشد: '+err)));return}
  if(!map){add(box,h('div',{class:'empty'},'در حال بارگیری…'));return}
  add(box,S.products.length?S.products.map(p=>{const v=mAdm(p),cur=v!=null?v:(+p.stock||0),inp=h('input',{class:'in',type:'text',inputmode:'numeric',value:String(cur),style:{width:'110px',flex:'none',textAlign:'center',direction:'ltr',padding:'12px 6px',fontSize:'16px',fontWeight:'700'},onfocus:e=>e.target.select()}),w=nf[p.id]||[];
   const step=(l,d)=>h('button',{class:'btn sec',type:'button',onclick:()=>{inp.value=Math.max(0,(+normNum(inp.value)||0)+d)}},l);
   return h('div',{class:'li'},h('div',{class:'li-h'},h('span',{style:{display:'flex',gap:'8px',alignItems:'center'}},p.images[0]?h('img',{src:p.images[0],alt:'',style:{width:'42px',height:'42px',borderRadius:'10px',objectFit:'cover'}}):null,h('b',{},p.title)),h('span',{class:'pill'},cur<=0?'اتمام موجودی':(cur<=LOW?'کم‌موجود':'موجود'))),
    h('div',{class:'row',style:{alignItems:'center'}},step('−۱',-1),inp,step('+۱',1),step('+۱۰',10),h('button',{class:'btn',type:'button',onclick:()=>save(p,normNum(inp.value))},v!=null?'ذخیره':'ثبت در انبار')),
    v==null?h('small',{class:'fh'},'هنوز در انبار سرور ثبت نشده (عدد بالا از تنظیمات قدیمی محصول است). بعد از ثبت، با هر فروش خودکار کم می‌شود.'):null,
    w.length?h('div',{class:'li'},h('b',{},'منتظر موجود شدن ('+fa(w.length)+' نفر)'+(cur>0?' · الان موجود است، خبرشان کن':'')),w.map(x=>h('div',{class:'li-h'},h('span',{style:{fontSize:'13px'}},(x.name||'—')+' · '+x.phone),h('span',{class:'row',style:{gap:'6px'}},h('a',{class:'btn sec',href:'tel:'+x.phone,style:{textDecoration:'none'}},'تماس'),h('a',{class:'btn sec',href:'sms:'+x.phone+'?body='+encodeURIComponent('«'+p.title+'» دوباره در '+(S.store.name||'فروشگاه')+' موجود شد 🌸'),style:{textDecoration:'none'}},'پیامک')))),
     h('button',{class:'btn dg',style:{alignSelf:'flex-start'},onclick:ev=>{const b=ev.currentTarget;if(!b.dataset.s){b.dataset.s=1;b.textContent='برای پاک‌کردن لیست دوباره بزنید';return}sbFetch('/rest/v1/stock_notify?pid=eq.'+encodeURIComponent(p.id),{method:'DELETE',auth:true,headers:{Prefer:'return=minimal'}}).then(()=>{delete nf[p.id];draw()}).catch(er=>toast('حذف نشد: '+er.message))}},I('trash',16),'پاک‌کردن لیست منتظران')):null)}):h('div',{class:'empty'},'هنوز محصولی ندارید.'))};
 const load=async()=>{try{const r=await sbFetch('/rest/v1/stock?select=pid,qty',{auth:true});map={};(r||[]).forEach(x=>map[x.pid]=x.qty);
   const n=await sbFetch('/rest/v1/stock_notify?select=id,pid,phone,name,created_at&order=created_at.asc&limit=2000',{auth:true}).catch(()=>[]);nf={};(n||[]).forEach(x=>(nf[x.pid]=nf[x.pid]||[]).push(x));err=''}catch(e){err=e.message||'خطا'}draw()};
 draw();load();
 return[card('موجودی انبار',h('p',{},'تعداد هر محصول را اینجا تنظیم کنید. با هر سفارش جدید، موجودی خودکار کم می‌شود و با لغو سفارش برمی‌گردد. وقتی موجودی صفر شد، محصول روی سایت خاکستری می‌شود و «اتمام موجودی» و دکمه‌ی «خبرم کن» نشان می‌دهد.'),
   h('div',{class:'row'},h('button',{class:'btn sec',onclick:load},'بروزرسانی'),h('button',{class:'btn sec',onclick:syncAll},'ثبت همه محصولات در انبار'),h('button',{class:'btn',onclick:()=>ADM.go('products')},I('plus',16),'افزودن محصول جدید')),box)]},
shipping(){const Sh=S.ship;return[card('روش‌ها و هزینه ارسال',h('p',{},'مشتری هنگام ثبت سفارش یکی از روش‌های فعال را انتخاب می‌کند و هزینه‌ی آن به مبلغ نهایی اضافه می‌شود. قیمت‌های پیش‌فرض نمونه است؛ حتماً با قیمت واقعی خودتان عوض کنید. اگر برای روشی «نمایش پنجره‌ی تماس» را روشن کنید، بعد از ثبت سفارش پنجره‌ی هماهنگی با شماره‌ی تماس باز می‌شود.'),
   listEd(Sh.methods,(m,i,draw)=>[g2(fld('عنوان',tx(m,'title')),fld('هزینه ('+S.store.currency+')',tx(m,'price',{num:true}),'۰ = رایگان / هماهنگی با ادمین')),fld('توضیح کوتاه زیر عنوان',tx(m,'desc')),g2(fld('وضعیت',onoff(m,'on','فعال','غیرفعال',draw)),fld('بعد از ثبت سفارش',onoff(m,'courier','نمایش پنجره‌ی هماهنگی و تماس','بدون پنجره')))],
    ()=>({id:uid(),title:'روش جدید',price:0,desc:'',on:true}),{title:m=>m.title+' · '+(+m.price?money(+m.price):'—'),addLabel:'افزودن روش ارسال'})),
  card('پنجره‌ی هماهنگی (پیک / اسنپ)',fld('شماره‌ی تماس',tx(Sh,'phone',{ph:S.store.phone||'۰۲۱…'}),'خالی باشد، شماره‌ی «اطلاعات فروشگاه» نمایش داده می‌شود'),fld('متن پنجره',tx(Sh,'courierText',{area:true,rows:3})))]},
reports(){let range='30',mode='count';const OK=['paid','processing','shipped','delivered'],MN=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
 const fd=s=>String(s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]),p2=n=>String(n).padStart(2,'0');
 const jp=t=>{const o={};new Intl.DateTimeFormat('fa-IR-u-nu-latn',{year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date(t)).forEach(x=>o[x.type]=x.value);return{y:+o.year,m:+o.month,d:+o.day}};
 const ymd=t=>{const j=jp(t);return j.y*10000+j.m*100+j.d},dstr=t=>{const j=jp(t);return fd(j.y+'/'+p2(j.m)+'/'+p2(j.d))};
 const noon=t=>{const d=new Date(t);d.setHours(12,0,0,0);return d},back=(t,n)=>{const d=noon(t);d.setDate(d.getDate()-n);return d},wstart=t=>{const d=noon(t);d.setDate(d.getDate()-((d.getDay()+1)%7));return d};
 const build=sales=>{const now=Date.now();let keys=[],keyOf;
  if(range==='today'){const k0=ymd(now);keys=[...Array(24).keys()].map(h=>({k:h,label:fd(h),full:'ساعت '+fd(p2(h))+':۰۰'}));keyOf=ts=>ymd(ts)===k0?new Date(ts).getHours():null}
  else if(range==='7'||range==='30'){const n=+range;for(let i=n-1;i>=0;i--){const d=back(now,i);keys.push({k:ymd(d),label:fd(jp(d).d),full:dstr(d)})}keyOf=ts=>ymd(ts)}
  else if(range==='week'){for(let i=11;i>=0;i--){const d=wstart(now);d.setDate(d.getDate()-7*i);const e=new Date(d);e.setDate(e.getDate()+6);keys.push({k:ymd(d),label:fd(jp(d).m+'/'+jp(d).d),full:'هفته '+dstr(d)+' تا '+dstr(e)})}keyOf=ts=>ymd(wstart(ts))}
  else if(range==='month'){const c=jp(now);for(let i=11;i>=0;i--){const ix=c.y*12+(c.m-1)-i,y=Math.floor(ix/12),m=ix%12+1;keys.push({k:y*100+m,label:MN[m-1],full:MN[m-1]+' '+fd(y)})}keyOf=ts=>{const j=jp(ts);return j.y*100+j.m}}
  else{const c=jp(now),y0=Math.max(c.y-5,Math.min(c.y,...sales.map(o=>jp(o.created).y)));for(let y=y0;y<=c.y;y++)keys.push({k:y,label:fd(y),full:'سال '+fd(y)});keyOf=ts=>jp(ts).y}
  return{keys,keyOf}};
 const body=h('div',{style:{display:'grid',gap:'14px'}});
 const draw=()=>{body.innerHTML='';const sales=S.orders.filter(o=>OK.includes(o.status)),{keys,keyOf}=build(sales),agg=new Map(keys.map(x=>[x.k,{c:0,s:0}]));
  sales.forEach(o=>{const a=agg.get(keyOf(o.created));if(a){a.c++;a.s+=+o.total||0}});
  const vals=keys.map(x=>mode==='count'?agg.get(x.k).c:agg.get(x.k).s),mx=Math.max(1,...vals),totC=keys.reduce((a,x)=>a+agg.get(x.k).c,0),totS=keys.reduce((a,x)=>a+agg.get(x.k).s,0),n=keys.length;
  const chips=h('div',{class:'row',style:{overflowX:'auto',flexWrap:'nowrap',paddingBottom:'4px'}},[['today','امروز'],['7','۷ روز گذشته'],['30','۳۰ روز گذشته'],['week','هفتگی'],['month','ماهانه'],['year','سالانه']].map(([k,l])=>h('button',{class:'tb'+(range===k?' on':''),style:{flex:'none'},onclick:()=>{range=k;draw()}},l)));
  const modes=h('div',{class:'row'},[['count','تعداد سفارش'],['sum','مبلغ فروش']].map(([k,l])=>h('button',{class:'tb'+(mode===k?' on':''),onclick:()=>{mode=k;draw()}},l)));
  const chart=h('div',{class:'rc'},keys.map((x,i)=>h('i',{title:x.full+' · '+fa(vals[i]),style:{height:Math.max(3,Math.round(vals[i]/mx*140))+'px',opacity:vals[i]?1:.25}})));
  const lab=h('div',{class:'rl'},keys.map((x,i)=>h('span',{},n>16&&(n-1-i)%3!==0?'':x.label)));
  add(body,[chips,
   card('',h('div',{class:'rp'},h('span',{},'مجموع سفارش‌های موفق'),h('b',{class:'big'},fa(totC))),h('div',{class:'rp'},h('span',{},'مجموع فروش ('+S.store.currency+')'),h('b',{class:'big'},fa(totS))),modes,chart,lab,h('small',{class:'fh'},'فقط سفارش‌های «پرداخت شد» تا «تحویل داده شد» حساب می‌شوند؛ لغوشده و در انتظار پرداخت نه.')),
   card('گزارش',...(totC?keys.slice().reverse().filter(x=>agg.get(x.k).c>0).map(x=>{const a=agg.get(x.k);return h('div',{class:'li'},h('b',{},x.full),h('div',{class:'rp'},h('span',{},'مجموع مبالغ ('+S.store.currency+')'),h('b',{},fa(a.s))),h('div',{class:'rp'},h('span',{},'تعداد سفارش‌های موفق'),h('b',{},fa(a.c))))}):[h('div',{class:'empty'},'در این بازه سفارش موفقی نیست.')]))])};
 draw();loadAdminOrders().then(draw).catch(e=>toast(e.message||'سفارش‌ها بارگیری نشد'));
 return[h('button',{class:'btn sec',style:{alignSelf:'flex-start'},onclick:()=>loadAdminOrders().then(()=>{draw();toast('بروزرسانی شد')}).catch(e=>toast(e.message))},'بروزرسانی از سرور'),body]},
coupons(){const info=c=>{const e=c.expires?Date.parse(c.expires+'T23:59:59'):0;if(c.active===false||!c.active)return'غیرفعال';if(e&&Date.now()>e)return'⛔ منقضی شده';return'✅ فعال'+(c.expires?' تا '+new Date(c.expires+'T12:00:00').toLocaleDateString('fa-IR'):' (بدون انقضا)')};
 const used=c=>S.orders.filter(o=>o.coupon&&String(o.coupon.code).toLowerCase()===String(c.code||'').trim().toLowerCase()).length;
 return[card('کدهای تخفیف',h('p',{},'هر کد یک درصد تخفیف و یک تاریخ انقضا دارد. مشتری کد را در صفحه تکمیل خرید وارد می‌کند؛ بعد از تاریخ انقضا پیام «این کد تخفیف منقضی شده است» می‌بیند. تاریخ انقضا تا پایان همان روز معتبر است و اگر خالی باشد کد انقضا ندارد. بزرگی و کوچکی حروف مهم نیست.'),
  listEd(S.coupons,(c,i,draw)=>[g2(fld('کد تخفیف',tx(c,'code',{ph:'مثلاً takhfif68'})),fld('درصد تخفیف (۱ تا ۱۰۰)',tx(c,'percent',{num:true}))),g2(fld('تاریخ انقضا',dateF(c,'expires',draw)),fld('وضعیت',onoff(c,'active','فعال','غیرفعال',draw))),h('small',{class:'fh'},info(c)+' · '+fa(used(c))+' بار استفاده (طبق سفارش‌های بارگذاری‌شده)')],
   ()=>({id:uid(),code:'',percent:10,expires:'',active:true}),{title:c=>(c.code||'کد جدید')+' · '+fa(+c.percent||0)+'٪',addLabel:'افزودن کد تخفیف'}))]},
draw(){const D=S.draw,okSt=['paid','processing','shipped','delivered'];let entries=null,err='',onlyPaid=true,lastPick=null;const list=h('div',{class:'lst'}),res=h('div',{class:'lst'});
 const elig=()=>{const ph=new Set(S.orders.filter(o=>o.status!=='canceled'&&(!onlyPaid||okSt.includes(o.status))).map(o=>o.phone));return(entries||[]).filter(e=>ph.has(e.phone))};
 const nOrd=p=>S.orders.filter(o=>o.phone===p&&o.status!=='canceled').length,mask=p=>String(p).slice(0,4)+'***'+String(p).slice(-3);
 const drawRes=()=>{res.innerHTML='';
  if(lastPick)add(res,h('div',{class:'li'},h('b',{},'🏆 برنده‌های این دور'),lastPick.map(w=>h('div',{style:{fontSize:'14px'}},w.name+' · '+w.phone)),h('div',{class:'row'},h('button',{class:'btn',onclick:()=>{D.result=lastPick.map(w=>({name:w.name,phone:mask(w.phone)}));D.drawnAt=Date.now();commit();toast('نتیجه روی سایت اعلام شد');drawRes()}},'ذخیره و اعلام روی سایت'),h('button',{class:'btn sec',onclick:pickW},'انتخاب دوباره'))));
  if(D.result&&D.result.length)add(res,h('div',{class:'li'