<script type="text/javascript" src="{$JsPath}/jquery.advancedSlider.js"></script>
<!--[if IE]><script type="text/javascript" src="{$JsPath}/excanvas.compiled.js"></script><![endif]-->
{literal}
<script type="text/javascript">

	var slider;
		
	$(document).ready(function(){
		slider = $('.slider').advancedSlider(
		{width:500, height:350, pauseSlideshowOnHover:true, initialEffect:false,
		  slideProperties:{
			  0:{effectType:'scale', horizontalSlices:'6', verticalSlices:'3', sliceDuration:'1000'},
			  1:{effectType:'fade', horizontalSlices:'1', verticalSlices:'1', slicePattern:'leftToRight', captionPosition:'bottom',
				 captionShowEffect:'fade', captionHeight:160, slideshowDelay:12000},
			  2:{effectType:'slide', horizontalSlices:'10', verticalSlices:'1', slicePattern:'rightToLeft', sliceDuration:'700'},
			  3:{effectType:'height', horizontalSlices:'10', verticalSlices:'1', slicePattern:'leftToRight', slicePoint:'centerBottom',
				 sliceDuration:'500', captionSize:'40'},
			  4:{effectType:'scale', horizontalSlices:'10', verticalSlices:'5', sliceDuration:'800'},
			  5:{effectType:'height', horizontalSlices:'1', verticalSlices:'15', slicePattern:'bottomToTop', slicePoint:'centerTop',
				 sliceDuration:'700', captionPosition:'bottom', captionSize:'150', captionHideEffect:'slide'},
			  6:{effectType:'slide', horizontalSlices:'6', verticalSlices:'3', slicePattern:'topLeftToBottomRight', 
				 slideStartPosition:'rightBottom', slideStartRatio:'0.5', sliceDuration:'700'},
			  7:{effectType:'fade', horizontalSlices:'10', verticalSlices:'5'},
			  8:{effectType:'slide', horizontalSlices:'15', verticalSlices:'1', slideMask:'true', slicePattern:'rightToLeft', 
				 slideStartPosition:'verticalAlternative', sliceDuration:'800'},
			  9:{effectType:'fade', horizontalSlices:'10', verticalSlices:'5'}
		   }
		   });
	});
</script>
{/literal}