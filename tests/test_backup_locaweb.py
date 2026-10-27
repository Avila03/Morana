"""Verifica o backup com FTP em memória, sem credenciais nem conexão externa."""
import ftplib
import importlib.util
import io
import json
from pathlib import Path, PurePosixPath
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('backup_locaweb', Path(__file__).resolve().parents[1] / 'scripts/backup_locaweb.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class MemoryFTP:
    def __init__(self):
        self.current = '/'
        self.directories = {'/', '/public_html', '/public_html/assets'}
        self.files = {'/public_html/index.html': b'pagina anterior', '/public_html/.htaccess': b'regras anteriores',
                      '/public_html/index.php': b'wordpress anterior', '/public_html/assets/logo.png': b'logo antigo',
                      '/public_html/wp-config.php': b'configuracao que nao deve ser lida'}
        self.permissions = []
        self.fail_read = False

    def path(self, value):
        return str(PurePosixPath(value) if value.startswith('/') else PurePosixPath(self.current) / value)

    def pwd(self):
        return self.current

    def cwd(self, path):
        path = self.path(path)
        if path not in self.directories:
            raise ftplib.error_perm('550 pasta ausente')
        self.current = path

    def mlsd(self, facts):
        for path in sorted(self.files):
            if str(PurePosixPath(path).parent) == self.current:
                yield PurePosixPath(path).name, {'type': 'file'}
        for path in sorted(self.directories - {'/'}):
            if str(PurePosixPath(path).parent) == self.current:
                yield PurePosixPath(path).name, {'type': 'dir'}

    def mkd(self, path):
        path = self.path(path)
        if path in self.directories:
            raise ftplib.error_perm('550 pasta existente')
        self.directories.add(path)

    def retrbinary(self, command, callback):
        if self.fail_read:
            raise ftplib.error_perm('550 leitura negada')
        callback(self.files[self.path(command.removeprefix('RETR '))])

    def sendcmd(self, command):
        self.permissions.append(command)

    def storbinary(self, command, stream):
        path = self.path(command.removeprefix('STOR '))
        if not path.startswith('/_morana_backups/'):
            raise AssertionError('O backup não pode sobrescrever arquivos públicos.')
        self.files[path] = stream.read()

    def size(self, name):
        return len(self.files[self.path(name)])


class BackupTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='morana-backup-test-')
        self.addCleanup(self.temporary.cleanup)
        self.source = Path(self.temporary.name)
        (self.source / 'assets').mkdir()
        for path in ['index.html', '.htaccess', 'app.js', 'assets/logo.png']:
            (self.source / path).write_text('arquivo novo')

    def test_preserves_originals_outside_public_root(self):
        ftp = MemoryFTP()
        before = dict(ftp.files)
        location, count = module.backup_previous_site(ftp, self.source, '95769aa7b9985b315d2190d91feedf6472a74633')
        self.assertEqual(count, 4)
        self.assertEqual(ftp.pwd(), '/')
        for path, content in before.items():
            self.assertEqual(ftp.files[path], content)
        with zipfile.ZipFile(io.BytesIO(ftp.files['/' + location])) as archive:
            self.assertEqual(archive.read('files/.htaccess'), b'regras anteriores')
            self.assertEqual(archive.read('files/index.html'), b'pagina anterior')
            self.assertEqual(archive.read('files/index.php'), b'wordpress anterior')
            self.assertEqual(archive.read('files/assets/logo.png'), b'logo antigo')
            self.assertNotIn('files/wp-config.php', archive.namelist())
            self.assertEqual(json.loads(archive.read('manifest.json'))['previously_absent'], ['app.js'])
        self.assertIn('SITE CHMOD 700 /_morana_backups', ftp.permissions)
        self.assertTrue(any(command.startswith('SITE CHMOD 600 ') for command in ftp.permissions))

    def test_read_failure_does_not_publish_or_create_backup(self):
        ftp = MemoryFTP()
        ftp.fail_read = True
        before = dict(ftp.files)
        with self.assertRaises(ftplib.error_perm):
            module.backup_previous_site(ftp, self.source, '95769aa7')
        self.assertEqual(ftp.files, before)
        self.assertEqual(ftp.pwd(), '/')

    def test_rejects_incomplete_package_before_remote_changes(self):
        ftp = MemoryFTP()
        (self.source / '.htaccess').unlink()
        before = dict(ftp.files)
        with self.assertRaises(ValueError):
            module.backup_previous_site(ftp, self.source, '95769aa7')
        self.assertEqual(ftp.files, before)

    def test_rejects_symlinks_before_remote_changes(self):
        ftp = MemoryFTP()
        (self.source / 'linked').symlink_to(self.source / 'index.html')
        with self.assertRaises(ValueError):
            module.backup_previous_site(ftp, self.source, '95769aa7')
        self.assertNotIn('/_morana_backups', ftp.directories)


if __name__ == '__main__':
    unittest.main()
