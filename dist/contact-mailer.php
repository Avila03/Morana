<?php
declare(strict_types=1);

require_once __DIR__ . '/contact-handler.php';

const MORANA_SMTP_HOST = 'email-ssl.com.br';

function morana_smtp_private_directory(): string
{
    $public = @realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? __DIR__));
    $public = $public ?: (string) realpath(__DIR__);
    $parent = @realpath(dirname(__DIR__));
    if (!$parent) {
        throw new RuntimeException('O diretório privado não está disponível.');
    }
    $directory = $parent . '/.morana-private';
    $resolved = @realpath($directory) ?: $directory;
    if (is_link($directory) || $resolved === $public || strpos($resolved, rtrim($public, '/') . '/') === 0) {
        throw new RuntimeException('A configuração precisa ficar fora da pasta pública.');
    }
    return $directory;
}

function morana_smtp_config_valid(array $config): bool
{
    return ($config['version'] ?? null) === 1
        && ($config['host'] ?? '') === MORANA_SMTP_HOST
        && ($config['username'] ?? '') === MORANA_COMMERCIAL_EMAIL
        && in_array($config['port'] ?? null, [465, 587], true)
        && is_string($config['password'] ?? null) && $config['password'] !== ''
        && strlen($config['password']) <= 512 && preg_match('/[\r\n\x00]/', $config['password']) !== 1
        && preg_match('//u', $config['password']) === 1
        && is_string($config['setup_key_hash'] ?? null)
        && preg_match('/^[a-f0-9]{64}$/D', $config['setup_key_hash']) === 1;
}

function morana_smtp_load_config(?string $directory = null): ?array
{
    try {
        $directory = $directory ?? morana_smtp_private_directory();
        $file = $directory . '/smtp.json';
        if (is_link($directory) || !is_dir($directory) || is_link($file) || !is_file($file)) {
            return null;
        }
        $directoryMode = @fileperms($directory);
        $fileMode = @fileperms($file);
        if ($directoryMode === false || $fileMode === false || ($directoryMode & 0077) !== 0 || ($fileMode & 0077) !== 0) {
            return null;
        }
        $raw = @file_get_contents($file, false, null, 0, 4097);
        $config = is_string($raw) && strlen($raw) <= 4096 ? json_decode($raw, true) : null;
        return is_array($config) && morana_smtp_config_valid($config) ? $config : null;
    } catch (Throwable $error) {
        return null;
    }
}

function morana_smtp_supported(): bool
{
    return extension_loaded('openssl') && (function_exists('stream_socket_client') || function_exists('fsockopen'));
}

