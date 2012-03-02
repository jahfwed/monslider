<script type="text/javascript" src="../modules/monslider/js/jquery-ui-1.8.18.custom.min.js"></script>
<script type="text/javascript" src="../modules/monslider/js/jquery.ui.sortable.js"></script>
<script type="text/javascript" src="../modules/monslider/js/jquery.cookie.js"></script>
<script type="text/javascript" src="../modules/monslider/js/raphael.js"></script>
<link type='text/css' href='../modules/monslider/css/ui-darkness/jquery-ui-1.8.18.custom.css' rel='stylesheet' />
<!--<link type='text/css' href='../modules/monslider/css/south-street/jquery-ui-1.8.18.custom.css' rel='stylesheet' />-->
<link rel="stylesheet" href="../modules/monslider/css/admin-slider.css" type="text/css">

{literal}
<script type="text/javascript">
    $(function(){
        // Tabs
        $( "#tabs" ).tabs({
            cookie: {
                // store cookie for a day, without, it would be a session cookie
                expires: 1
            }
        })
        $('#tabs-1').sortable({ 
            update: function() {
                var order = $('#tabs-1').sortable('serialize');
                //alert(order);
                $.ajax({
                    type: "POST",
                    url: "../modules/monslider/adminslider_ajax.php",
                    data: order,
                    async : true,
                    success: function(msg) {
                        $("#confNotif").fadeIn("slow");
                        $("#confNotif").delay(1500).fadeOut("slow");
                    }
                });        
            }                                         
        });
        $( "#tabs-1" ).disableSelection();
        
        $('#tabs').show();
        
        $('.toggle-online').click(function(event) {
            event.preventDefault();
            var object  = $(this);
            var toggle  = object.attr('data-toggle');
            var id      = object.attr('data-id');
            $.ajax({
                    type: "POST",
                    url: "../modules/monslider/adminslider_ajax.php",
                    data: 'validModif=true&toggle='+ toggle +'&id='+id,
                    async : true,
                    success: function(msg) {
                        if(toggle == 1){
                            object.attr('data-toggle', 0);
                            object.addClass('toggled');
                        }
                        else{
                            object.removeClass('toggled');
                            object.attr('data-toggle', 1);
                        }
                        $("#confNotif").fadeIn("slow");
                        $("#confNotif").delay(1500).fadeOut("slow");
                    }
            });
        });
        
        $('.delete').click(function(event) {
            event.preventDefault();
            var object      = $(this);
            var id          = object.attr('data-id');
            var extension   = object.attr('data-extension');
            var x=window.confirm("{/literal}{l s='Are you sure you want to delete this picture?' mod='monslider'}{literal}")
            if (x){
                $.ajax({
                    type: "POST",
                    url: "../modules/monslider/adminslider_ajax.php",
                    data: 'validDelete=true&id='+id+'&extension='+extension,
                    async : true,
                    success: function(msg) {
                        object.parents('.thumbView').remove();
                    }
                });
            }
        });
        
        
        {/literal}
        /*{if !$imgList && !isset($smarty.post.valider)}
        {literal}
            var selected = $( "#tabs" ).tabs( "option", "selected" );
            $( "#tabs" ).tabs( "option", "selected", 1 );
        {/literal}
        {/if}*/
        
        {if isset($smarty.post.valider)}
        {literal}
            var selected = $( "#tabs" ).tabs( "option", "selected" );
            $( "#tabs" ).tabs( "option", "selected", 1 );
        {/literal}        
        {/if}
        {if isset($smarty.post.validCrop)}
        {literal}
            var selected = $( "#tabs" ).tabs( "option", "selected" );
            $( "#tabs" ).tabs( "option", "selected", 0 );
        {/literal}
        {/if}
        {literal}
    });
{/literal}

{if isset($smarty.post.valider)}
    {if $imageWidth > $cropW || $imageHeight > $cropH}

