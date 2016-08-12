/*jslint browser:true, devel:true*/
/*globals $*/

(function () {
    'use strict';

    var params, getQueryParameters, startRaf, graphData = [], cyclers = {};

    // getQueryParameters from https://css-tricks.com/snippets/jquery/get-query-params-object/
    getQueryParameters = function (str) {
        return (str || document.location.search).replace(/(^\?)/, '').split('&').map(function (n) {
            n = n.split('=');
            this[n[0]] = n[1];
            return this;
        }.bind({}))[0];
    };

    params = getQueryParameters();

    // Create the different cyclers
    (function () {
        var i, j, data = [];
        for (i = 0; i < 10; i = i + 1) {
            for (j = 0; j < 1000; j = j + 1) {
                data[j] = Math.random();
            }

            graphData[i] = JSON.stringify(data);
        }
    }());

    cyclers.graphrandom = function (el) {
        var index = 0;
        return function () {
            el.value = graphData[index++];

            if (index >= graphData.length) {
                index = 0;
            }
        };
    };

    cyclers.bool = function (el) {
        return function () {
            el.value = !el.value;
        };
    };

    cyclers.num = function (el, config) {
        return function () {
            if (el.value.numberValue + config.dx > config.max) {
                el.value = {
                    numberValue: config.min
                };
            } else {
                el.value = {
                    numberValue: el.value.numberValue + config.dx
                };
            }
        };
    };

    cyclers.simplenum = function (el, config) {
        var targetPropName = config.propname || 'value';

        return function () {
            if (el[targetPropName] + config.dx > config.max) {
                el[targetPropName] = config.min;
            } else {
                el[targetPropName] = el[targetPropName] + config.dx;
            }
        };
    };

    cyclers.simplenumarray = function (el, config) {
        return function () {
            var num = JSON.parse(el.selectedIndex)[0];
            if (num + config.dx > config.max) {
                num = config.min;
            } else {
                num = num + config.dx;
            }

            el.selectedIndex = JSON.stringify([num]);
        };
    };

    cyclers.lvtime = function (el) {
        var jsDateToSecondsSince1904 = function (jsDate) {
            var startDate = new Date(Date.UTC(1904, 0, 1)); // January 1, 1904
            var msSinceStartDate = jsDate - startDate;
            var secondsSinceStartDate = msSinceStartDate / 1000;
            return secondsSinceStartDate;
        };

        return function () {
            el.value = jsDateToSecondsSince1904(new Date());
        };
    };

    cyclers.text = function (el) {
        //stolen from http://glench.com/hash
        var bounce = function (state) {
            var wave = ['\u00B8', '.', '\u00B7', '\u00B4', '`', '\u00B7', '.'];
            var length = 19;

            var hash = '\u2603';
            for (var i = 0; i < length; i = i + 1) {
                if (i === length - 1) {
                    hash += '\u2603';
                } else if (i === state.position) {
                    hash += wave[i % wave.length];
                } else {
                    hash += ' ';
                }
            }

            if (state.position >= length - 1) {
                state.right = false;
            } else if (state.position <= 0) {
                state.right = true;
            }

            state.position += state.right ? 1 : -1;

            return hash;
        };

        var state = {
            position: 0,
            right: true
        };

        return function () {
            el.text = bounce(state);
        };
    };

    startRaf = function (myCycler) {
        function toRun() {
            myCycler();
            requestAnimationFrame(toRun);
        }

        requestAnimationFrame(toRun);
    };

    // Setup Page
    if (params.hasOwnProperty('plain')) {
        console.log('Plain Mode');
    } else {
        console.log('Full Mode');

        $(document).ready(function () {
            $(document.head).prepend('<link rel="stylesheet" href="../node_modules/reveal.js/css/theme/league.css" id="theme">');
            $(document.head).prepend('<link rel="stylesheet" href="../node_modules/reveal.js/css/reveal.css">');

            $(document.body).append('<script src="../node_modules/reveal.js/js/reveal.js"></script>');
            $(document.body).append('<script>Reveal.initialize({history: true, center: true});</script>');
        });
    }

    if (params.hasOwnProperty('static')) {
        console.log('Static Mode');
    } else {
        console.log('Dynamic Mode');

        NationalInstruments.HtmlVI.Elements.NIElement.addNIEventListener('attached', function () {
            var els, i, el, config, myCycler;

            els = document.querySelectorAll('[data-cycle]');

            for (i = 0; i < els.length; i = i + 1) {
                el = els[i];

                config = JSON.parse(el.dataset.cycle);

                if (typeof cyclers[config.type] === 'function') {
                    myCycler = cyclers[config.type](el, config);

                    if (config.period === 'raf') {
                        startRaf(myCycler);
                    } else {
                        setInterval(myCycler, config.period || 750);
                    }
                } else {
                    console.log('Invalid data cycle type:', config.type);
                }
            }
        });
    }
}());
