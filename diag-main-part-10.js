پاسخ‌گویی هوشمند درباره محصولات و خدمات SISE':'فقط شما و مدیر فروشگاه این گفتگو را می‌بینید'))),list);
 if(!u){add(list,h('div',{class:'empty'},channel==='ai'?'برای استفاده از دستیار هوشمند ابتدا وارد شوید.':'برای چت خصوصی با مدیریت ابتدا وارد شوید.'));root.append(chTabs(),h('div',{class:'ch-cp glass'},h('button',{class:'btn ch-login',onclick:openAuth},'ورود یا ثبت‌نام')));return root}
 let pimg='',sending=false,err='',sig='';const inp=h('input',{class:'in',placeholder:channel==='ai'?'پیام خود را برای هوش مصنوعی بنویسید…':'پیام خود را بنویسید',maxlength:'500',autocomplete:'off'}),pv=h('div',{class:'ch-pv',hidden:true}),file=h('input',{type:'file',accept:'image/*',style:{display:'none'}});
 const drawPv=()=>{pv.innerHTML='';pv.hidden=!pimg;if(pimg)add(pv,[h('img',{src:pimg,alt:''}),h('span',{},'عکس آماده ارسال است'),h('button',{type:'button',class:'sb dg','aria-label':'حذف عکس',html:ic('close',16),onclick:()=>{pimg='';drawPv()}})])};
 const near=()=>list.scrollHeight-list.scrollTop-list.clientHeight<220;
 const draw=stick=>{const keep=stick||near();list.innerHTML='';
  if(err){add(list,h('div',{class:'empty'},pmAuthErr({message:err})?'برای ادامه، دوباره با حساب جیمیل وارد شوید.':pmSetup({message:err})?'این بخش هنوز راه‌اندازی نشده است.':'اتصال برقرار نشد: '+err));return}
  add(list,PM.rows.length?PM.rows.map(r=>chMsgEl({id:'pm'+r.id,uid:r.uid,name:r.ai_generated?'دستیار هوشمند SISE':(r.from_admin?admName():uName(u)),is_admin:!!r.from_admin,ai_generated:!!r.ai_generated,needs_admin:!!r.needs_admin,avatar:r.from_admin?'':(u.avatar||''),text:r.text,image:r.image,created_at:r.created_at},{me:!r.from_admin})):h('div',{class:'empty'},channel==='ai'?'هنوز پیامی نیست؛ هر سؤالی درباره کیف‌ها و خدمات SISE دارید بپرسید.':'هنوز پیامی نیست؛ پیام شما مستقیماً برای مدیریت فروشگاه ارسال می‌شود.'));
  if(keep)requestAnimationFrame(()=>{list.scrollTop=list.scrollHeight})};
 const load=async first=>{try{const token=await custToken();if(!token)throw new Error('نشست ورود منقضی شده؛ دوباره وارد حساب شوید');const r=await custFetch('/rest/v1/rpc/pm_list_auth',{method:'POST',body:{p_channel:channel},token,timeout:8000});const rows=Array.isArray(r)?r:[],s2=rows.length+':'+(rows.length?rows[rows.length-1].id:'');err='';if(sending)return;if(s2!==sig||first){sig=s2;PM.rows=rows;draw(first||true)}}catch(e){if(!sig||first){err=e.message||'خطا';draw()}}};
 const send=async()=>{const t=inp.value.trim(),img=pimg;if(!t&&!img||sending)return;if(Date.now()-CH.sentAt<1200)return toast('کمی آهسته‌تر 🙂');CH.sentAt=Date.now();sending=true;
  try{let url=null;if(img){toast('در حال ارسال عکس…');try{url=await chUpload(img)}catch(e){toast('عکس ارسال نشد: '+e.message);return}}
   const tmp={id:'t'+uid(),uid:u.id,text:t,image:url,from_admin:false,created_at:new Date().toISOString()};PM.rows=PM.rows.concat([tmp]);inp.value='';pimg='';drawPv();err='';draw(true);
   try{
    const token=await custToken();if(!token)throw new Error('نشست ورود منقضی شده؛ دوباره وارد حساب شوید');const pmId=await custFetch('/rest/v1/rpc/pm_send_auth',{method:'POST',body:{p_name:uName(u),p_text:t,p_image:url,p_channel:channel},token,timeout:10000});
    buzz(12);
    if(channel==='ai'){try{const access=await custToken();const response=await fetch(SB.url+'/functions/v1/sise-ai-chat',{method:'POST',headers:{'Content-Type':'application/json',apikey:SB.key,Authorization:'Bearer '+access},body:JSON.stringify({message_id:Number(pmId),channel:'ai'})});if(!response.ok){let detail={};try{detail=await response.json()}catch(e){}toast(detail.error==='assistant_not_configured'?'دستیار هوشمند هنوز فعال نشده است':'پیام ثبت شد؛ پاسخ هوشمند موقتاً در دسترس نیست')}}catch(e){toast('پیام ثبت شد؛ اتصال دستیار هوشمند برقرار نشد')}}
   }
   catch(e){PM.rows=PM.rows.filter(x=>x!==tmp);draw();toast(pmSetup(e)?'این بخش هنوز راه‌اندازی نشده است':'ارسال نشد: '+e.message)}}
  finally{sending=false;sig='';load(false)}};
 file.onchange=async()=>{const f=file.files[0];file.value='';if(!f)return;try{const d=await chPickImage(f);if(d){pimg=d;drawPv()}}catch(e){toast(e.message||'عکس خوانده نشد')}};
 root.append(chTabs(),h('form',{class:'ch-cp glass',onsubmit:e=>{e.preventDefault();send()}},pv,h('button',{class:'ch-st',type:'button','aria-label':'ارسال عکس',html:ic('image',22),onclick:()=>file.click()}),inp,file,h('button',{class:'btn',type:'submit','aria-label':'ارسال'},'ارسال')));
 PM.rows=[];draw(true);load(true);
 PM.timer=setInterval(()=>{if(cur!=='chat'||CH.tab!==channelToTab(channel)||!root.isConnected){clearInterval(PM.timer);PM.timer=0;return}if(!document.hidden)load(false)},5000);
 return root}
