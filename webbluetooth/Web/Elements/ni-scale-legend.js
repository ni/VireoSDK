//****************************************
// Scale Legend Prototype
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.ScaleLegend = function () {
    'use strict';
};

// Static Public Variables
// None

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var $ = NationalInstruments.Globals.jQuery;
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

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
            propertyName: 'graphName',
            defaultValue: '',
            fireEvent: false,
            addNonSignalingProperty: false
        });
        proto.addProperty(targetPrototype, {
            propertyName: 'isInEditMode',
            defaultValue: false,
            fireEvent: false,
            addNonSignalingProperty: false
        });
    };

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);

        // Public Instance Properties
        this.tbl = undefined;
        this.nScales = 0;
        this.currentExpander = null;
        this.helpers = new NationalInstruments.HtmlVI.Elements.ScaleLegendHelpers();
        this.uihelpers = new NationalInstruments.HtmlVI.Elements.LegendHelpers(this.helpers, null);

        // Private Instance Properties
        // None
    };

    proto.scaleAdded = function () {
        this.createRow(this.tbl, this.nScales);
        this.helpers.addScale(this.nScales);
        this.nScales++;
    };

    proto.scaleRemoved = function (scale) {
        var tr, td, text, i, j, index, toRemove = null;
        j = 0;
        for (i = 0; i < this.tbl.childNodes.length; i++) {
            if (this.tbl.childNodes[i].localName === 'tr') {
                tr = this.tbl.childNodes[i];
                td = tr.childNodes[0];
                text = td.innerText;
                if (text === scale.label) {
                    toRemove = tr;
                    index = j;
                    break;
                }
            }

            j++;
        }

        if (toRemove !== null) {
            this.tbl.removeChild(toRemove);
            this.helpers.clearScale(index);
        }

        this.nScales--;
    };

    proto.createRows = function () {
        var i;
        for (i = 0; i < this.nScales; i++) {
            this.createRow(this.tbl, i);
        }
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            childElement,
            that = this;

        if (firstCall === true) {
            this.helpers.graphName = this.graphName;
            this.helpers.isInEditMode = this.isInEditMode;
            childElement = document.createElement('div');
            childElement.style.width = '100%';
            childElement.style.height = '100%';
            this.appendChild(childElement);
            this.tbl = document.createElement('table');
            this.tbl.className = 'ni-scale-legend-box';
            childElement.appendChild(this.tbl);
            this.createRows();
            this.addEventListener('ni-cartesian-axis-attached', function () {
                that.scaleAdded();
            });
            this.addEventListener('ni-cartesian-axis-detached', function (evt) {
                that.scaleRemoved(evt.detail.originalSource);
            });
            this.addEventListener('ni-axis-changed', function (evt) {
                var scale = evt.detail.originalSource;
                var index = that.helpers.scaleToIndex(scale);
                var labels = $(this.tbl).find('.ni-row-title');
                $(labels[index]).first().text(scale.label);
            });
            var graph = document.querySelector('[ni-control-id=\'' + this.graphName + '\']');
            if (graph !== null) {
                graph.registerScaleLegend(this);
            }
        }

        return firstCall;
    };

    proto.createRow = function (tbl, index) {
        var that = this;
        var tr, td1, td2, td3, span, p, btnLock, btnScaleOnce;

        tr = document.createElement('tr');
        tbl.appendChild(tr);
        td1 = document.createElement('td');
        td1.className = 'ni-row-title-box';
        tr.appendChild(td1);
        span = document.createElement('span');
        span.className = 'ni-row-title';
        td1.appendChild(span);
        var scaleName = that.helpers.getState('name', index);
        p = document.createTextNode(scaleName);
        span.appendChild(p);

        td2 = document.createElement('td');
        td2.className = 'ni-lock-box';
        tr.appendChild(td2);
        btnLock = document.createElement('button');
        btnLock.type = 'button';
        btnLock.className = 'ni-lock-button ni-button';
        $(btnLock).jqxToggleButton();
        $(btnLock).jqxToggleButton({ disabled: !this.helpers.getState('canLock', index) });
        $(btnLock).on('click', function () {
            that.helpers.handleClick('lock', index);
            that.setLockBackground(btnLock, false, index);
        });
        that.setLockBackground(btnLock, true, index);
        td2.appendChild(btnLock);

        td3 = document.createElement('td');
        td3.className = 'ni-scaleonce-box';
        tr.appendChild(td3);
        btnScaleOnce = document.createElement('button');
        btnScaleOnce.type = 'button';
        btnScaleOnce.className = 'ni-scaleonce-button ni-button';
        $(btnScaleOnce).on('click', function () {
            that.helpers.handleClick('scaleonce', index);
            that.setLockBackground(btnLock, false, index);
        });
        td3.appendChild(btnScaleOnce);
        this.applyFont();
    };

    proto.setLockBackground = function (btn, first, index) {
        var state = this.helpers.getState('lock', index);
        if (state !== undefined) {
            if (first === true) {
                $(btn).jqxToggleButton({ 'toggled': state });
            }

            if (state === true) {
                btn.classList.remove('ni-locked-icon');
                btn.classList.add('ni-unlocked-icon');
            } else {
                btn.classList.remove('ni-unlocked-icon');
                btn.classList.add('ni-locked-icon');
            }
        }
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var childElement = this.firstElementChild,
            jqrefItemTitle = $(childElement).find(' .ni-row-title');

        jqrefItemTitle.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
    };

    proto.applyFont = function () {
        var childElement = this.firstElementChild,
            jqrefItemTitle = $(childElement).find(' .ni-row-title');

        var fontSize = $(this).css('font-size');
        var fontFamily = $(this).css('font-family');
        var fontWeight = $(this).css('font-weight');
        var fontStyle = $(this).css('font-style');
        jqrefItemTitle.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        var that = this;

        switch (propertyName) {
            case 'graphName':
                // should never change
                this.helpers.graphName = this.graphName;
                break;
            case 'isInEditMode':
                // this changes once after the element is created
                this.helpers.isInEditMode = this.isInEditMode;
                $(this.tbl).find('.ni-lock-button').each(function () {
                    $(this).jqxToggleButton({ disabled: that.isInEditMode });
                });
                $(this.tbl).find('.ni-scaleonce-button').each(function () {
                    $(this).prop('disabled', that.isInEditMode);
                });
                break;
            default:
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-scale-legend', 'HTMLNIScaleLegend');
}(NationalInstruments.HtmlVI.Elements.ScaleLegend, NationalInstruments.HtmlVI.Elements.Visual));
