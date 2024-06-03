/**
 *  Slot Machine Generator
 *  Create an extremely biased, web-based slot machine game.
 *
 *  Copyright 2020-2023, Marc S. Brooks (https://mbrooks.info)
 *  Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */

'use strict';

/**
 * @param {Element} container
 *   Containing HTML element.
 *
 * @param {Array<Object>} reels
 *   Reel configuration.
 *
 * @param {Function} callback
 *   Returns selected pay-line symbols.
 *
 * @param {Object} options
 *   Configuration overrides (optional).
 */
function SlotMachine(container, reels, callback, options) {
  var self = this;
  var REEL_SEGMENT_TOTAL = 24;
  var defaults = {
    reelHeight: 1200,
    reelWidth: 200,
    reelOffset: 20,
    slotYAxis: 0,
    animSpeed: 1000,
    sounds: {
      reelsBegin: null,
      reelsEnd: null
    },
    rngFunc: function rngFunc() {
      // The weakest link.
      return Math.random();
    }
  };
  (function () {
    self.options = Object.assign(defaults, options);
    if (reels.length > 0) {
      initGame();
    } else {
      throw new Error('Failed to initialize (missing reels)');
    }
  })();

  /**
   * Initialize a new game instance.
   */
  function initGame() {
    createDisplayElm();
    createSlotElm();
  }

  /**
   * Create display elements.
   */
  function createDisplayElm() {
    var div = document.createElement('div');
    div.classList.add('display');
    for (var i = 0; i < reels.length; i++) {
      var elm = document.createElement('div');
      elm.style.transform = "rotateY(" + self.options.slotYAxis + "deg)";
      elm.classList.add('reel');
      div.appendChild(elm);
    }
    div.addEventListener('click', function () {
      return spinReels();
    });
    container.appendChild(div);
  }

  /**
   * Create slot elements.
   */
  function createSlotElm() {
    var div = document.createElement('div');
    div.classList.add('slots');
    reels.forEach(function (reel) {
      var elm = createReelElm(reel, reel.symbols[0].position);
      div.appendChild(elm);
    });
    container.appendChild(div);
  }

  /**
   * Create reel elements.
   *
   * @param {Object} config
   *   Config options.
   *
   * @param {Number} startPos
   *   Start position.
   *
   * @return {Element}
   */
  function createReelElm(config, startPos) {
    if (startPos === void 0) {
      startPos = 0;
    }
    var div = document.createElement('div');
    div.style.transform = "rotateY(" + self.options.slotYAxis + "deg)";
    div.classList.add('reel');
    var elm = createStripElm(config, config.symbols[0].position);
    config['element'] = elm;
    div.appendChild(elm);
    return div;
  }

  /**
   * Create strip elements (faux-panoramic animation).
   *
   * @param {Object} config
   *   Config options.
   *
   * @param {Number} startPos
   *   Start position.
   *
   * @return {Element}
   */
  function createStripElm(config, startPos) {
    if (startPos === void 0) {
      startPos = 0;
    }
    var stripHeight = getStripHeight();
    var stripWidth = getStripWidth();
    var segmentDeg = 360 / REEL_SEGMENT_TOTAL;
    var transZ = Math.trunc(Math.tan(90 / Math.PI - segmentDeg) * (stripHeight * 0.5) * 4);
    var marginTop = transZ + stripHeight / 2;
    var ul = document.createElement('ul');
    ul.style.height = stripHeight + 'px';
    ul.style.marginTop = marginTop + 'px';
    ul.style.width = stripWidth + 'px';
    ul.classList.add('strip');
    for (var i = 0; i < REEL_SEGMENT_TOTAL; i++) {
      var li = document.createElement('li');
      li.append(i.toString());
      var imgPosY = getImagePosY(i, startPos);
      var rotateX = REEL_SEGMENT_TOTAL * segmentDeg - i * segmentDeg;

      // Position image per the strip angle/container radius.
      li.style.background = "url(" + config.imageSrc + ") 0 " + imgPosY + "px";
      li.style.height = stripHeight + 'px';
      li.style.width = stripWidth + 'px';
      li.style.transform = "rotateX(" + rotateX + "deg) translateZ(" + transZ + "px)";
      ul.appendChild(li);
    }
    return ul;
  }

  /**
   * Select a random symbol by weight.
   *
   * @param {Array<Object>} symbols
   *   List of symbols.
   *
   * @return {Object}
   */
  function selectRandSymbol(symbols) {
    var totalWeight = 0;
    var symbolTotal = symbols.length;
    for (var i = 0; i < symbolTotal; i++) {
      var symbol = symbols[i];
      var weight = symbol.weight;
      totalWeight += weight;
    }
    var randNum = getRandom() * totalWeight;
    for (var j = 0; j < symbolTotal; j++) {
      var _symbol = symbols[j];
      var _weight = _symbol.weight;
      if (randNum < _weight) {
        return _symbol;
      }
      randNum -= _weight;
    }
  }

  /**
   * Spin the reels and try your luck.
   */
  function spinReels() {
    var payLine = [];
    if (callback) {
      // Delay callback until animations have stopped.
      payLine.push = function () {
        Array.prototype.push.apply(this, arguments);
        if (payLine.length === reels.length) {
          var timer = window.setTimeout(function () {
            self.isAnimating = false;
            callback(payLine);
            window.clearTimeout(timer);
          }, self.options.animSpeed);
        }
      };
    }
    playSound(self.options.sounds.reelsBegin);
    reels.forEach(function (reel) {
      var selected = selectRandSymbol(reel.symbols);
      var startPos = selected.position;

      // Start the rotation animation.
      var elm = reel.element;
      elm.classList.remove('stop');
      elm.classList.toggle('spin');

      // Shift images to select position.
      elm.childNodes.forEach(function (li, index) {
        li.style.backgroundPositionY = getImagePosY(index, startPos) + 'px';
      });

      // Randomly stop rotation animation.
      var timer = window.setTimeout(function () {
        elm.classList.replace('spin', 'stop');
        playSound(self.options.sounds.reelsEnd);
        payLine.push(selected);
        window.clearTimeout(timer);
      }, self.options.animSpeed * getRandomInt(1, 4));
    });
  }

  /**
   * Get random number between 0 (inclusive) and 1 (exclusive).
   *
   * @return {number}
   */
  function getRandom() {
    return self.options.rngFunc();
  }

  /**
   * Get random integer between two values.
   *
   * @param {Number} min
   *   Minimum value (default: 0).
   *
   * @param {Number} max
   *   Maximum value (default: 10).
   *
   * @return {Number}
   */
  function getRandomInt(min, max) {
    if (min === void 0) {
      min = 1;
    }
    if (max === void 0) {
      max = 10;
    }
    var minNum = Math.ceil(min);
    var maxNum = Math.floor(max);
    return Math.floor(getRandom() * (Math.floor(maxNum) - minNum)) + minNum;
  }

  /**
   * Calculate the strip background position.
   *
   * @param {Number} index
   *   Strip symbol index.
   *
   * @param {Number} position
   *   Strip target position.
   *
   * @return {Number}
   */
  function getImagePosY(index, position) {
    return -Math.abs(getStripHeight() * index + (position - self.options.reelOffset));
  }

  /**
   * Calculate the strip height.
   *
   * @return {Number}
   */
  function getStripHeight() {
    return self.options.reelHeight / REEL_SEGMENT_TOTAL;
  }

  /**
   * Calculate the strip width.
   *
   * @return {Number}
   */
  function getStripWidth() {
    return self.options.reelWidth;
  }

  /**
   * Play the audio clip.
   *
   * @param {String} url
   *  Audio file URL.
   */
  function playSound(url) {
    if (url) {
      var audio = new Audio();
      audio.src = url;
      audio.onerror = function () {
        return console.warn("Failed to load audio: " + url);
      };
      audio.play();
    }
  }

  /**
   * Dispatch game actions.
   *
   * @param {Function} func
   *   Function to execute.
   */
  function dispatch(func) {
    if (!self.isAnimating) {
      self.isAnimating = true;
      func.call(self);
    }
  }

  /**
   * Protected members.
   */
  this.play = function () {
    dispatch(spinReels);
  };
}

/**
 * Set global/exportable instance, where supported.
 */
window.slotMachine = function (container, reels, callback, options) {
  return new SlotMachine(container, reels, callback, options);
};
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SlotMachine;
}
//# sourceMappingURL=slot-machine.js.map