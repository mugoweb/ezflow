// Calendar Start
YAHOO.namespace("timeline.calendar");

// Custom fuction for displaying the calendar
YAHOO.timeline.calendar.cShow = function()
{
    var Dom = YAHOO.util.Dom;

    Dom.get( "show_calendar" ).style.backgroundImage = YAHOO.timeline.calendar.arrowImageUp;
    Dom.get( "slider-container" ).style.marginTop = "17.3em";

    YAHOO.timeline.calendar.cal1.show();
    YAHOO.timeline.calendar.isVisible = true;
}

// Custom function for closing the calendar
YAHOO.timeline.calendar.cClose = function()
{
    var Dom = YAHOO.util.Dom;
    
    Dom.get( "show_calendar" ).style.backgroundImage = YAHOO.timeline.calendar.arrowImageDown;
    Dom.get( "slider-container" ).style.marginTop = "15px";
    
    YAHOO.timeline.calendar.cal1.hide();
    YAHOO.timeline.calendar.isVisible = false;
}

// Toogle calendar visibiliy.
YAHOO.timeline.calendar.toogleCalendar = function(e)
{
    if ( YAHOO.timeline.calendar.isVisible == false )
    {
        YAHOO.timeline.calendar.cShow();
    }
    else
    {
        YAHOO.timeline.calendar.cClose();
    }
}

YAHOO.timeline.calendar.selectDateHandler = function( type, args, objs) 
{
	var weekdays = this.cfg.getProperty( "WEEKDAYS_LONG" );
    var months = this.cfg.getProperty( "MONTHS_LONG" );
    var monthsShort = this.cfg.getProperty( "MONTHS_SHORT" );
    
	var selected = args[0][0];
    var year = parseInt( selected[0] );
    var month = parseInt( selected[1] );
    var day = parseInt( selected[2] );
    
    var date = new Date();
    date.setFullYear( year, month - 1, day );
    date.setHours( parseInt( YAHOO.timeline.slider.timeStartHours ) );
    date.setMinutes( parseInt( YAHOO.timeline.slider.timeStartMinutes ) );
    date.setSeconds( 0 );
    
    var longDateString = weekdays[date.getDay()]; // Name of Day         

    // Pad the day of month number with a 0 if needed...
    if ( day < 10 )
        longDateString = longDateString + "  0" + day.toString();  
    else
        longDateString = longDateString + "  " + day.toString();

    longDateString = longDateString + "  " + months[month - 1];   // Month
    longDateString = longDateString + "  " + year.toString();     // Year
    
	YAHOO.util.Dom.get( "show_calendar" ).innerHTML = longDateString;
	
    // Update our internal timestamp
    YAHOO.timeline.slider.timestampStart = Date.parse( date ) / 1000; // convert into seconds from milliseconds
    
    // Ok, we're done, close the calendar.
    YAHOO.timeline.calendar.cClose();
    
    // Trigger update of blocks
    YAHOO.timeline.common.updateBlocks();
};

YAHOO.timeline.calendar.init = function() 
{
    YAHOO.timeline.calendar.cal1 = new YAHOO.widget.CalendarGroup( "cal1", "cal1Container", {pages:3, title:false, close:false} );

    var calendar = YAHOO.util.Dom.get( "show_calendar" );
    YAHOO.timeline.calendar.cClose();
	
    YAHOO.timeline.calendar.cal1.selectEvent.subscribe( YAHOO.timeline.calendar.selectDateHandler, YAHOO.timeline.calendar.cal1, true );
	YAHOO.timeline.calendar.cal1.render();

	YAHOO.util.Event.addListener( calendar, "click", YAHOO.timeline.calendar.toogleCalendar );
}

YAHOO.util.Event.onDOMReady( YAHOO.timeline.calendar.init );
// End Calendar 



// Slider start
YAHOO.namespace( "timeline.slider" );

