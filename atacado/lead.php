<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method']);
    exit;
}

$config = require __DIR__ . '/config.php';

function field(string $key, int $max): string
{
    $value = $_POST[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }
    $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    if (mb_strlen($value) > $max) {
        $value = mb_substr($value, 0, $max);
    }
    return $value;
}

function multiline(string $key, int $max): string
{
    $value = $_POST[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = trim($value);
    if (mb_strlen($value) > $max) {
        $value = mb_substr($value, 0, $max);
    }
    return $value;
}

if (field('company_url', 200) !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

$started = (int) ($_POST['started_at'] ?? 0);
$now = (int) round(microtime(true) * 1000);
if ($started < 1 || ($now - $started) < 1500 || ($now - $started) > 7200000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'spam']);
    exit;
}

$name = field('name', 120);
$company = field('company', 160);
$country = field('country', 80);
$email = field('email', 160);
$phone = field('phone', 40);
$contact = field('contact', 20);
$language = field('language', 8);
$volume = field('volume', 160);
$message = multiline('message', 2000);
$pageLang = field('page_lang', 8);
$productsRaw = $_POST['products'] ?? [];
if (!is_array($productsRaw)) {
    $productsRaw = [];
}
$products = [];
foreach ($productsRaw as $item) {
    if (!is_string($item)) {
        continue;
    }
    $item = trim($item);
    if ($item !== '' && mb_strlen($item) <= 80) {
        $products[] = $item;
    }
    if (count($products) >= 30) {
        break;
    }
}

$allowedContact = ['email', 'whatsapp', 'phone'];
$allowedLang = ['pt', 'en', 'es'];
if (!in_array($contact, $allowedContact, true)) {
    $contact = '';
}
if (!in_array($language, $allowedLang, true)) {
    $language = '';
}
if (!in_array($pageLang, $allowedLang, true)) {
    $pageLang = 'pt';
}

if ($language === '') {
    $language = $pageLang;
}
if ($name === '' || $country === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'fields']);
    exit;
}

$utm = [];
foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as $key) {
    $utm[$key] = field($key, 120);
}

$lead = [
    'at' => gmdate('c'),
    'origin' => 'atacado',
    'page' => 'https://biopesquisa.com.br/atacado/',
    'name' => $name,
    'company' => $company,
    'country' => $country,
    'email' => $email,
    'phone' => $phone,
    'contact' => $contact,
    'language' => $language,
    'page_lang' => $pageLang,
    'products' => $products,
    'volume' => $volume,
    'message' => $message,
    'utm' => $utm,
    'referrer' => field('referrer', 300),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
];

$dir = $config['leads_dir'];
if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'store']);
    exit;
}

$path = rtrim($dir, '/') . '/leads.jsonl';
$line = json_encode($lead, JSON_UNESCAPED_UNICODE) . "\n";
$fh = fopen($path, 'ab');
if ($fh === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'store']);
    exit;
}
flock($fh, LOCK_EX);
fwrite($fh, $line);
flock($fh, LOCK_UN);
fclose($fh);
@chmod($path, 0600);

$to = trim((string) ($config['lead_email'] ?? ''));
if ($to !== '' && filter_var($to, FILTER_VALIDATE_EMAIL)) {
    $subject = 'Lead atacado BioPesquisa — ' . $name;
    $body = "Origem: atacado\n"
        . "Nome: {$name}\n"
        . "E-mail: {$email}\n"
        . "País: {$country}\n"
        . "Idioma da página: {$pageLang}\n"
        . "Mensagem:\n{$message}\n"
        . "Campanha: " . json_encode($utm, JSON_UNESCAPED_UNICODE) . "\n";
    $from = $config['from_email'] ?: 'noreply@biopesquisa.com.br';
    @mail($to, $subject, $body, "From: BioPesquisa <{$from}>\r\nContent-Type: text/plain; charset=UTF-8");
}

echo json_encode(['ok' => true]);
