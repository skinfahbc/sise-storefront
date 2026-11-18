/* SISE chat layout enhancer: presentation only; chat data flow remains in the existing app. */
(()=> {
 const enhance=()=>{
  if(!document.body.classList.contains('chat-lock'))return;
  const app=document.getElementById('app'),root=app&&app.querySelector('.ch');
  if(!root)return;
  if(root.querySelector('.ch-redesign-top'))return;
  /* Guest sandbox is intentionally restricted to the public Render preview host. */
  if(location.hostname==='sise-diagnostic-preview.onrender.com' && root.querySelector('.ch-login') && !root.querySelector('.ch-guest-demo')){
   const demo=document.createElement('section');demo.className='ch-guest-demo';demo.setAttribute('dir','rtl');
   demo.innerHTML='<div class="ch-guest-intro"><span class="ch-guest-tag">حالت آزمایشی · بدون ورود</span><strong>چت SISE را امتحان کن</strong><p>این محیط نمایشی است؛ پیام‌ها فقط روی همین صفحه شبیه‌سازی می‌شوند و به سرور یا حساب مشتریان ارسال نمی‌شوند.</p><button type="button" class="ch-guest-start">شروع تست چت</button></div>';
   root.appendChild(demo);
   const start=demo.querySelector('.ch-guest-start');
   start.addEventListener('click',()=>{
    demo.innerHTML='<div class="ch-guest-head"><div><strong>دستیار هوشمند SISE</strong><small>محیط نمایشی · پیام‌ها ذخیره نمی‌شوند</small></div><span class="ch-guest-tag">DEMO</span></div><div class="ch-guest-messages" aria-live="polite"><div class="ch-guest-bubble ai">سلام! 👋 من دستیار هوشمند SISE هستم. درباره کیف‌ها، رنگ‌ها یا انتخاب محصول از من سؤال کن.</div><div class="ch-guest-product"><div class="ch-guest-product-art">SISE</div><div><b>کیف دستی روزمره</b><small>نمونه کارت محصول · اطلاعات نمایشی</small><strong>۲٬۴۹۰٬۰۰۰ تومان</strong></div></div></div><form class="ch-guest-form"><input maxlength="300" placeholder="پیامت را اینجا بنویس…" aria-label="پیام آزمایشی"><button type="submit">ارسال</button></form>';
    const messages=demo.querySelector('.ch-guest-messages'),form=demo.querySelector('form'),input=form.querySelector('input');
    form.addEventListener('submit',e=>{
     e.preventDefault();const value=input.value.trim();if(!value)return;
     const user=document.createElement('div');user.className='ch-guest-bubble me';user.textContent=value;messages.appendChild(user);input.value='';
     const typing=document.createElement('div');typing.className='ch-typing ch-guest-typing';typing.innerHTML='<span>دستیار هوشمند در حال نوشتن است</span><span class="ch-typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>';messages.appendChild(typing);messages.scrollTop=messages.scrollHeight;
     setTimeout(()=>{if(!typing.isConnected)return;typing.remove();const answer=document.createElement('div');answer.className='ch-guest-bubble ai';answer.textContent='این یک پاسخ نمونه در محیط آزمایشی است. در نسخه واقعی، دستیار بر اساس اطلاعات محصولات SISE پاسخ می‌دهد.';messages.appendChild(answer);messages.scrollTop=messages.scrollHeight},1450);
    });
    input.focus();
   });
  }
  const oldTabs=root.querySelector('.ch-tabs');
  if(!oldTabs)return;
  const tabIcons=[
   ['users','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>'],
   ['headset','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14v-3a9 9 0 0 1 18 0v3"/><path d="M5 14h2a2 2 0 0 1 2 2v3H7a4 4 0 0 1-4-4v-1ZM19 14h-2a2 2 0 0 0-2 2v3h2a4 4 0 0 0 4-4v-1Z"/></svg>'],
   ['sparkles','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 14 1.2 2.8L23 18l-2.8 1.1L19 22l-1.1-2.9L15 18l2.9-1.2L19 14Z"/></svg>']
  ];
  Array.from(oldTabs.children).forEach((btn,index)=>{
   if(btn.querySelector('.ch-tab-icon'))return;
   const item=tabIcons[index];if(!item)return;
   const icon=document.createElement('span');icon.className='ch-tab-icon';icon.innerHTML=item[1];
   btn.insertBefore(icon,btn.firstChild);
   btn.classList.add('ch-tab-with-icon');
  });
  const top=document.createElement('div');top.className='ch-redesign-top';
  const tabs=document.createElement('div');tabs.className='ch-redesign-tabs';
  while(oldTabs.firstChild)tabs.appendChild(oldTabs.firstChild);
  oldTabs.remove();
  const brand=document.createElement('div');brand.className='ch-redesign-brand';brand.innerHTML='<strong>SISE</strong><span>MESSENGER</span>';
  const actions=document.createElement('div');actions.className='ch-redesign-actions';
  const home=document.createElement('button');home.type='button';home.className='chat-home';home.setAttribute('aria-label','بازگشت به خانه');home.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></svg>';
  home.addEventListener('click',()=>{if(typeof window.go==='function')window.go('home');else location.href='/'});
  const account=document.createElement('button');account.type='button';account.className='chat-account';account.setAttribute('aria-label',window.curUser&&window.curUser()?'حساب کاربری':'ورود');account.setAttribute('title',window.curUser&&window.curUser()?'حساب کاربری':'ورود');account.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>';
  account.addEventListener('click',()=>{if(typeof window.openAuth==='function')window.openAuth()});
  actions.append(home,account);
  const more=document.createElement('button');more.type='button';more.className='chat-more';more.setAttribute('aria-label','منوی گفتگو');more.setAttribute('aria-expanded','false');more.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
  const menu=document.createElement('div');menu.className='ch-more-menu';menu.hidden=true;menu.setAttribute('dir','rtl');
  const item=(icon,label,action,extra='')=>{const b=document.createElement('button');b.type='button';b.className='ch-menu-item '+extra;b.innerHTML=icon+'<span>'+label+'</span>';b.addEventListener('click',action);return b};
  const ico=(path)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
  const popToast=(msg)=>{const t=document.createElement('div');t.className='ch-menu-toast';t.textContent=msg;document.body.append(t);setTimeout(()=>t.remove(),2600)};
  const closeMenu=()=>{menu.hidden=true;more.setAttribute('aria-expanded','false')};
  const currentTab=()=>{const a=tabs.querySelector('.cht.on');return a?(a.textContent||'').trim():'چت عمومی'};
  const themeItem=item(ico('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>'),'حالت روشن / تاریک',()=>{
   try{const v=JSON.parse(localStorage.getItem('kifara_v')||'{}');const next=(document.documentElement.getAttribute('data-theme')||'light')==='dark'?'light':'dark';v.mode=next;localStorage.setItem('kifara_v',JSON.stringify(v));document.documentElement.setAttribute('data-theme',next);popToast(next==='dark'?'حالت تاریک فعال شد':'حالت روشن فعال شد')}catch(e){popToast('تغییر حالت نمایش انجام نشد')}closeMenu();
  });
  const fontItem=item(ico('<path d="M4 19 10 5l6 14M6 15h8M16 11h4m-2-2v4"/>'),'اندازه متن: معمولی / بزرگ',()=>{
   const on=document.body.classList.toggle('chat-font-large');try{localStorage.setItem('sise_chat_font_large',on?'1':'0')}catch(e){}popToast(on?'اندازه متن بزرگ شد':'اندازه متن معمولی شد');closeMenu();
  });
  const detail=document.createElement('div');detail.className='ch-menu-detail';detail.hidden=true;
  const detailBtn=item(ico('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1.1 1-1.7 1.3-1.7 2.7M12 17h.01"/>'),'راهنمای گفتگو',()=>{
   const tab=currentTab();let title='قوانین چت عمومی',body='با احترام گفتگو کنید؛ از ارسال اطلاعات شخصی، تبلیغات و پیام‌های تکراری خودداری کنید. محتوای نامناسب ممکن است حذف شود.';
   if(tab.includes('مدیریت')){title='حریم خصوصی گفتگو';body='این گفت‌وگو خصوصی است و پیام شما برای مدیریت فروشگاه ارسال می‌شود. اطلاعات حساس بانکی یا رمز عبور را ارسال نکنید.'}
   if(tab.includes('هوش مصنوعی')){title='درباره دستیار هوشمند';body='دستیار هوشمند SISE برای پاسخ‌گویی درباره محصولات و خدمات فروشگاه است. پاسخ‌ها ممکن است نیاز به تأیید مدیریت داشته باشند؛ برای پاسخ قطعی درباره سفارش، با مدیریت گفتگو کنید.'}
   detail.innerHTML='<b>'+title+'</b><p>'+body+'</p>';detail.hidden=false;
  });
  const reportBtn=item(ico('<path d="M12 9v4m0 4h.01"/><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.1a2 2 0 0 0-3.4 0Z"/>'),'گزارش مشکل / ارتباط با مدیریت',()=>{
   closeMenu();
   const target=Array.from(tabs.querySelectorAll('.cht')).find(b=>(b.textContent||'').includes('مدیریت'));
   if(target)target.click();
   setTimeout(()=>{
    const input=document.querySelector('.ch-cp input.in');
    if(input){input.value='سلام، می‌خواهم یک مشکل را در چت گزارش کنم:\\n';input.focus();try{input.setSelectionRange(input.value.length,input.value.length)}catch(e){}}
    popToast(input?'متن گزارش آماده است؛ مشکل را بنویسید و ارسال کنید.':'برای گزارش مشکل، وارد گفت‌وگوی مدیریت شوید.');
   },100);
  },'ch-menu-item-support');
  menu.append(themeItem,fontItem,detailBtn,detail,reportBtn);
  more.addEventListener('click',()=>{menu.hidden=!menu.hidden;more.setAttribute('aria-expanded',String(!menu.hidden));detail.hidden=true});
  document.addEventListener('click',e=>{if(!menu.contains(e.target)&&!more.contains(e.target))closeMenu()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  try{if(localStorage.getItem('sise_chat_font_large')==='1')document.body.classList.add('chat-font-large')}catch(e){}
  const bar=document.createElement('div');bar.className='ch-redesign-bar';bar.append(actions,brand,more,menu);
  top.append(bar,tabs);
  const chatHead=root.querySelector('.ch-hd');if(chatHead)chatHead.remove();
  root.insertBefore(top,root.firstChild);
  root.dataset.redesigned='1';
  const list=root.querySelector('.ch-list');
  if(list)list.setAttribute('aria-label','پیام‌های گفتگو');
 };
 /* AI typing feedback: intercept only the SISE AI request; no message or account data is changed. */
 if(!window.__siseAiTypingPatch){
  window.__siseAiTypingPatch=true;
  const nativeFetch=window.fetch;
  window.fetch=function(input,init){
   const url=typeof input==='string'?input:(input&&input.url)||'';
   if(!url.includes('/functions/v1/sise-ai-chat'))return nativeFetch.apply(this,arguments);
   let indicator=null;
   try{
    const root=document.querySelector('.app.chatp .ch');
    const list=root&&root.querySelector('.ch-list');
    if(list){
     indicator=document.createElement('div');
     indicator.className='ch-typing';
     indicator.setAttribute('role','status');
     indicator.setAttribute('aria-live','polite');
     indicator.innerHTML='<span>دستیار هوشمند در حال نوشتن است</span><span class="ch-typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
     list.appendChild(indicator);
     list.scrollTop=list.scrollHeight;
    }
   }catch(e){}
   let request;
   try{request=nativeFetch.apply(this,arguments)}catch(e){if(indicator)indicator.remove();throw e}
   return Promise.resolve(request).finally(()=>{if(indicator&&indicator.isConnected)indicator.remove()});
  };
 }
 const boot=()=>{
  const app=document.getElementById('app');
  if(!app)return;
  const mo=new MutationObserver(()=>requestAnimationFrame(enhance));
  mo.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  enhance();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
