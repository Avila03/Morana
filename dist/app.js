'use strict';

const services = {
  estrategia: {tag:'ESTRATÉGIA',icon:'target',title:'Saber onde chegar muda a forma de caminhar.',description:'Transforme objetivos em prioridades claras. Um olhar para o momento atual do negócio e um plano que conecta visão de futuro às decisões de hoje.',deliverables:['Diagnóstico do negócio e das oportunidades','Definição de objetivos e indicadores','Plano de ação com prioridades e responsáveis'],interest:'Planejamento estratégico',index:'01'},
  financeiro: {tag:'FINANÇAS',icon:'chart',title:'Entenda os números. Decida com mais segurança.',description:'Traga visibilidade para a saúde financeira da empresa. Organize as informações, compreenda custos e margens e tenha uma base mais clara para decidir.',deliverables:['Organização do fluxo de caixa e do orçamento','Análise de custos, despesas e margens','Indicadores para acompanhar a gestão financeira'],interest:'Gestão financeira',index:'02'},
  processos: {tag:'OPERAÇÃO',icon:'process',title:'Uma operação mais simples. Um negócio mais preparado.',description:'Olhe para a rotina com perspectiva. Identifique gargalos, reduza o retrabalho e desenhe processos que façam sentido para quem executa e para o negócio.',deliverables:['Mapeamento de processos e gargalos','Definição de rotinas e responsabilidades','Acompanhamento da melhoria operacional'],interest:'Processos e operação',index:'03'},
  pessoas: {tag:'PESSOAS',icon:'people',title:'Pessoas alinhadas movem a empresa na mesma direção.',description:'Aproxime os objetivos da empresa do dia a dia da equipe. Desenvolva uma estrutura mais clara para a liderança, a comunicação e a responsabilidade de cada pessoa.',deliverables:['Clareza de papéis e responsabilidades','Alinhamento da equipe aos objetivos do negócio','Rotinas de liderança e acompanhamento'],interest:'Pessoas e liderança',index:'04'}
};
const tabs = [...document.querySelectorAll('[data-service]')];
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
  document.getElementById('painel-solucao').setAttribute('aria-labelledby','tab-' + key);
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectService(tab.dataset.service));
  tab.addEventListener('keydown', event => {
    const next = {ArrowDown:(index+1)%tabs.length,ArrowRight:(index+1)%tabs.length,ArrowUp:(index+tabs.length-1)%tabs.length,ArrowLeft:(index+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[event.key];
    if (next !== undefined) {event.preventDefault();selectService(tabs[next].dataset.service,true);}
  });
});
document.querySelectorAll('[data-select-service]').forEach(link => link.addEventListener('click', () => selectService(link.dataset.selectService)));

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
function closeMenu() {mobileNav.hidden = true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Abrir menu');}
menuButton.addEventListener('click', () => {
  const opened = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded',String(!opened));
  menuButton.setAttribute('aria-label',opened ? 'Abrir menu' : 'Fechar menu');
  mobileNav.hidden = opened;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown',event => {if(event.key==='Escape')closeMenu();});
window.matchMedia('(min-width:761px)').addEventListener('change',event => {if(event.matches)closeMenu();});

const contactDialog = document.getElementById('contact-dialog');
const contactForm = document.getElementById('contact-form');
const infoDialog = document.getElementById('privacy-info');
const formView = document.getElementById('contact-form-view');
const successView = document.getElementById('contact-success-view');
const commercialEmail = 'comercial@moranaservicos.com.br';
const submitButton = contactForm.querySelector('[type="submit"]');
const submitLabel = document.getElementById('contact-submit-label');
const transportNote = document.getElementById('contact-transport-note');
const formError = document.getElementById('contact-error');
let requestSerial = 0;
let requestController = null;
let sending = false;
let serverAvailable = false;

async function discoverContactServer() {
  const host = window.location.hostname;
  if (window.location.protocol === 'file:' || host.endsWith('.github.io') || host.endsWith('.chatgpt.site')) return false;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch('contato.php', {headers:{Accept:'application/json'},cache:'no-store',credentials:'omit',signal:controller.signal});
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

function showContactResult(fields, sent) {
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
    ? `Se precisar complementar sua solicitação, escreva diretamente para ${commercialEmail}.`
    : 'Sua mensagem ainda não foi enviada. Confirme o envio no seu aplicativo de e-mail.';
  document.getElementById('contact-draft-actions').hidden = sent;
  document.getElementById('contact-draft-text').value = sent ? '' : body;
  document.getElementById('contact-draft-link').href = `mailto:${commercialEmail}?subject=${encodeURIComponent('Contato pelo site | Morana')}&body=${encodeURIComponent(body)}`;
  formView.hidden = true;
  successView.hidden = false;
  contactDialog.setAttribute('aria-labelledby','success-title');
  contactDialog.scrollTop = 0;
  const focusTarget = sent ? successView.querySelector('[data-close-dialog]') : document.getElementById('contact-draft-link');
  focusTarget.focus();
  contactForm.reset();
}
document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => {
  closeMenu();
  formView.hidden = false;
  successView.hidden = true;
  contactDialog.setAttribute('aria-labelledby','dialog-title');
  contactForm.reset();
  formError.hidden = true;
  formError.textContent = '';
  updateContactTransport();
  document.getElementById('contact-interest').value = button.dataset.interest || 'Ainda quero entender melhor';
  document.body.classList.add('modal-open');
  contactDialog.showModal();
}));
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => contactDialog.close()));
document.getElementById('privacy-info-button').addEventListener('click',() => {document.body.classList.add('modal-open');infoDialog.showModal();});
document.querySelectorAll('[data-close-info]').forEach(button => button.addEventListener('click',() => infoDialog.close()));
for(const dialog of [contactDialog,infoDialog]) {
  dialog.addEventListener('close',() => {
    document.body.classList.remove('modal-open');
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
    timer=window.setTimeout(()=>requestController?.abort(),25000);
    const response=await fetch('contato.php',{
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
    showContactResult(fields,true);
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