{literal}
// <![CDATA[
$(document).ready( function() {
    var imgW = document.getElementById('imageWidth').value;
    var imgH = document.getElementById('imageHeight').value;
    
    var cropW = {/literal}{$cropW}{literal};
    var cropH = {/literal}{$cropH}{literal};
    
    var paper = new Raphael(document.getElementById('divPhoto'), imgW, imgH);
        
    var newImage = "../modules/monslider/pictures/images/" + document.getElementById('imgName').value;
    var imageUp = paper.image(newImage,0,0, imgW, imgH);
    
    var cadre = paper.rect(10,10,cropW,cropH).attr({fill:"#999", opacity:0.6, cursor:"move"});
    var paper2 = new Raphael(document.getElementById('divCrop'), cropW,cropH);
    
    document.getElementById('x').value = cadre.attr("x");
    document.getElementById('y').value = cadre.attr("y");
    document.getElementById('w').value = cadre.attr("x") + cropW;
    document.getElementById('h').value = cadre.attr("y") + cropH;
    
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
});
//]]>
{/literal}
{else}
{literal}
// <![CDATA[
$(document).ready( function() {
    var imgW = document.getElementById('imageWidth').value;
    var imgH = document.getElementById('imageHeight').value;
    
    var paper = new Raphael(document.getElementById('divCrop'), imgW, imgH);
    var newImage = "../modules/monslider/pictures/images/" + document.getElementById('imgName').value;
    var imageUp = paper.image(newImage,0,0, imgW, imgH);
    
    document.getElementById('x').value = 0;
    document.getElementById('y').value = 0;
    document.getElementById('w').value = imgW;
    document.getElementById('h').value = imgH;
});
//]]>
{/literal}
    {/if}
{/if}
</script>

<div class="conf confirm" id="confNotif" style="display:none;">
    <img alt="Confirmation" src="../img/admin/ok.gif">
    {l s='Position updated.' mod='monslider'}
</div>
<div id="tabs">
    <ul>
        <li><a href="#tabs-1">{l s='Pictures list' mod='monslider'}</a></li>
        <li><a href="#tabs-2">{l s='Add a picture' mod='monslider'}</a></li>                
    </ul>    
    
    <!-- //////// Tab 1 //////// -->
    <div id="tabs-1">        
        {if $imgList}
            {foreach item=line from=$imgList}
                <div class="thumbView" id="img_{$line.id}">
                    <div>
                        <img src="../modules/monslider/pictures/thumbs/{$line.id}.{$line.extension}" alt="Photo {$line.id} - " />                    
                        <a class="{if $line.publish == 0}toggled{/if} toggle-online" data-id="{$line.id}" data-toggle="{$line.publish}" title="{l s='Show / Hide the picture in the gallery' mod='monslider'}">&nbsp;</a>
                        <a class="delete" data-id="{$line.id}" data-extension="{$line.extension}" title="{l s='Delete the picture' mod='monslider'}">&nbsp;</a>
                    </div>
                    <br clear="all"/>
                    <hr />
                    <p>{$line.titre}</p>
                </div>
            {/foreach}
        {/if}
    </div>
    
    
    <!-- //////// Tab 2 //////// -->
    <div id="tabs-2">        
        <form method="post" enctype="multipart/form-data" name="myForm">
            <p>
                {l s='Add a picture' mod='monslider'} :
                <input type="file" name="fichier" />
                <input type="submit" name="valider" id="valider" value="OK" />
            </p>
            <p>
                <input type="hidden" name="imgName" id="imgName" value="{$imageStart}" />
                <input type="hidden" name="imageWidth" id="imageWidth" value="{$imageWidth}" />
                <input type="hidden" name="imageHeight" id="imageHeight" value="{$imageHeight}" />
                
            </p>
        </form>
        
        <div id="divPhoto">
            <form method="post" name="cropForm" >
                <p>
                    <input type="hidden" name="x" id="x" />
                    <input type="hidden" name="y" id="y" />
                    <input type="hidden" name="w" id="w" />
                    <input type="hidden" name="h" id="h" />
                </p>
                
             <script type="text/javascript">
             {if isset($smarty.post.valider)}                
             </script>
                       
                 <div id="divCrop">
                 <fieldset>
                     <legend>{l s='Add a title' mod='monslider'} (60 carac. max.)</legend>
                     <input type="text" name="titre" id="titre" size="38" class="imgTitle" /><br />
                     <label for="publishStart" class="label">{l s='Display online (Yes by default)' mod='monslider'}</label>
                     <input type="checkbox" name="publishStart" id="publishStart" checked />
                     <input type="submit" name="validCrop" id="validCrop" value="{l s='Confirm' mod='monslider'}" />
                     <input type="hidden" name="idImg" id="idImg" value="{$idImg}" />
                     <input type="hidden" name="extension" id="extension" value="{$extension}" />
                 </fieldset>
                 </div>
             <script type="text/javascript">
             {/if}
             </script>
            </form>   
        </div>
    </div>
            
</div>






