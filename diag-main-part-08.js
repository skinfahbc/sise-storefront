tel',inputmode:'tel',placeholder:'شماره موبایل (۰۹…)',value:curUser()?.phone||''}),addr=h('textarea',{class:'in',id:'o-addr',rows:3,placeholder:'آدرس کامل و کد پستی',value:curUser()?[curUser().address,curUser().postal&&'کد پستی: '+curUser().postal].filter(Boolean).join('\n'):''}),note=h('input',{class:'in',id:'o-note',placeholder:'توضیحات (اختیاری)'});
 return[h('h2',{class:'pg-h'},'سبد خرید'),
  h('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}},lines.map(({l,i})=>h('div',{class:'ci glass'},h('img',{src:i.img,alt:''}),h('div',{class:'m'},h('b',{},i.p.title),i.c?h('small',{},'رنگ: '+i.c.name):null,h('div',{class:'price'},money(i.price))),
   h('div',{style:{display:'flex',flexDirection:'column',gap:'8px',alignItems:'center'}},h('div',{class:'qty'},h('button',{'aria-label':'افزایش',html:ic('plus',14),onclick:()=>{const mx=qtyOf(i.p);if(l.qty>=mx)return toast('حداکثر موجودی: '+fa(mx)+' عدد');l.qty++;saveV();renderMain();cartBadge()}}),h('b',{},fa(l.qty)),h('button',{'aria-label':'کاهش',html:ic('down',14),onclick:()=>{l.qty=Math.max(1,l.qty-1);saveV();renderMain();cartBadge()}})),
    h('button',{class:'x','aria-label':'حذف',html:ic('trash',18),onclick:()=>{V.cart=V.cart.filter(c=>c!==l);saveV();renderMain();cartBadge()}}))))),
  cpBox,shipBox,
  h('div',{class:'tot glass'},h('div',{},h('span',{},'جمع کالاها'),h('span',{},money(total))),disc?h('div',{class:'dsc'},h('span',{},'تخفیف ('+fa(cps.p)+'٪)'),h('span',{},'− '+money(disc))):null,h('div',{},h('span',{},'هزینه ارسال'+(shSel?' ('+shSel.title+')':'')),h('span',{},shSel?(shp?money(shp):(shSel.courier?'هماهنگی با ادمین':'رایگان')):'—')),h('div',{class:'g'},h('span',{},'مبلغ قابل پرداخت'),h('span',{},money(pay)))),
  h('form',{class:'frm glass',onsubmit:async e=>{e.preventDefault();
    const ph=normNum(phone.value);if(!name.value.trim())return toast('نام را وارد کنید');if(!/^09\d{9}$/.test(ph))return toast('شماره موبایل معتبر نیست');if(addr.value.trim().length<8)return toast('آدرس را کامل‌تر بنویسید');for(const {l,i} of lines){const q=qtyOf(i.p);if(q<l.qty)return toast('«'+i.p.title+'» '+(q<=0?'تمام شده است':'فقط '+fa(q)+' عدد موجود است'))}if(V.cpCode){const q=cpState(V.cpCode);if(q.err){toast(q.err+' — کد را اصلاح یا پاک کنید');return renderMain()}}
    const submit=e.submitter;if(submit){submit.disabled=true;submit.textContent='در حال ثبت سفارش…'}
    try{
     const created=await sbCreateOrder({customer:{name:name.value.trim(),phone:ph,address:addr.value.trim(),note:note.value.trim()},items:lines.map(({l})=>({pid:l.pid,color:l.color,qty:l.qty})),coupon:V.cpCode||null,shipping:shSel?shSel.id:null});
     if(!created||!created.code||!created.status)throw new Error('پاسخ ثبت سفارش معتبر نیست');
     S.orders=S.orders.filter(o=>o.code!==created.code);S.orders.unshift(created);
     V.orders.push(created.code);V.cart=[];V.cpCode='';saveV();persist();cartBadge();
     toast('سفارش ثبت شد · کد پیگیری: '+created.code);go('pay');if(shSel&&shSel.courier)courierSheet(created.code);
    }catch(err){toast(err.message||'ثبت سفارش انجام نشد؛ دوباره تلاش کنید')}
    finally{if(submit){submit.disabled=false;submit.textContent='ثبت سفارش'}}}},
   h('h3',{style:{margin:0}},'اطلاعات ارسال'),name,phone,addr,note,h('button',{class:'pbtn',type:'submit'},I('check',20),'ثبت سفارش'))]}
