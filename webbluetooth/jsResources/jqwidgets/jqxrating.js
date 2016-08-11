/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/


(function ($) {

    $.jqx.jqxWidget('jqxRating', '', {});

    $.extend($.jqx._jqxRating.prototype, {
        defineInstance: function () {
            var settings = {
                // Type: Number
                // Default: 5
                // Sets or gets images count.
                count: 5,
                // Type: Bool
                // Default: false
                // Sets or gets whether the rating widget is disabled.
                disabled: false,
                // Type: Number
                // Default: 0
                // Gets or sets current rating.
                value: 0,
                // Type: Number or String
                // Default: auto
                // Gets or sets widget's height.
                height: 'auto',
                // Type: Number or String
                // Default: auto
                // Gets or sets widget's width.
                width: 'auto',
                // Type: Number
                // Default: 1
                // Gets or sets vote precision.
                precision: 1,
                // Type: Bool
                // Default: false
                // Gets or sets whether the user can vote single or multiple times.
                singleVote: false,
                // Type: Number or String
                // Default: auto
                // Gets or sets rating item's height
                itemHeight: '20',
                // Type: Number or String
                // Default: auto
                // Gets or sets rating item's width.
                itemWidth: '20',

                //Private varables
                _itemHeight: undefined,
                _itemWidth: undefined,
                _images: [],
                aria:
                {
                    "aria-valuenow": { name: "value", type: "number" },
                    "aria-disabled": { name: "disabled", type: "boolean" }
                },
                // the change event is triggered when the rating is changed.
                _events: [
                    'change'
                ],
                _invalidArgumentExceptions: {
                    'invalidPrecision': 'The value of the precision property is invalid!',
                    'invalidWidth': 'Width you\'ve entered is invalid!',
                    'invalidHeight': 'Height you\'ve entered is invalid!',
                    'invalidCount': 'You\'ve entered invalid value for the count property!',
                    'invalidValue': 'You\'ve entered invalid value property!'
                }
            };
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function (args) {
            $.jqx.aria(this);
            this._createRating();
        },

        destroy: function()
        {
            this.host.remove();
        },

        val: function (value) {
            if (arguments.length == 0 || typeof (value) == "object") {
                return this.value;
            }

            if (typeof value == "string") {
                this.value = parseInt(value);
            }
            else {
                this.value = value;
            }
            this.setValue(this.value);
            return this.value;
        },

        _createRating: function () {
            this.host.css('display', 'none');
            this.host.empty();
            this._addInput();
            this._validateProperties();
            this._render();
            this._performLayout();
            this._removeEventHandlers();
            this._addEventHandlers();
            this.host.css('display', 'block');
            this.host.addClass(this.toThemeProperty('jqx-widget'));
            if (this.disabled) {
                this.disable();
            }
        },

        _addInput: function () {
            var name = this.host.attr('name');
            this.input = $("<input type='hidden'/>");
            this.host.append(this.input);
            if (name) {
                this.input.attr('name', name);
            }
            this.input.val(this.value.toString());
        },

        _render: function () {
            for (var i = 1; i <= this.count; i++) {
                this._images[i - 1] = $('<div style="float:left;width:auto;height:auto; position: relative;">' +
                                            '<div style="position:absolute;width:auto;height:auto;visibility:hidden;" class="jqx-rating-hoverWrapper">' +
                                                '<div style="width:auto;height:auto;float:left;" class="' + this.toThemeProperty('jqx-rating-image-hover') + '"></div>' +
                                                '<div style="visibility:hidden;width:auto;height:auto;" class="' + this.toThemeProperty('jqx-rating-image-backward') + '"></div>' +
                                            '</div>' +
                                            '<div style="position:absolute;width:auto;height:auto;" class="jqx-rating-voteWrapper">' +
                                                '<div style="width:auto;height:auto;float:left;" class="' + this.toThemeProperty('jqx-rating-image-default') + '"></div>' +
                                                '<div style="width:0;height:auto;float:left;" class="' + this.toThemeProperty('jqx-rating-image-backward') + '"></div>' +
                                            '</div>' +
                                        '</div>');
                this.host.append(this._images[i - 1]);
            }
        },

        _performLayout: function () {
            for (var i = 1; i <= this.count; i++) {
                var backwardImageDiv = this._images[i - 1].find(this.toThemeProperty('.jqx-rating-image-backward', true)),
                    defaultImageDiv = this._images[i - 1].find(this.toThemeProperty('.jqx-rating-image-default', true)),
                    hoverImageDiv = this._images[i - 1].find(this.toThemeProperty('.jqx-rating-image-hover', true)),
                    defaultImageUrl = this._getImageName(defaultImageDiv), 
                    hoverImageUrl = this._getImageName(hoverImageDiv),
                    backwardImageUrl = this._getImageName(backwardImageDiv);
                defaultImageDiv.css('background-image', 'none');
                hoverImageDiv.css('background-image', 'none');
                backwardImageDiv.css('background-image', 'none');
                this._appendImage(hoverImageDiv, hoverImageUrl, i - 1);
                this._appendImage(backwardImageDiv, backwardImageUrl, i - 1);
                this._appendImage(defaultImageDiv, defaultImageUrl, i - 1);
            }
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this._setControlSize(this.width, this.height);
        },

        _setControlSize: function (width, height) {
            this.host.css('height', this.height);
            this.host.css('width', this.width);
            if (this.itemHeight && this.itemHeight !== 'auto') {
                this._itemHeight = parseInt(this.itemHeight);
            } else {
                this._itemHeight = height;
            }
            if (this.itemWidth && this.itemWidth !== 'auto') {
                this._itemWidth = parseInt(this.itemWidth);
            } else {
                this._itemWidth = width;
            }
        },

        _appendImage: function (container, imageUrl, imageId) {
            var self = this;
            var image = $('<img style="-moz-user-select:-moz-none;-khtml-user-select: ' +
                        'none;-webkit-user-select:none;user-select:none;" class="' + this.toThemeProperty('jqx-rating-image') + '" src="' + imageUrl + '" />');
            container.append(image);
            image.load(function () {
                if (!self._initialized) {
                    self._setControlSize($(this).width(), $(this).height());
                    self._setValue(self.value, '.jqx-rating-voteWrapper', '.jqx-rating-image-default', '.jqx-rating-image-backward');
                    self._initialized = true;
                }
                self._images[imageId].height(self._itemHeight);
                $(this).height(self._itemHeight);
                self._images[imageId].width(self._itemWidth);
                $(this).width(self._itemWidth);
            });
            return image;
        },

        _validateProperties: function () {
            try {
                if (this.precision < 0.001 || this.precision > 1) {
                    throw this._invalidArgumentExceptions['invalidPrecision'];
                }
                if (this.height !== 'auto' && parseInt(this.height) < 0) {
                    throw this._invalidArgumentExceptions['invalidHeight'];
                }
                if (this.width !== 'auto' && parseInt(this.width) < 0) {
                    throw this._invalidArgumentExceptions['invalidWidth'];
                }
                if (this.count <= 0) {
                    throw this._invalidArgumentExceptions['invalidCount'];
                }
                if (this.value > this.count || this.value < 0) {
                    throw this._invalidArgumentExceptions['invalidValue'];
                }
            } catch (exception) {
                alert(exception);
            }
        },

        _getImageIndex: function (image) {
            var index = 0;
            while (image !== this._images[index][0]) {
                index++;
            }
            return ++index;
        },

        _getRating: function (image, pageCoordinate) {
            var imageRate = this._getImageIndex(image);
            if (this.precision < 1) {
                var leftOffet = parseInt(pageCoordinate) - parseInt($(image).position().left),
                    sectorSize = this._itemWidth * this.precision, size = 0;
                while (size < leftOffet) {
                    size += sectorSize;
                }
                if (size > parseInt(this._itemWidth) - sectorSize) {
                    size = parseInt(this._itemWidth);
                }
                var percents = size / $(image).width();
                imageRate -= 1 - percents;
            }
            return imageRate;
        },

        _addEventHandlers: function () {
            var self = this;
            for (var i = 0; i < this.count; i++) {
                if (!$.jqx.mobile.isTouchDevice()) {
                    this.addHandler(this._images[i], 'mousemove', function (event) {
                        var imageRate = self._getRating(this, event.pageX);
                        self._setValue(imageRate, '.jqx-rating-hoverWrapper', '.jqx-rating-image-hover', '.jqx-rating-image-backward');
                    });
                    this.addHandler(this._images[i], 'mouseenter', function (event) {
                        var imageRate = self._getImageIndex(this);
                        for (var j = 0; j < imageRate; j++) {
                            self._images[j].children('.jqx-rating-hoverWrapper').css('z-index', '10');
                            self._images[j].children('.jqx-rating-voteWrapper').css('z-index', '1');
                            self._images[j].children('.jqx-rating-hoverWrapper').css('visibility', 'visible');
                        }
                    });
                    this.addHandler(this._images[i], 'mouseleave', function (event) {
                        var imageRate = self._getImageIndex(this);
                        for (var j = 0; j < imageRate; j++) {
                            self._images[j].children('.jqx-rating-voteWrapper').css('z-index', '10');
                            self._images[j].children('.jqx-rating-hoverWrapper').css('z-index', '1');
                            self._images[j].children('.jqx-rating-hoverWrapper').css('visibility', 'hidden');
                        }
                    });
                }
                this.addHandler(this._images[i], 'click', function (event) {
                    var imageRate = self._getRating(this, event.pageX);
                    self._setValue(imageRate, '.jqx-rating-voteWrapper', '.jqx-rating-image-default', '.jqx-rating-image-backward');
                    if (self.singleVote) {
                        self.disable();
                    }
                    event.stopPropagation();
                    self._raiseEvent(0, imageRate);
                });
                this.addHandler(this._images[i], 'dragstart', function (event) {
                    return false;
                });
            }
        },

        _removeEventHandlers: function () {
            for (var i = 0; i < this.count; i++) {
                this.removeHandler(this._images[i], 'mousemove');
                this.removeHandler(this._images[i], 'mouseenter');
                this.removeHandler(this._images[i], 'mouseleave');
                this.removeHandler(this._images[i], 'click');
                this.removeHandler(this._images[i], 'dragstart');
            }
        },

        _getImageName: function (image) {
            var imageUrl = image.css('background-image')
            imageUrl = imageUrl.replace('url("', '');
            imageUrl = imageUrl.replace('")', '');
            imageUrl = imageUrl.replace('url(', '');
            imageUrl = imageUrl.replace(')', '');
            return imageUrl;
        },

        _setValue: function (rating, parent, rated, nonRated) {
            for (var i = 1; i <= this.count; i++) {
                var percent = 1,
                    parentNode = this._images[i - 1].children(parent),
                    rateDiv = parentNode.children(rated),
                    nonRatedDiv = parentNode.children(nonRated);
                if (i > rating) {
                    if (Math.abs(i - rating) < 1) {
                        percent = 1 - Math.abs(i - rating);
                    } else {
                        percent = 0;
                    }
                }
                rateDiv.width(this._itemWidth * percent);
                nonRatedDiv.width(this._itemWidth - parseInt(rateDiv.width()));
                parentNode.children(this.toThemeProperty(nonRated)).children(0).css('margin-left', -this._itemWidth * percent + 'px');
            }
            $.jqx.aria(this, 'aria-valuenow', rating);
        },

        _raiseEvent: function (id, newValue) {
            var event = new $.Event(this._events[id]);
            event.owner = this;
            event.value = newValue;
            event.oldvalue = this.value;
            this.value = newValue;
            if (this.input) {
                this.input.val(this.value.toString());
            }
            return this.host.trigger(event);
        },

        //Setting value to the rating widget
        setValue: function (value) {
            this._setValue(value, '.jqx-rating-voteWrapper', '.jqx-rating-image-default', '.jqx-rating-image-backward');
            this.value = value;
            this._raiseEvent(0, this.value);
        },

        //Getting current rating value
        getValue: function () {
            return this.value;
        },

        //Disabling the widget
        disable: function () {
            this._removeEventHandlers();
            this.disabled = true;
            $.jqx.aria(this, 'aria-disabled', true);
        },

        //Enabling the widget
        enable: function () {
            this._removeEventHandlers();
            this._addEventHandlers();
            this.disabled = false;
            $.jqx.aria(this, 'aria-disabled', false);
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (key === 'disabled') {
                if (value) {
                    this.disable();
                } else {
                    this.enable();
                }
                return;
            } 
            else if (key === 'value') {
                object.setValue(value);
            }
            else {
                object._createRating();
            }
        }
    });
})(jqxBaseFramework);
