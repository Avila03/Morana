// Exercita o app.js real com DOM mínimo e transporte falso, sem navegador ou envio de e-mails.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const commercial = 'comercial@moranaservicos.com.br';

class Element {
  constructor(id = '') {
    this.id = id;
    this.hidden = false;
    this.value = '';
    this.textContent = '';
    this.dataset = {};
    this.style = {setProperty() {}, removeProperty() {}};
    this.attributes = new Map();
    this.listeners = new Map();
    this.fields = new Map();
    const classes = new Set();
    this.classList = {add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name)};
  }
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, []);
    this.listeners.get(name).push(callback);
  }
  async emit(name, extra = {}) {
    const event = {target:this, preventDefault() {}, ...extra};
    for (const callback of this.listeners.get(name) || []) await callback(event);
  }
  setAttribute(name, value) {this.attributes.set(name, value);}
  getAttribute(name) {return this.attributes.get(name) ?? null;}
  removeAttribute(name) {this.attributes.delete(name);}
  querySelectorAll() {return [];}
  querySelector() {return null;}
  getBoundingClientRect() {return {top:0, bottom:80, left:0, right:600};}
  focus() {this.focused = true;}
  reportValidity() {return this.valid !== false;}
  reset() {this.fields.clear();}
  showModal() {this.open = true;}
  close() {this.open = false; return this.emit('close');}
}

function createSession({url = 'https://moranaservicos.com.br/', discovery = 'timeout', post = 'success'} = {}) {
  const location = new URL(url);
  const elements = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], new Element(match[1])]));
  const get = id => {
    assert.ok(elements.has(id), 'Elemento ausente na página: ' + id);
    return elements.get(id);
  };
  const menu = new Element();
  const header = new Element();
  const opener = new Element();
  opener.dataset.interest = 'Gestão financeira';
  const form = get('contact-form');
  form.setAttribute('action', 'contato.php');
  for (const id of ['mobile-nav','contact-success-view','contact-error','contact-draft-actions']) get(id).hidden = true;
  const body = new Element();
  const document = {
    body, documentElement:new Element(),
    getElementById:get,
    querySelector(selector) {
      if (selector === '.menu-toggle') return menu;
      if (selector === '.site-header') return header;
      if (selector === 'dialog[open]') return get('contact-dialog').open ? get('contact-dialog') : null;
      throw new Error('Consulta inesperada: ' + selector);
    },
    querySelectorAll:selector => selector === '[data-contact]' ? [opener] : [],
    addEventListener() {}
  };
  const calls = [];
  function aborted(signal) {
    return new Promise((resolve, reject) => {
      const fail = () => {const error = new Error('Prazo simulado'); error.name = 'AbortError'; reject(error);};
      if (signal.aborted) fail();
      else signal.addEventListener('abort', fail, {once:true});
    });
  }
  const fetch = async (endpoint, options = {}) => {
    const method = options.method || 'GET';
    calls.push({method, endpoint:String(endpoint), body:options.body});
    if (method === 'GET') {
      if (discovery === 'timeout') return aborted(options.signal);
      if (discovery === 'failure') throw new Error('Falha de rede simulada');
      return {ok:true, headers:{get:() => 'application/json'}, json:async () => ({available:discovery === 'available', recipient:commercial})};
    }
    if (post === 'timeout') return aborted(options.signal);
    if (post === 'failure') throw new Error('Falha de rede simulada');
    return {
      ok:post === 'success',
      json:async () => post === 'success'
        ? {ok:true, receipt_sent:true}
        : {ok:false, message:'Não foi possível encaminhar a mensagem agora.'}
    };
  };
  const window = {
    location, innerHeight:800, scrollY:0,
    matchMedia:() => ({matches:false, addEventListener() {}}),
    addEventListener() {}, requestAnimationFrame() {}, scrollTo() {},
    // Executa apenas os prazos simulados; não aguarda 4 ou 45 segundos nos testes.
    setTimeout:callback => setTimeout(callback, 0), clearTimeout
  };
  class FormData extends Map {
    constructor(element) {super(element.fields);}
  }
  const context = vm.createContext({window, document, fetch, URL, URLSearchParams, FormData, AbortController,
    navigator:{clipboard:{writeText:async () => {}}}});
  vm.runInContext(source, context, {filename:'dist/app.js'});
  return {
    get, calls,
    async ready() {await vm.runInContext('contactServerReady', context);},
    async submit() {
      await opener.emit('click');
      form.fields = new Map(Object.entries({nome:'Pessoa de teste', empresa:'Empresa exemplo', email:'contato@example.com',
        interesse:get('contact-interest').value, desafio:'Quero organizar a gestão.', website:''}));
      await form.emit('submit');
    }
  };
}

for (const hostname of ['moranaservicos.com.br','www.moranaservicos.com.br']) {
  test(hostname + ': uma consulta de disponibilidade lenta não impede o envio direto', async () => {
    const session = createSession({url:'https://' + hostname + '/', discovery:'timeout'});
    await session.ready();
    await session.submit();
    const posts = session.calls.filter(call => call.method === 'POST');
    assert.equal(posts.length, 1);
    assert.equal(session.get('contact-result-label').textContent, 'SOLICITAÇÃO ENCAMINHADA');
    assert.equal(session.get('contact-draft-actions').hidden, true);
    assert.equal(session.get('contact-success-view').hidden, false);
    assert.match(session.get('contact-result-note').textContent, /confirmação/);
    const fields = new URLSearchParams(posts[0].body);
    assert.equal(fields.get('interesse'), 'Gestão financeira');
    assert.equal(fields.get('desafio'), 'Quero organizar a gestão.');
  });
}

for (const post of ['rejected','failure','timeout']) {
  test('Falha no POST (' + post + ') preserva os campos e não mostra sucesso', async () => {
    const session = createSession({discovery:'available', post});
    await session.ready();
    await session.submit();
    assert.equal(session.get('contact-form').fields.get('desafio'), 'Quero organizar a gestão.');
    assert.equal(session.get('contact-error').hidden, false);
    assert.equal(session.get('contact-success-view').hidden, true);
    assert.equal(session.get('contact-draft-actions').hidden, true);
    assert.equal(session.get('contact-submit').disabled, false);
  });
}

for (const url of ['https://avila03.github.io/Morana/dist/', 'https://demo.chatgpt.site/', 'file:///morana/index.html']) {
  test('Prévia estática prepara uma mensagem sem alegar envio: ' + url, async () => {
    const session = createSession({url});
    await session.ready();
    await session.submit();
    assert.equal(session.calls.length, 0);
    assert.equal(session.get('contact-draft-actions').hidden, false);
    assert.match(session.get('contact-result-note').textContent, /ainda não foi enviada/);
  });
}

test('Um servidor PHP local continua sendo identificado pela disponibilidade', async () => {
  const session = createSession({url:'http://localhost:8080/', discovery:'available'});
  await session.ready();
  await session.submit();
  assert.deepEqual(session.calls.map(call => call.method), ['GET','POST']);
  assert.equal(session.get('contact-success-view').hidden, false);
});
