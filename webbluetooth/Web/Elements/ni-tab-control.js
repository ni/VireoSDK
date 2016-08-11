//****************************************
// Tab Control Prototype
// DOM Registration: HTMLNITabControl
// National Instruments Copyright 2014
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.TabControl = function () {
    'use strict';
};

// Static Public Variables
// None

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var $ = NationalInstruments.Globals.jQuery;

    NI_SUPPORT.inheritFromParent(child, parent);
    var proto = child.prototype;

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'selectedIndex',
            defaultValue: 0,
            fireEvent: true,
            addNonSignalingProperty: true,
            isElementValueProperty: true
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'tabStripPlacement',
            defaultValue: 'top'
        });

    };

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);

        // Public Instance Properties
        // None

        // Private Instance Properties
        this._validTabHeadersLength = 0;
    };

    // This function does not rely on instance properties of child TagItems
    // so can be used before child TagItems have been upgraded
    proto.findNonUpgradedChildTabItems = function () {
        var myChildTabItems = [],
            tabItemName = NationalInstruments.HtmlVI.Elements.TabItem.prototype.elementInfo.tagName.toUpperCase(),
            i;

        for (i = 0; i < this.children.length; i++) {
            if (this.children[i].tagName === tabItemName && this.children[i] instanceof NationalInstruments.HtmlVI.Elements.TabItem === false) {
                myChildTabItems.push(this.children[i]);
            }
        }

        return myChildTabItems;
    };

    proto.createHeaderContainer = function (tabItemToIgnore) {
        // TODO mraj tabItemToIgnore needed because PhantomJS 1.9.8 calls the detached callback before removing the element from the DOM while PhantomJS 2+ and all modern browsers call detached after removing the element from the DOM

        // Generated DOM:
        //<div ni-data-container ni-data-valid-tab-headers-length="n">
        //    <ul ni-data-headers>
        //        <li>Tab Header 1</li>
        //        ...
        //    </ul>
        //    <div ni-data-frames>
        //        <div><!-- Empty Tab 1 --></div>
        //        ...
        //    </div>
        //</div>

        var container = document.createElement('div');
        container.id = NI_SUPPORT.uniqueId();
        var tabHeaders, tabFrames;

        var i, currHeader, validTabHeadersLength;
        var headers = [];

        for (i = 0; i < this.children.length; i++) {
            if (this.children[i] instanceof NationalInstruments.HtmlVI.Elements.TabItem && this.children[i] !== tabItemToIgnore) {
                if (headers[this.children[i].tabPosition] === undefined) {
                    headers[this.children[i].tabPosition] = this.children[i].header;
                } else {
                    // If error, reset header and stop iteration
                    // TODO mraj change to verbose logging
                    //NI_SUPPORT.error('TabControl (', this.id, ') has multiple TabItems with tabPosition (', this.children[i].tabPosition, ')');
                    headers = [];
                    break;
                }
            }
        }

        tabHeaders = document.createElement('ul');
        tabFrames = document.createElement('div');
        if (headers.length > 0) {
            for (i = 0; i < headers.length; i++) {
                if (typeof headers[i] === 'string') {
                    currHeader = document.createElement('li');
                    currHeader.textContent = headers[i];
                    tabHeaders.appendChild(currHeader);
                    tabFrames.appendChild(document.createElement('div'));
                } else {
                    // If error, reset headers + frames and stop iteration
                    // TODO mraj change to verbose logging
                    //NI_SUPPORT.error('TabControl (', this.id, ') is missing TabItem at tabPosition (', i, ')');
                    tabHeaders = document.createElement('ul');
                    tabFrames = document.createElement('div');
                    break;
                }
            }
        }

        if (tabHeaders.children.length === 0 || tabFrames.children.length === 0) {
            currHeader = document.createElement('li');
            currHeader.innerHTML = '&nbsp;';
            tabHeaders.appendChild(currHeader);
            tabFrames.appendChild(document.createElement('div'));
            // TODO mraj change to verbose logging
            //NI_SUPPORT.info('TabControl (', this.id, ') has no valid TabItems to render, creating dummy TabItem');
            validTabHeadersLength = 0;
        } else {
            // tabHeaders and tabFrames should be the same length
            validTabHeadersLength = tabHeaders.children.length;
        }

        container.appendChild(tabHeaders);
        container.appendChild(tabFrames);
        container.setAttribute('ni-data-container', '');
        container.setAttribute('ni-data-valid-tab-headers-length', validTabHeadersLength);
        tabHeaders.setAttribute('ni-data-headers', '');
        tabHeaders.classList.add('ni-headers-box');
        tabFrames.setAttribute('ni-data-frames', '');

        return container;
    };

    proto.getHeaderContainer = function () {
        var i;

        for (i = 0; i < this.children.length; i++) {
            if (this.children[i].getAttribute('ni-data-container') !== null) {
                return this.children[i];
            }
        }

        return undefined;
    };

    proto.attachHeaderContainer = function (tabItemToIgnore) {
        var widgetSettings = {},
            childElement,
            jqref,
            oldContainer,
            that = this;

        oldContainer = this.getHeaderContainer();
        if (oldContainer !== undefined) {
            this.removeChild(oldContainer);
        }

        widgetSettings.width = '100%';
        widgetSettings.height = '100%';
        widgetSettings.animationType = 'none';
        widgetSettings.position = this.tabStripPlacement.toLowerCase();

        childElement = this.createHeaderContainer(tabItemToIgnore);

        this._validTabHeadersLength = parseFloat(childElement.getAttribute('ni-data-valid-tab-headers-length'));

        if (this.firstElementChild !== null) {
            this.insertBefore(childElement, this.firstElementChild);
        } else {
            this.appendChild(childElement);
        }

        jqref = $(childElement);
        jqref.jqxRibbon(widgetSettings);
        // Adding CSS class names
        $('#' + childElement.id + ' .jqx-ribbon-item').addClass('ni-header');
        $('#' + childElement.id + ' .ni-header').css('font-size', $(this).css('font-size'));
        $('#' + childElement.id + ' .ni-header').css('font-family', $(this).css('font-family'));
        $('#' + childElement.id + ' .ni-header').css('font-weight', $(this).css('font-weight'));
        $('#' + childElement.id + ' .ni-header').css('font-style', $(this).css('font-style'));

        jqref.on('select', function (evt) {
            that.selectedIndex = evt.args.selectedIndex;
        });

        this.applySelectedIndex();
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var childElement = this.firstElementChild,
            jqrefContent = $('#' + childElement.id + ' .ni-header');

        jqrefContent.css({ 'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle });
    };

    proto.addTabItemListeners = function (initialTabItemsToWaitFor) {
        var that = this;

        that.addEventListener('ni-tab-item-attached', function (evt) {
            var i;

            if (evt.target === that) {
                for (i = 0; i < initialTabItemsToWaitFor.length; i++) {
                    if (initialTabItemsToWaitFor[i] === evt.detail.element) {
                        initialTabItemsToWaitFor.splice(i, 1);
                        break;
                    }
                }

                if (initialTabItemsToWaitFor.length === 0) {
                    that.attachHeaderContainer();
                }
            }
        });

        that.addEventListener('ni-tab-item-detached', function (evt) {
            if (evt.target === that) {
                that.attachHeaderContainer(evt.detail.element);
            }
        });

        that.addEventListener('ni-tab-item-header-updated', function (evt) {
            var childElement = that.getHeaderContainer(),
                jqref;
            if (evt.target === that && childElement !== undefined) {
                jqref = $(childElement);
                jqref.jqxRibbon('updateAt', evt.detail.element.tabPosition, {
                    newTitle: evt.detail.element.header
                });
            }
        });

        that.addEventListener('ni-tab-item-position-updated', function (evt) {
            if (evt.target === that) {
                that.attachHeaderContainer();
            }
        });
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this);
        var initialTabItemsToWaitFor;

        if (firstCall === true) {
            initialTabItemsToWaitFor = this.findNonUpgradedChildTabItems();

            if (initialTabItemsToWaitFor.length === 0) {
                this.attachHeaderContainer();
            }

            this.addTabItemListeners(initialTabItemsToWaitFor);
        }

        return firstCall;
    };

    proto.applySelectedIndex = function () {
        var childElement, jqref, i;

        if (this._validTabHeadersLength > 0 && this.selectedIndex >= 0 && this.selectedIndex < this._validTabHeadersLength) {
            childElement = this.getHeaderContainer();
            jqref = $(childElement);
            jqref.jqxRibbon({
                selectedIndex: this.selectedIndex
            });

            for (i = 0; i < this.children.length; i++) {
                if (this.children[i] instanceof NationalInstruments.HtmlVI.Elements.TabItem) {
                    if (this.children[i].tabPosition === this.selectedIndex) {
                        this.children[i].classList.remove('ni-hidden');
                    } else {
                        this.children[i].classList.add('ni-hidden');
                    }
                }
            }

        }
        // else {
        //    TODO mraj change to verbose logging
        //    NI_SUPPORT.info('TabControl (', this.id, ') was provided invalid selectedIndex (', this.selectedIndex, ') when the number of valid tab items is (', this._validTabHeadersLength, ')');
        //}
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        switch (propertyName) {
        case 'selectedIndex':
            this.applySelectedIndex();
            break;
        case 'tabStripPlacement':
            // TODO mraj changing the position of the jqxRibbon header causes render problems in jqx, so instead recreate the whole header.
            this.attachHeaderContainer();
            break;
        default:
            break;
        }
    };

    proto.defineElementInfo(proto, 'ni-tab-control', 'HTMLNITabControl');
}(NationalInstruments.HtmlVI.Elements.TabControl, NationalInstruments.HtmlVI.Elements.Visual));
