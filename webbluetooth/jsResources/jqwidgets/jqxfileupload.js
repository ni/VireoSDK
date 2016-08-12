/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    'use strict';

    $.jqx.jqxWidget('jqxFileUpload', '', {});

    $.extend($.jqx._jqxFileUpload.prototype, {
        defineInstance: function () {
            var settings = {
                // properties
                width: null,
                height: 'auto',
                uploadUrl: '', // a URL string
                fileInputName: '',
                autoUpload: false,
                multipleFilesUpload: true,
                accept: null, // possible values - all allowed values for file input's accept attribute, e.g. 'audio/*', 'video/*', 'image/*', etc.
                browseTemplate: '',
                uploadTemplate: '',
                cancelTemplate: '',
                localization: null, // an object with the following fields: browseButton, uploadButton, cancelButton, uploadFileTooltip, cancelFileTooltip
                renderFiles: null, // callback function
                disabled: false,
                rtl: false,

                // events
                events: ['select', 'remove', 'uploadStart', 'uploadEnd']
            };
            $.extend(true, this, settings);
        },

        createInstance: function () {
            var that = this;

            if (that.host.jqxButton === undefined) {
                throw new Error('jqxFileUpload: Missing reference to jqxbuttons.js');
            }

            that._createFromInput("jqxFileUpload");
            if ($.jqx.browser.msie) {
                if ($.jqx.browser.version < 11) {
                    that._ieOldWebkit = true;
                    if ($.jqx.browser.version < 8) {
                        that._ie7 = true;
                    }
                }
            } else if ($.jqx.browser.webkit) {
                that._ieOldWebkit = true;
            }

            that._fluidWidth = typeof that.width === 'string' && that.width.charAt(that.width.length - 1) === '%';
            that._fluidHeight = typeof that.height === 'string' && that.height.charAt(that.height.length - 1) === '%';

            that._render(true);
        },

        _createFromInput: function (name)
        {
            var that = this;
            if (that.element.nodeName.toLowerCase() == "input")
            {
                that.field = that.element;
                if (that.field.className)
                {
                    that._className = that.field.className;
                }

                var properties = {
                    'title': that.field.title
                };

                if (that.field.id.length)
                {
                    properties.id = that.field.id.replace(/[^\w]/g, '_') + "_" + name;d
                }
                else
                {
                    properties.id = $.jqx.utilities.createId() + "_" + name;
                }
          
                var wrapper = $("<div></div>", properties);
                wrapper[0].style.cssText = that.field.style.cssText;
                if (!that.width)
                {
                    that.width = $(that.field).width();
                }
                if (!that.height)
                {
                    that.height = $(that.field).outerHeight();
                }
                $(that.field).hide().after(wrapper);
                var data = that.host.data();
                that.host = wrapper;
                that.host.data(data);
                that.element = wrapper[0];
                that.element.id = that.field.id;
                that.field.id = properties.id;
                if (that._className)
                {
                    that.host.addClass(that._className);
                    $(that.field).removeClass(that._className);
                }

                if (that.field.tabIndex)
                {
                    var tabIndex = that.field.tabIndex;
                    that.field.tabIndex = -1;
                    that.element.tabIndex = tabIndex;
                }
            }
        },

        // renders the widget
        _render: function (initial) {
            var that = this;

            // sets the width and height of the widget
            that._setSize();

            // adds the necessary classes for the widget
            that._addClasses();

            if (initial === true) {
                // appends all visual elements
                that._appendElements();
            } else {
                // removes event handlers
                that._removeHandlers();
            }

            // adds event handlers
            that._addHandlers();

            // Internet Explorer 7 fix
            if (that._ie7) {
                that._borderAndPadding('width', that.host);
                if (that.height !== 'auto') {
                    that._borderAndPadding('height', that.host);
                }
            }

            $.jqx.utilities.resize(that.host, null, true);

            // fluid size support
            $.jqx.utilities.resize(that.host, function () {
                if (that._fluidWidth) {
                    if (that._ie7) {
                        that.host.css('width', that.width);
                        that._borderAndPadding('width', that.host);
                    }

                    for (var i = 0; i < that._fileRows.length; i++) {
                        var currentFile = that._fileRows[i];
                        var currentFileRow = currentFile.fileRow;
                        if (that._ie7) {
                            currentFileRow.css('width', '100%');
                            that._borderAndPadding('width', currentFileRow);
                        }
                        if (!that.renderFiles) {
                            that._setMaxWidth(currentFile);
                        }
                    }

                    if (that.rtl && that._ieOldWebkit) {
                        for (var j = 0; j < that._forms.length; j++) {
                            var browsePosition = that._browseButton.position();
                            that._forms[j].form.css({ 'left': browsePosition.left, 'top': browsePosition.top });
                        }
                    }
                }

                if (that._ie7 && that._fluidHeight) {
                    that.host.css('height', that.height);
                    that._borderAndPadding('height', that.host);
                }
            });
        },

        // renders the widget
        render: function () {
            this._render(false);
        },

        // refreshes the widget
        refresh: function (initialRefresh) {
            if (initialRefresh !== true) {
                this._render(false);
            }
        },

        // destroys the widget
        destroy: function () {
            var that = this;

            that.cancelAll();
            that._removeHandlers(true);
            that.host.remove();
        },

        // browses for a file
        browse: function () {
            if ($.jqx.browser.msie && $.jqx.browser.version < 10) {
                return;
            }

            var that = this;

            if (that.multipleFilesUpload === true || (that.multipleFilesUpload === false && that._fileRows.length === 0)) {
                that._forms[that._forms.length - 1].fileInput.click();
            }
        },

        // uploads a single file
        _uploadFile: function (fileObject) {
            var that = this;

            if (that._uploadQueue.length === 0) {
                that._uploadQueue.push(fileObject);
            }

            if (!that.renderFiles) {
                fileObject.uploadFile.add(fileObject.cancelFile).hide();
                fileObject.loadingElement.show();
            }
            fileObject.fileInput.attr('name', that.fileInputName);
            that._raiseEvent('2', { file: fileObject.fileName }); // uploadStart event
            fileObject.form[0].submit();
            that._fileObjectToRemove = fileObject;
        },

        // uploads a single file
        uploadFile: function (index) {
            var that = this,
                fileRow = that._fileRows[index];
            if (fileRow !== undefined) {
                that._uploadFile(fileRow);
            }
        },

        // uploads all files
        uploadAll: function () {
            var that = this;

            if (that._fileRows.length > 0) {
                for (var i = that._fileRows.length - 1; i >= 0; i--) {
                    that._uploadQueue.push(that._fileRows[i]);
                }

                that._uploadFile(that._fileRows[0]);
            }
        },

        // cancels a single file
        cancelFile: function (index) {
            var that = this;
            that._removeSingleFileRow(that._fileRows[index]);
        },

        // cancels all files
        cancelAll: function () {
            var that = this;

            if (that._fileRows.length > 0) {
                for (var i = 0; i < that._fileRows.length; i++) {
                    that._removeFileRow(that._fileRows[i]);
                }

                setTimeout(function () {
                    that._browseButton.css('margin-bottom', 0);
                }, 400);
                that._fileRows.length = 0;
                that._hideButtons(true);
            }
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            var id = object.element.id;

            if (key === 'localization') {
                // 'Browse' button
                if (value.browseButton && (!oldvalue || value.browseButton !== oldvalue.browseButton)) {
                    object._browseButton.text(value.browseButton);
                    object._browseButton.jqxButton({ width: 'auto' });
                }
                // 'Upload All' button
                if (value.uploadButton && (!oldvalue || value.uploadButton !== oldvalue.uploadButton)) {
                    object._uploadButton.text(value.uploadButton);
                    object._uploadButton.jqxButton({ width: 'auto' });
                }
                // 'Cancel All' button
                if (value.cancelButton && (!oldvalue || value.cancelButton !== oldvalue.cancelButton)) {
                    object._cancelButton.text(value.cancelButton);
                    object._cancelButton.jqxButton({ width: 'auto' });
                }
                if (!object.renderFiles) {
                    // 'Upload File' tooltip
                    if (value.uploadFileTooltip && (!oldvalue || value.uploadFileTooltip !== oldvalue.uploadFileTooltip)) {
                        $('#' + id + ' .jqx-file-upload-file-upload').attr('title', value.uploadFileTooltip);
                    }
                    // 'Cancel' tooltip
                    if (value.uploadFileTooltip && (!oldvalue || value.cancelFileTooltip !== oldvalue.cancelFileTooltip)) {
                        $('#' + id + ' .jqx-file-upload-file-cancel').attr('title', value.cancelFileTooltip);
                    }
                }

                return;
            }

            if (value !== oldvalue) {
                switch (key) {
                    case 'width':
                        object.host.css('width', value);
                        if (object._ie7) {
                            object._borderAndPadding('width', object.host);
                            for (var l = 0; l < object._fileRows.length; l++) {
                                var currentFileRow = object._fileRows[l].fileRow;
                                currentFileRow.css('width', '100%');
                                object._borderAndPadding('width', currentFileRow);
                            }
                        }

                        object._fluidWidth = typeof value === 'string' && value.charAt(value.length - 1) === '%';
                        return;
                    case 'height':
                        object.host.css('height', value);
                        if (object._ie7) {
                            object._borderAndPadding('height', object.host);
                        }

                        object._fluidHeight = typeof value === 'string' && value.charAt(value - 1) === '%';
                        return;
                    case 'uploadUrl':
                        for (var i = 0; i < object._forms.length; i++) {
                            object._forms[i].form.attr('action', value);
                        }
                        return;
                    case 'accept':
                        for (var j = 0; j < object._forms.length; j++) {
                            object._forms[j].fileInput.attr('accept', value);
                        }
                        return;
                    case 'theme':
                        $.jqx.utilities.setTheme(oldvalue, value, object.host);
                        object._browseButton.jqxButton({ theme: value });
                        object._uploadButton.jqxButton({ theme: value });
                        object._cancelButton.jqxButton({ theme: value });
                        return;
                    case 'browseTemplate':
                        object._browseButton.jqxButton({ template: value });
                        return;
                    case 'uploadTemplate':
                        object._uploadButton.jqxButton({ template: value });
                        return;
                    case 'cancelTemplate':
                        object._cancelButton.jqxButton({ template: value });
                        return;
                    case 'disabled':
                        object._browseButton.jqxButton({ disabled: value });
                        object._uploadButton.jqxButton({ disabled: value });
                        object._cancelButton.jqxButton({ disabled: value });

                        if (value === true) {
                            object.host.addClass(object.toThemeProperty('jqx-fill-state-disabled'));
                        } else {
                            object.host.removeClass(object.toThemeProperty('jqx-fill-state-disabled'));
                        }
                        return;
                    case 'rtl':
                        var applyRtl = function (rtl) {
                            var method = rtl ? 'addClass' : 'removeClass';
                            object._browseButton[method](object.toThemeProperty('jqx-file-upload-button-browse-rtl'));
                            object._cancelButton[method](object.toThemeProperty('jqx-file-upload-button-cancel-rtl'));
                            object._uploadButton[method](object.toThemeProperty('jqx-file-upload-button-upload-rtl'));
                            if ($.jqx.browser.msie && $.jqx.browser.version > 8) {
                                object._uploadButton[method](object.toThemeProperty('jqx-file-upload-button-upload-rtl-ie'));
                            }

                            for (var k = 0; k < object._fileRows.length; k++) {
                                var currentFileObject = object._fileRows[k];
                                currentFileObject.fileNameContainer[method](object.toThemeProperty('jqx-file-upload-file-name-rtl'));
                                currentFileObject.cancelFile[method](object.toThemeProperty('jqx-file-upload-file-cancel-rtl'));
                                currentFileObject.uploadFile[method](object.toThemeProperty('jqx-file-upload-file-upload-rtl'));
                                currentFileObject.loadingElement[method](object.toThemeProperty('jqx-file-upload-loading-element-rtl'));
                            }
                        };

                        applyRtl(value);

                        return;
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

        // sets the width and height of the widget
        _setSize: function () {
            var that = this;

            that.host.css('width', that.width);
            that.host.css('height', that.height);
        },

        // fixes box-sizing in Internet Explorer 7
        _borderAndPadding: function (dimension, element) {
            var borderAndPadding;

            if (dimension === 'width') {
                borderAndPadding = parseInt(element.css('border-left-width'), 10) + parseInt(element.css('border-right-width'), 10) +
                    parseInt(element.css('padding-left'), 10) + parseInt(element.css('padding-right'), 10);
            } else {
                borderAndPadding = parseInt(element.css('border-top-width'), 10) + parseInt(element.css('border-bottom-width'), 10) +
                    parseInt(element.css('padding-top'), 10) + parseInt(element.css('padding-bottom'), 10);
            }
            element.css(dimension, element[dimension]() - borderAndPadding);
        },

        // adds the necessary classes for the widget
        _addClasses: function () {
            var that = this;

            that.host.addClass(that.toThemeProperty('jqx-widget jqx-widget-content jqx-rc-all jqx-file-upload'));
            if (that.disabled === true) {
                that.host.addClass(that.toThemeProperty('jqx-fill-state-disabled'));
            }
        },

        // appends all visual elements
        _appendElements: function () {
            var that = this,
                browseButtonText = 'Browse',
                browseButtonWidth = 90,
                uploadButtonText = 'Upload All',
                uploadButtonWidth = 90,
                cancelButtonText = 'Cancel All',
                cancelButtonWidth = 90;

            var id = that.element.id;

            // localization
            if (that.localization) {
                // 'Browse' button
                if (that.localization.browseButton) {
                    browseButtonText = that.localization.browseButton;
                    browseButtonWidth = 'auto';
                }
                // 'Upload All' button
                if (that.localization.uploadButton) {
                    uploadButtonText = that.localization.uploadButton;
                    uploadButtonWidth = 'auto';
                }
                // 'Cancel All' button
                if (that.localization.cancelButton) {
                    cancelButtonText = that.localization.cancelButton;
                    cancelButtonWidth = 'auto';
                }
            }

            // 'Browse' button
            that._browseButton = $('<button id="' + id + 'BrowseButton" class="' + that.toThemeProperty('jqx-file-upload-button-browse') + '">' + browseButtonText + '</button>');
            that.host.append(that._browseButton);
            that._browseButton.jqxButton({ theme: that.theme, width: browseButtonWidth, template: that.browseTemplate, disabled: that.disabled });
            that._browseButton.after('<div style="clear: both;"></div>');

            that._bottomButtonsContainer = $('<div class="' + that.toThemeProperty('jqx-file-upload-buttons-container') + '"></div>');
            that.host.append(that._bottomButtonsContainer);

            // 'Upload All' button
            that._uploadButton = $('<button id="' + id + 'UploadButton" class="' + that.toThemeProperty('jqx-file-upload-button-upload') + '">' + uploadButtonText + '</button>');
            that._bottomButtonsContainer.append(that._uploadButton);
            that._uploadButton.jqxButton({ theme: that.theme, width: uploadButtonWidth, template: that.uploadTemplate, disabled: that.disabled });

            // 'Cancel All' button
            that._cancelButton = $('<button id="' + id + 'CancelButton" class="' + that.toThemeProperty('jqx-file-upload-button-cancel') + '">' + cancelButtonText + '</button>');
            that._bottomButtonsContainer.append(that._cancelButton);
            that._cancelButton.jqxButton({ theme: that.theme, width: cancelButtonWidth, template: that.cancelTemplate, disabled: that.disabled });

            that._bottomButtonsContainer.after('<div style="clear: both;"></div>');

            if (that.rtl) {
                that._browseButton.addClass(that.toThemeProperty('jqx-file-upload-button-browse-rtl'));
                that._cancelButton.addClass(that.toThemeProperty('jqx-file-upload-button-cancel-rtl'));
                that._uploadButton.addClass(that.toThemeProperty('jqx-file-upload-button-upload-rtl'));
                if ($.jqx.browser.msie && $.jqx.browser.version > 8) {
                    that._uploadButton.addClass(that.toThemeProperty('jqx-file-upload-button-upload-rtl-ie'));
                }
            }

            // upload iframe
            that._uploadIframe = $('<iframe name="' + id + 'Iframe" class="' + that.toThemeProperty('jqx-file-upload-iframe') + '" src=""></iframe>');
            that.host.append(that._uploadIframe);
            that._iframeInitialized = false;

            that._uploadQueue = [];

            that._forms = [];
            that._addFormAndFileInput(); // adds initial form and file input

            that._fileRows = [];
        },

        // adds a new hidden form and file input
        _addFormAndFileInput: function () {
            var that = this;
            var id = that.element.id;

            var form = $('<form class="' + that.toThemeProperty('jqx-file-upload-form') + '" action="' + that.uploadUrl +
                '" target="' + id + 'Iframe" method="post" enctype="multipart/form-data"></form>');
            that.host.append(form);

            var fileInput = $('<input type="file" class="' + that.toThemeProperty('jqx-file-upload-file-input') + '" />');
            if (that.accept) {
                fileInput.attr('accept', that.accept);
            }
            form.append(fileInput);

            if (that._ieOldWebkit) {
                var browsePosition = that._browseButton.position();
                var browseWidth = that._browseButton.outerWidth();
                var browseHeight = that._browseButton.outerHeight();
                var ie7 = that.rtl && that._ie7 ? 12 : 0;
                form.css({ 'left': browsePosition.left - ie7, 'top': browsePosition.top, 'width': browseWidth, 'height': browseHeight });
                form.addClass(that.toThemeProperty('jqx-file-upload-form-ie9'));
                fileInput.addClass(that.toThemeProperty('jqx-file-upload-file-input-ie9'));

                that.addHandler(form, 'mouseenter.jqxFileUpload' + id, function () {
                    that._browseButton.addClass(that.toThemeProperty('jqx-fill-state-hover'));
                });
                that.addHandler(form, 'mouseleave.jqxFileUpload' + id, function () {
                    that._browseButton.removeClass(that.toThemeProperty('jqx-fill-state-hover'));
                });
                that.addHandler(form, 'mousedown.jqxFileUpload' + id, function () {
                    that._browseButton.addClass(that.toThemeProperty('jqx-fill-state-pressed'));
                });
                that.addHandler($(document), 'mouseup.jqxFileUpload' + id, function () {
                    if (that._browseButton.hasClass('jqx-fill-state-pressed')) {
                        that._browseButton.removeClass(that.toThemeProperty('jqx-fill-state-pressed'));
                    }
                });
            }

            that.addHandler(fileInput, 'change.jqxFileUpload' + id, function () {
                var value = this.value,
                    fileSize;

                if (!$.jqx.browser.mozilla) {
                    if (value.indexOf('fakepath') !== -1) {
                        value = value.slice(12);
                    } else {
                        value = value.slice(value.lastIndexOf('\\') + 1);
                    }
                }

                // file size
                if ($.jqx.browser.msie && $.jqx.browser.version < 10) {
                    fileSize = 'IE9 and earlier do not support getting the file size.';
                } else {
                    fileSize = this.files[0].size;
                }

                var fileObject = that._addFileRow(value, form, fileInput, fileSize);
                if (that._fileRows.length === 1) {
                    that._browseButton.css('margin-bottom', '10px');
                    that._hideButtons(false);
                }
                if (that._ieOldWebkit) {
                    that.removeHandler(form, 'mouseenter.jqxFileUpload' + id);
                    that.removeHandler(form, 'mouseleave.jqxFileUpload' + id);
                    that.removeHandler(form, 'mousedown.jqxFileUpload' + id);
                }
                that._addFormAndFileInput();
                that.removeHandler(fileInput, 'change.jqxFileUpload' + id);
                if (that.autoUpload === true) {
                    that._uploadFile(fileObject);
                }
            });

            if (that._ieOldWebkit === true) {
                that.addHandler(fileInput, 'click.jqxFileUpload' + id, function (event) {
                    if (that.multipleFilesUpload === false && that._fileRows.length > 0) {
                        event.preventDefault();
                    }
                });
            }

            that._forms.push({ form: form, fileInput: fileInput });
        },

        // adds a file row
        _addFileRow: function (fileNameText, form, fileInput, fileSize) {
            var that = this,
                fileRow,
                fileNameContainer,
                loadingElement,
                cancelFile,
                uploadFile,
                cancelTooltip = 'Cancel',
                uploadTooltip = 'Upload File';

            // file row
            fileRow = $('<div class="' + that.toThemeProperty('jqx-widget-content jqx-rc-all jqx-file-upload-file-row') + '"></div>');
            if (that._fileRows.length === 0) {
                that._browseButton.after(fileRow);
            } else {
                that._fileRows[that._fileRows.length - 1].fileRow.after(fileRow);
            }

            if (!that.renderFiles) {
                fileNameContainer = $('<div class="' + that.toThemeProperty('jqx-widget-header jqx-rc-all jqx-file-upload-file-name') + '">' + fileNameText + '</div>');
                fileRow.append(fileNameContainer);

                // localization
                if (that.localization) {
                    // 'Cancel' tooltip
                    if (that.localization.cancelFileTooltip) {
                        cancelTooltip = that.localization.cancelFileTooltip;
                    }
                    // 'Upload File' tooltip
                    if (that.localization.uploadFileTooltip) {
                        uploadTooltip = that.localization.uploadFileTooltip;
                    }
                }

                cancelFile = $('<div class="' + that.toThemeProperty('jqx-widget-header jqx-rc-all jqx-file-upload-file-cancel') + '" title="' + cancelTooltip +
                '"><div class="' + that.toThemeProperty('jqx-icon-close jqx-file-upload-icon') + '"></div></div>');
                fileRow.append(cancelFile);

                uploadFile = $('<div class="' + that.toThemeProperty('jqx-widget-header jqx-rc-all jqx-file-upload-file-upload') + '" title="' + uploadTooltip +
                '"><div class="' + that.toThemeProperty('jqx-icon-arrow-up jqx-file-upload-icon jqx-file-upload-icon-upload') + '"></div></div>');
                fileRow.append(uploadFile);

                loadingElement = $('<div class="' + that.toThemeProperty('jqx-file-upload-loading-element') + '"></div>');
                fileRow.append(loadingElement);

                if (that.rtl) {
                    fileNameContainer.addClass(that.toThemeProperty('jqx-file-upload-file-name-rtl'));
                    cancelFile.addClass(that.toThemeProperty('jqx-file-upload-file-cancel-rtl'));
                    uploadFile.addClass(that.toThemeProperty('jqx-file-upload-file-upload-rtl'));
                    loadingElement.addClass(that.toThemeProperty('jqx-file-upload-loading-element-rtl'));
                }

                that._setMaxWidth({ fileNameContainer: fileNameContainer, uploadFile: uploadFile, cancelFile: cancelFile });
            } else {
                fileRow.html(that.renderFiles(fileNameText));
            }

            // Internet Explorer 7 fix
            if (that._ie7) {
                that._borderAndPadding('width', fileRow);
                that._borderAndPadding('height', fileRow);
                if (!that.renderFiles) {
                    that._borderAndPadding('height', fileNameContainer);
                    that._borderAndPadding('height', uploadFile);
                    that._borderAndPadding('height', cancelFile);
                }
            }

            var fileObject = {
                fileRow: fileRow,
                fileNameContainer: fileNameContainer,
                fileName: fileNameText,
                uploadFile: uploadFile,
                cancelFile: cancelFile,
                loadingElement: loadingElement,
                form: form,
                fileInput: fileInput,
                index: that._fileRows.length
            };

            that._addFileHandlers(fileObject);

            that._fileRows.push(fileObject);

            that._raiseEvent('0', { file: fileNameText, size: fileSize }); // select event

            return fileObject;
        },

        // sets the max-width of a file name container
        _setMaxWidth: function (fileObject) {
            var that = this;
            var buttonsWidth = fileObject.cancelFile.outerWidth(true) + fileObject.uploadFile.outerWidth(true);
            var ie7Px = that._ie7 ? 6 : 0;
            var maxWidth = that.host.width() - parseInt(that.host.css('padding-left'), 10) - parseInt(that.host.css('padding-right'), 10) - buttonsWidth - ie7Px - 7;
            fileObject.fileNameContainer.css('max-width', maxWidth);
        },

        // adds event handlers for file row elements
        _addFileHandlers: function (fileObject) {
            var that = this;
            if (!that.renderFiles) {
                var id = that.element.id;

                that.addHandler(fileObject.uploadFile, 'mouseenter.jqxFileUpload' + id, function () {
                    if (that.disabled === false) {
                        fileObject.uploadFile.addClass(that.toThemeProperty('jqx-fill-state-hover'));
                    }
                });

                that.addHandler(fileObject.uploadFile, 'mouseleave.jqxFileUpload' + id, function () {
                    if (that.disabled === false) {
                        fileObject.uploadFile.removeClass(that.toThemeProperty('jqx-fill-state-hover'));
                    }
                });

                that.addHandler(fileObject.uploadFile, 'click.jqxFileUpload' + id, function () {
                    if (that.disabled === false) {
                        that._uploadFile(fileObject);
                    }
                });

                that.addHandler(fileObject.cancelFile, 'mouseenter.jqxFileUpload' + id, function () {
                    if (that.disabled === false) {
                        fileObject.cancelFile.addClass(that.toThemeProperty('jqx-fill-state-hover'));
                    }
                });

                that.addHandler(fileObject.cancelFile, 'mouseleave.jqxFileUpload' + id, function () {
                    if (that.disabled === false) {
                        fileObject.cancelFile.removeClass(that.toThemeProperty('jqx-fill-state-hover'));
                    }
                });

                that.addHandler(fileObject.cancelFile, 'click.jqxFileUpload' + id, function () {
                    if (that.disabled === false) {
                        that._removeSingleFileRow(fileObject);
                    }
                });
            }
        },

        // removes a single file row along with its respective hidden form and file input
        _removeSingleFileRow: function (fileObject) {
            var that = this;

            that._removeFileRow(fileObject);

            that._fileRows.splice(fileObject.index, 1);

            if (that._fileRows.length === 0) {
                setTimeout(function () {
                    that._browseButton.css('margin-bottom', 0);
                }, 400);
                that._hideButtons(true);
            } else {
                for (var i = 0; i < that._fileRows.length; i++) {
                    that._fileRows[i].index = i;
                }
            }
        },

        // removes a file row along with its respective hidden form and file input
        _removeFileRow: function (fileObject) {
            var that = this;
            var id = that.element.id;

            if (!that.renderFiles) {
                that.removeHandler(fileObject.uploadFile, 'mouseenter.jqxFileUpload' + id);
                that.removeHandler(fileObject.uploadFile, 'mouseleave.jqxFileUpload' + id);
                that.removeHandler(fileObject.uploadFile, 'click.jqxFileUpload' + id);
                that.removeHandler(fileObject.cancelFile, 'mouseenter.jqxFileUpload' + id);
                that.removeHandler(fileObject.cancelFile, 'mouseleave.jqxFileUpload' + id);
                that.removeHandler(fileObject.cancelFile, 'click.jqxFileUpload' + id);
            }

            fileObject.fileRow.fadeOut(function () {
                fileObject.fileRow.remove();
                fileObject.form.remove();
            });

            that._raiseEvent('1', { file: fileObject.fileName }); // remove event
        },

        // hides or shows the 'Upload All' and 'Cancel All' buttons
        _hideButtons: function (hide) {
            var that = this;

            if (hide === true) {
                that._bottomButtonsContainer.fadeOut();
            } else {
                that._bottomButtonsContainer.fadeIn();
            }
        },

        // adds event handlers
        _addHandlers: function () {
            var that = this;
            var id = that.element.id;

            if (!that._ieOldWebkit) {
                that.addHandler(that._browseButton, 'click.jqxFileUpload' + id, function () {
                    that.browse();
                });
            }
            that.addHandler(that._uploadButton, 'click.jqxFileUpload' + id, function () {
                that.uploadAll();
            });
            that.addHandler(that._cancelButton, 'click.jqxFileUpload' + id, function () {
                that.cancelAll();
            });
            that.addHandler(that._uploadIframe, 'load.jqxFileUpload' + id, function () {
                if ($.jqx.browser.chrome || $.jqx.browser.webkit) {
                    that._iframeInitialized = true;
                }

                if (that._iframeInitialized === false) {
                    that._iframeInitialized = true;
                } else {
                    var response = that._uploadIframe.contents().find('body').html();
                    that._raiseEvent('3', { file: that._uploadQueue[that._uploadQueue.length - 1].fileName, response: response }); // uploadEnd event
                    if (that._fileObjectToRemove) {
                        that._removeSingleFileRow(that._fileObjectToRemove);
                        that._fileObjectToRemove = null;
                    }

                    that._uploadQueue.pop();
                    if (that._uploadQueue.length > 0) {
                        that._uploadFile(that._uploadQueue[that._uploadQueue.length - 1]);
                    }
                }
            });
        },

        // removes event handlers
        _removeHandlers: function (destroy) {
            var that = this;
            var id = that.element.id;

            that.removeHandler(that._browseButton, 'click.jqxFileUpload' + id);
            that.removeHandler(that._uploadButton, 'click.jqxFileUpload' + id);
            that.removeHandler(that._cancelButton, 'click.jqxFileUpload' + id);
            that.removeHandler(that._uploadIframe, 'load.jqxFileUpload' + id);

            if (destroy === true) {
                var lastForm = that._forms[that._forms.length - 1];
                that.removeHandler(lastForm.fileInput, 'change.jqxFileUpload' + id);

                if (that._ieOldWebkit) {
                    that.removeHandler(lastForm.form, 'mouseenter.jqxFileUpload' + id);
                    that.removeHandler(lastForm.form, 'mouseleave.jqxFileUpload' + id);
                    that.removeHandler(lastForm.form, 'mousedown.jqxFileUpload' + id);
                    that.removeHandler($('body'), 'mouseup.jqxFileUpload' + id);
                }
            }
        }
    });
})(jqxBaseFramework);
