/*
	Advanced Slider
*/
(function($) {
	
	function AdvancedSlider(instance, options) {
		
		// reference to the main DIV that contains the slider
		var slider = $(instance),
			
			// reference to the current object
			self = this,
			
			// index of the current slide
			currentIndex = -1,
			
			// index of the previous slide
			previousIndex = -1,
			
			// array of objects, each object containing data(path, thumbnail, caption etc.) about the slide
			slides = [],
			
			// indicates whether XML is used
			useXML,
			
			// reference to the DIV element of the current slide
			currentSlideDiv = null,
			
			// reference to the DIV element of the previous slide
			previousSlideDiv = null,
			
			// indicates whether the slider is in the transition phase
			isTransition = false,
			
			// indicates if the mouse is over the slider
			isHover = false,
			
			// indicates whether the lightbox is currently displayed
			isLightbox = false,
			
			// indicates whether a caption exists for the current slide
			isCaption = false,
			
			// will be used as the timer for the slideshow mode
			slideshowTimer = 0,		
			
			// will be used for the timer animation
			timerAnimationTimer = 0,
			
			// the thumbnail page that is currently selected
			currentThumbnailPage = 0,
			
			// total number of thumbnail pages
			totalThumbnailPages = 0,
			
			// indicated whether the slideshow is playing or is paused
			slideshowState = '',
			
			// indicates for how much time has the slideshow been running
			slideshowTimerPosition = 0,
			
			// indicates what was the time when the slideshow has started
			slideshowStartTime = 0,
			
			// reference to the timer used for mouse scrolling
			thumbnailMouseScrollTimer,
			
			// reference to the timer used for mouse wheel scrolling
			thumbnailMouseWheelTimer,
			
			// indicates whether the carousel is currently scrolled using the mouse wheel method
			isThumbnailMouseWheelScrolling = false,
			
			// reference to the timer used for scrollbar scrolling
			thumbnailScrollbarTimer,
			
			// indicates whether the scrollbar's thumb is being dragged
			isThumbnailScrollbarDragging = false,
			
			// indicates whether the scrollbar is currently moving
			isThumbnailScrollbarMoving = false,			
			
			// indicates the horizotal position of the mouse pointer
			mouseX,
			
			// indicates the vertical position of the mouse pointer
			mouseY,
			
			// the total width/height of the thumbnails
			thumbnailsTotalSize,
			
			// reference to the main container, which contains the thumbnails, the arrows, buttons, scrollbar etc.
			navigationThumbnails,
			
			// reference to the container which masks the actual thumbnails
			thumbnailsVisibleContainer,
			
			// reference to the container which contains the thumbnails
			thumbnailsContainer,
			
			// arrays that will hold the content specified for the prettyPhoto
			prettyPhotoContent = [],
			prettyPhotoTitle = [],
			prettyPhotoDescription = [],
			
			// will wrap the slide
			slideWrapper,
			
			firstTransition = true,
			
			// these properties can be assign to individual slides in the XML file
			slideProps = ['htmlDuringTransition', 'alignType', 'effectType', 'sliceDelay', 'sliceDuration', 'sliceEasing', 'horizontalSlices', 'verticalSlices', 'slicePattern', 'slicePoint', 'slideStartPosition',
						  'slideStartRatio', 'sliceFade', 'captionSize', 'captionPosition', 'captionShowEffectDuration', 'captionShowEffectEasing', 'captionHideEffectDuration', 'captionHideEffectEasing', 
						  'captionShowEffect', 'captionHideEffect', 'captionLeft', 'captionTop', 'captionWidth', 'captionHeight', 'captionShowSlideDirection', 'captionHideSlideDirection', 
						  'captionBackgroundColor', 'captionBackgroundOpacity', 'slideshowDelay', 'slideMask', 'linkTarget', 'simpleSlideDirection', 'simpleSlideDuration', 'simpleSlideEasing', 'lightboxDefaultWidth',
						  'lightboxDefaultHeight', 'lightboxTheme', 'lightboxOpacity', 'fadePreviousSlide', 'fadePreviousSlideDuration'];
		
		
		// contains all the settings for the slider
		this.settings = $.extend({}, $.fn.advancedSlider.defaults, options);
		
		
		// START
		init();
		

		/**
		* Initializes the slider
		*/
		function init() {
			// delete the content of the selected DIV and initialize it
			if (self.settings.xmlSource) {				
				useXML = true;
				
				// delete the previous content of the selected DIV
				slider.empty();
				
				//parse the XML file
				$.ajax({type:'GET', url:self.settings.xmlSource, dataType: $.browser.msie ? 'text' : 'xml', success:function(data) {																													
					var xml;
					
					if ($.browser.msie) {
						xml = new ActiveXObject('Microsoft.XMLDOM');
						xml.async = false;
						xml.loadXML(data);
					} else {
						xml = data;
					}
					
					// find all the <slide> nodes
					$(xml).find('slide').each(function() {
						// will contain data such as path, thumbnail, caption or link
						var slide = {};
						
						// will contain data such as effectType, sliceDelay, sliceDuration etc.
						slide.properties = {};
						
						// reads all the tags that were specified for a slide in the XML file
						for (var i = 0; i < $(this).children().length; i++) {						
							var node = $(this).children()[i];
							
							if (node.nodeName == 'lightboxContent') {
								prettyPhotoContent.push($(this).find('lightboxContent').text())
								prettyPhotoTitle.push($(this).find('lightboxTitle').text() || '');
								prettyPhotoDescription.push($(this).find('lightboxDescription').text() || '');
								slide.lightbox = {lightbox_index: prettyPhotoContent.length - 1};	
							}
							
							if (node.nodeName != 'lightboxContent' && node.nodeName != 'lightboxTitle' && node.nodeName != 'lightboxDescription')
								slide[node.nodeName] = $(this).find(node.nodeName).text();
						}
						
						// reads all the attributes that were specified for a slide in the XML file
						for (var i = 0; i < slideProps.length; i++) {
							var name = slideProps[i],
								value = $(this).attr(name);
								
							// if a property was not specified in the XML file, take the default value							
							if (value == undefined)
								slide.properties[name] = self.settings[name];
							else
								slide.properties[name] = value;
						}
						
						slides.push(slide);
					});
					
					create();					
				}});
			} else {
				// if an XML file was not specified, read the content of the selected div
				slider.children().each(function(index) {					  
					// will contain data such as path, thumbnail, caption, or link
					var slide = {};
					
					// will contain data such as effectType, sliceDelay, sliceDuration etc.
					slide.properties = {};

					// loops through all the sub-children of child
					for (var i = 0; i < $(this).children().length; i++) {
						var data = $(this).children()[i];
						
						// check whether the current sub-child is an image, a thumbnail, a link, or a paragraph, and copy the data
						if($(data).is('a')) {
							if (!$(data).hasClass('lightbox')) {
								slide['path'] = $(data).find('img').attr('src');
								slide['link'] = $(data).attr('href');
								if ($(data).attr('target'))
									slide.properties.linkTarget = $(data).attr('target');
							} else {
								prettyPhotoContent.push($(data).attr('href'))
								prettyPhotoTitle.push($(data).html() || '');
								prettyPhotoDescription.push($(data).attr('title') || '');
								slide.lightbox = {lightbox_index: prettyPhotoContent.length - 1};
							}
						} else if($(data).is('img')) {
							if ($(data).hasClass('thumbnail')) {
								slide['thumbnail'] = $(data).attr('src');
								if ($(data).attr('title'))
									slide['thumbnailCaption'] = $(data).attr('title');
							}
							else
								slide['path'] = $(data).attr('src');
						} else if ($(data).hasClass('html')){
							slide['html'] = $(data);
						} else {
							slide[$(data).attr('class')] = $(data).html();
						}
					}
					
					// reads all the settings that were specified for each slide
					for (var i = 0; i < slideProps.length; i++) {
						var name = slideProps[i],
							value;
						
						if (self.settings.slideProperties)
							if (self.settings.slideProperties[index])
								value = self.settings.slideProperties[index][name];
								
						// if a property was not specified for the slide, take the default value
						if (!slide.properties[name])
							if (value == undefined)
								slide.properties[name] = self.settings[name];
							else
								slide.properties[name] = value;
					}
					
					//console.log(index)
					slides.push(slide);
				});
				
				// delete the current content of the selected div and create the slider
				slider.empty();
				create();
			}
		}
		
		
		/**
		* Creates all the assets, preloads the slides and opens the first slide
		*/
		function create() {
			
			slider.addClass('advanced-slider');			
			slider.addClass(self.settings.skin);
			
			if ($.browser.mozilla)
				slider.addClass('mozilla');
			else if ($.browser.webkit)
				slider.addClass('webkit');
			else if ($.browser.opera)
				slider.addClass('opera');
			else if ($.browser.msie)
				if (parseInt($.browser.version) == 6)
					slider.addClass('ie6');
				else if (parseInt($.browser.version) == 7)
					slider.addClass('ie7');
				else if (parseInt($.browser.version) == 8)
					slider.addClass('ie8');
				else if (parseInt($.browser.version) == 9)
					slider.addClass('ie9');
				
				
			slideWrapper = $('<div class="slide-wrapper"></div>').appendTo(slider)
				  .css({width: self.settings.width, height: self.settings.height})
				  .hover(function() {
					  		// show the timer animation on mouse over
							if (self.settings.timerAnimation && self.settings.fadeTimer && slideshowState != 'stop' && !isTransition) {
								var timerCanvas = slider.find('.timer-animation');
								
								if ($.browser.msie && parseInt($.browser.version) < 9)
									timerCanvas.css('filter', '');
								else
									timerCanvas.stop().animate({'opacity':1}, self.settings.timerFadeDuration);									
							}
							
							isHover = true;
							
							// pause the slideshow on mouse over
							if (self.settings.slideshow && self.settings.pauseSlideshowOnHover && slideshowState != 'stop' && !isTransition)
								pauseSlideshow();
								
							// show the caption on mouse over
							if (isCaption && self.settings.hideCaption)
								showCaption();
								
							// show the navigation arrows on mouse over	
							if (self.settings.navigationArrows && self.settings.fadeNavigationArrows)
								if ($.browser.msie && parseInt($.browser.version) < 9)
									slider.find('.navigation-arrows a').stop().show();
								else
									slider.find('.navigation-arrows a').stop().animate({opacity:1}, self.settings.navigationArrowsShowDuration);
									
							// show the slideshow button on mouse over
							if (self.settings.slideshowControls && self.settings.fadeSlideshowControls)
								if ($.browser.msie && parseInt($.browser.version) < 9)
									slider.find('.slideshow-controls').stop().show();
								else
									slider.find('.slideshow-controls').stop().animate({opacity:1}, self.settings.slideshowControlsShowDuration);
									
						 },
						 function() {
							// hide the timer animation on mouse out 
						 	if (self.settings.timerAnimation && self.settings.fadeTimer && slideshowState != 'stop' && !isTransition) {
								var timerCanvas = slider.find('.timer-animation');
										
								if ($.browser.msie && parseInt($.browser.version) < 9)
									timerCanvas.css('opacity', 0);
								else
									timerCanvas.stop().animate({'opacity':0}, self.settings.timerFadeDuration);	
							}
							
							isHover = false;
							
							// resume the slideshow on mouse out
							if (self.settings.slideshow && self.settings.pauseSlideshowOnHover && slideshowState != 'stop' && !isTransition && !isLightbox)
								resumeSlideshow();
							
							// hide the caption on mouse out	
							if (isCaption && self.settings.hideCaption)
								hideCaption();
								
							// hide the navigation arrows on mouse out	
							if (self.settings.navigationArrows && self.settings.fadeNavigationArrows)
								if ($.browser.msie && parseInt($.browser.version) < 9)
									slider.find('.navigation-arrows a').stop().hide();
								else
									slider.find('.navigation-arrows a').stop().animate({opacity:0}, self.settings.navigationArrowsHideDuration);
							
							// hide the slideshow button on mouse out		
							if (self.settings.slideshowControls && self.settings.fadeSlideshowControls)
								if ($.browser.msie && parseInt($.browser.version) < 9)
									slider.find('.slideshow-controls').stop().hide();
								else
									slider.find('.slideshow-controls').stop().animate({opacity:0}, self.settings.slideshowControlsHideDuration);
						 });
			
			
			// set the initial size of the slider to the size of the slide container
			// this size will increase if other elements, like buttons, thumbnails are added	  
			slider.css({'width': slideWrapper.outerWidth(true), 'height': slideWrapper.outerHeight(true)});
			
			if (self.settings.shuffle)
				slides.sort(function(){return 0.5 - Math.random()});					
			
			if (self.settings.lightbox) {
				// initialize prettyPhoto
				$.fn.prettyPhoto({default_width: self.settings.lightboxDefaultWidth, 
								  default_height: self.settings.lightboxDefaultHeight, 
								  theme: self.settings.lightboxTheme, 
								  opacity: self.settings.lightboxOpacity, 
								  horizontal_padding: self.settings.lightboxHorizontalPadding,
								  overlay_gallery: false,
								  callback:function() {
									  isLightbox = false;
									  if (self.settings.slideshow && slideshowState != 'stop')
										resumeSlideshow();	
								  }});
				
			}
			
			if (self.settings.navigationArrows)
				createNavigationArrows();
				
			if (self.settings.navigationButtons)
				createNavigationButtons();
				
			if (self.settings.shadow)
				createShadow();
				
			if (self.settings.thumbnailsType == 'navigation')
				createNavigationThumbnails();
						
			if (self.settings.slideshowControls)
				createSlideshowControls();			
				
			if (self.settings.slidesPreloaded) {
				showPreloader();
				
				// contains the number of slides that were preloaded
				var counter = 0,
						
				// the number of slides that need to be preloaded
				// if -1 was specified, all the slides will be preloaded
				n = self.settings.slidesPreloaded == -1 ? slides.length : self.settings.slidesPreloaded;
						
				// load the images
				for (var i = 0; i < n; i++) {						
					$('<img/>').load(function() {
										 counter++;
										 if (counter == n) {
											 hidePreloader();
											 gotoSlide(self.settings.slideStart);
										 }
									 })
								.error(function() {
											counter++;
									})
								.attr('src', slides[i].path);
				}
			} else {
				gotoSlide(self.settings.slideStart);
			}			
		}
		
		
		/**
		* Creates the left and right arrows
		*/
		function createNavigationArrows() {
				navigationArrows = $('<div class="navigation-arrows"></div>').appendTo(slideWrapper),
			
				previousArrow = $('<a class="previous"></a>').appendTo(navigationArrows)
													 		 .click(function() { previousSlide(); }),
			
			
				nextArrow = $('<a class="next"></a>').appendTo(navigationArrows)
													 .click(function() { nextSlide(); });
													   
			
			if (self.settings.fadeNavigationArrows) {
				if ($.browser.msie && parseInt($.browser.version) < 9) {
					previousArrow.hide();
					nextArrow.hide();
				} else {
					previousArrow.css('opacity', 0);
					nextArrow.css('opacity', 0);
				}
			}
		}
		
		
		/**
		* Creates the slideshow control (play and pause) buttons
		*/
		function createSlideshowControls() {			
			var slideshowControls = $('<div class="slideshow-controls"></div>').appendTo(slideWrapper),
				currentClass = self.settings.slideshow ? 'pause': 'play';
				
			slideshowControls.addClass(currentClass)
							 .click(function() {
										if ($(this).hasClass('pause')) {
											$(this).removeClass('pause').addClass('play');
											slideshowState = 'stop';
											stopSlideshow();
										} else if ($(this).hasClass('play')) {
											//set the slideshow property to true if it was not previously set
											if (!self.settings.slideshow)
												self.settings.slideshow = true;
											
											$(this).removeClass('play').addClass('pause');											
											slideshowState = 'play';
											startSlideshow();
										}
									});
			
			
			if (self.settings.fadeSlideshowControls)
				if ($.browser.msie && parseInt($.browser.version) < 9)
					slideshowControls.hide();
				else
					slideshowControls.css('opacity', 0);
		}
		
		
		/**
		* Automatically creates the navigation buttons based on how many slides are in the slideshow
		*/
		function createNavigationButtons() {
			var numButtons = slides.length,
				container = $('<div class="navigation-buttons"></div>').appendTo(slideWrapper),
				containerLeft = $('<div class="left"></div>').appendTo(container),
				containerMiddle = $('<div class="middle"></div>').appendTo(container),
				containerRight = $('<div class="right"></div>').appendTo(container),
				navigationButtons = $('<div class="buttons"></div>').appendTo(containerMiddle);
			
			for (var i = 0; i < numButtons; i++) {
				var button = $('<a rel="' + i + '"></a>').appendTo(navigationButtons);
				
				if (self.settings.navigationButtonsNumbers) {
					var number = $('<div class="number">' + (i + 1) + '</div>').appendTo(button);
				}
				
				button.hover(function() {
								var index = $(this).attr('rel');
								
								if (!$(this).hasClass('select'))
									$(this).addClass('over');						
								
								if (self.settings.thumbnailsType == 'tooltip')
									showThumbnail(index);
							},
				
							function() {
								if (!$(this).hasClass('select'))
									$(this).removeClass('over');
									
								if (self.settings.thumbnailsType == 'tooltip')
									hideThumbnail();
							});
				
				button.click(function() {
						gotoSlide(parseInt($(this).attr('rel')));
				});
			}
			
			
			// if true, the buttons container will be horizontally positioned in the middle of the slide
			// if false, the container will be posistioned based on the value of the 'left' property specified in the CSS
			if (self.settings.navigationButtonsContainerCenter) {
				var leftPos = (slideWrapper.innerWidth() - container.outerWidth(true)) / 2;			
				container.css('left', leftPos);
			}
			
			
			// if true, the buttons will be horizontally positioned in the middle of the container
			// if false, the buttons will be posistioned based on the value of the 'left' property specified in the CSS
			if (self.settings.navigationButtonsCenter) {
				var leftPos = (containerMiddle.outerWidth(true) - navigationButtons.outerWidth(true)) / 2;			
				navigationButtons.css('left', leftPos);
			}
			
			
			// reset the size of the slider
			var buttonsPosition = parseInt(container.css('top')) + container.outerHeight(true),
				extraHeight = slider.outerHeight() < buttonsPosition ? buttonsPosition - slider.outerHeight() : 0;
				
			slider.css('height', slider.outerHeight() + extraHeight);
			
			
			if (self.settings.fadeNavigationButtons) {
				if ($.browser.msie && parseInt($.browser.version) < 9)
					container.hide();
				else
					container.css('opacity', 0);
				
				
				slider.hover(function() {
								if ($.browser.msie && parseInt($.browser.version) < 9) 
									container.show();
								else 	
									container.stop().animate({'opacity': 1}, self.settings.navigationButtonsShowDuration);
							 },
													
							 function() {
							 	if ($.browser.msie && parseInt($.browser.version) < 9) 
									container.hide();
								else	
									container.stop().animate({'opacity': 0}, self.settings.navigationButtonsHideDuration);
							 });
			}
		}
		
		
		/**
		* Creates the shadow
		*/
		function createShadow() {			
			var shadow = $('<div class="shadow"></div>').appendTo(slider),
				shadowLeft = $('<div class="shadow-left"></div>').appendTo(shadow),
				shadowMiddle = $('<div class="shadow-middle"></div>').appendTo(shadow),
				shadowRight = $('<div class="shadow-right"></div>').appendTo(shadow);
			
			shadow.css({'width': slideWrapper.outerWidth(), 'top': slideWrapper.outerHeight()});
				
			var middleWidth = shadow.outerWidth() - shadowLeft.outerWidth() - shadowRight.outerWidth();
			
			shadowMiddle.css('width', middleWidth);
			
			
			// reset the size of the slider
			var shadowPosition = parseInt(shadow.css('top')) + shadow.outerHeight() + parseInt(shadow.css('margin-top')),
				extraHeight = slider.outerHeight() < shadowPosition ? shadowPosition - slider.outerHeight() : 0;			
				
			slider.css('height', slider.outerHeight() + extraHeight);
		}
		
		
		
		/**
		* Shows the thumbnail for the specified index
		*/
		function showThumbnail(index) {
			// check if a thumbnail image was specified
			if (!slides[index].thumbnail)
				return;
			
			// holds a reference to the navigation button that is rolled over
			var button = slideWrapper.find('.navigation-buttons a').eq(index),
			
				// the path to the thumbnail image
				thumbnailPath = slides[index].thumbnail,
				thumbnail = $('<div class="thumbnail"></div>').css({'width':self.settings.thumbnailWidth, 'height':self.settings.thumbnailHeight})
															  .appendTo(slider.find('.navigation-buttons .buttons')),
				
				// calculate the position of the thumbnail image
				leftPos = parseInt(button.position().left) - (parseInt(thumbnail.outerWidth(true)) - parseInt(button.css('width'))) / 2,
				topPos = parseInt(button.position().top) - (parseInt(thumbnail.outerHeight(true)));
			
			thumbnail.css({'left':leftPos, 'top':topPos - self.settings.thumbnailSlideAmount, 
						   'opacity':0});
			
			// load the image using the <img> tag and when it's completely assign it as a background to the thumbnail DIV
			$('<img/>').load(function() {
								 thumbnail.css('background-image','url('+ thumbnailPath +')');
							 })
					   .attr('src', thumbnailPath);
									
			thumbnail.animate({'top':topPos, 'opacity':1}, 
							  self.settings.thumbnailSlideDuration, 
							  self.settings.thumbnailSlideEasing);
							  
			// add caption to the thumbnail				  
			if (slides[index].thumbnailCaption) {
					var	thumbnailCaption = $('<div class="caption"></div>').appendTo(thumbnail),																					 
						thumbnailCaptionBackground = $('<div class="background"></div>').appendTo(thumbnailCaption),
						thumbnailCaptionContent = $('<div class="content">' + slides[index].thumbnailCaption + '</div>').appendTo(thumbnailCaption);						
						
					thumbnailCaption.css('height', thumbnailCaptionContent.outerHeight(true));
						
					// set the initial position of the caption	
					if (self.settings.thumbnailCaptionPosition == 'top')
						thumbnailCaption.css({'top': 0});
					else
						thumbnailCaption.css({'bottom': 0});
				}
		}
		
		
		/**
		* Hides the visible thumbnail
		*/
		function hideThumbnail() {
			// check if there is a visible thumbnail
			var thumbnail = slider.find('.navigation-buttons .thumbnail');
			if (!thumbnail)
				return;
				
			thumbnail.animate({'top':parseInt(thumbnail.css('top')) - self.settings.thumbnailSlideAmount, 'opacity':0}, 
							  self.settings.thumbnailSlideDuration, 
							  self.settings.thumbnailSlideEasing, 
							  function(){thumbnail.remove();})
		}		
		
		
		/**
		* Opens the slide with the specified index
		*/
		function gotoSlide(index) {
				
			// if the slider is already in the transition phase
			if (isTransition) {
				if (self.settings.overrideTransition) {
					stopSlideshow();
					endTransition();
				} else {
					return;
				}
			}
			
			// if the slideshow mode is on, stop the slideshow timer
			if (self.settings.slideshow)
				stopSlideshow();
			
			// remove the caption
			if (isCaption)
				removeCaption();
					
			isTransition = true;
			previousIndex = currentIndex;
			currentIndex = index;
			
			// an object that contains all the data for the current slide
			var slideData = slides[currentIndex];
			
			// first load the image using the <img> tag and when it is completely loaded, start the transition
			if (slideData.path) {
				showPreloader();
				$('<img/>').load(function() {	
								slideData.width = $(this).attr('width') || $(this).prop('width');
								slideData.height = $(this).attr('height') || $(this).prop('height');
								
								hidePreloader();
								startTransition();
							})
						   .error(function() {
								hidePreloader();
								isTransition = false;
								
								if (currentIndex > previousIndex)
									nextSlide();
								else
									previousSlide();
							})
						   .attr('src', slideData.path);
			} else {
				slideData.width = self.settings.width;
				slideData.height = self.settings.height;
				startTransition();
			}
			
			
			if (self.settings.navigationButtons) {
				// highlight the button that corresponds to the current slide
				// and remove the highlight from the previously selected button
				var navigationButtons = slider.find('.navigation-buttons');
				
				navigationButtons.find('.select').removeClass('select');
				navigationButtons.find('a').eq(index).attr('class', 'select');	
			}
			
			if (self.settings.thumbnailsType == 'navigation') {				
				// highlight the thumbnail that corresponds to the current slide
				// and remove the highlight from the previously selected thumbnail
				navigationThumbnails.find('.thumbnail.select').removeClass('select');
				navigationThumbnails.find('a').eq(index).removeClass('over').addClass('select');
				
				if (self.settings.thumbnailSync) {
					var thumbnailPage = Math.floor(index / self.settings.visibleThumbnails);
					
					if (thumbnailPage != currentThumbnailPage)
						scrollToThumbnailPage(thumbnailPage);
				}
			}
			
			
			// fire the 'slideOpen' event
			var eventObject = {type: 'slideOpen', index:currentIndex, data:slides[currentIndex]};
			$.isFunction(self.settings.slideOpen) && self.settings.slideOpen.call(this, eventObject);
		}
		
		
		/**
		* Opens the next slide
		*/
		function nextSlide() {				
			var index = (currentIndex == slides.length - 1) ? 0 : (currentIndex + 1);
			gotoSlide(index);
		}
		
		
		/**
		* Opens the previous slide
		*/
		function previousSlide() {
			var index = currentIndex == 0 ? (slides.length - 1) : (currentIndex - 1);
			gotoSlide(index);
		}
		
		
		/**
		* Shows the main preloader
		*/
		function showPreloader() {
			var preloader = $('<div class="preloader"></div>').hide()
										   				      .appendTo(slider),
				
				// calculate the preloader's position
				preloaderLeft = ((slideWrapper.outerWidth(true) -preloader.outerWidth(true)) * 0.5),
				preloaderTop = ((slideWrapper.outerHeight(true) - preloader.outerHeight(true)) * 0.5);
			
			preloader.delay(100).fadeIn(300);
			preloader.css({'left':preloaderLeft, 'top':preloaderTop});
		}
		
		
		/**
		* Hides the main preloader
		*/
		function hidePreloader() {
			slider.find('.preloader').stop().remove();
		}
		
		
		/**
		* Starts the transition
		*/
		function startTransition() {
			// get all the data of the new slide
			var slideData = slides[currentIndex],
				properties = slideData.properties,			
				alignType = properties.alignType,
				htmlDuringTransition = properties.htmlDuringTransition,
				horizontalSlices = parseInt(properties.horizontalSlices),
				verticalSlices = parseInt(properties.verticalSlices),
				slicePattern = properties.slicePattern,
				effectType = properties.effectType,
				slicePoint = properties.slicePoint,
				slideStartPosition = properties.slideStartPosition,
				slideStartRatio = parseFloat(properties.slideStartRatio),
				sliceDuration = parseInt(properties.sliceDuration),
				sliceEasing = properties.sliceEasing,
				sliceDelay = parseInt(properties.sliceDelay),
				sliceFade = (properties.sliceFade == true || effectType == 'fade') ? 0 : 1,
				simpleSlideDirection = properties.simpleSlideDirection,
				simpleSlideDuration = properties.simpleSlideDuration,
				simpleSlideEasing = properties.simpleSlideEasing;
				fadePreviousSlide = properties.fadePreviousSlide;
				fadePreviousSlideDuration = properties.fadePreviousSlideDuration;
				
			
			if (!self.settings.initialEffect && firstTransition) {
				effectType = 'none';
			}
			
			
			// destroy all running animations	
			if (currentSlideDiv && effectType == 'simpleSlide')
				if(currentSlideDiv.is(':animated')) {
					currentSlideDiv.appendTo(slideWrapper);
					currentSlideDiv.stop().css({'top':0, 'left':0});
					slideWrapper.find('.simple-slide-container').remove();
				}
			
			// checks if there is currently a slide
			// this will be false only when the first slide is opened
			if (previousIndex != -1) {
				// set the previous slide at a lower z-index postion
				var zIndex = slider.find('.slide').css('z-index');
				previousSlideDiv = slider.find('.slide').css('z-index', zIndex - 1);
				
				var previousWidth = slides[previousIndex].width,
					previousHeight = slides[previousIndex].height,
				
					currentWidth = slideData.width,
					currentHeight = slideData.height;
				
				// if the old slide has a bigger size than the new one, fade out the old slide
				if (effectType != "simpleSlide" && 
				   ((fadePreviousSlide == true) || (currentWidth < self.settings.width && currentWidth < previousWidth) || (currentHeight < self.settings.height && currentHeight < previousHeight))) {
					previousSlideDiv.fadeOut(fadePreviousSlideDuration);	
				}
			}
			
			// create the new slide DIV
			currentSlideDiv = $('<div class="slide"></div>').appendTo(slideWrapper);
			
			// show/hide the arrows, the slideshow buttons and the timer animation on hover
			// fire the events
			currentSlideDiv.hover(function() {
									var eventObject = {type: 'slideMouseOver', index:currentIndex, data:slideData};
									$.isFunction(self.settings.slideMouseOver) && self.settings.slideMouseOver.call(this, eventObject);
								},
								
								function() {
									var eventObject = {type: 'slideMouseOut', index:currentIndex, data:slideData};
									$.isFunction(self.settings.slideMouseOut) && self.settings.slideMouseOut.call(this, eventObject);
								})
								.click(function() {
									var eventObject = {type: 'slideClick', index:currentIndex, data:slideData};
									$.isFunction(self.settings.slideClick) && self.settings.slideClick.call(this, eventObject);
								});	
			
			
			//calculate the width and height of the slices
			var	sliceWidth = Math.floor(Math.min(slideData.width, self.settings.width) / horizontalSlices),
				sliceHeight = Math.floor(Math.min(slideData.height, self.settings.height) / verticalSlices),
				
				//calcualte the background's offset based on the align type specified
				offsetBgLeft = (slideData.width > self.settings.width) ? getLeftOffset(alignType, slideData.width, self.settings.width) : 0,
				offsetBgTop = (slideData.height > self.settings.height) ? getTopOffset(alignType, slideData.height, self.settings.height) : 0,
				
				//calcualte the position offset based on the align type specified
				offsetPosLeft = (slideData.width < self.settings.width) ? Math.floor((self.settings.width - slideData.width) / 2) : 0,
				offsetPosTop = (slideData.height < self.settings.height) ? Math.floor((self.settings.height - slideData.height) / 2) : 0,
				
				initialSlices = [];
				
				
			if (properties.slideMask)
				currentSlideDiv.css('overflow', 'hidden');
			
			
			if (effectType == 'random') {
				var effects = ['scale', 'width', 'height', 'slide', 'fade', 'simpleSlide'];
				effectType = getRandom(effects);
			}
			
			
			if (effectType == 'none') {
				endTransition();
			} else if (effectType == 'simpleSlide') {
									
				// show the image as a background
				var container = $('<div class="simple-slide-container"></div>').css({'overflow': 'hidden',
																					 'position': 'absolute',
																					 'width': '100%', 'height': '100%'})
																			   .appendTo(slideWrapper)
				
				if (slideData.path)
					currentSlideDiv.css({'background-image': 'url(' + slideData.path + ')',
										 'background-position': (-offsetBgLeft + offsetPosLeft) + 'px' + ' ' + (-offsetBgTop + offsetPosTop) + 'px',
										 'background-repeat': 'no-repeat'})
								   .appendTo(container);
						
				if (slideData.html && htmlDuringTransition) {
					var htmlContent = useXML ? ($('<div>' + slideData.html + '</div>')).clone() : (slideData.html).clone();
					
					htmlContent.css({'left': 0, 'top': 0,
									 'width': self.settings.width, 'height': self.settings.height,
									 'overflow': 'hidden', 'position': 'absolute'});
				
					currentSlideDiv.html(htmlContent)
								   .appendTo(container);
				}
				
				
				if (previousSlideDiv)
					previousSlideDiv.appendTo(container);
				
				if (simpleSlideDirection == 'random') {
					var directions = ['autoHorizontal', 'autoVertical', 'rightToLeft', 'leftToRight', 'topToBottom', 'bottomToTop'];				
					simpleSlideDirection = getRandom(directions);
				}
				
				var endPosition = {},
					prop,
					value;
					
				switch (simpleSlideDirection) {
					case 'autoHorizontal':
						prop = 'left';
						value = (currentIndex > previousIndex) ? self.settings.width : - self.settings.width;
						break;
						
					case 'autoVertical':
						prop = 'top';
						value = (currentIndex > previousIndex) ? self.settings.height : - self.settings.height;
						break;
						
					case 'rightToLeft':
						prop = 'left';
						value = self.settings.width;
						break;
					
					case 'leftToRight':
						prop = 'left';
						value = - self.settings.width;
						break;
					
					case 'topToBottom':
						prop = 'top';
						value = - self.settings.height;
						break;
					
					case 'bottomToTop':
						prop = 'top';
						value = self.settings.height;
						break;
						
					default:
						prop = 'left';
						value = (currentIndex > previousIndex) ? self.settings.width : - self.settings.width;
				}
				
				
				currentSlideDiv.css(prop, value);
				
				endPosition[prop] = 0;
				
				currentSlideDiv.animate(endPosition, {duration: simpleSlideDuration,
													  easing: simpleSlideEasing,
													  complete: function() {
																	currentSlideDiv.appendTo(slideWrapper);
																	container.remove();
																	endTransition();
														   		},
													  step: function(currentValue) {
														  		if (previousSlideDiv)
														  			previousSlideDiv.css(prop, currentValue - value);
													  		}
										});
				
			} else {
				// create the slices
				for (var i = 0; i < horizontalSlices; i++) {
					for (var j = 0; j < verticalSlices; j++) {
						
						var slice = $('<div class="slice"></div>').css({'left': i * sliceWidth + offsetPosLeft, 'top': j * sliceHeight + offsetPosTop,
																	    'width': sliceWidth, 'height': sliceHeight,
																	    'opacity': sliceFade,
																		'visibility': 'hidden'})
																  .data({'hPos':i, 'vPos':j})
																  .appendTo(currentSlideDiv);
						
						if (slideData.path) {
							slice.css({'background-image': 'url(' + slideData.path + ')',
									   'background-position': - (i * sliceWidth + offsetBgLeft) + 'px' + ' ' + - (j * sliceHeight + offsetBgTop) + 'px',
									   'background-repeat': 'no-repeat'});
						}
						
						if (slideData.html && htmlDuringTransition) {
							var htmlContent = useXML ? ($('<div>' + slideData.html + '</div>')).clone() : (slideData.html).clone();
							htmlContent.css({'left': -i * sliceWidth, 'top': -j * sliceHeight,
											 'width': slideData.width, 'height': slideData.height,
											 'overflow': 'hidden',
											 'position': 'absolute'});
							
							slice.html(htmlContent)
								 .css('overflow', 'hidden');
						}
																  
						initialSlices.push(slice);
					}
				}	
				
				
				// if the 'random' value was specified for some of the properties, randomly select a new value from the list of available values
				
				if (slicePattern == 'random') {
					var patterns = ['randomPattern', 'topToBottom', 'bottomToTop', 'leftToRight', 'rightToLeft', 'topLeftToBottomRight', 'topRightToBottomLeft', 'bottomLeftToTopRight',
									'bottomRightToTopLeft', 'horizontalMarginToCenter', 'horizontalCenterToMargin', 'marginToCenter', 'verticalCenterToMargin', 'skipOneTopToBottom',
									'skipOneBottomToTop', 'skipOneLeftToRight', 'skipOneRightToLeft', 'skipOneHorizontal', 'skipOneVertical', 'spiralMarginToCenterCW', 
									'spiralMarginToCenterCCW', 'spiralCenterToMarginCW', 'spiralCenterToMarginCCW'];				
					slicePattern = getRandom(patterns);
				}
				
				if (horizontalSlices == 1 && verticalSlices == 1)
					slicePattern = 'topToBottom';
				
				if (slicePoint == 'random') {
					var points = ['leftTop', 'leftCenter', 'leftBottom', 'centerTop', 'centerCenter', 'centerBottom', 'rightTop', 'rightCenter', 'rightBottom'];				
					slicePoint = getRandom(points);
				}
				
				if (slideStartPosition == 'random') {
					var positions = ['left', 'right', 'top', 'bottom', 'leftTop', 'rightTop', 'leftBottom', 'horizontalAlternative', 'verticalAlternative'];
					slideStartPosition = getRandom(positions);
				}			
				
				// get the slices in a specific order, based on the slicePattern property
				var orderedSlices = getOrderedSlices(initialSlices, slicePattern, horizontalSlices, verticalSlices),			
					n  = orderedSlices.length;
				
				// animate all the slices
				for (var i = 0; i < n; i++) {						
					animateSlice(orderedSlices[i], i, n, effectType, slicePoint, slideStartPosition, slideStartRatio, sliceDuration, sliceEasing, sliceDelay);
				}
			}
			
			
			// fire the 'transitionStart' event
			var eventObject = {type: 'transitionStart', index:currentIndex, data:slideData};
			$.isFunction(self.settings.transitionStart) && self.settings.transitionStart.call(this, eventObject);
		}
		
		
		/**
		* This is called at the end of the transition
		*/
		function endTransition() {
			var slideData = slides[currentIndex],
			
				alignType = slideData.properties.alignType,
				offsetLeft = getLeftOffset(alignType, slideData.width, self.settings.width),
				offsetTop = getTopOffset(alignType, slideData.height, self.settings.height),
				effectType = slideData.properties.effectType,
				htmlDuringTransition = slideData.properties.htmlDuringTransition;
				
				
			isTransition = false;
			
			
			if (!self.settings.initialEffect && firstTransition) {
				firstTransition = false;
				
				if (slideData.path)
					currentSlideDiv.css({'background-image': 'url(' + slideData.path + ')',
										 'background-position': - offsetLeft + 'px' + ' ' + - offsetTop + 'px',
										 'background-repeat': 'no-repeat'});
			}
			
			
			if (effectType != 'simpleSlide') {					
				// remove all the slices
				currentSlideDiv.find('.slice').each(function(index) {
					clearTimeout($(this).data('timer'));
					$(this).remove();
				});				
				
				// show the image as a background
				if (slideData.path)
					currentSlideDiv.css({'background-image': 'url(' + slideData.path + ')',
										 'background-position': - offsetLeft + 'px' + ' ' + - offsetTop + 'px',
										 'background-repeat': 'no-repeat'});
			}
			
			
			if (slideData.html && (effectType != 'simpleSlide' || !htmlDuringTransition)) {
				var htmlContent = useXML ? $('<div>' + slideData.html + '</div>') : slideData.html;
				htmlContent.css({'left': 0, 'top': 0,
								 'width': self.settings.width, 'height': self.settings.height,
								 'overflow': 'hidden', 'position': 'absolute'});
								 
				currentSlideDiv.html(htmlContent);
			}
			
			
			// if a link was specified for this slide, make the slide clickable
			if (slideData.link) {
				currentSlideDiv.css('cursor', 'pointer');
				
				currentSlideDiv.click(function() {
					if ((slideData.link).substr(0, 1) == '#') {
						//window.location.href = slideData.link;
						$('html, body').animate({ scrollTop: $(slideData.link).offset().top }, 700);
					} else {
						window.open(slideData.link, slideData.properties.linkTarget);
					}
				});
			}
			
			
			// if lightbox is enabled and lightbox content was specified
			if (self.settings.lightbox && slideData.lightbox) {
				// display the pointer
				currentSlideDiv.css('cursor', 'pointer');
				
				currentSlideDiv.click(function() {
					if (self.settings.slideshow && slideshowState != 'stop')
						pauseSlideshow();	
					
					isLightbox = true;
					
					var currentPosition = slideData.lightbox.lightbox_index;
						
					// get the settings specified for this slide
					$.prettyPhoto.changeSettings({default_width: slideData.properties.lightboxDefaultWidth, 
												  default_height: slideData.properties.lightboxDefaultHeight, 
												  theme: slideData.properties.lightboxTheme, 
												  opacity: slideData.properties.lightboxOpacity, 
												  horizontal_padding: slideData.properties.lightboxHorizontalPadding,
												  current_position: self.settings.lightboxNavigation ? currentPosition : -1});
					
					// open the lightbox
					if (self.settings.lightboxNavigation)
						$.prettyPhoto.open(prettyPhotoContent, prettyPhotoTitle, prettyPhotoDescription);
					else
						$.prettyPhoto.open(prettyPhotoContent[currentPosition], prettyPhotoTitle[currentPosition], prettyPhotoDescription[currentPosition]);
					
				});
				
			}
			
			
			// remove the previous slide
			if (previousSlideDiv)
				previousSlideDiv.remove();
				
			// restart the slideshow
			if (self.settings.slideshow && slideshowState != 'stop')
				startSlideshow();
			
			if (self.settings.slideshow && self.settings.pauseSlideshowOnHover && isHover)
				pauseSlideshow();
			
			// if a caption was specified for this slide, create it
			if (slideData.caption)
				createCaption();
				
			// fire the 'transitionComplete' event
			var eventObject = {type: 'transitionComplete', index:currentIndex, data:slideData};
			$.isFunction(self.settings.transitionComplete) && self.settings.transitionComplete.call(this, eventObject);
		}
		
		
		/**
		* Returns a random element from an array
		*/
		function getRandom(array) {
			return	array[Math.floor((Math.random() * array.length))];
		}
		
		
		/**
		* Animates the individual slice
		*/
		function animateSlice(slice, i, n, effectType, slicePoint, slideStartPosition, slideStartRatio, sliceDuration, sliceEasing, sliceDelay) {
			// contains the starting values for the slice's properties
			var startState = new Object(),
			
				// contains the ending values for the slice's properties
				endState = new Object(),
				
				// assign values to the ending properties
				endWidth = parseInt(slice.css('width')),
				endHeight = parseInt(slice.css('height')),				
				endLeft = parseInt(slice.css('left')),
				endTop = parseInt(slice.css('top')),
			
				startLeft, startTop, startWidth = 0, startHeight = 0;
			
			// assign values to the starting left and top position based on the set effect type
			if (effectType == 'scale' || effectType == 'width' || effectType == 'height') {
				switch (slicePoint) {
					case 'centerCenter':
						startTop = endTop + endHeight * 0.5;
						startLeft = endLeft + endWidth * 0.5;
						break;	
						
					case 'rightCenter':
						startTop = endTop + endHeight * 0.5;
						startLeft = endLeft + endWidth;
						break;	
						
					case 'leftCenter':
						startTop = endTop + endHeight * 0.5;
						startLeft = endLeft;
						break;	
						
					case 'centerTop':
						startTop = endTop;
						startLeft = endLeft + endWidth * 0.5;
						break;	
						
					case 'rightTop':
						startTop = endTop;
						startLeft = endLeft + endWidth;
						break;	
						
					case 'leftTop':
						startTop = endTop;
						startLeft = endLeft;
						break;	
						
					case 'centerBottom':
						startTop = endTop + endHeight;
						startLeft = endLeft + endWidth * 0.5;
						break;	
						
					case 'rightBottom':
						startTop = endTop + endHeight;
						startLeft = endLeft + endWidth;
						break;	
						
					case 'leftBottom':
						startTop = endTop + endHeight;
						startLeft = endLeft;
						break;	
						
					default:
						startTop = endTop + endHeight * 0.5;
						startLeft = endLeft + endWidth * 0.5;
				}
			} else if (effectType == 'slide') {
				switch (slideStartPosition) {
					case 'left':
						startTop = endTop;
						startLeft = endLeft - endWidth * slideStartRatio;
						break;	
						
					case 'right':
						startTop = endTop;
						startLeft = endLeft + endWidth * slideStartRatio;
						break;	
						
					case 'top':
						startTop = endTop - endHeight * slideStartRatio;
						startLeft = endLeft;
						break;	
						
					case 'bottom':
						startTop = endTop + endHeight * slideStartRatio;
						startLeft = endLeft;
						break;	
						
					case 'leftTop':
						startTop = endTop - endHeight * slideStartRatio;
						startLeft = endLeft - endWidth * slideStartRatio;
						break;	
						
					case 'rightTop':
						startTop = endTop - endHeight * slideStartRatio;
						startLeft = endLeft + endWidth * slideStartRatio;
						break;	
						
					case 'leftBottom':
						startTop = endTop + endHeight * slideStartRatio;
						startLeft = endLeft - endWidth * slideStartRatio;
						break;	
						
					case 'rightBottom':
						startTop = endTop + endHeight * slideStartRatio;
						startLeft = endLeft + endWidth * slideStartRatio;
						break;	
						
					case 'horizontalAlternative':
						startTop = endTop;
						startLeft = endLeft + endWidth * slideStartRatio * (i % 2 == 0 ? 1 : -1);
						break;	
						
					case 'verticalAlternative':
						startTop = endTop + endHeight * slideStartRatio * (i % 2 == 0 ? 1 : -1);
						startLeft = endLeft;
						break;	
						
					default:
						startTop = endTop;
						startLeft = endLeft - endWidth * slideStartRatio;
				}
			}
			
			
			// assign values to the starting and ending states based on the set effect type
			switch (effectType) {
				case 'fade':
					endState = {'opacity':1};
					break;
					
				case 'scale':
					startState = {'width':startWidth, 'height':startHeight, 'left':startLeft, 'top':startTop};
					endState = {'width':endWidth, 'height':endHeight, 'left':endLeft, 'top':endTop, 'opacity':1};
					break;
					
				case 'width':
					startState = {'width':startWidth, 'left':startLeft};
					endState = {'width':endWidth, 'left':endLeft, 'opacity':1};
					break;
					
				case 'height':
					startState = {'height':startHeight, 'top':startTop};
					endState = {'height':endHeight, 'top':endTop, 'opacity':1};
					break;
					
				case 'slide':
					startState = {'left':startLeft, 'top':startTop};
					endState = {'left':endLeft, 'top':endTop, 'opacity':1};
					break;
					
				default:
					endState = {'opacity':1};					
			}			
			
			// assign the starting state to the slice
			slice.css(startState);
			
			// animate the slice to the ending state
			var sliceTimer = setTimeout(function(){
											slice.css('visibility', 'visible');
											slice.animate(endState, sliceDuration, sliceEasing, function(){ //if the last slice was animated, call the enTransition function
																									 if (i == n - 1) 
																										endTransition();
																								  })},
										i * sliceDelay);
			slice.data('timer', sliceTimer);
		}
		
		
		/**
		* Creates the caption
		*/
		function createCaption() {
			isCaption = true;
			
			var slideData = slides[currentIndex],
				properties = slideData.properties,
				captionBackgroundOpacity = properties.captionBackgroundOpacity,
				captionBackgroundColor = properties.captionBackgroundColor;
				
			var captionContainer = $('<div class="caption"></div>').appendTo(slideWrapper),
				captionWrapper = $('<div class="wrapper"></div>').appendTo(captionContainer),
				captionBackground = $('<div class="background"></div>').css({'opacity': captionBackgroundOpacity, 'background-color': captionBackgroundColor})
																	   .appendTo(captionWrapper),
				captionContent = $('<div class="content"></div>').html(slideData.caption)
											 					 .appendTo(captionWrapper);
			
			if (!self.settings.hideCaption || (self.settings.hideCaption && isHover))
				showCaption();
		}
		
		
		/**
		* Removes the caption
		*/
		function removeCaption() {
			isCaption = false;
			hideCaption(true);			
		}
		
		
		/**
		* Shows the caption
		*/
		function showCaption() {
			// get the specified values for the current caption
			var slideData = slides[currentIndex],
				properties = slideData.properties,
				
				captionPosition = properties.captionPosition,
				captionSize = parseInt(properties.captionSize),
				captionWidth = parseInt(properties.captionWidth),
				captionHeight = parseInt(properties.captionHeight),
				captionLeft = parseInt(properties.captionLeft),
				captionTop = parseInt(properties.captionTop),
				
				captionShowEffect = properties.captionShowEffect,
				captionShowEffectDuration = parseInt(properties.captionShowEffectDuration),				
				captionShowEffectEasing = properties.captionShowEffectEasing,
				captionShowSlideDirection = properties.captionShowSlideDirection,
			
				currentWidth = Math.min(slideData.width, self.settings.width),
				currentHeight = Math.min(slideData.height, self.settings.height),
			
				containerWidth = (captionPosition == "custom") ? captionWidth : currentWidth,
				containerHeight = (captionPosition == "custom") ? captionHeight : currentHeight,
				containerLeft = (captionPosition == "custom") ? captionLeft : (self.settings.width - containerWidth) / 2,
				containerTop = (captionPosition == "custom") ? captionTop : (self.settings.height - containerHeight) / 2,			
			
				captionContainer = slideWrapper.find('.caption'),
				captionWrapper = captionContainer.find('.wrapper'),
				captionBackground = captionWrapper.find('.background'),
				captionContent = captionWrapper.find('.content'),
				
				captionBackgroundOpacity = properties.captionBackgroundOpacity,
				captionBackgroundColor = properties.captionBackgroundColor,
				
				initialPosition = captionShowEffect == "fade" ? 0 : captionSize,
				endState = {};			
			
			
			switch (captionPosition) {
				case 'left':
					captionContainer.css({'width': captionSize, 'height': containerHeight, 'left': containerLeft, 'top': containerTop});
					if (captionShowSlideDirection == 'auto')
						captionWrapper.css({'width': captionSize, 'height': containerHeight, 'left': -initialPosition, 'top': 0});
					break;
					
				case 'right':
					captionContainer.css({'width': captionSize, 'height': containerHeight, 'right': containerLeft, 'top': containerTop});
					if (captionShowSlideDirection == 'auto')
						captionWrapper.css({'width': captionSize, 'height': containerHeight, 'left': initialPosition, 'top': 0});
					break;
					
				case 'top':
					captionContainer.css({'width':containerWidth, 'height': captionSize, 'left': containerLeft, 'top': containerTop});
					if (captionShowSlideDirection == 'auto')
						captionWrapper.css({'width':containerWidth, 'height': captionSize, 'left': 0, 'top': -initialPosition});
					break;
					
				case 'bottom':
					captionContainer.css({'width': containerWidth, 'height': captionSize, 'left': containerLeft, 'bottom': containerTop});
					if (captionShowSlideDirection == 'auto')
						captionWrapper.css({'width': containerWidth, 'height': captionSize, 'left': 0, 'top': initialPosition});
					break;
					
				case 'custom':
					captionContainer.css({'width': containerWidth, 'height': containerHeight, 'left': containerLeft, 'top': containerTop});
					captionWrapper.css({'width': containerWidth, 'height': containerHeight, 'left': 0, 'top': 0});
					break;
					
				case 'default':
					captionContainer.css({'width': containerWidth, 'height': captionSize, 'left': containerLeft, 'bottom': containerTop});
					if (captionShowSlideDirection == 'auto')
						captionWrapper.css({'width': containerWidth, 'height': captionSize, 'left': 0, 'top': initialPosition});
					break;
			}
					
			if (captionShowEffect == "fade") {				
				if ($.browser.msie && parseInt($.browser.version) < 9) {
					if ($.browser.version != '6.0') {
						captionContent.css({'opacity': 0});
						captionContent.animate({'opacity': 1}, captionShowEffectDuration, captionShowEffectEasing, function(){captionContent.css('filter', '')});
						
						captionBackground.css({'opacity': 0});
						captionBackground.animate({'opacity': captionBackgroundOpacity}, captionShowEffectDuration, captionShowEffectEasing);
					} else {
						captionWrapper.css('opacity', 1);
						captionContent.css('opacity', 1);
						captionBackground.css('opacity', 1);
						captionWrapper.css('background-color', captionBackgroundColor);
					}
				} else {
					captionWrapper.css({'opacity': 0});
					captionWrapper.animate({'opacity': 1}, captionShowEffectDuration, captionShowEffectEasing);
				}				
			} else {
				captionWrapper.css({'opacity': 1});
				captionContent.css('opacity', 1);
				captionBackground.css('opacity', captionBackgroundOpacity);
				
				if (captionPosition == 'custom')
					captionContainer.css({'width': containerWidth, 'height': containerHeight, 'left': containerLeft, 'top': containerTop});
					
				if (captionShowSlideDirection == 'topToBottom')
					captionWrapper.css({'width':containerWidth, 'height': containerHeight, 'left': 0, 'top': -containerHeight});
				else if (captionShowSlideDirection == 'bottomToTop')
					captionWrapper.css({'width': containerWidth, 'height': containerHeight, 'left': 0, 'top': containerHeight});
				else if (captionShowSlideDirection == 'leftToRight')
					captionWrapper.css({'width': containerWidth, 'height': containerHeight, 'left': -containerWidth, 'top': 0});
				else if (captionShowSlideDirection == 'rightToLeft')
					captionWrapper.css({'width': containerWidth, 'height': containerHeight, 'left': containerWidth, 'top': 0});
				
				if ($.browser.msie && $.browser.version == '6.0')
					captionWrapper.css('background-color', captionBackgroundColor);
							
				captionWrapper.animate({'top':0, 'left':0}, captionShowEffectDuration, captionShowEffectEasing);
			}
			
		}
		
		
		/**
		* Hides the caption
		*/
		function hideCaption(remove) {
			
			var captionContainer = slideWrapper.find('.caption'),
				captionWrapper = captionContainer.find('.wrapper'),
				captionBackground = captionWrapper.find('.background'),
				captionContent = captionWrapper.find('.content'),
				properties = slides[currentIndex].properties,
				
				captionPosition = properties.captionPosition,
				captionHideEffect = properties.captionHideEffect,
				captionHideEffectDuration = parseInt(properties.captionHideEffectDuration),
				captionHideEffectEasing = properties.captionHideEffectEasing,
				captionHideSlideDirection = properties.captionHideSlideDirection;
				
			if (captionHideEffect == "fade") {
				if ($.browser.msie && parseInt($.browser.version) < 9) {
					if ($.browser.version != '6.0') {
						captionContent.animate({'opacity': 0}, captionHideEffectDuration, captionHideEffectEasing, function(){ if (remove) captionContainer.remove(); });						
						captionBackground.animate({'opacity': 0}, captionHideEffectDuration, captionHideEffectEasing);
					} else {
						captionContent.css('opacity', 0);
						captionBackground.css('opacity', 0);
						captionWrapper.css('opacity', 0);
						if (remove) 
							captionContainer.remove();
					}
				} else {
					captionWrapper.animate({'opacity': 0}, captionHideEffectDuration, captionHideEffectEasing, function(){ if (remove) captionContainer.remove(); });
				}
				
			} else {
				
				if (captionHideSlideDirection == 'topToBottom')
					captionWrapper.animate({'top': parseInt(captionWrapper.css('height'))}, captionHideEffectDuration, function(){ if (remove) captionContainer.remove(); });
				else if (captionHideSlideDirection == 'bottomToTop')
					captionWrapper.animate({'top': - parseInt(captionWrapper.css('height'))}, captionHideEffectDuration, function(){ if (remove) captionContainer.remove(); });
				else if (captionHideSlideDirection == 'leftToRight')
					captionWrapper.animate({'left': parseInt(captionWrapper.css('width'))}, captionHideEffectDuration, function(){ if (remove) captionContainer.remove(); });
				else if (captionHideSlideDirection == 'rightToLeft')
					captionWrapper.animate({'left': - parseInt(captionWrapper.css('width'))}, captionHideEffectDuration, function(){ if (remove) captionContainer.remove(); });
				else if (captionHideSlideDirection == 'auto')
					switch (captionPosition) {
						case 'left':
							captionWrapper.animate({'left': - parseInt(captionWrapper.css('width'))}, captionHideEffectDuration, function(){ if (remove) captionContainer.remove(); });
							break;
							
						case 'right':
							captionWrapper.animate({'left': parseInt(captionWrapper.css('width'))}, captionHideEffectDuration, function(){ if (remove) captionContainer.remove(); });
							break;
							
						case 'top':
							captionWrapper.animate({'top': - parseInt(captionWrapper.css('height'))}, captionHideEffectDuration, function(){ if (remove) captionContainer.remove(); });
							break;
							
						case 'bottom':
							captionWrapper.animate({'top': parseInt(captionWrapper.css('height'))}, captionHideEffectDuration, function(){ if (remove) captionContainer.remove(); });
							break;
							
						case 'custom':
							captionWrapper.animate({'top': parseInt(captionWrapper.css('height'))}, captionHideEffectDuration, function(){ if (remove) captionContainer.remove(); });
							break;
							
						case 'default':
							captionWrapper.animate({'top': parseInt(captionWrapper.css('height'))}, captionHideEffectDuration, function(){ if (remove) captionContainer.remove(); });
							break;
					}
			}
		}
		
		
		/**
		* Starts the slideshow
		*/
		function startSlideshow() {
			var delay = slides[currentIndex].properties.slideshowDelay || self.settings.slideshowDelay;
			
			if (self.settings.timerAnimation)
				startTimerAnimation(delay);
				
			slideshowTimerPosition = 0;
			slideshowStartTime = (new Date()).getTime();
			
			if (slideshowTimer)
				clearTimeout(slideshowTimer);
				
			slideshowTimer = setTimeout(function() {
				if (self.settings.slideshowDirection == 'next')
					nextSlide();
				else if (self.settings.slideshowDirection == 'previous')
					previousSlide();
			}, delay);
		}
		
		
		/**
		* Stops the slideshow
		*/
		function stopSlideshow() {			
			if (slideshowTimer)
				clearTimeout(slideshowTimer);
				
			if (self.settings.timerAnimation)
				stopTimerAnimation();
		}
		
		
		/**
		* Pauses the slideshow
		*/
		function pauseSlideshow() {				
			if (slideshowTimer)
				clearTimeout(slideshowTimer);
				
			slideshowTimerPosition += (new Date()).getTime() - slideshowStartTime;
		}
		
		
		/**
		* Resumes the slideshow
		*/
		function resumeSlideshow() {
			var delay = slides[currentIndex].properties.slideshowDelay || self.settings.slideshowDelay;
			
			slideshowStartTime = (new Date()).getTime();
			
			if (slideshowTimer)
				clearTimeout(slideshowTimer);
				
			slideshowTimer = setTimeout(function() {
				if (self.settings.slideshowDirection == 'next')
					nextSlide();
				else if (self.settings.slideshowDirection == 'previous')
					previousSlide();
			}, delay - slideshowTimerPosition);
		}
		
		
		/**
		* Creates the timer animation
		*/
		function startTimerAnimation(delay) {
			// create a canvas element
			var timerCanvas = document.createElement('canvas'),
			
				// calculate the diagonal of the timer based on the strokes's width and the specified radius
				timerSize = Math.max(self.settings.timerStrokeWidth1, self.settings.timerStrokeWidth2) + self.settings.timerRadius * 2,
				
				// calculate the center of the timer
				timerPosition = timerSize / 2,
				
				// used to transform degrees in radians
				radians = Math.PI / 180,
				
				// the current angle of the animated circle
				angle = 0,
				
				// will be used how much time has passed since the animation started
				currentTime,
				timePassed,
				
				// values for the color and opacity of the timer
				strokeOpacity1 = self.settings.timerStrokeOpacity1,
				strokeOpacity2 = self.settings.timerStrokeOpacity2,
				strokeRed1 = hexToRGB(self.settings.timerStrokeColor1).red,
				strokeGreen1 = hexToRGB(self.settings.timerStrokeColor1).green,					
				strokeBlue1 = hexToRGB(self.settings.timerStrokeColor1).blue,
				strokeRed2 = hexToRGB(self.settings.timerStrokeColor2).red,
				strokeGreen2 = hexToRGB(self.settings.timerStrokeColor2).green,					
				strokeBlue2 = hexToRGB(self.settings.timerStrokeColor2).blue;
				
				
			timerCanvas.width = timerCanvas.height = timerSize;
			
			// add the canvas to the slider
			$(timerCanvas).attr('class', 'timer-animation')
						  .appendTo(slideWrapper);
						  
			if (self.settings.fadeTimer && !isHover) {
				$(timerCanvas).css('opacity', 0);
			} else {
				// fade in the canvas
				if (!($.browser.msie && parseInt($.browser.version) < 9))
					$(timerCanvas).css({'opacity':0})
								  .stop().animate({'opacity':1}, self.settings.timerFadeDuration);	
			}
			
			// IE8 and earlier versions don't support 'canvas', so a 3rd parth library is used: excanvas.js
			if ($.browser.msie && parseInt($.browser.version) < 9)
				timerCanvas = G_vmlCanvasManager.initElement(timerCanvas);
				
			var	ctx = timerCanvas.getContext("2d");	
			
			// draw the underlying circle
			ctx.beginPath();
			ctx.lineWidth = self.settings.timerStrokeWidth1;
			ctx.strokeStyle = 'rgba(' + strokeRed1 + ', ' + strokeGreen1 + ', ' + strokeBlue1 + ', ' + strokeOpacity1 + ')';	
			ctx.arc(timerPosition, timerPosition, self.settings.timerRadius, 0, 2 * Math.PI, false);
			ctx.stroke();
				
				
			timerAnimationTimer = setInterval(function() {
				if (angle <= 360 && !((self.settings.pauseSlideshowOnHover && isHover) || isLightbox)) {
					
					currentTime = (new Date()).getTime();
					timePassed = (currentTime - slideshowStartTime);
					
					// calculate the angle on the circle based on how much time has passed
					angle = ((slideshowTimerPosition + timePassed) / delay) * 360 + 1;
					if (angle > 360) 
						angle = 360;
					
					// clear the canvas
					timerCanvas.width = timerCanvas.width;
					
					// draw the underlying circle
					ctx.beginPath();
					ctx.lineWidth = self.settings.timerStrokeWidth1;
					ctx.strokeStyle = 'rgba(' + strokeRed1 + ', ' + strokeGreen1 + ', ' + strokeBlue1 + ', ' + strokeOpacity1 + ')';	
					ctx.arc(timerPosition, timerPosition, self.settings.timerRadius, 0, 2 * Math.PI, false);
					ctx.stroke();
					
					// draw the animated circle
					ctx.beginPath();
					ctx.lineWidth = self.settings.timerStrokeWidth2;
					ctx.strokeStyle = 'rgba(' + strokeRed2 + ', ' + strokeGreen2 + ', ' + strokeBlue2 + ', ' + strokeOpacity2 + ')';				
					ctx.arc(timerPosition, timerPosition, self.settings.timerRadius, 0, angle * radians, false);
					ctx.stroke();
				}
			}, 20);
		}
		
		
		/**
		* Stops the timer animation and removes the canvas
		*/
		function stopTimerAnimation() {
			if (timerAnimationTimer)
				clearInterval(timerAnimationTimer);
			
			var timerCanvas = slider.find('.timer-animation');
			
			if (timerCanvas) {
				if (!($.browser.msie && parseInt($.browser.version) < 9))
					timerCanvas.stop().animate({'opacity':0}, self.settings.timerFadeDuration, function(){timerCanvas.remove();});
				else
					timerCanvas.remove();
			}
		}
		
		
		/**
		* Returns the left offset of the slide based on the specified align type, and the difference between the slider's specified width and the slide's actual width
		*/
		function getLeftOffset(alignType, fullWidth, setWidth) {
			var left = 0;
			
			if (alignType == 'centerTop' || alignType == 'centerCenter' || alignType == 'centerBottom' || fullWidth < setWidth)
				left = Math.floor((fullWidth - setWidth) / 2);
			else if (alignType == 'rightTop' || alignType == 'rightCenter' || alignType == 'rightBottom')
				left = fullWidth - setWidth;
			
			return left;
		}
		
		
		
		/**
		* Returns the top offset of the slide based on the specified align type, and the difference between the slider's specified height and the slide's actual height
		*/
		function getTopOffset(alignType, fullHeight, setHeight) {
			var top = 0;
			
			if (alignType == 'leftCenter' || alignType == 'centerCenter' || alignType == 'rightCenter' || fullHeight < setHeight)
				top = Math.floor((fullHeight - setHeight) / 2);
			else if (alignType == 'leftBottom' || alignType == 'centerBottom' || alignType == 'rightBottom')
				top = fullHeight - setHeight;
			
			return top;
		}
		
		
		
		/**
		* Creates the navigation thumbnails
		*/
		function createNavigationThumbnails() {
			var numThumbnails = slides.length;
			
			navigationThumbnails = $('<div class="navigation-thumbnails"></div>').appendTo(slider);
			thumbnailsVisibleContainer = $('<div class="visible-container"></div>').appendTo(navigationThumbnails);
			thumbnailsContainer = $('<div class="container"></div>').appendTo(thumbnailsVisibleContainer);			
						
			if (self.settings.thumbnailOrientation == "horizontal")
				navigationThumbnails.addClass('horizontal');
			else
				navigationThumbnails.addClass('vertical');
				
			totalThumbnailPages = Math.ceil(slides.length / self.settings.visibleThumbnails);
			
			for (var i = 0; i < numThumbnails; i++) {
				// create the thumbnail
				var thumbnail = $('<a class="thumbnail" rel="' + i + '"></a>').css({'width':self.settings.thumbnailWidth, 'height':self.settings.thumbnailHeight,
																					'background-image': 'url('+ slides[i].thumbnail +')'})
																			  .appendTo(thumbnailsContainer);
				
				// position the thumbnail
				if (self.settings.thumbnailOrientation == 'horizontal')
					thumbnail.css('left', i * thumbnail.outerWidth(true));
				else
					thumbnail.css('top', i * thumbnail.outerHeight(true));
					
				// create the thumbnail's caption
				if (slides[i].thumbnailCaption) {
					var	thumbnailCaption = $('<div class="caption"></div>').appendTo(thumbnail),																					 
						thumbnailCaptionBackground = $('<div class="background"></div>').appendTo(thumbnailCaption),
						thumbnailCaptionContent = $('<div class="content">' + slides[i].thumbnailCaption + '</div>').appendTo(thumbnailCaption);						
						
					thumbnailCaption.css('height', thumbnailCaptionContent.outerHeight(true));
						
					// set the initial position of the caption	
					if (self.settings.thumbnailCaptionPosition == 'top')
						thumbnailCaption.css({'top': 0});
					else
						thumbnailCaption.css({'bottom': 0});
						
					// change the caption's position, if the caption will be animated
					if (self.settings.hideThumbnailCaption)
						if (self.settings.thumbnailCaptionEffect == 'slide')
							if (self.settings.thumbnailCaptionPosition == 'top')
								thumbnailCaption.css({'top': -thumbnailCaption.outerHeight(true)});
							else
								thumbnailCaption.css({'bottom': -thumbnailCaption.outerHeight(true)});
						else
							thumbnailCaption.hide();
				}
				
				
				// change the thumbnail's style
				// hide/show the thumbnail's caption
				thumbnail.hover(function() {									
									if (!$(this).hasClass('select'))
										$(this).addClass('over');
										
									var thumbnailCaption = $(this).find('.caption');
									
									if (thumbnailCaption)
										if (self.settings.hideThumbnailCaption)
											if (self.settings.thumbnailCaptionEffect == 'slide')
												if (self.settings.thumbnailCaptionPosition == 'top')
													thumbnailCaption.stop().animate({'top': 0}, self.settings.thumbnailCaptionShowDuration);
												else
													thumbnailCaption.stop().animate({'bottom': 0}, self.settings.thumbnailCaptionShowDuration);
											else
												thumbnailCaption.stop(false, true).fadeIn(self.settings.thumbnailCaptionShowDuration, self.settings.thumbnailCaptionEasing);
												
									if (self.settings.thumbnailTooltip)
										showTooltip(parseInt($(this).attr('rel')));
								},
					
								function() {
									if (!$(this).hasClass('select'))
										$(this).removeClass('over');
										
									var thumbnailCaption = $(this).find('.caption');
									
									if (thumbnailCaption)
										if (self.settings.hideThumbnailCaption)
											if (self.settings.thumbnailCaptionEffect == 'slide')
												if (self.settings.thumbnailCaptionPosition == 'top')
													thumbnailCaption.stop().animate({'top': -thumbnailCaption.outerHeight(true)}, self.settings.thumbnailCaptionHideDuration, self.settings.thumbnailCaptionEasing);
												else
													thumbnailCaption.stop().animate({'bottom': -thumbnailCaption.outerHeight(true)}, self.settings.thumbnailCaptionHideDuration, self.settings.thumbnailCaptionEasing);
											else
												thumbnailCaption.stop(false, true).fadeOut(self.settings.thumbnailCaptionHideDuration, self.settings.thumbnailCaptionEasing);
												
									if (self.settings.thumbnailTooltip)
										hideTooltip();
								});
					
					
				thumbnail.click(function() {
									gotoSlide(parseInt($(this).attr('rel')));
								});
			}			
			
			
			// get the width and height of an individual thumbnail
			var thumbnailWidth = navigationThumbnails.find('.thumbnail').outerWidth(true),
				thumbnailHeight = navigationThumbnails.find('.thumbnail').outerHeight(true);
			
			
			// set the size and position of the thumbnail's container and the main thumbnail navigation container
			// besed on the orientation of the thumbnails and the thumbnail's size
			if (self.settings.thumbnailOrientation == 'horizontal') {
				navigationThumbnails.css({'width': thumbnailWidth * Math.min(numThumbnails, self.settings.visibleThumbnails),
										  'height': thumbnailHeight,
										  'top': slideWrapper.outerHeight(true)});
																			 
				thumbnailsVisibleContainer.css({'width': thumbnailWidth * Math.min(numThumbnails, self.settings.visibleThumbnails),
									'height': thumbnailHeight});				
				
				thumbnailsTotalSize = slides.length * thumbnailWidth;
			} else {
				navigationThumbnails.css({'width': thumbnailWidth,
										  'height': thumbnailHeight * Math.min(numThumbnails, self.settings.visibleThumbnails),
										  'left': slideWrapper.outerWidth(true)});
				
				thumbnailsVisibleContainer.css({'width': thumbnailWidth, 
									'height': thumbnailHeight * Math.min(numThumbnails, self.settings.visibleThumbnails)});
				
				thumbnailsTotalSize = slides.length * thumbnailHeight;
			}
			
			
			// show/hide the entire thumbnail navigation
			if (self.settings.fadeNavigationThumbnails) {
					navigationThumbnails.css({opacity:0});
					
					navigationThumbnails.hover(function() {
													if ($.browser.msie && parseInt($.browser.version) < 9) 
														navigationThumbnails.css('filter', '');
													else	
														navigationThumbnails.stop().animate({'opacity': 1}, self.settings.navigationThumbnailsShowDuration);
											  },
									
											  function() {
												  	if ($.browser.msie && parseInt($.browser.version) < 9) 
														navigationThumbnails.css('opacity', 0);
													else
														navigationThumbnails.stop().animate({'opacity': 0}, self.settings.navigationThumbnailsHideDuration);
											  });
			}
				
				
			// if the total number of thumbnails is greater then the number of visible thumbnails
			// setup the navigation controls
			if (self.settings.visibleThumbnails < numThumbnails) {
				
				// create the next&previous arrows for the thumbnails
				if (self.settings.thumbnailArrows) {
					
					var type = self.settings.thumbnailOrientation == 'horizontal' ? '' : 'vertical ',
					
						navigationArrows = $('<div class="arrows"></div>').appendTo(navigationThumbnails),
					
						previousArrow = $('<a class="previous"></a>').click(function() {
																		scrollToPreviousThumbnailPage();
																	})
																   .appendTo(navigationArrows),
					
					
						nextArrow = $('<a class="next"></a>').click(function() {
																			scrollToNextThumbnailPage();
																	  })
																	 .appendTo(navigationArrows);																	 
					
					// set the position of the arrows
					// and reset the size and position of the thumbnail containers
					if (self.settings.thumbnailOrientation == 'horizontal') {						
						navigationThumbnails.css('width', thumbnailWidth * Math.min(numThumbnails, self.settings.visibleThumbnails) + previousArrow.outerWidth(true) + nextArrow.outerWidth(true));					
						thumbnailsVisibleContainer.css('left', Math.round((navigationThumbnails.outerWidth() - thumbnailsVisibleContainer.outerWidth()) / 2));
						previousArrow.css({'top': Math.round((navigationThumbnails.outerHeight() - previousArrow.outerHeight()) / 2)});
						nextArrow.css({'top': Math.round((navigationThumbnails.outerHeight() - nextArrow.outerHeight()) / 2)});
					} else {
						navigationThumbnails.css('height', thumbnailHeight * Math.min(numThumbnails, self.settings.visibleThumbnails) + previousArrow.outerHeight(true) + nextArrow.outerHeight(true));					
						thumbnailsVisibleContainer.css('top', Math.round((navigationThumbnails.outerHeight() - thumbnailsVisibleContainer.outerHeight()) / 2));
						previousArrow.css({'left': Math.round((navigationThumbnails.outerWidth() - previousArrow.outerWidth()) / 2)});
						nextArrow.css({'left': Math.round((navigationThumbnails.outerWidth() - nextArrow.outerWidth()) / 2)});
					}
					
					
					// show/hide the arrows
					if (self.settings.fadeThumbnailArrows) {
						if ($.browser.msie) 
							navigationArrows.hide();
						else	
							navigationArrows.css('opacity', 0);
						
						
						navigationThumbnails.hover(function() {
														if ($.browser.msie) 
															navigationArrows.show();
														else 	
															navigationArrows.stop().animate({'opacity': 1}, self.settings.thumbnailArrowsShowDuration);
												   },
													
												   function() {
														if ($.browser.msie) 
															navigationArrows.hide();
														else	
															navigationArrows.stop().animate({'opacity': 0}, self.settings.thumbnailArrowsHideDuration);
												   });
					}
				}
				
				
				// create the thumbnail buttons
				if (self.settings.thumbnailButtons) {
					var navigationThumbnailsButtons = $('<div class="buttons"></div>').appendTo(navigationThumbnails),					
						buttonSize;
						
					for (var i = 0; i < totalThumbnailPages; i++) {
						var button = $('<a rel="' + i + '"></a>').appendTo(navigationThumbnailsButtons);
						
						// position the buttons
						if (self.settings.thumbnailOrientation == 'horizontal') {
							buttonSize = button.outerWidth(true);
							button.css({'left': i * buttonSize});
						} else {
							buttonSize = button.outerHeight(true);
							button.css({'top': i * buttonSize});
						}
						
						// handle mouse interaction
						button.bind({mouseover:function() {									
										if (!$(this).hasClass('select'))
											$(this).addClass('over');
									},
						
									mouseout:function() {
										if (!$(this).hasClass('select'))
											$(this).removeClass('over');
									},
						
									click:function() {
										var index = parseInt($(this).attr('rel'));
										scrollToThumbnailPage(index);
									}
						});
					}
					
					
					// set the size of the buttons's container
					var buttonsPosition = {};
					var buttonsSize = {};					
					
					if (self.settings.thumbnailOrientation == 'horizontal') {						
						buttonsSize['width'] = buttonSize * totalThumbnailPages;
						buttonsSize['height'] = buttonSize;
					} else {
						buttonsSize['height'] = buttonSize * totalThumbnailPages;
						buttonsSize['width'] = buttonSize;
					}					
					
					navigationThumbnailsButtons.css(buttonsSize);
					
					
					// set the postion of the thumbnail buttons's container
					if (self.settings.thumbnailOrientation == 'horizontal') {
						navigationThumbnails.css('height', thumbnailsVisibleContainer.outerHeight() + navigationThumbnailsButtons.outerHeight(true));
						
						buttonsPosition['left'] = (navigationThumbnails.outerWidth() - navigationThumbnailsButtons.outerWidth()) / 2;
						buttonsPosition['top'] = thumbnailsVisibleContainer.outerHeight();
						
					} else {
						navigationThumbnails.css('width', thumbnailsVisibleContainer.outerWidth() + navigationThumbnailsButtons.outerWidth(true));
						
						buttonsPosition['top'] = (navigationThumbnails.outerHeight() - navigationThumbnailsButtons.outerHeight()) / 2;
						buttonsPosition['left'] = thumbnailsVisibleContainer.outerWidth();
					}
					
					navigationThumbnailsButtons.css(buttonsPosition);
					
					
					// show/hide the buttons
					if (self.settings.fadeThumbnailButtons) {
						if ($.browser.msie && parseInt($.browser.version) < 9)
							navigationThumbnailsButtons.hide();
						else
							navigationThumbnailsButtons.css('opacity', 0);
						
						
						navigationThumbnails.hover(function() {
														if ($.browser.msie && parseInt($.browser.version) < 9)
															navigationThumbnailsButtons.show();
														else
															navigationThumbnailsButtons.stop().animate({opacity: 1}, self.settings.thumbnailButtonsShowDuration);														
													},
													
													function() {
														if ($.browser.msie && parseInt($.browser.version) < 9)
															navigationThumbnailsButtons.hide();
														else
															navigationThumbnailsButtons.stop().animate({opacity: 0}, self.settings.thumbnailButtonsShowDuration);
													});
					}
					
					// scroll to the first page in order to have the first button selected
					//scrollToThumbnailPage(0);
					navigationThumbnailsButtons.find('a').eq(0).addClass('select');
				}				
			}
			
			
			// if true, the buttons will be horizontally positioned in the center
			// if false, the buttons will be posistioned based on the value of the 'left' property specified in the CSS
			if (self.settings.navigationThumbnailsCenter) {
				var position = {};
				
				if (self.settings.thumbnailOrientation == 'horizontal') {
					position['left'] = (slideWrapper.outerWidth(true) - navigationThumbnails.outerWidth(true)) / 2;
				} else {
					position['top'] = (slideWrapper.outerHeight(true) - navigationThumbnails.outerHeight(true)) / 2;
				}		
				
				navigationThumbnails.css(position);
			}
			
			// create the tooltip and make it invisible
			if (self.settings.thumbnailTooltip)
				$('<div class="tooltip"><div class="content"></div></div>').hide().appendTo(navigationThumbnails);
				
			if (self.settings.thumbnailMouseScroll || self.settings.thumbnailTooltip || self.settings.thumbnailScrollbar) {
				$(document).bind('mousemove',function(event) {
					mouseX = event.pageX;
					mouseY = event.pageY;
				});
			}
			
			
			// create the scrollbar
			if (self.settings.thumbnailScrollbar)
				createScrollbar();
			
			// activate the mouse scrolling
			if (self.settings.thumbnailMouseScroll)
				startThumbnailMouseScroll();
				
			// activate the mouse wheel scrolling
			if (self.settings.thumbnailMouseWheel)
				startThumbnailMouseWheel();
				
			
			
			if (self.settings.thumbnailOrientation == 'horizontal') {
				var thumbnailsPosition = parseInt(navigationThumbnails.css('top')) + navigationThumbnails.outerHeight(true),
				extraHeight = (slider.outerHeight() < thumbnailsPosition) ? thumbnailsPosition - slider.outerHeight(): 0;				
				slider.css('height', slider.outerHeight() + extraHeight);
			} else {
				var thumbnailsPosition = parseInt(navigationThumbnails.css('left')) + navigationThumbnails.outerWidth(true),
				extraWidth = (slider.outerWidth() < thumbnailsPosition) ? thumbnailsPosition - slider.outerWidth(): 0;
				slider.css('width', slider.outerWidth() + extraWidth);
			}
			
		}
		
		
		/**
		* Shows the tooltip
		*/
		function showTooltip(index) {
			var tooltipContent = slides[index].thumbnailTooltip;
			
			// check if the item has a tooltip specified for it
			if (!tooltipContent)
				return;
			
			var tooltip = slider.find('.tooltip');
			
			// add the text
			tooltip.find('.content').html(tooltipContent);
			
			// fade in
			tooltip.stop(false, true).fadeIn(self.settings.tooltipShowDuration);
			
			// calculate the position based on the size of the tooltip
			var tooltipLeft = - tooltip.outerWidth() / 2,
				tooltipTop = 0 - tooltip.outerHeight() - parseInt(tooltip.css('marginBottom'));
			
			// assign the values at start
			tooltip.css({'left':mouseX - navigationThumbnails.offset().left + tooltipLeft, 'top':mouseY - navigationThumbnails.offset().top + tooltipTop});
			
			// update the position as the mouse moves
			$(document).bind('mousemove.tooltip', function() {
				tooltip.css({'left':mouseX - navigationThumbnails.offset().left + tooltipLeft, 'top':mouseY - navigationThumbnails.offset().top + tooltipTop});
			});
		}
		
		
		/**
		* Hides the tooltip
		*/
		function hideTooltip() {
				
			var tooltip = slider.find('.tooltip');
			
			if (tooltip) {
				tooltip.stop(false, true).fadeOut(self.settings.tooltipHideDuration, function() {
																						$(document).unbind('mousemove.tooltip');
																						// position the tooltip outside of any visible area
																						tooltip.css('left', -9999);
																					});
			}
		}
		
		
		/**
		* Scrolls the thumbnails to the next page
		*/
		function scrollToNextThumbnailPage() {			
			if (currentThumbnailPage < totalThumbnailPages - 1) {
				currentThumbnailPage++;
				scrollToThumbnailPage(currentThumbnailPage);
			} else {
				scrollToThumbnailPage(0);
			}
		}
		
		
		/**
		* Scrolls the thumbnails to the previous page
		*/
		function scrollToPreviousThumbnailPage() {			
			if (currentThumbnailPage > 0) {
				currentThumbnailPage--;
				scrollToThumbnailPage(currentThumbnailPage);
			} else {
				scrollToThumbnailPage(totalThumbnailPages - 1);	
			}
		}
		
		
		/**
		* Scrolls the thumbnails to a specified page
		*/
		function scrollToThumbnailPage(index) {
			var	pageSize = self.settings.thumbnailOrientation == 'horizontal' ? thumbnailsVisibleContainer.outerWidth() : thumbnailsVisibleContainer.outerHeight(),
				targetPosition = index * pageSize;
			
			currentThumbnailPage = index;
			
			if (currentThumbnailPage == totalThumbnailPages - 1)
				targetPosition = thumbnailsTotalSize - pageSize;
			
			onThumbnailScrollStart();
			
			var animObj = self.settings.thumbnailOrientation == 'horizontal' ? {left: -targetPosition} : {top: -targetPosition};
			thumbnailsContainer.animate(animObj, {duration:self.settings.thumbnailScrollDuration, 
							   			 		  easing: self.settings.thumbnailScrollEasing, 
										 		  step: function() {onThumbnailScrollProgress();},
										 		  complete: function() {onThumbnailScrollComplete();}});
			
			if (self.settings.thumbnailButtons) {
				var navigationThumbnailsButtons = navigationThumbnails.find('.buttons');
					
				navigationThumbnailsButtons.find('.select').removeClass('select');
				navigationThumbnailsButtons.find('a').eq(index).removeClass('over').addClass('select');
			}
		}
		
		
		/**
		* Enables the mouse scrolling
		*/
		function startThumbnailMouseScroll() {
			self.settings.thumbnailMouseScroll = true;
			
			var increment = 0,
				ratio,
				targetPosition,
				init = false, 
				visibleContainerTop = thumbnailsVisibleContainer.offset().top,
				visibleContainerLeft = thumbnailsVisibleContainer.offset().left,
				visibleContainerWidth = thumbnailsVisibleContainer.outerWidth(true),
				visibleContainerHeight = thumbnailsVisibleContainer.outerHeight(true),
				visibleContainerSize = self.settings.thumbnailOrientation == 'horizontal' ? visibleContainerWidth : visibleContainerHeight,
				visibleContainerPosition = self.settings.thumbnailOrientation == 'horizontal' ? visibleContainerLeft : visibleContainerTop,
				prop = self.settings.thumbnailOrientation == 'horizontal' ? 'left' : 'top',
				thumbnailsPosition = parseInt(thumbnailsContainer.css(prop));
				
			// start moving the thumbnails
			thumbnailMouseScrollTimer = setInterval(function() {
				if (!init) {
					init = true;
					visibleContainerTop = thumbnailsVisibleContainer.offset().top;
					visibleContainerLeft = thumbnailsVisibleContainer.offset().left;
					visibleContainerWidth = thumbnailsVisibleContainer.outerWidth(true);
					visibleContainerHeight = thumbnailsVisibleContainer.outerHeight(true);
				}
				
				if (mouseX > visibleContainerLeft && mouseX < (visibleContainerLeft + visibleContainerWidth) && mouseY > visibleContainerTop && mouseY < (visibleContainerTop + visibleContainerHeight)) {
					var mousePosition = self.settings.thumbnailOrientation == 'horizontal' ? mouseX : mouseY,
						ratio = (mousePosition - visibleContainerPosition) / visibleContainerSize,
						targetPosition = -((thumbnailsTotalSize - visibleContainerSize + 200) * ratio) + 100;
				
					increment = Math.round((targetPosition - thumbnailsPosition) * self.settings.thumbnailMouseScrollSpeed / 100);
					thumbnailsPosition += increment;					
				} else {							
					if (Math.abs(increment) > 0.1) {
						increment *= (self.settings.thumbnailMouseScrollEase / 100);
						thumbnailsPosition += increment;
					} else {
						increment = 0;
					}
				}
				
				if (Math.abs(increment) > 0) {
					if (thumbnailsPosition >= 0)
						thumbnailsPosition = 0;					
					else if (thumbnailsPosition <= visibleContainerSize - thumbnailsTotalSize)
						thumbnailsPosition = visibleContainerSize - thumbnailsTotalSize;
					
					onThumbnailScrollProgress();
					thumbnailsContainer.css(prop, thumbnailsPosition); 
				}
				
			}, 30);
			
		}
		
		
		/**
		* Disables the mouse scrolling
		*/
		function stopThumbnailMouseScroll() {
			self.settings.thumbnailMouseScroll = false;
			clearInterval(thumbnailMouseScrollTimer);
		}
		
		
		/**
		* Enables the mouse wheel scrolling
		*/
		function startThumbnailMouseWheel() {
			self.settings.thumbnailMouseWheel = true;
			
			var targetPosition = 0,
				directionSign = self.settings.thumbnailMouseWheelReverse ? -1 : 1,
				currentPosition,
				prop = self.settings.thumbnailOrientation == 'horizontal' ? 'left' : 'top',
				visibleContainerSize = self.settings.thumbnailOrientation == 'horizontal' ? thumbnailsVisibleContainer.outerWidth(true) : thumbnailsVisibleContainer.outerHeight(true);
				
				
			thumbnailsVisibleContainer.bind('mousewheel', function(event, delta) {
				// disable page scrolling
				event.preventDefault();
				
				// if the mouse wheel scrolling is not already started, start it
				if (!isThumbnailMouseWheelScrolling) {
					onThumbnailScrollStart();
					isThumbnailMouseWheelScrolling = true;
					currentPosition = parseInt(thumbnailsContainer.css(prop));
					targetPosition = currentPosition;
					thumbnailMouseWheelTimer = setInterval(function() {					
						if (Math.abs(targetPosition - currentPosition) > 0.5) {
							var increment = (targetPosition - currentPosition) * (self.settings.thumbnailMouseWheelSpeed / 100);
							currentPosition += increment;
							onThumbnailScrollProgress();
							thumbnailsContainer.css(prop, currentPosition);
						} else {
							onThumbnailScrollComplete();
						}
					}, 30);
				}
				
				targetPosition += directionSign * delta * 10;
				
				if (targetPosition >= 0)
					targetPosition = 0;					
				else if (targetPosition <= visibleContainerSize - thumbnailsTotalSize)
					targetPosition = visibleContainerSize - thumbnailsTotalSize;
				
			});
		}
		
		
		/**
		* Disables the mouse wheel scrolling
		*/
		function stopThumbnailMouseWheel() {
			self.settings.thumbnailMouseWheel = false;
			isThumbnailMouseWheelScrolling = false;
			clearInterval(thumbnailMouseWheelTimer);
		}
		
		
		/**
		* Creates the scrollbar
		*/
		function createScrollbar() {
			// add the scrollbar to the carousel area
			var scrollbar = $('<div class="scrollbar"></div>').appendTo(navigationThumbnails),
				track = $('<div class="track"></div>').appendTo(scrollbar),
				trackMiddle = $('<div class="track-middle"></div>').appendTo(track),
				trackBck = $('<div class="track-back"></div>').appendTo(track),
				trackFwd = $('<div class="track-forward"></div>').appendTo(track),
				thumb = $('<div class="thumb"></div>').appendTo(track),
				thumbMiddle = $('<div class="thumb-middle"></div>').appendTo(thumb),
				thumbBck = $('<div class="thumb-back"></div>').appendTo(thumb),
				thumbFwd = $('<div class="thumb-forward"></div>').appendTo(thumb),
				bck = $('<div class="back"></div>').appendTo(scrollbar),
				fwd = $('<div class="forward"></div>').appendTo(scrollbar),
				thumbPosition = 0,
				thumbOffset,
				scrollbarPosition = 0,
				currentPosition = 0,
				sizeProp = self.settings.thumbnailOrientation == 'horizontal' ? 'width' : 'height',
				positionProp = self.settings.thumbnailOrientation == 'horizontal' ? 'left' : 'top';
			
			scrollbar.addClass(self.settings.scrollbarSkin);
					
			// position the scrollbar
			if (self.settings.thumbnailOrientation == 'horizontal') {
				scrollbar.addClass('horizontal');				
				scrollbar.css({'top':thumbnailsVisibleContainer.outerHeight(), 'left':(navigationThumbnails.outerWidth() - parseInt(scrollbar.css('width'))) / 2});
				navigationThumbnails.css('height', thumbnailsVisibleContainer.outerHeight() + scrollbar.outerHeight(true));
			} else {
				scrollbar.addClass('vertical');				
				scrollbar.css({'left':thumbnailsVisibleContainer.outerWidth(), 'top':(navigationThumbnails.outerHeight() - parseInt(scrollbar.css('height'))) / 2});
				navigationThumbnails.css('width', thumbnailsVisibleContainer.outerWidth() + scrollbar.outerWidth(true));
			}
			
			
			// show/hide the scrollbar
			if (self.settings.fadeThumbnailScrollbar) {											
											
				if ($.browser.msie && parseInt($.browser.version) < 9)
					scrollbar.hide();
				else
					scrollbar.css('opacity', 0);
						
						
				navigationThumbnails.hover(function() {
												if ($.browser.msie && parseInt($.browser.version) < 9)
													scrollbar.show();
												else
													scrollbar.stop().animate({opacity: 1}, self.settings.thumbnailScrollbarShowDuration);
											},
													
											function() {
												if ($.browser.msie && parseInt($.browser.version) < 9)
													scrollbar.hide();
												else
													scrollbar.stop().animate({opacity: 0}, self.settings.thumbnailScrollbarShowDuration);
											});
			}
					
			
			// when the thumb is pressed, start registering its movement	
			thumb.bind('mousedown', function(event) {
				event.preventDefault();
				var mousePosition = self.settings.thumbnailOrientation == 'horizontal' ? mouseX : mouseY;
				thumbOffset = mousePosition - thumb.offset()[positionProp];
				isThumbnailScrollbarDragging = true;
				$(document).bind('mousemove', mouseMoveHandler);
			});
			
			// stop registering the movement when the mouse is released
			$(document).bind('mouseup', function() {
				if (isThumbnailScrollbarDragging) {
					isThumbnailScrollbarDragging = false;
					$(document).unbind('mousemove', mouseMoveHandler);
				}
			});
			
			
			// move the thumb
			function mouseMoveHandler() {
				var mousePosition = self.settings.thumbnailOrientation == 'horizontal' ? mouseX : mouseY;
				thumbPosition = mousePosition - track.offset()[positionProp] - thumbOffset;		
				move();
			}
			
			// move the thumb on left arrow click
			bck.bind('click', function() {
				thumbPosition = parseInt(thumb.css(positionProp)) - self.settings.scrollbarArrowScrollAmount;
				move();
			});
			
			// move the thumb or right arrow click
			fwd.bind('click', function() {
				thumbPosition = parseInt(thumb.css(positionProp)) + self.settings.scrollbarArrowScrollAmount;
				move();
			});
			
			
			function move() {
				// keep the thumb within bounderies
				if (thumbPosition < 0)
					thumbPosition = 0;
				else if (thumbPosition > parseInt(track.css(sizeProp)) - parseInt(thumb.css(sizeProp)))
					thumbPosition =  parseInt(track.css(sizeProp)) - parseInt(thumb.css(sizeProp));
				
				// move the thumb
				if (isThumbnailScrollbarDragging)
					thumb.css(positionProp, thumbPosition);
				
				// calculate the scrollbar position (a number between 0 and 1)
				scrollbarPosition = thumbPosition / (parseInt(track.css(sizeProp)) - parseInt(thumb.css(sizeProp)));
				
				// update the position of the thumbnails based on the thumb's position
				if (!isThumbnailScrollbarMoving) {
					onThumbnailScrollStart();
					isThumbnailScrollbarMoving = true;
					currentPosition = parseInt(thumbnailsContainer.css(positionProp));
					
					thumbnailScrollbarTimer = setInterval(function() {
						if (Math.abs(getThumbnailsPosition() + scrollbarPosition) > 0.001) {
							var newPos = - scrollbarPosition * (thumbnailsTotalSize - parseInt(thumbnailsVisibleContainer.css(sizeProp)));
				 			var increment = (newPos - currentPosition) * self.settings.thumbnailScrollbarEase / 100;
							currentPosition += increment;
							onThumbnailScrollProgress();
							
				
							thumbnailsContainer.css(positionProp, currentPosition);
						} else if (isThumbnailScrollbarMoving) {
							onThumbnailScrollComplete();
						}
					}, 30);
				}
			}
			
		}
		
		
		/**
		* A number from 0 to 1, representing the current position of the thumbnails
		*/
		function getThumbnailsPosition() {
			var positionProp = self.settings.thumbnailOrientation == 'horizontal' ? 'left' : 'top',
				sizeProp = self.settings.thumbnailOrientation == 'horizontal' ? 'width' : 'height',
				position = parseFloat(thumbnailsContainer.css(positionProp)) / (thumbnailsTotalSize - parseInt(thumbnailsVisibleContainer.css(sizeProp)));
			
			return position;
		}
		
		
		/**
		* Clears all the timers
		* This has to be done before any type of scrolling in order to prevent conflicts
		*/
		function clearThumbnailScrollingTimers() {			
			if (thumbnailMouseScrollTimer) {
				clearInterval(thumbnailMouseScrollTimer);
			}
			
			if (thumbnailMouseWheelTimer) {
				isThumbnailMouseWheelScrolling = false;
				clearInterval(thumbnailMouseWheelTimer);
			}
			
			if (thumbnailScrollbarTimer) {
				isThumbnailScrollbarMoving = false;
				clearInterval(thumbnailScrollbarTimer);	
			}
		}
		
		
		/**
		* This is called before starting any type of scrolling
		*/
		function onThumbnailScrollStart() {
			clearThumbnailScrollingTimers();
			
			if (thumbnailsContainer)
				if (thumbnailsContainer.is(':animated'))
					thumbnailsContainer.stop();
		}
		
		
		/**
		* This is called after the scrolling is complete
		*/
		function onThumbnailScrollComplete() {
			clearThumbnailScrollingTimers();
			
			// restart the mouse scrolling
			if (self.settings.thumbnailMouseScroll)
				startThumbnailMouseScroll();
		}
		
		
		/**
		* This is called during the scrolling process
		*/
		function onThumbnailScrollProgress() {
			if (self.settings.thumbnailScrollbar && !isThumbnailScrollbarDragging) {
				var track = slider.find('.track'),
					thumb = track.find('.thumb');
					positionProp = self.settings.thumbnailOrientation == 'horizontal' ? 'left' : 'top',
					sizeProp = self.settings.thumbnailOrientation == 'horizontal' ? 'width' : 'height',
					value = - getThumbnailsPosition() * (parseInt(track.css(sizeProp)) - parseInt(thumb.css(sizeProp)));
				
				if (value > 0)
					thumb.css(positionProp, value);	
			}
		}		
		
		
		/**
		* Returns a new array, with the slices ordered based on the specified pattern
		*/
		function getOrderedSlices(initialArray, pattern, horizontalSlices, verticalSlices) {
			var orderedArray = new Array(),
				i, j, k, l = 0;			
			
			switch(pattern) {
				case 'randomPattern':
					var randomArray = new Array();
										
					while(initialArray.length) {
						l = Math.floor(Math.random() * initialArray.length);
						randomArray.push(initialArray[l]);
						initialArray.splice(l, 1);
					}					
					var n = randomArray.length;					
					for(k = 0; k < n; k++) {
						orderedArray[k] = randomArray[k];
					}					
					break;	
					
				
				case 'topToBottom':
					for(j = 0; j < verticalSlices; j++)
						for(i = 0; i < horizontalSlices; i++) {
							orderedArray.push(getSliceByPosition(initialArray, i, j));
						}					
					break;
					
				
				case 'bottomToTop':
					for (j = verticalSlices - 1; j >= 0; j--)
						for (i = horizontalSlices - 1; i >= 0; i--) {
							orderedArray.push(getSliceByPosition(initialArray, i, j));
						}					
					break;
									
				case 'rightToLeft':
					for (i = horizontalSlices - 1; i >= 0; i--)
						for (j = verticalSlices - 1; j >= 0; j--) {
							orderedArray.push(getSliceByPosition(initialArray, i, j));
						}					
					break;	
				
				case 'leftToRight':
					for (i = 0; i < horizontalSlices; i++)
						for( j = 0; j < verticalSlices; j++) {
							orderedArray.push(getSliceByPosition(initialArray, i, j));
						}					
					break;
				
				case 'topLeftToBottomRight':
					for (k = 0; k < horizontalSlices + verticalSlices - 1; k++) {
						j = 0;
						for (i = k; i >= 0; i--){							
							if (getSliceByPosition(initialArray, i, j) != undefined) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
							}
							j++;
						}
					}					
					break;	
				
				case 'bottomLeftToTopRight':
					l = horizontalSlices > verticalSlices ? horizontalSlices : verticalSlices;
					
					for (k = horizontalSlices - 1; k >= 1 - l; k--) {
						i = 0;
						for (j = k; j <= horizontalSlices - 1; j++) {
							if (getSliceByPosition(initialArray, i, j) != undefined) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
							}
							i++;
						}
					}					
					break;	
				
				case 'topRightToBottomLeft':
					l = horizontalSlices > verticalSlices ? horizontalSlices : verticalSlices;
					
					for (k = horizontalSlices - 1; k >= 1 - l; k--) {
						i = k;
						for (j = 0; j <= verticalSlices - 1; j++) {
							if (getSliceByPosition(initialArray, i, j) != undefined) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
							}
							i++;
						}
					}					
					break;	
				
				case 'bottomRightToTopLeft':
					for (k = verticalSlices + horizontalSlices - 2; k >= 0; k--) {
						j = 0;
						for (i = k; i >= 0; i--) {
							if (getSliceByPosition(initialArray, i, j) != undefined) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
							}
							j++;
						}
					}					
					break;	
			
				case 'horizontalMarginToCenter':
					if (horizontalSlices % 2) {
						for (i = 0; i < Math.floor(horizontalSlices / 2); i++)
							for (j = 0; j < verticalSlices; j++) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
								orderedArray.push(getSliceByPosition(initialArray, horizontalSlices - 1 - i, j));
							}
						for (k = 0; k < verticalSlices; k++) {
							orderedArray.push(getSliceByPosition(initialArray, Math.floor(horizontalSlices / 2), k));
						}
					} else {
						for (i = 0; i < Math.floor(horizontalSlices / 2); i++)
							for (j = 0; j < verticalSlices; j++) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
								orderedArray.push(getSliceByPosition(initialArray, horizontalSlices - 1 - i, j));
							}
					}					
					break;	
				
				case 'horizontalCenterToMargin':
					if (horizontalSlices % 2) {
						for (k = 0; k < verticalSlices; k++) {
							orderedArray.push(getSliceByPosition(initialArray, Math.floor(horizontalSlices / 2), k));
						}
						for (i = Math.floor(horizontalSlices / 2) - 1; i >= 0; i--)
							for (j = 0; j < verticalSlices; j++) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
								orderedArray.push(getSliceByPosition(initialArray, horizontalSlices - 1 - i, j));
							}
					} else {
						for (i = Math.floor(horizontalSlices / 2) - 1; i >= 0; i--)
							for (j = 0; j < verticalSlices; j++) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
								orderedArray.push(getSliceByPosition(initialArray, horizontalSlices - 1 - i, j));
							}
					}					
					break;	
				
				case 'verticalMarginToCenter':
					if (verticalSlices % 2) {
						for (j = 0; j < Math.floor(verticalSlices / 2); j++)
							for (i = 0; i < horizontalSlices; i++) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
								orderedArray.push(getSliceByPosition(initialArray, i, verticalSlices - 1 - j));
							}
						for (k = 0; k < horizontalSlices; k++) {
							orderedArray.push(getSliceByPosition(initialArray, k, Math.floor(verticalSlices / 2)));
						}
					} else {
						for (j = 0; j < Math.floor(verticalSlices / 2); j++)
							for (i = 0; i < horizontalSlices; i++) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
								orderedArray.push(getSliceByPosition(initialArray, i, verticalSlices - 1 - j));
							}
					}					
					break;	
				
				case 'verticalCenterToMargin':
					if (verticalSlices % 2) {
						for (k = 0; k < horizontalSlices; k++) {
							orderedArray.push(getSliceByPosition(initialArray, k, Math.floor(verticalSlices / 2)));
						}
						for (j = Math.floor(verticalSlices / 2) - 1; j >= 0; j--)
							for(i = 0; i < horizontalSlices; i++) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
								orderedArray.push(getSliceByPosition(initialArray, i, verticalSlices - 1 - j));
							}
					} else {
						for (j = Math.floor(verticalSlices / 2) - 1; j >= 0; j--)
							for (i = 0; i < horizontalSlices; i++) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
								orderedArray.push(getSliceByPosition(initialArray, i, verticalSlices - 1 - j));
							}
					}					
					break;
				
				case 'skipOneTopToBottom':
					for (j = 0; j < verticalSlices; j++) {
						for (i = l; i < horizontalSlices; i += 2) {
							orderedArray.push(getSliceByPosition(initialArray, i, j));
						}
						l==0 ? l = 1 : l = 0;
					}
					l = 1;
					for (j = 0; j < verticalSlices; j++) {
						for (i = l; i < horizontalSlices; i += 2) {
							orderedArray.push(getSliceByPosition(initialArray, i, j));
						}
						l == 0 ? l = 1 : l = 0;
					}					
					break;
				
				case 'skipOneBottomToTop':
					for (j = verticalSlices-1; j >= 0; j--) {
						for (i = l; i < horizontalSlices; i += 2) {
							orderedArray.push(getSliceByPosition(initialArray, i, j));
						}
						l == 0 ? l = 1 : l = 0;
					}
					l = 1;
					for (j = verticalSlices - 1; j >= 0; j--) {
						for (i = l; i < horizontalSlices; i += 2) {
							orderedArray.push(getSliceByPosition(initialArray, i, j));
						}
						l == 0 ? l = 1 : l = 0;
					}					
					break;	
				
				case 'skipOneLeftToRight':
					for (i = 0; i < horizontalSlices; i++) {
						for (j = l; j < verticalSlices; j += 2) {
							orderedArray.push(getSliceByPosition(initialArray, i, j));
						}
						l == 0 ? l = 1 : l = 0;
					}
					l = 1;
					for (i = 0; i < horizontalSlices; i++) {
						for (j = l; j < verticalSlices; j += 2) {
							orderedArray.push(getSliceByPosition(initialArray, i, j));
						}
						l == 0 ? l = 1 : l = 0;
					}					
					break;	
				
				case 'skipOneRightToLeft':
					for (i = horizontalSlices - 1; i >= 0; i--) {
						for (j = l; j < verticalSlices; j += 2) {
							orderedArray.push(getSliceByPosition(initialArray, i, j));
						}
						l == 0 ? l = 1 : l = 0;
					}
					l = 1;
					for (i = horizontalSlices - 1; i >= 0; i--) {
						for (j = l; j < verticalSlices; j += 2) {
							orderedArray.push(getSliceByPosition(initialArray, i, j));
						}
						l == 0 ? l = 1 : l = 0;
					}					
					break;	
				
				case 'skipOneVertical':
					if (verticalSlices % 2) {
						for (j = 0; j < verticalSlices; j++) {
							for (i = l; i < horizontalSlices; i += 2) {
								if (j == Math.floor(verticalSlices / 2)) {
									j++;
									for (k = 1 - (horizontalSlices % 2); k < horizontalSlices; k += 2) {
										orderedArray.push(getSliceByPosition(initialArray, k, Math.floor(verticalSlices / 2)));
										if (getSliceByPosition(initialArray, k - 1, Math.floor(verticalSlices / 2)) != undefined) {
											orderedArray.push(getSliceByPosition(initialArray, k - 1, Math.floor(verticalSlices / 2)));
										}
									}
								}
								orderedArray.push(getSliceByPosition(initialArray, i, j));
								orderedArray.push(getSliceByPosition(initialArray, i, verticalSlices - j - 1));
							}
							l == 0 ? l = 1 : l = 0;
						}
					} 
					else {
						for (j = 0; j < verticalSlices; j++) {
							for (i = l; i < horizontalSlices; i += 2) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
								orderedArray.push(getSliceByPosition(initialArray, i, verticalSlices - j - 1));
							}
							l == 0 ? l = 1 : l = 0;
						}
					}					
					break;	
				
				case 'skipOneHorizontal':
					if (horizontalSlices % 2) {
						for (i = 0; i < horizontalSlices; i++) {
							for (j = l; j < verticalSlices; j += 2) {
								if (i == Math.floor(horizontalSlices / 2)) {
									i++;
									for (k = 1 - (verticalSlices % 2); k < verticalSlices; k += 2) {
										orderedArray.push(getSliceByPosition(initialArray, Math.floor(horizontalSlices / 2), k));
										if (getSliceByPosition(initialArray, Math.floor(horizontalSlices / 2), k-1) != undefined) {
											orderedArray.push(getSliceByPosition(initialArray, Math.floor(horizontalSlices / 2), k-1));
										}
									}
								}
								
								orderedArray.push(getSliceByPosition(initialArray, i, j));
								orderedArray.push(getSliceByPosition(initialArray, horizontalSlices - 1 - i, j));
							}
							l == 0 ? l = 1 : l = 0;
						}
					}
					else {
						for (i = 0; i < horizontalSlices; i++) {
							for (j = l; j < verticalSlices; j += 2) {
								orderedArray.push(getSliceByPosition(initialArray, i, j));
								orderedArray.push(getSliceByPosition(initialArray, horizontalSlices - 1 - i, j));
							}
							l == 0 ? l = 1 : l = 0;
						}
					}					
					break;	
				
				case 'spiralMarginToCenterCW':
					var h  = horizontalSlices,
						v = verticalSlices,					
						r, a = 0,				
						m = verticalSlices < horizontalSlices ? verticalSlices : horizontalSlices,
						n = Math.floor(m / 2);
				
					for (r = 0; r < n; r++) {
						for (i = a++; i < h; i++) {
							orderedArray.push(getSliceByPosition(initialArray, i, a - 1));
						}
						h--;
						for (j = a; j < v; j++) {
							orderedArray.push(getSliceByPosition(initialArray, horizontalSlices - a, j));
						}
						v--;
						for (k = h; k >= horizontalSlices - h; k--) {
							orderedArray.push(getSliceByPosition(initialArray, k - 1, v));
						}
						for (l = v - 1; l>=  verticalSlices - v; l--) {
							orderedArray.push(getSliceByPosition(initialArray, a - 1, l));
						}
					}
					if (m % 2) {
						if (m == verticalSlices) {
							for (i = a++; i < h; i++) {
								orderedArray.push(getSliceByPosition(initialArray, i, a - 1));
							}
						}
						if (m == horizontalSlices) {
							for (j = a++; j < v; j++) {
								orderedArray.push(getSliceByPosition(initialArray, horizontalSlices - a, j));
							}
						}
					}					
					break;	
				
				case 'spiralMarginToCenterCCW':
					var h  = horizontalSlices,
						v = verticalSlices,				
						r, a = 0,
						m = verticalSlices < horizontalSlices ? verticalSlices : horizontalSlices,
						n = Math.floor(m / 2);
				
					for (r = 0; r < n; r++) {
						for (j = a++; j < v; j++) {
							orderedArray.push(getSliceByPosition(initialArray, a - 1, j));
						}
						v--;
						for (i = a; i < h; i++) {
							orderedArray.push(getSliceByPosition(initialArray, i, verticalSlices - a));
						}
						h--;
						for (k = v; k >= verticalSlices - v; k--) {
							orderedArray.push(getSliceByPosition(initialArray, h, k - 1));
						}
						for (l = h - 1; l >= horizontalSlices - h; l--) {
							orderedArray.push(getSliceByPosition(initialArray, l, a - 1));
						}
					}
					if (m % 2) {
						if (m == verticalSlices) {
							for (i = a++; i < h; i++) {
								orderedArray.push(getSliceByPosition(initialArray, i, verticalSlices - a));
							}
						}
						if (m == horizontalSlices) {
							for (j = a++; j < v; j++) {
								orderedArray.push(getSliceByPosition(initialArray, a - 1, j));
							}
						}
					}					
					break;
				
				case 'spiralCenterToMarginCCW':
					var h  = horizontalSlices,
						v = verticalSlices,
						r, a = 0,
						m = verticalSlices < horizontalSlices ? verticalSlices : horizontalSlices,
						n = Math.floor(m / 2);
				
					for (r = 0; r < n; r++) {
						for (i = a++; i < h; i++) {
							orderedArray.push(getSliceByPosition(initialArray, i, a - 1));
						}
						h--;
						for (j = a; j < v; j++) {
							orderedArray.push(getSliceByPosition(initialArray, horizontalSlices - a, j));
						}
						v--;
						for (k = h; k >= horizontalSlices - h; k--) {
							orderedArray.push(getSliceByPosition(initialArray, k - 1, v));
						}
						for (l = v - 1; l>=  verticalSlices - v; l--) {
							orderedArray.push(getSliceByPosition(initialArray, a - 1, l));
						}
					}
					if (m % 2) {
						if (m == verticalSlices) {
							for (i = a++; i < h; i++) {
								orderedArray.push(getSliceByPosition(initialArray, i, a - 1));
							}
						}
						if (m == horizontalSlices) {
							for (j = a++; j < v; j++) {
								orderedArray.push(getSliceByPosition(initialArray, horizontalSlices - a, j));
							}
						}
					}
					
					orderedArray.reverse();					
					break;
				
				case 'spiralCenterToMarginCW':
					var h  = horizontalSlices,
						v = verticalSlices,
						r, a = 0,
						m = verticalSlices < horizontalSlices ? verticalSlices : horizontalSlices,
						n = Math.floor(m / 2);
				
					for (r = 0; r < n; r++) {
						for (j = a++; j < v; j++) {
							orderedArray.push(getSliceByPosition(initialArray, a - 1, j));
						}
						v--;
						for (i = a; i < h; i++) {
							orderedArray.push(getSliceByPosition(initialArray, i, verticalSlices - a));
						}
						h--;
						for (k = v; k >= verticalSlices - v; k--) {
							orderedArray.push(getSliceByPosition(initialArray, h, k - 1));
						}
						for (l = h - 1; l >= horizontalSlices - h; l--) {
							orderedArray.push(getSliceByPosition(initialArray, l, a - 1));
						}
					}
					if (m % 2) {
						if (m == verticalSlices) {
							for (i = a++; i < h; i++) {
								orderedArray.push(getSliceByPosition(initialArray, i, verticalSlices - a));
							}
						}
						if (m == horizontalSlices) {
							for (j = a++; j < v; j++) {
								orderedArray.push(getSliceByPosition(initialArray, a - 1, j));
							}
						}
					}
					
					orderedArray.reverse();					
					break;
				
				default:
					var randomArray = new Array();
										
					while(initialArray.length) {
						l = Math.floor(Math.random() * initialArray.length);
						randomArray.push(initialArray[l]);
						initialArray.splice(l, 1);
					}
					
					var n = randomArray.length;
					
					for(k = 0; k < n; k++) {
						orderedArray[k] = randomArray[k];
					}				
			}
			
			return orderedArray;
		}
		
		/**
		* Returns an element from the array, at the specified horizontal and vertical position
		*/
		function getSliceByPosition(array, hPos, vPos) {
			return $.grep(array, function(el){return (el.data('hPos') == hPos && el.data('vPos') == vPos)})[0];
		}
		
		
		/**
		* Converts an hex string to RGB
		*/
		function hexToRGB(value) {
			var red = parseInt(value.substring(1, 3), 16),
				green = parseInt(value.substring(3, 5), 16),
				blue = parseInt(value.substring(5, 7), 16);
				
			return {red:red, green:green, blue:blue};
		}
		
		
		// PUBLIC METHODS
		
		this.nextSlide = nextSlide;
		
		
		this.previousSlide = previousSlide;
		
		
		this.gotoSlide = gotoSlide;
		
		
		this.startSlideshow = function() {
			slider.find('.slideshow-controls').removeClass('play').addClass('pause');
			slideshowState = 'play';
			startSlideshow();
		}
		
		
		this.stopSlideshow = function() {
			slider.find('.slideshow-controls').removeClass('pause').addClass('play');
			slideshowState = 'stop';
			stopSlideshow();
		}
		
		
		this.getSlideshowState = function() {
			return slideshowState;
		}
		
		
		this.pauseSlideshow = function() {
			if (self.settings.slideshow && slideshowState != 'stop' && !isTransition)
				pauseSlideshow();	
		}
		
		
		this.resumeSlideshow = function() {
			if (self.settings.slideshow && slideshowState != 'stop' && !isTransition)
				resumeSlideshow();	
		}
		
		
		this.getCurrentIndex = function() {
			return currentIndex;	
		}
		
		this.getSlideAt = function(index) {
			return slides[index];	
		}
		
		
		this.isTransition = function() {
			return isTransition;	
		}
		
		
		this.totalSlides = function() {
			return slides.length;	
		}
		
		
		this.destroy = function() {
			this.stopSlideshow();
			clearThumbnailScrollingTimers();
			$(document).unbind('mousemove');
			$(document).unbind('mousemove.tooltip');
		}
	}
	
	
	$.fn.advancedSlider = function(options) {
		var collection = [];
		
		for (var i = 0; i < this.length; i++) {
			if (!this[i].slider)
				this[i].slider = new AdvancedSlider(this[i], options);
			
			collection.push(this[i].slider);
		}
		
		// if there are more slider instances, return the array of sliders
		// it there is only one, return just the slide instance
		return collection.length > 1 ? collection : collection[0];
	}
	
	
	// default settings
	$.fn.advancedSlider.defaults =  {
		xmlSource:null,
		width:50,
		height:30,
		skin:'pixel',
		scrollbarSkin:'scrollbar-1',
		alignType:'leftTop',
		skipBroken:true,
		
		slideshow:true,
		slideshowDelay:5000,
		slideshowDirection:'next',
		slideshowControls:true,
		fadeSlideshowControls:true,
		slideshowControlsShowDuration:500,
		slideshowControlsHideDuration:500,
		pauseSlideshowOnHover:false,
		
		lightbox:false,
		lightboxDefaultWidth:500,
		lightboxDefaultHeight:300,
		lightboxTheme:'pp_default',
		lightboxOpacity:0.8,
		lightboxNavigation:true,
		
		fadePreviousSlide:false,
		fadePreviousSlideDuration:300,
		overrideTransition:false,
		
		shadow:false,
		
		timerAnimation:true,
		timerFadeDuration:500,
		fadeTimer:false,
		timerRadius:18,
		timerStrokeColor1:'#000000',
		timerStrokeColor2:'#FFFFFF',
		timerStrokeOpacity1:0.5,
		timerStrokeOpacity2:0.7,
		timerStrokeWidth1:8,
		timerStrokeWidth2:4,
		
		initialEffect:true,
		slideStart:0,
		slidesPreloaded:0,
		shuffle:false,
		htmlDuringTransition:true,
		effectType:'random',
		simpleSlideDirection:'autoHorizontal',
		simpleSlideDuration:700,
		simpleSlideEasing:'swing',
		sliceDelay:50,
		sliceDuration:1000,
		sliceEasing:'swing',
		horizontalSlices:5,
		verticalSlices:3,
		slicePattern:'random',
		slicePoint:'centerCenter',
		slideStartPosition:'left',
		slideStartRatio:1,
		sliceFade:true,
		
		navigationArrows:true,
		fadeNavigationArrows:true,
		navigationArrowsShowDuration:500,
		navigationArrowsHideDuration:500,
		navigationButtons:true,
		navigationButtonsNumbers:false,
		fadeNavigationButtons:false,
		navigationButtonsShowDuration:500,
		navigationButtonsHideDuration:500,
		navigationButtonsCenter:true,
		navigationButtonsContainerCenter:true,
		
		thumbnailsType:'tooltip',
		thumbnailWidth:80,
		thumbnailHeight:50,
		thumbnailSlideAmount:10,
		thumbnailSlideDuration:300,
		thumbnailSlideEasing:'swing',
		
		fadeNavigationThumbnails:false,
		navigationThumbnailsCenter:true,
		thumbnailScrollDuration:1000,
		thumbnailScrollEasing:'swing',
		visibleThumbnails:5,
		thumbnailOrientation:'horizontal',
		thumbnailTooltip:false,
		tooltipShowDuration:300,
		tooltipHideDuration:300,
		
		thumbnailCaptionPosition:'bottom',
		hideThumbnailCaption:true,
		thumbnailCaptionEffect:'slide',
		thumbnailCaptionShowDuration:500,
		thumbnailCaptionHideDuration:500,
		thumbnailCaptionEasing:'swing',
		thumbnailScrollbar:false,
		thumbnailButtons:false,
		thumbnailArrows:true,
		fadeThumbnailButtons:false,
		fadeThumbnailArrows:false,
		fadeThumbnailScrollbar:false,
		scrollbarArrowScrollAmount:100,
		navigationThumbnailsHideDuration:500,
		navigationThumbnailsShowDuration:500,
		thumbnailArrowsHideDuration:500,
		thumbnailArrowsShowDuration:500,
		thumbnailButtonsHideDuration:500,
		thumbnailButtonsShowDuration:500,
		thumbnailScrollbarHideDuration:500,
		thumbnailScrollbarShowDuration:500,
		thumbnailSync:false,
		thumbnailMouseScroll:false,
		thumbnailMouseScrollEase:90,
		thumbnailMouseScrollSpeed:10,
		thumbnailMouseWheel:false,
		thumbnailMouseWheelSpeed:20,
		thumbnailMouseWheelReverse:false,
		thumbnailScrollbarEase:10,
		
		hideCaption:false,
		captionSize:70,
		captionBackgroundOpacity:0.5,
		captionBackgroundColor:'#000000',
		captionShowEffect:'slide',
		captionShowEffectDuration:500,
		captionShowEffectEasing:'swing',
		captionShowSlideDirection:'auto',
		captionHideEffect:'fade',
		captionHideEffectDuration:300,
		captionHideEffectEasing:'swing',
		captionHideSlideDirection:'auto',
		captionPosition:'bottom',
		captionLeft:50,
		captionTop:50,
		captionWidth:300,
		captionHeight:100,
		
		slideProperties:null,
		slideMask:false,
		linkTarget:'_blank',
		slideOpen:null,
		slideClick:null,
		slideMouseOver:null,
		slideMouseOut:null,
		transitionStart:null,
		transitionComplete:null
	};
	
})(jQuery)