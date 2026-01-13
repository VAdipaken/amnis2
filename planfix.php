<?php
/**
 * PlanFix CRM Integration
 * Отправка заявок из форм в PlanFix CRM
 */

// Настройки PlanFix API
// ВАЖНО: Замените на ваши реальные данные
$planfix_api_key = "YOUR_API_KEY";
$planfix_api_secret = "YOUR_API_SECRET";
$planfix_account = "YOUR_ACCOUNT_NAME";
$planfix_api_url = "https://api.planfix.com/xml/";

// Функция для отправки данных в PlanFix
function sendToPlanFix($data) {
    global $planfix_api_key, $planfix_api_secret, $planfix_account, $planfix_api_url;
    
    // Если не настроены данные API, пропускаем отправку
    if ($planfix_api_key === "YOUR_API_KEY" || empty($planfix_api_key)) {
        return false;
    }
    
    try {
        // Аутентификация и получение токена
        $token = authenticatePlanFix();
        if (!$token) {
            return false;
        }
        
        // Создание контакта или задачи в PlanFix
        $result = createPlanFixTask($token, $data);
        
        return $result;
    } catch (Exception $e) {
        error_log("PlanFix API Error: " . $e->getMessage());
        return false;
    }
}

// Аутентификация в PlanFix
function authenticatePlanFix() {
    global $planfix_api_key, $planfix_api_secret, $planfix_account, $planfix_api_url;
    
    $requestXml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><request method="auth.login"><account></account><login></login><password></password></request>');
    
    $requestXml->account = $planfix_account;
    $requestXml->login = $planfix_api_key;
    $requestXml->password = $planfix_api_secret;
    
    $ch = curl_init($planfix_api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HEADER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_USERPWD, $planfix_api_key . ':');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestXml->asXML());
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        error_log("PlanFix Auth Error: " . $error);
        return false;
    }
    
    // Парсинг ответа для получения токена
    $header_size = strpos($response, "\r\n\r\n");
    $responseBody = substr($response, $header_size + 4);
    
    $xml = simplexml_load_string($responseBody);
    if ($xml && isset($xml->sid)) {
        return (string)$xml->sid;
    }
    
    return false;
}

// Создание задачи в PlanFix
function createPlanFixTask($token, $data) {
    global $planfix_api_key, $planfix_account, $planfix_api_url;
    
    // Определяем тип формы и формируем данные
    $formType = $data['form_type'] ?? 'default';
    $title = '';
    $description = '';
    
    if ($formType === 'gov_kp') {
        $title = "Запрос КП для госзакупки: " . ($data['organizationName'] ?? 'Не указано');
        $description = "Срок подачи заявки: " . ($data['deadlineDate'] ?? 'Не указано') . "\n";
        $description .= "Количество организаций: " . ($data['organizationsCount'] ?? 'Не указано') . "\n";
        $description .= "Организация: " . ($data['organizationName'] ?? 'Не указано') . "\n";
        $description .= "Контактное лицо: " . ($data['contactPerson'] ?? 'Не указано') . "\n";
        $description .= "Телефон: " . ($data['contactPhone'] ?? 'Не указано') . "\n";
        $description .= "Email: " . ($data['contactEmail'] ?? 'Не указано') . "\n";
        $description .= "Требования: " . ($data['documentationRequirements'] ?? 'Не указаны');
    } else {
        $name = $data['name'] ?? '';
        if ($name === 'Обратный звонок') {
            $title = "Запрос на обратный звонок";
            $description = "Телефон: " . ($data['phone'] ?? 'Не указано');
        } else {
            $title = "Новая заявка с сайта: " . ($data['service'] ?? 'Не указано');
            $description = "Имя: " . ($data['name'] ?? 'Не указано') . "\n";
            $description .= "Телефон: " . ($data['phone'] ?? 'Не указано') . "\n";
            $description .= "Email: " . ($data['email'] ?? 'Не указано') . "\n";
            $description .= "Услуга: " . ($data['service'] ?? 'Не указано') . "\n";
            $description .= "Сообщение: " . ($data['message'] ?? 'Не указано');
        }
    }
    
    // Создание XML запроса для добавления задачи
    $requestXml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><request method="task.add"><account></account><sid></sid><task></task></request>');
    
    $requestXml->account = $planfix_account;
    $requestXml->sid = $token;
    
    $task = $requestXml->task;
    $task->title = $title;
    $task->description = $description;
    $task->status = 1; // Статус "Новая"
    $task->priority = 2; // Приоритет "Обычный"
    
    // Отправка запроса
    $ch = curl_init($planfix_api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HEADER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_USERPWD, $planfix_api_key . ':' . $token);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestXml->asXML());
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        error_log("PlanFix Task Creation Error: " . $error);
        return false;
    }
    
    $header_size = strpos($response, "\r\n\r\n");
    $responseBody = substr($response, $header_size + 4);
    
    $xml = simplexml_load_string($responseBody);
    if ($xml && isset($xml->task)) {
        return true;
    }
    
    return false;
}

// Функция для создания контакта в PlanFix (опционально)
function createPlanFixContact($token, $data) {
    global $planfix_api_key, $planfix_account, $planfix_api_url;
    
    $name = $data['name'] ?? ($data['contactPerson'] ?? 'Клиент');
    $phone = $data['phone'] ?? ($data['contactPhone'] ?? '');
    $email = $data['email'] ?? ($data['contactEmail'] ?? '');
    
    if (empty($phone) && empty($email)) {
        return false;
    }
    
    $requestXml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><request method="contact.add"><account></account><sid></sid><contact></contact></request>');
    
    $requestXml->account = $planfix_account;
    $requestXml->sid = $token;
    
    $contact = $requestXml->contact;
    $contact->name = $name;
    if (!empty($email)) {
        $contact->email = $email;
    }
    if (!empty($phone)) {
        $contact->phone = $phone;
    }
    
    $ch = curl_init($planfix_api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HEADER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_USERPWD, $planfix_api_key . ':' . $token);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestXml->asXML());
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return true;
}

?>
