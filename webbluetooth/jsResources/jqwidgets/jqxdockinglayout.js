/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    'use strict';

    $.jqx.jqxWidget('jqxDockingLayout', 'jqxLayout', {});

    $.extend($.jqx._jqxDockingLayout.prototype, {
        defineInstance: function () {
            if (this.base === null) {
                throw new Error('jqxDockingLayout: Missing reference to jqxlayout.js.');
            }

            this.base.dockingLayout = this;

            var settings = {

                // events
                events: ['float', 'dock']
            };
            $.extend(true, this, settings);
        },

        createInstance: function () {
            var that = this;

            if (!that.base.host.jqxWindow) {
                throw new Error('jqxDockingLayout: Missing reference to jqxwindow.js.');
            }

            that._oldIE = $.jqx.browser.msie && $.jqx.browser.version < 9;

            that._addClasses();

            that._createOverlay();
            that._createEdgeOverlays();
        },

        // loads a layout
        loadLayout: function (layout) {
            if (layout !== undefined && $.isEmptyObject(layout) === false) {
                var base = this.base,
                    id = base.element.id;

                if ($('.' + id + 'FloatGroup').length > 0) {
                    $('.' + id + 'FloatGroup').off();
                    $('.' + id + 'FloatGroup').jqxWindow('destroy');
                }

                base.loadLayout(layout);
            }
        },

        // destroys the widget
        destroy: function () {
            var that = this,
                base = that.base,
                id = base.element.id;

            if ($('.' + id + 'FloatGroup').length > 0) {
                $('.' + id + 'FloatGroup').off();
                $('.' + id + 'FloatGroup').jqxWindow('destroy');
            }
            that._removeHandlers();
            base.destroy();
        },

        // dynamically adds a new floatGroup
        addFloatGroup: function (width, height, position, contentType, title, content, initContent) {
            var base = this.base,
                floatGroupObject = { type: 'floatGroup', width: width, height: height, position: position, items: [], programmaticallyAdded: true },
                childObject = { type: contentType, title: title, content: content, initContent: initContent };
            floatGroupObject.items.push(childObject);
            base.layout.push(floatGroupObject);
            base.render();
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

            var result = this.base.host.trigger(event);
            return result;
        },

        // adds the necessary classes to the widget
        _addClasses: function () {
            var base = this.base;
            base.host.addClass(base.toThemeProperty('jqx-docking-layout'));
        },

        // removes event handlers
        _removeHandlers: function () {
            var that = this,
                base = that.base,
                id = base.element.id;

            that.removeHandler($(document), 'mousemove.jqxDockingLayout' + id);
            that.removeHandler(base.host, 'mouseleave.jqxDockingLayout' + id);

            if (base._touchDevice) {
                that.removeHandler($(document), 'touchmove.jqxDockingLayout' + id);
                that.removeHandler($(document), 'touchend.jqxDockingLayout' + id);
            }
        },

        // handles the documentGroup ribbon's _removeByDrag event
        _removeByDragHandler: function (event, current, currentElement, index, drag) {
            if (index === undefined) {
                index = event.args.draggedIndex;
            }
            if (drag === undefined) {
                drag = true;
            }
            if (!currentElement.hasClass('jqx-ribbon')) {
                currentElement = currentElement.find('.jqx-ribbon');
            }

            var that = this,
                documents = current.items,
                currentDocument = documents[index],
                content = current.widget.find('.jqx-ribbon-content-section').eq(index).contents().detach();

            that._createFloatGroup(event, currentDocument.title, content, 'documentGroup', current, currentDocument);

            that.base._closeDocumentPanel(index, documents, current, currentElement, drag);
        },

        // floats a tabbed group
        _floatTabbedGroup: function (current, currentElement, event) {
            var that = this,
                title, selected, content = [],
                ribbon = currentElement.find('.jqx-ribbon');

            for (var i = 0; i < current.items.length; i++) {
                var currentItem = current.items[i],
                    currentContent = ribbon.find('.jqx-ribbon-content-section').eq(i).contents().detach();

                if (currentItem.selected) {
                    title = currentItem.title;
                    selected = i;
                }
                content.push(currentContent);
            }
            that._createFloatGroup(event, title, content, 'tabbedGroup', current, null, selected);
            that.base._close(current);
            if (event) {
                event.target.style.cursor = '';
            }
        },

        // adds event handlers to a tabbed group
        _addTabbedGroupHandlers: function (current, currentElement) {
            var that = this,
                base = that.base,
                id = base.element.id,
                header = currentElement.find('.jqx-layout-window-header'),
                allowDrag = false,
                elementToCheck,
                events = base._touchDevice ? ['touchstart', 'touchend'] : ['mousedown', 'mouseup'];

            function leave(event) {
                if (allowDrag === true && base._clickedToResize !== true) {
                    that._floatTabbedGroup(current, currentElement, event);
                    allowDrag = false;
                }
            }

            that.addHandler(header, events[0] + '.jqxDockingLayout' + id, function (event) {
                if (current.allowDrag !== false) {
                    allowDrag = true;
                    event.target.style.cursor = 'move';

                    if (base._touchDevice) {
                        var touchEventInformation = event.originalEvent.touches[0];
                        elementToCheck = document.elementFromPoint(touchEventInformation.pageX, touchEventInformation.pageY);
                    }
                }
            });

            that.addHandler(header, events[1] + '.jqxDockingLayout' + id, function (event) {
                allowDrag = false;
                event.target.style.cursor = '';
            });

            if (!base._touchDevice) {
                that.addHandler(header, 'mouseleave.jqxDockingLayout' + id, function (event) {
                    leave({ pageX: event.pageX, pageY: event.pageY, target: event.target });
                });
            } else {
                that.addHandler($(document), 'touchmove.jqxDockingLayout' + id, function (event) {
                    if (base._clickedToResize === true) {
                        event.preventDefault();
                    }
                    var touchEventInformation = event.originalEvent.touches[0];
                    if (elementToCheck !== document.elementFromPoint(touchEventInformation.pageX, touchEventInformation.pageY)) {
                        leave({ pageX: touchEventInformation.pageX, pageY: touchEventInformation.pageY, target: elementToCheck });
                    }
                });
            }
        },

        // floats an auto hide group
        _floatAutoHideGroup: function (current, title, content, event) {
            var that = this;
            that._createFloatGroup(event, title, content.detach(), 'autoHideGroup', current, current);
            that.base._close(current);
        },

        // adds event handlers to an auto hide group
        _addAutoHideGroupHandlers: function (current, header, title, content) {
            var that = this,
                base = that.base,
                id = base.element.id,
                allowDrag = false,
                elementToCheck,
                events = base._touchDevice ? ['touchstart', 'touchend'] : ['mousedown', 'mouseup'];

            function leave(event) {
                if (allowDrag === true) {
                    that._floatAutoHideGroup(current, title, content, event);
                    allowDrag = false;
                    event.target.style.cursor = '';
                }
            }

            that.addHandler(header, events[0] + '.jqxDockingLayout' + id, function (event) {
                if (current.parent.allowDrag !== false) {
                    allowDrag = true;
                    event.target.style.cursor = 'move';

                    if (base._touchDevice) {
                        var touchEventInformation = event.originalEvent.touches[0];
                        elementToCheck = document.elementFromPoint(touchEventInformation.pageX, touchEventInformation.pageY);
                    }
                }
            });

            that.addHandler(header, events[1] + '.jqxDockingLayout' + id, function (event) {
                allowDrag = false;
                event.target.style.cursor = '';
            });

            if (!base._touchDevice) {
                that.addHandler(header, 'mouseleave.jqxDockingLayout' + id, function (event) {
                    leave({ pageX: event.pageX, pageY: event.pageY, target: event.target });
                });
            } else {
                that.addHandler($(document), 'touchmove.jqxDockingLayout' + id, function (event) {
                    if (base._clickedToResize === true) {
                        event.preventDefault();
                    }
                    var touchEventInformation = event.originalEvent.touches[0];
                    if (elementToCheck !== document.elementFromPoint(touchEventInformation.pageX, touchEventInformation.pageY)) {
                        leave({ pageX: touchEventInformation.pageX, pageY: touchEventInformation.pageY, target: elementToCheck });
                    }
                });
            }
        },

        // creates a floatGroup
        _createFloatGroup: function (event, title, content, type, groupObject, panelObject, selectedIndex) {
            var that = this,
                base = that.base,
                x, y, width, height, windowContent, ribbon,
                currentElement = $('<div class="' + base.toThemeProperty('jqx-docking-layout-group-floating') + ' ' + base.element.id + 'FloatGroup"><div></div><div></div></div>');

            $('body').append(currentElement);

            if (type === 'documentGroup') {
                if (event) {
                    x = event.args.x;
                    y = event.args.y;
                }
                width = groupObject.widget.width();
                height = groupObject.widget.height();
                windowContent = content;
            } else if (type === 'tabbedGroup') {
                if (event) {
                    x = event.pageX;
                    y = event.pageY;
                }
                width = groupObject.widget.width();
                height = groupObject.widget.height();
                windowContent = '';
                ribbon = $('<div></div>');
                var contentSection = $('<div></div>'),
                    headerSection = $('<ul class="jqx-layout-ribbon-header jqx-layout-ribbon-header-' + (that.rtl ? 'rtl' : 'ltr') + '"></ul>');

                for (var i = 0; i < groupObject.items.length; i++) {
                    var currentItem = groupObject.items[i],
                    itemContentSection = $('<div></div>');

                    var li = $('<li>' + currentItem.title + '</li>');

                    headerSection.append(li);
                    itemContentSection.append(content[i]);
                    contentSection.append(itemContentSection);
                }

                ribbon.append(headerSection);
                ribbon.append(contentSection);
                windowContent = ribbon;
            } else if (type === 'autoHideGroup') {
                if (event) {
                    x = event.pageX;
                    y = event.pageY;
                }
                width = groupObject.parent.widget.find('.jqx-ribbon-content').width();
                height = groupObject.parent.widget.height();
                windowContent = content;
            }

            if (!x && !y) {
                var hostOffset = base.host.offset();
                x = (base.host.width() - width) / 2 + hostOffset.left + 100;
                y = (base.host.height() - height) / 2 + hostOffset.top + 10;
            }

            currentElement.on('moved close', function (event) {
                that._hideOverlays();
                var settings = currentElement.current;
                if (event.type === 'moved') {
                    settings.position.x = event.args.x;
                    settings.position.y = event.args.y;
                    if (settings._overlayGroup) {
                        that._updateOverlayGroup(settings._overlayGroup);
                    }
                    that._clearTextSelection();
                    that._windowCreate = false;
                    that._hideOverlays();
                } else {
                    if (settings._overlayGroup) {
                        settings._overlayGroup.removed = true;
                        that._updateOverlayGroups();
                    }
                    settings.removed = true;
                    base._updateLayout(base.layout);
                }
            });
            currentElement.on('resized', function (event) {
                var settings = currentElement.current,
                    offset = $(this).offset();
                settings.width = event.args.width;
                settings.height = event.args.height;
                settings.position.x = offset.left;
                settings.position.y = offset.top;
                if (settings._overlayGroup) {
                    that._updateOverlayGroup(settings._overlayGroup);
                }
            });

            currentElement.jqxWindow({
                theme: base.theme,
                title: title,
                content: windowContent,
                width: width,
                maxWidth: null,
                height: height,
                maxHeight: null,
                position: { x: x - 100, y: y - 10 },
                closeButtonAction: 'close',
                rtl: base.rtl,
                initContent: function () {
                    var header = currentElement.find('.jqx-window-header'),
                        eventName = base._touchDevice ? 'touchstart' : 'mousedown',
                        parentGroup;

                    if (type === 'autoHideGroup') {
                        parentGroup = groupObject.parent;
                    } else {
                        parentGroup = groupObject;
                    }

                    if (event) {
                        that._draggedWindow = { fromGroup: parentGroup, fromPanel: panelObject, title: title, element: currentElement };

                        header.trigger('mousedown', [x, y]);

                        that._windowDragged = true;
                        that._windowCreate = true;
                        that._interval();

                        if (base.resizable) {
                            base._overlay[0].style.display = 'block';
                        }
                        that._showEdgeOverlays();
                    }

                    header.on(eventName, function () {
                        that._windowDragged = true;
                        if (currentElement.current._overlayGroup) {
                            currentElement.current._overlayGroup.self = true;
                        }

                        that._interval();

                        if (base.resizable) {
                            base._overlay[0].style.display = 'block';
                        }
                        that._draggedWindow = { fromGroup: parentGroup, fromPanel: panelObject, title: title, element: currentElement };
                        that._showEdgeOverlays();
                    });

                    header.on('mouseup', function () {
                        that._hideOverlays();
                        that._windowCreate = false;
                    });

                    if (type === 'tabbedGroup') {
                        ribbon.jqxRibbon({
                            theme: base.theme,
                            width: '100%',
                            height: '100%',
                            position: 'bottom',
                            selectedIndex: selectedIndex,
                            selectionMode: 'click',
                            animationType: 'none',
                            rtl: base.rtl,
                            reorder: true,
                            _removeByDrag: true
                        });

                        ribbon.on('select', function (event) {
                            if (!(event.owner.widgetName && event.owner.widgetName !== 'jqxRibbon')) {
                                var selectedItem = currentElement.current.items[0].items[event.args.selectedIndex];
                                currentElement.jqxWindow('setTitle', selectedItem.title);
                                selectedItem.selected = true;
                            }
                        });
                        ribbon.on('unselect', function (event) {
                            if (!(event.owner.widgetName && event.owner.widgetName !== 'jqxRibbon')) {
                                currentElement.current.items[0].items[event.args.unselectedIndex].selected = false;
                            }
                        });
                        ribbon.on('reorder', function (event) {
                            base._swapPanelsInLayout(currentElement.current.items[0].items, event.args.newIndex, event.args.oldIndex);
                        });
                        ribbon.on('_removeByDrag', function (event) {
                            that._removeByDragHandler(event, currentElement.current.items[0], ribbon);
                            if (currentElement.current.items[0].items.length === 1) {
                                ribbon.jqxRibbon({ _removeByDrag: false });
                            }
                        });
                    }
                }
            });

            // adds the newly created float group to the layout object
            var floatGroupObject = { type: 'floatGroup', parent: { type: 'host' }, widget: currentElement, position: { x: x - 100, y: y - 10 }, index: base.layout.length, width: width, height: height },
                items, itemParent;
            currentElement.current = floatGroupObject;

            if (panelObject) {
                floatGroupObject.items = [];
                base._copyItem(panelObject, floatGroupObject.items);
                items = floatGroupObject.items;
                itemParent = floatGroupObject;
            } else {
                floatGroupObject.items = [{ type: 'tabbedGroup', items: [], parent: floatGroupObject, widget: ribbon}];
                items = floatGroupObject.items[0].items;
                for (var j = 0; j < groupObject.items.length; j++) {
                    base._copyItem(groupObject.items[j], items);
                }
                itemParent = floatGroupObject.items[0];
            }

            for (var k = 0; k < items.length; k++) {
                items[k].parent = itemParent;
            }
            base.layout.push(floatGroupObject);

            that._raiseEvent('0', { item: floatGroupObject }); // 'float' event
            that._trackFloatGroups();
        },

        // IE7/IE8 performance fix
        _interval: function () {
            var that = this;
            if (that._oldIE === true) {
                var overlayWidth = that._overlay.width(),
                    overlayHeight = that._overlay.height();

                that._oldIEInterval = setInterval(function () {
                    that._checkPosition(overlayWidth, overlayHeight);
                    if (that._windowCreate) {
                        that._draggedWindow.element.jqxWindow('move', that._x - 50, that._y - 10);
                    }
                }, 1000);
            }
        },

        // creates the drop-to-group overlay
        _createOverlay: function () {
            var that = this,
                base = that.base,
                id = base.element.id;

            that._overlay = $('<div class="' + base.toThemeProperty('jqx-docking-layout-overlay') + '"></div>');

            var structure = $(
                '<div class="jqx-docking-layout-overlay-section">' +
                    '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-square jqx-docking-layout-overlay-square-invisible') + '">' +
                    '</div>' +
                    '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-square jqx-widget-content jqx-docking-layout-overlay-square-top') + '">' +
                        '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-inner-square') + '">' +
                            '<div class="' + base.toThemeProperty('jqx-widget-header jqx-docking-layout-overlay-inner-square-header') + '">' +
                            '</div>' +
                            '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-inner-square-content') + '">' +
                                '<div class="' + base.toThemeProperty('jqx-widget-content jqx-fill-state-pressed jqx-docking-layout-overlay-highlight jqx-docking-layout-overlay-highlight-top') + '">' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-square jqx-docking-layout-overlay-square-invisible') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="jqx-docking-layout-overlay-section">' +
                    '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-square jqx-widget-content jqx-docking-layout-overlay-square-left') + '">' +
                        '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-inner-square') + '">' +
                            '<div class="' + base.toThemeProperty('jqx-widget-header jqx-docking-layout-overlay-inner-square-header') + '">' +
                            '</div>' +
                            '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-inner-square-content') + '">' +
                                '<div class="' + base.toThemeProperty('jqx-widget-content jqx-fill-state-pressed jqx-docking-layout-overlay-highlight jqx-docking-layout-overlay-highlight-left') + '">' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-square jqx-widget-content jqx-docking-layout-overlay-square-center') + '">' +
                        '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-inner-square') + '">' +
                            '<div class="' + base.toThemeProperty('jqx-widget-header jqx-docking-layout-overlay-inner-square-header') + '">' +
                            '</div>' +
                            '<div class="' + base.toThemeProperty('jqx-widget-content jqx-fill-state-pressed jqx-docking-layout-overlay-inner-square-content jqx-docking-layout-overlay-highlight') + '">' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-square jqx-widget-content jqx-docking-layout-overlay-square-right') + '">' +
                        '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-inner-square') + '">' +
                            '<div class="' + base.toThemeProperty('jqx-widget-header jqx-docking-layout-overlay-inner-square-header') + '">' +
                            '</div>' +
                            '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-inner-square-content') + '">' +
                                '<div class="' + base.toThemeProperty('jqx-widget-content jqx-fill-state-pressed jqx-docking-layout-overlay-highlight jqx-docking-layout-overlay-highlight-right') + '">' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="jqx-docking-layout-overlay-section">' +
                    '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-square jqx-docking-layout-overlay-square-invisible') + '">' +
                    '</div>' +
                    '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-square jqx-widget-content jqx-docking-layout-overlay-square-bottom') + '">' +
                        '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-inner-square') + '">' +
                            '<div class="' + base.toThemeProperty('jqx-widget-header jqx-docking-layout-overlay-inner-square-header') + '">' +
                            '</div>' +
                            '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-inner-square-content') + '">' +
                                '<div class="' + base.toThemeProperty('jqx-widget-content jqx-fill-state-pressed jqx-docking-layout-overlay-highlight jqx-docking-layout-overlay-highlight-bottom') + '">' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-square jqx-docking-layout-overlay-square-invisible') + '">' +
                    '</div>' +
                '</div>'
            );

            that._overlay.append(structure);
            that._overlayCenter = that._overlay.find('.jqx-docking-layout-overlay-square-center').children();
            that._dropOverlay = $('<div class="' + that.toThemeProperty('jqx-docking-layout-drop-overlay') + '"></div>');

            if (!base._ie7) {
                base.host.append(that._overlay, that._dropOverlay);
            } else {
                $('body').append(that._overlay, that._dropOverlay); // IE7 fix
            }

            that._addOverlayHandlers();

            that._squares = that._overlay.find('.jqx-docking-layout-overlay-square-top').add(that._overlay.find('.jqx-docking-layout-overlay-square-left')).add(that._overlay.find('.jqx-docking-layout-overlay-square-center')).add(that._overlay.find('.jqx-docking-layout-overlay-square-right')).add(that._overlay.find('.jqx-docking-layout-overlay-square-bottom'));

            that._sansCenter = that._squares.not('.jqx-docking-layout-overlay-square-center').find('.jqx-docking-layout-overlay-inner-square');

            // event handlers

            var touchedElementFlag = false;

            function displayOverlay(width, height, left, top) {
                that._dropOverlay.show();
                that._dropOverlay[0].style.width = width + 'px';
                that._dropOverlay[0].style.height = height + 'px';
                that._dropOverlay.offset({ left: left, top: top });
            }

            function enter(me) {
                me = me.closest('.jqx-docking-layout-overlay-square');
                touchedElementFlag = me;
                if (me.find('.jqx-docking-layout-overlay-inner-square').hasClass('jqx-fill-state-disabled')) {
                    return;
                }

                var groupWidth = that._dropToGroup.element.width(),
                    groupHeight = that._dropToGroup.element.height(),
                    groupOffset = that._dropToGroup.element.offset();

                if (me.hasClass('jqx-docking-layout-overlay-square-top')) {
                    displayOverlay(groupWidth, groupHeight / 2, groupOffset.left, groupOffset.top);
                } else if (me.hasClass('jqx-docking-layout-overlay-square-left')) {
                    displayOverlay(groupWidth / 2, groupHeight, groupOffset.left, groupOffset.top);
                } else if (me.hasClass('jqx-docking-layout-overlay-square-center') && !that._overlayCenter.hasClass('jqx-docking-layout-square-disabled')) {
                    displayOverlay(groupWidth, groupHeight, groupOffset.left, groupOffset.top);
                } else if (me.hasClass('jqx-docking-layout-overlay-square-right')) {
                    displayOverlay(groupWidth / 2, groupHeight, groupOffset.left + groupWidth / 2, groupOffset.top);
                } else if (me.hasClass('jqx-docking-layout-overlay-square-bottom')) {
                    displayOverlay(groupWidth, groupHeight / 2, groupOffset.left, groupOffset.top + groupHeight / 2);
                } else if (base._touchDevice) {
                    that._dropOverlay.hide();
                    touchedElementFlag = false;
                }
            }

            function up(square) {
                var dropToGroupObject = that._dropToGroup.settings;

                if (square.find('.jqx-docking-layout-overlay-inner-square').hasClass('jqx-fill-state-disabled')) {
                    that._hideOverlays();
                    return;
                }

                if (square.hasClass('jqx-docking-layout-overlay-square-top')) {
                    that._dropHandler(0, 'vertical', 'height', 'top');
                } else if (square.hasClass('jqx-docking-layout-overlay-square-left')) {
                    that._dropHandler(0, 'horizontal', 'width', 'left');
                } else if (square.hasClass('jqx-docking-layout-overlay-square-center')) {
                    var draggedWindowInformation = that._getDraggedWindowInformation(),
                        title = draggedWindowInformation.title,
                        content = draggedWindowInformation.content,
                        ribbon, type;

                    if (dropToGroupObject.type === 'documentGroup') {
                        ribbon = dropToGroupObject.widget;
                        type = 'documentPanel';
                    } else if (dropToGroupObject.type === 'tabbedGroup') {
                        if (dropToGroupObject.parent.type === 'floatGroup') {
                            ribbon = dropToGroupObject.widget;
                        } else {
                            ribbon = dropToGroupObject.widget.find('.jqx-ribbon');
                        }
                        type = 'layoutPanel';
                    }

                    if (dropToGroupObject.type === 'layoutGroup') {
                        that._dropToEmptyLayoutGroup(draggedWindowInformation);
                    } else {
                        for (var j = 0; j < title.length; j++) {
                            ribbon.jqxRibbon('addAt', ribbon.find('.jqx-ribbon-content-section').length, { title: title[j], content: content[j] });
                            var newItemIndex = dropToGroupObject.items.length,
                                itemToAdd = { type: type, title: title[j], parent: dropToGroupObject, index: newItemIndex, detachedContent: draggedWindowInformation.content[j], docked: true };
                            dropToGroupObject.items.push(itemToAdd);
                            base._addRightClickHandler($(ribbon.find('.jqx-ribbon-item')[newItemIndex]), { current: itemToAdd });
                        }
                    }
                    if (dropToGroupObject.parent.type === 'floatGroup') {
                        dropToGroupObject.widget.jqxRibbon({ _removeByDrag: true });
                    }
                    that._clearTextSelection();
                    that._raiseEvent('1', { position: 'center', item: dropToGroupObject }); // 'dock' event                   
                } else if (square.hasClass('jqx-docking-layout-overlay-square-right')) {
                    that._dropHandler(1, 'horizontal', 'width', 'right');
                } else if (square.hasClass('jqx-docking-layout-overlay-square-bottom')) {
                    that._dropHandler(1, 'vertical', 'height', 'bottom');
                }

                that._removeFloatGroupObject(that._draggedWindow.element.current);
                that._draggedWindow.element.remove();
                that._hideOverlays();
            }

            if (!base._touchDevice) {
                that.addHandler(that._squares, 'mouseenter.jqxDockingLayout' + id, function () {
                    enter($(this));
                });

                that.addHandler(that._squares, 'mouseleave.jqxDockingLayout' + id, function () {
                    that._dropOverlay.hide();
                });

                that.addHandler(that._squares, 'mouseup.jqxDockingLayout' + id, function () {
                    up($(this));
                });
            } else {
                that.addHandler($(document), 'touchmove.jqxDockingLayout' + id, function (event) {
                    if (that._windowDragged) {
                        event.preventDefault();
                        var touchEventInformation = event.originalEvent.touches[0],
                            touchedElement = $(document.elementFromPoint(touchEventInformation.pageX, touchEventInformation.pageY));
                        enter(touchedElement);
                    }
                });

                that.addHandler($(document), 'touchend.jqxDockingLayout' + id, function () {
                    if (touchedElementFlag !== false) {
                        up(touchedElementFlag);
                        touchedElementFlag = false;
                    }
                });
            }
        },

        // adds event handlers related to the drop-to-group overlay
        _addOverlayHandlers: function () {
            var that = this,
                overlayWidth = that._overlay.width(),
                overlayHeight = that._overlay.height();

            if (!that.base._touchDevice) {
                that.addHandler($(document), 'mousemove.jqxDockingLayout' + that.base.element.id, function (event) {
                    that._x = event.pageX;
                    that._y = event.pageY;
                    if (that._windowDragged && !that._oldIE) {
                        that._checkPosition(overlayWidth, overlayHeight);
                        if (that._windowCreate) {
                            that._draggedWindow.element.jqxWindow('move', event.pageX - 50, event.pageY - 10);
                        }
                    }
                });
            } else {
                that.addHandler($(document), 'touchmove.jqxDockingLayout' + that.base.element.id, function (event) {
                    var eventData = event.originalEvent.touches[0];
                    that._x = eventData.pageX;
                    that._y = eventData.pageY;
                    if (that._windowDragged && !that._oldIE) {
                        that._checkPosition(overlayWidth, overlayHeight);
                        if (that._windowCreate) {
                            that._draggedWindow.element.jqxWindow('move', eventData.pageX - 50, eventData.pageY - 10);
                        }
                    }
                });
            }
        },

        // checks if the dragged float group is over a group eligible for drop
        _checkPosition: function (overlayWidth, overlayHeight) {
            var that = this,
                base = that.base,
                x = that._x,
                y = that._y;

            for (var i = 0; i < base._overlayGroups.length; i++) {
                var currentGroup = base._overlayGroups[i];
                if (!currentGroup.self) {
                    var width = currentGroup.width,
                        height = currentGroup.height,
                        offset = currentGroup.offset,
                        left = offset.left,
                        top = offset.top;

                    if (x >= left && x <= left + width && y >= top && y <= top + height) {
                        if (((currentGroup.settings.type === 'documentGroup' && that._draggedWindow.fromGroup.type === 'documentGroup') || (currentGroup.settings.type === 'tabbedGroup' && (that._draggedWindow.fromGroup.type === 'tabbedGroup' || that._draggedWindow.fromGroup.type === 'autoHideGroup')) || (currentGroup.settings.type === 'layoutGroup')) && currentGroup.settings.allowDrop !== false) {
                            that._overlayCenter.removeClass(base.toThemeProperty('jqx-fill-state-disabled'));
                        } else {
                            that._overlayCenter.addClass(base.toThemeProperty('jqx-fill-state-disabled'));
                            if (currentGroup.settings.parent.type === 'floatGroup') {
                                return;
                            }
                        }

                        if (currentGroup.settings.parent.type === 'floatGroup') {
                            that._sansCenter.addClass(base.toThemeProperty('jqx-fill-state-disabled'));
                        } else {
                            that._sansCenter.removeClass(base.toThemeProperty('jqx-fill-state-disabled'));
                        }

                        that._overlay[0].style.display = 'block';
                        that._overlay.offset({ left: parseInt(left + width / 2 - overlayWidth / 2, 10), top: parseInt(top + height / 2 - overlayHeight / 2, 10) });
                        that._dropToGroup = currentGroup;
                        return;
                    }
                }
            }

            that._overlay[0].style.display = 'none';
        },

        // handles a drop to the left/right/top/bottom of a group
        _dropHandler: function (indexOffset, orientationCondition, dimension, position) {
            var that = this,
                base = that.base,
                dropToGroup = that._dropToGroup.settings,
                parentGroup = dropToGroup.parent,
                draggedWindowInformation = that._getDraggedWindowInformation(),
                title = draggedWindowInformation.title,
                content = draggedWindowInformation.content,
                groupType = draggedWindowInformation.groupType,
                itemType = draggedWindowInformation.itemType,
                items = [], dropIndex, groupToAdd;

            if (parentGroup.orientation === orientationCondition) {
                dropIndex = dropToGroup.index + indexOffset;
                groupToAdd = { type: groupType, parent: parentGroup };
                groupToAdd[dimension] = that._draggedWindow.element[dimension]();
                for (var i = 0; i < title.length; i++) {
                    items.push({ type: itemType, title: title[i], parent: groupToAdd, prevent: true, selected: that._getFloatGroupItemSelection(i), detachedContent: content[i], docked: true });
                }
                groupToAdd.items = items;

                that._setOptimalDimension(dimension, groupToAdd, dropToGroup);

                parentGroup.items.splice(dropIndex, 0, groupToAdd);
            } else {
                var counterDimension, minDimension;
                if (dimension === 'width') {
                    counterDimension = 'height';
                    minDimension = 'minHeight';
                } else {
                    counterDimension = 'width';
                    minDimension = 'minWidth';
                }

                var newParentGroup = { type: 'layoutGroup', orientation: orientationCondition, parent: dropToGroup.parent, index: dropToGroup.index };
                newParentGroup[counterDimension] = dropToGroup[counterDimension];
                if (dropToGroup[minDimension]) {
                    newParentGroup[minDimension] = dropToGroup[minDimension];
                }

                dropToGroup.parent.items.splice(dropToGroup.index, 1);
                dropToGroup.parent.items.splice(dropToGroup.index, 0, newParentGroup);
                dropToGroup.parent = newParentGroup;

                groupToAdd = { type: groupType, parent: newParentGroup };
                for (var j = 0; j < title.length; j++) {
                    items.push({ type: itemType, title: title[j], parent: groupToAdd, prevent: true, selected: that._getFloatGroupItemSelection(j), detachedContent: content[j], docked: true });
                }
                groupToAdd.items = items;

                delete dropToGroup[counterDimension];
                dropToGroup[dimension] = '50%';
                groupToAdd[dimension] = '50%';

                newParentGroup.items = [dropToGroup];
                newParentGroup.items.splice(0 + indexOffset, 0, groupToAdd);
            }

            base.render();

            var ribbonContentSections = groupToAdd.widget.find('.jqx-ribbon-content-section');
            for (var k = 0; k < ribbonContentSections.length; k++) {
                $(ribbonContentSections[k]).append(content[k]);
            }

            that._clearTextSelection();
            base._raiseEvent('1', { item: dropToGroup }); // 'resize' event
            that._raiseEvent('1', { position: position, item: groupToAdd }); // 'dock' event         
        },

        // sets the optimal width/height of the dropped group and the group it is dropped next to
        _setOptimalDimension: function (dimension, newGroup, neighbourGroup) {
            var that = this,
                minDimension = dimension === 'width' ? 'minWidth' : 'minHeight',
                minimum = neighbourGroup[minDimension] || that.base['minGroup' + dimension.charAt(0).toUpperCase() + dimension.slice(1)],
                availableToMinimum;

            availableToMinimum = parseFloat(neighbourGroup[dimension]) - minimum / neighbourGroup.parent.widget[dimension]() * 100;
            var newGroupPercentageDim = newGroup[dimension] / neighbourGroup.parent.widget[dimension]() * 100;
            if (availableToMinimum < newGroupPercentageDim) {
                newGroup[dimension] = parseFloat(neighbourGroup[dimension]) / 2 + '%';
                neighbourGroup[dimension] = parseFloat(neighbourGroup[dimension]) - parseFloat(newGroup[dimension]) + '%';
                var neighbourGroupPixelDim = parseInt(parseFloat(neighbourGroup[dimension]) / 100 * neighbourGroup.parent.widget[dimension](), 10);
                if (neighbourGroupPixelDim < minimum) {
                    neighbourGroup[minDimension] = neighbourGroupPixelDim;
                }
            } else {
                newGroup[dimension] = newGroupPercentageDim + '%';
                neighbourGroup[dimension] = parseFloat(neighbourGroup[dimension]) - newGroupPercentageDim + '%';
            }
        },

        // handles a drop to an empty layout group
        _dropToEmptyLayoutGroup: function (draggedWindowInformation) {
            var that = this,
                dropToGroupSettings = that._dropToGroup.settings,
                childGroupType = draggedWindowInformation.groupType,
                childGroup = { type: childGroupType, items: [], parent: dropToGroupSettings },
                content = draggedWindowInformation.content;

            if (dropToGroupSettings.orientation === 'horizontal') {
                childGroup.width = '100%';
            } else if (dropToGroupSettings.orientation === 'vertical') {
                childGroup.height = '100%';
            }

            for (var i = 0; i < draggedWindowInformation.title.length; i++) {
                var item = { type: draggedWindowInformation.itemType, title: draggedWindowInformation.title[i], parent: childGroup, prevent: true, selected: that._getFloatGroupItemSelection(i), detachedContent: content[i], docked: true };
                childGroup.items.push(item);
            }

            dropToGroupSettings.items.push(childGroup);
            that.base.render();

            var ribbonContentSections = childGroup.widget.find('.jqx-ribbon-content-section');
            for (var j = 0; j < ribbonContentSections.length; j++) {
                $(ribbonContentSections[j]).append(content[j]);
            }
        },

        // returns true if an item from a float group is selected
        _getFloatGroupItemSelection: function (index) {
            var that = this,
                selected;

            if (that._draggedWindow.fromPanel) {
                selected = true;
            } else {
                selected = that._draggedWindow.element.current.items[0].items[index].selected;
            }

            return selected;
        },

        // creates the drop-to-edge overlays
        _createEdgeOverlays: function () {
            function createStructure(position) {
                var orientation = position === 'left' || position === 'right' ? 'horizontal' : 'vertical',
                    miniWindow =
                        '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-mini-window-edge-' + orientation) + '">' +
                            '<div class="' + base.toThemeProperty('jqx-widget-header jqx-docking-layout-overlay-inner-square-header jqx-docking-layout-overlay-inner-square-header-' + orientation) + '">' +
                            '</div>' +
                            '<div class="' + base.toThemeProperty('jqx-widget-content jqx-fill-state-pressed jqx-docking-layout-overlay-inner-square-content jqx-docking-layout-overlay-inner-square-content-' + orientation) + '">' +
                            '</div>' +
                        '</div>',
                    arrowContainer =
                        '<div class="' + base.toThemeProperty('jqx-docking-layout-overlay-square-edge-arrow-container jqx-docking-layout-overlay-square-edge-arrow-container-' + orientation) + '">' +
                            '<div class="' + base.toThemeProperty('jqx-fill-state-pressed jqx-docking-layout-overlay-square-edge-arrow jqx-docking-layout-overlay-square-edge-arrow-' + position) + '">' +
                            '</div>' +
                        '</div>',
                    elementsInSquare;

                if (position === 'left' || position === 'top') {
                    elementsInSquare = miniWindow + arrowContainer;
                } else {
                    elementsInSquare = arrowContainer + miniWindow;
                }

                var structure = $(
                    '<div class="' + base.toThemeProperty('jqx-widget-content jqx-docking-layout-overlay-square jqx-docking-layout-overlay-square-edge') + '">' +
                        '<div class="' + base.toThemeProperty('jqx-docking-layout-overlay-inner-square-edge') + '">' +
                            elementsInSquare +
                        '</div>' +
                    '</div>'
                );

                return structure;
            }

            var that = this,
                base = that.base;

            that._leftOverlay = createStructure('left');
            that._rightOverlay = createStructure('right');
            that._topOverlay = createStructure('top');
            that._bottomOverlay = createStructure('bottom');
            that._edgeOverlays = that._leftOverlay.add(that._rightOverlay).add(that._topOverlay).add(that._bottomOverlay);

            if (!base._ie7) {
                base.host.append(that._edgeOverlays);
            } else {
                $('body').append(that._edgeOverlays); // IE7 fix
            }

            that._addEdgeOverlaysHandlers();
        },

        // adds event handlers related to the drop-to-edge overlays
        _addEdgeOverlaysHandlers: function () {
            function positionDropOverlay(width, height, left, top) {
                that._dropOverlay.show();
                that._dropOverlay[0].style.width = width;
                that._dropOverlay[0].style.height = height;
                that._dropOverlay.offset({ left: left, top: top });
            }

            var that = this,
                base = that.base,
                id = base.element.id,
                hostOffset,
                touchedEdgeFlag = false;

            function enter(me) {
                hostOffset = base.host.offset();
                me = $(me).closest('.jqx-docking-layout-overlay-square-edge')[0];
                touchedEdgeFlag = me;

                switch (me) {
                    case that._leftOverlay[0]:
                        positionDropOverlay('100px', base.host.height() + 'px', hostOffset.left, hostOffset.top);
                        break;
                    case that._rightOverlay[0]:
                        positionDropOverlay('100px', base.host.height() + 'px', hostOffset.left + base.host.width() - 100, hostOffset.top);
                        break;
                    case that._topOverlay[0]:
                        positionDropOverlay(base.host.width() + 'px', '100px', hostOffset.left, hostOffset.top);
                        break;
                    case that._bottomOverlay[0]:
                        positionDropOverlay(base.host.width() + 'px', '100px', hostOffset.left, hostOffset.top + base.host.height() - 100);
                        break;
                    default:
                        if (base._touchDevice) {
                            touchedEdgeFlag = false;
                        }
                }
            }

            function up(me) {
                switch (me) {
                    case that._leftOverlay[0]:
                        that._dropToEdge('left', 0, 'horizontal', 'width');
                        break;
                    case that._rightOverlay[0]:
                        that._dropToEdge('right', base.layout[0].items.length - 1, 'horizontal', 'width');
                        break;
                    case that._topOverlay[0]:
                        that._dropToEdge('top', 0, 'vertical', 'height');
                        break;
                    case that._bottomOverlay[0]:
                        that._dropToEdge('bottom', base.layout[0].items.length - 1, 'vertical', 'height');
                        break;
                }
            }

            if (!base._touchDevice) {
                that.addHandler(that._edgeOverlays, 'mouseenter.jqxDockingLayout' + id, function () {
                    enter(this);
                });

                that.addHandler(that._edgeOverlays, 'mouseleave.jqxDockingLayout' + id, function () {
                    that._dropOverlay.hide();
                });

                that.addHandler(that._edgeOverlays, 'mouseup.jqxDockingLayout' + id, function () {
                    up(this);
                });
            } else {
                that.addHandler($(document), 'touchmove.jqxDockingLayout' + id, function (event) {
                    if (that._windowDragged) {
                        event.preventDefault();
                        var touchEventInformation = event.originalEvent.touches[0],
                            touchedEdge = $(document.elementFromPoint(touchEventInformation.pageX, touchEventInformation.pageY));
                        enter(touchedEdge);
                    }
                });

                that.addHandler($(document), 'touchend.jqxDockingLayout' + id, function () {
                    if (touchedEdgeFlag !== false) {
                        up(touchedEdgeFlag);
                        touchedEdgeFlag = false;
                    }
                });
            }
        },

        // handles a drop to the left/right/top/bottom edge
        _dropToEdge: function (edge, index, orientationCondition, dimension) {
            var that = this,
                base = that.base,
                rootGroup = base.layout[0],
                draggedWindowInformation = that._getDraggedWindowInformation(),
                title = draggedWindowInformation.title,
                content = draggedWindowInformation.content,
                groupType = draggedWindowInformation.groupType,
                itemType = draggedWindowInformation.itemType,
                items = [], groupToAdd, neighbour;

            that._removeFloatGroupObject(that._draggedWindow.element.current);

            if (rootGroup.orientation === orientationCondition) {
                groupToAdd = { type: groupType, parent: rootGroup };
                groupToAdd[dimension] = that._draggedWindow.element[dimension]();
                for (var i = 0; i < title.length; i++) {
                    items.push({ type: itemType, title: title[i], parent: groupToAdd, prevent: true, selected: that._getFloatGroupItemSelection(i), detachedContent: content[i], docked: true });
                }
                groupToAdd.items = items;

                neighbour = rootGroup.items[index];
                that._setOptimalDimension(dimension, groupToAdd, neighbour);

                if (edge === 'left' || edge === 'top') {
                    rootGroup.items.splice(index, 0, groupToAdd);
                } else {
                    rootGroup.items.push(groupToAdd);
                }
            } else {
                var counterDimension, minDimension;
                if (dimension === 'width') {
                    counterDimension = 'height';
                    minDimension = 'minHeight';
                } else {
                    counterDimension = 'width';
                    minDimension = 'minWidth';
                }

                var newParentGroup = { type: 'layoutGroup', orientation: orientationCondition, parent: rootGroup.parent, index: rootGroup.index };

                groupToAdd = { type: groupType, parent: newParentGroup };
                for (var j = 0; j < title.length; j++) {
                    items.push({ type: itemType, title: title[j], parent: groupToAdd, prevent: true, selected: that._getFloatGroupItemSelection(j), detachedContent: content[j], docked: true });
                }
                groupToAdd.items = items;

                delete rootGroup[counterDimension];
                delete groupToAdd[counterDimension];
                groupToAdd[dimension] = '50%';
                rootGroup[dimension] = '50%';
                rootGroup.parent = newParentGroup;

                if (edge === 'left' || edge === 'top') {
                    newParentGroup.items = [groupToAdd, rootGroup];
                } else {
                    newParentGroup.items = [rootGroup, groupToAdd];
                }

                base.layout[0] = newParentGroup;
                neighbour = rootGroup;
            }

            base.render();

            var ribbonContentSections = groupToAdd.widget.find('.jqx-ribbon-content-section');
            for (var k = 0; k < ribbonContentSections.length; k++) {
                $(ribbonContentSections[k]).append(content[k]);
            }

            that._clearTextSelection();

            base._raiseEvent('1', { item: neighbour }); // 'resize' event
            that._raiseEvent('1', { position: edge + '-edge', item: groupToAdd }); // 'dock' event

            that._draggedWindow.element.remove();
            that._hideOverlays();
        },

        // displays the drop-to-edge overlays
        _showEdgeOverlays: function () {
            var that = this,
                base = that.base,
                hostWidth = base.host.width(),
                hostHeight = base.host.height(),
                hostOffset = base.host.offset(),
                edgeOverlays = $(),
                allowLeft = true, allowRight = true, allowTop = true, allowBottom = true;

            function checkFirstLast(group) {
                if (!group.items || group.items.length === 0) {
                    return;
                }

                var orientation = group.orientation,
                    first = group.items[0],
                    last = group.items[group.items.length - 1];

                if (orientation === 'horizontal') {
                    if (first.type === 'autoHideGroup') {
                        allowLeft = allowLeft && false;
                    } else if (first.type === 'layoutGroup') {
                        checkFirstLast(first);
                    }
                    if (last.type === 'autoHideGroup') {
                        allowRight = allowRight && false;
                    } else if (last.type === 'layoutGroup') {
                        checkFirstLast(last);
                    }
                } else if (orientation === 'vertical') {
                    if (first.type === 'autoHideGroup') {
                        allowTop = allowTop && false;
                    } else if (first.type === 'layoutGroup') {
                        checkFirstLast(first);
                    }
                    if (last.type === 'autoHideGroup') {
                        allowBottom = allowBottom && false;
                    } else if (last.type === 'layoutGroup') {
                        checkFirstLast(last);
                    }
                }
            }

            checkFirstLast(base.layout[0]);

            if (allowLeft) {
                edgeOverlays = edgeOverlays.add(that._leftOverlay);
            }
            if (allowRight) {
                edgeOverlays = edgeOverlays.add(that._rightOverlay);
            }
            if (allowTop) {
                edgeOverlays = edgeOverlays.add(that._topOverlay);
            }
            if (allowBottom) {
                edgeOverlays = edgeOverlays.add(that._bottomOverlay);
            }
            edgeOverlays.show();

            that._leftOverlay.offset({ left: hostOffset.left + 5, top: hostOffset.top + hostHeight / 2 - 20 });
            that._rightOverlay.offset({ left: hostOffset.left + hostWidth - 40, top: hostOffset.top + hostHeight / 2 - 20 });
            that._topOverlay.offset({ left: hostOffset.left + hostWidth / 2 - 20, top: hostOffset.top + 5 });
            that._bottomOverlay.offset({ left: hostOffset.left + hostWidth / 2 - 20, top: hostOffset.top + hostHeight - 40 });
        },

        // resets the _windowDragged flag and hides related overlays
        _hideOverlays: function () {
            var that = this,
                base = that.base;
            that._windowDragged = false;
            if (that._oldIE === true) {
                clearInterval(that._oldIEInterval);
            }
            if (base.resizable) {
                setTimeout(function () {
                    that.base._overlay[0].style.display = 'none';
                }, 0);
            }
            that._overlay.hide();
            that._edgeOverlays.hide();
            that._dropOverlay.hide();
        },

        // returns the title and content sections of the panels in the dragged window
        _getDraggedWindowInformation: function () {
            var that = this, title = [], content = [], groupType, itemType;

            if (that._draggedWindow.fromPanel) {
                title.push(that._draggedWindow.title);
                content.push(that._draggedWindow.element.find('.jqx-window-content').contents().detach());
            } else {
                for (var i = 0; i < that._draggedWindow.element.current.items[0].items.length; i++) {
                    var currentItem = that._draggedWindow.element.current.items[0].items[i];
                    title.push(currentItem.title);
                    content.push(that._draggedWindow.element.find('.jqx-ribbon-content-section').eq(i).contents().detach());
                }
            }

            if (that._draggedWindow.fromGroup.type === 'documentGroup') {
                groupType = 'documentGroup';
                itemType = 'documentPanel';
            } else {
                groupType = 'tabbedGroup';
                itemType = 'layoutPanel';
            }

            return { title: title, content: content, groupType: groupType, itemType: itemType };
        },

        // removes a float group's object from the layout object
        _removeFloatGroupObject: function (groupObject) {
            var base = this.base;
            groupObject.removed = true;
            base._updateLayout(base.layout);
        },

        // adds tabbed groups inside float groups to the _overlayGroups array
        _trackFloatGroups: function () {
            var that = this,
                base = that.base;

            for (var i = 1; i < base.layout.length; i++) {
                var currentFloatGroup = base.layout[i];
                if (currentFloatGroup.items[0].type === 'tabbedGroup') {
                    var element = currentFloatGroup.items[0].widget,
                        overlayGroup = { element: element, width: element.width(), height: element.height(), offset: element.offset(), settings: currentFloatGroup.items[0] };
                    currentFloatGroup._overlayGroup = overlayGroup;
                    base._overlayGroups.push(overlayGroup);
                }
            }
        },

        // updates a stored overlay group
        _updateOverlayGroup: function (overlayGroup) {
            if (overlayGroup) {
                var element = overlayGroup.element;
                overlayGroup.width = element.width();
                overlayGroup.height = element.height();
                overlayGroup.offset = element.offset();
                overlayGroup.self = false;
            }
        },

        // removes unnecessary overlay groups from the _overlayGroup array
        _updateOverlayGroups: function () {
            var overlayGroups = this.base._overlayGroups;
            for (var i = overlayGroups.length - 1; i >= 0; i--) {
                var current = overlayGroups[i];
                if (current.removed === true) {
                    overlayGroups.splice(i, 1);
                }
            }
        },

        // clears text selection after a float group has been docked
        _clearTextSelection: function () {
            try {
                if (document.selection) { // IE?
                    document.selection.empty();
                } else if (window.getSelection) {
                    if (window.getSelection().empty) { // Chrome
                        window.getSelection().empty();
                    } else if (window.getSelection().removeAllRanges) { // Firefox
                        window.getSelection().removeAllRanges();
                    }
                }
            } catch (err) {

            }
        }
    });
})(jqxBaseFramework); //ignore jslint
