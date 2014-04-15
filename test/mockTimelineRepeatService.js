'use strict';

var lhTimeline = angular.module('lh.timeline');

lhTimeline.service('MockTimeline', function($rootScope, serviceUtils) {
  var channelService = {
    channels: [
      {_id: 'channelId1', title: 'Audio', priority: 0, visible: true
        , icon: '/images/icons/audio.png', glyphicon: 'headphones', color: '#5CB85C'}
      , {_id: 'channelId2', title: 'Screen Capture', priority: 1, visible: true
        , icon: '/images/icons/image.png', glyphicon: 'picture', color: '#5BC0DE'}
      , {_id: 'channelId3', title: 'Locations', priority: 2, visible: true
        , icon: '/images/icons/location.png', glyphicon: 'screenshot', color: '#F0AD4E'}
    ]

  , channelById: function(channelId) {
      return _.find(this.channels, function(ch) {
        return ch._id === channelId;
      });
    }
  , setVisible: function(channelId, visible) {
      var channel = this.channelById(channelId);
      if (channel) {
        channel.visible = visible;
      }
    }
  , setPriority: function(channelId, newPriority) {
      var channel;

      channel = this.channelById(channelId);
      if (!channel) {
        return;
      }

      this.channels = serviceUtils.changePriority(this.channels, channel, newPriority);
    }
  };
  
  return channelService;
});

lhTimeline.service('MockChannel', function($rootScope) {
  var contentService
    , current
    , scope;
  
  scope = $rootScope.$new();
  
  contentService = {
    channels: function(start, end) {
      var audioContent
        , screenCapContent
        , locationContent;
      
      
      
      // Random create audio content
      audioContent = generateMockData('audio', start, end);
      // Random create screen capture content
      screenCapContent = generateMockData('screencap', start, end);
      // Random create location content
      locationContent = generateMockData('location', start, end);
      
      return {
        audio: audioContent
      , screenCap: screenCapContent
      , location: locationContent
      , default: audioContent
      };
    }
  };

  /*
  get(start, end, channelIdentifier, success)
  or
  get(start, end, success)
   */
  contentService.get = function() {
    var start
      , end
      , contentIdentifier
      , success;

    if (arguments.length === 3) {
      start = arguments[0];
      end = arguments[1];
      contentIdentifier = 'default';
      success = arguments[2];
    } else if (arguments.length === 4) {
      start = arguments[0];
      end = arguments[1];
      contentIdentifier = arguments[2];
      success = arguments[3];
    } else {
      throw new Error('get(start, end, [contentIdentifier], successFn)');
    }

    if (typeof success !== 'function') {
      throw new Error('Last argument must be a success callback');
    }

    if (!(start instanceof Date && end instanceof Date)) {
      throw new Error('Start and end parameters must be Date objects');
    }


    success(this.channels(start, end)[contentIdentifier]);

  };
  
  current = 0;
  $rootScope.refresh = function() {
    current += 1;
  };
  
  $rootScope.insert = function() {
    scope.$broadcast('insert.channelItem');
  };
/*
  contentService.prototype.loading = function(value) {
    
  };
*/
  
  contentService.revision = function() {
    return current;
  };
  
  // Private functions
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  
  function getRandomChoice(list) {
    var index;
    if (!list instanceof Array) {
      return null;
    }
    
    index = getRandomInt(0, list.length);
    return list[index];
  }
  
//  function generateMockChannelItem(start, end) {
//    var eventStart
//      , eventDuration
//      , eventEnd;
//
//    eventStart = new Date(getRandomInt(start.getTime(), end.getTime()));
//    eventDuration = getRandomInt(10000, end - eventStart);
//    eventEnd = new Date(eventStart.getTime() + eventDuration);
//
//    return {
//      start: eventStart
//    , duration: eventDuration
//    , end: eventEnd
//    };
//  }

  function generateMockChannelItem(start) {
    var eventStart
      , eventDuration
      , eventEnd;

    eventStart = new Date(start.getTime());
    eventStart.setSeconds(0);
    eventStart.setMilliseconds(0);
    eventDuration = 60000;
    eventEnd = new Date(eventStart.getTime() + eventDuration);

    return {
      start: eventStart
    , end : eventEnd
    , duration: eventDuration
    };
  }
  
  function incrementTime(eventStart, duration) {
    return new Date(eventStart.getTime() + duration + 60000);
  }
  
  function generateMockData(channelType, start, end) {
    var channelEvents = []
      , prevEndTime
      , event;
    
    prevEndTime = start;
    while (prevEndTime < end) {
      event = generateMockChannelItem(prevEndTime, end);
      
      // Mutate event type based based on provided type
      if (channelType === 'audio') {
        event = mutateToAudio(event);
      } else if (channelType === 'screencap') {
        event = mutateToScreenCapture(event);
      } else if (channelType === 'location') {
        event = mutateToLocation(event);
      }
    
      channelEvents.push(event);
      prevEndTime = incrementTime(event.start, event.duration);
    }
    
    return channelEvents;
  }
  
  function mutateToAudio(channelItem) {
    channelItem.filename = '/path/to/audio.mp3';
    return channelItem;
  }
  
  function mutateToScreenCapture(channelItem) {
    channelItem.filename = '/path/to/screenCap.png';
    delete channelItem.duration;
    delete channelItem.end;
    
    return channelItem;
  }
  
  function mutateToLocation(channelItem) {
    channelItem.location = {
      label: getRandomChoice(['Tom\'s Hardware', 'Warehouse', '128 Show St Lismore', 'Home'])
    , latitude: -27.4073899
    , longitude: 153.0028595
    };
    return channelItem;
  }
  
  return contentService;
});
