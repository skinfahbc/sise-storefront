ign:'left'}}),pass=h('input',{class:'in',type:'password',placeholder:'رمز عبور (حداقل ۸ کاراکتر)',autocomplete:'current-password',style:{direction:'ltr',textAlign:'left'}}),tabs=h('div',{class:'row'}),form=h('form',{style:{display:'grid',gap:'12px'}}),hint=h('small',{class:'fh'},'با ایمیل و رمز عبور وارد شوید؛ برای ورود در دستگاه دیگر از همین اطلاعات استفاده کنید.');
 const draw=()=>{tabs.innerHTML='';add(tabs,[['in','ورود'],['up','ثبت‌نام']].map(([k,t])=>h('button',{class:'tb'+(mode===k?' on':''),type:'button',style:{flex:1,justifyContent:'center'},onclick:()=>{mode=k;pass.autocomplete=mode==='in'?'current-password':'new-password';draw()}},t)));form.innerHTML='';add(form,[h('button',{class:'pbtn ghost',type:'button',onclick:custGoogleSignIn},'ادامه با حساب Google'),h('button',{class:'pbtn ghost',type:'button',onclick:()=>{close();openOtpFlow(false)}},'ورود مستقیم با شماره موبایل'),mode==='up'?name:null,email,pass,hint,h('button',{class:'pbtn',type:'submit',disabled:busy},mode==='in'?'ورود به حساب':'ساخت حساب'),mode==='in'?h('button',{class:'tb',type:'button',onclick:async()=>{if(!email.value.trim())return toast('ابتدا ایمیل را وارد کنید');try{await custFetch('/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+'/' ),{method:'POST',body:{email:email.value.trim().toLowerCase()}});toast('لینک بازیابی رمز به ایمیلتان ارسال شد')}catch(e){toast('ارسال لینک انجام نشد: '+e.message)}}},'فراموشی رمز عبور؟'):null])};
 form.onsubmit=async e=>{e.preventDefault();if(busy)return;const em=email.value.trim().toLowerCase(),pw=pass.value;
  if(!/^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(em))return toast('ایمیل معتبر وارد کنید');if(pw.length<8)return toast('رمز عبور باید حداقل ۸ کاراکتر باشد');if(mode==='up'&&!name.value.trim())return toast('نام و نام خانوادگی را وارد کنید');
  busy=true;draw();try{if(mode==='in'){await custSignIn(em,pw);close();toast('ورود موفق؛ خوش آمدید 🌷')}
   else{const ok=await custSignUp(em,pw,name.value.trim());if(ok){close();toast('حساب ساخته شد؛ خوش آمدید 🌷')}else{mode='in';draw();toast('لینک تأیید به ایمیلتان ارسال شد؛ پس از تأیید با همین ایمیل و رمز وارد شوید')}}}
  catch(err){toast('ورود انجام نشد: '+err.message)}finally{busy=false;draw()}};
 draw();const vpnNotice=h('div',{class:'auth-vpn-note'},h('button',{class:'auth-vpn-x',type:'button','aria-label':'بستن پیام',onclick:()=>vpnNotice.remove()},'×'),h('b',{},'راهنمای ورود با جیمیل'),h('p',{},'اگر ورود با حساب Google شروع نشد یا صفحه ورود باز نشد، ابتدا VPN را روشن کنید. بعد از تکمیل ورود و بازگشت به سایت SISE، می‌توانید VPN را خاموش کنید.'));close=openModal(h('div',{class:'sh'},h('div',{class:'grab'}),h('h3',{},'ورود به حساب SISE'),vpnNotice,tabs,h('div',{style:{height:'12px'}}),form),'c')}
function openProfile(){const u=curUser();if(!u)return openAuth();let av=u.avatar||'',close;
 const pv=h('span',{class:'av big'}),draw=()=>{pv.innerHTML='';pv.append(av?h('img',{src:av,alt:''}):uInit(u))};draw();
 const file=h('input',{type:'file',accept:'image/*','aria-label':'تغییر عکس پروفایل'});file.onchange=async()=>{const f=file.files[0];if(!f)return;try{av=await readFile(f,{max:360});draw()}catch(e){toast(e.message||'بارگذاری نشد')}file.value=''};
 const F=(id,ph,v,o={})=>h('input',Object.assign({class:'in',id,placeholder:ph,value:v||''},o));
 const first=F('p-first','نام',u.first||uName(u).split(' ')[0]),last=F('p-last','نام خانوادگی',u.last!=null?u.last:uName(u).split(' ').slice(1).join(' ')),
  mob=F('p-mob','تلفن همراه',u.phone,{type:'tel',inputmode:'tel',style:{direction:'ltr',textAlign:'right'}}),tel=F('p-tel','تلفن ثابت (با کد شهر)',u.landline,{type:'tel',inputmode:'tel',style:{direction:'ltr',textAlign:'right'}}),
  post=F('p-post','کد پستی ۱۰ رقمی',u.postal,{type:'tel',inputmode:'numeric',maxlength:'10',style:{direction:'ltr',textAlign:'right'}}),addr=h('textarea',{class:'in',id:'p-addr',rows:3,placeholder:'آدرس کامل'},u.address||'');
 const L=(t,n)=>h('label',{class:'pf'},h('span',{},t),n);
 const save=async()=>{const m=normNum(mob.value),pc=normNum(post.value),ln=normNum(tel.value);
  if(!first.value.trim())return toast('نام را وارد کنید');if(!/^09\d{9}$/.test(m))return toast('شماره موبایل معتبر نیست');
  if(S.users.some(x=>x.id!==u.id&&x.phone===m))return toast('این شماره قبلاً ثبت شده است');
  if(pc&&pc.length!==10)return toast('کد پستی باید ۱۰ رقم باشد');if(ln&&ln.length<8)return toast('تلفن ثابت معتبر نیست');
  const token=await custToken();if(!token)return toast('نشست ورود منقضی شده؛ دوباره وارد شوید');
  try{
   let avatar=av;if(avatar&&avatar.startsWith('data:'))avatar=await chUpload(avatar);
   const profile={first:first.value.trim(),last:last.value.trim(),phone:m,landline:ln,postal:pc,address:addr.value.trim(),avatar};
   const updated={...u,...profile};updated.name=uName(updated);
   await syncCustomerProfile(updated,token);
   Object.assign(u,profile,{name:updated.name});persist();renderHeader();close();toast('پروفایل در حساب شما ذخیره شد');
  }catch(e){toast('ذخیره پروفایل روی سرور ناموفق بود: '+e.message)}
 };
 close=openModal(h('div',{class:'sh'},h('div',{class:'grab'}),h('h3',{},'ویرایش پروفایل'),
  h('div',{class:'pf-av'},pv,h('span',{class:'btn sec up'},I('image',18),'تغییر عکس',file),av?h('button',{class:'btn sec',type:'button',onclick:()=>{av='';draw()}},'حذف'):null),
  h('div',{class:'pf-g'},L('نام',first),L('نام خانوادگی',last),L('تلفن همراه',mob),L('تلفن ثابت',tel),L('کد پستی',post)),L('آدرس',addr),
  h('button',{class:'pbtn',style:{marginTop:'14px',width:'100%'},onclick:save},'ذخیره تغییرات')),'t')}
function openContact(){const c=openModal(h('div',{class:'sh'},h('div',{class:'grab'}),h('h3',{},'تماس با ما'),
 h('div',{style:{display:'grid',gap:'10px'}},h('div',{class:'tgl'},h('span',{},'تلفن'),h('b',{style:{direction:'ltr'}},S.store.phone)),h('div',{class:'tgl'},h('span',{},'آدرس'),h('b',{style:{textAlign:'left'}},S.store.address)),h('div',{class:'soc'},S.socials.map(s=>h('a',{href:s.url,target:'_blank',rel:'noopener','aria-label':s.name,html:ic(s.icon,22)}))))),'c')}

/* ---------- video poster (first frame) + small avatar helpers ---------- */
const VT={};
function vidThumb(src,max=400){if(!src)return Promise.resolve('');if(VT[src])return VT[src];
 return VT[src]=new Promise(res=>{const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';if(!/^(data|blob):/.test(src))v.crossOrigin='anonymous';
  let done=false,best=null,k=0;const ts=[.1,.8,1.6,2.6];const fin=d=>{if(done)return;done=true;try{v.removeAttribute('src');v.load()}catch(e){}res(d||'')};
  const grab=()=>{const w=v.videoWidth||max,hh=v.videoHeight||max,sc=Math.min(1,max/Math.max(w,hh)),c=document.createElement('canvas');c.width=Math.round(w*sc);c.height=Math.round(hh*sc);c.getContext('2d').drawImage(v,0,0,c.width,c.height);
   const t=document.createElement('canvas');t.width=t.height=12;const x=t.getContext('2d');x.drawImage(c,0,0,12,12);const p=x.getImageData(0,0,12,12).data;let s=0;for(let j=0;j<p.length;j+=4)s+=p[j]*.3+p[j+1]*.59+p[j+2]*.11;return{d:c.toDataURL('image/jpeg',.8),b:s/144}};
  const step=()=>{try{const f=grab();if(!best||f.b>best.b)best=f;if(best.b>45||++k>=ts.length)return fin(best.d);v.currentTime=Math.min(ts[k],Math.max(0,(v.duration||ts[k])-.1))}catch(e){fin(best?best.d:'')}};
  v.addEventListener('loadeddata',()=>{try{v.currentTime=Math.min(ts[0],(v.duration||1)/2)}catch(e){fin('')}});
  v.addEventListener('seeked',step);v.addEventListener('error',()=>fin(best?best.d:''));setTimeout(()=>fin(best?best.d:''),12000);v.src=src;v.load()})}
function smallAvatar(src,px=56){if(!src)return Promise.resolve('');return new Promise(res=>{const im=new Image();im.onload=()=>{try{const s=Math.min(im.width,im.height),c=document.createElement('canvas');c.width=c.height=px;c.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,px,px);res(c.toDataURL('image/jpeg',.7))}catch(e){res('')}};im.onerror=()=>res('');im.src=src})}
const cmAvatar=(m,cls)=>{if(m.is_admin){const a=((S.store&&S.store.adminAvatar)||'')||m.avatar||'',nn=((S.store&&S.store.adminName)||'').trim()||'sisé';return h('span',{class:'av'+(cls?' '+cls:'')},a?h('img',{src:a,alt:''}):nn[0])}const u=!m.avatar&&(S.users||[]).find(x=>x.avatar&&uName(x)===m.name),src=m.avatar||(u&&u.avatar)||'';return h('span',{class:'av'+(cls?' '+cls:'')},src?h('img',{src,alt:''}):(m.name||'؟')[0])};
/* ---------- story comments (shared, stored in Supabase) ---------- */
const CM={all:null,t:0};
let CM_V2=true;const CM_OLD='id,story_id,name,text,avatar,created_at',CM_NEW=CM_OLD+',uid,is_admin,edited,reply_to,rname,rtext';
const cmV2Err=e=>/column|schema|reply_to|rname|rtext|is_admin|edited|uid/i.test((e&&e.message)||'');
async function loadComments(force){if(CM.all&&!force&&Date.now()-CM.t<15000)return CM.all;
 try{let r;const q=cols=>sbFetch('/rest/v1/story_comments?select='+cols+'&order=created_at.asc&limit=600',{timeout:7000});
  if(CM_V2){try{r=await q(CM_NEW)}catch(e){if(cmV2Err(e))CM_V2=false;else throw e}}
  if(!CM_V2){try{r=await q(CM_OLD)}catch(e0){r=await q('id,story_id,name,text,created_at')}}
  CM.all=r||[];CM.t=Date.now()}catch(e){CM.all=CM.all||[]}return CM.all}
const cmOf=sid=>(CM.all||[]).filter(c=>c.story_id===sid);
function cmIdent(){const u=curUser();if(u)return{uid:u.id,tok:chTok(u)};if(!V.gid){V.gid='g'+uid()+uid();V.gtok=uid()+uid()+uid()+uid();saveV()}return{uid:V.gid,tok:V.gtok}}
/* ---------- public chat room (Supabase table chat_messages) ---------- */
const STICKERS=['😍','😂','🥰','😎','🤩','😭','😡','🥳','👍','👏','🙏','💪','❤️','🔥','✨','🎉','🛍️','👜','💖','🌹','☕','🎁','😴','🤝'];
const CH_OLD='id,uid,name,avatar,text,image,is_admin,edited,created_at';let CH_V2=true;const chCols=()=>CH_V2?CH_OLD+',reply_to,rname,rtext':CH_OLD;
const chV2Err=e=>/reply_to|rname|rtext/i.test((e&&e.message)||'');
/* reply helpers (shared by chat + story comments) */
const rqSnip=m=>{const x=String(m.text||'');return x.startsWith('::st::')?x.slice(6):(x?x.replace(/\s+/g,' ').slice(0,80):(m.image?'📷 عکس':''))};
const rqEl=(m,jump)=>m.reply_to?h('div',Object.assign({class:'rq'},jump?{onclick:()=>jump(m.reply_to)}:{}),h('b',{},m.rname||''),h('span',{},m.rtext||'')):null;
const chJump=id=>{const e=document.querySelector('.chm[data-mid="'+id+'"]');if(e){e.scrollIntoView({block:'center',behavior:'smooth'});e.classList.add('flash');setTimeout(()=>e.classList.remove('flash'),1400)}else toast('پیام اصلی در لیست نیست')};
const CH={msgs:[],timer:0,busy:false,err:'',sentAt:0,tab:'pub'};
const chTmp=m=>String(m.id).startsWith('tmp');
const chSha=async s=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return ''}};
function chTok(u){if(!u.ctok){u.ctok=uid()+uid()+uid()+uid();persist()}return u.ctok}
async function chPickImage(f){if(!f)return '';if(!/^image\//.test(f.type)||f.type==='image/svg+xml'){toast('فقط فایل عکس مجاز است');return ''}return readFile(f,{max:1000,q:.78})}
async function chUpload(dataUrl){const blob=await (await fetch(dataUrl)).blob(),path=Date.now().toString(36)+Math.random().toString(36).slice(2,8)+'.jpg';
 await sbFetch('/storage/v1/object/chat/'+path,{method:'POST',raw:true,body:blob,headers:{'Content-Type':'image/jpeg'},timeout:60000});return SB.url+'/storage/v1/object/public/chat/'+path}
async function chLoad(first){if(CH.busy)return false;CH.busy=true;let changed=false;
 try{
  if(first||!CH.msgs.some(m=>!chTmp(m))){
   const pend=CH.msgs.filter(chTmp),r=((await sbFetch('/rest/v1/chat_messages?select='+chCols()+'&order=id.desc&limit=80',{timeout:7000}))||[]).reverse();
   CH.err='';CH.msgs=r.concat(pend);changed=true}
  else{
   const L=(await sbFetch('/rest/v1/chat_messages?select=id,text,image,edited&order=id.desc&limit=80',{timeout:7000}))||[];CH.err='';
   const set=new Map(L.map(x=>[x.id,x])),minId=L.length>=80?L[L.length-1].id:0,have=new Set(CH.msgs.map(m=>m.id)),need=L.filter(x=>!have.has(x.id)).map(x=>x.id);
   if(need.length){const full=(await sbFetch('/rest/v1/chat_messages?select='+chCols()+'&id=in.('+need.join(',')+')&order=id.asc',{timeout:7000}))||[];full.forEach(m=>CH.msgs.push(m));changed=true}
   CH.msgs=CH.msgs.filter(m=>{if(chTmp(m)||m.id<minId||set.has(m.id))return true;changed=true;return false});
   CH.msgs.forEach(m=>{const x=set.get(m.id);if(x&&(x.text!==m.text||(x.image||null)!==(m.image||null)||!!x.edited!==!!m.edited)){m.text=x.text;m.image=x.image;m.edited=x.edited;changed=true}});
   CH.msgs.sort((a,b)=>(typeof a.id==='number'?a.id:1e15)-(typeof b.id==='number'?b.id:1e15))}
  if(CH.msgs.length>250)CH.msgs=CH.msgs.slice(-200)}
 catch(e){if(CH_V2&&chV2Err(e)){CH_V2=false;CH.busy=false;return chLoad(first)}CH.err=e.message||'خطا'}
 CH.busy=false;return changed}
function chMsgEl(m,o={}){const st=String(m.text||'').startsWith('::st::'),ai=!!m.ai_generated;
 return h('div',{class:'chm'+(o.me?' me':'')+(st?' stk':'')+(m.is_admin?' isadm':'')+(ai?' isai':''),'data-mid':m.id},cmAvatar(m),h('div',{class:'chb'},h('b',{},ai?'دستیار هوشمند SISE':(m.is_admin?admName():m.name)),m.is_admin?h('span',{class:'adb'},ai?'هوش مصنوعی':'ادمین'):null,ai&&m.needs_admin?h('span',{class:'nb'},'نیازمند بررسی مدیر'):null,
  rqEl(m,chJump),
  m.image?h('img',{class:'chi',src:m.image,alt:'',loading:'lazy',onclick:()=>openLightbox([m.image],0)}):null,
  m.text?h('p',{},String(m.text).replace(/^::st::/,'')):null,
  h('small',{},ago(Date.parse(m.created_at)||Date.now()),m.edited?h('span',{class:'ed'},'· ویرایش‌شده'):null),o.acts||null))}
/* ---------- private chat with the store manager (Supabase table pm + rpc pm_send / pm_list) ---------- */
const admName=()=>((S.store&&S.store.adminName)||'').trim()||'sisé';
const admAv=()=>(S.store&&S.store.adminAvatar)||'';
const PM={rows:[],timer:0};
const pmSetup=e=>/pm_send|pm_list|schema cache|relation|does not exist|404|Could not find/i.test((e&&e.message)||String(e||''));const pmAuthErr=e=>/authentication_required|account_not_registered|invalid JWT|JWT expired|نشست ورود/i.test((e&&e.message)||String(e||''));
/* ---------- chat page lock + AI floating button ---------- */
let AIF={t:0,t2:0};
function chFit(){const vv=window.visualViewport,set=()=>{const on=document.body.classList.contains('chat-lock');document.documentElement.style.setProperty('--vvh',on&&vv?Math.round(vv.height)+'px':'100dvh');if(on)window.scrollTo(0,0)};if(!window.__chFit){window.__chFit=1;if(vv){vv.addEventListener('resize',set);vv.addEventListener('scroll',()=>{if(document.body.classList.contains('chat-lock'))window.scrollTo(0,0)})}addEventListener('resize',set)}set()}
function syncChatLock(){const on=cur==='chat',app=$('#app');document.body.classList.toggle('chat-lock',on);if(app)app.classList.toggle('chatp',on);chFit()}
function syncAiFab(){let f=document.getElementById('aiFab');const show=cur==='home'&&!stack.length&&!(S.store&&S.store.aiFab===false);
 if(!show){if(f){f.remove();clearTimeout(AIF.t);clearTimeout(AIF.t2)}return}
 if(f)return;
 f=h('button',{id:'aiFab',class:'ai-fab',type:'button','aria-label':'چت با هوش مصنوعی',onclick:()=>{CH.tab='ai';go('chat')}},h('span',{class:'ai-ic',html:ic('sparkles',26)}),h('span',{class:'ai-tx'},'چت با هوش مصنوعی',h('em',{},'sisé')));
 document.body.append(f);
 const show1=()=>{if(!f.isConnected)return;f.classList.add('open');AIF.t2=setTimeout(()=>{f.classList.remove('open');AIF.t=setTimeout(show1,28000)},7000)};
 AIF.t=setTimeout(show1,1800)}
function chTabs(){const t=(k,l)=>h('button',{type:'button',class:'cht'+(CH.tab===k?' on':''),onclick:()=>{if(CH.tab!==k){CH.tab=k;renderMain()}}},l);return h('div',{class:'ch-tabs'},t('pub','چت عمومی'),t('pm','چت با مدیریت'),t('ai','چت با هوش مصنوعی'))}
function pmView(channel='management'){clearInterval(CH.timer);CH.timer=0;clearInterval(PM.timer);PM.timer=0;const u=curUser(),root=h('div',{class:'ch'}),list=h('div',{class:'ch-list'});
 root.append(h('div',{class:'ch-hd glass'},h('span',{class:'ci',html:ic(channel==='ai'?'sparkles':'lock',22)}),h('div',{},h('b',{},channel==='ai'?'چت با هوش مصنوعی':'چت با مدیریت'),h('small',{},channel==='ai'?'