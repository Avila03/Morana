<?php
declare(strict_types=1);

require __DIR__ . '/../dist/contact-handler.php';

$base = sys_get_temp_dir() . '/morana-contact-tests-' . bin2hex(random_bytes(8));
$valid = ['nome' => 'Pessoa de teste', 'empresa' => 'Empresa exemplo', 'email' => 'contato@example.com', 'interesse' => 'Gestão financeira', 'desafio' => "Quero organizar a gestão.\nPodemos conversar?", 'website' => ''];
$server = ['REQUEST_METHOD' => 'POST', 'HTTP_HOST' => 'moranaservicos.com.br', 'HTTP_ORIGIN' => 'https://moranaservicos.com.br', 'REMOTE_ADDR' => '192.0.2.1'];
$count = 0;
function expect(bool $condition, string $label): void
{
    global $count;
    if (!$condition) {
        throw new RuntimeException('FAIL: ' . $label);
    }
    $count++;
    echo 'PASS: ' . $label . "\n";
}
function run_case(array $data, array $server, string $suffix, callable $mailer, int $time = 2000000000): array
{
    global $base;
    return morana_handle_contact($data, $server, $base . '/' . $suffix, $mailer, $time);
}
$sent = [];
$accept = static function (array $email) use (&$sent): bool {$sent[] = $email; return true;};
$never = static function (): bool {throw new RuntimeException('Transport must not be called');};
try {
    $result = run_case($valid, $server, 'success', $accept);
    expect($result['status'] === 200 && $result['body']['ok'] === true, 'accepts a valid request');
    expect($sent[0]['to'] === MORANA_COMMERCIAL_EMAIL && $sent[0]['from'] === MORANA_COMMERCIAL_EMAIL, 'recipient and sender stay fixed');
    expect($sent[0]['reply_to'] === 'contato@example.com' && strpos($sent[0]['body'], "gestão.\nPodemos") !== false, 'reply address and Portuguese message are preserved');
    $receipts = [];
    $ack = static function (string $recipient) use (&$receipts): bool {$receipts[] = $recipient; return true;};
    $result = morana_handle_contact($valid, $server, $base . '/receipt', $accept, 2000000000, $ack);
    expect($result['body']['receipt_sent'] === true && $receipts === ['contato@example.com'], 'accepted contact triggers confirmation to the validated visitor');
    $result = morana_handle_contact($valid, $server, $base . '/receipt', $accept, 2000000001, $ack);
    expect($result['status'] === 200 && !$result['body']['receipt_sent'] && count($receipts) === 1, 'repeated visitor confirmations are limited without losing the contact');
    $result = morana_handle_contact($valid, $server, $base . '/receipt-failure', $accept, 2000000000, static function (): bool {return false;});
    expect($result['status'] === 200 && !$result['body']['receipt_sent'], 'confirmation failure never invalidates an accepted commercial contact');
    $result = morana_handle_contact($valid, $server, $base . '/receipt-exception', $accept, 2000000000, $never);
    expect($result['status'] === 200 && !$result['body']['receipt_sent'], 'confirmation exceptions do not prompt duplicate commercial submissions');
    $result = morana_handle_contact($valid, $server, $base . '/commercial-failure', static function (): bool {return false;}, 2000000000, $ack);
    expect($result['status'] === 503 && count($receipts) === 1, 'failed commercial contacts do not receive a confirmation');
    $receiptRaw = file_get_contents($base . '/receipt/receipts/rate.json');
    expect(strpos($receiptRaw, 'contato@example.com') === false && strpos($receiptRaw, 'Pessoa') === false, 'receipt deduplication stores only temporary hashed identifiers');
    $before = count($sent);
    $bad = $valid; $bad['email'] = "contato@example.com\r\nBcc: other@example.com";
    expect(run_case($bad, $server, 'injection', $accept)['status'] === 422 && count($sent) === $before, 'blocks header injection before transport');
    $bad = $valid; $bad['nome'] = ['unexpected'];
    expect(run_case($bad, $server, 'array', $never)['status'] === 422, 'rejects array fields');
    $bad = $valid; $bad['desafio'] = str_repeat('á', 1201);
    expect(run_case($bad, $server, 'long', $never)['status'] === 422, 'enforces the Unicode message limit');
    $bad = $valid; $bad['website'] = 'https://spam.example';
    expect(run_case($bad, $server, 'trap', $never)['status'] === 422, 'rejects the honeypot without sending');
    $bad = $valid; $bad['interesse'] = 'unexpected';
    expect(run_case($bad, $server, 'interest', $never)['status'] === 422, 'validates the interest allowlist');
    $badServer = $server; $badServer['HTTP_ORIGIN'] = 'https://other.example';
    expect(run_case($valid, $badServer, 'origin', $never)['status'] === 403, 'blocks cross-origin requests');
    $badServer = $server; $badServer['HTTP_SEC_FETCH_SITE'] = 'cross-site';
    expect(run_case($valid, $badServer, 'fetch-site', $never)['status'] === 403, 'blocks browser cross-site submissions');
    $badServer = $server; $badServer['CONTENT_LENGTH'] = '24001';
    expect(run_case($valid, $badServer, 'size', $never)['status'] === 413, 'rejects oversized request bodies');
    $result = run_case($valid, $server, 'failure', static function (): bool {return false;});
    expect($result['status'] === 503 && $result['body']['ok'] === false, 'a failed mail transport never reports success');
    $result = run_case($valid, $server, 'exception', static function (): bool {throw new RuntimeException('transport failed');});
    expect($result['status'] === 503, 'handles a transport exception');
    for ($i = 0; $i < 3; $i++) run_case($valid, $server, 'rate', $accept);
    $result = run_case($valid, $server, 'rate', $never);
    expect($result['status'] === 429 && $result['body']['retry_after'] === 900, 'limits repeated requests from one IP');
    expect(run_case($valid, $server, 'rate', $accept, 2000000901)['status'] === 200, 'allows a new request after the limit expires');
    for ($i = 0; $i < 30; $i++) {
        $client = $server; $client['REMOTE_ADDR'] = '192.0.2.' . ($i + 1);
        run_case($valid, $client, 'global-rate', $accept);
    }
    $client = $server; $client['REMOTE_ADDR'] = '192.0.2.100';
    expect(run_case($valid, $client, 'global-rate', $never)['status'] === 429, 'caps the total request rate');
    $raw = file_get_contents($base . '/success/rate.json');
    expect(strpos($raw, '192.0.2.1') === false && strpos($raw, 'contato@example.com') === false && strpos($raw, 'Pessoa') === false, 'temporary rate data excludes messages and raw identities');
    echo $count . " checks passed. No real e-mail was sent.\n";
} finally {
    if (is_dir($base)) {
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($iterator as $file) {
            $file->isDir() ? rmdir($file->getPathname()) : unlink($file->getPathname());
        }
        rmdir($base);
    }
}
