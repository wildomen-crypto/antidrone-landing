<?php
defined('_JEXEC') or die;
/** Joomla 3 com_ajax dispatches module=antidrone_design to this exact class. */
class ModAntidroneDesignHelper
{
    private static function text($body, $key, $max)
    {
        $value = isset($body[$key]) ? $body[$key] : '';
        if (!is_string($value) || strlen($value) > $max) { throw new InvalidArgumentException('Проверьте поля заявки.'); }
        return trim($value);
    }

    public static function submitAjax()
    {
        if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST' || !JSession::checkToken('post')) { throw new RuntimeException('Обновите страницу перед отправкой заявки.', 403); }
        $app = JFactory::getApplication();
        $raw = $app->input->post->get('payload', '', 'raw');
        if (!is_string($raw) || strlen($raw) > 24000) { throw new InvalidArgumentException('Заявка слишком большая.'); }
        $body = json_decode($raw, true, 16);
        if (!is_array($body) || json_last_error() !== JSON_ERROR_NONE) { throw new InvalidArgumentException('Неверный формат заявки.'); }
        if (!isset($body['website']) || $body['website'] !== '' || !isset($body['consent']) || $body['consent'] !== true || !isset($body['consentVersion']) || $body['consentVersion'] !== '2026-10-03-draft-1') { throw new InvalidArgumentException('Проверьте согласие на обработку данных.'); }
        $name = self::text($body, 'name', 300); $comment = self::text($body, 'comment', 6000);
        $phone = self::text($body, 'phone', 120); $email = self::text($body, 'email', 120);
        if (($phone === '' && $email === '') || ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) || ($phone !== '' && (!preg_match('/^[+0-9() .-]+$/', $phone) || strlen(preg_replace('/\D/', '', $phone)) < 7))) { throw new InvalidArgumentException('Укажите корректный телефон или email.'); }
        $configuration = isset($body['configuration']) ? $body['configuration'] : null;
        if ($configuration !== null) {
            if (!is_array($configuration) || !isset($configuration['version'], $configuration['shapeId'], $configuration['services']) || $configuration['version'] !== 1 || !in_array($configuration['shapeId'], array('C1','C2','C3','C4','C5','C6','C7','C8'), true) || !is_array($configuration['services'])) { throw new InvalidArgumentException('Проверьте схему.'); }
            foreach (array('length'=>array(1,200),'width'=>array(1,100),'height'=>array(0.5,80),'diameter'=>array(1,100),'rise'=>array(0.2,30),'step'=>array(1,10),'layers'=>array(1,3)) as $field=>$limits) {
                if (!isset($configuration[$field]) || (!is_int($configuration[$field]) && !is_float($configuration[$field])) || !is_finite((float)$configuration[$field]) || $configuration[$field] < $limits[0] || $configuration[$field] > $limits[1]) { throw new InvalidArgumentException('Проверьте размеры схемы.'); }
            }
            if (!is_int($configuration['layers'])) { throw new InvalidArgumentException('Количество слоёв должно быть целым.'); }
            foreach ($configuration['services'] as $service) { if (!in_array($service, array('km','kmd','kzh'), true)) { throw new InvalidArgumentException('Проверьте разделы проекта.'); } }
        }
        $moduleId = $app->input->post->getInt('module_id', 0);
        $db = JFactory::getDbo();
        $query = $db->getQuery(true)->select('params,access')->from('#__modules')->where('id=' . (int)$moduleId)->where('module=' . $db->quote('mod_antidrone_design'))->where('published=1')->where('client_id=0');
        $db->setQuery($query); $module = $db->loadObject();
        if (!$module || !in_array((int)$module->access, array_map('intval', JFactory::getUser()->getAuthorisedViewLevels()), true)) { throw new RuntimeException('Модуль недоступен.', 403); }
        $params = new JRegistry($module->params);
        $recipient = trim($params->get('recipient', ''));
        if ((int)$params->get('enabled_requests', 0) !== 1 || !filter_var($recipient, FILTER_VALIDATE_EMAIL)) { throw new RuntimeException('Приём заявок ещё не включён. Свяжитесь с компанией напрямую.'); }
        $key = $app->input->post->getString('request_id', '');
        if (!preg_match('/^[a-f0-9-]{36}$/i', $key)) { throw new InvalidArgumentException('Обновите страницу перед отправкой.'); }
        $session = JFactory::getSession(); $hash = hash('sha256', $raw);
        $receipts = $session->get('antidrone.receipts', array());
        if (isset($receipts[$key])) { if ($receipts[$key]['hash'] !== $hash) { throw new RuntimeException('Повторный запрос содержит другие данные.'); } return $receipts[$key]['result']; }
        $now = time(); $times = $session->get('antidrone.times', array()); $recent = array();
        foreach ($times as $time) { if ($time > $now - 600) { $recent[] = $time; } }
        if (count($recent) >= 5) { throw new RuntimeException('Повторите отправку через 10 минут.'); }
        $recent[] = $now; $session->set('antidrone.times', $recent);
        $id = substr(hash('sha256', $key . $hash), 0, 16);
        $mailer = JFactory::getMailer(); $config = JFactory::getConfig();
        $mailer->setSender(array($config->get('mailfrom'), $config->get('fromname')));
        $mailer->addRecipient($recipient); if ($email !== '') { $mailer->addReplyTo($email, $name); }
        $mailer->setSubject('Заявка на проект антидроновой защиты ' . $id); $mailer->isHTML(false);
        $mailer->setBody("Заявка: " . $id . "\nИмя: " . $name . "\nТелефон: " . $phone . "\nEmail: " . $email . "\nЗадача: " . $comment . "\nСогласие: " . $body['consentVersion'] . "\nСхема является предварительными исходными данными заказчика; цена и рабочая документация требуют проверки инженером.");
        if ($configuration !== null) { $mailer->addStringAttachment(json_encode($configuration), 'antidrone-scheme.json', 'base64', 'application/json'); }
        try { $sent = $mailer->send(); } catch (Exception $error) { $sent = false; }
        if ($sent !== true) { throw new RuntimeException('Не удалось отправить заявку. Проверьте почту Joomla или свяжитесь с компанией напрямую.'); }
        $result = array('id'=>$id, 'sent'=>true); $receipts[$key] = array('hash'=>$hash,'result'=>$result);
        if (count($receipts) > 20) { $receipts = array_slice($receipts, -20, null, true); }
        $session->set('antidrone.receipts', $receipts);
        return $result;
    }
}
