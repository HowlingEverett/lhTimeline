(function() {
  'use strict';

  var serviceUtils = angular.module('lh.service.utils', []);

  serviceUtils.service('serviceUtils', function() {

    // Reprioritises the priority list around the new priority value
    function reprioritise(priorityList, newPriority, oldPriority, priorityProp) {
      var delta, el, i;
    
      delta = newPriority - oldPriority;
      
      if (delta > 0) {
        // If we're moving to a higher number priority
        for (i = oldPriority + 1; i <= newPriority; i++) {
          el = priorityList[i];
          el[priorityProp] = el[priorityProp] - 1;
        }
      } else {
        // If we're moving to a lower number priority
        for (i = newPriority; i < oldPriority; i++) {
          el = priorityList[i];
          el[priorityProp] = el[priorityProp] + 1;
        }
      }
    
      priorityList[oldPriority][priorityProp] = newPriority;
      return priorityList;
    }

    return {
    
      // For changing the priority of an element in a collection of objects 
      // that should remain sorted based on a priority property on each element.
      // For example:
      // 
      // var collection = [
      //   { priority: 0, title: "Bob" },
      //   { priority: 1, title: "Tony"},
      //   { priority: 2, title: "Jim"}
      // ]
      changePriority: function(priorityList, element, newPriority) {
        var priorityProp, oldPriority;
      
        priorityProp = 'priority';
        if (arguments.length === 4 && typeof arguments[3] === 'string') {
          priorityProp = arguments[3];
        }
      
        oldPriority = element[priorityProp];
        priorityList = reprioritise(priorityList, newPriority, oldPriority, priorityProp);
      
        priorityList = priorityList.sort(function(a, b) {
          return a[priorityProp] - b[priorityProp];
        });
      
        return priorityList;
      }
    };
  });
}());