<div class="slider">	
	{foreach item=line from=$resultat}
		<div class="slider-item">
			<img src="{$imgPath}{$line.id}.{$line.extension}" alt="{l s='Slider' mod='slider'}" />
			<img class="thumbnail" src="{$thumbPath}{$line.id}.{$line.extension}" alt="{l s='Slider' mod='slider'}" />
			<div class="caption">{$line.extension}</div>
		</div>
	{/foreach}	
</div>