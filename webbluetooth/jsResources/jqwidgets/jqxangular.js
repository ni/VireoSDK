/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

if (!jqxBaseFramework) {
    var jqxBaseFramework = window.minQuery || window.jQuery;
}
(function ($, angular, undefined) {

    if (!angular) {
        return;
    }

    $.jqx = $.jqx || {}
    $.jqx.AMD = false;
    var module = angular.module('jqwidgets', []);
    var amdmodule = angular.module('jqwidgets-amd', [], function () {
        $.jqx.AMD = true;
    }
    );

    var $parse = null;
    var $timeout = null;
    var $interval = null;
    var $compile = null;
    var $log = null;
    var JQWIDGETS_UID = new Array();
    var JQWIDGETS_ELEMENTS = new Array();
    var JQWIDGETS_WATCHSETTINGS = new Array();
    var JQWIDGETS_LOADED_FILES = new Array();
    var JQWIDGETS_LOADING_FILES = new Array();
    var JQWIDGETS_LOADED_WIDGETS = new Array();
    var watchers = {};
    var allScriptsLoaded = false;
    var pluginURL = function () {
        var scriptElements = document.getElementsByTagName('script');
        var i, element, myfile;
        for (i = 0; element = scriptElements[i]; i++) {

            myfile = element.src;

            if (myfile.indexOf("jqxcore.js") >= 0) {
                var myurl = myfile.substring(0, myfile.indexOf("jqxcore.js"));
                break;
            }
        }
        return myurl;
    }();

    function propertyChangeHandler(name, element, settingsToUpdate, newObj, oldObj) {
        if (newObj && oldObj) {
            switch (name) {
                case "jqxGrid":
                case "jqxDataTable":
                case "jqxTreeGrid":
                    if (settingsToUpdate.columns) {
                        var newColumns = newObj.columns || newObj;
                        var oldColumns = oldObj.columns || oldObj;

                        if (newColumns.length != oldColumns.length)
                            return false;

                        var propertiesToUpdate = {};
                        $.each(newColumns, function (index, value) {
                            var column = this;
                            for (var obj in this) {
                                if (column[obj] != oldColumns[index][obj]) {
                                    var dataField = column.datafield || column.dataField;

                                    if (!propertiesToUpdate[dataField])
                                        propertiesToUpdate[dataField] = {};

                                    propertiesToUpdate[dataField][obj] = column[obj];
                                }
                            }
                        });
                        if (!$.isEmptyObject(propertiesToUpdate)) {
                            $.each(propertiesToUpdate, function (index, value) {
                                for (var property in value) {
                                    var propertyValue = $(element).jqxProxy('getcolumnproperty', index, property);
                                    if (propertyValue !== value[property]) {
                                        $(element).jqxProxy('setcolumnproperty', index, property, value[property]);
                                    }
                                }
                            });
                            return true;
                        }
                    }
                    break;
            }
        }

        return false;
    }

    function getDataAdapter(scope, element, attrs, data, parentScope, widgetName, elementWatchers) {
        var buildAdapter = function (data) {
            if (widgetName === "jqxTree" || widgetName === "jqxMenu")
                return data;

            if (typeof data == "object") {
                if (data && data._bindingUpdate != null)
                    return data;
            }
            var source = {};
            var isArray = false;
            if ($.isArray(data) || (data instanceof Object && !data.url && !(data.localdata || data.localData))) {
                if (widgetName === "jqxChart") {
                    return data;
                }
                isArray = true;
                source.localData = data;
                source.type = "array";
                if (data[0]) {
                    var dataFields = new Array();
                    if ($.type(data[0]) == "object") {
                        $.each(data[0], function (index, value) {
                            var obj = { name: index, type: $.type(value) };
                            dataFields.push(obj);
                        });
                        source.datafields = dataFields;
                    }
                }
            }
            else if (data && data.url) {
                source = data;
            }
            else if (data && (data.localdata || data.localData)) {
                source = data;
            }

            if ($.jqx.dataAdapter) {
                var dataAdapter = new $.jqx.dataAdapter(source);
                return dataAdapter;
            } else if (isArray) {
                return data;
            }
            return null;
        }

        if (attrs["jqxSource"] != undefined) {
            var watchFunc = scope.$watchCollection(attrs["jqxSource"], function (newObj, oldObj) {
                if (newObj != oldObj) {
                    if (angular.equals(newObj, oldObj)) {
                        return;
                    }
                    if (newObj && oldObj && newObj._source && oldObj._source && angular.equals(newObj._source, oldObj._source)) {
                        return;
                    }

                    var adapter = buildAdapter(newObj);
                    $(element).jqxProxy({ source: adapter });
                    var settings = angular.extend({}, scope.$eval(attrs["jqxSettings"]));
                    if (attrs["jqxSettings"] && settings && settings.propertyChanged) {
                        settings.propertyChanged("source", oldObj, newObj);
                    }
                }
            });
            elementWatchers.push(watchFunc);
        }
        else if (attrs["jqxSettings"] != undefined) {
            var updated = {};
            var propertyToWatch = null;
            var settingsObj = $parse(attrs.jqxSettings)(scope);
            var controller = element.controller();
            for (var obj in controller) {
                if (settingsObj && controller[obj] == settingsObj.source) {
                    propertyToWatch = obj;
                    break;
                }
            }

            if (!propertyToWatch) {
                for (var obj in scope) {
                    if (settingsObj && scope[obj] == settingsObj.source) {
                        propertyToWatch = obj;
                        break;
                    }
                }
            }

            if (propertyToWatch) {
                var controllerName = "";
                for (var obj in scope) {
                    if (scope[obj] == controller) {
                        controllerName = obj;
                        break;
                    }
                }

                if (controllerName != "") {
                    propertyToWatch = controllerName + "." + propertyToWatch;
                }
                var watchFunc = parentScope.$watchCollection(propertyToWatch, function (newObj, oldObj) {
                    if (newObj != oldObj) {
                        if (angular.equals(newObj, oldObj)) {
                            return;
                        }
                        if (newObj && oldObj && newObj._source && oldObj._source && angular.equals(newObj._source, oldObj._source)) {
                            return;
                        }
                        var isArray = $.isArray(newObj) || $.type(newObj) === "array";
                        if (new Date() - updated["jqxSettings.source"] > 1000 || updated == {} || !updated["jqxSettings.source"] || isArray) {
                            var adapter = buildAdapter(newObj);
                            $(element).jqxProxy({ source: adapter });
                            var settings = angular.extend({}, scope.$eval(attrs["jqxSettings"]));
                            if (attrs["jqxSettings"] && settings && settings.propertyChanged) {
                                settings.propertyChanged("source", oldObj, newObj);
                            }
                            updated["property"] = new Date();
                        }
                    }
                });
                elementWatchers.push(watchFunc);
            }

            var watchFunc = scope.$watchCollection(attrs["jqxSettings"] + ".source", function (newObj, oldObj) {
                if (newObj != oldObj) {
                    if (angular.equals(newObj, oldObj)) {
                        return;
                    }
                    if (newObj && oldObj && newObj._source && oldObj._source && angular.equals(newObj._source, oldObj._source)) {
                        return;
                    }

                    if (new Date() - updated["property"] > 1000 || !updated["jqxSettings.property"] || updated == {}) {
                        var adapter = buildAdapter(newObj);
                        $(element).jqxProxy({ source: adapter });
                        var settings = angular.extend({}, scope.$eval(attrs["jqxSettings"]));
                        if (attrs["jqxSettings"] && settings && settings.propertyChanged) {
                            settings.propertyChanged("source", oldObj, newObj);
                        }
                        updated["jqxSettings.source"] = new Date();
                    }
                }
            });
            elementWatchers.push(watchFunc);

            var watchFunc = scope.$watchCollection(attrs["jqxSettings"], function (newObj, oldObj) {
                if (!newObj)
                    return;

                if (!oldObj) {
                    var adapter = buildAdapter(newObj.source);
                    $(element).jqxProxy({ source: adapter });
                    return;
                }

                if (newObj.source != oldObj.source) {
                    if (angular.equals(newObj.source, oldObj.source)) {
                        return;
                    }
                    if (newObj && oldObj && newObj.source && oldObj.source && newObj.source._source && oldObj.source._source && angular.equals(newObj.source._source, oldObj.source._source)) {
                        return;
                    }

                    if (newObj.source && oldObj.source && $.isArray(newObj.source) && $.isArray(oldObj.source)) {
                        if (serializeObject(newObj.source) == serializeObject(oldObj.source)) {
                            return;
                        }
                    }
                    if (new Date() - updated["property"] > 1000 || !updated["jqxSettings.source"] || updated == {}) {
                        var adapter = buildAdapter(newObj.source);
                        $(element).jqxProxy({ source: adapter });
                        var settings = angular.extend({}, scope.$eval(attrs["jqxSettings"]));
                        if (attrs["jqxSettings"] && settings && settings.propertyChanged) {
                            settings.propertyChanged("source", oldObj.source, newObj.source);
                        }
                        updated["jqxSettings.source"] = new Date();
                    }
                }
            });
            elementWatchers.push(watchFunc);
        }
        return buildAdapter(data);
    };

    function serializeObject(data) {
        if (data == null) return "";
        var str = "";
        $.each(data, function (index) {
            var val = this;
            if (index > 0) str += ', ';
            str += "[";
            var m = 0;

            if ($.type(val) == "object") {
                for (var obj in val) {
                    if (m > 0) str += ', ';
                    str += '{' + obj + ":" + val[obj] + '}';
                    m++;
                }
            }
            else {
                if (m > 0) str += ', ';
                str += '{' + index + ":" + val + '}';
                m++;
            }

            str += "]";
        });
        return str;
    }

    function extendInstance(scope, element, attrs, name, parentScope, callbacks) {
        $.extend($.jqx["_" + name + ""].prototype,
          {
              definedInstance: function () {
                  if (this.element && this.element !== element[0]) {
                      return true;
                  }
                  if (this.base && this.base.element !== element[0]) {
                      return true;
                  }

                  var that = this;

                  var bindToEvents = function (element)
                  {
                      // call event callback function.
                      $.each(callbacks, function (index, value)
                      {
                          that.addHandler($(element), index, function (event)
                          {
                              scope.$parent ? $.proxy(value, parentScope)(event) : value(event);
                              if (scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest')
                              {
                                  scope.$apply();
                              }
                          });
                      });

                      // call event.
                      var eventAttributes = attrs.$attr;
                      $.each(attrs, function (index, value)
                      {
                          if (index.indexOf('jqxOn') >= 0)
                          {
                              var eventAttribute = eventAttributes[index].substring(7);
                              var eventName = $.camelCase(eventAttribute);
                              var methodName = value;
                              that.addHandler($(element), eventName, function (event)
                              {
                                  event.data = attrs.data || attrs.jqxData;
                                  if (methodName.indexOf('(') >= 0)
                                  {
                                      var indx = methodName.indexOf('(');
                                      var callback = $parse(methodName.substring(0, indx))(scope);
                                      if (callback)
                                      {
                                          callback(event);
                                      }
                                      else
                                      {
                                          scope.$emit(eventName, event);
                                      }
                                  }
                                  else
                                  {
                                      scope.$emit(methodName, event);
                                  }
                                  if (scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest')
                                  {
                                      scope.$apply();
                                  }
                              });
                          }
                      });

                      if (attrs.jqxInstance)
                      {
                          var setter = $parse(attrs['jqxInstance']).assign;
                          if (setter)
                          {
                              setter(scope, that)
                          }

                          if (scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest')
                          {
                              scope.$apply();
                          }
                      }
                  }
                  bindToEvents(element);
                  if (name == "jqxPopover")
                  {
                      setTimeout(function ()
                      {
                          bindToEvents(that.host);
                      });
                  }
              }
          });
    }

    function extendSettings(scope, element, attrs, name, parentScope, widgetElement) {
        if (!attrs.jqxSettings) {
            return;
        }

        var settingsObj = $parse(attrs['jqxSettings'])(scope);

        if (!settingsObj) {
            return;
        }

        if (!settingsObj.apply) {
            settingsObj.apply = settingsObj[name] = function () {
                var args = arguments;
                var results = new Array();

                if (args.length == 0)
                    return true;

                $.each(JQWIDGETS_ELEMENTS[parentScope.$id + name + attrs['jqxSettings']], function (index, value) {
                    var htmlElement = this;
                    results.push({ widgetName: name, element: htmlElement, result: $.jqx.jqxWidgetProxy(name, htmlElement, args) });
                });

                if (results.length == 1)
                    return results[0].result;

                return results;
            }
            settingsObj.digest = function () {
                if (!/^\$(digest|apply)$/.test(scope.$root.$$phase)) {
                    scope.$digest();
                }
            }
            settingsObj.refresh = function (properties, instanceToScope) {
                var settingsToUpdate = {};
                var widgetInstance = $(element)[name]('getInstance');

                $.each(settingsObj, function (index, value) {
                    if (index === "created" || index === "propertyChanged" || index == "data" || index == "refresh" || index == name || index == "apply") {
                        return true;
                    }

                    var events = widgetInstance.events || widgetInstance._events;
                    if ((events && events.indexOf(index) >= 0) || index.match(/(mousedown|click|mouseenter|mouseleave|mouseup|keydown|keyup|focus|blur|keypress)/g)) {
                        return true;
                    }

                    if (properties != undefined && properties.indexOf(index) === -1) {
                        return true;
                    }

                    settingsToUpdate[index] = value;
                });
                if (settingsToUpdate !== {}) {
                    if (instanceToScope) {
                        $.each(settingsToUpdate, function (index, value) {
                            settingsObj[index] = widgetInstance[index];
                        });
                        if (scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest') {
                            scope.$apply();
                        }
                    }
                    else {
                        $.each(JQWIDGETS_ELEMENTS[parentScope.$id + name + attrs['jqxSettings']], function (index, value) {
                            $(this).jqxProxy(settingsToUpdate);
                        });

                        if (attrs.jqxWatchSettings != undefined) {
                            if (parentScope) {
                                var parentScopeSettings = $parse(attrs.jqxSettings)(parentScope);
                                $.each(parentScopeSettings, function (index, value) {
                                    if (index.match(/(source|propertyChanged|created|data|apply|refresh)/g))
                                        return true;
                                    var events = widgetInstance.events || widgetInstance._events;
                                    if ((events && events.indexOf(index) >= 0) || index.match(/(mousedown|click|mouseenter|mouseleave|mouseup|keydown|keyup|focus|blur|keypress)/g)) {
                                        return true;
                                    }
                                    if (index === name)
                                        return true;

                                    if (!JQWIDGETS_WATCHSETTINGS[attrs.jqxSettings + "." + index]) {
                                        var property = index;
                                        var unregister = parentScope.$watch(attrs.jqxSettings + "." + index, function (newObj, oldObj) {
                                            if (newObj != oldObj) {
                                                if (angular.equals(newObj, oldObj)) {
                                                    return;
                                                }

                                                var settingsToUpdate = {};
                                                settingsToUpdate[property] = newObj;
                                                $.each(JQWIDGETS_ELEMENTS[parentScope.$id + name + attrs['jqxSettings']], function (index, value) {
                                                    var updated = propertyChangeHandler(name, $(this), settingsToUpdate, newObj, oldObj);
                                                    if (!updated) {
                                                        $(this).jqxProxy(settingsToUpdate);
                                                    }
                                                });
                                                var settings = angular.extend({}, scope.$eval(attrs["jqxSettings"]));
                                                if (attrs["jqxSettings"] && settings && settings.propertyChanged) {
                                                    settings.propertyChanged(property, oldObj, newObj);
                                                }
                                            }
                                        }, true);
                                        JQWIDGETS_WATCHSETTINGS[attrs.jqxSettings + "." + index] = unregister;
                                    }
                                });
                            }
                        }
                    }
                }

                if (watchers[element[0].id]) {
                    settingsToUpdate = {};
                    $.each(watchers[element[0].id], function () {
                        if (properties != undefined && properties.indexOf($.camelCase(this.value.substring(4))) === -1) {
                            return true;
                        }
                        settingsToUpdate[$.camelCase(this.value.substring(4))] = scope.$eval(this.label);
                        if (instanceToScope) {
                            var setter = $.parse(this.label)(scope).assign;
                            if (setter) {
                                setter(scope, widgetInstance[$.camelCase(this.value.substring(4))]);
                            }
                        }
                    });
                    if (!instanceToScope) {
                        $.each(JQWIDGETS_ELEMENTS[parentScope.$id + name + attrs['jqxSettings']], function (index, value) {
                            $(this).jqxProxy(settingsToUpdate);
                        });
                    }
                    else {
                        if (scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest') {
                            scope.$apply();
                        }
                    }
                }
            }
            JQWIDGETS_ELEMENTS[parentScope.$id + name + attrs['jqxSettings']] = new Array();
            JQWIDGETS_ELEMENTS[parentScope.$id + name + attrs['jqxSettings']].push(widgetElement);
        }
        else {
            if (!JQWIDGETS_ELEMENTS[parentScope.$id + name + attrs['jqxSettings']]) {
                JQWIDGETS_ELEMENTS[parentScope.$id + name + attrs['jqxSettings']] = new Array();
            }

            JQWIDGETS_ELEMENTS[parentScope.$id + name + attrs['jqxSettings']].push(widgetElement);
        }
    }

    function updateSettings(scope, element, attrs, name, parentScope, settings, elementWatchers) {
        var dataWidgets = /(jqxGrid|jqxTree|jqxMenu|jqxDataTable|jqxTreeGrid|jqxListBox|jqxTreeMap|jqxComboBox|jqxDropDownList|jqxChart)/ig;
        if (attrs.jqxSettings && settings && settings.source === undefined && attrs["jqxSource"] === undefined && name.match(dataWidgets)) {
            if (name.match(/(jqxTree|jqxMenu)/ig)) {
                if (element[0].innerHTML.toLowerCase().indexOf('ul') === -1) {
                    settings.source = [];
                }
            }
            else {
                settings.source = [];
            }
        }

        // parse the datasource attribute
        if (settings.source !== undefined && attrs.jqxSettings) {
            settings.source = getDataAdapter(scope, element, attrs, settings.source, parentScope, name, elementWatchers);
        }
        else if (attrs["jqxSource"] !== undefined) {
            var source = angular.extend({}, scope.$eval(attrs["jqxSource"]));
            var isAdapter = attrs["jqxSource"] && attrs["jqxSource"].dataBind ? true : false;
            if (isAdapter) {
                settings.source = getDataAdapter(scope, element, attrs, attrs["jqxSource"], parentScope, name, elementWatchers);
            }
            else {
                settings.source = getDataAdapter(scope, element, attrs, source, parentScope, name, elementWatchers);
            }
        }

        var watchFunc = scope.$watch(attrs["ngDisabled"], function (newObj, oldObj) {
            if (newObj != undefined) {
                if (newObj != oldObj || $(element).jqxProxy('disabled') !== newObj) {
                    var settingsToUpdate = {};
                    settingsToUpdate["disabled"] = newObj;
                    $(element).jqxProxy(settingsToUpdate);
                }
            }
        });
        elementWatchers.push(watchFunc);
    }

    function createInstance(scope, element, attrs, name, parentScope) {
        var elementWatchers = new Array();
        var settings = angular.extend({}, scope.$eval(attrs["jqxSettings"]));

        updateSettings(scope, element, attrs, name, parentScope, settings, elementWatchers);

        var properties = {};
        var callbacks = {};

        if (watchers[element[0].id]) {
            $.each(watchers[element[0].id], function () {
                var label = this.label;
                var value = this.value;
                var propertyName = $.camelCase(value.substring('4'));
                if (typeof attrs[label] !== "undefined") {
                    var val = scope.$eval(attrs[label]);
                    if (val === undefined && $.type(attrs[label]) === "string") {
                        val = attrs[label];
                    }

                    if (propertyName == "instance") {
                        return true;
                    }

                    if ($.type(val) === "array" && name !== "source") {
                        val = val.slice(0);
                    }
                    else if ($.type(val) === "object" && name !== "source") {
                        val = $.extend({}, val);
                    }

                    var propertyFunctions = /(columnmenuopening|columnmenuclosing|aggregatesrenderer|tooltipFormatFunction|labelsFormatFunction|rendergridrows|draw|renderFiles|initTools|initFeedBack|onTargetDrop|drawBefore|dragStart|dragEnd|onDropTargetEnter|onDropTargetLeave|onDrag|createCommand|ready|render|initrowdetails|initTabContent|initContent|renderer|renderToolbar|renderStatusBar|groupsrenderer|pagerrenderer|groupcolumnrenderer|updatefilterconditions|handlekeyboardnavigation|updatefilterpanel|rendered|virtualModeCreateRecords|virtualModeRecordCreating|search|selectionRenderer)/ig;
                    var nonPropertyFunctions = /(searchMode)/ig;
                    var callDigest = /(ready|aggregatesrenderer|initrowdetails|initTabContent|initContent|renderToolbar|renderStatusBar|pagerRenderer)/ig;;

                    if ($.isFunction(val) && !propertyName.match(propertyFunctions)) {
                        callbacks[index] = val;
                    }
                    else {
                        if (propertyName.match(propertyFunctions) && !propertyName.match(nonPropertyFunctions)) {
                            var propertyFunction = function () {
                                var result = val.apply(this, arguments);
                                if (propertyName.match(callDigest) && !/^\$(digest|apply)$/.test(scope.$root.$$phase)) {
                                    scope.$digest();
                                }
                                return result;
                            }
                            properties[propertyName] = propertyFunction;
                            return true;
                        }
                    
                        properties[propertyName] = val;
                    }

          
                    var watchFunc = function (newObj, oldObj) {
                        if (newObj != oldObj) {
                            if (angular.equals(newObj, oldObj)) {
                                return;
                            }

                            var propertyName = $.camelCase(value.substring('4'));
                            if (propertyName == "watch") {
                                if (attrs["jqxWatch"].indexOf(',') >= 0 || attrs["jqxWatch"].indexOf('[') >= 0) {
                                    var properties = attrs["jqxWatch"];
                                    properties = properties.replace('[', '');
                                    properties = properties.replace(']', '');
                                    properties = properties.trim();
                                    properties = properties.split(',');

                                    $.each(properties, function (index, value) {
                                        var subProperties = this.split('.');

                                        for (var i = 0; i < subProperties.length; i++) {
                                            if (subProperties[i] in $(element).data().jqxWidget) {
                                                propertyName = subProperties[i];
                                                break;
                                            }
                                            else if (subProperties[i].toLowerCase() in $(element).data().jqxWidget) {
                                                propertyName = subProperties[i].toLowerCase();
                                                break;
                                            }
                                        }
                                        var settingsToUpdate = {};
                                        settingsToUpdate[propertyName] = newObj[index];
                                        var updated = propertyChangeHandler(name, $(element), settingsToUpdate, newObj, oldObj);
                                        if (!updated) {
                                            $(element).jqxProxy(settingsToUpdate);
                                            var settings = angular.extend({}, scope.$eval(attrs["jqxSettings"]));
                                            if (attrs["jqxSettings"] && settings && settings.propertyChanged) {
                                                settings.propertyChanged(propertyName, oldObj, newObj);
                                            }
                                        }
                                    });

                                    return;
                                }
                                var properties = attrs["jqxWatch"].split('.');

                                for (var i = 0; i < properties.length; i++) {
                                    if (properties[i] in $(element).data().jqxWidget) {
                                        propertyName = properties[i];
                                        break;
                                    } else if (properties[i].toLowerCase() in $(element).data().jqxWidget) {
                                        propertyName = properties[i].toLowerCase();
                                        break;
                                    }
                                }
                            }

                            var settingsToUpdate = {};
                            settingsToUpdate[propertyName] = newObj;
                            var updated = propertyChangeHandler(name, $(element), settingsToUpdate, newObj, oldObj);
                            if (!updated) {
                                $(element).jqxProxy(settingsToUpdate);
                                var settings = angular.extend({}, scope.$eval(attrs["jqxSettings"]));
                                if (attrs["jqxSettings"] && settings && settings.propertyChanged) {
                                    settings.propertyChanged(propertyName, oldObj, newObj);
                                }

                            }
                        }
                    };

                    if (propertyName == "watch") {
                        delete properties[propertyName];
                        var watchFunc = scope.$watch(attrs[label], watchFunc, true);
                        elementWatchers.push(watchFunc);
                    }
                    else {
                        var watchFunc = scope.$watch(attrs[label], watchFunc);
                        elementWatchers.push(watchFunc);
                    }
                }
            });
        }

        if (element[0].id == "") {
            if (undefined == JQWIDGETS_UID[name]) {
                JQWIDGETS_UID[name] = 0;
            }
            element[0].id = name + JQWIDGETS_UID[name]++;
        }
        else if (element[0].id != "" && element[0].id == name + "0")
        {
            if (undefined == JQWIDGETS_UID[name])
            {
                JQWIDGETS_UID[name] = 0;
            }
            element[0].id = name + JQWIDGETS_UID[name]++;
        }
        var constructor = $(element)[name];
        if (!constructor) {
            throw new Error("Missing required JavaScript references for: " + name);
            return null;
        }

        $.each(settings, function (index, value) {
            if (index === "data" || index === "created" || index === "propertyChanged")
                return true;

            var propertyFunctions = /(columnmenuopening|columnmenuclosing|aggregatesrenderer|tooltipFormatFunction|labelsFormatFunction|rendergridrows|renderFiles|initTools|draw|drawBefore|dragStart|dragEnd|initFeedBack|onTargetDrop|onDropTargetEnter|onDropTargetLeave|onDrag|createCommand|ready|render|initrowdetails|initTabContent|initContent|renderer|renderToolbar|renderStatusBar|groupsrenderer|pagerrenderer|groupcolumnrenderer|updatefilterconditions|handlekeyboardnavigation|updatefilterpanel|rendered|virtualModeCreateRecords|virtualModeRecordCreating|search|selectionRenderer)/ig;
            var nonPropertyFunctions = /(searchMode)/ig;
            var callDigest = /(ready|aggregatesrenderer|initrowdetails|initTabContent|initContent|renderToolbar|renderStatusBar|pagerRenderer)/ig;;
            if ($.isFunction(value) && !index.match(propertyFunctions)) {
                callbacks[index] = value;
            }
            else {
                if (index.match(propertyFunctions) && !index.match(nonPropertyFunctions)) {
                    var propertyFunction = function () {
                        var result = value.apply(this, arguments);
                        if (index.match(callDigest) && !/^\$(digest|apply)$/.test(scope.$root.$$phase)) {
                            scope.$digest();
                        }
                        return result;
                    }
                    properties[index] = propertyFunction;
                    return true;
                }
                if ($.type(value) === "array" && index !== "source") {
                    value = value.slice(0);
                }
                else if ($.type(value) === "object" && index !== "source") {
                    value = $.extend({}, value);
                }
                properties[index] = value;
            }
        });

        extendInstance(scope, element, attrs, name, parentScope, callbacks);
        var widgetElement = element[0];
        extendSettings(scope, element, attrs, name, parentScope, widgetElement);

        //var originalSettings = {};
        //var propertyName = "";
        //for (var propertyName in attrs) {
        //    if (propertyName.indexOf('jqx') >= 0 && propertyName != "jqxInstance" && propertyName !== name) {
        //        originalSettings[attrs[propertyName]] = angular.copy(scope[attrs[propertyName]]);
        //    }
        //}
        var object = $(element)[name](properties);
        var widgetInstance = $(element)[name]('getInstance');
        //var propertyName = "";
        //for (var propertyName in originalSettings) {
        //    scope[propertyName] = originalSettings[propertyName];
        //}

        // watch for changes.
        watchSettings(scope, element, attrs, name, parentScope, settings, widgetElement, widgetInstance, properties, elementWatchers);
        var destroy = scope.$on("$destroy", function () {
            if (widgetInstance && widgetInstance.destroy && !widgetInstance.isDestroyed) {
                widgetInstance.isDestroyed = true;
                if ($(element).parents().length > 0) {
                    $(element)[name]('destroy');
                }
                widgetInstance = null;
            }
            else {
                $(element).remove();
                widgetInstance = null;
            }
            for (var i = 0; i < elementWatchers.length; i++) {
                elementWatchers[i]();
            }
            properties = [];
            callbacks = [];
            destroy();
        });

        return widgetInstance;
    }

    function watchSettings(scope, element, attrs, name, parentScope, settings, widgetElement, widgetInstance, properties, elementWatchers) {
        if (attrs["jqxSettings"]) {
            if (attrs.jqxWatchSettings != undefined) {
                if (parentScope) {
                    var parentScopeSettings = $parse(attrs.jqxSettings)(parentScope);
                    $.each(parentScopeSettings, function (index, value) {
                        if (index.match(/(source|created|propertyChanged|data|apply|refresh)/g))
                            return true;
                        var events = widgetInstance.events || widgetInstance._events;
                        if ((events && events.indexOf(index) >= 0) || index.match(/(mousedown|click|mouseenter|mouseleave|mouseup|keydown|keyup|focus|blur|keypress)/g)) {
                            return true;
                        }
                        if (index === name)
                            return true;

                        if (properties.hasOwnProperty(index)) {
                            var property = index;
                            var unregister = parentScope.$watch(attrs.jqxSettings + "." + index, function (newObj, oldObj) {
                                if (newObj != oldObj) {
                                    if (angular.equals(newObj, oldObj)) {
                                        return;
                                    }
                                    var settingsToUpdate = {};
                                    settingsToUpdate[property] = newObj;
                                    var updated = propertyChangeHandler(name, $(element), settingsToUpdate, newObj, oldObj);
                                    if (!updated) {
                                        $(element).jqxProxy(settingsToUpdate);
                                        var settings = angular.extend({}, scope.$eval(attrs["jqxSettings"]));
                                        if (attrs["jqxSettings"] && settings && settings.propertyChanged) {
                                            settings.propertyChanged(property, oldObj, newObj);
                                        }
                                    }
                                }
                            }, true);
                            JQWIDGETS_WATCHSETTINGS[attrs.jqxSettings + "." + index] = unregister;
                            elementWatchers.push(unregister);
                        }
                    });
                }
            }

            var watchFunc = scope.$watch(attrs["jqxSettings"], function (newObj, oldObj) {
                var settingsToUpdate = {};
                var hasChanges = false;
                if (newObj != oldObj) {
                    if (angular.equals(newObj, oldObj)) {
                        return;
                    }

                    $.each(newObj, function (index, value) {
                        if (index === "source") {
                            if (oldObj.source != null) {
                                return true;
                            }
                            else {
                                var adapter = getDataAdapter(scope, element, attrs, value, parentScope, elementWatchers);
                                settingsToUpdate[index] = adapter;
                            }
                        }

                        if (index === "created") {
                            return true;
                        }

                        if (index === "propertyChanged") {
                            return true;
                        }

                        if (index === "data") {
                            scope.$apply();
                            return true;
                        }

                        var events = widgetInstance.events || widgetInstance._events;
                        if ((events && events.indexOf(index) >= 0) || index.match(/(mousedown|click|mouseenter|mouseleave|mouseup|keydown|keyup|focus|blur|keypress)/g)) {
                            return true;
                        }

                        var registerWatch = function (property) {
                            if (attrs.jqxWatchSettings != undefined) {
                                if (parentScope) {
                                    if (!JQWIDGETS_WATCHSETTINGS[attrs.jqxSettings + "." + property]) {
                                        var property = index;
                                        var unregister = parentScope.$watch(attrs.jqxSettings + "." + property, function (newObj, oldObj) {
                                            if (newObj != oldObj) {
                                                if (angular.equals(newObj, oldObj)) {
                                                    return;
                                                }
                                                var settingsToUpdate = {};
                                                settingsToUpdate[property] = newObj;
                                                var updated = propertyChangeHandler(name, $(element), settingsToUpdate, newObj, oldObj);
                                                if (!updated) {
                                                    $(element).jqxProxy(settingsToUpdate);
                                                    var settings = angular.extend({}, scope.$eval(attrs["jqxSettings"]));
                                                    if (attrs["jqxSettings"] && settings && settings.propertyChanged) {
                                                        settings.propertyChanged(property, oldObj, newObj);
                                                    }
                                                }
                                            }
                                        }, true);
                                        JQWIDGETS_WATCHSETTINGS[attrs.jqxSettings + "." + property] = unregister;
                                        elementWatchers.push(unregister);
                                    }
                                }
                            }
                        }

                        if (!(value instanceof Object) && (oldObj == null || value !== oldObj[index])) {
                            settingsToUpdate[index] = value;
                            registerWatch(index);
                            hasChanges = true;
                        }
                        else if (index !== name && index !== "apply" && index !== "created" && index !== "propertyChanged" && (value instanceof Object) && (oldObj == null || (serializeObject(value) !== serializeObject(oldObj[index])) || (serializeObject(value) == "" && serializeObject(oldObj[index]) == ""))) {
                            settingsToUpdate[index] = value;
                            registerWatch(index);
                            hasChanges = true;
                        }
                    });
                    if (settingsToUpdate !== {} && hasChanges) {
                        var updated = propertyChangeHandler(name, $(element), settingsToUpdate, newObj, oldObj);
                        if (!updated) {
                            $(element).jqxProxy(settingsToUpdate);
                            var settings = angular.extend({}, scope.$eval(attrs["jqxSettings"]));
                            if (attrs["jqxSettings"] && settings && settings.propertyChanged) {
                                settings.propertyChanged(index, oldObj, newObj);
                            }
                        }
                    }
                }
            });
            elementWatchers.push(watchFunc);
        }
    }

    function addTemplate(element, replace, attrs, name) {
        var nodeName = element[0].nodeName.toLowerCase();
        var parent = $(element).parent();
        var contents = $(element).html();
        var ngInclude = parent && parent[0] && parent[0].nodeName.toLowerCase() == "ng-include" ? true : false;
        if ($(element).parents("[ui-view]").length > 0)
            ngInclude = true;

        if (ngInclude && !replace) {
            $(element).attr('data-jqx-ng-include', true);
            return;
        }
        var htmlstring = '<div id="jqx-ngwidget">' + contents + '</div>';
        if (nodeName.indexOf('jqx') >= 0) {
            var attributes = element[0].attributes;
            var newElement = element;

            if (nodeName.indexOf('input') >= 0) {
                if (nodeName.indexOf('date') >= 0 || nodeName.indexOf('number') >= 0) {
                    $(element).replaceWith('<div id="jqx-ngwidget"></div>');
                }
                else if (nodeName.indexOf('password') >= 0) {
                    $(element).replaceWith('<input id="jqx-ngwidget" type="password"/>');
                }
                else {
                    $(element).replaceWith('<input id="jqx-ngwidget"/>');
                }
            }
            else if (nodeName.indexOf('jqx-button') >= 0 && nodeName.indexOf('jqx-button-group') == -1) {
                $(element).replaceWith('<button id="jqx-ngwidget">' + contents + '</button>');
            }
            else if (nodeName.indexOf('jqx-toggle-button') >= 0) {
                $(element).replaceWith('<button id="jqx-ngwidget">' + contents + '</button>');
            }
            else if (nodeName.indexOf('jqx-link-button') >= 0) {
                if ($(element).find('a').length > 0) {
                    var anchor = $(element).find('a');
                    anchor.attr('id', 'jqx-ngwidget');
                    $(element).replaceWith(anchor);
                }
                else {
                    $(element).replaceWith('<a id="jqx-ngwidget">' + contents + '</a>');
                }
            }
            else if (nodeName.indexOf('jqx-data-table') >= 0 || nodeName.indexOf('jqx-grid') >= 0) {
                if ($(element).find('tr').length > 0) {
                    $(element).replaceWith('<div id="jqx-ngwidget">' + contents + '</div>');
                }
                else {
                    $(element).replaceWith('<div id="jqx-ngwidget"></div>');
                }
            }
            else if (nodeName.indexOf('jqx-list-box') >= 0 || nodeName.indexOf('jqx-drop-down-list') >= 0 || nodeName.indexOf('jqx-combo-box') >= 0) {
                if ($(element).find('option').length > 0) {
                    $(element).replaceWith('<select id="jqx-ngwidget">' + contents + '</select>');
                }
                else if ($(element).find('li').length > 0) {
                    $(element).replaceWith('<ul id="jqx-ngwidget">' + contents + '</ul>');
                }
                else {
                    $(element).replaceWith('<div id="jqx-ngwidget"></div>');
                }
            }
            else if (nodeName.indexOf('jqx-list-menu') >= 0) {
                $(element).replaceWith('<ul id="jqx-ngwidget" data-role="listmenu">' + contents + '</ul>');
            }
            else if (nodeName.indexOf('jqx-tooltip') >= 0) {
                var children = $(element).children();
                children.detach();
                $(children).insertAfter($(element));
                $.each(attributes, function () {
                    if ($(children)[0]) {
                        $(children)[0].setAttribute(this.name, this.value);
                    }
                });
                $(element).remove();
                element = children;
            }
            else {
                $(element).replaceWith(htmlstring);
            }
            newElement = parent.find('#jqx-ngwidget').removeAttr('id');

            $.each(attributes, function () {
                if ($(newElement)[0]) {
                    $(newElement)[0].setAttribute(this.name, this.value);
                }
            });
        }
        var elementToWatch = element[0];
        if (newElement && newElement.length)
            elementToWatch = newElement[0];

        var that = this;
        if (elementToWatch.id == "") {
            if (undefined == JQWIDGETS_UID[name]) {
                JQWIDGETS_UID[name] = 0;
            }
            elementToWatch.id = name + JQWIDGETS_UID[name]++;
        }

        $.each(attrs, function (index, value) {
            if (index !== name && index != "jqxNgModel" && index.indexOf('jqxOn') == -1 && index != "jqxData" && index != "jqxWatchSettings" && index != "jqxCreated" && index != "jqxSource" && index != "jqxCreate" && index != "jqxSettings" && index.indexOf('jqx') >= 0) {
                if (!watchers[elementToWatch.id]) {
                    watchers[elementToWatch.id] = new Array();
                }
                watchers[elementToWatch.id].push({ label: index, value: attrs.$attr[index] });
            }
        });
        return $(elementToWatch);
    }

    function AMD(name, properties) {
        function addScript(files) {
            properties.filesCount = 0;
            var totalFilesCount = files.length;
            if (files['scripts']) {
                var count = files['scripts'].length;
                for (var dep in files['deps']) {
                    count++;
                    var dependencies = files['deps'][dep];
                    count += dependencies.length;
                }
                totalFilesCount = count;
            }

            var processFiles = function (files, loadedFunc) {
                var fileNameIndex = 0;
                var loadedFilesCount = 0;
                var loadFiles = function () {
                    var fileName = files[fileNameIndex];
                    var len = $('script[src*="' + fileName + '"]').length;

                    if (len === 0) {
                        var head = document.getElementsByTagName('head')[0];
                        var script = document.createElement('script');
                        script.type = 'text/javascript';
                        var loadFunc = function () {
                            properties.filesCount++;
                            loadedFilesCount++;
                            JQWIDGETS_LOADING_FILES[fileName] = false;
                            if (JQWIDGETS_LOADED_FILES[fileName] != undefined) {
                                $.each(JQWIDGETS_LOADED_FILES[fileName], function () {
                                    this.documentReady = true;
                                    if (this.scriptsLoaded) {
                                        this.scriptsLoaded();
                                    }
                                });
                            }

                            JQWIDGETS_LOADED_FILES[fileName] = true;
                            if (properties.filesCount == totalFilesCount) {
                                properties.documentReady = true;
                                if (properties.scriptsLoaded) {
                                    properties.scriptsLoaded();
                                }
                                return;
                            }

                            if (loadedFilesCount === files.length && loadedFunc) {
                                loadedFunc();
                            }
                        };

                        if (script.addEventListener)
                            script.addEventListener('load', loadFunc, false);
                        else {
                            if (window.attachEvent) {
                                script.attachEvent('onreadystatechange', function () {
                                    if (script.readyState == 'complete' || script.readyState == 'loaded')
                                        loadFunc();
                                });
                            }
                        }

                        JQWIDGETS_LOADING_FILES[fileName] = true;
                        var path = pluginURL;
                        if (fileName == "globalize.js") path = pluginURL + "globalization/";
                        script.src = path + fileName;
                        head.appendChild(script);
                        fileNameIndex++;
                        if (fileNameIndex < files.length) {
                            loadFiles();
                        }
                    }
                    else {
                        properties.filesCount++;
                        if (properties.filesCount == totalFilesCount) {
                            if (JQWIDGETS_LOADED_FILES[fileName] === true || JQWIDGETS_LOADING_FILES[fileName] === undefined) {
                                properties.documentReady = true;
                                if (properties.scriptsLoaded) {
                                    properties.scriptsLoaded();
                                }
                                return;
                            }
                            else {
                                if (JQWIDGETS_LOADED_FILES[fileName] == undefined) {
                                    JQWIDGETS_LOADED_FILES[fileName] = new Array();
                                }
                                JQWIDGETS_LOADED_FILES[fileName].push(properties);
                                return;
                            }
                        }
                        fileNameIndex++;
                        if (fileNameIndex < files.length) {
                            loadFiles();
                        }
                        loadedFilesCount++;
                        if (loadedFilesCount === files.length && loadedFunc) {
                            loadedFunc();
                        }
                    }
                }
                loadFiles();
            }

            if (!files['scripts']) {
                processFiles(files);
            }
            else {
                processFiles(files['scripts']);
                $.each(files['deps'], function (dep, dependencies) {
                    var filesToLoad = new Array();
                    filesToLoad.push(dep);
                    processFiles(filesToLoad, function () {
                        processFiles(dependencies);
                    });
                });
            }
        }

        var scripts = {
            "jqxCalendar": ['jqxdatetimeinput.js', 'jqxcalendar.js', 'jqxtooltip.js', 'globalize.js', 'jqxbuttons.js'],
            "jqxDateTimeInput": ['jqxdatetimeinput.js', 'jqxcalendar.js', 'jqxtooltip.js', 'globalize.js', 'jqxbuttons.js'],
            "jqxScheduler": ['jqxscheduler.js', 'jqxscheduler.api.js', 'jqxdate.js', 'jqxmenu.js', 'jqxwindow.js', 'jqxcheckbox.js', 'jqxnumberinput.js', 'jqxscrollbar.js', 'jqxlistbox.js', 'jqxdropdownlist.js', 'jqxinput.js', 'jqxradiobutton.js', 'jqxdatetimeinput.js', 'jqxcalendar.js', 'jqxtooltip.js', 'globalize.js', 'jqxbuttons.js'],
            "jqxListBox": ['jqxlistbox.js', 'jqxdata.js', 'jqxbuttons.js', 'jqxscrollbar.js'],
            "jqxComboBox": ['jqxlistbox.js', 'jqxdata.js', 'jqxbuttons.js', 'jqxscrollbar.js', 'jqxcombobox.js'],
            "jqxDropDownList": ['jqxlistbox.js', 'jqxdata.js', 'jqxbuttons.js', 'jqxscrollbar.js', 'jqxdropdownlist.js'],
            "jqxKanban": ['jqxkanban.js', 'jqxsortable.js'],
            "jqxSortable": ['jqxsortable.js'],
            "jqxKnob": ['jqxdraw.js', 'jqxknob.js'],
            "jqxGrid":
                {
                    'scripts': ['jqxdatetimeinput.js', 'jqxcalendar.js', 'jqxmenu.js', 'jqxtooltip.js', 'jqxscrollbar.js', 'jqxbuttons.js', 'jqxlistbox.js', 'jqxdropdownlist.js', 'jqxcombobox.js', 'jqxcheckbox.js', 'globalize.js'],
                    'deps': {
                        'jqxgrid.js': ['jqxgrid.selection.js', 'jqxgrid.filter.js', 'jqxgrid.sort.js', 'jqxgrid.storage.js', 'jqxgrid.grouping.js', 'jqxgrid.pager.js', 'jqxgrid.columnsresize.js', 'jqxgrid.columnsreorder.js', 'jqxgrid.edit.js', 'jqxgrid.export.js', 'jqxgrid.aggregates.js'],
                        'jqxdata.js': ['jqxdata.export.js']
                    }
                },
            "jqxDataTable":
                {
                    'scripts': ['jqxdatatable.js', 'jqxdatetimeinput.js', 'jqxcalendar.js', 'jqxmenu.js', 'jqxtooltip.js', 'jqxscrollbar.js', 'jqxbuttons.js', 'jqxlistbox.js', 'jqxdropdownlist.js', 'jqxcombobox.js', 'jqxcheckbox.js', 'globalize.js', 'jqxinput.js'],
                    'deps': {
                        'jqxdata.js': ['jqxdata.export.js']
                    }
                },
            "jqxTreeGrid":
             {
                 'scripts': ['jqxdatetimeinput.js', 'jqxcalendar.js', 'jqxmenu.js', 'jqxtooltip.js', 'jqxscrollbar.js', 'jqxbuttons.js', 'jqxlistbox.js', 'jqxdropdownlist.js', 'jqxcombobox.js', 'jqxcheckbox.js', 'globalize.js', 'jqxinput.js'],
                 'deps': {
                     'jqxdatatable.js': ['jqxtreegrid.js'],
                     'jqxdata.js': ['jqxdata.export.js']
                 }
             },
            "jqxDockingLayout":
             {
                 'scripts': ['jqxmenu.js'],
                 'deps': {
                     'jqxlayout.js': ['jqxdockinglayout.js']
                 }
             },
            "jqxCheckBox": ['jqxcheckbox.js'],
            "jqxRadioButton": ['jqxradiobutton.js'],
            "jqxBulletChart": ['jqxbulletchart.js', 'jqxtooltip.js'],
            "jqxRangeSelector": ['jqxrangeselector.js'],
            "jqxScrollView": ['jqxbuttons.js', 'jqxscrollview.js'],
            "jqxSwitchButton": ['jqxswitchbutton.js'],
            "jqxTouch": ['jqxtouch.js'],
            "jqxColorPicker": ['jqxcolorpicker.js'],
            "jqxInput": ['jqxinput.js'],
            "jqxTextArea": ['jqxtextarea.js', 'jqxbuttons.js', 'jqxscrollbar.js'],
            "jqxTagCloud": ['jqxtagcloud.js'],
            "jqxPopover": ['jqxpopover.js'],
            "jqxLayout": ['jqxlayout.js', 'jqxmenu.js', 'jqxwindow.js'],
            "jqxLoader": ['jqxloader.js'],
            "jqxResponsivePanel": ['jqxresponsivepanel.js'],
            "jqxEditor": ['jqxeditor.js'],
            "jqxNumberInput": ['jqxbuttons.js', 'jqxnumberinput.js'],
            "jqxMaskedInput": ['jqxmaskedinput.js'],
            "jqxSlider": ['jqxbuttons.js', 'jqxslider.js'],
            "jqxPanel": ['jqxbuttons.js', 'jqxscrollbar.js', 'jqxpanel.js'],
            "jqxButton": ['jqxbuttons.js'],
            "jqxLinkButton": ['jqxbuttons.js'],
            "jqxToggleButton": ['jqxbuttons.js'],
            "jqxRepeatButton": ['jqxbuttons.js'],
            "jqxDropDownButton": ['jqxdropdownbutton.js'],
            "jqxNotification": ['jqxnotification.js'],
            "jqxDockPanel": ['jqxdockpanel.js'],
            "jqxProgressBar": ['jqxprogressbar.js'],
            "jqxListMenu": ['jqxbuttons.js', 'jqxscrollbar.js', 'jqxpanel.js', 'jqxlistmenu.js'],
            "jqxTree": ['jqxbuttons.js', 'jqxscrollbar.js', 'jqxpanel.js', 'jqxtree.js', 'jqxdata.js'],
            "jqxMenu": ['jqxmenu.js', 'jqxdata.js'],
            "jqxTabs": ['jqxtabs.js', 'jqxbuttons.js'],
            "jqxDragDrop": ['jqxdragdrop.js'],
            "jqxDraw": ['jqxdraw.js'],
            "jqxWindow": ['jqxwindow.js'],
            "jqxDocking": ['jqxwindow.js', 'jqxdocking.js'],
            "jqxButtonGroup": ['jqxbuttons.js', 'jqxbuttongroup.js'],
            "jqxChart": ['jqxdata.js', 'jqxchart.js'],
            "jqxNavigationBar": ['jqxnavigationbar.js'],
            "jqxExpander": ['jqxexpander.js'],
            "jqxResponse": ['jqxresponse.js'],
            "jqxPasswordInput": ['jqxpasswordinput.js'],
            "jqxRating": ['jqxrating.js'],
            "jqxSplitter": ['jqxbuttons.js', 'jqxsplitter.js'],
            "jqxValidator": ['jqxvalidator.js'],
            "jqxTooltip": ['jqxtooltip.js'],
            "jqxGauge": ['jqxdraw.js', 'jqxgauge.js'],
            "jqxLinearGauge": ['jqxdraw.js', 'jqxgauge.js'],
            "jqxTreeMap": ['jqxtreemap.js'],
            "jqxRibbon": ['jqxbuttons.js', 'jqxribbon.js'],
            "jqxFormattedInput": ['jqxbuttons.js', 'jqxformattedinput.js'],
            "jqxComplexInput": ['jqxbuttons.js', 'jqxcomplexinput.js'],
            "jqxToolBar": ['jqxtoolbar.js'],
            "jqxFileUpload": ['jqxfileupload.js'],
            "jqxNavBar": ['jqxnavbar.js']
        }
        addScript(scripts[name]);
    }
    $.jqx.angularCompile = function (targetDom, htmlToCompile) {
        if (targetDom.length > 0) {
            targetDom = targetDom[0];
        }

        var domElement = angular.element(targetDom);
        var $injector = domElement.injector();
        if (htmlToCompile == undefined) {
            htmlToCompile = targetDom.innerHTML;
        }

        $injector.invoke(["$compile", "$rootScope", function ($compile, $rootScope) {
            //Get the scope of the target, use the rootScope if it does not exists
            var $scope = domElement.html(htmlToCompile).scope();
            $compile(domElement)($scope || $rootScope);
            if (!/^\$(digest|apply)$/.test($rootScope.$$phase)) {
                $rootScope.$digest();
            }
            else if (!/^\$(digest|apply)$/.test($scope.$$phase)) {
                $scope.$digest();
            }
        }]);
    }

    function addDirective(name) {
        var properties = {};
        var linkFunction = function (scope, element, attrs, controllers, transclude) {
            if ($(element).attr('data-jqx-ng-include')) {
                $(element).removeAttr('data-jqx-ng-include');
                var children = $(element.children()).detach();
                element = addTemplate(element, true, attrs, name);
                element.append(children);
                $compile(element)(scope);
                var toParentScope = true;
                for (var obj in attrs) {
                    if (obj.toString().indexOf('jqx') == -1) {
                        continue;
                    }

                    if (scope[attrs[obj]] != undefined) {
                        toParentScope = false;
                    }
                    if (attrs[obj].split(".").length > 1) {
                        var subProperties = attrs[obj].split(".");
                        for (var i = 0; i < subProperties.length; i++) {
                            if (scope[subProperties[i]] != undefined) {
                                toParentScope = false;
                            }
                        }
                    }
                }
                if (toParentScope && attrs.jqxSettings) {
                    if (!$parse(attrs.jqxSettings)(scope)) {
                        toParentScope = false;
                    }
                }

                if (toParentScope) {
                    scope = scope.$parent;
                }
            }

            if ($.jqx.AMD) {
                var properties = {};
                JQWIDGETS_LOADED_WIDGETS[name] = false;
                properties.documentReady = false;
                AMD(name, properties);
            }

            var visibility = element[0].style.visibility;
            var display = element[0].style.display;
            element[0].style.visibility = "hidden";
            element[0].style.display = "none";
            var parentScope = scope;
            var stop = $interval(function () {
                $interval.cancel(stop);
                stop = undefined;

                var createWidget = function () {
                    var ngModel = controllers[0];
                    element[0].style.visibility = visibility;
                    element[0].style.display = display;
                    var widget = createInstance(scope, element, attrs, name, parentScope);
                    var lowerName = name.toLowerCase();
                    var isInput = name.match(/(input|list|radio|checkbox|combobox|rating|slider|scrollbar|progress|range|editor|picker|range|gauge|textarea|calendar|switch|button)/ig);

                    var args = { element: element[0], name: name, instance: $(element).data().jqxWidget, id: element[0].id, scope: scope };
                    var raiseCreated = function () {
                        scope.$emit(name + 'Created', args);
                        if (attrs.jqxSettings && $parse(attrs.jqxSettings)(scope) && $parse(attrs.jqxSettings)(scope).created) {
                            $timeout(function () {
                                var created = $parse(attrs.jqxSettings)(scope).created;
                                created(args);
                            });
                        }
                        if (attrs.jqxCreated) {
                            $timeout(function () {
                                var created = $parse(attrs['jqxCreated'])(scope);
                                created(args);
                            });
                        }
                    }
                    if (name === "jqxGrid" || name === "jqxDataTable") {
                        var intervalCount = 0;
                        var stopInterval = $interval(function () {
                            if (!$(element).data().jqxWidget) {
                                $interval.cancel(stopInterval);
                                stopInterval = undefined;
                            }
                            else {
                                if ($(element).data().jqxWidget.initializedcall || intervalCount == 25) {
                                    $interval.cancel(stopInterval);
                                    stopInterval = undefined;
                                    raiseCreated();
                                }
                            }
                            intervalCount++;
                        }, 100);
                    }
                    else {
                        raiseCreated();
                    }

                    $timeout(function update() {
                        if (ngModel) {
                            ngModel.$render = function () {
                                var val = ngModel.$viewValue;
                                if (val === undefined) {
                                    val = ngModel.$modelValue;
                                }

                                if (name === "jqxRadioButton") {
                                    if (scope.$eval($(element).attr('value')) == ngModel.$viewValue) {
                                        $(element).val(true);
                                    }
                                    else if (scope.$eval($(element).attr('value')) == "true" && ngModel.$viewValue == true) {
                                        $(element).val(true);
                                    }
                                    else {
                                        $(element).val(false);
                                    }
                                    return;
                                }
                                else if (name === "jqxCheckBox") {
                                    if (scope.$eval($(element).attr('ng-true-value')) == ngModel.$viewValue) {
                                        $(element).val(true);
                                    }
                                    if (scope.$eval($(element).attr('ng-false-value')) == ngModel.$viewValue) {
                                        $(element).val(false);
                                    }
                                    else {
                                        $(element).val(ngModel.$viewValue);
                                    }
                                    return;
                                }

                                if (val != $(element).val()) {
                                    $timeout(function () {
                                        $(element).val(val);
                                    });
                                }
                            };

                            if (name === "jqxRadioButton") {
                                if (scope.$eval($(element).attr('value')) == ngModel.$viewValue) {
                                    $(element).val(true);
                                }
                                else if (scope.$eval($(element).attr('value')) == "true" && ngModel.$viewValue == true) {
                                    $(element).val(true);
                                }
                                else {
                                    $(element).val(false);
                                }
                            }
                            else if (name === "jqxCheckBox") {
                                if (scope.$eval($(element).attr('ng-true-value')) == ngModel.$viewValue) {
                                    $(element).val(true);
                                }
                                if (scope.$eval($(element).attr('ng-false-value')) == ngModel.$viewValue) {
                                    $(element).val(false);
                                }
                                else {
                                    $(element).val(ngModel.$viewValue);
                                }
                            }
                            else if (name === "jqxDropDownList" || name === "jqxComboBox" || name === "jqxListBox" || name === "jqxInput" || name === "jqxTextArea") {
                                if (attrs.jqxNgModel != undefined) {
                                    var instance = $(element).data().jqxWidget;
                                    if (name != "jqxInput") {
                                        if (instance.valueMember) {
                                            instance.selectItem(ngModel.$viewValue[instance.valueMember]);
                                        }
                                        else if (instance.displayMember) {
                                            instance.selectItem(ngModel.$viewValue[instance.displayMember]);
                                        }
                                        else {
                                            $(element).val(ngModel.$viewValue);
                                        }
                                    }
                                    else {
                                        $(element).val(ngModel.$viewValue);
                                    }
                                }
                                else {
                                    $(element).val(ngModel.$viewValue);
                                }
                            }
                            else if (name === "jqxDateTimeInput" || name === "jqxCalendar") {
                                if (attrs.jqxNgModel != undefined) {
                                    var instance = $(element).data().jqxWidget;
                                    if (instance.selectionMode == "range") {
                                        instance.setRange(ngModel.$viewValue);
                                    }
                                    else {
                                        instance.setDate(ngModel.$viewValue);
                                    }
                                }
                                else {
                                    $(element).val(ngModel.$viewValue);
                                }
                            }
                            else if (name == "jqxToggleButton") {
                                var instance = $(element).data().jqxWidget;
                                instance.toggled = true;
                                instance.refresh();
                            }
                            else {
                                $(element).val(ngModel.$viewValue);
                            }
                        
                            if (isInput) {
                                var eventList = 'keyup change';
                                if (name == "jqxScrollBar")
                                    eventList = "valueChanged";
                                if (name == "jqxToggleButton") {
                                    eventList = "keyup click";
                                }
                                if (name == "jqxInput") {
                                    eventList = "keyup change select";
                                }
                                var promise;
                                var host = widget.host;
                                if (!host && widget.base) {
                                    host = widget.base.host;
                                }
                                $(host).on(eventList, function (event) {
                                    var args = event.args;
                                    if (promise){
                                        $timeout.cancel(promise);
                                    }
                                    promise = $timeout(function () {
                                        if (name === "jqxRadioButton") {
                                            if (args && args.type != "api") {
                                                ngModel.$setViewValue(scope.$eval($(element).attr('value')));
                                            }
                                        }
                                        else if (name === "jqxCheckBox") {
                                            if ($(element).attr('ng-true-value') != undefined && args.checked) {
                                                ngModel.$setViewValue($(element).attr('ng-true-value'));
                                            }
                                            else if ($(element).attr('ng-false-value') != undefined && !args.checked) {
                                                ngModel.$setViewValue($(element).attr('ng-false-value'));
                                            }
                                            else {
                                                ngModel.$setViewValue($(element).val());
                                            }
                                        }
                                        else if (name === "jqxDropDownList" || name === "jqxComboBox" || name === "jqxListBox" || name === "jqxInput" || name === "jqxTextArea") {
                                            var val = $(element).val();
                                            if (attrs.jqxNgModel != undefined) {
                                                var instance = $(element).data().jqxWidget;
                                                if (instance.getSelectedItem) {
                                                    val = instance.getSelectedItem();
                                                    if (val.originalItem)
                                                        val = val.originalItem;
                                                }
                                                if (name === "jqxInput"|| name === "jqxTextArea") {
                                                    val = instance.selectedItem;
                                                }
                                                ngModel.$setViewValue(val);
                                            }
                                            else {
                                                ngModel.$setViewValue(val);
                                            }
                                        }
                                        else if (name === "jqxDateTimeInput" || name === "jqxCalendar") {
                                            if (attrs.jqxNgModel != undefined) {
                                                var instance = $(element).data().jqxWidget;
                                                if (instance.selectionMode == "range") {
                                                    ngModel.$setViewValue(instance.getRange());
                                                }
                                                else {
                                                    ngModel.$setViewValue(instance.getDate());
                                                }
                                            }
                                            else {
                                                if ($.type(ngModel.$viewValue) === "date") {
                                                    var instance = $(element).data().jqxWidget;
                                                    if (instance.selectionMode == "range") {
                                                        ngModel.$setViewValue(instance.getRange());
                                                    }
                                                    else {
                                                        ngModel.$setViewValue(instance.getDate());
                                                    }
                                                }
                                                else {
                                                    ngModel.$setViewValue($(element).val());
                                                }
                                            }
                                        }
                                        else if (name == "jqxToggleButton") {
                                            var instance = $(element).data().jqxWidget;
                                            ngModel.$setViewValue(instance.toggled);
                                        }
                                        else {
                                            ngModel.$setViewValue($(element).val());
                                        }
                                        scope.$emit(name + 'ModelChange', ngModel.$viewValue);
                                    });
                                });
                            }                       
                        }
                    });
                }

                if (attrs.ngShow !== undefined && attrs.jqxCreate === undefined) {
                    var unregister = scope.$watch(attrs["ngShow"], function (newObj, oldObj) {
                        if (newObj) {
                            createWidget();
                            unregister();
                        }
                    });
                    return;
                }

                var createWidgetsWhenReady = function () {
                    if (attrs.jqxCreate != null || attrs.jqxCreate != null) {
                        if (attrs.jqxCreate === true || (attrs.jqxCreate !== null && $.type(attrs.jqxCreate) == "object")) {
                            createWidget();
                        }
                        else {
                            var unregister = scope.$watch(attrs["jqxCreate"], function (newObj, oldObj) {
                                if (typeof newObj == "number") {
                                    $timeout(createWidget, newObj);
                                    unregister();
                                }
                                else if (newObj) {
                                    createWidget();
                                    unregister();
                                }
                            });
                        }
                    }
                    else {
                        createWidget();
                    }
                }
                if ($.jqx.AMD) {
                    var raiseLoaded = function () {
                        var allLoaded = true;
                        for (var widgetName in JQWIDGETS_LOADED_WIDGETS) {
                            if (!JQWIDGETS_LOADED_WIDGETS[widgetName]) {
                                allLoaded = false;
                                break;
                            }
                        }
                        if (allLoaded) {
                            if (!allScriptsLoaded) {
                                scope.$emit('jQWidgetsScriptsLoaded');
                                allScriptsLoaded = true;
                            }
                            for (var widgetName in JQWIDGETS_LOADED_WIDGETS) {
                                $.each(JQWIDGETS_LOADED_WIDGETS[widgetName], function () {
                                    this();
                                });
                                JQWIDGETS_LOADED_WIDGETS[widgetName] = new Array();
                            }
                        }
                    }
                    if (properties.documentReady) {
                        var args = { element: element[0], name: name, scope: scope };
                        scope.$emit(name + 'ScriptsLoaded', args);
                        if (!JQWIDGETS_LOADED_WIDGETS[name]) {
                            JQWIDGETS_LOADED_WIDGETS[name] = new Array();
                        }

                        JQWIDGETS_LOADED_WIDGETS[name].push(createWidgetsWhenReady);
                        raiseLoaded();
                    }
                    else {
                        properties.scriptsLoaded = function () {
                            var args = { element: element[0], name: name, scope: scope };
                            scope.$emit(name + 'ScriptsLoaded', args);
                            if (!JQWIDGETS_LOADED_WIDGETS[name]) {
                                JQWIDGETS_LOADED_WIDGETS[name] = new Array();
                            }

                            JQWIDGETS_LOADED_WIDGETS[name].push(createWidgetsWhenReady);
                            raiseLoaded();
                        };
                    }
                }
                else {
                    createWidgetsWhenReady();
                }
            });
        }

        module.directive(name,
        ['$timeout', '$interval', '$parse', '$compile', '$log', function (timeout, interval, parse, compile, log) {
            $timeout = timeout;
            $interval = interval;
            $parse = parse;
            $compile = compile;
            $log = log;
            var properties = {};
            var directiveScope;
            return {
                restrict: "ACE",
                require: ["?ngModel"],
                scope: false,
                template: function (element, attrs) {
                    addTemplate(element, false, attrs, name);
                    directiveScope = this.scope;
                },
                controller: ['$scope', '$attrs', '$element', '$transclude', function ($scope, $attrs, $element, $transclude) {
   
                }],
                compile: function ($element, $attrs, linker) {
                    return {
                        pre: function ($scope, $element, $attrs, $controllers, $transclude) {
                        },
                        post: function ($scope, $element, $attrs, $controllers, $transclude) {
                            linkFunction($scope, $element, $attrs, $controllers, $transclude);
                        }
                    }
                },
                link: linkFunction
            };
        }]);
    }

    addDirective("jqxBulletChart");
    addDirective("jqxButtonGroup");
    addDirective("jqxButton");
    addDirective("jqxBarGauge");
    addDirective("jqxRepeatButton");
    addDirective("jqxToggleButton");
    addDirective("jqxLinkButton");
    addDirective("jqxCalendar");
    addDirective("jqxChart");
    addDirective("jqxCheckBox");
    addDirective("jqxComplexInput");
    addDirective("jqxColorPicker");
    addDirective("jqxComboBox");
    addDirective("jqxDataTable");
    addDirective("jqxDateTimeInput");
    addDirective("jqxDocking");
    addDirective("jqxDockPanel");
    addDirective("jqxDragDrop");
    addDirective("jqxDraw");
    addDirective("jqxDropDownButton");
    addDirective("jqxDropDownList");
    addDirective("jqxEditor");
    addDirective("jqxExpander");
    addDirective("jqxFormattedInput");
    addDirective("jqxFileUpload");
    addDirective("jqxGauge");
    addDirective("jqxLinearGauge");
    addDirective("jqxGrid");
    addDirective("jqxInput");
    addDirective("jqxListBox");
    addDirective("jqxListMenu");
    addDirective("jqxMaskedInput");
    addDirective("jqxMenu");
    addDirective("jqxNavigationBar");
    addDirective("jqxNavBar");
    addDirective("jqxNotification");
    addDirective("jqxNumberInput");
    addDirective("jqxPanel");
    addDirective("jqxPasswordInput");
    addDirective("jqxProgressBar");
    addDirective("jqxRadioButton");
    addDirective("jqxRangeSelector");
    addDirective("jqxRating");
    addDirective("jqxRibbon");
    addDirective("jqxScrollBar");
    addDirective("jqxScrollView");
    addDirective("jqxSlider");
    addDirective("jqxSplitter");
    addDirective("jqxSwitchButton");
    addDirective("jqxTabs");
    addDirective("jqxToolBar");
    addDirective("jqxTooltip");
    addDirective("jqxTouch");
    addDirective("jqxTree");
    addDirective("jqxTreeGrid");
    addDirective("jqxTreeMap");
    addDirective("jqxValidator");
    addDirective("jqxWindow");
    addDirective("jqxTagCloud");
    addDirective("jqxPopover");
    addDirective("jqxKanban");
    addDirective("jqxKnob");
    addDirective("jqxSortablePlugin");
    addDirective("jqxScheduler");
    addDirective("jqxTextArea");
    addDirective("jqxLayout");
    addDirective("jqxDockingLayout");
    addDirective("jqxResponsivePanel");
    addDirective("jqxLoader");
})(jqxBaseFramework, window.angular);