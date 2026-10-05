<?php
defined('_JEXEC') or die;
$document = JFactory::getDocument();
$assetRoot = JUri::root(true) . '/media/mod_antidrone_design/';
$document->addStyleSheet($assetRoot . 'embed.css');
$document->addScript($assetRoot . 'embed.js');
$frameId = 'antidrone-design-' . (int) $module->id;
$frameUrl = $assetRoot . 'app/joomla/';
$ajaxUrl = JUri::root(true) . '/upload.php';
// The existing site handler already has its own recipient and mail settings.
$acceptRequests = (int) $params->get('site_form_requests', 1) === 1;
require JModuleHelper::getLayoutPath('mod_antidrone_design', 'default');
