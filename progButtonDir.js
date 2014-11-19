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
    template: '<span class="progButton">' +
      '<canvas width="1" height="1" ></canvas>' +
      '<canvas width="1" height="1"></canvas>' +
      '<button class="btn" ng-class="additionalClasses" ng-transclude></button>' +
    '</span>',
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

      scope.percentage = scope.percentage || 0;

      internals.button.ready(function() {

        //need reference to the canvas element
        var canvas = element.find('canvas')[0];
        var canvasOutline = element.find('canvas')[1];
        var width = canvas.attributes['width'].value = internals.button[0].offsetWidth + (internals.lw * 2);
        var height = canvas.attributes['height'].value = internals.button[0].offsetHeight + (internals.lw * 2);

        //setting these values normalizes the values, in display the button would be 71.7798787px tall, but getting the property would return 72px.
        internals.button[0].style.height = internals.button[0].offsetHeight;
        internals.button[0].style.width = internals.button[0].offsetWidth;

        var ctx = canvas.getContext("2d");
        var ctx2 = canvasOutline.getContext("2d");

        ctx.lineWidth = internals.lw;
        ctx2.lineWidth = internals.lw;
        ctx.strokeStyle = internals.bc;
        ctx2.strokeStyle = internals.bc;
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
        var rectVal = {
          startT: 0,
          startTR: scope.horizLineLength
        };

        rectVal.startR = rectVal.startTR+cornerLength;
        rectVal.startBR = rectVal.startR+scope.vertLineLength;
        rectVal.startB = rectVal.startBR+cornerLength;
        rectVal.startBL = rectVal.startB+scope.horizLineLength;
        rectVal.startL = rectVal.startBL+cornerLength;
        rectVal.startTL = rectVal.startL+scope.vertLineLength;

        //TODO - Calculate progress duration. take total time as a param, then divide by 100 to find how often to increment.

        scope.drawPercentRect = function(percent) {

          // percent expressed as a length-traveled-along-rect
          var accumLength = percent / 100 * totalLength;

          // clear the canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // top line
          var d = Math.min(accumLength - rectVal.startT, scope.horizLineLength);
          if (d > 0) { drawLine({
              x1: internals.lw/2 + internals.br,
              y1: internals.lw/2,
              x2: internals.lw/2 + internals.br + d,
              y2: internals.lw/2
            }, ctx);
          }

          // top-right corner
          d = Math.min(accumLength - rectVal.startTR, cornerLength);
          if (d > 0) { drawCorner({
              x: canvas.width - (internals.br + internals.lw),
              y: internals.br + internals.lw,
              start: -Math.PI * .5,
              end: -Math.PI * .5 + ((d / cornerLength) * (Math.PI * .5))
            }, ctx);
          }

          // right line
          d = Math.min(accumLength - rectVal.startR, scope.vertLineLength);
          if (d > 0) { drawLine({
              x1: internals.lw/2 + (internals.br * 2) + scope.horizLineLength,
              y1: internals.lw/2 + internals.br,
              x2: internals.lw/2 + (internals.br * 2) + scope.horizLineLength,
              y2: internals.lw/2 + internals.br + d
            }, ctx);
          }

          // bottom-right corner
          d = Math.min(accumLength - rectVal.startBR, cornerLength);
          if (d > 0) { drawCorner({
              x: canvas.width - (internals.br + internals.lw),
              y: canvas.height - (internals.br + internals.lw),
              start: 0,
              end: (d / cornerLength) * (Math.PI * .5)
            }, ctx);
          }

          // bottom line
          d = Math.min(accumLength - rectVal.startB, scope.horizLineLength);
          if (d > 0) { drawLine({
              x1: internals.lw/2 + internals.br + scope.horizLineLength,
              y1: internals.lw/2 + (internals.br*2) + scope.vertLineLength,
              x2: internals.lw/2 + internals.br + scope.horizLineLength - d,
              y2: internals.lw/2 + (internals.br*2) + scope.vertLineLength
            }, ctx);
          }

          // bottom-left corner
          d = Math.min(accumLength - rectVal.startBL, cornerLength);
          if (d > 0) { drawCorner({
              x: internals.br + internals.lw,
              y: canvas.height - (internals.br + internals.lw),
              start: Math.PI / 2,
              end: (Math.PI * .5) + (d / cornerLength) * (Math.PI * .5)
            }, ctx);
          }

          // left line
          d = Math.min(accumLength - rectVal.startL, scope.vertLineLength);
          if (d > 0) { drawLine({
              x1: internals.lw/2,
              y1: internals.lw/2 + internals.br + scope.vertLineLength,
              x2: internals.lw/2,
              y2: internals.br + scope.vertLineLength + internals.lw/2 - d
            }, ctx);
          }

          // top-left corner
          d = Math.min(accumLength - rectVal.startTL, cornerLength);
          if (d > 0) { drawCorner({
              x: internals.br + internals.lw,
              y: internals.br + internals.lw,
              start: Math.PI,
              end: Math.PI + (d / cornerLength) * (Math.PI * .5)
            }, ctx);
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

      var drawLine = function(rect, ctx) {
        ctx.beginPath();
        ctx.moveTo(rect.x1, rect.y1);
        ctx.lineTo(rect.x2, rect.y2);
        ctx.lineWidth = internals.lw;
        ctx.stroke();
      };

      var drawCorner = function(corner, ctx) {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, internals.br  + internals.lw/2, corner.start, corner.end, false);
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