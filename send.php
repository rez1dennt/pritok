<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Метод не поддерживается.'], JSON_UNESCAPED_UNICODE);
    exit;
}

function field(string $name): string
{
    return trim((string)($_POST[$name] ?? ''));
}

if (field('website') !== '') {
    echo json_encode(['ok' => true, 'message' => 'Заявка отправлена.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$name = field('name');
$phone = field('phone');
$telegram = field('telegram');
$comment = field('comment');

$errors = [];

if ($name === '' || strlen($name) < 2) {
    $errors[] = 'Укажите имя.';
}

$digits = preg_replace('/\D+/', '', $phone);
if ($phone === '' || strlen($digits ?? '') < 11) {
    $errors[] = 'Укажите корректный телефон.';
}

if ($telegram === '') {
    $errors[] = 'Укажите никнейм в Telegram.';
}

if ($comment === '' || strlen($comment) < 5) {
    $errors[] = 'Коротко опишите проект или вопрос.';
}

if ($errors !== []) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => implode(' ', $errors)], JSON_UNESCAPED_UNICODE);
    exit;
}

$to = 'pritok.pro@mail.ru';
$subject = 'Новая заявка с сайта Pritok.pro';
$body = implode("\n", [
    'Новая заявка с сайта Pritok.pro',
    '',
    'Имя: ' . $name,
    'Телефон: ' . $phone,
    'Telegram: ' . $telegram,
    'Проект / вопрос: ' . $comment,
    '',
    'Дата: ' . date('d.m.Y H:i:s'),
]);

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Pritok.pro <no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'pritok.pro') . '>',
    'Reply-To: ' . $to,
];

$sent = mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Не удалось отправить заявку. Попробуйте позже или напишите в Telegram.'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => true, 'message' => 'Заявка отправлена. Мы свяжемся с вами по указанным контактам.'], JSON_UNESCAPED_UNICODE);
