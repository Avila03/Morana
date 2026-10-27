<?php
declare(strict_types=1);

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/contact-handler.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET' || $method === 'HEAD') {
    http_response_code(200);
    if ($method !== 'HEAD') {
        echo json_encode(['available' => function_exists('mail'), 'recipient' => MORANA_COMMERCIAL_EMAIL]);
    }
    exit;
}
if ($method !== 'POST') {
    header('Allow: GET, HEAD, POST');
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Utilize o formulário de contato.']);
    exit;
}
$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if (!in_array($contentType, ['application/x-www-form-urlencoded', 'multipart/form-data'], true)) {
    http_response_code(415);
    echo json_encode(['ok' => false, 'message' => 'Utilize o formulário de contato do site.']);
    exit;
}

$storage = sys_get_temp_dir() . '/morana-contact-' . substr(hash('sha256', __DIR__), 0, 20);
try {
    $result = morana_handle_contact($_POST, $_SERVER, $storage, static function (array $email): bool {
        if (!function_exists('mail')) {
            return false;
        }
        $headers = implode("\n", [
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'From: Morana <' . $email['from'] . '>',
            'Return-Path: ' . $email['from'],
            'Reply-To: ' . $email['reply_to'],
        ]);
        // Locaweb Linux / Postfix: envelope e From usam o endereço do domínio.
        return @mail($email['to'], $email['subject'], $email['body'], $headers, '-r' . $email['from']);
    });
} catch (Throwable $error) {
    $result = morana_contact_result(503, 'O envio está indisponível agora. Escreva para ' . MORANA_COMMERCIAL_EMAIL . '.');
}
http_response_code($result['status']);
if (isset($result['body']['retry_after'])) {
    header('Retry-After: ' . (int) $result['body']['retry_after']);
}
echo json_encode($result['body'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
