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
const infoDialog = document.getElementById('demo-info');
const formView = document.getElementById('contact-form-view');
const successView = document.getElementById('contact-success-view');
document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => {
  closeMenu();
  formView.hidden = false;
  successView.hidden = true;
  contactDialog.setAttribute('aria-labelledby','dialog-title');
  contactForm.reset();
  document.getElementById('contact-interest').value = button.dataset.interest || 'Ainda quero entender melhor';
  document.body.classList.add('modal-open');
  contactDialog.showModal();
}));
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => contactDialog.close()));
document.getElementById('demo-info-button').addEventListener('click',() => {document.body.classList.add('modal-open');infoDialog.showModal();});
document.querySelectorAll('[data-close-info]').forEach(button => button.addEventListener('click',() => infoDialog.close()));
for(const dialog of [contactDialog,infoDialog]) {
  dialog.addEventListener('close',() => {document.body.classList.remove('modal-open');if(dialog===contactDialog){contactForm.reset();document.getElementById('success-message').textContent='';document.getElementById('summary-company').textContent='';document.getElementById('summary-interest').textContent='';}});
  dialog.addEventListener('click',event => {const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
}
contactForm.addEventListener('submit',event => {
  event.preventDefault();
  if(!contactForm.reportValidity())return;
  const fields = new FormData(contactForm);
  document.getElementById('success-message').textContent = `${fields.get('nome')}, esta é a prévia de como seu interesse seria apresentado à Morana.`;
  document.getElementById('summary-company').textContent = fields.get('empresa');
  document.getElementById('summary-interest').textContent = fields.get('interesse');
  formView.hidden = true;
  successView.hidden = false;
  contactDialog.setAttribute('aria-labelledby','success-title');
  contactDialog.scrollTop = 0;
  successView.querySelector('button').focus();
  contactForm.reset();
});
