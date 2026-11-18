/* SISE chat layout enhancer: presentation only; chat data flow remains in the existing app. */
(()=> {
 const enhance=()=>{
  if(!document.body.classList.contains('chat-lock'))return;
  const app=document.getElementById('app'),root=app&&app.querySelector('.ch');
  if(!root)return;
  if(root.querySelector('.ch-redesign-top'))return;
  const oldTabs=root.querySelector('.ch-tabs');
  if(!oldTabs)return;
  const top=document.createElement('div');top.className='ch-redesign-top';
  const tabs=document.createElement('div');tabs.className='ch-redesign-tabs';
  while(oldTabs.firstChild)tabs.appendChild(oldTabs.firstChild);
  oldTabs.remove();
  const actions=document.createElement('div');actions.className='ch-redesign-actions';
  const home=document.createElement('button');home.type='button';home.className='chat-home';home.setAttribute('aria-label','بازگشت به خانه');home.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></svg>';
  home.addEventListener('click',()=>{if(typeof window.go==='function')window.go('home');else location.href='/'});
  const account=document.createElement('button');account.type='button';account.className='chat-account';account.setAttribute('aria-label',window.curUser&&window.curUser()?'حساب کاربری':'ورود');account.setAttribute('title',window.curUser&&window.curUser()?'حساب کاربری':'ورود');account.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>';
  account.addEventListener('click',()=>{if(typeof window.openAuth==='function')window.openAuth()});
  actions.append(home,account);top.append(tabs,actions);
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
