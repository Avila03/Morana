"""Verifica navegação local, metadados e páginas públicas sem iniciar serviços externos."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import struct
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1] / 'dist'
base = 'https://moranaservicos.com.br/'


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = set()
        self.links = []
        self.meta = {}
        self.canonical = None
        self.h1_count = 0
        self.schema = []
        self.in_schema = False
        self.forms = set()
        self.form_stack = []
        self.submit_controls = {}
        self.detail_stack = []
        self.service_panels = {}
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'ID duplicado em {self.path}: {attrs["id"]}'
            self.ids.add(attrs['id'])
        if tag == 'h1': self.h1_count += 1
        if tag == 'meta': self.meta[attrs.get('property', attrs.get('name'))] = attrs.get('content')
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonical = attrs['href']
        if tag == 'script' and attrs.get('type') == 'application/ld+json': self.in_schema = True
        if tag == 'form':
            self.forms.add(attrs.get('id'))
            self.form_stack.append(attrs.get('id'))
        if tag == 'button' and attrs.get('type', 'submit') == 'submit':
            self.submit_controls[attrs.get('id')] = attrs.get('form') or (self.form_stack[-1] if self.form_stack else None)
        if tag == 'details':
            key = attrs.get('data-service-panel')
            self.detail_stack.append(key)
            if key:
                assert key not in self.service_panels
                self.service_panels[key] = {'open':'open' in attrs, 'summaries':0, 'interest':None}
        current_service = self.detail_stack[-1] if self.detail_stack else None
        if current_service:
            if tag == 'summary': self.service_panels[current_service]['summaries'] += 1
            if tag == 'button' and 'data-contact' in attrs:
                self.service_panels[current_service]['interest'] = attrs.get('data-interest')
        for key in ('href', 'src', 'action'):
            if attrs.get(key): self.links.append(attrs[key])

    def handle_endtag(self, tag):
        if tag == 'script': self.in_schema = False
        if tag == 'form': self.form_stack.pop()
        if tag == 'details': self.detail_stack.pop()

    def handle_data(self, data):
        if self.in_schema: self.schema.append(json.loads(data))


pages = {p.resolve(): Page(p) for p in root.rglob('*.html')}
assert len(pages) == 5, 'A publicação deve incluir a página inicial e quatro serviços.'
canonicals = set()
for path, page in pages.items():
    assert page.h1_count == 1, f'Título principal ausente ou duplicado: {path}'
    assert page.canonical and page.canonical.startswith(base)
    assert page.canonical not in canonicals
    canonicals.add(page.canonical)
    assert page.meta.get('description') and page.meta.get('og:url') == page.canonical
    assert page.meta.get('og:image') == base+'assets/morana-compartilhamento.png'
    assert page.schema and all(s['@context'] == 'https://schema.org' for s in page.schema)
    for href in page.links:
        parsed = urlsplit(href)
        if parsed.scheme or parsed.netloc: continue
        target = path if not parsed.path else (path.parent/unquote(parsed.path)).resolve()
        if target.is_dir(): target = target/'index.html'
        assert target.is_relative_to(root.resolve()) and target.is_file(), f'Link ou recurso ausente em {path}: {href}'
        if parsed.fragment and target.suffix == '.html':
            assert target.resolve() in pages and unquote(parsed.fragment) in pages[target.resolve()].ids, f'Âncora ausente: {href}'
    assert {'contact-form','contact-interest','contact-error','contact-success-view','mobile-nav','menu-shade','contact-dialog-content','contact-actions','contact-submit','success-title'} <= page.ids
    assert 'contact-form' in page.forms and page.submit_controls.get('contact-submit') == 'contact-form', f'O botão de envio precisa estar associado ao formulário de contato: {path}'
    if page.canonical == base:
        interests = {'estrategia':'Planejamento estratégico','financeiro':'Gestão financeira','processos':'Processos e operação','pessoas':'Pessoas e liderança'}
        assert set(page.service_panels) == set(interests), 'As quatro soluções precisam estar disponíveis em detalhes nativos.'
        assert sum(panel['open'] for panel in page.service_panels.values()) == 1
        for key, interest in interests.items():
            assert page.service_panels[key]['summaries'] == 1 and page.service_panels[key]['interest'] == interest, f'Solução sem resumo ou contato correto: {key}'

namespace = {'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls = {node.text for node in ET.parse(root/'sitemap.xml').findall('s:url/s:loc', namespace)}
assert urls == canonicals, 'O sitemap não corresponde às páginas canônicas.'
assert base+'sitemap.xml' in (root/'robots.txt').read_text()
png = (root/'assets/morana-compartilhamento.png').read_bytes()
assert png[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',png[16:24]) == (1200,630)
print('5 páginas: links, recursos, âncoras, contato compartilhado, JSON-LD, canonical, sitemap e imagem social verificados.')
