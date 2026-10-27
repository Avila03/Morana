"""Confere os arquivos públicos e a disponibilidade do contato, apenas com GET."""
import argparse
import concurrent.futures
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request


def fetch(url, limit):
    request = urllib.request.Request(url, headers={
        'User-Agent': 'MoranaDeployCheck/1.0',
        'Accept': '*/*',
        'Cache-Control': 'no-cache',
    })
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                if response.status != 200 or urllib.parse.urlsplit(response.geturl()).scheme != 'https':
                    raise ValueError('Resposta inválida da hospedagem.')
                return response.read(limit + 1)
        except (OSError, ValueError, urllib.error.URLError):
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='https://moranaservicos.com.br/')
    parser.add_argument('--revision', default='verificacao')
    args = parser.parse_args()
    base = args.base_url.rstrip('/') + '/'
    parsed = urllib.parse.urlsplit(base)
    if parsed.scheme != 'https' or not parsed.netloc or parsed.query or parsed.fragment or parsed.username:
        parser.error('Informe uma URL HTTPS sem credenciais, consulta ou fragmento.')

    source = Path(__file__).resolve().parents[1] / 'dist'
    files = sorted(path for path in source.rglob('*') if path.is_file()
                   and path.suffix.lower() != '.php' and path.name != '.htaccess')
    if not files:
        raise SystemExit('Não há arquivos para verificar em dist/.')

    def url_for(name):
        return urllib.parse.urljoin(base, urllib.parse.quote(name, safe='/')) + '?' + urllib.parse.urlencode({'morana_deploy': args.revision})

    def check_file(path):
        name = path.relative_to(source).as_posix()
        expected = path.read_bytes()
        if fetch(url_for(name), len(expected)) != expected:
            raise ValueError('O arquivo publicado não corresponde ao commit: ' + name)
        return name

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            checked = list(pool.map(check_file, files))
        # Confira também a URL sem index.html para detectar a entrada antiga do WordPress.
        home_url = base + '?' + urllib.parse.urlencode({'morana_deploy': args.revision})
        expected_home = (source / 'index.html').read_bytes()
        if fetch(home_url, len(expected_home)) != expected_home:
            raise ValueError('A página inicial do domínio ainda não corresponde ao site Morana.')
        contact = json.loads(fetch(url_for('contato.php'), 4096))
        if (not isinstance(contact, dict) or type(contact.get('available')) is not bool
                or contact.get('recipient') != 'comercial@moranaservicos.com.br'):
            raise ValueError('A resposta de contato.php não corresponde ao projeto.')
    except (OSError, ValueError, urllib.error.URLError) as error:
        raise SystemExit('Falha na verificação pública: ' + str(error)) from None

    message = f'Conferidos {len(checked)} arquivos em {base}'
    print(message)
    contact_status = ('Envio PHP disponível; o recebimento de um teste ainda precisa ser conferido.'
                      if contact['available'] else 'Envio direto pendente: a função mail() está indisponível na hospedagem.')
    print(contact_status if contact['available'] else '::warning::' + contact_status)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
            summary.write(f'Arquivos publicados e conferidos: {base}\n\nCommit: `{args.revision}`\n\n{contact_status}\n')


if __name__ == '__main__':
    main()
