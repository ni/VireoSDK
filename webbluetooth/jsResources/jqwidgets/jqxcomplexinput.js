(function ($) {
    'use strict';

    $.jqx.jqxWidget('jqxComplexInput', '', {});

    $.extend($.jqx._jqxComplexInput.prototype, {
        defineInstance: function () {
            var settings = {
                // properties
                width: null,
                height: null,
                outputNotation: 'default', // possible values: 'default', 'exponential', 'engineering'
                value: '',
                spinButtons: false,
                spinButtonsStep: 1, // integer value
                interval: null,
                spinButtonsWidth: 18,
                spinMode: 'simple', //possible values: 'simple', 'advanced'
                placeHolder: '',
                roundedCorners: true,
                disabled: false,
                rtl: false,
                readOnly: false,
                textAlign: 'right', // possible values: 'right', 'left', 'center'
                upperCase: false,
                decimalSeparator: '.',
                digits: 8,
                decimalDigits: null,
                min: null,
                max: null,

                // events
                events: ['change', 'valueChanged', 'textChanged']
            };
            $.extend(true, this, settings);
        },

        createInstance: function () {
            var that = this;

            that._firefox = $.jqx.browser.browser === 'mozilla';
            that._currentNumber = {}; // stores the current number (on the change event) and its real and imaginary parts
            that._allowedCharacters = new RegExp(/([\+\-0-9ei])/i);
            that.render();
            that._initialized = true;
        },

        // renders the widget
        render: function () {
            var that = this;

            if (that.element.nodeName.toUpperCase() === 'DIV') {
                that.baseHost = that.host;
                var data = that.host.data();
                if (that.baseHost.children('input').length === 0) {
                    that.baseHost.append('<input type="text" />');
                }
                that.host = that.baseHost.children('input');
                that.element = that.host[0];
                that.host.data(data);
            }

            if (that.spinButtons === true) {
                if (!that.baseHost) {
                    throw new Error('jqxComplexInput: Invalid HTML structure. Please initialize the complex input from a div with an input and another div inside.');
                }
                // appends spin buttons
                that._appendSpinButtons();
            }
            that._handlespinButtonsInterval();

            if (that.readOnly === true) {
                that.host.attr('readonly', true);
            }

            // adds the necessary classes for the widget
            that._addClasses();

            // set the width and height of the widget
            that._setSize();

            if (that._initialized === true) {
                // removes event handlers
                that._removeHandlers();
            }

            // adds event handlers
            that._addHandlers();

            that._suppressEvent = true;
            var initialValue = that.value.replace(/\s+/g, '');
            that.val(initialValue);
            that._suppressEvent = false;

            // sets the input's placeholder
            that._refreshPlaceHolder();
        },

        // refreshes the widget
        refresh: function (initialRefresh) {
            if (initialRefresh !== true) {
                this.render();
            }
        },

        // destroys the widget
        destroy: function () {
            var that = this;

            that._removeHandlers();
            that.host.destroy();
        },

        // gets or sets the complex number
        val: function (value) {
            var that = this;

            if (typeof value === 'string' || typeof value === 'object' && $.isEmptyObject(value) === false) {
                var real, imaginary;

                if (typeof value === 'string') {
                    value = value.toLowerCase();
                    if (value.indexOf('e') === -1) {
                        real = that._getReal(value);
                        imaginary = that._getImaginary(value);
                    } else {
                        var decimalNotation = that._exponentialToDecimal(value);
                        real = decimalNotation.realPart * 1;
                        imaginary = decimalNotation.imaginaryPart * 1;
                    }
                } else if (typeof value === 'object' && $.isEmptyObject(value) === false) {
                    real = value.real;
                    imaginary = value.imaginary;
                }

                var sign = imaginary >= 0 ? '+' : '-';
                var newValue = real + ' ' + sign + ' ' + Math.abs(imaginary) + 'i';
                if (newValue !== that._currentNumber.value) {
                    that.element.value = newValue;
                    that._onChange(that.value);
                    if (that.outputNotation !== 'default') {
                        that._setNotation();
                    }
                }
            } else {
                return that.element.value;
            }
        },

        getReal: function () {
            var that = this,
            real = that.getDecimalNotation('real', that.outputNotation);
            real = real.toString().replace('.', that.decimalSeparator);
            return real;

            //            return this._currentNumber.realPart;
        },

        // gets the real part of the complex number
        _getReal: function (value) {
            var that = this;

            if (!value || (typeof value === 'object' && $.isEmptyObject(value) === true)) {
                value = that.element.value;
            }

            var realPart = $.trim(value), minus = '';

            if ((value.match(/i/g) || []).length === 0) {
                return realPart;
            }

            if (that._eNotation !== true) {
                if (value.charAt(0) === '+') {
                    realPart = realPart.slice(1, value.length);
                } else if (value.charAt(0) === '-') {
                    realPart = realPart.slice(1, value.length);
                    minus = '-';
                }

                var slice = function (index) {
                    realPart = realPart.slice(0, index);
                    realPart = $.trim(realPart);
                    return minus + '' + realPart;
                };

                var plusIndex = realPart.indexOf('+');
                if (plusIndex !== -1) {
                    return slice(plusIndex);
                }
                var minusIndex = realPart.indexOf('-');
                if (minusIndex !== -1) {
                    return slice(minusIndex);
                }
                return '0';
            } else {
                return that._exponentialToDecimal(realPart).realPart.toExponential();
            }
        },

        getImaginary: function () {
            var that = this,
            imaginary = that.getDecimalNotation('imaginary', that.outputNotation);
            imaginary = imaginary.toString().replace('.', that.decimalSeparator);
            return imaginary;
        },

        // gets the imaginary part of the complex number
        _getImaginary: function (value) {
            var that = this;
            if (!value || (typeof value === 'object' && $.isEmptyObject(value) === true)) {
                value = that.element.value;
            }

            if ((value.match(/i/g) || []).length === 0) {
                return '0';
            }

            var imaginaryPart = $.trim(value), minus = '';

            if (that._eNotation !== true) {
                if (imaginaryPart.charAt(0) === '-' || imaginaryPart.charAt(0) === '+') {
                    minus = imaginaryPart.charAt(0) === '-' ? '-' : '+';
                    imaginaryPart = $.trim(imaginaryPart.slice(1, value.length));
                }

                var slice = function (index, sign) {
                    imaginaryPart = imaginaryPart.slice(index + 1, imaginaryPart.indexOf('i'));
                    imaginaryPart = $.trim(imaginaryPart);
                    if (imaginaryPart === '') {
                        imaginaryPart = 1;
                    }
                    return sign + '' + imaginaryPart;
                };

                var plusIndex = imaginaryPart.indexOf('+');
                if (plusIndex !== -1) {
                    return slice(plusIndex, '');
                }
                var minusIndex = imaginaryPart.indexOf('-');
                if (minusIndex !== -1) {
                    return slice(minusIndex, '-');
                }
                imaginaryPart = minus + '' + imaginaryPart.slice(0, imaginaryPart.indexOf('i'));
                if (imaginaryPart === '' || imaginaryPart === '+') {
                    return '1';
                } else if (imaginaryPart === '-') {
                    return '-1';
                } else {
                    return imaginaryPart;
                }
            } else {
                return that._exponentialToDecimal(imaginaryPart).imaginaryPart.toExponential();
            }
        },

        _checkNotation: function (value) {
            var that = this;
            if (value === undefined) {
                value = that.element.value;
            }

            if (value.toString().toLowerCase().indexOf('e') !== -1) {
                that._eNotation = true;
            } else {
                that._eNotation = false;
            }
        },

        // gets the real or imaginary part in a specific notation
        getDecimalNotation: function (value, outputNotation) {
            var that = this;

            function exponentialToScientific(exponentialValue) {
                var indexOfE = exponentialValue.indexOf('e');
                var power = exponentialValue.slice(indexOfE + 1);
                var scientificValue = exponentialValue.slice(0, indexOfE + 1);
                scientificValue = scientificValue.replace('e', '×10');
                scientificValue += that._toSuperScript(power);
                scientificValue = scientificValue.replace('+', '');

                return scientificValue;
            }

            function exponentialToEngineering(exponentialValue) {
                var indexOfE = exponentialValue.indexOf('e');
                var power = exponentialValue.slice(indexOfE + 1);
                var coefficient = exponentialValue.slice(0, indexOfE);
                var remainderPower = parseInt(power, 10) % 3;

                if (remainderPower === 0) {
                    return exponentialValue;
                }

                coefficient = coefficient * Math.pow(10, remainderPower);
                if (power > 0) {
                    var floatFix = exponentialValue.slice(0, indexOfE).length - remainderPower - 2;
                    if (floatFix >= 0) {
                        coefficient = coefficient.toFixed(floatFix);
                    }
                }

                var finalPower = (parseInt(power, 10) - remainderPower);
                var sign;
                if (finalPower < 0) {
                    sign = '';
                } else {
                    sign = '+';
                }

                if (that.decimalDigits !== undefined) {
                    coefficient = Number(coefficient).toFixed(that.decimalDigits);
                } else if (that.digits !== undefined) {
                    coefficient = Number(Number(coefficient).toPrecision(that.digits)).toString();
                }

                var engineeringValue = coefficient + 'e' + sign + finalPower;

                return engineeringValue;
            }

            if (value === 'real') {
                value = that._currentNumber.realPart;
            } else if (value === 'imaginary') {
                value = that._currentNumber.imaginaryPart;
            }

            var exponentialValue = that._toNumber(value).toExponential();
            if (outputNotation === 'scientific') {
                return exponentialToScientific(exponentialValue);
            } else if (outputNotation === 'engineering') {
                return exponentialToEngineering(exponentialValue);
            } else if (outputNotation === 'exponential') {
                var fractionDigits;
                if (that.decimalDigits !== undefined) {
                    fractionDigits = that.decimalDigits;
                } else if (that.digits !== undefined) {
                    fractionDigits = that.digits - 1;
                }
                if (fractionDigits !== undefined) {
                    exponentialValue = Number(value).toExponential(fractionDigits);
                }
                return exponentialValue;
            } else {
                return Number(exponentialValue);
            }
        },

        // clears the input
        clear: function () {
            var that = this,
                oldValue = this.element.value;
            that.element.value = '';
            that._onChange(oldValue);
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (value !== oldvalue) {
                var host = object.host;
                switch (key) {
                    case 'width':
                    case 'height':
                        object._setSize();
                        break;
                    case 'outputNotation':
                        if (value === 'default') {
                            object.element.value = object._currentNumber.value;
                        } else {
                            object._setNotation();
                        }
                        break;
                    case 'value':
                        object.element.value = value;
                        object._onChange(oldvalue);
                        break;
                    case 'spinButtons':
                        var applyRC = function () {
                            host.removeClass(object.toThemeProperty('jqx-rc-all'));
                            if (object.rtl === false) {
                                host.addClass(object.toThemeProperty('jqx-rc-l'));
                                object._spinButtonsContainer.addClass(object.toThemeProperty('jqx-rc-r'));
                            } else {
                                host.addClass(object.toThemeProperty('jqx-rc-r'));
                                object._spinButtonsContainer.addClass(object.toThemeProperty('jqx-rc-l'));
                            }
                        };

                        if (object._spinButtonsContainer) { // spin buttons are present in the DOM
                            var hostWidth = host.width();
                            var spinButtonsWidth = object._spinButtonsContainer.outerWidth();
                            if (value === false) {
                                host.width(hostWidth + spinButtonsWidth);
                                object._spinButtonsContainer.hide();
                                host.addClass(object.toThemeProperty('jqx-rc-all'));
                            } else {
                                host.width(hostWidth - spinButtonsWidth);
                                object._spinButtonsContainer.show();
                                applyRC();
                            }
                        } else { // spin buttons are not present in the DOM
                            if (value === true) {
                                var spinButtonsDiv = $('<div></div>');
                                if (object.baseHost) { // the initialization element is a div
                                    host.after(spinButtonsDiv);
                                    object.render();

                                } else { // the initialization element is an input
                                    var id = object.element.id;
                                    host.removeAttr('id');
                                    host.wrap('<div id="' + id + '" style="display: inline-block;"></div>');
                                    var wrapper = $('#' + id);
                                    wrapper.append(spinButtonsDiv);
                                    var hostData = host.data();
                                    hostData.jqxComplexInput.host = wrapper;
                                    hostData.jqxComplexInput.element = wrapper[0];
                                    object.baseHost = wrapper;
                                    object.baseHost.data(hostData);
                                    object.render();
                                }
                                applyRC();
                            }
                        }
                        break;
                    case 'spinButtonsWidth':
                        var difference = oldvalue - value;
                        object._spinButtonsContainer.css('width', value);
                        object._upbutton.add(object._downbutton).css('width', value);
                        host.css('width', host.outerWidth() + difference);
                        break;
                    case 'placeHolder':
                        object._refreshPlaceHolder(oldvalue);
                        break;
                    case 'roundedCorners':
                        if (object._spinButtonsContainer) {
                            if (value === true) {
                                if (object.rtl === false) {
                                    host.addClass(object.toThemeProperty('jqx-rc-l'));
                                    object._spinButtonsContainer.addClass(object.toThemeProperty('jqx-rc-r'));
                                } else {
                                    host.addClass(object.toThemeProperty('jqx-rc-r'));
                                    object._spinButtonsContainer.addClass(object.toThemeProperty('jqx-rc-l'));
                                }
                            } else {
                                if (object.rtl === false) {
                                    host.removeClass(object.toThemeProperty('jqx-rc-l'));
                                    object._spinButtonsContainer.removeClass(object.toThemeProperty('jqx-rc-r'));
                                } else {
                                    host.removeClass(object.toThemeProperty('jqx-rc-r'));
                                    object._spinButtonsContainer.removeClass(object.toThemeProperty('jqx-rc-l'));
                                }
                            }
                        } else {
                            if (value === true) {
                                host.addClass(object.toThemeProperty('jqx-rc-all'));
                            } else {
                                host.removeClass(object.toThemeProperty('jqx-rc-all'));
                            }
                        }
                        break;
                    case 'disabled':
                        if (value === true) {
                            host.attr('disabled', true);
                            host.addClass(object.toThemeProperty('jqx-fill-state-disabled jqx-input-disabled'));
                            if (object._spinButtonsContainer) {
                                object._spinButtonsContainer.addClass(object.toThemeProperty('jqx-fill-state-disabled'));
                            }
                        } else {
                            host.removeAttr('disabled');
                            host.removeClass(object.toThemeProperty('jqx-fill-state-disabled jqx-input-disabled'));
                            if (object._spinButtonsContainer) {
                                object._spinButtonsContainer.removeClass(object.toThemeProperty('jqx-fill-state-disabled'));
                            }
                        }
                        break;
                    case 'rtl':
                        if (object._spinButtonsContainer) {
                            if (value === true) {
                                host.addClass(object.toThemeProperty('jqx-complex-input-child-rtl'));
                                object._spinButtonsContainer.removeClass(object.toThemeProperty('jqx-complex-input-spin-buttons-container-ltr'));
                                object._spinButtonsContainer.addClass(object.toThemeProperty('jqx-complex-input-child-rtl jqx-complex-input-spin-buttons-container-rtl'));
                                if (object.roundedCorners === true) {
                                    host.removeClass(object.toThemeProperty('jqx-rc-l'));
                                    host.addClass(object.toThemeProperty('jqx-rc-r'));
                                    object._spinButtonsContainer.removeClass(object.toThemeProperty('jqx-rc-r'));
                                    object._spinButtonsContainer.addClass(object.toThemeProperty('jqx-rc-l'));
                                }
                            } else {
                                host.removeClass(object.toThemeProperty('jqx-complex-input-child-rtl'));
                                object._spinButtonsContainer.removeClass(object.toThemeProperty('jqx-complex-input-child-rtl jqx-complex-input-spin-buttons-container-rtl'));
                                object._spinButtonsContainer.addClass(object.toThemeProperty('jqx-complex-input-spin-buttons-container-ltr'));
                                if (object.roundedCorners === true) {
                                    host.removeClass(object.toThemeProperty('jqx-rc-r'));
                                    host.addClass(object.toThemeProperty('jqx-rc-l'));
                                    object._spinButtonsContainer.removeClass(object.toThemeProperty('jqx-rc-l'));
                                    object._spinButtonsContainer.addClass(object.toThemeProperty('jqx-rc-r'));
                                }
                            }
                        }
                        break;
                    case 'theme':
                        $.jqx.utilities.setTheme(oldvalue, value, host);
                        break;
                    case 'readOnly':
                        if (value === true) {
                            host.attr('readonly', true);
                        } else {
                            host.removeAttr('readonly');
                        }
                        break;
                    case 'textAlign':
                        host.removeClass(object.toThemeProperty('jqx-complex-input-align-' + oldvalue));
                        host.addClass(object.toThemeProperty('jqx-complex-input-align-' + value));
                        break;
                    case 'upperCase':
                        if (value) {
                            host.removeClass(object.toThemeProperty('jqx-complex-input-lower-case'));
                            host.addClass(object.toThemeProperty('jqx-complex-input-upper-case'));
                        } else {
                            host.removeClass(object.toThemeProperty('jqx-complex-input-upper-case'));
                            host.addClass(object.toThemeProperty('jqx-complex-input-lower-case'));
                        }
                        break;
                    case 'digits':
                    case 'decimalDigits':
                    case 'min':
                    case 'max':
                        object._onChange(object.value);
                        break;
                    case 'decimalSeparator':
                        var decimalSeparatorRegExp = new RegExp(oldvalue, 'g');
                        object.element.value = object.element.value.replace(decimalSeparatorRegExp, value);
                        break;
                    case 'interval':
                        object._handlespinButtonsInterval();
                        break;
                }
            }
        },

        // raises an event
        _raiseEvent: function (id, arg) {
            if (arg === undefined) {
                arg = { owner: null };
            }

            var evt = this.events[id];
            arg.owner = this;

            var event = new $.Event(evt);
            event.owner = this;
            event.args = arg;
            if (event.preventDefault) {
                event.preventDefault();
            }

            var result = this.host.trigger(event);
            return result;
        },

        // appends spin buttons
        _appendSpinButtons: function () {
            var that = this,
                spinButtonsContainerElement;

            if (that.baseHost.children('div').length !== 0) {
                that._spinButtonsContainer = that.baseHost.children('div');
                spinButtonsContainerElement = that._spinButtonsContainer[0];
            } else {
                spinButtonsContainerElement = document.createElement('div');
                that.baseHost[0].appendChild(spinButtonsContainerElement);
                that._spinButtonsContainer = $(spinButtonsContainerElement);
            }

            spinButtonsContainerElement.unselectable = 'on';
            spinButtonsContainerElement.className = that.toThemeProperty('jqx-fill-state-normal jqx-complex-input-child jqx-formatted-input-spin-buttons-container jqx-complex-input-spin-buttons-container');
            spinButtonsContainerElement.style.width = that.spinButtonsWidth + 'px';
            if (that.rtl === false) {
                spinButtonsContainerElement.className += ' ' + that.toThemeProperty('jqx-complex-input-spin-buttons-container-ltr');
            } else {
                spinButtonsContainerElement.className += ' ' + that.toThemeProperty('jqx-complex-input-child-rtl jqx-complex-input-spin-buttons-container-rtl');
            }
            // spin buttons
            var spinButtonString = '<div unselectable="on" class="' + that.toThemeProperty('jqx-fill-state-normal jqx-formatted-input-spin-button') +
                '" style="width: ' + (that.spinButtonsWidth - 1) + 'px;"><div unselectable="on" class="' + that.toThemeProperty('jqx-input-icon jqx-formatted-input-icon') + '"></div></div>';
            that._upbutton = $(spinButtonString);
            that._downbutton = $(spinButtonString);
            that._spinButtonsContainer.append(that._upbutton.add(that._downbutton));
            // arrows
            that._upArrow = that._upbutton.find('div');
            that._upArrow[0].className += ' ' + that.toThemeProperty('jqx-icon-arrow-up');
            that._downArrow = that._downbutton.find('div');
            that._downArrow[0].className += ' ' + that.toThemeProperty('jqx-icon-arrow-down');
        },

        // adds the necessary classes for the widget
        _addClasses: function () {
            var that = this,
                element = that.element,
                elementClass = '',
                spinButtonsContainerClass = '';

            elementClass += ' jqx-widget jqx-input jqx-complex-input jqx-widget-content jqx-complex-input-align-' + that.textAlign;

            if (that.baseHost) {
                that.baseHost[0].className += ' ' + that.toThemeProperty('jqx-widget jqx-complex-input-parent');
                elementClass += ' jqx-complex-input-child';
            }

            if (that.roundedCorners === true) {
                if (that._spinButtonsContainer) {
                    if (that.rtl === false) {
                        elementClass += ' jqx-rc-l';
                        spinButtonsContainerClass += ' jqx-rc-r';
                    } else {
                        elementClass += ' jqx-rc-r';
                        spinButtonsContainerClass += ' jqx-rc-l';
                    }
                } else {
                    elementClass += ' jqx-rc-all';
                }
            }

            if (that.disabled === true) {
                element.disabled = true;
                elementClass += ' jqx-fill-state-disabled jqx-input-disabled';
                if (that._spinButtonsContainer) {
                    spinButtonsContainerClass += ' jqx-fill-state-disabled';
                }
            }

            if (that.rtl === true) {
                elementClass += ' jqx-complex-input-child-rtl';
                spinButtonsContainerClass += ' jqx-complex-input-child-rtl';
            }

            if (that.upperCase === false) {
                elementClass += ' jqx-complex-input-lower-case';
            } else {
                elementClass += ' jqx-complex-input-upper-case';
            }

            element.className += ' ' + that.toThemeProperty(elementClass);
            if (that._spinButtonsContainer) {
                that._spinButtonsContainer[0].className += ' ' + that.toThemeProperty(spinButtonsContainerClass);
            }
        },

        // sets the input's placeholder
        _refreshPlaceHolder: function (oldPlaceHolder) {
            var that = this;

            if ('placeholder' in that.element) {
                that.element.placeholder = that.placeHolder;
            } else {
                if (that.element.value === '' || that.element.value === oldPlaceHolder) {
                    that.element.value = that.placeHolder;
                }
            }
        },

        // set the width and height of the widget
        _setSize: function () {
            var that = this,
                ie7 = $.jqx.browser.msie && $.jqx.browser.version < 8;

            function resize() {
                var fluidFix = typeof that.width === 'string' && that.width.charAt(that.width.length - 1) === '%' ? 1 : 0,
                    spinButtonsWidth = that.spinButtons ? that.spinButtonsWidth : 0;
                if (!ie7) {
                    that.element.style.width = 'calc(100% - ' + (spinButtonsWidth + fluidFix) + 'px)';
                } else {
                    that.host.height(that.baseHost.height() - (parseInt(that.host.css('border-top-width'), 10) + parseInt(that.host.css('border-bottom-width'), 10) + parseInt(that.host.css('padding-top'), 10) + parseInt(that.host.css('padding-bottom'), 10)) * 2);
                    var inputBordersAndPadding = parseInt(that.host.css('border-left-width'), 10) + parseInt(that.host.css('border-right-width'), 10) + parseInt(that.host.css('padding-left'), 10) + parseInt(that.host.css('padding-right'), 10);
                    if (that._spinButtonsContainer) {
                        that.host.width(that.baseHost.width() - 2 * inputBordersAndPadding - spinButtonsWidth - fluidFix);
                        that._spinButtonsContainer.height(that.baseHost.height() - (parseInt(that._spinButtonsContainer.css('border-top-width'), 10) + parseInt(that._spinButtonsContainer.css('border-bottom-width'), 10) + parseInt(that._spinButtonsContainer.css('padding-top'), 10) + parseInt(that._spinButtonsContainer.css('padding-bottom'), 10)) * 2);
                    } else {
                        that.host.width(that.baseHost.width() - 2 * inputBordersAndPadding);
                    }
                }
            }

            if (that.baseHost) {
                that.baseHost[0].style.width = that._toPx(that.width);
                that.baseHost[0].style.height = that._toPx(that.height);
                resize();
            } else {
                that.element.style.width = that._toPx(that.width);
                that.element.style.height = that._toPx(that.height);
            }

            if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                that.host.css('line-height', that.host.height() + 'px');
            }

            var host = that.baseHost || that.host;

            $.jqx.utilities.resize(host, function () {
                resize();

                if (($.jqx.browser.msie && $.jqx.browser.version < 9 || !$.jqx.browser.msie) && typeof that.height === 'string' && that.height.charAt(that.height.length - 1) === '%') { // height is in percent
                    that.host.css('line-height', that.host.height() + 'px');
                }
            });
        },

        _toPx: function (value) {
            if (typeof value === 'number') {
                return value + 'px';
            } else {
                return value;
            }
        },

        // adds event handlers
        _addHandlers: function () {
            var that = this, id;
            if (that.baseHost) {
                id = that.baseHost[0].id;
            } else {
                id = that.element.id;
            }

            that.addHandler(that.host, 'focus.jqxComplexInput' + id, function () {
                that.host.addClass(that.toThemeProperty('jqx-fill-state-focus'));
                if (that._spinButtonsContainer) {
                    that._spinButtonsContainer.addClass(that.toThemeProperty('jqx-fill-state-focus'));
                }

                if (!('placeholder' in that.element) && (that.element.value === that.placeHolder)) {
                    that.element.value = '';
                }
            });
            that.addHandler(that.host, 'blur.jqxComplexInput' + id, function () {
                that.host.removeClass(that.toThemeProperty('jqx-fill-state-focus'));
                if (that._spinButtonsContainer) {
                    that._spinButtonsContainer.removeClass(that.toThemeProperty('jqx-fill-state-focus'));
                }

                if (that.element.value !== that.value || (('placeholder' in that.element) || (!('placeholder' in that.element) && that.element.value === ''))) {
                    that._onChange(that.value);
                }

                if (!('placeholder' in that.element) && (that.element.value === '' || that.element.value === that.placeHolder)) {
                    that.element.value = that.placeHolder;
                }

                if (that.outputNotation !== 'default') {
                    that._setNotation();
                }
            });
            that.addHandler(that.host, 'keydown.jqxComplexInput' + id, function (e) {
                var keyCode = !e.charCode ? e.which : e.charCode;

                if (that.readOnly) {
                    return false;
                }

                if (keyCode === 40) { // Down arrow
                    that._incrementOrDecrement(-1);
                } else if (keyCode === 38) { // Up arrow
                    that._incrementOrDecrement(1);
                }
            });
            that.addHandler(that.host, 'keypress.jqxComplexInput' + id, function (event) {
                that.valChanged = false;
                if ($.jqx.browser.mozilla && event.ctrlKey) {
                    return;
                }

                var key = event.key || String.fromCharCode(event.keyCode),
                    test = that._allowedCharacters.test(key);
                if (test === true) { // test for allowed characters (numbers from 0 to 9, +, -, e and i)
                    if (key === '+' || key === '-') {
                        var numberOfSigns = (that.element.value.match(/-/g) || []).length + (that.element.value.match(/\+/g) || []).length;
                        if (that.outputNotation === 'default' && numberOfSigns > 1 || that.outputNotation !== 'default' && numberOfSigns > 3) {
                            return false;
                        }
                    } else if (key.toLowerCase() === 'i') { // no more than one i character is allowed
                        if (that.element.value.toLowerCase().indexOf(key.toLowerCase()) !== -1) {
                            return false;
                        }
                    } else if (key.toLowerCase() === 'e') {
                        var numberOfE = (that.element.value.toLowerCase().match(/e/g) || []).length;
                        if (numberOfE > 1) { // no more than two e characters are allowed
                            return false;
                        }
                    }
                } else if (key === that.decimalSeparator) {
                    var numberOfDecSeparators = (that.element.value.match(new RegExp('\\' + that.decimalSeparator, 'g')) || []).length;
                    if (numberOfDecSeparators > 1) { // no more than two decimal separator characters are allowed
                        return false;
                    }
                } else if (key === 'Enter') {
                    if (that.element.value !== that.value) {
                        that._onChange(that.value);
                        return;
                    }
                } else {
                    return false;
                }

                var caretPosition = that._getCaretPosition(),
                    oldValue = that.element.value,
                    currentValue = oldValue.slice(0, caretPosition) + key + oldValue.slice(caretPosition);
                if (currentValue !== oldValue) {
                    that.valChanged = true;
                    that.valueChangedOld = oldValue;
                    that.valueChangedNew = currentValue;

                    that._raiseEvent('2', { 'value': currentValue, 'oldValue': oldValue }); // textChanged event
                }
            });
            that.addHandler(that.host, 'keyup.jqxComplexInput' + id, function (event) {
                if (that.valChanged) {
                    that._raiseEvent('1', { 'value': that.valueChangedNew, 'oldValue': that.valueChangedOld }); // valueChanged event
                    that._supressValueChangedEvent = true;
                }

                if (that._spinButtonsContainer) {
                    if (event.target.value === '') {
                        that._spinButtonsContainer.addClass(that.toThemeProperty('jqx-fill-state-disabled'));
                    } else if (that.disabled === false) {
                        that._spinButtonsContainer.removeClass(that.toThemeProperty('jqx-fill-state-disabled'));
                    }
                }
            });
            that.addHandler(that.host, 'mousewheel.jqxComplexInput' + id, function (event) {
                if (that.host.is(':focus')) {
                    if (event.originalEvent.wheelDelta > 0) {
                        that._incrementOrDecrement(1);
                    } else {
                        that._incrementOrDecrement(-1);
                    }
                }
            });

            // spin buttons handlers
            if (that._spinButtonsContainer) {
                var buttons = that._upbutton.add(that._downbutton);

                that.addHandler(that._upbutton, 'mousedown.jqxComplexInputSpinButtonUp' + id, function () {
                    if (!that.disabled && that.value !== '' && that.value !== null) {
                        that._upbutton.addClass(that.toThemeProperty('jqx-fill-state-pressed'));
                        that._incrementOrDecrement(1);
                    }
                });

                that.addHandler(that._upbutton, 'mouseup.jqxComplexInputSpinButtonUp' + id, function () {
                    if (!that.disabled && that.value !== '' && that.value !== null) {
                        that._upbutton.removeClass(that.toThemeProperty('jqx-fill-state-pressed'));
                    }
                });

                that.addHandler(that._downbutton, 'mousedown.jqxComplexInputSpinButtonDown' + id, function () {
                    if (!that.disabled && that.value !== '' && that.value !== null) {
                        that._downbutton.addClass(that.toThemeProperty('jqx-fill-state-pressed'));
                        that._incrementOrDecrement(-1);
                    }
                });

                that.addHandler(that._downbutton, 'mouseup.jqxComplexInputSpinButtonDown' + id, function () {
                    if (!that.disabled && that.value !== '' && that.value !== null) {
                        that._downbutton.removeClass(that.toThemeProperty('jqx-fill-state-pressed'));
                    }
                });

                that.addHandler(buttons, 'mouseenter.jqxComplexInputSpinButtons' + id, function (e) {
                    if (!that.disabled && that.value !== '' && that.value !== null) {
                        var target = $(e.target);
                        if (target.hasClass('jqx-icon-arrow-up') || target.children().hasClass('jqx-icon-arrow-up')) {
                            that._upbutton.addClass(that.toThemeProperty('jqx-fill-state-hover'));
                            that._upArrow.addClass(that.toThemeProperty('jqx-icon-arrow-up-hover'));
                        } else {
                            that._downbutton.addClass(that.toThemeProperty('jqx-fill-state-hover'));
                            that._downArrow.addClass(that.toThemeProperty('jqx-icon-arrow-down-hover'));
                        }
                    }
                });
                that.addHandler(buttons, 'mouseleave.jqxComplexInputSpinButtons' + id, function (e) {
                    if (!that.disabled && that.value !== '' && that.value !== null) {
                        var target = $(e.target);
                        if (target.hasClass('jqx-icon-arrow-up') || target.children().hasClass('jqx-icon-arrow-up')) {
                            that._upbutton.removeClass(that.toThemeProperty('jqx-fill-state-hover'));
                            that._upArrow.removeClass(that.toThemeProperty('jqx-icon-arrow-up-hover'));
                        } else {
                            that._downbutton.removeClass(that.toThemeProperty('jqx-fill-state-hover'));
                            that._downArrow.removeClass(that.toThemeProperty('jqx-icon-arrow-down-hover'));
                        }
                    }
                });

                that.addHandler($('body'), 'mouseup.jqxComplexInputSpinButtons' + id, function () {
                    that._upbutton.add(that._downbutton).removeClass(that.toThemeProperty('jqx-fill-state-pressed'));
                });
            }
        },

        // removes event handlers
        _removeHandlers: function () {
            var that = this, id;
            if (that.baseHost) {
                id = that.baseHost[0].id;
            } else {
                id = that.element.id;
            }

            that.removeHandler(that.host, 'focus.jqxComplexInput' + id);
            that.removeHandler(that.host, 'blur.jqxComplexInput' + id);
            that.removeHandler(that.host, 'keydown.jqxComplexInput' + id);
            that.removeHandler(that.host, 'keypress.jqxComplexInput' + id);
            that.removeHandler(that.host, 'mousewheel.jqxComplexInput' + id);
            if (that._spinButtonsContainer) {
                var buttons = that._upbutton.add(that._downbutton);
                that.removeHandler(that._upbutton, 'mousedown.jqxComplexInputSpinButtonUp' + id);
                that.removeHandler(that._upbutton, 'mouseup.jqxComplexInputSpinButtonUp' + id);
                that.removeHandler(that._downbutton, 'mousedown.jqxComplexInputSpinButtonDown' + id);
                that.removeHandler(that._downbutton, 'mouseup.jqxComplexInputSpinButtonDown' + id);
                that.removeHandler(buttons, 'mouseenter.jqxComplexInputSpinButtons' + id);
                that.removeHandler(buttons, 'mouseleave.jqxComplexInputSpinButtons' + id);
                that.removeHandler($('body'), 'mouseup.jqxComplexInputSpinButtons' + id);
            }
        },

        // digits and decimalDigits properties validation
        _validatePart: function (part) {
            var that = this,
                formattedPart;

            if (that.decimalDigits !== null) {
                formattedPart = that._toNumber(part).toFixed(that.decimalDigits);
            } else {
                formattedPart = Number(that._toNumber(part).toPrecision(that.digits)).toString();
            }
            return formattedPart.replace('.', that.decimalSeparator);
        },

        // change event handler
        _onChange: function (oldValue) {
            var that = this, realValue, imaginaryValue;

            that._checkNotation();

            var value = that.element.value.toLowerCase();

            if ($.trim(value) !== '' && $.trim(value) !== that.placeHolder) {
                // validation for double plus/minus/decimal separator
                if (value.indexOf('++') !== -1 || value.indexOf('+-') !== -1) {
                    var plusIndex = value.indexOf('+');
                    value = value.slice(0, plusIndex + 1) + '' + value.slice(plusIndex + 2, value.length);
                } else if (value.indexOf('--') !== -1 || value.indexOf('-+') !== -1) {
                    var minusIndex = value.indexOf('-');
                    value = value.slice(0, minusIndex + 1) + '' + value.slice(minusIndex + 2, value.length);
                }
                if (value.indexOf(that.decimalSeparator + that.decimalSeparator) !== -1) {
                    var decimalSeparatorIndex = value.indexOf(that.decimalSeparator);
                    value = value.slice(0, decimalSeparatorIndex + 1) + '' + value.slice(decimalSeparatorIndex + 2, value.length);
                }

                if (that.decimalSeparator !== '.') {
                    var decimalSeparatorRegExp = new RegExp(that.decimalSeparator, 'g');
                    value = value.replace(decimalSeparatorRegExp, '.');
                }

                var real = that._validatePart(Number(that._getReal(value)).toString());
                var imaginary = that._validatePart(Number(that._getImaginary(value)).toString());
                var space = ' ';
                var sign = parseFloat(imaginary.replace(that.decimalSeparator, '.')) >= 0 ? '+' : '-';

                realValue = real;
                imaginaryValue = imaginary;
                if (imaginary.charAt(0) === '-') {
                    imaginary = imaginary.slice(1);
                }

                // NaN validation
                if (isNaN(realValue.replace(that.decimalSeparator, '.')) || isNaN(imaginaryValue.replace(that.decimalSeparator, '.'))) {
                    that.element.value = oldValue;
                    return;
                }

                that.element.value = real + '' + space + '' + sign + '' + space + '' + imaginary + 'i';
                that.value = that.element.value;
                if (that.disabled === false && that._spinButtonsContainer) {
                    that._spinButtonsContainer.removeClass(that.toThemeProperty('jqx-fill-state-disabled'));
                }
            } else {
                realValue = 0;
                imaginaryValue = 0;
                that.value = '';
                if (that._spinButtonsContainer) {
                    that._spinButtonsContainer.addClass(that.toThemeProperty('jqx-fill-state-disabled'));
                }
            }

            that._currentNumber = { value: that.value, realPart: realValue, imaginaryPart: imaginaryValue };
            var validation = that._validate();
            if (validation !== true) {
                that._currentNumber = { value: validation.value, realPart: validation.realPart, imaginaryPart: validation.imaginaryPart };
                that.value = validation.value;
                that.element.value = that.value;
            }
            if (that.outputNotation !== 'default') {
                that._setNotation();
            }

            if (that.value !== oldValue || that._suppressEvent === true) {
                if (that._suppressEvent !== true) {
                    if (that._supressValueChangedEvent !== true) {
                        that._raiseEvent('1', { 'value': that.value, 'oldValue': oldValue }); // valueChanged event
                    } else {
                        that._supressValueChangedEvent = false;
                    }
                    that._raiseEvent('0', { 'value': that.value, 'oldValue': oldValue, 'realPart': realValue, 'imaginaryPart': imaginaryValue }); // change event
                }
            }
        },

        _handlespinButtonsInterval: function () {
            var that = this;
            if (that.interval !== null) {
                that._intervalRealPart = that._getReal(that.interval);
                that._intervalImaginaryPart = that._getImaginary(that.interval);
            }
        },

        // increments or decrements the real or imaginary part depending on caret position
        _incrementOrDecrement: function (increment) {
            var that = this;

            that._checkNotation();

            var focused = that.host.is(':focus'),
                caretPosition,
                currentValue = that.element.value,
                realString, imaginaryString;

            if (that.outputNotation === 'default') {
                realString = that._getReal();
                imaginaryString = that._getImaginary();
            } else {
                realString = that.getDecimalNotation('real', that.outputNotation);
                realString = realString.replace('.', that.decimalSeparator);
                imaginaryString = that.getDecimalNotation('imaginary', that.outputNotation);
                imaginaryString = imaginaryString.replace('.', that.decimalSeparator);
            }

            var real = that._toNumber(realString),
                imaginary = that._toNumber(imaginaryString);

            if (imaginaryString.charAt(0) === '-') {
                imaginaryString = imaginaryString.slice(1);
            }

            var realPosition = {},
                imaginaryPosition = {},
                realLength = realString.length,
                imaginaryLength = imaginaryString.length,
                realSep = realString.indexOf(that.decimalSeparator),
                imaginarySep = imaginaryString.indexOf(that.decimalSeparator),
                power = 0,
                difference;

            if (focused) {
                caretPosition = that._getCaretPosition();
                that._onChange(that.value);
                that._setCaretPosition(caretPosition);
            }

            realPosition.from = currentValue.indexOf(realString);
            realPosition.to = realPosition.from + realLength;
            imaginaryPosition.from = currentValue.indexOf(imaginaryString + 'i');
            imaginaryPosition.to = imaginaryPosition.from + imaginaryLength;

            var middle = imaginaryPosition.from - 2;

            function incDecPart(part, partName) {
                var step;
                if (focused) {
                    step = that.spinButtonsStep;
                } else {
                    step = parseFloat(that['_interval' + partName + 'Part']);
                }

                return part + step * Math.pow(10, power) * increment;
            }

            function incDecAdvanced(partName, part, position, separator) {
                var value = partName === 'real' ? realString : imaginaryString,
                    minusFix = value.charAt(0) === '-' ? 1 : 0;

                if (caretPosition >= position.from + 1 + minusFix && caretPosition <= position.to) {
                    if (separator !== -1) {
                        var sepPosition = position.from + separator;
                        difference = sepPosition - (caretPosition - 1);

                        if (difference <= 0) {
                            power = difference;
                        } else {
                            power = difference - 1;
                        }
                    } else {
                        power = position.to - caretPosition;
                    }
                    return incDecPart(part);
                } else {
                    return part;
                }
            }

            function incDecAdvancedENotation(partName, part) {
                var value, partFrom, partTo;

                if (partName === 'real') {
                    value = realString;
                    partFrom = realPosition.from;
                    partTo = realPosition.to;
                } else {
                    value = imaginaryString;
                    partFrom = imaginaryPosition.from;
                    partTo = imaginaryPosition.to;
                }

                var indexOfE = value.toLowerCase().indexOf('e'),
                    relativeIndexOfE = partFrom + indexOfE,
                    minus = value.charAt(0) === '-';

                if (minus && (caretPosition === partFrom + 1) || caretPosition <= partFrom || caretPosition > partTo ||
                    caretPosition === relativeIndexOfE + 1 || caretPosition === relativeIndexOfE + 2) {
                    return 'return';
                }

                var indexOfSeparator = value.indexOf(that.decimalSeparator);

                var exponent = Number(value.charAt(indexOfE + 2)),
                    multiplyBy = 1;

                if (caretPosition > relativeIndexOfE + 2 && caretPosition < partTo + 1) { // caret is before/in exponent
                    multiplyBy = Math.pow((Math.pow(10, that.spinButtonsStep * increment)), Math.pow(10, (partTo - caretPosition)));
                    part = part * multiplyBy;
                } else if (indexOfSeparator !== -1) {
                    if (caretPosition === partFrom + indexOfSeparator + 1 || caretPosition === partFrom + indexOfSeparator) { // caret is before decimal separator or before first digit in the whole part
                        part = part + that.spinButtonsStep * Math.pow(10, exponent) * increment;
                    } else {
                        part = part + that.spinButtonsStep * Math.pow(10, (partFrom + indexOfSeparator + 1 - caretPosition)) * Math.pow(10, exponent) * increment;
                    }
                } else if (indexOfSeparator === -1) {
                    part = part + that.spinButtonsStep * Math.pow(10, (relativeIndexOfE - caretPosition)) * Math.pow(10, exponent) * increment;
                }

                return part;
            }

            if (caretPosition === undefined) {
                if (that.interval !== null) {
                    real = incDecPart(real, 'Real');
                    imaginary = incDecPart(imaginary, 'Imaginary');
                }
            } else if (caretPosition <= middle) {
                if (that.spinMode === 'advanced') {
                    if (that._eNotation !== true) {
                        real = incDecAdvanced('real', real, realPosition, realSep);
                    } else {
                        real = incDecAdvancedENotation('real', real);
                        if (real === 'return') {
                            that._setNotation();
                            return;
                        }
                    }
                } else {
                    real = incDecPart(real);
                }
            } else {
                if (that.spinMode === 'advanced') {
                    if (that._eNotation !== true) {
                        imaginary = incDecAdvanced('imaginary', imaginary, imaginaryPosition, imaginarySep);
                    } else {
                        imaginary = incDecAdvancedENotation('imaginary', imaginary);
                        if (imaginary === 'return') {
                            that._setNotation();
                            return;
                        }
                    }
                } else {
                    imaginary = incDecPart(imaginary);
                }
            }

            var sign = imaginary >= 0 ? '+' : '-';
            var newValue = real.toString().replace('.', that.decimalSeparator) + ' ' + sign + ' ' + Math.abs(imaginary).toString().replace('.', that.decimalSeparator) + 'i';
            that.element.value = newValue;
            that._onChange(that.value);

            if (that.outputNotation !== 'default') {
                that._setNotation();
            }

            if (focused) {
                that._setCaretPosition(caretPosition);
            }
        },

        // gets the caret's position
        _getCaretPosition: function () {
            var input = this.element;
            if ('selectionStart' in input) {
                return input.selectionStart;
            } else if (document.selection) {
                input.focus();
                var sel = document.selection.createRange();
                var selLen = document.selection.createRange().text.length;
                sel.moveStart('character', -input.value.length);
                return sel.text.length - selLen;
            }
        },

        // sets the caret's position
        _setCaretPosition: function (pos) {
            var input = this.element;
            setTimeout(function () {
                if ('selectionStart' in input) {
                    input.focus();
                    input.setSelectionRange(pos, pos);
                } else {
                    var range = input.createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', pos);
                    range.moveStart('character', pos);
                    range.select();
                }
            }, 10);
        },

        // returns the decimal notations of the real and imaginary parts from a value in exponential notation
        _exponentialToDecimal: function (value) {
            var middle = value.indexOf('e') + 2;
            var temp = value.slice(middle);
            var plusIndex = temp.indexOf('+');
            var minusIndex = temp.indexOf('-');
            if (plusIndex !== -1 && (plusIndex < minusIndex || minusIndex === -1)) {
                middle = plusIndex;
            } else {
                middle = minusIndex;
            }
            var imaginary = temp.slice(middle);
            var real = value.replace(imaginary, '');
            imaginary = imaginary.slice(0, imaginary.length - 1);
            var sign = imaginary.charAt(0);
            imaginary = $.trim(imaginary.slice(1));
            if (sign === '-') {
                imaginary = '-' + imaginary;
            }

            var decimalSeparator = this.decimalSeparator;
            if (decimalSeparator !== '.') {
                var decimalSeparatorRegExp = new RegExp(decimalSeparator, 'g');
                real = real.replace(decimalSeparatorRegExp, '.');
                imaginary = imaginary.replace(decimalSeparatorRegExp, '.');
            }
            real = parseFloat(real).toFixed(20) * 1;
            imaginary = parseFloat(imaginary).toFixed(20) * 1;
            return { realPart: real, imaginaryPart: imaginary };
        },

        // transforms the complex number to the notation specified by the outputNotation property
        _setNotation: function () {
            var that = this;

            var real = that.getDecimalNotation(that._currentNumber.realPart, that.outputNotation);
            var imaginary = that.getDecimalNotation(Math.abs(that._toNumber(that._currentNumber.imaginaryPart)), that.outputNotation);
            var sign = that._toNumber(that._currentNumber.imaginaryPart) >= 0 ? '+' : '-';
            var value = real + ' ' + sign + ' ' + imaginary + 'i';
            if (that.decimalSeparator !== '.') {
                value = value.replace(/\./g, that.decimalSeparator);
            }
            that.element.value = value;
        },

        // converts a number to superscript
        _toSuperScript: function (value, supToNormal) {
            var chars = '-0123456789';
            var sup = '⁻⁰¹²³⁴⁵⁶⁷⁸⁹';
            var result = '';

            for (var i = 0; i < value.length; i++) {
                if (supToNormal === true) {
                    var m = sup.indexOf(value.charAt(i));
                    result += (m !== -1 ? chars[m] : value[i]);
                } else {
                    var n = chars.indexOf(value.charAt(i));
                    result += (n !== -1 ? sup[n] : value[i]);
                }
            }
            return result;
        },

        // converts the string version of the real or imaginary part (with custom decimal separator) to a number
        _toNumber: function (string) {
            if (typeof string === 'number') {
                return string;
            } else {
                return parseFloat(string.replace(this.decimalSeparator, '.'));
            }
        },

        // compares two complex numbers
        _compare: function (left, right) {
            var that = this,
                leftReal = that._toNumber(that._getReal(left)),
                leftImaginary = that._toNumber(that._getImaginary(left)),
                rightReal = that._toNumber(that._getReal(right)),
                rightImaginary = that._toNumber(that._getImaginary(right));

            if (leftReal < rightReal) {
                return -1;
            } else if (leftReal > rightReal) {
                return 1;
            } else {
                if (leftImaginary < rightImaginary) {
                    return -1;
                } else if (leftImaginary > rightImaginary) {
                    return 1;
                } else {
                    return 0;
                }
            }
        },

        // validates the entered complex number
        _validate: function () {
            var that = this,
                currentNumber = that._currentNumber.value,
                decimalSeparatorRegExp = new RegExp(that.decimalSeparator, 'g');

            function constructValue(real, imaginary) {
                real = that._validatePart(Number(real).toString());
                imaginary = that._validatePart(Number(imaginary).toString());
                var sign = parseFloat(imaginary.replace(that.decimalSeparator, '.')) >= 0 ? '+' : '-';

                if (imaginary.charAt(0) === '-') {
                    imaginary = imaginary.slice(1);
                }

                var value = real + ' ' + sign + ' ' + imaginary + 'i';
                return value;
            }

            function returnObject(extreme) {
                var normalizedExtreme = extreme,
                    object = {};

                if (that.decimalSeparator !== '.') {
                    normalizedExtreme = extreme.replace(decimalSeparatorRegExp, '.');
                }

                object.realPart = that._getReal(normalizedExtreme);
                object.imaginaryPart = that._getImaginary(normalizedExtreme);
                object.value = constructValue(object.realPart, object.imaginaryPart);
                return object;
            }

            if (that.min !== null && that._compare(currentNumber, that.min) === -1) {
                return returnObject(that.min);
            }
            if (that.max !== null && that._compare(currentNumber, that.max) === 1) {
                return returnObject(that.max);
            }
            return true;
        }
    });
})(jqxBaseFramework); //ignore jslint
 