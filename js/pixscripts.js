// Some drafts of functions, most of which use a single pixel
// block used for testing various features. There are a few
// references to multi-pixel blocks (i.e. the shapes that would
// actually be used in the game), but there's nothing really
// fleshed out. This file exists only as an archive.

$(document).ready(function() {
	// Get the pixel-size variable from root. It should be in px.
	const $pixelSize = $(":root").css("--pixel-size").trim();
	// Get just the numeric value $pixelSize (assuming it's in px).
	const $pixelNum = $pixelSize.slice(0,-2);
	// Get just the format, which we expect to be "px".
	const $pixelFormat = $pixelSize.slice(-2);
	// Get stack-height and stack-width. They should be integers
	const $stackHeight = $(":root").css("--stack-height").trim();
	const $stackWidth = $(":root").css("--stack-width").trim();
	
	const iBlockStates = [
		[[1,0,0,0],
		[1,0,0,0],
		[1,0,0,0],
		[1,0,0,0]],
		
		[[1,1,1,1],
		[0,0,0,0],
		[0,0,0,0],
		[0,0,0,0]]];
		
	const oBlockStates = [
		[[1,1],
		[1,1]]];
	
	var score = 0;
	var level = 0;
	
	// A boolean used to pause animation upon scoring, etc.
	var stopped = false;
	
	// Initialize a grid to keep track of landed-pixels' coordinates
	var occupiedGrid = [];
	for (var i = 0; i < $stackHeight; i++) {
		var inner = [];
		for (var j = 0; j < $stackWidth; j++) {
			inner[j] = 0;
		}
		occupiedGrid[i] = inner;
	}
	
	console.log(oBlockStates);

	// Add an active-pixel to stack-container.
	$(".stack-container").html("<span class='active-pixel'></span>");

	// Take the rawPoints earned on a scoring play and turn them into
	// more impressive adjusted points. Use current level as
	// a multiplier.
	function adjustPoints(rp, lvl) {
		var levelMultiplier = 1 + parseFloat(lvl / 10);
		if (rp == 1) {
			return 100 * levelMultiplier;
		} else if (rp == 2) {
			return 250 * levelMultiplier;
		} else if (rp == 3) {
			return 500 * levelMultiplier;
		} else if (rp == 4) {
			return 1000 * levelMultiplier;
		}
		return 5;
	}
	
	// TO DO: Get this working right. If a final block lands without
	// being pushed, line simply disappears without fading.
	function checkForScore(grid) {
		var rawPoints = 0;
		for (var i = 0; i < grid.length; i++) {
			if (grid[grid.length - i - 1].every(function(col) {return col == 1})) {
				// Blank out the current row in grid data structure
				$.each(grid[grid.length - i - 1], function(j) {
					grid[grid.length - i - 1][j] = 0;
				});
				// Remove the displayed pixels. Precede with a simple fadeOut.
				// TODO: Make this flashier.
				$(".row"+ (grid.length - i - 1)).fadeOut(400, function() {
					$(".row"+ (grid.length - i - 1)).remove(); 
				}); 
				rawPoints++;
			}
		}
		return adjustPoints(rawPoints, level);
	}
	
	// "Land" an active-pixel that cannot fall any further by
	// changing its class and updating occupiedGrid. Create a new
	// active-pixel and return it.
	function landPixel(pix, x, y, grid) {
		var points = 0;
		// Deactivate the pixel by changing its class
		pix.removeClass("active-pixel");
		// Include the row number so that the whole row can be
		// removed on scoring.
		pix.addClass("landed-pixel row" + y);
		grid[y][x] = 1;
		$oldContents = $(".stack-container").html();
		// Add a new active-pixel to oldContents (which has all
		// of our old landed-pixels.
		$(".stack-container").html($oldContents + "<span class='active-pixel'></span>");
		pix = $(".stack-container .active-pixel");
		points = checkForScore(grid);
		score += points;
		$(".display-score").html(score);
		return pix;
	}
	
	function getX(pix) {
		return parseInt(Math.round(pix.position().left) / $pixelNum);
	}
	
	function getY(pix) {
		return parseInt(Math.round(pix.position().top) / $pixelNum);
	}
	
	// Return a new className given a current className and an
	// argument for direction of rotation.
	//
	// New classes will style the block so that it appears to rotate.
	// Negative direction creates a counter-clockwise rotation, 
	// positive is clockwise, and zero will produce no change (i.e.
	// the old className will be returned). 
	//
	// All block classes follow the naming convention of
	//		blockLetter - "block" curStateNum numStates
	// so determining the correct next state can easily be done by
	// slicing the string of the className. No block has more than
	// four states, so the parameters to the slice() function can
	// always be the same.
	function getNewBlockClass(direction, className) {
		var numStates = className.slice(-1);
		var curStateNum = className.slice(-2,-1);
		var blockLetter = className.slice(0,1);
		var nextStateNum = 0;
		var newClassName = "";
		
		if (direction < 0) {
			nextStateNum = (parseInt(curStateNum) - 1 + parseInt(numStates)) % parseInt(numStates);
		} else if (direction > 0) {
			nextStateNum = (parseInt(curStateNum) + 1) % parseInt(numStates);
		} else {
			return className;
		}
		
		newClassName = blockLetter + "-block" + nextStateNum + numStates;
		//console.log(newClassName);
		return newClassName;
	}
	
	// Get the first class name other than "active-block" for a
	// block. This function will only work properly if no other
	// class names are applied to active-blocks other than state
	// class names (i.e. i-block12, o-block00, etc.).
	function getCurBlockClass(obj) {
		var curClassName = "";
		//$classes = $(".active-block").attr("class").split(/\s+/);
		$classes = obj.attr("class").split(/\s+/);
		$.each($classes, function(index, item) {
			if (item !== "active-block") {
				curClassName = item;
				return false;
			}
		});
		return curClassName;
	}
	
	function rotateBlock(obj, direction) {
		var curClass = getCurBlockClass(obj);
		var newClass = getNewBlockClass(direction, curClass);
		obj.attr("class", "active-block " + newClass);
		//console.log(curClass + ", " + newClass);
	}
	
	// rotateBlock() demo. TO DO: Tie to keydowns instead of clicks.
	$(".active-block").click(function() {
		rotateBlock($(this), 1)
	});
		
	// Pixels will drop one unit of height instantly, then wait
	// stepWait milliseconds before proceeding.
	var stepWait = 600;
    function loop(grid) {
		// Break loop if stopped boolean is true.
		if (stopped) {
			return;
		}
		// Get the active pixel
		$pixel = $(".stack-container .active-pixel");
		// Get coordinates in occupied grid
		var pixX = getX($pixel);
		// If the bottom is reached
		if (getY($pixel) > ($stackHeight - 2)) {
			$pixel = landPixel($pixel, pixX, getY($pixel), grid);
		// If the next pixel down is occupied
		} else if (grid[getY($pixel) + 1][pixX] == 1) {
			$pixel = landPixel($pixel, pixX, getY($pixel), grid);
		}
        $pixel.animate({
            top: '+=' + parseFloat($pixelNum) + $pixelFormat,
        }, 0, "linear", function() {
			setTimeout(function() {
				loop(grid);
			;}, stepWait);		
        });
    }		
    loop(occupiedGrid);
	
	// Lateral movement is instantaneous. May want to delay.
	$(document).keydown(function() {
		$pixel = $(".stack-container .active-pixel");
		var pixX = getX($pixel);
		// Move right (d, right arrow, and numpad 6)
		if (event.which == 68 || event.which == 39 || event.which == 102) {
			if (occupiedGrid[getY($pixel)][pixX + 1] == 0) {
				$pixel.animate({
					left: '+=' + $pixelNum + $pixelFormat
				},0);
			}
		// Move left (a, left arrow, and numpad 4)
		} else if (event.which == 65 || event.which == 37 || event.which == 100) {
			if (occupiedGrid[getY($pixel)][pixX - 1] == 0) {
				$pixel.animate({
					left: '-=' + $pixelNum + $pixelFormat
				},0);
			}
		}
		// Move down (x, down arrow, and numpad 2). TO DO: Fix this.
		else if (event.which == 88 || event.which == 40 || event.which == 98) {
			if ((getY($pixel) < $stackHeight - 1) && (occupiedGrid[getY($pixel) + 1][pixX] == 0)) {
				$pixel.animate({
					top: '+=' + $pixelNum + $pixelFormat
				},0);
			} else {
				$pixel = landPixel($pixel, pixX, getY($pixel), occupiedGrid);	
			}
		}
		// z key. Use for testing. Use something like this when
		// clearing lines on scoring or levelling up.
		else if (event.which == 90) {
			if (stopped) {
				stopped = false;
				loop(occupiedGrid);
			} else {
				stopped = true;
			}
		}
		// Check that pixel hasn't fallen out of bounds.
		if ($pixel.position().left - 1 < 0) {
			$pixel.css("left",0);
		} else if (($pixel.position().left + 1) > (($stackWidth - 1) * $pixelNum)) {
			$pixel.css("left",($stackWidth - 1) * $pixelNum + "px");
		}
		if (($pixel.position().top) > (($stackHeight - 1) * $pixelNum)) {
			$pixel.css("top",($stackHeight - 1) * $pixelNum + "px");
		}
	});
	
	
	// First draft of drop animation. Only one pixel will 
	// occupy stack-container.
	
	/*$(".stack-container").html("<span class='pixel'></span>");
	$pixel = $(".stack-container span");
	
	// Pixels will drop one unit of height instantly, then wait
	// stepWait milliseconds before proceeding.
	var i = 0;
	var stepWait = 1000;
    function loop() {
		if (i > ($stackHeight - 2)) {
			i = 0;
			$pixel.css({top:0});
		}
        $pixel.animate({
            top: '+=' + parseFloat($pixelNum) + $pixelFormat,
        }, 0, "linear", function() {
			setTimeout(function() {
				i++;
				loop();
			;}, stepWait);		
        });
    }		
    loop();
	
	// First draft of lateral movement animation
	// Lateral movement is instantaneous. May want to delay.
	$(document).keydown(function() {
		// Move right (d, right arrow, and numpad 6)
		if (event.which == 68 || event.which == 39 || event.which == 102) {
			$pixel.animate({
				left: '+=' + $pixelNum + $pixelFormat
			},0);
		// Move left (a, left arrow, and numpad 4)
		} else if (event.which == 65 || event.which == 37 || event.which == 100) {
			$pixel.animate({
				left: '-=' + $pixelNum + $pixelFormat
			},0);			
		}	
		if ($pixel.position().left - 1 < 0) {
			$pixel.css("left",0);
		} else if (($pixel.position().left + 1) > (($stackWidth - 1) * $pixelNum)) {
			$pixel.css("left",($stackWidth - 1) * $pixelNum + "px");
		}
	});*/
});