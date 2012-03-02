<?php
require_once('../../config/config.inc.php');
include_once('monslider.php');

$monslider = new monslider;

if(Tools::getValue('img'))
    $monslider->sortImage();

if(Tools::getValue('validModif'))
    $monslider->showHide();

if(Tools::getValue('validDelete'))
    $monslider->deleteImage();

?>