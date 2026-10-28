<?php
declare(strict_types=1);
require_once __DIR__ . '/../dist/contact-mailer.php';
require_once __DIR__ . '/../dist/vendor/phpmailer/Exception.php';
require_once __DIR__ . '/../dist/vendor/phpmailer/SMTP.php';
require_once __DIR__ . '/../dist/vendor/phpmailer/PHPMailer.php';

final class MoranaFakeMailer extends \PHPMailer\PHPMailer\PHPMailer
{
    public bool $connectAccepted = true;
    public bool $sendAccepted = true;
    public int $connections = 0;
    public int $messages = 0;
    public bool $closed = false;
    public function smtpConnect($options = null)
    {
        $this->connections++;
        return $this->connectAccepted;
    }
    public function send()
    {
        $this->messages++;
        $this->preSend();
        return $this->sendAccepted;
    }
    public function smtpClose()
    {
        $this->closed = true;
    }
}

$checks = 0;
function check(bool $condition, string $label): void
{
    global $checks;
    if (!$condition) {
        throw new RuntimeException('FAIL: ' . $label);
    }
    $checks++;
    echo 'PASS: ' . $label . "\n";
}
function remove_directory(string $directory): void
{
    if (!is_dir($directory)) {
        return;
    }
    foreach (new DirectoryIterator($directory) as $file) {
        if (!$file->isDot()) {
            $file->isDir() && !$file->isLink() ? remove_directory($file->getPathname()) : unlink($file->getPathname());
        }
    }
    rmdir($directory);
}

$temporary = sys_get_temp_dir() . '/morana-mailer-test-' . bin2hex(random_bytes(12));
mkdir($temporary, 0700);
$code = str_repeat('a', 40);
$settings = ['hash' => hash('sha256', $code), 'expires' => time() + 600];
$config = ['version' => 1, 'host' => MORANA_SMTP_HOST, 'port' => 465,
    'username' => MORANA_COMMERCIAL_EMAIL, 'password' => 'Senha fictícia de teste! " \\ ', 'setup_key_hash' => $settings['hash']];
$server = ['REQUEST_METHOD' => 'POST', 'HTTP_HOST' => 'moranaservicos.com.br',
    'HTTP_ORIGIN' => 'https://moranaservicos.com.br', 'CONTENT_LENGTH' => '200', 'REMOTE_ADDR' => '192.0.2.110'];