const myOrders=()=>S.orders.filter(o=>V.orders.includes(o.code));
const stName=k=>(STATUSES.find(s=>s[0]===k)||[0,k])[1];
function orderCard(o){const steps=STATUSES.filter(s=>s[0]!=='new'&&s[0]!=='canceled'),idx=steps.findIndex(s=>s[0]===o.status);
 return h('div',{class:'oc glass'},h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'8px'}},h('b',{style:{direction:'ltr'}},o.code),h('span',{class:'pill'},stName(o.status))),
  h('small',{style:{color:'var(--muted)'}},new Date(o.created).toLocaleDateString('fa-IR')+' · '+o.items.map(i=>`${i.title}${i.color?' ('+i.color+')':''} × ${fa(i.qty)}`).join('، ')),h('div',{class:'price'},money(o.total)),
  o.status==='canceled'?h('div',{style:{color:'var(--bad)'}},'این سفارش لغو شده است'):h('div',{class:'tl'},steps.map((s,k)=>h('div',{class:k<=idx?'d':''},s[1]))))}
function trackView(){setTimeout(()=>{if(cur==='track'&&V.orders.length)refreshMine().then(c=>c&&cur==='track'&&renderMain())},50);const q=h('input',{class:'in',id:'t-q',placeholder:'کد پیگیری یا شماره موبایل',style:{flex:1}}),out=h('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}});
 const show=list=>{out.innerHTML='';add(out,list.length?list.map(orderCard):[h('div',{class:'empty glass'},I('truck',44),h('div',{},'سفارشی پیدا نشد؛ کد یا شماره را بررسی کنید'))])};
 const mine=myOrders();
 const view=[h('h2',{class:'pg-h'},'پیگیری خرید'),h('form',{class:'search glass',onsubmit:async e=>{e.preventDefault();const v=q.value.trim().toUpperCase(),n=normNum(q.value);if(!v)return;let l=S.orders.filter(o=>o.code===v||(n.length>=10&&o.phone===n));if(!l.length&&/^(?:K\d{6}|SI[A-F0-9]{32})$/.test(v)){out.innerHTML='';out.append(h('div',{class:'empty glass'},'در حال جستجو…'));const d=await sbTrack(v);l=d?[d]:[]}show(l)}},I('search',20),q,h('button',{class:'btn',type:'submit',style:{padding:'8px 16px'}},'جستجو')),out];
 if(mine.length){add(out,[h('div',{class:'sec-h'},h('h3',{},'سفارش‌های شما'))]);add(out,mine.map(orderCard))}else out.append(h('div',{class:'empty glass'},I('truck',44),h('div',{},'کد پیگیری سفارش را وارد کنید')));
 return view}
function payView(){if(!payView.r){payView.r=1;setTimeout(()=>{payView.r=0;if(cur==='pay'&&V.orders.length)refreshMine().then(c=>c&&cur==='pay'&&renderMain())},50)}const un=myOrders().filter(o=>o.status==='new'),P=S.pay||{};
 if(!un.length)return[h('h2',{class:'pg-h'},'پرداخت'),h('div',{class:'empty glass'},I('card',46),h('div',{},'سفارش در انتظار پرداختی ندارید'),h('button',{class:'btn',onclick:()=>go('home')},'ادامه خرید'))];
 let sel=un[0];const box=h('div',{style:{display:'flex',flexDirection:'column',gap:'14px'}});
 const draw=()=>{box.innerHTML='';add(box,[h('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap'}},un.map(o=>h('button',{class:'tb'+(o===sel?' on':''),onclick:()=>{sel=o;draw()}},o.code))),
  h('div',{class:'tot glass'},h('div',{class:'g'},h('span',{},'مبلغ قابل پرداخت'),h('span',{},money(sel.total)))),
  h('div',{class:'frm glass'},h('div',{style:{display:'flex',alignItems:'center',gap:'10px'}},I('shield',22),h('b',{},'پرداخت آنلاین امن')),
   h('p',{class:'fh'},P.note||'برای تکمیل سفارش، از طریق درگاه پرداخت اقدام کنید.'),
   P.gateway?h('button',{class:'pbtn',onclick:()=>openUrl(P.gateway)},I('card',18),'ورود به درگاه پرداخت'):h('div',{class:'auth-vpn-note',style:{marginTop:'4px'}},h('b',{},'درگاه پرداخت هنوز تنظیم نشده است'),h('p',{},'از پنل مدیریت ← تنظیمات ← اطلاعات پرداخت، لینک درگاه خود را وارد و ذخیره کنید.')),
   h('small',{class:'fh'},'پس از اتصال درگاه، برای تأیید خودکار پرداخت باید سرویس بازگشت و تأیید تراکنش در سمت سرور نیز تنظیم شود.'))])};
 draw();return[h('h2',{class:'pg-h'},'پرداخت آنلاین'),box]}
