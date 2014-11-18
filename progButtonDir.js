"use strict";
App.directive('progressButton', ['$interval', '$timeout', function($interval, $timeout) {
  return {
    restrict: "EA",
    transclude: true,
    replace: true,
    scope: {
      additionalClasses: "@",
      percentage: "=?",
      completed: "&"
    },
    template: '<span class="progButton"><canvas id="fill" width="1" height="1" ></canvas><button class="btn" ng-class="additionalClasses" ng-transclude></button></span>',
    link: function(scope, element, attrs) {

      var internals = {
        tick_length: 15,
        incBy: 3,
        incPromise: null,
        decPromise: null,
        button: element.find('button'),
        lw: parseInt(attrs.lineWidth) || 4,
        bc: attrs.borderColor || 'blue',
        br: 0
      };

      scope.percentage = scope.percentage || 100;

      internals.button.ready(function() {

        //need reference to the canvas element
        var canvas = element.find('canvas')[0];
        var width = canvas.attributes['width'].value = internals.button[0].offsetWidth + (internals.lw * 2);
        var height = canvas.attributes['height'].value = internals.button[0].offsetHeight + (internals.lw * 2);

        //setting these values normalizes the values, in display the button would be 71.7798787px tall, but getting the property would return 72px.
        internals.button[0].style.height = internals.button[0].offsetHeight;
        internals.button[0].style.width = internals.button[0].offsetWidth;

        var ctx = canvas.getContext("2d");
        ctx.lineWidth = internals.lw;
        ctx.strokeStyle = internals.bc;
        //ctx.lineCap = 'butt';

        //get shape dimensions
        internals.br = parseInt(window.getComputedStyle(internals.button[0]).getPropertyValue('border-radius').replace('px', '')); //likely only going to work on Firefox and Chrome. Need to implement a more robust solution. http://acuriousanimal.com/blog/2012/07/09/look-mom-no-jquery-getting-all-css-properties-of-a-dom-element-in-pure-javascript/
        internals.br = Math.min(internals.br, internals.button[0].offsetHeight/2);

        scope.horizLineLength = internals.button[0].offsetWidth - (internals.br * 2) + internals.lw;
        scope.vertLineLength = internals.button[0].offsetHeight - (internals.br * 2) + internals.lw;

        //update the button with the offset from the borderRadius
        internals.button[0].style.left = internals.lw;
        internals.button[0].style.top = internals.lw;


        var cornerLength = 2 * internals.br * Math.PI;
        var totalLength = cornerLength * 4 + scope.horizLineLength * 2 + scope.vertLineLength * 2;

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

        scope.drawPercentRect = function(percent) {

          // percent expressed as a length-traveled-along-rect
          var accumLength = percent / 100 * totalLength;

          // clear the canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // top line
          d = accumLength - startT;
          d = Math.min(d, scope.horizLineLength);
          if (d > 0) {
            x1 = internals.lw/2 + internals.br;
            y1 = internals.lw/2;
            x2 = internals.lw/2 + internals.br + d;
            y2 = internals.lw/2;
            drawLine(x1, y1, x2, y2, ctx);
          }

          // top-right corner
          d = accumLength - startTR;
          d = Math.min(d, cornerLength);
          if (d > 0) {
            var x = canvas.width - (internals.br + internals.lw);
            var y = internals.br + internals.lw;
            var start = -Math.PI * .5;
            var end = -Math.PI * .5 + (d / cornerLength * Math.PI * .5);
            drawCorner(x, y, start, end, ctx);
          }


          // right line
          var d = accumLength - startR;
          d = Math.min(d, scope.vertLineLength);
          if (d > 0) {
            var x1 = internals.lw/2 + internals.br + scope.horizLineLength + internals.br;
            var y1 = internals.lw/2 + internals.br;
            var x2 = internals.lw/2 + internals.br + scope.horizLineLength + internals.br;
            var y2 = internals.lw/2 + internals.br + d;
            drawLine(x1, y1, x2, y2, ctx);
          }

          // bottom-right corner
          var d = accumLength - startBR;
          d = Math.min(d, cornerLength);
          if (d > 0) {
            var x = canvas.width - (internals.br + internals.lw);
            var y = canvas.height - (internals.br + internals.lw);
            var start = 0;
            var end = (d / cornerLength) * (Math.PI * .5);
            drawCorner(x, y, start, end, ctx);
          }

          // bottom line
          var d = accumLength - startB;
          d = Math.min(d, scope.horizLineLength);
          if (d > 0) {
            var x1 = internals.lw/2 + internals.br + scope.horizLineLength;
            var y1 = internals.lw/2 + internals.br + scope.vertLineLength + internals.br;
            var x2 = internals.lw/2 + internals.br + scope.horizLineLength - d;
            var y2 = internals.lw/2 + internals.br + scope.vertLineLength + internals.br;
            drawLine(x1, y1, x2, y2, ctx);
          }

          // bottom-left corner
          var d = accumLength - startBL;
          d = Math.min(d, cornerLength);
          if (d > 0) {
            var x = internals.br + internals.lw;
            var y = canvas.height - (internals.br + internals.lw);
            var start = Math.PI / 2;
            var end = (Math.PI * .5) + (d / cornerLength) * (Math.PI * .5);
            drawCorner(x, y, start, end, ctx);
          }


          // left line
          var d = accumLength - startL;
          d = Math.min(d, scope.vertLineLength);
          if (d > 0) {
            var x1 = internals.lw/2;
            var y1 = internals.lw/2 + internals.br + scope.vertLineLength;
            var x2 = internals.lw/2;
            var y2 = internals.br + scope.vertLineLength + internals.lw/2 - d;
            drawLine(x1, y1, x2, y2, ctx);
          }

          // top-left corner
          var d = accumLength - startTL;
          d = Math.min(d, cornerLength);
          if (d > 0) {
            var x = internals.br + internals.lw;
            var y = internals.br + internals.lw;
            var start = Math.PI;
            var end = Math.PI + (d / cornerLength) * (Math.PI * .5);
            drawCorner(x, y, start, end, ctx);
          }

        };

        scope.drawPercentRect(scope.percentage);


        internals.button.on('mousedown', function(e){
          if(e.which === 1) { //Only trigger on left mouse click
            //make sure any previous events are cleaned up
            internals.button.off('mouseup');
            internals.button.on('mouseup', mouseUp);
            $interval.cancel(internals.incPromise);
            $interval.cancel(internals.decPromise);
            incrementProg();
            internals.incPromise = $interval(incrementProg, internals.tick_length);
          }
        });
      });

      var drawLine = function(x1, y1, x2, y2, ctx) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = internals.lw;
        ctx.stroke();
      };

      var drawCorner = function(x, y, start, end, ctx) {
        ctx.beginPath();
        ctx.arc(x, y, internals.br  + internals.lw/2, start, end, false);
        ctx.stroke();
      };

      var cancelProgressPromise = function(promise) {
        $interval.cancel(promise);
        //the delay here allows for you to visualize the completed progressbar, without this $timeout it looks like the progress only goes to ALMOST done
        $timeout(function(){
          scope.percentage = 0;
          scope.drawPercentRect(scope.percentage);
        }, 100);
      };

      var incrementProg = function() {
        scope.percentage = scope.percentage + internals.incBy;
        scope.drawPercentRect(scope.percentage);

        if(scope.percentage >=100) {
          scope.drawPercentRect(100);
          cancelProgressPromise(internals.incPromise);
          internals.button.off('mouseup');
          scope.completed();
        }
      };

      var decrementProg = function() {
        scope.percentage = scope.percentage - internals.incBy;
        if(scope.percentage > 0)
          scope.drawPercentRect(scope.percentage);
        else {
          cancelProgressPromise(internals.decPromise);
        }
      };

      var mouseUp = function(e){
        if(e.which === 1) { //Only trigger on left mouse click
          $interval.cancel(internals.incPromise);
          internals.decPromise = $interval(decrementProg, internals.tick_length);
        }
      };

    }
  }
}]);