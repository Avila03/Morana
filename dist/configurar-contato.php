<?php
declare(strict_types=1);

ini_set('display_errors', '0');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; font-src 'self'; form-action https://moranaservicos.com.br; base-uri 'none'; frame-ancestors 'none'");

require_once __DIR__ . '/contact-mailer.php';
$settings = require __DIR__ . '/contact-setup-key.php';
$result = null;
$config = null;
$directory = null;
try {
    $directory = morana_smtp_private_directory();
    $config = morana_smtp_load_config($directory);
} catch (Throwable $error) {
    $result = morana_contact_result(503, 'A hospedagem precisa permitir uma pasta privada de configuração fora da área pública.');
}
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'POST' && $directory !== null) {
    $type = strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
    $result = $type === 'application/x-www-form-urlencoded'
        ? morana_setup_handle($_POST, $_SERVER, $settings, $directory)
        : morana_contact_result(415, 'Utilize o formulário de configuração.');
    $config = morana_smtp_load_config($directory);
} elseif (!in_array($method, ['GET', 'HEAD', 'POST'], true)) {
    header('Allow: GET, HEAD, POST');
    $result = morana_contact_result(405, 'Utilize o formulário de configuração.');
}
if (strpos((string) ($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json') !== false) {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code($result['status'] ?? 405);
    echo json_encode($result['body'] ?? ['ok' => false, 'message' => 'Utilize o formulário de configuração.'], JSON_UNESCAPED_UNICODE);
    exit;
}
header('Content-Type: text/html; charset=UTF-8');
http_response_code($result['status'] ?? 200);
if ($method === 'HEAD') {
    exit;
}
$locked = ($config['setup_key_hash'] ?? '') === ($settings['hash'] ?? '');
$expired = (int) ($settings['expires'] ?? 0) <= time();
function morana_setup_escape(string $text): string { return htmlspecialchars($text, ENT_QUOTES, 'UTF-8'); }
?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Ativar formulário | Morana</title>
  <style>
    @font-face{font-family:Montserrat;src:url('assets/montserrat-400.ttf') format('truetype');font-weight:400;font-display:swap}
    *{box-sizing:border-box}body{margin:0;background:#f3f5f3;color:#29383e;font:15px/1.7 Montserrat,Arial,sans-serif;padding:48px 20px}main{max-width:580px;margin:auto;background:white;padding:40px;border-top:5px solid #516d79}.brand{font-size:18px;letter-spacing:7px;margin:0 0 30px}.eyebrow{color:#516d79;font-size:11px;letter-spacing:2px}h1{font-size:31px;line-height:1.25;font-weight:400;margin:14px 0 20px}p{margin:16px 0}label{display:block;margin:24px 0 6px}input{font:inherit;width:100%;border:1px solid #cbd2d3;border-radius:0;padding:13px;background:#fff;color:#29383e}input:focus{outline:2px solid #516d79;outline-offset:3px}input[readonly]{background:#f3f5f3}small{display:block;color:#516d79;font-size:12px;margin-top:6px}button,.button{display:block;width:100%;background:#29383e;color:white;border:0;padding:17px;font:inherit;text-decoration:none;text-align:center;margin-top:28px;cursor:pointer}a{color:#29383e}.notice{padding:18px;background:#edf2f2;border-left:3px solid #516d79}.error{border-color:#a04c3e}.foot{font-size:12px;color:#516d79;margin-top:25px}@media(max-width:520px){body{padding:22px 12px}main{padding:25px 22px}h1{font-size:27px}}
  </style>
</head>
<body><main>
  <p class="brand">MORANA</p>
  <p class="eyebrow">CONFIGURAÇÃO DO CONTATO</p>
  <h1><?= $locked ? 'Seu formulário está configurado.' : 'Ative o envio de mensagens.' ?></h1>
  <?php if ($result !== null): ?>
    <p class="notice <?= empty($result['body']['ok']) ? 'error' : '' ?>" role="status"><?= morana_setup_escape($result['body']['message']) ?></p>
  <?php endif; ?>
  <?php if ($locked): ?>
    <p>A configuração desta caixa postal foi salva. Abra o formulário do site para enviar um teste e confirme o recebimento no e-mail comercial.</p>
    <a class="button" href="https://moranaservicos.com.br/">Abrir o site</a>
  <?php elseif ($expired): ?>
    <p class="notice">O código de configuração expirou. Solicite um novo código para continuar.</p>
  <?php elseif ($directory !== null): ?>
    <p>Configure a caixa comercial para receber os contatos enviados pelo site.</p>
    <form action="https://moranaservicos.com.br/configurar-contato.php" method="post" autocomplete="off">
      <input type="hidden" name="action" value="salvar">
      <input type="hidden" name="port" value="465">
      <label for="code">Código de configuração</label>
      <input id="code" name="code" type="password" required maxlength="80" autocomplete="off" spellcheck="false">
      <small>Use o código de uso único fornecido para esta configuração.</small>
      <label for="account">Conta de envio</label>
      <input id="account" type="email" value="comercial@moranaservicos.com.br" readonly autocomplete="username">
      <label for="password">Senha do e-mail comercial</label>
      <input id="password" name="password" type="password" required maxlength="512" autocomplete="current-password">
      <small>É a senha usada para acessar essa caixa postal no webmail da Locaweb.</small>
      <button type="submit">Salvar e ativar formulário</button>
    </form>
    <p class="foot">A senha é enviada por HTTPS e guardada em uma pasta privada do servidor. O código só pode ser utilizado uma vez. Salvar a configuração verifica a conexão com a caixa postal, sem enviar mensagens.</p>
  <?php endif; ?>
</main></body></html>
