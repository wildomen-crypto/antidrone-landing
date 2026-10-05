<?php defined('_JEXEC') or die; ?>
<div class="antidrone-design-module <?php echo htmlspecialchars($params->get('moduleclass_sfx', ''), ENT_QUOTES, 'UTF-8'); ?>">
  <iframe id="<?php echo $frameId; ?>" title="Проектирование антидроновой защиты: 3D-конструктор и заявка" src="<?php echo htmlspecialchars($frameUrl, ENT_QUOTES, 'UTF-8'); ?>" height="1200" data-antidrone-frame data-module-id="<?php echo (int) $module->id; ?>" data-endpoint="<?php echo htmlspecialchars($ajaxUrl, ENT_QUOTES, 'UTF-8'); ?>" data-token="<?php echo htmlspecialchars($tokenName, ENT_QUOTES, 'UTF-8'); ?>" data-requests="<?php echo $acceptRequests ? '1' : '0'; ?>"></iframe>
  <noscript>Для конструктора включите JavaScript. Для обсуждения проекта: +7 (495) 215-07-79, kmd@topengineer.ru.</noscript>
</div>
