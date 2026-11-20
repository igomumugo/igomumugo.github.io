(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const t = (key, values) => window.FileDeskI18n.t('support.' + key, values);
  let admin = false, page = 1, pages = 1, listRequest = 0, current = null, detailRequest = 0;
  let posts = [], ready = false, createID = crypto.randomUUID(), replyID = crypto.randomUUID();
  const tokens = new Map(); // Short-lived access stays in memory, never in links or browser storage.
  const replyDrafts = new Map();
  const date = time => new Intl.DateTimeFormat(window.FileDeskI18n.language,{dateStyle:'medium',timeStyle:'short'}).format(time);
  function node(tag, value, className) { const e = document.createElement(tag); if (value != null) e.textContent = value; if (className) e.className = className; return e; }
  function button(label, action, className='button secondary') { const b=node('button',t(label),className); b.type='button'; b.addEventListener('click',action); return b; }
  async function api(path, options = {}, id) {
    const headers = {'Accept':'application/json', ...options.headers};
    if (options.body) { headers['Content-Type']='application/json'; options.body=JSON.stringify(options.body); }
    if (id && tokens.has(id)) headers.Authorization='Bearer '+tokens.get(id);
    const response=await fetch('/api/support/'+path,{...options,headers,credentials:'same-origin',cache:'no-store'});
    let data; try { data=await response.json(); } catch { throw new Error('unavailable'); }
    if (!response.ok) { if (response.status===403 && id) tokens.delete(id); throw new Error(data.error || 'unavailable'); }
    return data;
  }
  const errorText = error => t('error.'+(['unauthorized','forbidden','not_found','conflict','rate_limited','password_length','invalid','too_large'].includes(error.message)?error.message:'unavailable'));
  async function busy(form, work, status) {
    if (form.dataset.busy) return;
    form.dataset.busy='1'; form.setAttribute('aria-busy','true');
    const controls=[...form.querySelectorAll('button,input,textarea,select')]; const disabled=controls.map(e=>e.disabled);
    controls.forEach(e=>e.disabled=true); if(status) status.textContent='';
    try { await work(); } catch(error) { if(status) status.textContent=errorText(error); }
    finally { controls.forEach((e,i)=>e.disabled=disabled[i]); delete form.dataset.busy; form.removeAttribute('aria-busy'); adminUI(); $('private').disabled=$('new-category').value==='update'; }
  }
  function badges(post) {
    const wrap=node('div',null,'support-badges');
    if(post.pinned) wrap.append(node('span',t('pinned'),'badge'));
    if(post.hidden) wrap.append(node('span',t('hidden'),'badge'));
    wrap.append(node('span',t(post.category),'badge category'),node('span',t(post.edition),'badge'),node('span',t(post.status),'badge status-'+post.status));
    if(post.private) wrap.append(node('span','🔒 '+t('private'),'badge'));
    return wrap;
  }
  function renderList() {
    $('post-list').replaceChildren();
    for(const post of posts) {
      const item=node('li',null,'support-row'); const a=node('a',post.title || t('privateTitle'),'support-post-title');
      a.href='support.html?lang='+encodeURIComponent(window.FileDeskI18n.language)+'&post='+encodeURIComponent(post.id);
      a.addEventListener('click',event=>{if(!event.metaKey&&!event.ctrlKey&&!event.shiftKey){event.preventDefault();openPost(post.id);}});
      item.append(badges(post),a,node('p', [post.nickname, date(post.created_at)].filter(Boolean).join(' · '),'support-meta'));
      $('post-list').append(item);
    }
    $('empty').hidden=posts.length!==0;
    $('page-count').textContent=t('page',{page,pages});
    $('previous').disabled=page<=1; $('next').disabled=page>=pages;
  }
  async function loadList() {
    const sequence=++listRequest; $('board-status').textContent=t('loading'); $('empty').hidden=true;
    const query=new URLSearchParams({page:String(page),q:$('search').value,category:$('category-filter').value,edition:$('edition-filter').value});
    try {
      const data=await api('posts?'+query); if(sequence!==listRequest)return;
      posts=data.posts; pages=Math.max(1,Math.ceil(data.total/20));
      if(page>pages){page=pages;return loadList();}
      $('board-status').textContent='';renderList();
    } catch(error) { if(sequence!==listRequest)return; posts=[];$('post-list').replaceChildren();$('empty').hidden=true;$('board-status').textContent=errorText(error); }
  }
  function showDialog(id) { if(!$(id).open)$(id).showModal(); }
  function closeDetail() {
    detailRequest++;current=null;$('post-dialog').close();$('detail-body').replaceChildren();
    const url=new URL(location.href);url.searchParams.delete('post');history.replaceState(null,'',url);
  }
  function showPost(post) { current=post;renderDetail();showDialog('post-dialog'); }
  async function openPost(id) {
    const sequence=++detailRequest;current=null;$('detail-title').textContent=t('loading');$('detail-body').replaceChildren();showDialog('post-dialog');
    const url=new URL(location.href);url.searchParams.set('post',id);history.replaceState(null,'',url);
    try { const result=await api('posts/'+id,{},id);if(sequence===detailRequest)showPost(result.post); }
    catch(error){if(sequence===detailRequest){$('detail-title').textContent=t('support');$('detail-body').append(node('p',errorText(error),'form-status'));}}
  }
  function unlockForm(post) {
    const form=node('form',null,'support-unlock');const label=node('label',t('password'));const input=node('input');
    input.type='password';input.required=true;input.minLength=8;input.maxLength=128;input.autocomplete='current-password';input.name='password';label.append(input);
    const submit=node('button',t('unlock'),'button');submit.type='submit';const status=node('p',null,'form-status');status.setAttribute('role','status');
    form.append(label,submit,status);
    form.addEventListener('submit',event=>{event.preventDefault();const pass=input.value;
      busy(form,async()=>{const result=await api('posts/'+post.id+'/unlock',{method:'POST',body:{password:pass}});tokens.set(post.id,result.token);input.value='';showPost(result.post);},status);
    });return form;
  }
  function renderDetail() {
    if(!current)return;const post=current, root=$('detail-body');root.replaceChildren();
    $('detail-title').textContent=post.title || t('privateTitle');root.append(badges(post),node('p',date(post.created_at),'support-meta'));
    if(post.locked){root.append(node('p',t('lockedNote')),unlockForm(post));return;}
    root.append(node('p',post.nickname,'support-author'),node('div',post.body,'support-message'));
    if(post.version||post.system)root.append(node('p',[post.version,post.system].filter(Boolean).join(' · '),'support-meta'));
    const actions=node('div',null,'support-actions');const copyStatus=node('span');copyStatus.setAttribute('role','status');
    actions.append(button('copyLink',async()=>{try{await navigator.clipboard.writeText(location.href);copyStatus.textContent=t('copied');}catch{copyStatus.textContent=t('copyFallback');}}),copyStatus);root.append(actions);
    const replies=node('section',null,'support-replies');replies.append(node('h3',t('replies')));
    for(const reply of post.replies || []) {
      const item=node('article',null,'support-reply '+reply.role);item.append(node('strong',t(reply.role==='admin'?'adminBadge':'author')),node('time',date(reply.created_at),'support-meta'),node('div',reply.body,'support-message'));replies.append(item);
    }
    if(!post.replies?.length)replies.append(node('p',t('noReplies'),'muted'));root.append(replies);
    if(post.canManage) {
      const form=node('form');const label=node('label',t('reply'));const input=node('textarea');input.name='reply';input.rows=4;input.required=true;input.maxLength=6000;input.value=replyDrafts.get(post.id)||'';input.addEventListener('input',()=>replyDrafts.set(post.id,input.value));label.append(input);
      const submit=node('button',t('sendReply'),'button');submit.type='submit';const status=node('p',null,'form-status');status.setAttribute('role','status');form.append(label,submit,status);
      form.addEventListener('submit',event=>{event.preventDefault();const content=input.value;busy(form,async()=>{
        const data=await api('posts/'+post.id+'/replies',{method:'POST',body:{id:replyID,body:content}},post.id);replyID=crypto.randomUUID();replyDrafts.delete(post.id);showPost(data.post);await loadList();
      },status);});root.append(form);
      if(admin)root.append(adminControls(post));
      const deletionStatus=node('p',null,'form-status');deletionStatus.setAttribute('role','status');
      const del=button('delete',async()=>{if(!confirm(t('deleteConfirm')))return;del.disabled=true;try{await api('posts/'+post.id,{method:'DELETE'},post.id);tokens.delete(post.id);replyDrafts.delete(post.id);closeDetail();await loadList();}catch(error){deletionStatus.textContent=errorText(error);del.disabled=false;}},'button danger');
      root.append(del,deletionStatus);
    } else if(post.category!=='update') {
      const authorTools=node('details');authorTools.append(node('summary',t('authorTools')),unlockForm(post));root.append(authorTools);
    }
  }
  function adminControls(post) {
    const form=node('form',null,'admin-controls');form.append(node('h3',t('manage')));
    const label=node('label',t('status'));const select=node('select');for(const s of ['open','in_progress','answered','resolved']){const o=node('option',t(s));o.value=s;select.append(o);}select.value=post.status;label.append(select);
    function checkbox(key,value){const l=node('label',null,'checkbox-label'),i=node('input');i.type='checkbox';i.checked=value;l.append(i,node('span',t(key)));return {label:l,input:i};}
    const hidden=checkbox('hidden',post.hidden),pinned=checkbox('pinned',post.pinned),submit=node('button',t('save'),'button secondary'),status=node('p',null,'form-status');submit.type='submit';status.setAttribute('role','status');form.append(label,hidden.label,pinned.label,submit,status);
    form.addEventListener('submit',event=>{event.preventDefault();const data={status:select.value,hidden:hidden.input.checked,pinned:pinned.input.checked,revision:post.revision};busy(form,async()=>{const result=await api('posts/'+post.id,{method:'PATCH',body:data});showPost(result.post);await loadList();},status);});return form;
  }
  function adminUI() {
    $('admin-button').textContent=t(admin?'logout':'admin');$('admin-note').hidden=!admin;
    $('update-option').disabled=!admin;$('update-option').hidden=!admin;
    $('author-fields').hidden=admin;$('new-password').required=!admin;$('nickname').required=!admin;
    $('pin-label').hidden=!admin;
    if(!admin && $('new-category').value==='update')$('new-category').value='bug';
  }
  $('new-button').addEventListener('click',()=>{$('create-status').textContent='';showDialog('create-dialog');});
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.dataset.close==='post-dialog'?closeDetail():$(b.dataset.close).close()));
  $('post-dialog').addEventListener('cancel',event=>{event.preventDefault();closeDetail();});
  $('new-category').addEventListener('change',()=>{const update=$('new-category').value==='update';if(update)$('private').checked=false;$('private').disabled=update;});
  $('create-form').addEventListener('submit',event=>{
    event.preventDefault();const data={id:createID,category:$('new-category').value,edition:$('new-edition').value,title:$('title').value,body:$('body').value,nickname:$('nickname').value,password:$('new-password').value,version:$('version').value,system:$('system').value,private:$('private').checked,pinned:$('pin').checked,website:$('website').value};
    busy($('create-form'),async()=>{
      const result=await api('posts',{method:'POST',body:data});if(result.token)tokens.set(result.post.id,result.token);
      createID=crypto.randomUUID();$('create-form').reset();$('private').disabled=false;$('create-dialog').close();adminUI();
      const url=new URL(location.href);url.searchParams.set('post',result.post.id);history.replaceState(null,'',url);showPost(result.post);await loadList();
    },$('create-status'));
  });
  $('search-form').addEventListener('submit',event=>{event.preventDefault();page=1;loadList();});
  for(const id of ['category-filter','edition-filter'])$(id).addEventListener('change',()=>{page=1;loadList();});
  $('previous').addEventListener('click',()=>{if(page>1){page--;loadList();}});$('next').addEventListener('click',()=>{if(page<pages){page++;loadList();}});$('refresh').addEventListener('click',loadList);
  $('admin-button').addEventListener('click',async()=>{
    if(admin){try{await api('session',{method:'DELETE'});admin=false;adminUI();if(current)await openPost(current.id);await loadList();}catch(error){$('board-status').textContent=errorText(error);}}
    else{$('login-status').textContent='';showDialog('login-dialog');}
  });
  $('login-form').addEventListener('submit',event=>{event.preventDefault();const password=$('admin-password').value;busy($('login-form'),async()=>{await api('session',{method:'POST',body:{password}});$('admin-password').value='';admin=true;$('login-dialog').close();adminUI();if(current)await openPost(current.id);await loadList();},$('login-status'));});
  async function start() {
    if(ready){renderList();renderDetail();adminUI();return;}ready=true;
    try{admin=(await api('session')).admin;}catch{/* List displays service error with email fallback. */}
    adminUI();await loadList();const id=new URL(location.href).searchParams.get('post');if(id)await openPost(id);
  }
  document.addEventListener('filedesk:language',start);if(document.documentElement.dataset.languageReady)start();
})();
