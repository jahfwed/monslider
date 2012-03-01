<?php
require_once('../../config/config.inc.php');
include_once('monslider.php');

$monslider = new monslider;

if(isset($_POST['img']))
    $monslider->sortImage();

if(isset($_POST['validModif']))
    $monslider->showHide();

if(isset($_POST['validDelete']))
    $monslider->deleteImage();

?>