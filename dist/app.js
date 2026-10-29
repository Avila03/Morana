'use strict';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const compactLayout = window.matchMedia('(max-width:760px), (max-width:1000px) and (max-height:520px)');
let overlayScrollY = 0;
function lockPageScroll() {
  if (document.body.classList.contains('modal-open')) return;
  overlayScrollY = window.scrollY;
  document.body.style.setProperty('--locked-scroll',String(-overlayScrollY)+'px');
  document.body.classList.add('modal-open');
}
function releasePageScroll() {
  if (!document.body.classList.contains('modal-open') || !mobileNav.hidden || document.querySelector('dialog[open]')) return;
  document.body.classList.remove('modal-open');
  document.body.style.removeProperty('--locked-scroll');
  const previousBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0,overlayScrollY);
  document.documentElement.style.scrollBehavior = previousBehavior;
}
const services = {
  estrategia: {tag:'ESTRATÉGIA',icon:'target',title:'Saber onde chegar muda a forma de caminhar.',description:'Transforme objetivos em prioridades claras. Um olhar para o momento atual do negócio e um plano que conecta visão de futuro às decisões de hoje.',deliverables:['Diagnóstico do negócio e das oportunidades','Definição de objetivos e indicadores','Plano de ação com prioridades e responsáveis'],interest:'Planejamento estratégico',index:'01'},
  financeiro: {tag:'FINANÇAS',icon:'chart',title:'Entenda os números. Decida com mais segurança.',description:'Traga visibilidade para a saúde financeira da empresa. Organize as informações, compreenda custos e margens e tenha uma base mais clara para decidir.',deliverables:['Organização do fluxo de caixa e do orçamento','Análise de custos, despesas e margens','Indicadores para acompanhar a gestão financeira'],interest:'Gestão financeira',index:'02'},
  processos: {tag:'OPERAÇÃO',icon:'process',title:'Uma operação mais simples. Um negócio mais preparado.',description:'Olhe para a rotina com perspectiva. Identifique gargalos, reduza o retrabalho e desenhe processos que façam sentido para quem executa e para o negócio.',deliverables:['Mapeamento de processos e gargalos','Definição de rotinas e responsabilidades','Acompanhamento da melhoria operacional'],interest:'Processos e operação',index:'03'},
  pessoas: {tag:'PESSOAS',icon:'people',title:'Pessoas alinhadas movem a empresa na mesma direção.',description:'Aproxime os objetivos da empresa do dia a dia da equipe. Desenvolva uma estrutura mais clara para a liderança, a comunicação e a responsabilidade de cada pessoa.',deliverables:['Clareza de papéis e responsabilidades','Alinhamento da equipe aos objetivos do negócio','Rotinas de liderança e acompanhamento'],interest:'Pessoas e liderança',index:'04'}
};
const tabs = [...document.querySelectorAll('[data-service]')];
const servicePaths = {estrategia:'planejamento-estrategico',financeiro:'gestao-financeira',processos:'processos-e-operacao',pessoas:'pessoas-e-lideranca'};
function selectService(key, moveFocus = false) {
  const item = services[key];
  if (!item) return;
  tabs.forEach(tab => {
    const selected = tab.dataset.service === key;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && moveFocus) tab.focus();
  });
  document.getElementById('service-title').textContent = item.title;
  document.getElementById('service-description').textContent = item.description;
  document.getElementById('service-tag').textContent = item.tag;
  document.getElementById('service-icon-use').setAttribute('href', '#' + item.icon);
  document.getElementById('service-index').textContent = item.index;
  document.getElementById('service-art-image').src = 'assets/servico-' + key + '.svg';
  const list = document.getElementById('service-deliverables');
  list.replaceChildren(...item.deliverables.map(text => {
    const li = document.createElement('li');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('icon');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#check');
    svg.append(use);
    li.append(svg, document.createTextNode(text));
    return li;
  }));
  document.getElementById('service-contact').dataset.interest = item.interest;
  document.getElementById('service-details').href = 'solucoes/' + servicePaths[key] + '/';
  const panel = document.getElementById('painel-solucao');
  panel.setAttribute('aria-labelledby','tab-' + key);
  const transitionTarget = compactLayout.matches ? panel.querySelector('.service-panel-heading') : panel;
  for (const animation of transitionTarget.getAnimations?.() ?? []) animation.cancel();
  if (panel.dataset.visual !== key && !reducedMotion.matches && typeof transitionTarget.animate === 'function') {
    const frames = compactLayout.matches ? [{opacity:.5},{opacity:1}] : [{opacity:.65,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}];
    transitionTarget.animate(frames,{duration:compactLayout.matches?180:240,easing:'ease-out'});
  }
  panel.dataset.visual = key;
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectService(tab.dataset.service));
  tab.addEventListener('keydown', event => {
    const next = {ArrowDown:(index+1)%tabs.length,ArrowRight:(index+1)%tabs.length,ArrowUp:(index+tabs.length-1)%tabs.length,ArrowLeft:(index+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[event.key];
    if (next !== undefined) {event.preventDefault();selectService(tabs[next].dataset.service,true);}
  });
});
document.querySelectorAll('[data-select-service]').forEach(link => link.addEventListener('click', () => selectService(link.dataset.selectService)));

