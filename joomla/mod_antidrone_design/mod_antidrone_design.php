<?php
defined('_JEXEC') or die;
$document = JFactory::getDocument();
$assetRoot = JUri::root(true) . '/media/mod_antidrone_design/';
$document->addStyleSheet($assetRoot . 'embed.css');
$document->addScript($assetRoot . 'embed.js');
$frameId = 'antidrone-design-' . (int) $module->id;
$frameUrl = $assetRoot . 'app/joomla/';
$ajaxUrl = JUri::root(true) . '/index.php?option=com_ajax&module=antidrone_design&method=submit&format=json';
$tokenName = JSession::getFormToken();
$acceptRequests = (int) $params->get('enabled_requests', 0) === 1 && trim($params->get('recipient', '')) !== '';
require JModuleHelper::getLayoutPath('mod_antidrone_design', 'default');
