//****************************************
// Plot Legend Prototype
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.PlotLegend = function () {
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
    var rowSize = 26;
    var legendBorderHeight = 2;

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
        this.nPlots = 0;
        this.currentExpander = null;
        this.helpers = new NationalInstruments.HtmlVI.Elements.PlotLegendHelpers();
        this.plotLegendItemDisplay = new NationalInstruments.HtmlVI.Elements.PlotLegendItemDisplay(this.helpers);
        this.uihelpers = new NationalInstruments.HtmlVI.Elements.LegendHelpers(this.helpers, this.plotLegendItemDisplay);

        // Private Instance Properties
        // None
    };

    proto.plotAdded = function () {
        this.createRow(this.tbl, this.nPlots);
        this.helpers.addRenderer(this.nPlots);
        this.nPlots++;
    };

    proto.plotRemoved = function () {
        this.removeLastRow(this.tbl);
        this.helpers.clearRenderer(this.nPlots);
        this.nPlots--;
    };

    proto.createRows = function () {
        var i;
        for (i = 0; i < this.nPlots; i++) {
            this.createRow(this.tbl, i);
        }
    };

    proto.calculateNumPlots = function (newHeight) {
        var currentHeight = parseFloat(this.style.height);
        var snappedHeight = newHeight;
        var numPlotsToAdd = Math.floor(Math.round(newHeight - (this.nPlots * rowSize + legendBorderHeight)) / rowSize);
        if (numPlotsToAdd !== 0) {
            if (snappedHeight <= currentHeight) {
                snappedHeight = Math.max(currentHeight - (Math.ceil((currentHeight - snappedHeight) / rowSize) * rowSize) + rowSize, rowSize);
            } else {
                snappedHeight = currentHeight + (Math.floor((snappedHeight - currentHeight) / rowSize) * rowSize);
            }

            this.style.height = snappedHeight + 2 * legendBorderHeight + 'px';
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
            childElement.style.overflowX = 'auto';
            childElement.style.overflowY = 'hidden';
            this.appendChild(childElement);
            this.tbl = document.createElement('table');
            this.tbl.style.width = '100%';
            this.tbl.style.height = '100%';
            childElement.appendChild(this.tbl);
            this.createRows();
            this.addEventListener('ni-cartesian-plot-attached', function () {
                that.plotAdded();
            });
            this.addEventListener('ni-cartesian-plot-detached', function () {
                that.plotRemoved();
            });
            this.addEventListener('ni-cartesian-plot-changed', function (evt) {
                var index = that.helpers.rendererToIndex(evt.detail.originalSource);
                that.plotLegendItemDisplay.updateShape(index);
            });
            var graph = document.querySelector('[ni-control-id=\'' + this.graphName + '\']');
            if (graph !== null) {
                graph.registerPlotLegend(this);
            }
        }

        return firstCall;
    };

    proto.createRow = function (tbl, index) {
        var that = this;
        var tr, exp, header, content, div, plotName, p, span;

        tr = document.createElement('tr');
        tbl.appendChild(tr);
        exp = document.createElement('div');
        exp.id = 'expander' + index;
        exp.className = 'ni-plot-legend-box';
        tr.appendChild(exp);
        header = document.createElement('div');
        header.id = 'header' + index;
        header.className = 'ni-master-row';
        exp.appendChild(header);

        div = document.createElement('div');
        div.className = 'ni-plot-display';
        header.appendChild(div);
        this.plotLegendItemDisplay.createHeaderDisplay(div, index);

        span = document.createElement('span');
        span.className = 'ni-plot-title';
        plotName = ' plot';
        if (index > 0) {
            plotName = plotName + index.toString();
        }

        p = document.createTextNode(plotName);
        span.appendChild(p);
        header.appendChild(span);

        content = document.createElement('div');
        content.id = 'content' + index;
        content.className = 'ni-details-box';
        exp.appendChild(content);
        $(exp).jqxExpander({
            expanded: false,
            disabled: this.isInEditMode,
            expandAnimationDuration: 200,
            collapseAnimationDuration: 200,
            initContent: function () {
                that.loadContent(content, index);
            }
        });
        $(exp).on('expanded', function () {
            if (this !== that.currentExpander) {
                var expander = that.currentExpander;
                that.currentExpander = this;
                if (expander !== null) {
                    $(expander).jqxExpander({ expanded: false });
                }
            }
        });
        this.applyFont();
    };

    proto.loadContent = function (content, index) {
        var tbl, tr, j, span, p, td1, td2, div;
        content.style.height = ((this.helpers.menu.length + 1) * 30) + 10 + 'px';
        tbl = document.createElement('table');
        tbl.className = 'ni-details';
        content.appendChild(tbl);

        for (j = 0; j < this.helpers.menu.length; j++) {
            var menuItem = this.helpers.menu[j];
            tr = document.createElement('tr');
            tr.className = 'ni-details-row';
            tbl.appendChild(tr);
            td1 = document.createElement('td');
            td1.className = 'ni-detail-row-title-box';
            tr.appendChild(td1);
            span = document.createElement('span');
            span.className = 'ni-detail-row-title';
            td1.appendChild(span);
            var text = NI_SUPPORT.i18n(menuItem.tag);
            if (text.substring(0, 5) === '[msg_') { // in case server is not running
                text = menuItem.name + '!';
            }

            p = document.createTextNode(text);
            span.appendChild(p);
            td2 = document.createElement('td');
            td2.className = 'ni-details-row-operations-box';
            tr.appendChild(td2);
            switch (menuItem.type) {
                case 'buttons':
                    this.uihelpers.addButtons(menuItem, td2, index);
                    break;
                case 'combobox':
                    div = document.createElement('div');
                    div.className = 'ni-selector';
                    td2.appendChild(div);
                    this.uihelpers.addComboBox(menuItem, div, index, 60);
                    break;
                case 'colorbox':
                    div = document.createElement('div');
                    div.className = 'ni-colorbox-selector ni-selector';
                    td2.appendChild(div);
                    this.uihelpers.addColorBox(menuItem, div, index);
                    break;
                case 'checkbox':
                    div = document.createElement('div');
                    div.className = 'ni-hover-box';
                    td2.appendChild(div);
                    this.uihelpers.addCheckBox(menuItem, div, index);
                    break;
            }
        }
    };

    proto.removeLastRow = function (tbl) {
        var row = tbl.lastElementChild;
        if (row !== null) {
            tbl.removeChild(row);
        }
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var childElement = this.firstElementChild,
            jqrefContent = $(childElement).find(' .jqx-widget-content'),
            jqrefItemTitle = $(childElement).find(' .ni-plot-title'),
            jqrefItemContentTitle = $(childElement).find(' .ni-detail-row-title');

        jqrefContent.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
        jqrefItemTitle.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
        jqrefItemContentTitle.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
    };

    proto.applyFont = function () {
        var childElement = this.firstElementChild,
            jqrefContent = $(childElement).find(' .jqx-widget-content'),
            jqrefItemTitle = $(childElement).find(' .ni-plot-title'),
            jqrefItemContentTitle = $(childElement).find(' .ni-detail-row-title');

        var fontSize = $(this).css('font-size');
        var fontFamily = $(this).css('font-family');
        var fontWeight = $(this).css('font-weight');
        var fontStyle = $(this).css('font-style');
        jqrefContent.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
        jqrefItemTitle.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
        jqrefItemContentTitle.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        switch (propertyName) {
            case 'graphName':
                // should never change
                this.helpers.graphName = this.graphName;
                break;
            case 'isInEditMode':
                // this changes once after the element is created
                this.helpers.isInEditMode = this.isInEditMode;
                $(this.tbl).find('.ni-plot-legend-box').each(function () {
                    $(this).jqxExpander({ disabled: this.isInEditMode });
                });
                break;
            default:
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-plot-legend', 'HTMLNIPlotLegend');
}(NationalInstruments.HtmlVI.Elements.PlotLegend, NationalInstruments.HtmlVI.Elements.Visual));
