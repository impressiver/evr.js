;(function( $, window, document, undefined ) {
  "use strict";

  var pluginName = "evr",
      defaults = {
        monitors: ['native']
      },
      instances = 0, evr;

  var eventProto = Event.prototype,
      EVENTS = {
        'mouse': [ 'click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseover', 'mousemove', 'mouseout', 'mousewheel', 'drag', 'dragend', 'dragenter', 'dragleave', 'dragover', 'drop'],
        'key': [ 'keydown', 'keypress', 'keyup', 'input', 'textInput' ],
        'touch': [ "touchstart", "touchmove", "touchend", "touchcancel" ],
        'control': [ "resize", "scroll", "zoom", "focus", "blur", "select", "change", "submit", "reset", "search", "devicemotion", "deviceorientation", 'copy', 'cut', 'paste' ],
        'res': [ 'load', 'unload', 'beforeunload', 'abort', 'error', 'resize', 'scroll', 'readystatechange' ],
        'dom': [ 'DOMFocusIn', 'DOMFocusOut', 'DOMActivate', 'DOMCharacterDataModified', 'DOMNodeInserted', 'DOMNodeRemoved', 'DOMSubtreeModified' ],
      },
      ALL_EVENTS = [],
      PHASES = [ '', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE' ];

  var es = 0,
      getEventPropagationPath = function ( e ) {
        var elem = e.target,
            eventPath, cur, old;

        eventPath = [
          elem
        ];
        if ( ! $.isWindow(elem) ) {
          cur = elem.parentNode;
          for (old = elem; cur; cur = cur.parentNode) {
            eventPath.push(cur);
            old = cur;
          }

          // Only add window if we got to document (e.g., not plain obj or detached DOM)
          if (old === (elem.ownerDocument || document)) {
            eventPath.push(old.defaultView || old.parentWindow || window);
          }
        }

        return eventPath.reverse();
      },
      wrapEvent = function ( e ) {
        e = $.event.fix( e );

        if( ! e.uid ) {
          e.uid = es++;
        }
        if( ! e.eventPath ) {
          e.propagationPath = getEventPropagationPath( e );
        }

        return e;
      },
      logEvent = function( e ) {
        console.log("EVR", e.type, e.currentTarget, PHASES[e.eventPhase], e);
      },
      handleEvent = function( e ) {
        e = wrapEvent( e );

        var curr = e.currentTarget,
            target = e.target,
            phase = e.eventPhase,
            type = e.type;

        logEvent( e );

        if( phase === PHASES.indexOf('CAPTURING_PHASE') ) {
          if( curr !== target ) {
            // target ancestors
          } else {
            console.log('Capturing at target??', e);
          }
        } else if( phase === PHASES.indexOf('AT_TARGET') ) {
          if( curr === target ) {
            $(target).addClass('evr-target evr-type-' + type);

            // DOM 0 handlers
            if ( curr['on' + type] === 'function' ) {
              $(target).addClass('evr-handler');
            }
          } else {
            console.log('At target but not target??', e);
          }
        } else if( phase === PHASES.indexOf('BUBBLING_PHASE') ) {
          if( curr !== target ) {
            if ( target.parentNode === curr ) {
              $(target).removeClass('evr-target evr-handler evr-type-' + type);
            }

            // all ancestors
          } else {
            console.log('Bubbling at target??', e);
          }
        } else {
          console.log('Unknown phase!!', e);
        }
      },
      addPropagationHandlers = function( e ) {
        var type = e.type;

        e.propagationPath.forEach( function( elem ) {
          if ( $.isWindow(elem) ) return;
          elem.addEventListener( type, handleEvent, false );
        });
      },
      removePropagationHandlers = function( e ) {
        var target = e.target,
            type = e.type;

        // TODO: (IW) Find a better spot for this
        $(target).removeClass('evr-target evr-handler evr-type-' + type);

        e.propagationPath.slice(0).reverse().forEach( function( elem ) {
          if ( $.isWindow(elem) ) return;
          elem.removeEventListener( type, handleEvent, false );
        });
      },
      trapEvent = function ( e ) {
        e = wrapEvent( e );

        var curr = e.currentTarget,
            target = e.target,
            type = e.type,
            phase = e.eventPhase,
            bubbles = e.bubbles;

        if( phase === PHASES.indexOf('CAPTURING_PHASE') || phase === PHASES.indexOf('AT_TARGET') ) {
          if( $.isWindow(curr) && !$.isWindow(target) ) {
            console.log('Adding propagation handlers', type, phase);
            addPropagationHandlers( e );
          } else {
            console.log('Not adding propagation handlers', type, phase, bubbles);
          }
        } else if( phase === PHASES.indexOf('BUBBLING_PHASE') ) {
          if( $.isWindow(curr) ) {
            // TODO: What if multiple events of the same type are in progress
            console.log('Removing propagation handlers', type, phase);
            removePropagationHandlers( e );
          }
        } else {
          console.log('Unknown phase!!', e);
        }

        // e.stopPropagation();
        // e.preventDefault();
      },
      bindEvents = function( eventName ) {
        console.log('bindEvents', this, arguments);
        unbindEvents.call( this, eventName );
        this.container.addEventListener( eventName, trapEvent, true );
        this.container.addEventListener( eventName, trapEvent, false );
      },
      unbindEvents = function( eventName ) {
        console.log('unbindEvents', this, arguments);
        this.container.removeEventListener( eventName, trapEvent, true );
        this.container.removeEventListener( eventName, trapEvent, false );
      };

  Object.keys(EVENTS).forEach( function( curr ) { ALL_EVENTS = ALL_EVENTS.concat( EVENTS[curr] ); } );

  /**
   * EVR Class
   */

  function EVR( container, options ) {
    if ( !window.Event && !('keys' in Object) && !('bind' in Function) ) {
      this.browserNotSupported();
      return;
    }

    this.container = container || window;
    this.options = $.extend( {}, defaults, options || {});

    this._uid = EVR.genUID();
    this.monitors = {};

    this.init();

    return this;
  }
  // Class methods
  $.extend(EVR, {
    genUID: function() {
      return instances++;
    },

    Monitor: function( type, container, options ) {
      return new EVR.Monitor[type]( container, options );
    },

    Event: function( type, options ) {

    }
  });

  // Prototype
  EVR.prototype = {
    init: function() {
      var that = this;
      $.each(this.options.monitors, function(i, type) {
        that.monitors[type] = EVR.Monitor( type, that.container, that.options );
      });
      console.log('evr.init', that);
    },

    start: function() {
      console.log('evr.start', this, arguments);
      var that = this;
      $.each( this.monitors, function( type, listener ) {
        console.log("starting", listener);
        listener.start();
      });
    },

    stop: function() {
      console.log('evr.stop', this, arguments);
      var that = this;
      $.each(this.monitors, function( i, type ) {
        that.monitors[type].stop();
      });
    }
  };

  /**
   * Event Wrappers
   */

  function WrappedEvent( e ) {
    console.log("wrappedEvent", this, arguments);
  }

  function BaseMonitor( container, options ) {
    console.log("BaseMonitor", this, arguments);
    this.container = container;
    this.options = options;
  }
  BaseMonitor.prototype = {
    start: function() {
      console.log( "baseMonitor.start", this, arguments );
    },
    stop: function() {
      console.log( "baseMonitor.stop", this, arguments );
    }
  }

  // Listen for native browser events
  function NativeMonitor( container, options ) {
    console.log("NativeMonitor", this, arguments);
    BaseMonitor.apply( this, arguments );
  }
  NativeMonitor.prototype = Object.create(BaseMonitor.prototype, {
    start: {
      value: function( eventType ) {
        console.log("nativeMonitor.start", this, arguments );
        var binder = bindEvents.bind( this );

        if( ! eventType ) {
          ALL_EVENTS.forEach( binder );
        } else if( eventType in EVENTS ) {
          EVENTS[eventType].forEach( binder );
        } else {
          binder( eventType );
        }
      }
    },
    stop: {
      value: function( eventType ) {
        var unbinder = unbindEvents.bind( this );

        if(!eventType) {
          ALL_EVENTS.forEach( unbinder );
        } else if( eventType in EVENTS ) {
          EVENTS[eventType].forEach( unbinder );
        } else {
          unbinder( eventType );
        }
      }
    }
  });
  // EVR.Monitor.register('native', NativeMonitor);
  EVR.Monitor['native'] = NativeMonitor;

  /**
   * Event Types
   */

  function BaseEvent( options ) {

  }
  BaseEvent.type = 'base';
  BaseEvent.prototype = {

  }

  function JQueryEvent( options ) {

  }
  JQueryEvent.type = 'jquery';

  // TODO: (IW) Backbone.Event

  /**
   * jQuery Bindings
   */

  // Bind EVR as a jQuery extension
  $.fn['evr'] = function (fn, options) {
    // Loop for each jQuery element matched by the selector
    return this.each(function () {

      // Called with options only
      if( arguments.length === 1 && typeof fn == 'object' ) {
        options = fn;
        fn = undefined;
      }

      // Create a new instance of EVR if needed
      if ( ! $.data(this, 'plugin.evr') ) {
        $.data( this, 'plugin.evr', new EVR(this, options) );
      }

      var evr = $.data( this, 'plugin.evr' );

      // Call the requested method if it exists
      if( !!fn && typeof evr[fn] == 'function' ) {
        // If 'destroy' was called, destroy and remove th e
        if( fn == 'destroy' ) {
          evr.destroy();
          evr = undefined;
          return;
        }

        evr[fn].apply( evr, Array.prototype.slice.call( arguments, 1 ) );
      }

    });
  };

})( jQuery, window, document );