function catView(){const q=h('input',{id:'c-q',placeholder:'جستجوی کیف…',value:catQ,'aria-label':'جستجو'}),res=h('div',{});
 const draw=()=>{res.innerHTML='';const l=S.products.filter(p=>(!catFilter||p.cat===catFilter)&&(!catQ||p.title.includes(catQ)));const c=S.categories.find(x=>x.id===catFilter);
  add(res,[secHead(c?c.name:'همه محصولات',h('span',{style:{color:'var(--muted)',fontSize:'13px'}},fa(l.length)+' محصول')),l.length?pagedGrid(l,()=>res):h('div',{class:'empty glass'},I('search',40),h('div',{},'محصولی پیدا نشد'))])};
 q.addEventListener('input',()=>{catQ=q.value.trim();draw()});draw();
 return[h('h2',{class:'pg-h'},'دسته‌بندی‌ها'),h('div',{class:'search glass'},I('search',20),q),
  h('div',{class:'cats'},S.categories.map(c=>h('button',{class:'cat'+(catFilter===c.id?' on':''),onclick:e=>{catFilter=catFilter===c.id?null:c.id;e.currentTarget.parentNode.querySelectorAll('.cat').forEach(x=>x.classList.remove('on'));if(catFilter)e.currentTarget.classList.add('on');draw()}},h('img',{src:c.img,alt:''}),h('b',{},c.name)))),res]}

/* ---------- menu / auth / contact ---------- */
function openMenu(){let close;const u=curUser();
 const go2=t=>{close();setTimeout(()=>runTarget(t),60)};
 const scroll=h('div',{class:'dr-scroll'},
  h('div',{class:'dr-ban'},h('img',{src:S.menu.banner,alt:''}),h('button',{class:'dr-x','aria-label':'بستن منو',html:ic('chr',20),onclick:()=>close()}),h('div',{class:'t'},h('b',{},S.menu.title),h('span',{},S.menu.sub))),
  h('button',{class:'prof glass',onclick:()=>{close();openAuth()}},avEl(u),h('span',{style:{flex:1}},h('b',{},u?u.name:'ورود / ثبت‌نام'),h('small',{},u?u.phone:'برای پیگیری و ثبت سفارش')),h('span',{class:'ch',html:ic('chl',18)})),
  h('button',{class:'tb',style:{width:'100%',minHeight:'48px',justifyContent:'center',flexShrink:0},onclick:()=>{close();location.href='admin.html'}},I('lock',16),'ورود مدیر'),
  h('div',{class:'lbl'},'ناوبری'),h('div',{class:'mg glass'},[...S.menu.items,...(S.menu.items.some(m=>m.target==='view:chat')?[]:[{id:'chat',label:'گفتگوی همگانی',icon:'comment',color:'#e0794f',target:'view:chat'}]),{id:'chat-ai',label:'چت با هوش مصنوعی',icon:'sparkles',color:'#8b70c8',target:'chat-ai'}].map(m=>h('button',{class:'mi',onclick:()=>go2(m.target)},h('span',{class:'mc',style:{background:m.color},html:ic(m.icon,22)}),h('b',{},m.label),h('span',{class:'ch',html:ic('chl',16)})))),
  h('div',{class:'lbl'},'تنظیمات'),h('div',{class:'mg glass'},isStandalone()?null:h('button',{class:'mi',onclick:()=>{close();setTimeout(installApp,80)}},h('span',{class:'mc',style:{background:'#2f7d6b'},html:ic('phone',22)}),h('b',{},'نصب برنامه روی گوشی'),h('span',{class:'ch',html:ic('chl',16)})),h('button',{class:'mi',onclick:toggleMode},h('span',{class:'mc',style:{background:'#4b5563'},html:ic('moon',22)}),h('b',{},'حالت شب'),h('span',{class:'tg'+(isDark()?' on':'')}))),
  h('div',{class:'soc'},S.socials.map(s=>h('a',{href:s.url,target:'_blank',rel:'noopener','aria-label':s.name,html:ic(s.icon,22),style:{width:'46px',height:'46px'}}))));
 const dr=h('div',{class:'dr',role:'dialog','aria-label':'منو'},scroll);
 close=openModal(dr,'s');
 // Close the drawer for every actionable item, including lower/settings/social controls.
 dr.addEventListener('click',e=>{const a=e.target.closest('button,a');if(a&&dr.contains(a))close()},true)}