// Slider event: while sliding
YAHOO.timeline.slider.onSliderChange = function( offsetFromStart )
{ 
    var offsetFromStart = YAHOO.timeline.slider.slider1.getValue();
    
    var timestamp = YAHOO.timeline.slider.getTimestamp();

    var date = new Date();
    date.setTime( timestamp * 1000 ); // setTime() takes milliseconds, not seconds.

    var hours = date.getHours();
    var minutes = date.getMinutes();

    if ( hours < 10 )
        hours = "0" + hours;

    if ( minutes < 10 )
        minutes = "0" + minutes;

    var label = YAHOO.util.Dom.get( "scrubbing-time" );
    label.style.left = offsetFromStart + YAHOO.timeline.slider.slideLabelInitalSpacing + "px";

    // Update our scrubbing time label.
    label.innerHTML = hours + ":" + minutes;
    
}

// Slider event: Finishing sliding
YAHOO.timeline.slider.onSliderEnd = function() 
{ 
    YAHOO.timeline.common.updateBlocks();    
}

YAHOO.timeline.slider.init = function() 
{ 
    var Event = YAHOO.util.Event, 
        Dom   = YAHOO.util.Dom, 
        lang  = YAHOO.lang;
    
    YAHOO.timeline.slider.bg = "slider-bg";
    YAHOO.timeline.slider.thumb = "slider-thumb";
 
    // The slider can move 0 pixels up 
    var topConstraint = 0; 
 
    // #slider-end width + 20.
    var bottomConstraint = 882; 
 
    // Custom scale factor for converting the pixel offset into a real value 
    YAHOO.timeline.slider.scaleFactor = 1; 
 
    // The amount the slider moves when the value is changed with the arrow keys
    var keyIncrement = 20; 
    
    var tickSize = 20;
    YAHOO.timeline.slider.slider1 = YAHOO.widget.Slider.getHorizSlider( YAHOO.timeline.slider.bg, YAHOO.timeline.slider.thumb, 
                                                                        topConstraint, bottomConstraint, tickSize ); 
    //YAHOO.timeline.slider.slider1.animate = false;
    YAHOO.timeline.slider.slider1.tickPause = 0.2;

    // set inital position
    YAHOO.timeline.slider.slider1.setValue( YAHOO.timeline.slider.initalSliderPosition, true, true, true ); 

    YAHOO.timeline.slider.slider1.subscribe( "change", YAHOO.timeline.slider.onSliderChange ); 
    YAHOO.timeline.slider.slider1.subscribe( "slideEnd", YAHOO.timeline.slider.onSliderEnd ); 
}

// Slider utility method: Generate timestamp from the pixel positon of the thumb.
YAHOO.timeline.slider.getTimestamp = function()
{
    var offsetFromStart = YAHOO.timeline.slider.slider1.getValue();
    
    var value = YAHOO.timeline.slider.slider1.getValue();
    var middeStartPx = YAHOO.timeline.slider.middeStartPx;
    var rightStartPx = YAHOO.timeline.slider.rightStartPx;
    
    var timestamp = YAHOO.timeline.slider.timestampFromPixels( offsetFromStart, 
                                    YAHOO.timeline.slider.middeStartPx, YAHOO.timeline.slider.rightStartPx );
    timestamp = YAHOO.timeline.slider.timestampStart + timestamp;
    
    return timestamp;
}

