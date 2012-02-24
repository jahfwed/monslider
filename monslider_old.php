<?php

define('IMG_PATH',_PS_MODULE_DIR_.'monslider/images/');
define('THUMB_PATH',_PS_MODULE_DIR_.'monslider/thumbs/');
define('CROP_PATH',_PS_MODULE_DIR_.'monslider/crop/');
class monslider extends Module{
	
	public function __construct()
	{
	  $this->name = 'monslider';
	  $this->tab = 'Modules';
	  $this->version = '1.0';
	 
	  parent::__construct();
	 
	  $this->displayName = $this->l('HomeSlider Module');
	  $this->description = $this->l('Nice JQuery Slider');
	  $this->confirmUninstall = $this->l('Are you sure you want to delete your details ?');
	}
	
	public function install()
	{
	  if(!parent::install()
	    || !$this->registerHook('home')
        || !$this->registerHook('header')
        || !$this->registerHook('footer')
	    || !Configuration::updateValue('MOD_SLIDER_IMG', 'http://fredselle.free.fr/css/img/logo.png')
		|| !$this->installModuleTab('AdminSlider', array(1=>'My Slider Tab', 2=>'Mon onglet Slider'), 2)
		/*Appel de la fonction de création de la table :*/
		|| !$this->createTable()
        )
	    return false;
	  return true;
	}
	
	public function uninstall()
	{
	  if(!parent::uninstall()
	    || !Configuration::deleteByName('MOD_SLIDER_IMG')
	    || !$this->uninstallModuleTab('AdminSlider')
		//Suppression des dossiers images et thumbnails ??
		//Suppression de la table :
		|| !$this->deleteTable()
        )
	    return false;
	  return true;
	}
	
/*	
	public function getContent()
	{
	  $html = '';
	  if(Tools::isSubmit('submitSlider'))
	  {
	    if(Validate::isUrl(Tools::getValue('slider_img')))
	    {
	      Configuration::updateValue('MOD_SLIDER_IMG', Tools::getValue('slider_img'));
	      $html .= $this->displayConfirmation($this->l('Settings updated.'));
	    }
	    else
	    {
	      $html .= $this->displayError($this->l('Invalid URL.'));
	    }
	  }
	  $slider_img = Configuration::get('MOD_SLIDER_IMG');
	  $html .= '<h2>'.$this->l('Slider Module').'</h2>
	  <form action="'.$_SERVER['REQUEST_URI'].'" method="post">
	    <fieldset>
	      <legend>'.$this->l('Settings').'</legend>
	      <label>'.$this->l('Image URL').'</label>
	      <div class="margin-form">
	        <input type="text" name="slider_img" value="'.$slider_img.'" />
	      </div>
	      <div class="clear center">
	        <p>&nbsp;</p>
	        <input class="button" type="submit" name="submitSlider" value="'.$this->l('   Save   ').'" />
	      </div>
	    </fieldset>
	  </form>';
	  return $html;
	}
*/
	
	public function addPicture()
    {
        if(isset($_POST['valider'])){        
            if(isset($_FILES['fichier'])) {                    
                $erreur = $_FILES['fichier']['error'];        
                if ($erreur == 0) {
                    $type = $_FILES['fichier']['type'];
                    $type_img = strtolower(substr($type, 0,5));
        
                    if ($type_img == "image") {
                        $tab = explode('/',$type);
                        $extension = $tab[1];
                        
                        $sql="INSERT INTO `ps_slider` (`extension`) VALUES('$extension')";
                        if(Db::getInstance()->Execute($sql)){                            
                            $id = mysql_insert_id();
                            $fichierFinal = $id .'.'. $extension;
                            move_uploaded_file($_FILES['fichier']['tmp_name'], IMG_PATH . $fichierFinal);
                            
                            //Création de la vignette
                            $source     = imagecreatefromjpeg(IMG_PATH . $fichierFinal);
                            
                            //On récupère les dimensions (pour garder toutes les proportions, paysage ou portrait)
                            //$source_x = imagesx($source);
                            //$source_y = imagesy($source);
                            
                            $thumb_x_final = 100;
                            $thumb_y_final = 100;
                            //$thumb_y_final = ($thumb_x_final * $source_y) / $source_x;
                            
                            $thumb      = imagecreatetruecolor($thumb_x_final,$thumb_y_final);
                             
                            //On récupère les dimensions
                            $source_x = imagesx($source);
                            $source_y = imagesy($source);
                            $thumb_x  = imagesx($thumb);
                            $thumb_y  = imagesy($thumb);
                            $thumb_y_final = ($thumb_x * $source_y) / $source_x;
                                                        
                            imagecopyresampled($thumb,$source,0,0,0,0,$thumb_x,$thumb_y_final,$source_x,$source_y);
                            
                            imagejpeg($thumb,THUMB_PATH . $fichierFinal);
                                                        
                            echo "<div id='divImage'>";
                            echo "<img src='";
                            echo "../modules/monslider/images/" . $fichierFinal;
                            echo " ' />";
                            
                            echo "<img src='";
                            echo "../modules/monslider/thumbs/" . $fichierFinal;
                            echo " ' />";
                            
                            echo "</div>";
                            echo '<br />';
                            echo '<br />';
                            
                            return array( 'img'     =>$fichierFinal,
                                          'size_x'  =>$source_x,
                                          'size_y'  =>$source_y,
                                         );
                        }
                        else {
                            echo "fail";
                        }
                    }
                }
            }
        }
    }