function openOtpFlow(linking=false){
 let close,timer=null,seconds=0,sent=false,busy=false;
 const phone=h('input',{class:'in',type:'tel',inputmode:'tel',placeholder:'شماره موبایل 09xxxxxxxxx',autocomplete:'tel',style:{direction:'ltr',textAlign:'left'}}),
  code=h('input',{class:'in',type:'tel',inputmode:'numeric',placeholder:'کد تأیید پیامک‌شده',autocomplete:'one-time-code',style:{direction:'ltr',textAlign:'left'},hidden:true}),
  status=h('small',{class:'fh'},linking?'شماره پس از تأیید به همین حساب فعلی متصل می‌شود.':'با تأیید شماره، مستقیماً وارد حساب SISE می‌شوید.'),
  send=h('button',{class:'pbtn',type:'button'},'ارسال کد تأیید'),
  resend=h('button',{class:'tb',type:'button',hidden:true},'ارسال دوباره کد'),
  verify=h('button',{class:'pbtn',type:'button',hidden:true},'تأیید کد و ادامه');
 const stop=()=>{if(timer){clearInterval(timer);timer=null}};
 const drawTimer=()=>{if(sent&&seconds>0){resend.hidden=true;status.textContent='کد ارسال شد؛ ارسال دوباره تا '+seconds+' ثانیه دیگر فعال می‌شود.'}else if(sent){resend.hidden=false;status.textContent='اگر کد را دریافت نکردید، می‌توانید دوباره درخواست کنید.'}};
 const startTimer=()=>{stop();seconds=60;drawTimer();timer=setInterval(()=>{seconds=Math.max(0,seconds-1);drawTimer();if(seconds===0)stop()},1000)};
 const call=async(action)=>{const headers={apikey:SB.key,'Content-Type':'application/json'};if(action==='verify'&&linking){const token=await custToken();if(!token)throw new Error('نشست حساب فعلی پیدا نشد؛ دوباره با گوگل وارد شوید.');headers.Authorization='Bearer '+token}
  const r=await fetch(SB.url+'/functions/v1/sise-otpy-auth',{method:'POST',headers,body:JSON.stringify({action,phone:phone.value.trim(),code:code.value.trim()})});
  let data={};try{data=await r.json()}catch(e){}if(!r.ok)throw new Error(data.error||'درخواست انجام نشد');return data};
 const doSend=async()=>{if(busy)return;const p=normNum(phone.value);if(!/^09\d{9}$/.test(p))return toast('شماره موبایل معتبر وارد کنید');phone.value=p;busy=true;send.disabled=true;resend.disabled=true;
  try{await call('send');sent=true;code.hidden=false;verify.hidden=false;send.hidden=true;startTimer();toast('کد تأیید ارسال شد')}
  catch(e){toast(e.message||'ارسال کد انجام نشد')}finally{busy=false;send.disabled=false;resend.disabled=false}};
 send.onclick=doSend;resend.onclick=doSend;
 verify.onclick=async()=>{if(busy)return;if(!/^\d{4,8}$/.test(normNum(code.value)))return toast('کد تأیید را درست وارد کنید');busy=true;verify.disabled=true;
  try{const r=await call('verify');if(r.linked){await custRestore();const u=curUser();if(u){u.phone=normNum(phone.value);persist()}stop();close();toast('شماره با موفقیت به حساب فعلی شما متصل شد')}else{
    custSave({access:r.access_token,refresh:r.refresh_token,exp:Date.now()/1000+(Number(r.expires_in)||3600),email:r.user?.email||''});
    await custActivate(r.user);stop();close();toast('ورود با شماره موبایل موفق بود 🌷')
   }}
  catch(e){toast(e.message||'تأیید کد انجام نشد')}finally{busy=false;verify.disabled=false}};
 const panel=h('div',{class:'sh otp-panel',style:{position:'relative',padding:'30px 22px 22px',overflowY:'auto',boxSizing:'border-box'}},
  h('button',{type:'button','aria-label':'بستن پنجره',title:'بستن',onclick:()=>{stop();close()},style:{position:'absolute',top:'12px',right:'14px',width:'38px',height:'38px',borderRadius:'50%',border:'1px solid var(--gb)',background:'var(--field)',color:'var(--fg)',fontSize:'27px',lineHeight:1,display:'grid',placeItems:'center',cursor:'pointer',zIndex:2}},'×'),
  h('div',{style:{textAlign:'center',padding:'18px 8px 12px'}},
   h('div',{style:{width:'54px',height:'54px',margin:'0 auto 12px',borderRadius:'18px',display:'grid',placeItems:'center',background:'linear-gradient(135deg,var(--accent2),var(--accent))',color:'var(--on-accent)',fontSize:'25px',fontWeight:800}},'✦'),
   h('h3',{style:{margin:'0 0 8px',fontSize:'21px',fontWeight:800}},linking?'اتصال شماره به حساب فعلی':'ورود با شماره موبایل'),
   h('p',{class:'fh',style:{margin:'0 auto',maxWidth:'340px',fontSize:'12.5px',lineHeight:1.9}},linking?'برای حفظ سفارش‌ها و اطلاعات، شماره به حساب Google فعلی شما متصل می‌شود.':'کد یک‌بارمصرف برای شماره شما ارسال می‌شود؛ رمز عبور لازم نیست.')),
  h('div',{style:{display:'grid',gap:'12px',marginTop:'12px'}},
   phone,code,
   h('div',{style:{minHeight:'36px',padding:'9px 12px',borderRadius:'13px',background:'var(--field)',border:'1px solid var(--gb)',display:'flex',alignItems:'center',lineHeight:1.8}},status),
   h('div',{style:{display:'grid',gridTemplateColumns:'1fr',gap:'10px'}},send,resend,verify),
   h('button',{class:'tb',type:'button',style:{width:'100%',minHeight:'46px',justifyContent:'center',marginTop:'2px'},onclick:()=>{stop();close()}},'بازگشت')));
 close=openModal(panel,'c');
}
function openAuth(){let close;const u=curUser();
 if(u){close=openModal(h('div',{class:'sh'},h('div',{class:'grab'}),h('div',{class:'prof'},avEl(u),h('span',{},h('b',{},uName(u)),h('small',{},u.email||'حساب SISE'))),
  h('div',{style:{display:'grid',gap:'10px',marginTop:'14px'}},h('button',{class:'pbtn',onclick:()=>{close();openProfile()}},I('user',20),'ویرایش پروفایل'),h('button',{class:'pbtn ghost',onclick:()=>{close();openOtpFlow(true)}},I('phone',20),'اتصال / تأیید شماره موبایل'),h('button',{class:'pbtn ghost',onclick:()=>{close();go('track')}},I('truck',20),'سفارش‌های من'),h('button',{class:'pbtn ghost',onclick:async()=>{await custSignOut();close();toast('از حساب خارج شدید')}},I('logout',20),'خروج از حساب'))),'t');return}
 let mode='in',busy=false;
 const name=h('input',{class:'in',placeholder:'نام و نام خانوادگی',autocomplete:'name'}),email=h('input',{class:'in',type:'email',placeholder:'آدرس جیمیل',autocomplete:'email',style:{direction:'ltr',textAl