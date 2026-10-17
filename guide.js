const dialog=document.getElementById('image-view');
let opener;
document.querySelectorAll('[data-image]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();opener=link;const image=dialog.querySelector('img');image.src=link.href;image.alt=link.querySelector('img').alt;dialog.showModal();}));
dialog.querySelector('button').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
dialog.addEventListener('close',()=>opener?.focus());
document.querySelectorAll('[data-theme]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const src='assets/screenshots/theme-'+button.dataset.theme+'.jpg';document.getElementById('theme-image').src=src;document.getElementById('theme-image').alt=button.textContent+' 테마의 실제 FileDesk 화면';document.getElementById('theme-link').href=src;document.getElementById('theme-caption').textContent=button.textContent+' 테마 · 이미지를 눌러 크게 보기';}));
