<?php
// Local Joomla API fixtures: no SMTP connection, database or real personal data.
define('_JEXEC', 1);
class FixtureInput {
    public $post; public $values = array();
    public function __construct() { $this->post = $this; }
    public function get($key, $default = null, $filter = null) { return isset($this->values[$key]) ? $this->values[$key] : $default; }
    public function getInt($key, $default = 0) { return (int)$this->get($key, $default); }
    public function getString($key, $default = '') { return (string)$this->get($key, $default); }
    public function getWord($key) { return $this->getString($key); }
}
class FixtureApp {
    public $input; public function __construct() { $this->input = new FixtureInput(); }
    public function allowCache($value) {} public function setHeader($key, $value) {}
}
class JRegistry {
    private $values; public function __construct($json) { $this->values = json_decode($json, true); }
    public function get($key, $default = null) { return isset($this->values[$key]) ? $this->values[$key] : $default; }
}
class FixtureSession {
    public $values = array();
    public function get($key, $default) { return isset($this->values[$key]) ? $this->values[$key] : $default; }
    public function set($key, $value) { $this->values[$key] = $value; }
}
class FixtureQuery {
    public function select($value) { return $this; } public function from($value) { return $this; } public function where($value) { return $this; }
}
class FixtureDB {
    public $module;
    public function getQuery($value) { return new FixtureQuery(); }
    public function quote($value) { return "'" . $value . "'"; }
    public function setQuery($value) {} public function loadObject() { return $this->module; }
}
class FixtureUser { public $levels = array(1); public function getAuthorisedViewLevels() { return $this->levels; } }
class FixtureConfig { public function get($key) { return $key === 'mailfrom' ? 'sender@example.invalid' : 'Fixture'; } }
class FixtureMailer {
    public $count = 0; public $success = true; public $throw = false; public $recipient; public $attachment;
    public function setSender($value) {} public function addRecipient($value) { $this->recipient = $value; }
    public function addReplyTo($value, $name) {} public function setSubject($value) {} public function isHTML($value) {} public function setBody($value) {}
    public function addStringAttachment($value, $name, $encoding, $type) { $this->attachment = json_decode($value, true); }
    public function send() { $this->count++; if ($this->throw) throw new Exception('Internal SMTP detail'); return $this->success; }
}
class JSession { public static $token = true; public static function checkToken($method) { return self::$token; } public static function getFormToken() { return str_repeat('a',32); } }
class FixtureLanguage { public function load($name, $base, $lang, $reload, $default) { return true; } }
class FixtureDocument { public $styles = array(); public $scripts = array(); public function addStyleSheet($value) { $this->styles[] = $value; } public function addScript($value) { $this->scripts[] = $value; } }
class JFactory {
    public static $app; public static $db; public static $session; public static $user; public static $mailer; public static $document;
    public static function getApplication() { return self::$app; } public static function getDbo() { return self::$db; }
    public static function getSession() { return self::$session; } public static function getUser() { return self::$user; }
    public static function getMailer() { return self::$mailer; } public static function getConfig() { return new FixtureConfig(); }
    public static function getLanguage() { return new FixtureLanguage(); } public static function getDocument() { return self::$document; }
}
class JUri { public static function root($path) { return ''; } }
class JModuleHelper { public static function getLayoutPath($name, $layout) { return dirname(__DIR__,2) . '/joomla/mod_antidrone_design/tmpl/default.php'; } }
class FixtureExtension { public $enabled = true; public function find($values) { return 1; } public function load($id) { return true; } }
class JTable { public static function getInstance($name) { return new FixtureExtension(); } }
class JLoader { public static function register($name, $file) {} }
class JResponseJson {
    private $data;
    public function __construct($result, $message, $error, $ignore) { $this->data = $result instanceof Exception ? array('success'=>false,'message'=>$result->getMessage(),'data'=>null) : array('success'=>true,'message'=>null,'data'=>$result); }
    public function __toString() { return json_encode($this->data); }
}
require dirname(__DIR__,2) . '/joomla/mod_antidrone_design/helper.php';
function resetFixture() {
    JFactory::$app = new FixtureApp(); JFactory::$db = new FixtureDB(); JFactory::$session = new FixtureSession();
    JFactory::$user = new FixtureUser(); JFactory::$mailer = new FixtureMailer(); JFactory::$document = new FixtureDocument(); JSession::$token = true;
    JFactory::$db->module = (object)array('access'=>1,'params'=>json_encode(array('enabled_requests'=>1,'recipient'=>'receiver@example.invalid')));
    $_SERVER['REQUEST_METHOD'] = 'POST';
    JFactory::$app->input->values = array('payload'=>json_encode(array('name'=>'Fixture','phone'=>'','email'=>'person@example.invalid','comment'=>'Fixture request','website'=>'','consent'=>true,'consentVersion'=>'2026-10-03-draft-1','configuration'=>null)),'request_id'=>'11111111-1111-4111-8111-111111111111','module_id'=>42,'module'=>'antidrone_design','method'=>'submit','format'=>'json');
}
function editBody($key, $value) { $body = json_decode(JFactory::$app->input->get('payload'),true); $body[$key] = $value; JFactory::$app->input->values['payload'] = json_encode($body); }
function demand($value, $message) { if (!$value) throw new Exception($message); }
function fails($callback, $text) {
    try { $callback(); } catch (Exception $error) { demand(strpos($error->getMessage(),$text)!==false,'Wrong error: '.$error->getMessage()); return; }
    throw new Exception('Expected rejection: '.$text);
}
$checks = 0;
function checkCase($name, $callback) { global $checks; resetFixture(); $callback(); $checks++; echo 'PASS '.$name."\n"; }
checkCase('email-only delivery', function() { $result = ModAntidroneDesignHelper::submitAjax(); demand($result['sent'] && strlen($result['id'])===16 && JFactory::$mailer->count===1,'Delivery result'); demand(JFactory::$mailer->recipient==='receiver@example.invalid','Fixed recipient'); });
checkCase('phone and configuration attachment', function() {
    editBody('phone','+7 (000) 000-00-00'); editBody('email','');
    $scheme = array('version'=>1,'shapeId'=>'C4','services'=>array('km','kmd','kzh'),'length'=>10,'width'=>6,'height'=>4,'diameter'=>8,'rise'=>2,'step'=>3,'layers'=>1);
    editBody('configuration',$scheme); ModAntidroneDesignHelper::submitAjax(); demand(JFactory::$mailer->attachment===$scheme,'Scheme preserved');
});
checkCase('same request sends once', function() { $a=ModAntidroneDesignHelper::submitAjax(); $b=ModAntidroneDesignHelper::submitAjax(); demand($a===$b && JFactory::$mailer->count===1,'Duplicate email'); });
checkCase('idempotency conflict', function() { ModAntidroneDesignHelper::submitAjax(); editBody('comment','Different'); fails(function(){ModAntidroneDesignHelper::submitAjax();},'другие данные'); });
checkCase('CSRF rejection', function() { JSession::$token=false; fails(function(){ModAntidroneDesignHelper::submitAjax();},'Обновите'); demand(JFactory::$mailer->count===0,'Must not send'); });
checkCase('GET rejection', function() { $_SERVER['REQUEST_METHOD']='GET'; fails(function(){ModAntidroneDesignHelper::submitAjax();},'Обновите'); });
checkCase('consent and honeypot', function() { editBody('consent',false); fails(function(){ModAntidroneDesignHelper::submitAjax();},'согласие'); editBody('consent',true); editBody('website','spam'); fails(function(){ModAntidroneDesignHelper::submitAjax();},'согласие'); });
checkCase('invalid contact', function() { editBody('email','invalid'); fails(function(){ModAntidroneDesignHelper::submitAjax();},'телефон или email'); });
checkCase('invalid JSON / oversized', function() { JFactory::$app->input->values['payload']='{'; fails(function(){ModAntidroneDesignHelper::submitAjax();},'формат'); JFactory::$app->input->values['payload']=str_repeat('a',24001); fails(function(){ModAntidroneDesignHelper::submitAjax();},'слишком большая'); });
checkCase('invalid dimensions / services', function() { $s=array('version'=>1,'shapeId'=>'C4','services'=>array('km'),'length'=>201,'width'=>6,'height'=>4,'diameter'=>8,'rise'=>2,'step'=>3,'layers'=>1); editBody('configuration',$s); fails(function(){ModAntidroneDesignHelper::submitAjax();},'размеры'); $s['length']=10; $s['services']=array('delivery'); editBody('configuration',$s); fails(function(){ModAntidroneDesignHelper::submitAjax();},'разделы'); });
checkCase('module disabled', function() { JFactory::$db->module->params=json_encode(array('enabled_requests'=>0,'recipient'=>'receiver@example.invalid')); fails(function(){ModAntidroneDesignHelper::submitAjax();},'не включён'); });
checkCase('module access', function() { JFactory::$user->levels=array(2); fails(function(){ModAntidroneDesignHelper::submitAjax();},'недоступен'); });
checkCase('per-session rate', function() { JFactory::$session->set('antidrone.times',array_fill(0,5,time())); fails(function(){ModAntidroneDesignHelper::submitAjax();},'10 минут'); });
checkCase('SMTP failure does not save receipt', function() { JFactory::$mailer->success=false; fails(function(){ModAntidroneDesignHelper::submitAjax();},'Не удалось'); demand(JFactory::$session->get('antidrone.receipts',array())===array(),'No receipt'); });
checkCase('SMTP exception localized', function() { JFactory::$mailer->throw=true; fails(function(){ModAntidroneDesignHelper::submitAjax();},'Не удалось'); });
checkCase('module render uses correct asset/API paths', function() { $module=(object)array('id'=>42); $params=new JRegistry(JFactory::$db->module->params); ob_start(); include dirname(__DIR__,2).'/joomla/mod_antidrone_design/mod_antidrone_design.php'; $html=ob_get_clean(); demand(strpos($html,'/media/mod_antidrone_design/app/joomla/')!==false && strpos($html,'module=antidrone_design')!==false && strpos($html,'data-module-id="42"')!==false,'Rendered module'); });
if (isset($argv[1])) {
    // Execute the unmodified official Joomla 3.10.12 dispatcher with fixture APIs.
    define('JPATH_BASE',dirname(__DIR__,2).'/.local/joomla-dispatch-fixture');
    $dir=JPATH_BASE.'/modules/mod_antidrone_design'; if (!is_dir($dir)) mkdir($dir,0777,true);
    copy(dirname(__DIR__,2).'/joomla/mod_antidrone_design/helper.php',$dir.'/helper.php');
    $coreFile=$argv[1];
    checkCase('official 3.10.12 com_ajax dispatch', function() use($coreFile) { ob_start(); include $coreFile; $json=json_decode(ob_get_clean(),true); demand($json['success']===true && $json['data']['sent']===true && JFactory::$mailer->count===1,'Official dispatcher result'); });
}
echo $checks." checks passed; no real mail sent.\n";
