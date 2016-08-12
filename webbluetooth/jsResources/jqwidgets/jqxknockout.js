/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

try {
    (function ($, ko) {
        ko.jqwidgets = ko.jqwidgets || {};

        ko.jqwidgets.knockout = function (settings) {
            var me = this;
            var binding = {},
            name = settings.name;

            binding.init = function (element, valueAccessor, allBindingAccessor, viewModel) {
                var unwrappedValue = ko.utils.unwrapObservable(valueAccessor());
                var modelOptions = ko.toJS(unwrappedValue);

                if (settings['reset']) {
                    settings['reset']();
                }
                if ($.data(element)[name] == undefined) {
                    var options = [];
                    $(element)[name]();
                    widget = $.data(element)[name].instance;
                    $.each(settings, function (name, value) {
                        if (widget.hasOwnProperty(name) && modelOptions.hasOwnProperty(name)) {
                            if (!widget["koupdating"]) {
                                widget["koupdatingFromObservable"] = true;
                                try {
                                    var serialized = false;
                                    if (settings.serialize) {
                                        if (settings.serialize(widget, name)) {
                                            if (ko.toJSON(modelOptions[name]) != ko.toJSON(settings.serialize(widget, name))) {
                                                settings.setProperty(widget, name, widget[name], modelOptions[name]);
                                            }
                                            serialized = true;
                                        }
                                    }

                                    if (!serialized) {
                                        if (ko.toJSON(modelOptions[name]) != ko.toJSON(widget[name])) {
                                            settings.setProperty(widget, name, widget[name], modelOptions[name]);
                                        }
                                    }
                                }
                                catch (error) {
                                    settings.setProperty(widget, name, widget[name], modelOptions[name]);
                                }
                                options[name] = name;
                                widget["koupdatingFromObservable"] = false;
                            }
                        }
                    });
                    var widgetSettings = {};
                    $.each(modelOptions, function (name, value) {
                        if (options[name] == undefined) {
                            widgetSettings[name] = modelOptions[name];
                        }
                    });
                    widget.host[name](widgetSettings);
                }
                widget = $.data(element)[name].instance;
                widget["koupdatingFromObservable"] = false;
                widget["koupdating"] = false;

                if (settings.events) {
                    $.each(settings.events, function () {
                        var eventName = this;
                        $(element).on(eventName + '.' + element.id, function (event) {
                            widget = $.data(element)[name].instance;
                            if (!widget["koupdatingFromObservable"]) {
                                var widgetToUpdate = widget;
                                widgetToUpdate["koupdating"] = true;
                                var val = valueAccessor();
                                var property = settings.getProperty(widget, event, eventName, unwrappedValue);
                                if (property != undefined) {
                                    if (val.hasOwnProperty(property.name) && $.isFunction(val[property.name])) {
                                        if (ko.isObservable(val[property.name]) && val[property.name].push) {
                                            valueAccessor(property.value);
                                        }
                                        else {
                                            val[property.name](property.value);
                                        }
                                    }
                                    else if (val[property.name]) {
                                        valueAccessor(property.value);
                                    }
                                }
                                widgetToUpdate["koupdating"] = false;
                            }
                        });
                    });
                }
            };

            binding.update = function (element, valueAccessor, allBindingAccessor, viewModel, bindingContext) {
                var unwrappedValue = ko.utils.unwrapObservable(valueAccessor());
                var modelOptions = ko.toJS(unwrappedValue);
                widget = $.data(element)[name].instance;
                if (widget["koupdating"])
                    return;

                $.each(settings, function (name, value) {
                    if (widget.hasOwnProperty(name) && modelOptions.hasOwnProperty(name)) {
                        if (!widget["koupdating"]) {
                            widget["koupdatingFromObservable"] = true;
                            var serialized = false;
                            if (settings.serialize) {
                                if (settings.serialize(widget, name)) {
                                    if (ko.toJSON(modelOptions[name]) != ko.toJSON(settings.serialize(widget, name))) {
                                        settings.setProperty(widget, name, widget[name], modelOptions[name]);
                                    }
                                    serialized = true;
                                }
                            }

                            if (!serialized) {
                                if (ko.toJSON(modelOptions[name]) != ko.toJSON(widget[name])) {
                                    settings.setProperty(widget, name, widget[name], modelOptions[name]);
                                }
                            }
                            widget["koupdatingFromObservable"] = false;
                        }
                    }
                });
            };

            ko.bindingHandlers[settings.name] = binding;
        };

        // jqxGauge
        var jqxGauge = new ko.jqwidgets.knockout({
            name: "jqxGauge",
            disabled: false,
            min: 0,
            max: 220,
            value: 0,
            reset: function () {
                this.value = 0;
                this.max = 220;
                this.min = 0;
                this.disabled = false;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'disabled') {
                    object.host.jqxGauge({ disabled: newValue });
                }
                if (key == 'min') {
                    object.host.jqxGauge({ min: newValue });
                }
                if (key == 'max') {
                    object.host.jqxGauge({ max: newValue });
                }
                if (key == 'value') {
                    object.host.jqxGauge({ value: newValue });
                }
            }
        });

        // jqxLinearGauge
        var jqxLinearGauge = new ko.jqwidgets.knockout({
            name: "jqxLinearGauge",
            disabled: false,
            min: 0,
            max: 220,
            value: 0,
            reset: function () {
                this.value = 0;
                this.max = 220;
                this.min = 0;
                this.disabled = false;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'disabled') {
                    object.host.jqxLinearGauge({ disabled: newValue });
                }
                if (key == 'min') {
                    object.host.jqxLinearGauge({ min: newValue });
                }
                if (key == 'max') {
                    object.host.jqxLinearGauge({ max: newValue });
                }
                if (key == 'value') {
                    object.host.jqxLinearGauge({ value: newValue });
                }
            }
        });

        // jqxSlider
        var jqxSlider = new ko.jqwidgets.knockout({
            name: "jqxSlider",
            disabled: false,
            min: 0,
            max: 10,
            value: 0,
            reset: function () {
                this.value = 0;
                this.max = 10;
                this.min = 0;
                this.disabled = false;
            },
            events: ['change'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'change') {
                    return { name: "value", value: event.args.value };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'disabled') {
                    object.host.jqxSlider({ disabled: newValue });
                }
                if (key == 'min') {
                    object.host.jqxSlider({ min: parseFloat(newValue) });
                }
                if (key == 'max') {
                    object.host.jqxSlider({ max: parseFloat(newValue) });
                }
                if (key == 'value') {
                    object.host.jqxSlider({ value: parseFloat(newValue) });
                }
            }
        });

        // jqxScrollBar
        var jqxScrollBar = new ko.jqwidgets.knockout({
            name: "jqxScrollBar",
            disabled: false,
            min: 0,
            max: 10,
            value: 0,
            reset: function () {
                this.value = 0;
                this.max = 10;
                this.min = 0;
                this.disabled = false;
            },
            events: ['valueChanged'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'valueChanged') {
                    return { name: "value", value: parseInt(event.currentValue) };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'disabled') {
                    object.host.jqxScrollBar({ disabled: newValue });
                }
                if (key == 'min') {
                    object.host.jqxScrollBar({ min: parseFloat(newValue) });
                }
                if (key == 'max') {
                    object.host.jqxScrollBar({ max: parseFloat(newValue) });
                }
                if (key == 'value') {
                    object.host.jqxScrollBar({ value: parseFloat(newValue) });
                }
            }
        });

        // jqxProgressBar
        var jqxProgressBar = new ko.jqwidgets.knockout({
            name: "jqxProgressBar",
            disabled: false,
            value: 0,
            reset: function () {
                this.value = 0;
                this.disabled = false;
            },
            events: ['valueChanged'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'valueChanged') {
                    return { name: "value", value: parseInt(event.currentValue) };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'disabled') {
                    object.host.jqxProgressBar({ disabled: newValue });
                }
                if (key == 'value') {
                    object.host.jqxProgressBar({ value: parseFloat(newValue) });
                }
            }
        });
        // jqxButton
        var jqxButton = new ko.jqwidgets.knockout({
            name: "jqxButton",
            disabled: false,
            reset: function () {
                this.disabled = false;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'disabled') {
                    object.host.jqxButton({ disabled: newValue });
                }
            }
        });

        // jqxCheckBox
        var jqxCheckBox = new ko.jqwidgets.knockout({
            name: "jqxCheckBox",
            checked: false,
            disabled: false,
            reset: function () {
                this.checked = false;
                this.disabled = false;
            },
            events: ['change'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'change') {
                    return { name: "checked", value: event.args.checked };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'disabled') {
                    object.host.jqxCheckBox({ disabled: newValue });
                }
                if (key == 'checked') {
                    if (value != newValue) {
                        object.host.jqxCheckBox({ checked: newValue });
                    }
                }
            }
        });

        // jqxRadioButton
        var jqxRadioButton = new ko.jqwidgets.knockout({
            name: "jqxRadioButton",
            checked: false,
            disabled: false,
            reset: function () {
                this.checked = false;
                this.disabled = false;
            },
            events: ['change'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'change') {
                    return { name: "checked", value: event.args.checked };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'disabled') {
                    object.host.jqxRadioButton({ disabled: newValue });
                }
                if (key == 'checked') {
                    if (value != newValue) {
                        object.host.jqxRadioButton({ checked: newValue });
                    }
                }
            }
        });

        // jqxDateTimeInput
        var jqxDateTimeInput = new ko.jqwidgets.knockout({
            name: "jqxDateTimeInput",
            value: null,
            disabled: false,
            reset: function () {
                this.value = null;
                this.disabled = false;
            },
            events: ['valueChanged'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'valueChanged') {
                    return { name: "value", value: event.args.date };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'value') {
                    object.setDate(newValue);
                }
                if (key == 'disabled') {
                    object.host.jqxDateTimeInput({ disabled: newValue });
                }
            }
        });

        // jqxCalendar
        var jqxCalendar = new ko.jqwidgets.knockout({
            name: "jqxCalendar",
            value: null,
            disabled: false,
            reset: function () {
                this.value = null;
                this.disabled = false;
            },
            events: ['valueChanged'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'valueChanged') {
                    return { name: "value", value: event.args.date };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'value') {
                    object.setDate(newValue);
                }
                if (key == 'disabled') {
                    object.host.jqxCalendar({ disabled: newValue });
                }
            }
        });

        // jqxNumberInput
        var jqxNumberInput = new ko.jqwidgets.knockout({
            name: "jqxNumberInput",
            value: null,
            events: ['valueChanged'],
            disabled: false,
            reset: function () {
                this.value = null;
                this.disabled = false;
            },
            getProperty: function (object, event, eventName) {
                if (eventName == 'valueChanged') {
                    return { name: "value", value: object.val() };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'value') {
                    object.host.jqxNumberInput('val', newValue);
                }
                if (key == 'disabled') {
                    object.host.jqxNumberInput({ disabled: newValue });
                }
            }
        });

        // jqxMaskedInput
        var jqxMaskedInput = new ko.jqwidgets.knockout({
            name: "jqxMaskedInput",
            value: null,
            events: ['valueChanged'],
            disabled: false,
            reset: function () {
                this.value = null;
                this.disabled = false;
            },
            getProperty: function (object, event, eventName) {
                if (eventName == 'valueChanged') {
                    return { name: "value", value: object.val() };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'value') {
                    object.host.jqxMaskedInput('val', newValue);
                }
                if (key == 'disabled') {
                    object.host.jqxMaskedInput({ disabled: newValue });
                }
            }
        });

        // jqxListBox
        var jqxListBox = new ko.jqwidgets.knockout({
            name: "jqxListBox",
            source: null,
            disabled: false,
            selectedIndex: -1,
            reset: function () {
                this.disabled = false;
                this.selectedIndex = -1;
                this.source = null;
            },
            events: ['change'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'change') {
                    this.selectedIndex = object.selectedIndex;
                    return { name: 'selectedIndex', value: object.selectedIndex };
                }

            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    object.source = newValue;
                    object.refresh();
                }
                if (key == 'disabled') {
                    object.disabled = newValue;
                    object._renderItems();
                }
                if (key == 'selectedIndex') {
                    var disabled = object.disabled;
                    object.disabled = false;
                    object.selectIndex(newValue);
                    object.disabled = disabled;
                    if (disabled) object._renderItems();
                }
            }
        });
        //jqxDropDownList
        var jqxDropDownList = new ko.jqwidgets.knockout({
            name: "jqxDropDownList",
            source: null,
            disabled: false,
            selectedIndex: -1,
            reset: function () {
                this.disabled = false;
                this.selectedIndex = -1;
                this.source = null;
            },
            events: ['change'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'change') {
                    return { name: 'selectedIndex', value: object.selectedIndex };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    object.host.jqxDropDownList({ source: newValue });
                }
                if (key == 'disabled') {
                    object.host.jqxDropDownList({ disabled: newValue });
                }
                if (key == 'selectedIndex') {
                    object.host.jqxDropDownList({ selectedIndex: newValue });
                }
            }
        });

        //jqxComboBox
        var jqxComboBox = new ko.jqwidgets.knockout({
            name: "jqxComboBox",
            source: null,
            disabled: false,
            selectedIndex: -1,
            reset: function () {
                this.disabled = false;
                this.selectedIndex = -1;
                this.source = null;
            },
            events: ['change'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'change') {
                    return { name: 'selectedIndex', value: object.selectedIndex };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    object.host.jqxComboBox({ source: newValue });
                }
                if (key == 'disabled') {
                    object.host.jqxComboBox({ disabled: newValue });
                }
                if (key == 'selectedIndex') {
                    object.host.jqxComboBox({ selectedIndex: newValue });
                }
            }
        });

       
        //jqxInput
        var jqxInput = new ko.jqwidgets.knockout({
            name: "jqxInput",
            source: null,
            disabled: false,
            value: "",
            reset: function () {
                this.disabled = false;
                this.source = null;
            },
            events: ['change'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'change') {
                    return { name: 'value', value: object.host.val() };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    object.host.jqxInput({ source: newValue });
                }
                if (key == 'disabled') {
                    object.host.jqxInput({ disabled: newValue });
                }
                if (key == 'value') {
                    object.host.jqxInput({ value: newValue });
                }
            }
        });

        //jqxComplexInput
        var jqxComplexInput = new ko.jqwidgets.knockout({
            name: "jqxComplexInput",
            source: null,
            disabled: false,
            value: "",
            reset: function () {
                this.disabled = false;
                this.source = null;
            },
            events: ['change'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'change') {
                    return { name: 'value', value: object.host.val() };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    object.host.jqxComplexInput({ source: newValue });
                }
                if (key == 'disabled') {
                    object.host.jqxComplexInput({ disabled: newValue });
                }
                if (key == 'value') {
                    object.host.jqxComplexInput({ value: newValue });
                }
            }
        });
        //jqxInput
        var jqxFormattedInput = new ko.jqwidgets.knockout({
            name: "jqxFormattedInput",
            source: null,
            disabled: false,
            value: "",
            reset: function () {
                this.disabled = false;
                this.source = null;
            },
            events: ['change'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'change') {
                    return { name: 'value', value: object.host.val() };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    object.host.jqxFormattedInput({ source: newValue });
                }
                if (key == 'disabled') {
                    object.host.jqxFormattedInput({ disabled: newValue });
                }
                if (key == 'value') {
                    object.host.jqxFormattedInput({ value: newValue });
                }
            }
        });
        //jqxInput
        var jqxPasswordInput = new ko.jqwidgets.knockout({
            name: "jqxPasswordInput",
            source: null,
            disabled: false,
            value: "",
            reset: function () {
                this.disabled = false;
                this.source = null;
            },
            events: ['change'],
            getProperty: function (object, event, eventName) {
                if (eventName == 'change') {
                    return { name: 'value', value: object.host.val() };
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    object.host.jqxPasswordInput({ source: newValue });
                }
                if (key == 'disabled') {
                    object.host.jqxPasswordInput({ disabled: newValue });
                }
                if (key == 'value') {
                    object.host.jqxPasswordInput({ value: newValue });
                }
            }
        });
        //jqxTree
        var jqxTree = new ko.jqwidgets.knockout({
            name: "jqxTree",
            source: null,
            disabled: false,
            reset: function () {
                this.disabled = false;
                this.source = null;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    object.host.jqxTree({ source: newValue });
                }
                if (key == 'disabled') {
                    object.host.jqxTree({ disabled: newValue });
                }
            }
        });

        //jqxTabs
        var jqxTabs = new ko.jqwidgets.knockout({
            name: "jqxTabs",
            disabled: false,
            reset: function () {
                this.disabled = false;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'disabled') {
                    object.host.jqxTabs({ disabled: newValue });
                }
            }
        });

        //jqxWindow
        var jqxWindow = new ko.jqwidgets.knockout({
            name: "jqxWindow",
            disabled: false,
            content: "",
            title: "",
            reset: function () {
                this.disabled = false;
                this.title = "";
                this.content = "";
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'disabled') {
                    object.host.jqxWindow({ disabled: newValue });
                }
                else if (key == 'content') {
                    object.host.jqxWindow('setContent', newValue);
                }
                else if (key == 'title') {
                    object.host.jqxWindow({ title: newValue });
                }
            }
        });

        //jqxNavigationBar
        var jqxNavigationBar = new ko.jqwidgets.knockout({
            name: "jqxNavigationBar",
            disabled: false,
            reset: function () {
                this.disabled = false;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'disabled') {
                    if (newValue != this.disabled) {
                        this.disabled = newValue;
                        object.host.jqxNavigationBar({ disabled: newValue });
                    }
                }
            }
        });

        //jqxMenu
        var jqxMenu = new ko.jqwidgets.knockout({
            name: "jqxMenu",
            source: null,
            disabled: false,
            reset: function () {
                this.disabled = false;
                this.source = null;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    object.host.jqxMenu({ source: newValue });
                }
                if (key == 'disabled') {
                    object.host.jqxMenu({ disabled: newValue });
                }
            }
        });

        //jqxChart
        var jqxChart = new ko.jqwidgets.knockout({
            name: "jqxChart",
            source: null,
            disabled: false,
            reset: function () {
                this.disabled = false;
                this.source = null;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    this.source = newValue;
                    object.host.jqxChart({ source: newValue });
                }
                if (key == 'disabled') {
                    this.disabled = newValue;
                    object.host.jqxChart({ disabled: newValue });
                }
            }
        });

        //jqxDataTable
        var jqxDataTable = new ko.jqwidgets.knockout({
            name: "jqxDataTable",
            source: null,
            disabled: false,
            reset: function () {
                this.disabled = false;
                this.source = null;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    this.source = newValue;
                    object.host.jqxDataTable({ source: newValue });
                }
                if (key == 'disabled') {
                    this.disabled = newValue;
                    object.host.jqxDataTable({ disabled: newValue });
                }
            }
        });

        //jqxTreeGrid
        var jqxTreeGrid = new ko.jqwidgets.knockout({
            name: "jqxTreeGrid",
            source: null,
            disabled: false,
            reset: function () {
                this.disabled = false;
                this.source = null;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    this.source = newValue;
                    object.host.jqxTreeGrid({ source: newValue });
                }
                if (key == 'disabled') {
                    this.disabled = newValue;
                    object.host.jqxTreeGrid({ disabled: newValue });
                }
            }
        });

        //jqxKnob
        var jqxKnob = new ko.jqwidgets.knockout({
            name: "jqxKnob",
            value: 0,
            disabled: false,
            reset: function () {
                this.disabled = false;
                this.source = null;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'value') {
                    this.value = newValue;
                    object.host.jqxKnob({ value: newValue });
                }
                if (key == 'disabled') {
                    this.disabled = newValue;
                    object.host.jqxKnob({ disabled: newValue });
                }
            }
        });
        //jqxScheduler
        var jqxScheduler = new ko.jqwidgets.knockout({
            name: "jqxScheduler",
            source: null,
            disabled: false,
            reset: function () {
                this.disabled = false;
                this.source = null;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    this.source = newValue;
                    object.host.jqxScheduler({ source: newValue });
                }
                if (key == 'disabled') {
                    this.disabled = newValue;
                    object.host.jqxScheduler({ disabled: newValue });
                }
            }
        });
        //jqxKanban
        var jqxKanban = new ko.jqwidgets.knockout({
            name: "jqxKanban",
            source: null,
            disabled: false,
            reset: function () {
                this.disabled = false;
                this.source = null;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'source') {
                    this.source = newValue;
                    object.host.jqxKanban({ source: newValue });
                }
                if (key == 'disabled') {
                    this.disabled = newValue;
                    object.host.jqxKanban({ disabled: newValue });
                }
            }
        });
        //jqxGrid
        var jqxGrid = new ko.jqwidgets.knockout({
            name: "jqxGrid",
            source: null,
            disabled: false,
            selectedRowIndex: -1,
            reset: function () {
                this.disabled = false;
                this.source = null;
                this.selectedRowIndex = -1;
            },
            serialize: function (object, propertyName) {
                if (propertyName == "source") {
                    if (object.source && object.source._source) {
                        return object.source.records;
                    };
                }
                return false;
            },
            events: ['cellvaluechanged', 'cellselect', 'rowselect'],
            getProperty: function (object, event, eventName, modelOptions) {
                if (eventName == 'cellvaluechanged') {
                    var rowId = object.host.jqxGrid("getrowid", event.args.rowindex);
                    var rowdata = object.host.jqxGrid("getrowdata", rowId);
                    var source = modelOptions['source'];
                    if (source != undefined) {
                        var updateObj = {};
                        var oldObj = {};
                        var hasObservable = false;
                        var hasComputed = false;
                        if (source()[rowId]) {
                            $.each(source()[rowId], function (index, value) {
                                updateObj[index] = value;
                                oldObj[index] = "";
                                if (ko.isObservable(value) && !ko.isComputed(value)) {
                                    hasObservable = true;
                                    value(rowdata[index]);
                                }
                                if (ko.isObservable(value) && ko.isComputed(value)) {
                                    hasComputed = true;
                                }
                            });
                        }

                        if (!hasObservable) {
                            updateObj = rowdata;
                            if (source.replace) {
                                source.replace(source()[rowId], oldObj);
                                source.replace(source()[rowId], updateObj);
                            }
                        }
                        else {
                            updateObj = rowdata;
                            if (source.replace) {
                                source.replace(source()[rowId], updateObj);
                            }
                        }
                        if (hasComputed) {
                            object.host.jqxGrid("updaterow", rowId, ko.toJS(source)[rowId]);
                        }

                        return { name: 'source', value: source };
                    }
                }
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'selectedRowIndex') {
                    object.host.jqxGrid('selectrow', newValue);
                }
                if (key == 'source') {
                    if (this.source == null || newValue == null) {
                        if (this.source != newValue) {
                            this.source = newValue;
                            var source = {
                                localdata: newValue,
                                datatype: 'local'
                            }

                            var dataAdapter = new $.jqx.dataAdapter(source);
                            object.host.jqxGrid({ source: dataAdapter });
                        }
                    }
                    else {
                        var source = {
                            localdata: newValue,
                            datatype: 'local'
                        }

                        var dataAdapter = new $.jqx.dataAdapter(source);
                        dataAdapter.dataBind();

                        if (!value.records || !dataAdapter.records) return;


                        var itemsLength = Math.max(value.records.length, dataAdapter.records.length);
                        var changedRecords = Math.abs(value.records.length - dataAdapter.records.length);
                        if (changedRecords == 0) {
                            if (itemsLength > 10) {
                                object.host.jqxGrid({ source: dataAdapter });
                                return;
                            }
                        }
                        if (changedRecords > 1) {
                            object.host.jqxGrid("beginupdate");
                        }

                        var recordstodelete = new Array();
                        for (var i = 0; i < itemsLength; i++) {
                            var record = dataAdapter.records[i];
                            if (record == undefined) {
                                var rowId = object.host.jqxGrid("getrowid", i);
                                recordstodelete.push(rowId);
                            }
                            else {
                                var update = value.records[i] != undefined;
                                if (update) {
                                    if (ko.toJSON(record) != ko.toJSON(value.records[i])) {
                                        if (value.records[i].uid != undefined) {
                                            record.uid = value.records[i].uid;
                                            if (ko.toJSON(record) == ko.toJSON(value.records[i])) {
                                                continue;
                                            }
                                        }

                                        var rowId = object.host.jqxGrid("getrowid", i);
                                        object.host.jqxGrid("updaterow", rowId, record);
                                    }
                                }
                                else {
                                    object.host.jqxGrid("addrow", null, record);
                                }
                            }
                        }
                        if (recordstodelete.length > 0) {
                            object.host.jqxGrid("deleterow", recordstodelete);
                        }
                        if (changedRecords > 1) {
                            object.host.jqxGrid("endupdate");
                        }
                    }
                }
                if (key == 'disabled') {
                    object.host.jqxGrid({ disabled: newValue });
                }
            }
        });

        // jqxBulletChart
        var jqxBulletChart = new ko.jqwidgets.knockout({
            name: "jqxBulletChart",
            pointer: { value: 0 },
            target: { value: 0 },
            disabled: false,
            reset: function () {
                this.pointer.value = 0;
                this.target.value = 0;
                this.disabled = false;
            },
            getProperty: function (object, event, eventName) {
            },
            setProperty: function (object, key, value, newValue) {
                if (key == 'pointer') {
                    object.host.jqxBulletChart({ pointer: newValue });
                }
                if (key == 'target') {
                    object.host.jqxBulletChart({ target: newValue });
                }
                if (key == 'disabled') {
                    object.host.jqxBulletChart({ disabled: newValue });
                }
            }
        });
    }(jqxBaseFramework, ko));
}
catch (error) {
    var er = error;
}