// Slider utility method: generate a timestamp from the pixel offset where the slider thumb is located.
YAHOO.timeline.slider.timestampFromPixels = function( currentPx, middleStartPx, rightStartPx )
{
    // The slider is devided into 3 different parts
    // Left part: Low precision where 1 tick = 60 min = 20px.
    // Middle part: High precision where 1 tick = 15 min = 20px.
    // Right part: Low precision where 1 tick = 60 min = 20px.

    // This function works by generating a timestamp for each part of the slider
    // and adding them together at the end.
    
    // middelStartPx and rightStartPx indicated where the middle and right
    // parts starts in pixels. The left part starts at 0px.
    
    var leftPart = 0;
    var middlePart = 0;
    var rightPart = 0;
    
    // Are we in the right part of the slider?
    if ( currentPx > rightStartPx )
    {
        rightPart = currentPx - rightStartPx;
    
        // One tick (1px is 60 minutes or 3600 seconds)
        rightPart = rightPart * ( 3600 / 20 );
    }

    // Are we in the range of middle part of the slider?    
    if ( currentPx > middleStartPx )
    {
        // If rightPart is set we need to calcuate timestamp for the whole middel 
        // part, but only middle part, nothing else.
        if ( rightPart > 0 )
            middlePart = rightStartPx - middleStartPx;
        else
            // currentPx is somewhere inside the middle part of the slider. Calculate
            // middle part from where currentPx is.
            middlePart = currentPx - middleStartPx;
        
        // One tick (1px is 15 minutes or 900 seconds)    
        middlePart = middlePart * ( 900 / 20 );        
    }
        
    // Are we in the lower range of the slider?    
    if ( currentPx > 0 )
    {
        leftPart = currentPx;
        
        // If the middlePart is set we should calcuate with all pixels
        // inside the left part of the slider.   
        if ( middlePart > 0 )
            leftPart = middleStartPx;

        // One tick (1px is 60 minutes or 3600 seconds)    
        leftPart = leftPart * ( 3600 / 20 );
    }
    
    return leftPart + middlePart + rightPart;
}

YAHOO.util.Event.onDOMReady( YAHOO.timeline.slider.init );
// End Slider

// Common namespace
YAHOO.namespace("timeline.common");

YAHOO.timeline.common.updateBlocks = function()
{
    YAHOO.timeline.slider.slider1.lock();
    var timestamp = YAHOO.timeline.slider.getTimestamp();
    
     // Update the title attribute on the background.  This helps assistive 
    // technology to communicate the state change
    var date = new Date();
    date.setTime( timestamp * 1000 ) // setTime() takes milliseconds, not seconds.
    YAHOO.util.Dom.get( YAHOO.timeline.slider ).title = date;

    var fetchURL = YAHOO.timeline.slider.fetchURL;
    var nodeid = YAHOO.timeline.slider.nodeid;

    var sourceURL = fetchURL + "/" + timestamp + "/" + nodeid;
    var transaction = YAHOO.util.Connect.asyncRequest( 'GET', sourceURL, YAHOO.timeline.common.updateBlocksCallback, null ); 
}

// Update block callback method: callback for after we've fetched our blocks.
YAHOO.timeline.common.updateBlocksCallback = 
{ 
    success: function(o) 
    {
        if ( o.responseText != "" )
        {
            //var blocks = eval( "(" + o.responseText + ")" );
            var blocks = o.responseText.evalJSON();
            for ( var objIterator = 0; objIterator < blocks.length; objIterator++ )
            {
                var blockID = "address-" + blocks[objIterator].objectid;
                var xhtml = blocks[objIterator].xhtml.unescapeHTML();
                
                // Take care of doubel quotes ""
                xhtml = xhtml.gsub( '&quot;', '"' );
                // Take care of single quotes ''
                xhtml = xhtml.gsub( '&#039;', "'" );

                var myScripts = xhtml.extractScripts();

                var node = YAHOO.util.Dom.get( blockID );
                YAHOO.util.Dom.get( blockID ).innerHTML = xhtml;
                // execute any scripts that might have been in the returned xhtml
                var myReturnedValues = myScripts.map( function( script ) 
                {
                    // Remove any html comments that might exists in the js. It seems to upset firefox.
                    script = script.gsub( "<!--", "" );
                    script = script.gsub( "//-->", "" );
                    script = script.gsub( "-->", "" );
                  return eval( script );
                });

                // If return xhtml contains <div id="address-..."> we need to remove it, if not 
                // we end up with double sets of <div id="address-..."> since we put the returned
                // xhtml into the innerHTML of the existing <div id="address-..."> tag.
                if ( node.childNodes[0].id == blockID )
                {
                    node.innerHTML = node.firstChild.innerHTML;
                }
            }
        }
        YAHOO.timeline.slider.slider1.unlock();
    }, 
    failure: function(o) 
    {
        //alert( "Fetching blocks failed..." );
        YAHOO.timeline.slider.slider1.lock();
    }, 
};