function channelToTab(channel){return channel==='ai'?'ai':'pm'}
function chatView(){clearInterval(CH.timer);CH.timer=0;clearInterval(PM.timer);PM.timer=0;if(CH.tab==='pm')return pmView('management');if(CH.tab==='ai')return pmView('ai');const u=curUser(),me=u?u.id:null,adm=!!sbSess();
 let pimg='',editing=null,sending=false,replying=null;
 const list=h('div',{class:'ch-list'}),inp=h('input',{class:'in',id:'ch-in',placeholder:'پیام خود را بنویسید…',maxlength:'500',autocomplete:'off'}),root=h('div',{class:'ch'});
 const sp=h('div',{class:'ch-sp',hidden:true},STICKERS.map(s=>h('button',{type:'button',onclick:()=>{sp.hidden=true;send('::st::'+s)}},s)));
 const pv=h('div',{class:'ch-pv',hidden:true}),eb=h('div',{class:'ch-pv',hidden:true}),rb=h('div',{class:'ch-pv',hidden:true}),file=h('input',{type:'file',accept:'image/*',style:{display:'none'}}),sbtn=h('button',{class:'btn',type:'submit','aria-label':'ارسال'},'ارسال');
 const drawPv=()=>{pv.innerHTML='';pv.hidden=!pimg;if(pimg)add(pv,[h('img',{src:pimg,alt:''}),h('span',{},'عکس آماده ارسال است'),h('button',{type:'button',class:'sb dg','aria-label':'حذف عکس',html:ic('close',16),onclick:()=>{pimg='';drawPv()}})])};
 const cancelEdit=()=>{editing=null;inp.value='';eb.hidden=true;eb.innerHTML='';sbtn.textContent='ارسال'};
 const startEdit=m=>{editing=m;replying=null;drawRb();pimg='';drawPv();sp.hidden=true;inp.value=m.text||'';eb.hidden=false;eb.innerHTML='';add(eb,[h('span',{},'در حال ویرایش پیام'),h('button',{type:'button',class:'sb dg','aria-label':'لغو ویرایش',html:ic('close',16),onclick:cancelEdit})]);sbtn.textContent='ذخیره';inp.focus()};
 const drawRb=()=>{rb.innerHTML='';rb.hidden=!replying;if(replying)add(rb,[h('span',{},'پاسخ به '+replying.name+': '+rqSnip(replying)),h('button',{type:'button',class:'sb dg','aria-label':'لغو پاسخ',html:ic('close',16),onclick:()=>{replying=null;drawRb()}})])};
 const startReply=m=>{if(!u&&!adm){openAuth();return}if(editing)cancelEdit();replying=m;drawRb();inp.focus()};
 const nearEnd=()=>list.scrollHeight-list.scrollTop-list.clientHeight<220;
 const delMsg=async(m,btn)=>{if(!btn.dataset.s){btn.dataset.s=1;btn.textContent='مطمئنید؟';setTimeout(()=>{btn.dataset.s='';btn.textContent='حذف'},3000);return}
  try{const mine=!!me&&m.uid===me&&!m.is_admin;let ok=true;
   if(mine)ok=await sbFetch('/rest/v1/rpc/chat_delete',{method:'POST',body:{p_id:m.id,p_uid:me,p_tok:chTok(curUser())}});
   else await sbFetch('/rest/v1/chat_messages?id=eq.'+m.id,{method:'DELETE',auth:true,headers:{Prefer:'return=minimal'}});
   if(ok===false)return toast('اجازه حذف این پیام را ندارید');
   if(editing===m)cancelEdit();CH.msgs=CH.msgs.filter(x=>x!==m);draw();toast('پیام حذف شد')}catch(e){toast('حذف نشد: '+e.message)}};
 const draw=stick=>{const keep=stick||nearEnd();list.innerHTML='';
  if(CH.err&&!CH.msgs.length){add(list,h('div',{class:'empty'},/schema cache|relation|does not exist|404|permission denied/i.test(CH.err)?'این بخش هنوز راه‌اندازی نشده است.':'اتصال برقرار نشد: '+CH.err));return}
  add(list,CH.msgs.length?CH.msgs.map(m=>{const mine=!!me&&m.uid===me&&!m.is_admin;let acts=null;const bs=[];
    if(!chTmp(m)&&CH_V2)bs.push(h('button',{type:'button',onclick:()=>startReply(m)},'پاسخ'));
    if(!chTmp(m)&&(mine||(adm&&m.is_admin))){const del=h('button',{type:'button',onclick:()=>delMsg(m,del)},'حذف');if(mine&&!String(m.text||'').startsWith('::st::'))bs.push(h('button',{type:'button',onclick:()=>startEdit(m)},'ویرایش'));bs.push(del)}
    if(bs.length)acts=h('div',{class:'act'},bs);
    return chMsgEl(m,{me:mine,acts})}):h('div',{class:'empty'},'هنوز پیامی نیست؛ اولین نفر باشید 👋'));
  if(keep)requestAnimationFrame(()=>{list.scrollTop=list.scrollHeight})};
 const saveEdit=async t=>{const m=editing,uu=curUser();if(!m||!uu)return;if(!t&&!m.image)return toast('متن پیام نمی‌تواند خالی باشد');
  try{const ok=await sbFetch('/rest/v1/rpc/chat_edit',{method:'POST',body:{p_id:m.id,p_uid:uu.id,p_tok:chTok(uu),p_text:t.slice(0,500)}});
   if(ok===false)return toast('اجازه ویرایش این پیام را ندارید');
   m.text=t.slice(0,500);m.edited=true;cancelEdit();draw();toast('پیام ویرایش شد')}catch(e){toast('ویرایش نشد: '+e.message)}};
 const send=async over=>{const uu=curUser();if(!uu&&!adm){openAuth();return}const st=typeof over==='string',t=(st?over:inp.value).trim();
  if(editing){if(st)return;return saveEdit(t)}
  const img=st?'':pimg;if(!t&&!img)return;if(sending)return;if(Date.now()-CH.sentAt<1500)return toast('کمی آهسته‌تر 🙂');CH.sentAt=Date.now();sending=true;
  try{let url='';if(img){toast('در حال ارسال عکس…');try{url=await chUpload(img)}catch(e){toast('عکس ارسال نشد: '+e.message);return}}
   const rp=CH_V2?replying:null,lg=S.store.logo,av=adm?((lg&&/^https?:/.test(lg)&&lg.length<400)?lg:null):(uu.avatar?await smallAvatar(uu.avatar,48):''),tokh=adm?null:await chSha(chTok(uu)),
    rf=rp?{reply_to:rp.id,rname:rp.name,rtext:rqSnip(rp)}:{},
    cm=Object.assign({id:'tmp'+uid(),uid:adm?'admin':uu.id,name:adm?(admName()):uName(uu),avatar:av,text:t.slice(0,500),image:url||null,is_admin:adm,edited:false,created_at:new Date().toISOString()},rf);
   CH.msgs.push(cm);if(!st){inp.value='';pimg='';drawPv()}replying=null;drawRb();draw(true);
   try{const rr=await sbFetch('/rest/v1/chat_messages?select='+chCols(),{method:'POST',auth:adm,headers:{Prefer:'return=representation'},body:Object.assign({uid:cm.uid,name:cm.name,avatar:av,text:cm.text,image:url||null,is_admin:adm,tokh:tokh||null},rf),timeout:10000});const row=Array.isArray(rr)?rr[0]:rr;
    if(row&&row.id!=null){if(CH.msgs.some(x=>x.id===row.id))CH.msgs=CH.msgs.filter(x=>x!==cm);else Object.assign(cm,row);draw()}buzz(12)}
   catch(e){CH.msgs=CH.msgs.filter(x=>x!==cm);draw();toast('پیام ارسال نشد: '+e.message)}}
  finally{sending=false}};
 file.onchange=async()=>{const f=file.files[0];file.value='';if(!f)return;try{const d=await chPickImage(f);if(d){pimg=d;drawPv()}}catch(e){toast(e.message||'عکس خوانده نشد')}};
 const cp=(u||adm)?h('form',{class:'ch-cp glass',onsubmit:e=>{e.preventDefault();send()}},eb,rb,pv,sp,h('button',{class:'ch-st',type:'button','aria-label':'استیکر',onclick:()=>{if(!editing)sp.hidden=!sp.hidden}},'😊'),h('button',{class:'ch-st',type:'button','aria-label':'ارسال عکس',html:ic('image',22),onclick:()=>{if(!editing)file.click()}}),inp,file,sbtn):h('div',{class:'ch-cp glass'},h('button',{class:'btn ch-login',onclick:openAuth},'برای گفتگو وارد شوید یا ثبت‌نام کنید'));
 cp.addEventListener('focusin',e=>{if(e.target.matches('input'))setTimeout(()=>e.target.scrollIntoView({block:'nearest'}),300)});
 root.append(h('div',{class:'ch-hd glass'},h('span',{class:'ci',html:ic('comment',22)}),h('div',{},h('b',{},'گفتگوی همگانی'),h('small',{},'با بقیه‌ی مشتری‌ها گفتگو کنید'))),list,chTabs(),cp);
 draw(true);chLoad(true).then(()=>draw(true));
 CH.timer=setInterval(async()=>{if(cur!=='chat'||!root.isConnected){clearInterval(CH.timer);CH.timer=0;return}if(document.hidden)return;
  const nu=curUser();if((nu?nu.id:null)!==me){renderMain();return}if(await chLoad(false))draw(false)},4000);
 return root}