const challenges = {
  financeiro:{title:'Veja o que fica entre vender e ter resultado.',description:'Entender custos, margens e fluxo de caixa ajuda a identificar onde os recursos estão sendo consumidos e quais decisões precisam de atenção.'},
  pessoas:{title:'Distribua responsabilidades. Dê espaço à equipe.',description:'Papéis claros e rotinas de liderança ajudam a organizar decisões, alinhar a equipe e reduzir a concentração de tarefas em uma pessoa.'},
  processos:{title:'Encontre os gargalos da sua rotina.',description:'Mapear como o trabalho acontece permite identificar retrabalho, organizar etapas e definir responsabilidades para uma operação mais clara.'},
  estrategia:{title:'Transforme a intenção de crescer em um plano.',description:'Prioridades, objetivos e responsáveis definidos ajudam a conectar o futuro que a empresa deseja às ações que precisa executar agora.'}
};
document.querySelectorAll('[data-challenge]').forEach(button => button.addEventListener('click', () => {
  const key=button.dataset.challenge;
  const item=services[key];
  document.querySelectorAll('[data-challenge]').forEach(choice => choice.setAttribute('aria-pressed',String(choice===button)));
  document.getElementById('challenge-tag').textContent=item.interest;
  document.getElementById('challenge-heading').textContent=challenges[key].title;
  document.getElementById('challenge-description').textContent=challenges[key].description;
  document.getElementById('challenge-contact').dataset.interest=item.interest;
  document.getElementById('challenge-details').href='solucoes/'+servicePaths[key]+'/';
  document.getElementById('challenge-result').hidden=false;
  document.getElementById('challenge-result').scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}));

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
const menuShade = document.getElementById('menu-shade');
function closeMenu(restoreFocus = false) {
  const wasOpen = !mobileNav.hidden;
  mobileNav.hidden = true;
  menuShade.hidden = true;
  document.body.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded','false');
  menuButton.setAttribute('aria-label','Abrir menu');
  releasePageScroll();
  if (restoreFocus && wasOpen) menuButton.focus({preventScroll:true});
}
menuButton.addEventListener('click', () => {
  const opened = menuButton.getAttribute('aria-expanded') === 'true';
  if (opened) {closeMenu(true);return;}
  lockPageScroll();
  document.body.classList.add('menu-open');
  mobileNav.hidden = false;
  menuShade.hidden = false;
  menuButton.setAttribute('aria-expanded','true');
  menuButton.setAttribute('aria-label','Fechar menu');
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
menuShade.addEventListener('click', () => closeMenu(true));
document.addEventListener('keydown',event => {if(event.key==='Escape')closeMenu(true);});
compactLayout.addEventListener('change',event => {if(!event.matches)closeMenu();});

const contactDialog = document.getElementById('contact-dialog');
const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('invalid', event => event.target.setAttribute('aria-invalid','true'), true);
contactForm.addEventListener('input', event => {
  if (event.target.validity?.valid) event.target.removeAttribute('aria-invalid');
});
contactForm.addEventListener('reset', () => contactForm.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid')));
const contactEndpoint = new URL(contactForm.getAttribute('action'), window.location.href);
const infoDialog = document.getElementById('privacy-info');
const formView = document.getElementById('contact-form-view');
const successView = document.getElementById('contact-success-view');
const commercialEmail = 'comercial@moranaservicos.com.br';
const submitButton = document.getElementById('contact-submit');
const contactActions = document.getElementById('contact-actions');
const contactContent = document.getElementById('contact-dialog-content');
const submitLabel = document.getElementById('contact-submit-label');
const transportNote = document.getElementById('contact-transport-note');
const formError = document.getElementById('contact-error');
let requestSerial = 0;
let requestController = null;
let sending = false;
let serverAvailable = false;

function syncDialogViewport() {
  const viewport = window.visualViewport;
  const height = viewport?.height > 0 ? viewport.height : window.innerHeight;
  const top = viewport?.offsetTop || 0;
  for (const dialog of [contactDialog,infoDialog]) {
    dialog.style.setProperty('--dialog-height',height+'px');
    dialog.style.setProperty('--dialog-top',top+'px');
  }
}
window.visualViewport?.addEventListener('resize',syncDialogViewport);
window.visualViewport?.addEventListener('scroll',syncDialogViewport);
window.addEventListener('resize',syncDialogViewport,{passive:true});
syncDialogViewport();

async function discoverContactServer() {
  const host = window.location.hostname;
  if (window.location.protocol === 'file:' || host.endsWith('.github.io') || host.endsWith('.chatgpt.site')) return false;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(contactEndpoint, {headers:{Accept:'application/json'},cache:'no-store',credentials:'omit',signal:controller.signal});
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return false;
    const data = await response.json();
    return data.available === true && data.recipient === commercialEmail;
  } catch {return false;} finally {window.clearTimeout(timer);}
}
function updateContactTransport() {
  if (sending) return;
  submitLabel.textContent = serverAvailable ? 'Enviar mensagem' : 'Preparar e-mail';
  transportNote.textContent = serverAvailable
    ? 'Sua solicitação será encaminhada ao e-mail comercial da Morana.'
    : 'Prepare a mensagem aqui. Depois, revise e envie no seu aplicativo de e-mail.';
}
const contactServerReady = discoverContactServer().then(available => {serverAvailable=available;updateContactTransport();return available;});

function showContactResult(fields, sent, receiptSent = false) {
  const name = String(fields.get('nome')).trim();
  const company = String(fields.get('empresa')).trim();
  const interest = String(fields.get('interesse'));
  const message = String(fields.get('desafio') || '').trim();
  const body = `Olá, equipe Morana!\n\nNome: ${name}\nEmpresa: ${company}\nE-mail: ${String(fields.get('email')).trim()}\nInteresse: ${interest}\n\n${message || 'Gostaria de conversar sobre a gestão da minha empresa.'}`;
  document.getElementById('contact-result-label').textContent = sent ? 'SOLICITAÇÃO ENCAMINHADA' : 'MENSAGEM PREPARADA';
  document.getElementById('success-title').textContent = sent ? 'Obrigado pelo contato.' : 'Seu e-mail está pronto.';
  document.getElementById('success-message').textContent = sent
    ? `${name}, sua solicitação foi encaminhada para envio à equipe comercial da Morana.`
    : `${name}, abra seu aplicativo de e-mail para revisar e enviar a mensagem para ${commercialEmail}.`;
  document.getElementById('summary-company').textContent = company;
  document.getElementById('summary-interest').textContent = interest;
  document.getElementById('contact-result-note').textContent = sent
    ? (receiptSent ? 'Uma confirmação também foi encaminhada ao e-mail informado. ' : '') + 'Nossa equipe comercial analisará sua solicitação e responderá por e-mail.'
    : 'Sua mensagem ainda não foi enviada. Confirme o envio no seu aplicativo de e-mail.';
  document.getElementById('contact-draft-actions').hidden = sent;
  document.getElementById('contact-draft-text').value = sent ? '' : body;
  document.getElementById('contact-draft-link').href = `mailto:${commercialEmail}?subject=${encodeURIComponent('Contato pelo site | Morana')}&body=${encodeURIComponent(body)}`;
  formView.hidden = true;
  successView.hidden = false;
  contactActions.hidden = true;
  contactDialog.setAttribute('aria-labelledby','success-title');
  contactContent.scrollTop = 0;
  const focusTarget = document.getElementById('success-title');
  focusTarget.focus({preventScroll:true});
  contactForm.reset();
}
document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => {
  closeMenu();
  formView.hidden = false;
  successView.hidden = true;
  contactActions.hidden = false;
  contactDialog.setAttribute('aria-labelledby','dialog-title');
  contactForm.reset();
  formError.hidden = true;
  formError.textContent = '';
  updateContactTransport();
  document.getElementById('contact-interest').value = button.dataset.interest || document.body.dataset.interest || 'Ainda quero entender melhor';
  lockPageScroll();
  syncDialogViewport();
  contactDialog.showModal();
  contactContent.scrollTop = 0;
}));
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => contactDialog.close()));
document.getElementById('privacy-info-button').addEventListener('click',() => {lockPageScroll();syncDialogViewport();infoDialog.showModal();infoDialog.querySelector('.dialog-content').scrollTop=0;});
document.querySelectorAll('[data-close-info]').forEach(button => button.addEventListener('click',() => infoDialog.close()));
for(const dialog of [contactDialog,infoDialog]) {
  dialog.addEventListener('close',() => {
    releasePageScroll();
    if(dialog===contactDialog){
      requestSerial++;
      if(requestController)requestController.abort();
      requestController=null;
      sending=false;
      submitButton.disabled=false;
      contactForm.removeAttribute('aria-busy');
      contactForm.reset();
      for(const id of ['success-message','summary-company','summary-interest','contact-copy-status'])document.getElementById(id).textContent='';
      document.getElementById('contact-draft-text').value='';
      document.getElementById('contact-draft-link').href=`mailto:${commercialEmail}`;
      updateContactTransport();
    }
  });
  dialog.addEventListener('click',event => {const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
}
contactForm.addEventListener('submit',async event => {
  event.preventDefault();
  if(sending || !contactForm.reportValidity())return;
  const fields = new FormData(contactForm);
  const thisRequest=++requestSerial;
  sending=true;
  submitButton.disabled=true;
  contactForm.setAttribute('aria-busy','true');
  formError.hidden=true;
  submitLabel.textContent='Preparando…';
  let timer;
  try {
    const available=await contactServerReady;
    if(thisRequest!==requestSerial)return;
    if(!available){showContactResult(fields,false);return;}
    submitLabel.textContent='Enviando…';
    requestController=new AbortController();
    timer=window.setTimeout(()=>requestController?.abort(),45000);
    const response=await fetch(contactEndpoint,{
      method:'POST',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      credentials:'omit',cache:'no-store',body:new URLSearchParams(fields).toString(),signal:requestController.signal
    });
    const payload=await response.json().catch(()=>null);
    if(thisRequest!==requestSerial)return;
    if(!response.ok || payload?.ok!==true){
      const failure=new Error('Contact request failed');
      failure.displayMessage=typeof payload?.message==='string' ? payload.message : 'Não foi possível confirmar o envio. Seu texto foi mantido; você pode escrever diretamente para nosso e-mail.';
      throw failure;
    }
    showContactResult(fields,true,payload.receipt_sent===true);
  } catch(error) {
    if(thisRequest!==requestSerial)return;
    formError.textContent=error.name==='AbortError'
      ? 'Não foi possível confirmar o envio a tempo. Seu texto foi mantido. Você pode escrever diretamente para comercial@moranaservicos.com.br.'
      : (error.displayMessage || 'Não foi possível confirmar o envio. Seu texto foi mantido. Você pode escrever para comercial@moranaservicos.com.br.');
    formError.hidden=false;
    formError.focus();
  } finally {
    window.clearTimeout(timer);
    if(thisRequest===requestSerial){
      sending=false;
      requestController=null;
      submitButton.disabled=false;
      contactForm.removeAttribute('aria-busy');
      updateContactTransport();
    }
  }
});
document.getElementById('copy-contact-message').addEventListener('click',async()=>{
  const draft=document.getElementById('contact-draft-text');
  const status=document.getElementById('contact-copy-status');
  try {await navigator.clipboard.writeText(draft.value);status.textContent='Mensagem copiada.';}
  catch {draft.focus();draft.select();status.textContent='Mensagem selecionada. Use a opção Copiar do seu dispositivo.';}
});

// O conteúdo permanece visível sem JavaScript e com movimento reduzido.
const revealTargets = [...document.querySelectorAll('[data-reveal]')];
let revealObserver;
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    }
  },{threshold:.08,rootMargin:'0px 0px 30px 0px'});
  for (const element of revealTargets) {
    if (element.getBoundingClientRect().top > window.innerHeight) {
      element.classList.add('reveal-pending');
      revealObserver.observe(element);
    }
  }
}
reducedMotion.addEventListener('change', event => {
  if (event.matches) {
    revealObserver?.disconnect();
    revealTargets.forEach(element => element.classList.add('is-revealed'));
    for (const target of document.querySelectorAll('#painel-solucao,.service-panel-heading')) {
      for (const animation of target.getAnimations?.() ?? []) animation.cancel();
    }
  }
});