try {
    check(morana_smtp_load_config($temporary . '/absent') === null, 'missing credentials do not activate SMTP');
    check(morana_setup_key_valid($code, $settings, null), 'accepts the unexpired owner code');
    check(!morana_setup_key_valid(str_repeat('b', 40), $settings, null), 'rejects an incorrect owner code');
    check(!morana_setup_key_valid($code, ['hash' => $settings['hash'], 'expires' => 1], null), 'rejects an expired owner code');
    check(!morana_setup_key_valid($code, $settings, $config), 'consumed owner codes cannot be reused');
    check(!morana_smtp_config_valid(array_merge($config, ['host' => 'other.example'])), 'SMTP credentials cannot be directed to another host');
    check(!morana_smtp_config_valid(array_merge($config, ['port' => 25])), 'rejects an unencrypted SMTP port');
    check(!morana_smtp_config_valid(array_merge($config, ['username' => 'other@example.com'])), 'sender account stays fixed');

    $mailer = morana_smtp_create_mailer($config);
    check($mailer->Host === MORANA_SMTP_HOST && $mailer->Port === 465 && $mailer->SMTPSecure === 'ssl'
        && $mailer->SMTPAuth && $mailer->SMTPDebug === 0, 'SMTP uses authenticated TLS without credential logging');
    check($mailer->SMTPOptions['ssl'] === ['verify_peer' => true, 'verify_peer_name' => true, 'allow_self_signed' => false], 'TLS certificates are always verified');
    $starttls = morana_smtp_create_mailer(array_merge($config, ['port' => 587]));
    check($starttls->SMTPSecure === 'tls', 'alternative port requires STARTTLS');

    $fake = new MoranaFakeMailer(true);
    $fake->CharSet = 'UTF-8';
    $email = ['to' => 'ignored@example.com', 'from' => 'ignored@example.com', 'reply_to' => 'visitante@example.com',
        'subject' => 'Contato pelo site | Morana', 'body' => "Nome: João\nInteresse: Gestão financeira\nMensagem com acentuação."];
    check(morana_smtp_send_message($email, $config, static function () use ($fake) { return $fake; }), 'accepted SMTP submission is reported as accepted');
    check($fake->getToAddresses()[0][0] === MORANA_COMMERCIAL_EMAIL && $fake->From === MORANA_COMMERCIAL_EMAIL
        && $fake->Sender === MORANA_COMMERCIAL_EMAIL, 'recipient, From and envelope stay with the commercial account');
    check(array_values($fake->getReplyToAddresses())[0][0] === 'visitante@example.com'
        && strpos($fake->Body, 'João') !== false && $fake->ContentType === 'text/plain', 'Reply-To and Portuguese text are preserved');
    check($fake->closed && $fake->messages === 1, 'SMTP session closes after one message');
    $fake->sendAccepted = false;
    check(!morana_smtp_send_message($email, $config, static function () use ($fake) { return $fake; }), 'rejected SMTP submission never reports success');

    $receipt = new MoranaFakeMailer(true);
    $receipt->CharSet = 'UTF-8';
    check(morana_smtp_send_receipt('visitante@example.com', $config, static function () use ($receipt) { return $receipt; }), 'SMTP confirmation reaches the validated visitor');
    check($receipt->getToAddresses()[0][0] === 'visitante@example.com' && $receipt->From === MORANA_COMMERCIAL_EMAIL
        && $receipt->Sender === MORANA_COMMERCIAL_EMAIL && array_values($receipt->getReplyToAddresses())[0][0] === MORANA_COMMERCIAL_EMAIL,
        'confirmation sender, envelope and replies stay with Morana');
    check(strpos($receipt->Body, 'Recebemos sua solicitação') !== false && strpos($receipt->Body, 'João') === false
        && strpos($receipt->Body, 'Mensagem com acentuação') === false, 'confirmation has fixed text without reflecting submitted content');
    check(strpos($receipt->getSentMIMEMessage(), 'Auto-Submitted: auto-replied') !== false, 'automatic replies are marked to avoid reply loops');
    $neverReceipt = static function () { throw new RuntimeException('Transport must not be reached.'); };
    check(!morana_smtp_send_receipt("visitante@example.com\r\nBcc: other@example.com", $config, $neverReceipt)
        && !morana_smtp_send_receipt('invalid', $config, $neverReceipt), 'invalid confirmation recipients never reach SMTP');

    $never = static function () { throw new RuntimeException('Transport must not be reached.'); };
    $data = ['action' => 'salvar', 'code' => $code, 'password' => $config['password'], 'port' => '465'];
    $result = morana_setup_handle(array_merge($data, ['code' => 'wrong']), $server, $settings, $temporary . '/wrong', $never);
    check($result['status'] === 403 && !is_dir($temporary . '/wrong'), 'invalid codes cannot connect or write configuration');
    $result = morana_setup_handle($data, array_merge($server, ['HTTP_ORIGIN' => 'https://other.example']), $settings, $temporary . '/cross', $never);
    check($result['status'] === 403, 'setup rejects cross-origin requests');
    $result = morana_setup_handle($data, array_merge($server, ['HTTP_ORIGIN' => 'http://moranaservicos.com.br']), $settings, $temporary . '/http', $never);
    check($result['status'] === 403, 'setup requires HTTPS origin');
    $result = morana_setup_handle($data, array_merge($server, ['HTTP_ORIGIN' => 'null']), $settings, $temporary . '/null-origin', $never);
    check($result['status'] === 403, 'opaque form origins are rejected before credentials are used');
    $result = morana_setup_handle($data, array_diff_key($server, ['HTTP_ORIGIN' => true]), $settings, $temporary . '/missing-origin', $never);
    check($result['status'] === 403, 'missing form origins are rejected before credentials are used');

    $probes = [];
    $probeFactory = static function ($options) use (&$probes) { $probe = new MoranaFakeMailer(true); $probes[] = $probe; return $probe; };
    $result = morana_setup_handle(['action' => 'diagnostico', 'code' => $code], $server, $settings, $temporary . '/probe', $probeFactory);
    check($result['status'] === 200 && count($probes) === 2 && !is_file($temporary . '/probe/smtp.json'), 'diagnostic checks TLS ports without storing credentials');
    check($result['body']['private_storage'] && count(scandir($temporary . '/probe')) === 2, 'private storage probe removes its temporary file');
    foreach ($probes as $probe) {
        check(!$probe->SMTPAuth && $probe->Password === '' && $probe->messages === 0 && $probe->closed, 'diagnostic never authenticates or sends mail');
    }

    $auth = new MoranaFakeMailer(true);
    $auth->connectAccepted = false;
    $failedDirectory = $temporary . '/rejected';
    $result = morana_setup_handle($data, $server, $settings, $failedDirectory, static function () use ($auth) { return $auth; });
    check($result['status'] === 422 && !is_file($failedDirectory . '/smtp.json'), 'failed authentication does not save a password');

    $auth = new MoranaFakeMailer(true);
    $directory = $temporary . '/private';
    $result = morana_setup_handle($data, $server, $settings, $directory, static function () use ($auth) { return $auth; });
    check($result['status'] === 200 && morana_smtp_load_config($directory)['password'] === $config['password'], 'successful authentication saves credentials outside the public package');
    check((fileperms($directory) & 0777) === 0700 && (fileperms($directory . '/smtp.json') & 0777) === 0600, 'private directory and credential file have restricted permissions');
    check($auth->messages === 0, 'configuration authentication does not send an email');
    check(strpos(json_encode($result), $config['password']) === false, 'setup responses never echo the mailbox password');
    $result = morana_setup_handle($data, $server, $settings, $directory, $never);
    check($result['status'] === 403, 'setup code is locked after successful use');
    chmod($directory . '/smtp.json', 0644);
    clearstatcache(true, $directory . '/smtp.json');
    check(morana_smtp_load_config($directory) === null, 'publicly readable credential files are rejected');
    chmod($directory . '/smtp.json', 0600);
    $link = $temporary . '/link';
    symlink($directory, $link);
    check(morana_smtp_load_config($link) === null, 'symlinks cannot substitute the private credential directory');
    unlink($link);
} finally {
    foreach ([$temporary . '/rejected', $temporary . '/private'] as $directory) {
        remove_directory(sys_get_temp_dir() . '/morana-setup-' . substr(hash('sha256', $directory), 0, 20));
    }
    remove_directory($temporary);
}
echo $checks . " SMTP/setup checks passed. No real e-mail was sent.\n";