/* ---------- stories viewer ---------- */
function openStory(start){const list=S.stories;if(!list.length)return;let i=start,prog=0,last=0,paused=false,raf=0,vid=null,hold=0,hx=0,sheetOpen=false;
 const bars=h('div',{class:'sv-bars'},list.map(()=>h('i',{},h('b')))),media=h('div',{class:'sv-m'}),watermark=h('img',{class:'sv-watermark',alt:'SISE',hidden:true,draggable:'false'}),hdImg=h('img',{alt:''}),hdT=h('b'),hdS=h('small'),cap=h('div',{class:'sv-cap'}),cmOv=h('div',{class:'sv-cm'}),
  likeB=h('button',{class:'sv-a'}),cmB=h('button',{class:'sv-a'}),shB=h('button',{class:'sv-a','aria-label':'اشتراک‌گذاری',html:ic('share',20)}),prB=h('button',{class:'sv-a pr'},'مشاهده محصول',I('chl',16));
 const stop=()=>{cancelAnimationFrame(raf);root.remove();unlock();refreshStories();removeEventListener('keydown',key)};
 const key=e=>{if(e.key==='Escape')stop()};addEventListener('keydown',key);
 const closeB=h('button',{'aria-label':'بستن',html:ic('close',20),onclick:stop});
 const zones=h('div',{class:'sv-z'},h('i'),h('i'),h('i'));
 const setPause=v=>{paused=v;if(vid)v?vid.pause():vid.play().catch(()=>{})};
 zones.addEventListener('pointerdown',e=>{hold=Date.now();hx=e.clientX;setPause(true)});
 zones.addEventListener('pointerup',e=>{setPause(sheetOpen);if(Date.now()-hold<250){const r=zones.getBoundingClientRect(),p=(e.clientX-r.left)/r.width;p<.33?next():p>.67?prev():0}});
 zones.addEventListener('pointercancel',()=>setPause(sheetOpen));
 function paint(){const s=list[i];likeB.className='sv-a'+(V.liked[s.id]?' on':'');likeB.innerHTML=ic('heart',20)+`<span>${fa(s.likes)}</span>`;likeB.setAttribute('aria-label','پسندیدن');cmB.innerHTML=ic('comment',20)+`<span>${fa(cmOf(s.id).length)}</span>`;cmB.setAttribute('aria-label','نظرات');cmOv.innerHTML='';add(cmOv,cmOf(s.id).slice(-3).map(m=>h('div',{},h('b',{},m.name),m.text)))}
 function load(n){i=n;prog=0;last=performance.now();const s=list[i];V.seen[s.id]=1;saveV();vid=null;media.innerHTML='';const wmSrc=(S.store&& (S.store.logo||S.store.loadingLogo))||'';watermark.src=wmSrc;watermark.hidden=!wmSrc;
  [...bars.children].forEach((b,k)=>b.firstChild.style.width=k<i?'100%':'0');
  if(s.type==='video'){vid=h('video',{src:s.src,playsinline:true,autoplay:true});media.append(vid);vid.play().catch(()=>{vid.muted=true;vid.play().catch(()=>{})});vid.addEventListener('ended',next)}else media.append(h('img',{src:s.src,alt:s.title}));
  hdImg.src=s.thumb||(s.type==='image'?s.src:'');hdImg.style.display=hdImg.src?'':'none';if(s.type==='video'&&!s.thumb){const sid=s.id;vidThumb(s.src).then(d=>{if(d&&list[i]&&list[i].id===sid){hdImg.src=d;hdImg.style.display=''}})}hdT.textContent=s.title;hdS.textContent=S.store.name;cap.textContent=s.caption||'';
  const pr=prod(s.productId);prB.style.display=pr?'':'none';prB.onclick=()=>{stop();openProduct(pr.id)};paint()}
 const next=()=>i<list.length-1?load(i+1):stop(),prev=()=>load(Math.max(0,i-1));
 function frame(ts){if(!paused){if(vid)prog=vid.duration?vid.currentTime/vid.duration:0;else{prog+=(ts-last)/5500;}last=ts;bars.children[i].firstChild.style.width=Math.min(100,prog*100)+'%';if(prog>=1&&!vid)next()}else last=ts;raf=requestAnimationFrame(frame)}
 likeB.onclick=()=>{const s=list[i];if(V.liked[s.id]){delete V.liked[s.id];s.likes=Math.max(0,s.likes-1)}else{V.liked[s.id]=1;s.likes++}saveV();persist();paint()};
 const sheetIn=node=>{sheetOpen=true;setPause(true);const w=h('div',{class:'sv-sheet'},node);root.firstChild.append(w);
  const vv=window.visualViewport,lift=()=>{if(!vv)return;const k=Math.max(0,Math.round(window.innerHeight-vv.height-vv.offsetTop));w.style.bottom=k+'px';w.style.maxHeight=Math.round(vv.height-20)+'px'};
  if(vv){vv.addEventListener('resize',lift);vv.addEventListener('scroll',lift)}
  w.addEventListener('focusin',e=>{if(e.target.matches('input,textarea'))setTimeout(()=>{lift();e.target.scrollIntoView({block:'nearest'})},250)});
  const c=()=>{if(vv){vv.removeEventListener('resize',lift);vv.removeEventListener('scroll',lift)}w.remove();sheetOpen=false;setPause(false)};return c};
 cmB.onclick=()=>{const s=list[i];let c,editing=null,replying=null;const adm=!!sbSess(),idn=cmIdent(),isTmp=m=>String(m.id).startsWith('tmp'),enc=encodeURIComponent;
  const lst=h('div',{class:'cm'}),inp=h('input',{class:'in',id:'cm-in',placeholder:'نظر خود را بنویسید…',maxlength:'300',autocomplete:'off'}),bar=h('div',{class:'ch-pv',hidden:true}),sbtn=h('bu