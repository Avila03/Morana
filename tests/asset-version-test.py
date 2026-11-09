"""Uma alteração em CSS/JS precisa atualizar a URL nas cinco páginas antes do deploy."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
ASSETS = {'styles.css', 'brand.css', 'app.js'}


class AssetLinks(HTMLParser):
    def __init__(self, page):
        super().__init__()
        self.versions = {}
        self.feed(page.read_text())
        assert set(self.versions) == ASSETS
        assert all(self.versions.values()), 'Recurso sem versão: '+str(page)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag not in ['link', 'script']:
            return
        url = urlsplit(attrs.get('src', attrs.get('href', '')))
        name = Path(url.path).name
        if name in ASSETS:
            self.versions[name] = parse_qs(url.query).get('v', [''])[0]


with tempfile.TemporaryDirectory(prefix='morana-asset-test-') as directory:
    fixture = Path(directory)
    shutil.copytree(ROOT/'dist', fixture/'dist')
    (fixture/'scripts').mkdir()
    shutil.copy2(ROOT/'scripts/build_service_pages.py', fixture/'scripts/build_service_pages.py')
    command = [sys.executable, str(fixture/'scripts/build_service_pages.py')]

    def run(check=False):
        return subprocess.run(command+(['--check'] if check else []), capture_output=True, text=True, timeout=15)

    assert run(check=True).returncode == 0
    for name in sorted(ASSETS):
        before = AssetLinks(fixture/'dist/index.html').versions
        with (fixture/'dist'/name).open('a') as asset:
            asset.write('\n/* Verificação de atualização do cache. */\n')
        assert run(check=True).returncode != 0, 'O deploy precisa rejeitar referências antigas: '+name
        result = run()
        assert result.returncode == 0, result.stderr
        after = AssetLinks(fixture/'dist/index.html').versions
        assert after[name] != before[name], 'A URL não mudou depois de alterar '+name
        assert all(after[other] == before[other] for other in ASSETS-{name})
        pages = list((fixture/'dist').rglob('*.html'))
        assert len(pages) == 5
        assert all(AssetLinks(page).versions == after for page in pages)
        assert run(check=True).returncode == 0

print('CSS/JS alterados: referências antigas rejeitadas e versões atualizadas nas cinco páginas.')