const navLinks = [...document.querySelectorAll('.desktop-nav a,.mobile-nav a')];
const localNav = navLinks.map(link => ({link,url:new URL(link.href)})).filter(item => item.url.pathname === window.location.pathname && item.url.hash);
const navSections = [...new Set(localNav.map(item => document.getElementById(item.url.hash.slice(1))).filter(Boolean))];
if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    const active = entries.find(entry => entry.isIntersecting);
    if (!active) return;
    for (const item of localNav) {
      if (item.url.hash === '#' + active.target.id) item.link.setAttribute('aria-current','location');
      else item.link.removeAttribute('aria-current');
    }
  },{rootMargin:'-15% 0px -55% 0px',threshold:0});
  navSections.forEach(section => navObserver.observe(section));
}

const siteHeader = document.querySelector('.site-header');
let progressQueued = false;
function queueReadingProgress() {
  if (progressQueued) return;
  progressQueued = true;
  window.requestAnimationFrame(() => {
    if (document.body.classList.contains('modal-open')) {progressQueued=false;return;}
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maximum > 0 ? Math.min(1,Math.max(0,window.scrollY / maximum)) : 0;
    siteHeader.style.setProperty('--reading-progress',String(progress));
    progressQueued = false;
  });
}
window.addEventListener('scroll',queueReadingProgress,{passive:true});
window.addEventListener('resize',queueReadingProgress,{passive:true});
queueReadingProgress();