function morana_smtp_create_mailer(array $config): \PHPMailer\PHPMailer\PHPMailer
{
    require_once __DIR__ . '/vendor/phpmailer/Exception.php';
    require_once __DIR__ . '/vendor/phpmailer/SMTP.php';
    require_once __DIR__ . '/vendor/phpmailer/PHPMailer.php';
    if (!in_array($config['port'] ?? null, [465, 587], true)) {
        throw new RuntimeException('Porta SMTP inválida.');
    }
    $mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
    $mailer->isSMTP();
    $mailer->Host = MORANA_SMTP_HOST;
    $mailer->Port = $config['port'];
    $mailer->SMTPSecure = $config['port'] === 465
        ? \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
        : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $mailer->SMTPAuth = true;
    $mailer->Username = MORANA_COMMERCIAL_EMAIL;
    $mailer->Password = $config['password'];
    $mailer->SMTPAutoTLS = true;
    $mailer->SMTPDebug = 0;
    $mailer->Timeout = 8;
    $mailer->getSMTPInstance()->Timelimit = 12;
    $mailer->SMTPOptions = ['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'allow_self_signed' => false]];
    $mailer->CharSet = 'UTF-8';
    $mailer->Encoding = \PHPMailer\PHPMailer\PHPMailer::ENCODING_QUOTED_PRINTABLE;
    return $mailer;
}

function morana_smtp_send_message(array $email, array $config, ?callable $factory = null): bool
{
    $mailer = null;
    try {
        $mailer = $factory ? $factory($config) : morana_smtp_create_mailer($config);
        $mailer->setFrom(MORANA_COMMERCIAL_EMAIL, 'Morana');
        $mailer->Sender = MORANA_COMMERCIAL_EMAIL;
        $mailer->addAddress(MORANA_COMMERCIAL_EMAIL);
        $mailer->addReplyTo($email['reply_to']);
        $mailer->isHTML(false);
        $mailer->Subject = $email['subject'];
        $mailer->Body = $email['body'];
        return $mailer->send() === true;
    } catch (Throwable $error) {
        return false;
    } finally {
        if ($mailer) {
            $mailer->smtpClose();
        }
    }
}

function morana_contact_transport(): array
{
    $config = morana_smtp_load_config();
    $transport = $config !== null && morana_smtp_supported() ? 'smtp' : (function_exists('mail') ? 'mail' : null);
    return ['available' => $transport !== null, 'recipient' => MORANA_COMMERCIAL_EMAIL, 'transport' => $transport];
}

function morana_contact_send_mail(array $email): bool
{
    $config = morana_smtp_load_config();
    if ($config !== null) {
        return morana_smtp_supported() && morana_smtp_send_message($email, $config);
    }
    if (!function_exists('mail')) {
        return false;
    }
    $headers = implode("\n", [
        'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8',
        'From: Morana <' . MORANA_COMMERCIAL_EMAIL . '>',
        'Return-Path: ' . MORANA_COMMERCIAL_EMAIL, 'Reply-To: ' . $email['reply_to'],
    ]);
    return @mail(MORANA_COMMERCIAL_EMAIL, $email['subject'], $email['body'], $headers, '-r' . MORANA_COMMERCIAL_EMAIL);
}

function morana_setup_key_valid(string $code, array $settings, ?array $config, ?int $now = null): bool
{
    $fingerprint = (string) ($settings['hash'] ?? '');
    return preg_match('/^[a-f0-9]{40}$/D', $code) === 1
        && preg_match('/^[a-f0-9]{64}$/D', $fingerprint) === 1
        && (int) ($settings['expires'] ?? 0) > ($now ?? time())
        && ($config['setup_key_hash'] ?? '') !== $fingerprint
        && hash_equals($fingerprint, hash('sha256', $code));
}

function morana_smtp_write_config(string $directory, array $config): void
{
    $permissions = @fileperms($directory);
    if (!morana_smtp_config_valid($config) || is_link($directory) || !is_dir($directory)
        || $permissions === false || ($permissions & 0077) !== 0 || is_link($directory . '/smtp.json')) {
        throw new RuntimeException('Configuração inválida.');
    }
    $encoded = json_encode($config, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $temporary = $directory . '/.smtp-' . bin2hex(random_bytes(16));
    $mask = umask(0077);
    try {
        $file = @fopen($temporary, 'x');
    } finally {
        umask($mask);
    }
    if ($file === false) {
        throw new RuntimeException('Não foi possível salvar a configuração privada.');
    }
    try {
        if (fwrite($file, $encoded) !== strlen($encoded) || !fflush($file)) {
            throw new RuntimeException('Não foi possível salvar a configuração privada.');
        }
    } finally {
        fclose($file);
    }
    try {
        if (!rename($temporary, $directory . '/smtp.json')) {
            throw new RuntimeException('Não foi possível salvar a configuração privada.');
        }
        clearstatcache(true, $directory . '/smtp.json');
        if (morana_smtp_load_config($directory) === null) {
            throw new RuntimeException('A configuração precisa ter permissões privadas.');
        }
    } finally {
        if (is_file($temporary)) {
            @unlink($temporary);
        }
    }
}

/** O código é verificado antes de qualquer conexão SMTP; diagnóstico nunca autentica ou envia e-mail. */
function morana_setup_handle(array $data, array $server, array $settings, string $directory, ?callable $factory = null): array
{
    if (($server['REQUEST_METHOD'] ?? '') !== 'POST' || !morana_contact_origin_allowed($server)
        || strpos((string) ($server['HTTP_ORIGIN'] ?? ''), 'https://') !== 0) {
        return morana_contact_result(403, 'Abra a configuração pelo endereço HTTPS da Morana.');
    }
    if ((int) ($server['CONTENT_LENGTH'] ?? 0) > 4096) {
        return morana_contact_result(413, 'Confira os campos e tente novamente.');
    }
    $code = is_string($data['code'] ?? null) ? trim($data['code']) : '';
    $config = morana_smtp_load_config($directory);
    if (!morana_setup_key_valid($code, $settings, $config)) {
        return morana_contact_result(403, 'O código está incorreto, expirou ou já foi utilizado.');
    }
    $action = $data['action'] ?? '';
    if ($action === 'diagnostico') {
        $ports = [];
        foreach ([465, 587] as $port) {
            $mailer = null;
            try {
                $probe = ['port' => $port, 'password' => ''];
                $mailer = $factory ? $factory($probe) : morana_smtp_create_mailer($probe);
                $mailer->SMTPAuth = false;
                $mailer->Username = '';
                $mailer->Password = '';
                $ports[$port] = $mailer->smtpConnect() === true;
            } catch (Throwable $error) {
                $ports[$port] = false;
            } finally {
                if ($mailer) {
                    $mailer->smtpClose();
                }
            }
        }
        return morana_contact_result(200, 'Diagnóstico concluído sem autenticar ou enviar mensagens.', ['smtp_tls' => $ports]);
    }
    $password = $data['password'] ?? null;
    $port = (string) ($data['port'] ?? '465');
    if ($action !== 'salvar' || !is_string($password) || $password === '' || strlen($password) > 512
        || preg_match('/[\r\n\x00]/', $password) || preg_match('//u', $password) !== 1 || !in_array($port, ['465', '587'], true)) {
        return morana_contact_result(422, 'Informe a senha da caixa comercial e confira os campos.');
    }
    $limit = morana_contact_rate_limit(sys_get_temp_dir() . '/morana-setup-' . substr(hash('sha256', $directory), 0, 20),
        (string) ($server['REMOTE_ADDR'] ?? 'unknown'), time());
    if (isset($limit['error']) || empty($limit['allowed'])) {
        return morana_contact_result(429, 'Aguarde alguns minutos antes de tentar novamente.');
    }
    if (is_link($directory) || (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory))
        || (@fileperms($directory) & 0077) !== 0 || is_link($directory . '/setup.lock')) {
        return morana_contact_result(503, 'A hospedagem precisa permitir a gravação da configuração fora da pasta pública.');
    }
    $mask = umask(0077);
    try {
        $lock = @fopen($directory . '/setup.lock', 'c');
    } finally {
        umask($mask);
    }
    if ($lock === false || !flock($lock, LOCK_EX)) {
        if (is_resource($lock)) {
            fclose($lock);
        }
        return morana_contact_result(503, 'Não foi possível salvar a configuração agora.');
    }
    $mailer = null;
    try {
        if (!morana_setup_key_valid($code, $settings, morana_smtp_load_config($directory))) {
            return morana_contact_result(403, 'Esse código já foi utilizado.');
        }
        $config = ['version' => 1, 'host' => MORANA_SMTP_HOST, 'port' => (int) $port,
            'username' => MORANA_COMMERCIAL_EMAIL, 'password' => $password, 'setup_key_hash' => $settings['hash']];
        $mailer = $factory ? $factory($config) : morana_smtp_create_mailer($config);
        if ($mailer->smtpConnect() !== true) {
            throw new RuntimeException('Autenticação não confirmada.');
        }
        morana_smtp_write_config($directory, $config);
        return morana_contact_result(200, 'Configuração salva. Abra o site, envie uma mensagem de teste e confira o recebimento no e-mail comercial.');
    } catch (Throwable $error) {
        return morana_contact_result(422, 'Não foi possível conectar e autenticar a caixa comercial. Confira a senha do webmail e tente novamente.');
    } finally {
        if ($mailer) {
            $mailer->smtpClose();
        }
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}
