"""Guarda os arquivos que o deploy substituirá em um ZIP privado, fora de public_html."""
import argparse
from datetime import datetime, timezone
import ftplib
import json
import os
from pathlib import Path, PurePosixPath
import re
import ssl
import tempfile
import uuid
import zipfile


def backup_previous_site(ftp, source, revision):
    if not re.fullmatch(r'[a-f0-9]{7,40}', revision):
        raise ValueError('Revisão inválida para o backup.')
    planned = []
    for path in sorted(source.rglob('*')):
        if path.is_symlink():
            raise ValueError('O pacote não pode conter links simbólicos.')
        if path.is_file():
            relative = path.relative_to(source).as_posix()
            if any(part.startswith(('.env', 'qa-')) for part in PurePosixPath(relative).parts):
                raise ValueError('O pacote contém um arquivo inesperado.')
            if '\r' in relative or '\n' in relative:
                raise ValueError('Nome de arquivo inválido.')
            planned.append(relative)
    if not planned or 'index.html' not in planned or '.htaccess' not in planned:
        raise ValueError('Pacote incompleto: faltam os arquivos da página inicial.')

    home = ftp.pwd()
    ftp.cwd('public_html')
    public_root = ftp.pwd()
    listing_cache = {'': dict(ftp.mlsd(facts=['type']))}

    def listing(parent):
        if parent in listing_cache:
            return listing_cache[parent]
        path = PurePosixPath(parent)
        ancestors = listing('' if str(path.parent) == '.' else str(path.parent))
        entry = ancestors.get(path.name)
        if entry is None:
            listing_cache[parent] = {}
        elif entry.get('type') != 'dir':
            raise ValueError('Um diretório do destino não é uma pasta comum: ' + parent)
        else:
            ftp.cwd(public_root + '/' + parent)
            listing_cache[parent] = dict(ftp.mlsd(facts=['type']))
        return listing_cache[parent]

    # O index.php anterior é guardado como referência; não é sobrescrito pelo deploy.
    candidates = sorted(set(planned + ['index.php']))
    present, absent = [], []
    filename = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + revision[:12] + '-' + uuid.uuid4().hex[:8] + '.zip'
    backup_dir = '_morana_backups'
    try:
        with tempfile.TemporaryDirectory(prefix='morana-backup-') as temporary:
            archive_path = Path(temporary) / filename
            with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as archive:
                for name in candidates:
                    parent = str(PurePosixPath(name).parent)
                    entry = listing('' if parent == '.' else parent).get(PurePosixPath(name).name)
                    if entry is None:
                        absent.append(name)
                        continue
                    if entry.get('type') != 'file':
                        raise ValueError('Um arquivo do destino não é um arquivo comum: ' + name)
                    with archive.open('files/' + name, 'w') as original:
                        ftp.retrbinary('RETR ' + public_root + '/' + name, original.write)
                    present.append(name)
                archive.writestr('manifest.json', json.dumps({
                    'project': 'Avila03/Morana', 'target': 'public_html/', 'revision': revision,
                    'saved_files': present, 'previously_absent': absent,
                    'scope': 'Arquivos que serão substituídos; index.php anterior incluído. Banco e demais arquivos não são alterados.',
                }, ensure_ascii=False, indent=2))
            with zipfile.ZipFile(archive_path) as archive:
                if archive.testzip() is not None:
                    raise ValueError('O ZIP do backup está corrompido.')
            ftp.cwd(home)
            try:
                ftp.mkd(backup_dir)
            except ftplib.error_perm:
                # Se já existir, cwd confirma que o diretório é acessível.
                pass
            ftp.cwd(backup_dir)
            backup_root = ftp.pwd()
            if backup_root == public_root or backup_root.startswith(public_root.rstrip('/') + '/'):
                raise ValueError('O backup precisa ficar fora de public_html.')
            ftp.sendcmd('SITE CHMOD 700 ' + backup_root)
            with archive_path.open('rb') as backup:
                ftp.storbinary('STOR ' + filename, backup)
            ftp.sendcmd('SITE CHMOD 600 ' + filename)
            if ftp.size(filename) != archive_path.stat().st_size:
                raise ValueError('O tamanho do backup remoto não corresponde ao ZIP local.')
        return backup_dir + '/' + filename, len(present)
    finally:
        ftp.cwd(home)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--revision', required=True)
    args = parser.parse_args()
    names = ('LOCAWEB_FTP_HOST', 'LOCAWEB_FTP_USER', 'LOCAWEB_FTP_PASSWORD')
    if any(not os.environ.get(name) for name in names):
        parser.error('Cadastre os três Secrets FTP no GitHub.')
    source = Path(__file__).resolve().parents[1] / 'dist'
    try:
        with ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=60) as ftp:
            ftp.connect(os.environ['LOCAWEB_FTP_HOST'], 21)
            ftp.login(os.environ['LOCAWEB_FTP_USER'], os.environ['LOCAWEB_FTP_PASSWORD'])
            ftp.prot_p()
            location, count = backup_previous_site(ftp, source, args.revision)
    except ssl.SSLCertVerificationError:
        raise SystemExit('O certificado FTPS não foi validado. Confirme com a Locaweb o hostname FTPS correto. Nenhum arquivo do site foi substituído.') from None
    except ftplib.error_perm as error:
        code = str(error)[:3] if re.match(r'^\d{3}', str(error)) else 'não informado'
        raise SystemExit('O FTP recusou uma operação do backup (código ' + code + '). Confira as credenciais e as permissões. Nenhum arquivo do site foi substituído.') from None
    except Exception:
        # Respostas arbitrárias do servidor não devem revelar credenciais nos logs públicos.
        raise SystemExit('Backup não concluído. O envio foi interrompido antes de substituir arquivos. Confira a conexão FTPS e o acesso à pasta public_html e a _morana_backups.') from None
    print(f'Backup privado guardado: {location} ({count} arquivos anteriores).')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
            summary.write(f'Backup dos arquivos anteriores, acessível pelo FTP: `{location}`.\n\n')


if __name__ == '__main__':
    main()
