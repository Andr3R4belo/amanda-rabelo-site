(()=>{'use strict';
const loginScreen=document.querySelector('#login-screen');
const loginForm=document.querySelector('#login-form');
const dashboard=document.querySelector('#dashboard-app');
const dashboardFooter=document.querySelector('#dashboard-footer');
const logoutButton=document.querySelector('#logout');
const loginError=document.querySelector('#login-error');

function showDashboard(){loginScreen.hidden=true;dashboard.hidden=false;dashboardFooter.hidden=false;logoutButton.hidden=false;initDashboard()}
function showLogin(){loginScreen.hidden=false;dashboard.hidden=true;dashboardFooter.hidden=true;logoutButton.hidden=true}

async function checkSession(){
  try{
    const response=await fetch('/.netlify/functions/auth?action=session',{credentials:'same-origin',cache:'no-store'});
    const result=await response.json();
    if(result.authenticated)showDashboard();else showLogin();
  }catch(error){showLogin();loginError.textContent='Não foi possível verificar a sessão. Tente novamente.';}
}

loginForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const username=document.querySelector('#login-user').value;
  const password=document.querySelector('#login-password').value;
  const submit=loginForm.querySelector('button[type="submit"]');
  submit.disabled=true;
  loginError.hidden=true;
  try{
    const response=await fetch('/.netlify/functions/auth?action=login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({username,password})});
    const result=await response.json();
    if(response.ok&&result.authenticated){loginForm.reset();showDashboard();}
    else{loginError.textContent=result.error||'Login ou senha incorretos. Tente novamente.';loginError.hidden=false;document.querySelector('#login-password').value='';document.querySelector('#login-password').focus();}
  }catch(error){loginError.textContent='Não foi possível conectar ao serviço de autenticação.';loginError.hidden=false;}
  finally{submit.disabled=false;}
});

logoutButton.addEventListener('click',async()=>{
  try{await fetch('/.netlify/functions/auth?action=logout',{credentials:'same-origin'});}finally{location.reload();}
});

checkSession();

function initDashboard(){
const original=JSON.parse(JSON.stringify(window.SITE_CONTENT||{}));let data=JSON.parse(JSON.stringify(original));const $=s=>document.querySelector(s);const form=$('#content-form');const keys=['brand','brandSub','profileName','profileRole','profileMotto','instagram','whatsapp','availability','kicker','headline1','headline2','heroText','primaryCta','heroNote','trust1','trust2','trust3','servicesHeading','servicesIntro','closingEyebrow','closingHeading','closingCta'];function notice(msg,error=false){const n=$('#notice');n.hidden=false;n.textContent=msg;n.classList.toggle('error',error);setTimeout(()=>n.hidden=true,6000)}function fill(){keys.forEach(k=>{if(form.elements[k])form.elements[k].value=data[k]||''});$('#photo-preview').src=data.profilePhoto||'assets/amanda-rabelo.jpeg';drawLists();$('#save-state').textContent='Conteúdo carregado'}function drawLists(){const se=$('#services-editor');se.innerHTML='<h4 style="margin:24px 0 8px">Serviços (edite título, descrição e chamada)</h4>'+(data.services||[]).map((s,i)=>`<div class="repeat-item"><h4>Serviço ${i+1} · ${esc(s.index)}</h4><div class="fields"><label>Título<input data-list="services" data-i="${i}" data-k="title" value="${attr(s.title)}"></label><label>Descrição<textarea rows="2" data-list="services" data-i="${i}" data-k="description">${esc(s.description)}</textarea></label><label>Texto do link<input data-list="services" data-i="${i}" data-k="cta" value="${attr(s.cta)}"></label><label>Mensagem inicial de WhatsApp<input data-list="services" data-i="${i}" data-k="message" value="${attr(s.message)}"></label></div></div>`).join('');$('#steps-editor').innerHTML=(data.steps||[]).map((s,i)=>`<div class="repeat-item"><h4>Etapa 0${i+1}</h4><label>Título<input data-list="steps" data-i="${i}" data-k="title" value="${attr(s.title)}"></label><label>Descrição<textarea rows="2" data-list="steps" data-i="${i}" data-k="description">${esc(s.description)}</textarea></label></div>`).join('');$('#faqs-editor').innerHTML=(data.faqs||[]).map((s,i)=>`<div class="repeat-item"><h4>Pergunta ${i+1}</h4><label>Pergunta<input data-list="faqs" data-i="${i}" data-k="question" value="${attr(s.question)}"></label><label>Resposta<textarea rows="3" data-list="faqs" data-i="${i}" data-k="answer">${esc(s.answer)}</textarea></label></div>`).join('')}function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function attr(s){return esc(s)}form.addEventListener('input',e=>{const t=e.target;if(t.dataset.list){data[t.dataset.list][Number(t.dataset.i)][t.dataset.k]=t.value}else if(t.name){data[t.name]=t.value}$('#save-state').textContent='Há alterações ainda não salvas'});form.addEventListener('submit',e=>{e.preventDefault();syncFields();try{localStorage.setItem('amandaSiteDraft',JSON.stringify(data));$('#save-state').textContent='Salvo neste navegador';notice('Alterações guardadas neste navegador. Para publicar, clique em “Exportar content.js” e envie o arquivo para a hospedagem.')}catch(err){notice('Não foi possível salvar no navegador. Exporte o arquivo content.js.',true)}});function syncFields(){keys.forEach(k=>{if(form.elements[k])data[k]=form.elements[k].value.trim()});data.whatsapp=(data.whatsapp||'').replace(/\D/g,'');if(!data.profilePhoto)data.profilePhoto='assets/amanda-rabelo.jpeg'}$('#photo-file').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(!f.type.startsWith('image/')){notice('Selecione um arquivo de imagem válido.',true);return}if(f.size>8*1024*1024){notice('A imagem deve ter até 8 MB.',true);return}const reader=new FileReader();reader.onload=()=>{data.profilePhoto=reader.result;$('#photo-preview').src=reader.result;$('#save-state').textContent='Foto alterada — exporte content.js para publicar';notice('Foto carregada. Exporte content.js para incluí-la no site.')};reader.readAsDataURL(f)});$('#remove-photo').addEventListener('click',()=>{data.profilePhoto='assets/amanda-rabelo.jpeg';$('#photo-preview').src=data.profilePhoto;$('#photo-file').value='';notice('Foto original restaurada. Exporte content.js para publicar.')});$('#export').addEventListener('click',()=>{syncFields();const source='window.SITE_CONTENT = '+JSON.stringify(data,null,2)+';\n';const blob=new Blob([source],{type:'text/javascript;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='content.js';a.click();URL.revokeObjectURL(url);$('#save-state').textContent='content.js exportado';notice('Arquivo content.js baixado. Substitua o arquivo antigo na pasta do site e faça upload dos arquivos atualizados para publicar.')});$('#reset').addEventListener('click',()=>{if(!confirm('Restaurar os textos e a foto originais?'))return;data=JSON.parse(JSON.stringify(original));localStorage.removeItem('amandaSiteDraft');fill();notice('Conteúdo original restaurado neste painel.')});try{const saved=localStorage.getItem('amandaSiteDraft');if(saved)data={...data,...JSON.parse(saved)}}catch(e){}fill()}
})();
