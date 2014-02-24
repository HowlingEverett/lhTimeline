'use strict';

describe('lhServiceUtils utility service', function() {
  var serviceUtils;
  
  beforeEach(module('lh.service.utils'));
  
  beforeEach(inject(function(_serviceUtils_) {
    serviceUtils = _serviceUtils_;
  }));
  
  describe('change priority function', function() {
    var priorityList, element;
    
    beforeEach(function() {
      priorityList = [
        {title: 'Bob', priority: 0},
        {title: 'Tony', priority: 1},
        {title: 'Jim', priority: 2}
      ];
      element = priorityList[0];
    })
    
    it('should change the element to the specified priority', function() {
      priorityList = serviceUtils.changePriority(priorityList, element, 1);
      priorityList.forEach(function(el) {
        if (el.title === 'Bob') {
          element = el;
        }
      });
      
      expect(element.priority).toBe(1);
    });
    
    it('should reprioritise the other elements and re-sort the list', function() {
      priorityList = serviceUtils.changePriority(priorityList, element, 1);
      
      expect(priorityList[0].title).toBe('Tony');
      expect(priorityList[0].priority).toBe(0);
      expect(priorityList[1].title).toBe('Bob');
      expect(priorityList[1].priority).toBe(1);
      expect(priorityList[2].title).toBe('Jim');
      expect(priorityList[2].priority).toBe(2);
      
      element = priorityList[2];
      priorityList = serviceUtils.changePriority(priorityList, element, 0);
      expect(priorityList[0].title).toBe('Jim');
      expect(priorityList[0].priority).toBe(0);
      expect(priorityList[1].title).toBe('Tony');
      expect(priorityList[1].priority).toBe(1);
      expect(priorityList[2].title).toBe('Bob');
      expect(priorityList[2].priority).toBe(2);
    });
    
    it('should prioritise based on custom priority property if specified', function() {
      priorityList = [
        {title: 'Bob', orderIndex: 0},
        {title: 'Tony', orderIndex: 1},
        {title: 'Jim', orderIndex: 2}
      ];
      element = priorityList[0];
      priorityList = serviceUtils.changePriority(priorityList, element, 1, 'orderIndex');
      expect(priorityList[1].title).toBe('Bob');
      expect(priorityList[1].orderIndex).toBe(1);
    })
  });
});