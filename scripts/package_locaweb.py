"""Gera um pacote com os arquivos publicados, sem dependências ou credenciais."""
from pathlib import Path
import argparse
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, default=Path('artifacts/morana-locaweb.zip'))
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
source = root / 'dist'
required = ['index.html', 'styles.css', 'app.js', 'contato.php', 'contact-handler.php', 'contact-mailer.php',
            'configurar-contato.php', 'contact-setup-key.php', 'vendor/phpmailer/PHPMailer.php',
            'vendor/phpmailer/SMTP.php', 'vendor/phpmailer/Exception.php', 'vendor/phpmailer/LICENSE']
for name in required:
    if not (source / name).is_file():
        raise SystemExit(f'Arquivo obrigatório ausente: {name}')
files = sorted(path for path in source.rglob('*') if path.is_file())
for path in files:
    if path.name.startswith(('qa-', '.env')) or path.is_symlink():
        raise SystemExit(f'Arquivo temporário ou inesperado em dist: {path.name}')
target = args.output if args.output.is_absolute() else root / args.output
target.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in files:
        archive.write(path, path.relative_to(source).as_posix())
with zipfile.ZipFile(target) as archive:
    if archive.testzip() is not None:
        raise SystemExit('O arquivo ZIP falhou na verificação de integridade.')
print(f'{target} ({len(files)} arquivos)')
