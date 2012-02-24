<script type="text/javascript" src="../modules/monslider/js/jquery-ui-1.8.18.custom.min.js"></script>
<script type="text/javascript" src="../modules/monslider/js/raphael.js"></script>


{literal}

<script type="text/javascript">
    $(function(){

        // Tabs
        $('#tabs').tabs();
        $('#tabs').show();
    });
</script>

<script type="text/javascript">
// <![CDATA[
window.onload = function() {
    var imgW = document.getElementById('imageWidth').value;
    var imgH = document.getElementById('imageHeight').value;
    
    var cropW = {/literal}{$cropW}{literal};
    var cropH = {/literal}{$cropH}{literal};
    
    var paper = new Raphael(document.getElementById('divPhoto'), imgW, imgH);
        
    var newImage = "../modules/monslider/images/" + document.getElementById('imgName').value;
    var imageUp = paper.image(newImage,0,0, imgW, imgH);
    
    var cadre = paper.rect(10,10,cropW,cropH).attr({fill:"#999", opacity:0.6, cursor:"move"});
    var paper2 = new Raphael(document.getElementById('divCrop'), cropW,cropH);
    
    var nowX, nowY,
    start = function() {
        // storing original coordinates
        cadre.ox = cadre.attr("x");
        cadre.oy = cadre.attr("y");
        cadre.attr({opacity: 0.7});
    },
    move = function (dx, dy) {
        // move will be called with dx and dy
        if (cadre.attr("y") > (imgH - cropH) || cadre.attr("x") > (imgW - cropW) )
            cadre.attr({x: cadre.ox + dx, y: cadre.oy + dy});
        else {
            nowX = Math.min((imgW - cropW), cadre.ox + dx);
            nowY = Math.min((imgH - cropH), cadre.oy + dy);
            nowX = Math.max(0, nowX);
            nowY = Math.max(0, nowY);
            cadre.attr({x: nowX, y: nowY });
        }
        
        var Sx = -cadre.attr("x");
        var Sy = -cadre.attr("y");
        var imageCrop = paper2.image(newImage,Sx,Sy,imgW,imgH);
        
        document.getElementById('x').value = cadre.attr("x");
        document.getElementById('y').value = cadre.attr("y");
        document.getElementById('w').value = cadre.attr("x") + cropW;
        document.getElementById('h').value = cadre.attr("y") + cropH;        
        
        
    },
    up = function () {
        // restoring state
        cadre.attr({opacity: 0.6});        
    };
    
    // rstart and rmove are the resize functions;
    cadre.drag(move, start, up);
};
//]]>
</script>
{/literal}
<div id="tabs">
    <ul>
        <li><a href="#tabs-1">Liste des photos</a></li>
        <li><a href="#tabs-2">Ajouter une image</a></li>                
    </ul>
    
    <div id="tabs-1">        
        {foreach item=line from=$imgList}
            <div>
                <img src="../modules/monslider/crop/{$line.id}.{$line.extension}" alt="{l s='Slider' mod='slider'}" />
                <img src="../modules/monslider/thumbs/{$line.id}.{$line.extension}" alt="{l s='Slider' mod='slider'}" />
                <div>{$line.titre}</div>
            </div>
        {/foreach}
    </div>
    
    <div id="tabs-2">        
        <form method="post" enctype="multipart/form-data" name="myForm">
            <p>
                <label for="fichier">Choisissez une image : </label>
                <input type="file" name="fichier" />
                <input type="submit" name="valider" id="valider" />
            </p>
            <p>
                <input type="hidden" name="imgName" id="imgName" value="{$imageStart}" />
                <input type="hidden" name="imageWidth" id="imageWidth" value="{$imageWidth}" />
                <input type="hidden" name="imageHeight" id="imageHeight" value="{$imageHeight}" />        
            </p>        
        </form>
        
        <div id="divPhoto" style="background-color:#777;">
            <form method="post" >
                <p>
                    <input type="hidden" name="x" id="x" />
                    <input type="hidden" name="y" id="y" />
                    <input type="hidden" name="w" id="w" />
                    <input type="hidden" name="h" id="h" />
                </p>
                
                <div id="divCrop">
                    <input type="text" name="titre" id="titre" value="titre" />
                    <input type="submit" name="validCrop" id="validCrop" value="valider le crop" />
                    <input type="hidden" name="extension" id="extension" value="{$extension}" />                    
                </div>
            </form>   
        </div>
        
    </div>
            
</div>






