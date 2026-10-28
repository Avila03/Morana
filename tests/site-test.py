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
        for key in ('href', 'src', 'action'):
            if attrs.get(key): self.links.append(attrs[key])

    def handle_endtag(self, tag):
        if tag == 'script': self.in_schema = False

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
    assert {'contact-form','contact-interest','contact-error','contact-success-view','mobile-nav'} <= page.ids

namespace = {'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls = {node.text for node in ET.parse(root/'sitemap.xml').findall('s:url/s:loc', namespace)}
assert urls == canonicals, 'O sitemap não corresponde às páginas canônicas.'
assert base+'sitemap.xml' in (root/'robots.txt').read_text()
png = (root/'assets/morana-compartilhamento.png').read_bytes()
assert png[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',png[16:24]) == (1200,630)
print('5 páginas: links, recursos, âncoras, contato compartilhado, JSON-LD, canonical, sitemap e imagem social verificados.')