    public function crop(){
        if(isset($_POST['validCrop']))
        {
            $sql="SELECT id,extension FROM `ps_slider` ORDER BY id DESC";
            if($row = Db::getInstance()->getRow($sql)){                            
                $id = $row['id'];
                $extension = $row['extension'];
                $fichierFinal = $id .'.'. $extension;
            
            $cropPos_x = $_POST['x'];
            $cropPos_y = $_POST['y'];            
            $srcCrop_x = $_POST['w'];
            $srcCrop_y = $_POST['h'];
            
            $srcCrop = imagecreatefromjpeg(IMG_PATH . $fichierFinal);
            $crop_x = 150;
            $crop_y = 100;
            $crop   = imagecreatetruecolor($crop_x,$crop_y); 
            
            imagecopy($crop,$srcCrop,0,0,$cropPos_x,$cropPos_y,$srcCrop_x,$srcCrop_y);
            imagejpeg($crop,CROP_PATH . $fichierFinal);
            
            echo "<div id='divCropFinal'>";
            echo "<img src='";
            echo "../modules/monslider/crop/" . $fichierFinal;
            echo " ' />";
            }                             
       }
        else {
            echo 'test fail';
        } 
    
    }

    public function afficheImage(){
        //Boucle d'affichage (changer 'if' en 'while')
        $sql = "SELECT `id`,`extension` FROM `ps_slider`";
        $resultat = mysql_query($sql);
        
        if($row = mysql_fetch_assoc($resultat)){
            $id = $row['id'];
            $extension = $row['extension'];    
                
            $img = $id .'.'. $extension;
            
            echo "<div id='divImage'>";
            echo "<img src='";
            echo "../modules/monslider/images/" . $img;
            echo " ' />";
            
            echo "<img src='";
            echo "../modules/monslider/thumbs/" . $img;
            echo " ' />";
            
            echo "</div>";
            echo '<br />';
            echo '<br />';                
        }
        
    }
     
	public function hookHome($params)
	{
        global $smarty;
        
        $sql = "SELECT id,extension FROM `ps_slider`";
        $result = Db::getInstance()->ExecuteS($sql);
        $smarty->assign('resultat', $result) ;
        $chemin = 'modules/monslider/';
        $cheminImg = $chemin.'images/';
        $cheminThumbs = $chemin.'thumbs/';
        $smarty->assign('imgPath', $cheminImg) ;
        $smarty->assign('thumbPath', $cheminThumbs) ;
        
        return $this->display(__FILE__, 'monslider.tpl');
	}
    public function hookHeader($params)
    {
        Tools::addCSS(_MODULE_DIR_.'monslider/css/style.css', 'all');
        Tools::addCSS(_MODULE_DIR_.'monslider/css/advanced-slider-base.css', 'all');
        Tools::addCSS(_MODULE_DIR_.'monslider/css/pixel/pixel.css', 'all');    
    }
    public function hookFooter($params)
    {
        global $smarty;
        $smarty->assign('JsPath', _MODULE_DIR_.'monslider/js') ;
        
        return $this->display(__FILE__, 'footer.tpl');
    }
    
	
	private function installModuleTab($tabClass, $tabName, $idTabParent)
	{
	  @copy(_PS_MODULE_DIR_.$this->name.'/logo.gif', _PS_IMG_DIR_.'t/'.$tabClass.'.gif');
	  $tab = new Tab();
	  $tab->name = $tabName;
	  $tab->class_name = $tabClass;
	  $tab->module = $this->name;
	  $tab->id_parent = $idTabParent;
	  if(!$tab->save())
	    return false;
	  return true;
	}
	
	private function uninstallModuleTab($tabClass)
	{
	  $idTab = Tab::getIdFromClassName($tabClass);
	  if($idTab != 0)
	  {
	    $tab = new Tab($idTab);
	    $tab->delete();
	    return true;
	  }
	  return false;
	}
	
	//Création de la table lors de l'installation
	private function createTable()
	{
		//$db = Db::getInstance();
		
		# ps_access
        if (!Db::getInstance()->Execute(
        'CREATE TABLE IF NOT EXISTS `ps_slider` (
          `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
          `extension` varchar(5) NOT NULL,
          `titre` varchar(100) NOT NULL,
          `publish` tinyint(1) NOT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1'
        ))
        
        return false;  
	}
	
	//Suppression de la table lors de la désinstallation
	private function deleteTable()
	{
		//$db = Db::getInstance();    
		if(!Db::getInstance()->Execute('DROP TABLE `ps_slider` '))
        return false;
	}
	
}

?>



