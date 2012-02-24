<?php
require_once('../../config/config.inc.php');

define('IMG_PATH','images/');
define('THUMB_PATH','thumbs/');


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
                if (mysql_query($sql)) {
                    $id = mysql_insert_id();
                    $fichierFinal = $id .'.'. $extension;
                    move_uploaded_file($_FILES['fichier']['tmp_name'], IMG_PATH . $fichierFinal);
                    
                    //Création de la vignette
                    $source     = imagecreatefromjpeg(IMG_PATH . $fichierFinal);
                    
                    //On récupère les dimensions
                    $source_x = imagesx($source);
                    $source_y = imagesy($source);
                    
                    $thumb_x_final = 200;
                    //$thumb_y_final = 200;
                    $thumb_y_final = ($thumb_x_final * $source_y) / $source_x;
                    
                    $thumb      = imagecreatetruecolor($thumb_x_final,$thumb_y_final);
                     
                    //On récupère les dimensions
                    //$source_x = imagesx($source);
                    //$source_y = imagesy($source);
                    $thumb_x  = imagesx($thumb);
                    $thumb_y  = imagesy($thumb);
                    
                    //$thumb_y_final = ($thumb_x * $source_y) / $source_x;
                                        
                    imagecopyresampled($thumb,$source,0,0,0,0,$thumb_x,$thumb_y_final,$source_x,$source_y);
                    
                    imagejpeg($thumb,THUMB_PATH . $fichierFinal);
                    
                    echo "l'image a bien été envoyée et la vignette créée";
                    
                }
                else {
                    echo "fail";
                }
            }
        }
    }
}

?>

<html>
<head>

</head>
<body>
    
<form method="post" enctype="multipart/form-data">
    <input type="file" name="fichier" />
    <input type="submit" name="valider" id="valider" />       
</form>
    
    
</body>    
<?php
//Boucle d'affichage

$sql = "SELECT `id`,`extension` FROM `ps_slider`";
$resultat = mysql_query($sql);

while($row = mysql_fetch_assoc($resultat)){
    $id = $row['id'];
    $extension = $row['extension'];    
        
    $img = $id .'.'. $extension;
    
    echo "<div id='divImage'>";
    echo "<img src='";
    echo IMG_PATH . $img;
    echo " ' />";
    
    echo "<img src='";
    echo THUMB_PATH . $img;
    echo " ' />";
    
    echo "</div>";
    echo '<br />';
    echo '<br />';
        
}

?>
</html>
