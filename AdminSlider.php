<?php
include_once(PS_ADMIN_DIR.'/../classes/AdminTab.php');
include_once('monslider.php');


class AdminSlider extends AdminTab
{
  	private $module = 'monslider';
	
	public function __construct()
	{
    	global $cookie, $_LANGADM;
        $langFile = $this->module . Language::getIsoById((int)($cookie->id_lang)) . '.php';
        if (file_exists($langFile)) {
          require_once $langFile;
          foreach ($_MODULE as $key => $value) {
            if (substr(strip_tags($key), 0, 5) == 'Admin') {
              $_LANGADM[str_replace('_', '', strip_tags($key))] = $value;
            }
          }
        }
	  parent::__construct();
	}
    
	public function display()
	{
    	global $smarty;    	
    	
		$monslider = new monslider;        
        $result = $monslider->addPicture();        
        
        $monslider->deleteImage();
        
        $smarty->assign('imageStart',   $result['img']);
        $smarty->assign('imageWidth',   $result['size_x']);
        $smarty->assign('imageHeight',  $result['size_y']);
        $smarty->assign('idImg',        $result['id']);
        $smarty->assign('extension',    $result['extension']);
        //$smarty->assign('publish',      $result['publish']);
        
        $smarty->assign('cropW', $monslider->_get('CROPW'));
        $smarty->assign('cropH', $monslider->_get('CROPH'));
        
        $monslider->crop();
        
        $retour = $monslider->showImage();
        $smarty->assign('imgList', $retour);        
        
        return $smarty->display(dirname(__FILE__). '\AdminSlider.tpl');
  	}
}
?>

 