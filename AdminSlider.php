<?php
include_once(PS_ADMIN_DIR.'/../classes/AdminTab.php');
include_once('monslider.php');


class AdminSlider extends AdminTab
{
  	private $module = 'monslider';
	
	public function __construct()
	{
	  global $cookie, $_LANGADM;
	  $langFile = _PS_MODULE_DIR_.$this->module.'/'.Language::getIsoById(intval($cookie->id_lang)).'.php';
	  
	  /*if(file_exists($langFile))
	  {
	    require_once $langFile;
	    foreach($_MODULE as $key=>$value)
	      if(substr(strip_tags($key), 0, 5) == 'Admin')
	        $_LANGADM[str_replace('_', '', strip_tags($key))] = $value;
	  }*/
	  parent::__construct();
	}
    
	public function display()
	{
    	global $smarty;    	
    	//echo $this->l('Welcome on your Home Slider').'<br /><p class="center"><img src="'.Configuration::get('MOD_SLIDER_IMG').'" alt="-" /></p>';
		
		
		$monslider = new monslider;        
        $result = $monslider->showPicture();
        
        $monslider->showHide();
        $monslider->deleteImage();
        
        $smarty->assign('imageStart',   $result['img']);
        $smarty->assign('imageWidth',   $result['size_x']);
        $smarty->assign('imageHeight',  $result['size_y']);
        $smarty->assign('id',           $result['id']);
        $smarty->assign('extension',    $result['extension']);
        $smarty->assign('publish',      $result['publish']);
        
        //Configuration::updateValue('cropW', Tools::getValue(500));
        //Configuration::updateValue('cropH', Tools::getValue(350));
        
        $smarty->assign('cropW', 500);
        $smarty->assign('cropH', 350);
        
        $monslider->crop();
        
        $retour = $monslider->afficheImage();
        $smarty->assign('imgList', $retour);        
        
        return $smarty->display(dirname(__FILE__). '\AdminSlider.tpl');
  	}
}
?>

 