/* COslider - coupled sliders as a jQuery plugin
 *
 * usage: $(selector).coslider(option)
 *
 * Check option definitions at attached document
 */

;(function ($) {
	$.fn.coslider = function (option) {
		/*********************************************
		 * variables global for each coslider
		 *********************************************
		 */
		var nextToDispatch = 0; // used by dispatchBias
		var values = []; // runtime values
		
		/*********************************************
		 * An utility function to generate label content
		 *********************************************
		 */
		var genLabel = function (index, number, opt) {
			return opt.labels[index] + ' ' + opt.labelprefix + number + opt.labelsuffix;
		};
		
		/*********************************************
		 * The algorithm function that dispatch
		 * moving slider changes to other sliders
		 * - input:
		 *       no - The # of slider that is in action
		 *       bias - The amount of change to be dispatched
		 * - output:
		 *       false - If the bias cannot be dispatched because
		 *               all other sliders have reached the boundary
		 *       Array - An array of bias for other sliders
		 *********************************************
		 */
		var dispatchBias = function (no, bias) {
			if (bias == 0) {return;}
			var step = bias > 0 ? 1 : -1; // must be 1 or -1
			var res = [];
			var outOfBound = 0;
			for (var i = 0; i < option.count; i++) {
				res[i] = 0;
			}
			while (bias != 0) {
				// only dispatch the bias to others
				if (nextToDispatch != no) {
					var newValue = values[nextToDispatch] + res[nextToDispatch] - step;
					// check boundary
					if (newValue >= option.min && newValue <= option.max) {
						res[nextToDispatch] -= step;
						bias -= step;
						outOfBound = 0;
					} else {
						outOfBound ++;
						// if continuesly out bound for option.count-1 times
						// that means all other sliders have reached boundary
						if (outOfBound > option.count-1) {return false;}
					}
				}
				nextToDispatch ++;
				// roll back
				if (nextToDispatch == option.count) {
					nextToDispatch = 0;
				}	
			}
			return res;
		};

		/*********************************************
		 * Initialize the option by combining default
		 * option with the argument option
		 *********************************************
		 */
		option = $.extend({}, $.fn.coslider.defaults, option);
		for (var i = 0; i < option.count; i++ ) {
			if (!option.initvalues[i]) {option.initvalues[i] = 0;}
			if (!option.labels[i]) {option.labels[i] = "";}
			values[i] = option.initvalues[i];
		}
		
		/*********************************************
		 * The main function that renders the sliders
		 *********************************************
		 */
		return this.each(function () {
			var $drawTarget = $(this);
			$drawTarget.empty().css({'font-size':option.size});
			for (var i = 0; i < option.count; i++) {
				// the container element
				var newEle = $('<div/>');
				
				// the label element
				var labelEle = $('<div/>', {text:genLabel(i, option.initvalues[i], option), id:option.name+i});
				
				// the slider element
				var sliderEle = $('<div/>', {id:option.name+"s"+i}).slider({
					value: option.initvalues[i],
					orientation: option.direction,
					range: option.range,
					animate: option.animate,
					step: option.step,
					min: option.min,
					max: option.max,
					
					// The event handler when a slider is moved by user
					slide: function(event, ui){
						if (option.labellocation == "before") {
							var j = parseInt($(this).prev().attr('id').slice(option.name.length));
						} else {
							var j = parseInt($(this).next().attr('id').slice(option.name.length));
						}
						
						// Do the dispatch calculation before any actual action
						var oldValue = values[j];
						var bias_array = dispatchBias(j, ui.value - oldValue);
						if (!bias_array) {return false;}
						var allzero = true;
						for (var k = 0; k < option.count; k++) {
							if (bias_array[k] != 0) {allzero = false;}
						}
						if (allzero) {return false;}
						
						// Dispatch successful, make changes
						values[j] = ui.value;
						
						// Update the label of itself
						if (option.labellocation == "before") {
							$(this).prev().html(genLabel(j, ui.value, option));
						} else {
							$(this).next().html(genLabel(j, ui.value, option));
						}
						
						// update other sliders in this group
						for (var k = 0; k < option.count; k++) {
							if (k == j) {continue;}
							values[k] += bias_array[k];
							$("#"+option.name+k).html(genLabel(k, values[k], option));
							$("#"+option.name+"s"+k).slider("value", values[k]);
						}
						
						// call the onchange callback function
						option.onchange(j, values);
					}
				});
				
				// Build up the DOM with customized options
				if (option.direction == "vertical") {
					labelEle.css({'padding':'10px 0px'});
					sliderEle.css({'height':option.length,'margin':'0 auto'});
					newEle.css({'width':option.width,'float':'left','text-align':'center'});
				} else {
					labelEle.css({'float':'left', 'padding':'0px 10px'});
					sliderEle.css({'width':option.length,'float':'left'});
					newEle.css({'height':option.width+'px'});
				}
				if (option.labellocation == "before") {
					labelEle.appendTo(newEle);
					sliderEle.appendTo(newEle);
				} else {
					sliderEle.appendTo(newEle);
					labelEle.appendTo(newEle);
				}
				labelEle.css('font-family', option.labelfont).css(option.labelcss);
				$('<div/>').css({'clear':'both'}).appendTo(newEle);
				newEle.appendTo($drawTarget);
			}
			// call the oninit callback function
			option.oninit();
		});
	};
	
	/*********************************************
	 * The default options
	 *********************************************
	 */
	$.fn.coslider.defaults = {
		name: 'coslider',
		direction: "horizonal", // or "vertical"
		count: 4,
		min: 0,
		max: 100,
		initvalues: [],
		length: 500,
		width: 50,
		size: '100%',
		animate: 'fast', 
		range: 'min',
		step: 1,
		
		labels: [],
		labellocation: 'after',
		labelcss: {'color':'#888', 'font-size':'1em', 'line-height':'1em'},
		labelfont: '"Trebuchet MS", "Arial", "Helvetica", "Verdana", "sans-serif"',
		labelprefix: '',
		labelsuffix: '%',
		
		oninit: function(){},
		onchange: function(arg_index, arg_values){}
	};
})(jQuery);
