"use strict";
App.directive('progressButton', ['$interval', '$timeout', function($interval, $timeout) {
  return {
    restrict: "EA",
    transclude: true,
    replace: true,
    scope: {
      additionalClasses: "@"
    },
    template: '<span class="progButton"><canvas id="fill" width="1" height="1" ></canvas><button class="btn" ng-class="additionalClasses" ng-transclude></button></span>',
    link: function(scope, element, attrs) {

      var internals = {
        tick_length: 15,
        incrementBy: 3,
        done: 0,
        incrementPromise: null,
        decrementPromise: null,
        button: element.find('button'),
        lineWidth: attrs.lineWidth || 4,
        borderColor: attrs.borderColor || 'blue'
      };


      internals.button.ready(function() {
        //get shape dimensions
        var borderRadius = parseInt(window.getComputedStyle(internals.button[0]).getPropertyValue('border-radius').replace('px', '')); //likely only going to work on Firefox and Chrome. Need to implement a more robust solution. http://acuriousanimal.com/blog/2012/07/09/look-mom-no-jquery-getting-all-css-properties-of-a-dom-element-in-pure-javascript/
        scope.horizLineLength = internals.button[0].offsetWidth - (borderRadius * 2) + internals.lineWidth;
        scope.vertLineLength = internals.button[0].offsetHeight - (borderRadius * 2) + internals.lineWidth;


        //need reference to the canvas element
        var canvas = element.find('canvas')[0];
        var width = canvas.attributes['width'].value = internals.button[0].offsetWidth + (internals.lineWidth * 2);
        var height = canvas.attributes['height'].value = internals.button[0].offsetHeight + (internals.lineWidth * 2);

        var ctx = canvas.getContext("2d");
        ctx.lineWidth = internals.lineWidth;
        ctx.strokeStyle = internals.borderColor;
        //ctx.lineCap = 'butt';

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
        var drawPercentRect = function(percent) {

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
            x2 = internals.lineWidth + borderRadius + d;
            y2 = internals.lineWidth/2;
            drawLine(x1, y1, x2, y2);
          }

          // top-right corner
          d = accumLength - startTR;
          d = Math.min(d, cornerLength);
          if (d > 0) {
            var x = internals.lineWidth/2 + borderRadius + scope.horizLineLength;
            var y = internals.lineWidth/2 + borderRadius;
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
            var y2 = internals.lineWidth + borderRadius + d;
            drawLine(x1, y1, x2, y2);
          }

          // bottom-right corner
          var d = accumLength - startBR;
          d = Math.min(d, cornerLength);
          if (d > 0) {
            var x = internals.lineWidth/2 + borderRadius + scope.horizLineLength;
            var y = internals.lineWidth/2 + borderRadius + scope.vertLineLength;
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
            var x = internals.lineWidth/2 + borderRadius;
            var y = internals.lineWidth/2 + borderRadius + scope.vertLineLength;
            var start = Math.PI / 2;
            var end = (Math.PI * .5) + (d / cornerLength) * (Math.PI * .5);
            drawCorner(x, y, start, end);
          }


          // left line
          var d = accumLength - startL;
          d = Math.min(d, scope.vertLineLength);
          if (d > 0) {
            var x1 = internals.lineWidth/2;
            var y1 = internals.lineWidth + borderRadius + scope.vertLineLength;
            var x2 = internals.lineWidth/2;
            var y2 = borderRadius + scope.vertLineLength - d;
            console.log(y2);
            drawLine(x1, y1, x2, y2);
          }

          // top-left corner
          var d = accumLength - startTL;
          d = Math.min(d, cornerLength);
          if (d > 0) {
            var x = internals.lineWidth/2 + borderRadius;
            var y = internals.lineWidth/2 + borderRadius;
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
          ctx.lineWidth = internals.lineWidth *1.25;
          ctx.arc(x, y, borderRadius, start, end, false);
          ctx.stroke();
        };

        drawPercentRect(100);



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
          internals.done = internals.done + internals.incrementBy;
          drawPercentRect(internals.done);

          if(internals.done >=100) {
            drawPercentRect(100);
            cancelProgressPromise(internals.incrementPromise);
            internals.button.off('mouseup');
          }
        };

        var decrementProg = function() {
          internals.done = internals.done - internals.incrementBy;
          if(internals.done > 0)
            drawPercentRect(internals.done);
          else {
            cancelProgressPromise(internals.decrementPromise);
          }
        };

        var cancelProgressPromise = function(promise) {
          $interval.cancel(promise);
          //the delay here allows for you to visualize the completed progressbar, without this $timeout it looks like the progress only goes to ALMOST done
          $timeout(function(){
            internals.done = 0;
            drawPercentRect(internals.done);
          }, 100);

        };

      });
    }
  }
}]);