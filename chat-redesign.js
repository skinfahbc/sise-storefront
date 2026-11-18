/* SISE chat layout enhancer: presentation only; chat data flow remains in the existing app. */
(()=> {
 const enhance=()=>{
  if(!document.body.classList.contains('chat-lock'))return;
  const app=document.getElementById('app'),root=app&&app.querySelector('.ch');
  if(!root)return;
  if(root.querySelector('.ch-redesign-top'))return;
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
  const more=document.createElement('button');more.type='button';more.className='chat-more';more.setAttribute('aria-label','اطلاعات گفتگو');more.setAttribute('aria-expanded','false');more.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
  const info=document.createElement('div');info.className='ch-header-info';info.hidden=true;info.textContent='برای ارتباط با پشتیبانی، تب «چت با مدیریت» را انتخاب کنید.';
  more.addEventListener('click',()=>{info.hidden=!info.hidden;more.setAttribute('aria-expanded',String(!info.hidden))});
  const bar=document.createElement('div');bar.className='ch-redesign-bar';bar.append(actions,brand,more,info);
  top.append(bar,tabs);
  const chatHead=root.querySelector('.ch-hd');if(chatHead)chatHead.remove();
  root.insertBefore(top,root.firstChild);
  root.dataset.redesigned='1';
  const list=root.querySelector('.ch-list');
  if(list)list.setAttribute('aria-label','پیام‌های گفتگو');
 };
 const boot=()=>{
  const app=document.getElementById('app');
  if(!app)return;
  const mo=new MutationObserver(()=>requestAnimationFrame(enhance));
  mo.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  enhance();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
