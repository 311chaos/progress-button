"use strict";
App.directive('progressButton', ['$interval', '$timeout', function($interval, $timeout) {
  return {
    restrict: "EA",
    transclude: true,
    replace: true,
    scope: {
      additionalClasses: "@"
    },
    template: '<span class="progButton"><canvas id="fill" width="1" height="1" ></canvas><button class="btn" ng-class="additionalClasses" ng-transclude></button><input type="range" min="0" max ="100" data-ng-model="doneString"/><input type="number" data-ng-model="done" data-ng-change="drawPercentRect({{done}})"/> </span>',
    link: function(scope, element, attrs) {

      var internals = {
        tick_length: 15,
        incrementBy: 3,
        incrementPromise: null,
        decrementPromise: null,
        button: element.find('button'),
        lineWidth: parseInt(attrs.lineWidth) || 4,
        borderColor: attrs.borderColor || 'blue'
      };
      
      scope.done = 100;
      scope.doneString = "100";


      internals.button.ready(function() {

        //need reference to the canvas element
        var canvas = element.find('canvas')[0];
        var width = canvas.attributes['width'].value = internals.button[0].offsetWidth + (internals.lineWidth * 2);
        var height = canvas.attributes['height'].value = internals.button[0].offsetHeight + (internals.lineWidth * 2);

        //setting these values normalizes the values, in display the button would be 71.7798787px tall, but getting the property would return 72px.
        internals.button[0].style.height = internals.button[0].offsetHeight;
        internals.button[0].style.width = internals.button[0].offsetWidth;

        var ctx = canvas.getContext("2d");
        ctx.lineWidth = internals.lineWidth;
        ctx.strokeStyle = internals.borderColor;
        //ctx.lineCap = 'butt';

        //get shape dimensions
        var borderRadius = parseInt(window.getComputedStyle(internals.button[0]).getPropertyValue('border-radius').replace('px', '')); //likely only going to work on Firefox and Chrome. Need to implement a more robust solution. http://acuriousanimal.com/blog/2012/07/09/look-mom-no-jquery-getting-all-css-properties-of-a-dom-element-in-pure-javascript/
        borderRadius = Math.min(borderRadius, internals.button[0].offsetHeight/2);
        console.log(borderRadius);
        console.log(internals.button[0].offsetHeight);

        scope.horizLineLength = internals.button[0].offsetWidth - (borderRadius * 2) + internals.lineWidth;
        scope.vertLineLength = internals.button[0].offsetHeight - (borderRadius * 2) + internals.lineWidth;

        //update the button with the offset from the borderRadius
        internals.button[0].style.left = internals.lineWidth;
        internals.button[0].style.top = internals.lineWidth;






        // calc some lengths for use in percent complete
        var cornerLength = 2 * borderRadius * Math.PI;
        var totalLength = cornerLength * 4 + scope.horizLineLength * 2 + scope.vertLineLength * 2;
        //console.log('total ' + totalLength);

        // calc at what accumulated length each part of the rect starts
        var startT = 0;                           // top line
        var startTR = scope.horizLineLength;            // top-right corner
        var startR = startTR+cornerLength;        // right line
        var startBR = startR+scope.vertLineLength;      // bottom-right corner
        var startB = startBR+cornerLength;        // bottom line
        var startBL = startB+scope.horizLineLength;     // bottom-left corner
        var startL = startBL+cornerLength;        // left line
        var startTL = startL+scope.vertLineLength;      // top-left corner

        //TODO - Calculate progress duration. take total time as a param, then divide by 100 to find how often to increment.


        // draw the radius rectangle
        scope.drawPercentRect = function(percent) {

          // percent expressed as a length-traveled-along-rect
          var accumLength = percent / 100 * totalLength;

          // clear the canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // top line
          d = accumLength - startT;
          d = Math.min(d, scope.horizLineLength);
          if (d > 0) {
            x1 = internals.lineWidth/2 + borderRadius;
            y1 = internals.lineWidth/2;
            x2 = internals.lineWidth/2 + borderRadius + d;
            y2 = internals.lineWidth/2;
            drawLine(x1, y1, x2, y2);
          }

          // top-right corner
          d = accumLength - startTR;
          d = Math.min(d, cornerLength);
          if (d > 0) {
            var x = canvas.width - (borderRadius + internals.lineWidth);
            var y = borderRadius + internals.lineWidth;
            var start = -Math.PI * .5;
            var end = -Math.PI * .5 + (d / cornerLength * Math.PI *.5);
            drawCorner(x, y, start, end);
          }


          // right line
          var d = accumLength - startR;
          d = Math.min(d, scope.vertLineLength);
          if (d > 0) {
            var x1 = internals.lineWidth/2 + borderRadius + scope.horizLineLength + borderRadius;
            var y1 = internals.lineWidth/2 + borderRadius;
            var x2 = internals.lineWidth/2 + borderRadius + scope.horizLineLength + borderRadius;
            var y2 = internals.lineWidth/2 + borderRadius + d;
            drawLine(x1, y1, x2, y2);
          }

          // bottom-right corner
          var d = accumLength - startBR;
          d = Math.min(d, cornerLength);
          if (d > 0) {
            var x = canvas.width - (borderRadius + internals.lineWidth);
            var y = canvas.height - (borderRadius + internals.lineWidth);
            var start = 0;
            var end = (d / cornerLength) * (Math.PI *.5);
            drawCorner(x, y, start, end);
          }

          // bottom line
          var d = accumLength - startB;
          d = Math.min(d, scope.horizLineLength);
          if (d > 0) {
            var x1 = internals.lineWidth/2 + borderRadius + scope.horizLineLength;
            var y1 = internals.lineWidth/2 + borderRadius + scope.vertLineLength + borderRadius;
            var x2 = internals.lineWidth/2 + borderRadius + scope.horizLineLength - d;
            var y2 = internals.lineWidth/2 + borderRadius + scope.vertLineLength + borderRadius;
            drawLine(x1, y1, x2, y2);
          }

          // bottom-left corner
          var d = accumLength - startBL;
          d = Math.min(d, cornerLength);
          if (d > 0) {
            var x = borderRadius + internals.lineWidth;
            var y = canvas.height - (borderRadius + internals.lineWidth);
            var start = Math.PI / 2;
            var end = (Math.PI * .5) + (d / cornerLength) * (Math.PI * .5);

            drawCorner(x, y, start, end);
          }


          // left line
          var d = accumLength - startL;
          d = Math.min(d, scope.vertLineLength);
          if (d > 0) {
            var x1 = internals.lineWidth/2;
            var y1 = internals.lineWidth/2 + borderRadius + scope.vertLineLength;
            var x2 = internals.lineWidth/2;
            var y2 = borderRadius + scope.vertLineLength + internals.lineWidth/2 - d;
            drawLine(x1, y1, x2, y2);
          }

          // top-left corner
          var d = accumLength - startTL;
          d = Math.min(d, cornerLength);
          if (d > 0) {
            var x = borderRadius + internals.lineWidth;
            var y = borderRadius + internals.lineWidth;
            var start = Math.PI;
            var end = Math.PI + (d / cornerLength) * (Math.PI * .5);
            drawCorner(x, y, start, end);
          }

        };

        var drawLine = function(x1, y1, x2, y2) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineWidth = internals.lineWidth;
          ctx.stroke();
        };

        var drawCorner = function(x, y, start, end) {
          ctx.beginPath();
          //ctx.lineWidth = internals.lineWidth *1.25;
          ctx.arc(x, y, borderRadius  + internals.lineWidth/2, start, end, false);
          //ctx.arc(x, y, borderRadius + internals.lineWidth/2, 0, 2 * Math.PI, false);
          ctx.stroke();
        };

        scope.drawPercentRect(scope.done);



        internals.button.on('mousedown', function(e){
          if(e.which === 1) { //Only trigger on left mouse click

            //make sure any previous events are cleaned up
            internals.button.off('mouseup');
            internals.button.on('mouseup', mouseUp);
            $interval.cancel(internals.incrementPromise);
            $interval.cancel(internals.decrementPromise);

            incrementProg();
            internals.incrementPromise = $interval(incrementProg, internals.tick_length);
          }
        });

        var mouseUp = function(e){
          if(e.which === 1) { //Only trigger on left mouse click
            $interval.cancel(internals.incrementPromise);
            internals.decrementPromise = $interval(decrementProg, internals.tick_length);
          }
        };

        var incrementProg = function() {
          scope.done = scope.done + internals.incrementBy;
          scope.drawPercentRect(scope.done);

          if(scope.done >=100) {
            scope.drawPercentRect(100);
            cancelProgressPromise(internals.incrementPromise);
            internals.button.off('mouseup');
          }
        };

        var decrementProg = function() {
          scope.done = scope.done - internals.incrementBy;
          if(scope.done > 0)
            scope.drawPercentRect(scope.done);
          else {
            cancelProgressPromise(internals.decrementPromise);
          }
        };

        var cancelProgressPromise = function(promise) {
          $interval.cancel(promise);
          //the delay here allows for you to visualize the completed progressbar, without this $timeout it looks like the progress only goes to ALMOST done
          $timeout(function(){
            scope.done = 0;
            scope.drawPercentRect(scope.done);
          }, 100);
        };

        scope.$watch('doneString', function(){
          scope.done = parseInt(scope.doneString);
          scope.drawPercentRect(scope.done);
        });

        scope.$watch('done', function() {
          scope.doneString = scope.done.toString();
        });

      });
    }
  }
}]);