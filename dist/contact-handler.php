<?php
declare(strict_types=1);

// O destinatário e o remetente nunca são obtidos do formulário.
const MORANA_COMMERCIAL_EMAIL = 'comercial@moranaservicos.com.br';

function morana_contact_result(int $status, string $message, array $extra = []): array
{
    return ['status' => $status, 'body' => array_merge([
        'ok' => $status === 200,
        'message' => $message,
    ], $extra)];
}

function morana_contact_origin_allowed(array $server): bool
{
    if (strtolower((string) ($server['HTTP_SEC_FETCH_SITE'] ?? '')) === 'cross-site') {
        return false;
    }
    $origin = (string) ($server['HTTP_ORIGIN'] ?? '');
    if ($origin === '') {
        return true;
    }
    $parsed = parse_url($origin);
    $host = parse_url('http://' . (string) ($server['HTTP_HOST'] ?? ''), PHP_URL_HOST);
    if (!is_array($parsed) || !$host || !in_array($parsed['scheme'] ?? '', ['https', 'http'], true)) {
        return false;
    }
    return strtolower((string) ($parsed['host'] ?? '')) === strtolower($host);
}

/** Contadores temporários; não armazena nome, e-mail, mensagem ou IP em texto. */
function morana_contact_rate_limit(string $directory, string $ip, int $now): array
{
    if (is_link($directory) || (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory))) {
        return ['error' => true];
    }
    $permissions = @fileperms($directory);
    if ($permissions === false || ($permissions & 0077) !== 0 || is_link($directory . '/rate.json')) {
        return ['error' => true];
    }
    $file = @fopen($directory . '/rate.json', 'c+');
    if ($file === false) {
        return ['error' => true];
    }
    @chmod($directory . '/rate.json', 0600);
    if (!flock($file, LOCK_EX)) {
        fclose($file);
        return ['error' => true];
    }
    try {
        $raw = stream_get_contents($file, 65536);
        $state = json_decode($raw === false ? '' : $raw, true);
        $entries = is_array($state) ? $state : [];
        $entries = array_values(array_filter($entries, static function ($entry) use ($now): bool {
            return is_array($entry) && isset($entry['time'], $entry['client'])
                && is_int($entry['time']) && $entry['time'] > $now - 900;
        }));
        $key = hash('sha256', $ip . '|' . $directory);
        $clientEntries = array_values(array_filter($entries, static function ($entry) use ($key): bool {
            return $entry['client'] === $key;
        }));
        if (count($clientEntries) >= 3 || count($entries) >= 30) {
            $oldest = count($clientEntries) >= 3 ? $clientEntries[0]['time'] : $entries[0]['time'];
            return ['allowed' => false, 'retry_after' => max(1, $oldest + 900 - $now)];
        }
        $entries[] = ['time' => $now, 'client' => $key];
        $encoded = json_encode($entries);
        if ($encoded === false || !rewind($file) || !ftruncate($file, 0)
            || fwrite($file, $encoded) !== strlen($encoded) || !fflush($file)) {
            return ['error' => true];
        }
        return ['allowed' => true];
    } finally {
        flock($file, LOCK_UN);
        fclose($file);
    }
}

/** O transporte é injetável para testar o fluxo sem enviar e-mails reais. */
function morana_handle_contact(array $data, array $server, string $rateDirectory, callable $sendMail, ?int $now = null): array
{
    if (($server['REQUEST_METHOD'] ?? '') !== 'POST') {
        return morana_contact_result(405, 'Utilize o formulário de contato.');
    }
    if (!morana_contact_origin_allowed($server)) {
        return morana_contact_result(403, 'Abra o formulário pelo site da Morana e tente novamente.');
    }
    if ((int) ($server['CONTENT_LENGTH'] ?? 0) > 24000) {
        return morana_contact_result(413, 'A mensagem é muito longa. Reduza o texto e tente novamente.');
    }
    $limits = ['nome' => 90, 'empresa' => 120, 'email' => 180, 'interesse' => 80, 'desafio' => 1200, 'website' => 200];
    $values = [];
    foreach ($limits as $field => $limit) {
        $value = $data[$field] ?? '';
        if (!is_string($value) || strlen($value) > $limit * 4 || preg_match('//u', $value) !== 1) {
            return morana_contact_result(422, 'Confira os campos informados e tente novamente.');
        }
        $value = trim(str_replace(["\r\n", "\r"], "\n", $value));
        $length = preg_match_all('/./us', $value);
        if ($length === false || $length > $limit || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
            return morana_contact_result(422, 'Confira os campos informados e tente novamente.');
        }
        if ($field !== 'desafio' && preg_match('/[\r\n\t]/', $value)) {
            return morana_contact_result(422, 'Confira os campos informados e tente novamente.');
        }
        $values[$field] = $value;
    }
    if ($values['website'] !== '') {
        return morana_contact_result(422, 'Não foi possível processar a solicitação. Escreva diretamente para nosso e-mail.');
    }
    if (strlen($values['nome']) < 2 || strlen($values['empresa']) < 2) {
        return morana_contact_result(422, 'Informe seu nome e o nome da empresa.');
    }
    if (!filter_var($values['email'], FILTER_VALIDATE_EMAIL)) {
        return morana_contact_result(422, 'Informe um endereço de e-mail válido.');
    }
    $interests = ['Ainda quero entender melhor', 'Planejamento estratégico', 'Gestão financeira', 'Processos e operação', 'Pessoas e liderança'];
    if (!in_array($values['interesse'], $interests, true)) {
        return morana_contact_result(422, 'Selecione uma área de interesse no formulário.');
    }
    $limit = morana_contact_rate_limit($rateDirectory, (string) ($server['REMOTE_ADDR'] ?? 'unknown'), $now ?? time());
    if (!empty($limit['error'])) {
        return morana_contact_result(503, 'O envio está indisponível agora. Escreva para ' . MORANA_COMMERCIAL_EMAIL . '.');
    }
    if (empty($limit['allowed'])) {
        return morana_contact_result(429, 'Houve várias tentativas em pouco tempo. Aguarde alguns minutos ou escreva diretamente para nosso e-mail.', [
            'retry_after' => $limit['retry_after'],
        ]);
    }
    $message = "Nova solicitação pelo site da Morana\n\n"
        . 'Nome: ' . $values['nome'] . "\n"
        . 'Empresa: ' . $values['empresa'] . "\n"
        . 'E-mail: ' . $values['email'] . "\n"
        . 'Interesse: ' . $values['interesse'] . "\n\n"
        . ($values['desafio'] !== '' ? $values['desafio'] : 'Gostaria de conversar sobre a gestão da minha empresa.') . "\n";
    $email = [
        'to' => MORANA_COMMERCIAL_EMAIL,
        'from' => MORANA_COMMERCIAL_EMAIL,
        'reply_to' => $values['email'],
        'subject' => 'Contato pelo site | Morana',
        'body' => $message,
    ];
    try {
        $accepted = $sendMail($email) === true;
    } catch (Throwable $error) {
        $accepted = false;
    }
    if (!$accepted) {
        return morana_contact_result(503, 'Não foi possível encaminhar a mensagem agora. Seu texto foi mantido. Escreva para ' . MORANA_COMMERCIAL_EMAIL . '.');
    }
    return morana_contact_result(200, 'Solicitação aceita pelo servidor para encaminhamento à equipe comercial.');
}
