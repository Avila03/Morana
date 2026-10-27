"""Gera um código de ativação local; somente seu SHA-256 é salvo no projeto."""
from datetime import datetime, timezone
import hashlib
from pathlib import Path
import secrets
import time

code = secrets.token_hex(20)
expires = int(time.time()) + 86400
fingerprint = hashlib.sha256(code.encode()).hexdigest()
target = Path(__file__).resolve().parents[1] / 'dist/contact-setup-key.php'
target.write_text("<?php\n// Somente a impressão digital do código de uso único; nenhuma senha é versionada.\n"
                  "return ['hash' => '" + fingerprint + "', 'expires' => " + str(expires) + "];\n")
print('Código de uso único: ' + code)
print('Expira em: ' + datetime.fromtimestamp(expires, timezone.utc).isoformat())
print('Publique contact-setup-key.php. Guarde o código em um canal privado; não execute este gerador em logs públicos.')
