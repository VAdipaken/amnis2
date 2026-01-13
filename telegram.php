<?php
// ВАЖНО: не меняйте кавычки и не добавляйте пробелы
$bot_token = "8329950431:AAGPnIM-8HxJPokEycZolUgFsA1Yzkr6nsc";
$chat_id = "239127737"; // Ваш ID из ответа API

// Функция логирования подозрительных запросов
function logSuspiciousRequest($reason, $data) {
    $log_file = __DIR__ . '/spam_log.txt';
    $log_entry = date('Y-m-d H:i:s') . " - $reason\n";
    $log_entry .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";
    $log_entry .= "User-Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown') . "\n";
    $log_entry .= "Data: " . json_encode($data, JSON_UNESCAPED_UNICODE) . "\n\n";
    @file_put_contents($log_file, $log_entry, FILE_APPEND);
}

// Функция валидации email
function validateEmail($email) {
    if (empty($email)) return true; // Email может быть необязательным
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Функция валидации телефона (российский формат)
function validatePhone($phone) {
    if (empty($phone)) return false;
    // Убираем все пробелы и дефисы для проверки
    $cleanPhone = preg_replace('/[\s\-\(\)]/', '', $phone);
    // Проверяем формат: +7XXXXXXXXXX (11 цифр после +7)
    return preg_match('/^\+7\d{10}$/', $cleanPhone);
}

// Функция санитизации текста
function sanitizeText($text, $maxLength = 5000) {
    $text = trim($text);
    if (strlen($text) > $maxLength) {
        return substr($text, 0, $maxLength);
    }
    // Удаляем потенциально опасные символы
    $text = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
    return $text;
}

// Защита от спама: проверка honeypot поля
if (!empty($_POST['website'])) {
    // Если honeypot поле заполнено - это бот, блокируем отправку
    logSuspiciousRequest('Honeypot field filled', $_POST);
    http_response_code(403);
    die('Spam detected');
}

// Простая защита от слишком частых запросов (rate limiting)
session_start();
$last_submit_time = $_SESSION['last_form_submit'] ?? 0;
$current_time = time();

// Разрешаем отправку не чаще чем раз в 10 секунд с одного IP
if ($current_time - $last_submit_time < 10) {
    http_response_code(429);
    die('Too many requests. Please wait a moment.');
}

$_SESSION['last_form_submit'] = $current_time;

// Определяем тип формы
$form_type = $_POST['form_type'] ?? 'default';

if ($form_type === 'gov_kp') {
    // Форма запроса КП для госзаказчиков
    $deadlineDate = sanitizeText($_POST['deadlineDate'] ?? '', 50);
    $organizationsCount = sanitizeText($_POST['organizationsCount'] ?? '', 10);
    $documentationRequirements = sanitizeText($_POST['documentationRequirements'] ?? '', 2000);
    $organizationName = sanitizeText($_POST['organizationName'] ?? '', 200);
    $contactPerson = sanitizeText($_POST['contactPerson'] ?? '', 100);
    $contactPhone = sanitizeText($_POST['contactPhone'] ?? '', 20);
    $contactEmail = sanitizeText($_POST['contactEmail'] ?? '', 100);
    
    // Валидация обязательных полей
    if (empty($deadlineDate) || empty($organizationName) || empty($contactPerson) || empty($contactPhone)) {
        logSuspiciousRequest('Missing required fields in gov_kp form', $_POST);
        http_response_code(400);
        die('Missing required fields');
    }
    
    // Валидация email
    if (!empty($contactEmail) && !validateEmail($contactEmail)) {
        logSuspiciousRequest('Invalid email in gov_kp form', ['email' => $contactEmail]);
        http_response_code(400);
        die('Invalid email format');
    }
    
    // Валидация телефона
    if (!validatePhone($contactPhone)) {
        logSuspiciousRequest('Invalid phone in gov_kp form', ['phone' => $contactPhone]);
        http_response_code(400);
        die('Invalid phone format');
    }
    
    $organizationsText = '';
    if ($organizationsCount === '1') {
        $organizationsText = '1 организация';
    } elseif ($organizationsCount === '2') {
        $organizationsText = '2 организации';
    } elseif ($organizationsCount === '3') {
        $organizationsText = '3 организации';
    } else {
        $organizationsText = 'Не выбрано';
    }
    
    // Формируем текст сообщения
    $text = "🎯 *НОВЫЙ ЗАПРОС КП ДЛЯ ГОСЗАКУПКИ*\n\n";
    $text .= "⏰ *Срок подачи заявки:* $deadlineDate\n";
    $text .= "🏢 *Количество организаций:* $organizationsText\n";
    $text .= "📝 *Требования к документации:* " . ($documentationRequirements ?: 'Не указаны') . "\n";
    $text .= "🏢 *Организация заказчика:* $organizationName\n";
    $text .= "👤 *Контактное лицо:* $contactPerson\n";
    $text .= "📱 *Телефон:* $contactPhone\n";
    $text .= "✉️ *Email:* $contactEmail\n";
    $text .= "\n🌐 *Источник:* lazertoposemka.ru";
    $text .= "\n⏰ *Время:* " . date('d.m.Y H:i');
    
} else {
    // Обычная форма или форма обратного звонка
    $name = sanitizeText($_POST['name'] ?? '', 100);
    $phone = sanitizeText($_POST['phone'] ?? '', 20);
    $email = sanitizeText($_POST['email'] ?? '', 100);
    $service = sanitizeText($_POST['service'] ?? '', 100);
    $message = sanitizeText($_POST['message'] ?? '', 2000);
    
    // Валидация телефона (обязательное поле)
    if (empty($phone) || !validatePhone($phone)) {
        logSuspiciousRequest('Invalid or missing phone', ['phone' => $phone]);
        http_response_code(400);
        die('Invalid phone format');
    }
    
    // Валидация email (если указан)
    if (!empty($email) && !validateEmail($email)) {
        logSuspiciousRequest('Invalid email', ['email' => $email]);
        http_response_code(400);
        die('Invalid email format');
    }
    
    // Определяем тип заявки
    if ($name === 'Обратный звонок') {
        $text = "📞 *ЗАПРОС НА ОБРАТНЫЙ ЗВОНОК*\n\n";
        $text .= "📱 *Телефон:* $phone\n";
    } else {
        $text = "🔔 *НОВАЯ ЗАЯВКА С САЙТА*\n\n";
        $text .= "👤 *Имя:* $name\n";
        $text .= "📱 *Телефон:* $phone\n";
        $text .= "✉️ *Email:* $email\n";
        $text .= "🔧 *Услуга:* $service\n";
        $text .= "💬 *Сообщение:* $message\n";
    }
    $text .= "\n🌐 *Источник:* lazertoposemka.ru";
    $text .= "\n⏰ *Время:* " . date('d.m.Y H:i');
}

// Кодируем текст для URL
$text = urlencode($text);

// Отправляем сообщение в Telegram
$url = "https://api.telegram.org/bot$bot_token/sendMessage?chat_id=$chat_id&text=$text&parse_mode=Markdown";
file_get_contents($url);

// Отправка в PlanFix CRM (если настроено)
require_once __DIR__ . '/planfix.php';
if (function_exists('sendToPlanFix')) {
    sendToPlanFix($_POST);
}

// Перенаправляем пользователя на страницу благодарности
header("Location: /thank-you.php");
exit();
?>

