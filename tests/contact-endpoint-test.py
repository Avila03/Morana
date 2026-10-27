"""Exercita o endpoint PHP com sendmail local falso; não transmite e-mails."""
from pathlib import Path
import json
import os
import subprocess
import sys
import tempfile

php = sys.argv[1] if len(sys.argv) > 1 else 'php'
root = Path(__file__).resolve().parents[1]
code = r'''
$input = json_decode(stream_get_contents(STDIN), true);
$_SERVER = $input['server'];
$_POST = $input['post'];
register_shutdown_function(static function () {fwrite(STDERR, 'HTTP_STATUS:' . http_response_code());});
require 'dist/contato.php';
'''
fields = dict(nome='Pessoa de teste', empresa='Empresa exemplo', email='contato@example.com',
              interesse='Gestão financeira', desafio='Quero organizar a gestão.', website='')
server = dict(REQUEST_METHOD='POST', HTTP_HOST='moranaservicos.com.br',
              HTTP_ORIGIN='https://moranaservicos.com.br', REMOTE_ADDR='192.0.2.123',
              CONTENT_TYPE='application/x-www-form-urlencoded', CONTENT_LENGTH='300')

with tempfile.TemporaryDirectory(prefix='morana-endpoint-test-') as temp:
    temporary = Path(temp)
    fake = temporary / 'sendmail'
    fake.write_text('#!/bin/sh\nprintf "%s\\n" "$@" > "$MORANA_TEST_ARGS_FILE"\ncat > "$MORANA_TEST_MESSAGE_FILE"\nexit "${MORANA_TEST_MAIL_EXIT:-0}"\n')
    fake.chmod(0o700)
    mail_file = temporary / 'message.txt'
    args_file = temporary / 'args.txt'
    environment = dict(os.environ, MORANA_TEST_MESSAGE_FILE=str(mail_file), MORANA_TEST_ARGS_FILE=str(args_file))

    def request(settings, post=None, mail_exit='0', disable_mail=False):
        arguments = [php, '-n', '-d', f'sys_temp_dir={temporary}', '-d', f'sendmail_path={fake}']
        if disable_mail:
            arguments += ['-d', 'disable_functions=mail']
        result = subprocess.run(arguments + ['-r', code], input=json.dumps({'server': settings, 'post': post or {}}),
                                text=True, cwd=root, capture_output=True, check=True,
                                env=dict(environment, MORANA_TEST_MAIL_EXIT=mail_exit), timeout=10)
        status = int(result.stderr.split('HTTP_STATUS:')[-1])
        return status, json.loads(result.stdout) if result.stdout else None

    status, data = request(dict(server, REQUEST_METHOD='GET'))
    assert status == 200 and data['available'] and data['recipient'] == 'comercial@moranaservicos.com.br'
    assert not mail_file.exists()
    status, data = request(dict(server, REQUEST_METHOD='GET'), disable_mail=True)
    assert status == 200 and data['available'] is False
    status, data = request(dict(server, REQUEST_METHOD='HEAD'))
    assert status == 200 and data is None
    status, data = request(dict(server, REQUEST_METHOD='DELETE'))
    assert status == 405 and data['ok'] is False
    status, data = request(dict(server, CONTENT_TYPE='application/json'), fields)
    assert status == 415 and not mail_file.exists()
    status, data = request(server, dict(fields, email='invalid'))
    assert status == 422 and not mail_file.exists()
    status, data = request(dict(server, HTTP_ORIGIN='https://other.example'), fields)
    assert status == 403 and not mail_file.exists()

    status, data = request(server, fields)
    assert status == 200 and data['ok'] is True
    message = mail_file.read_text()
    assert 'To: comercial@moranaservicos.com.br' in message
    assert 'From: Morana <comercial@moranaservicos.com.br>' in message
    assert 'Return-Path: comercial@moranaservicos.com.br' in message
    assert 'Reply-To: contato@example.com' in message
    assert 'Content-Type: text/plain; charset=UTF-8' in message
    assert 'Quero organizar a gestão.' in message
    assert '-rcomercial@moranaservicos.com.br' in args_file.read_text()

    status, data = request(server, fields, mail_exit='1')
    assert status == 503 and data['ok'] is False
    status, data = request(server, fields, disable_mail=True)
    assert status == 503 and data['ok'] is False

print('Endpoint: GET, HEAD, methods, invalid input, origin, envelope/headers, acceptance and failures verified.')
print('Every mail operation was captured by a local fake sendmail. No real e-mail was sent.')
