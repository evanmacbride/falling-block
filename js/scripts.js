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

	// Add an active-block to stack-container. Start with an o-block.
	$(".stack-container").html("<div class='block-wrap'><div class='active-block o-block01'></div></div>");

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
	
	// "Land" an active-block that cannot fall any further by
	// changing its class and updating occupiedGrid. Create a new
	// active-block and return it.
	function landBlock(block, x, y, grid) {
		var points = 0;
		// Deactivate the block by changing its class
		block.removeClass("active-block");
		// Include the row number so that the whole row can be
		// removed on scoring.
		block.addClass("landed-block row" + y);
		grid[y][x] = 1;
		$oldContents = $(".stack-container").html();
		// Add a new active-block to oldContents (which has all
		// of our old landed-blocks.
		$(".stack-container").html($oldContents + "<span class='active-block'></span>");
		block = $(".stack-container .active-block-wrap");
		points = checkForScore(grid);
		score += points;
		$(".display-score").html(score);
		return block;
	}
	
	
	function getX(block) {
		return parseInt(Math.round(block.position().left) / $pixelNum);
	}
	
	function getY(block) {
		return parseInt(Math.round(block.position().top) / $pixelNum);
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
	
	// TODO: Make sure I'm passing active-block and not 
	// active-block-wrap.
	// Get the first class name other than "active-block" for a
	// block. This function will only work properly if no other
	// class names are applied to active-blocks other than state
	// class names (i.e. i-block12, o-block00, etc.).
	function getCurBlockClass(obj) {
		var curClassName = "";
		$classes = obj.attr("class").split(/\s+/);
		$.each($classes, function(index, item) {
			if (item !== "active-block") {
				curClassName = item;
				return false;
			}
		});
		return curClassName;
	}
	
	// TODO: Make sure I'm passing active-block, not active-block-wrap.
	function rotateBlock(obj, direction) {
		var curClass = getCurBlockClass(obj);
		var newClass = getNewBlockClass(direction, curClass);
		obj.attr("class", "active-block " + newClass);
	}
	
	// rotateBlock() demo. TODO: Tie to keydowns instead of clicks.
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
		// Get the active-block
		$block = $(".active-block-wrap");
		
		// Get coordinates in occupied grid
		var blockX = getX($block);			
		console.log(getY($block));
		// If the bottom is reached
		if (getY($block) > ($stackHeight - 3)) { // 1 + height of current block state
			stopped = true;
			return;
			//$block = landBlock($block, pixX, getY($block), grid); // TO DO
			
		// If the next pixel down is occupied
		//} else if (grid[getY($pixel) + 1][pixX] == 1) {
		//	$pixel = landPixel($pixel, pixX, getY($pixel), grid);
		//}
		
		// If the next pixel down is occupied
		} else if (grid[getY($block) + 1][blockX] == 1) {
			//$block = landBlock($block, pixX, getY($block), grid); // TO DO
		}		
		
        /*$pixel.animate({
            top: '+=' + parseFloat($pixelNum) + $pixelFormat,
        }, 0, "linear", function() {
			setTimeout(function() {
				loop(grid);
			;}, stepWait);		
        });*/
		
        $block.animate({
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
});