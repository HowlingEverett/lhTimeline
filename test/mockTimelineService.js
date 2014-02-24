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
  };
  
  channelService.prototype.channelById = function(channelId) {
    var channel = _.find(this.channels, function(channel) {
      return channel._id === channelId;
    });
    
    return channel;
  };
  
  channelService.prototype.setVisible = function(channelId, visible) {
    var channel = this.channelById(channelId);
    if (channel) {
      channel.visible = visible;
    }
  };
  
  channelService.prototype.setPriority = function(channelId, newPriority) {
    var channel, channels;
    
    channel = this.channelById(channelId);
    if (!channel) {
      return;
    }
    
    this.channels = serviceUtils.changePriority(this.channels, channel, newPriority);
  };
  
  return channelService;
});

lhTimeline.service('MockChannel', function($rootScope) {
  var contentService = {
    channels: {
      channelId1: [
        {
          _id: 'contentId1'
          , start: new Date(2014, 0, 23, 9, 15)
          , end: new Date(2014, 0, 23, 9, 16)
          , filename: "/path/to/audio1.mp3"
        }
        , {
          _id: 'contentId2'
          , start: new Date(2014, 0, 23, 9, 17)
          , end: new Date(2014, 0, 23, 9, 21)
          , filename: "/path/to/audio2.mp3"
        }
        , {
          _id: 'contentId3'
          , start: new Date(2014, 0, 23, 9, 43)
          , end: new Date(2014, 0, 23, 9, 48)
          , filename: "/path/to/audio3.mp3"
        }
      ]
      , channelId2: [
        {
          _id: 'contentId4'
          , start: new Date(2014, 0, 23, 9, 10)
          , filename: "/path/to/cap1.png"
        }
        , {
          _id: 'contentId5'
          , start: new Date(2014, 0, 23, 9, 16)
          , filename: "/path/to/cap2.png"
        }
        , {
          _id: 'contentId6'
          , start: new Date(2014, 0, 23, 9, 25)
          , filename: "/path/to/cap3.png"
        }
      ]
      , channelId3: [
        {
          _id: 'contentId7'
          , start: new Date(2014, 0, 23, 9, 17)
          , end: new Date(2014, 0, 23, 9, 21)
          , location: {latitude: 28.0131, longitude: -153.23123}
        }
        , {
          _id: 'contentId8'
          , start: new Date(2014, 0, 23, 9, 17)
          , end: new Date(2014, 0, 23, 9, 21)
          , location: {latitude: 28.0131, longitude: -153.23123}
        }
        , {
          _id: 'contentId8'
          , start: new Date(2014, 0, 23, 9, 17)
          , end: new Date(2014, 0, 23, 9, 21)
          , location: {latitude: 28.0131, longitude: -153.23123}
        }
      ]
    }
  };
  
  contentService.prototype.getContent = function(channelId) {
    return this.channels[channeldId];
  };
});
