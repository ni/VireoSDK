/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    'use strict';

    if (!$.jqx.scheduler) {
        $.jqx.scheduler = {};
    }

    $.jqx.scheduler.utilities = {
        weekDays:
        {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6
        },

        guid: function () {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                  .toString(16)
                  .substring(1);
            }
            return s4() + s4();
        },

        areWeekDaysIncluded: function (days, day) {
            var result = false;
            $.each(days, function (index, value) {
                if (value === day) {
                    result = true;
                    return false;
                }
            });
            return result;
        },

        getStartOfDay: function (date) {
            var newDate = new $.jqx.date(date.year(), date.month(), date.day(), 0, 0, 0);
            newDate.timeZone = date.timeZone;
            return newDate;
        },

        getEndOfDay: function (date) {
            var newDate = new $.jqx.date(date.year(), date.month(), date.day(), 23, 59, 59);
            newDate.timeZone = date.timeZone;
            return newDate;
        },

        getDaysCount: function (from, to) {
            var daysCount = 1;

            while (from < to) {
                if (from.day() != to.day()) {
                    daysCount++;
                }

                from = from.addDays(1);
            }
            return daysCount;
        },

        getStartOfWeek: function (date, calendar) {
            var dayOfWeek = date.dayOfWeek()
            var firstDayOfWeek = calendar.firstDay;
            if (dayOfWeek < firstDayOfWeek) {
                dayOfWeek += 7;
            }
            var daysToSubtract = dayOfWeek - firstDayOfWeek;

            var startOfWeekDate = date.addDays(-daysToSubtract);
            return startOfWeekDate.date();
        },

        getEndOfWeek: function (date, calendar, weekStart) {
            var daysPerWeek = 7;
            var startOfWeek = that.getStartOfWeek(date, dateTimeFormat, weekStart);
            return startOfWeek.addDays(daysPerWeek);
        },

        getEndOfMonth: function (date, calendar) {
            var daysInMonth = date.daysInMonth();
            var newDate = new $.jqx.date(date.year(), date.month(), daysInMonth, 23, 59, 59);
            newDate.timeZone = date.timeZone;
            return newDate;
        },

        rangeIntersection: function (from1, to1, from2, to2) {
            var from1Value = from1.valueOf();
            var from2Value = from2.valueOf();
            var to1Value = to1.valueOf();
            var to2Value = to2.valueOf();

            if (from2Value >= from1Value && from2Value < to1Value) {
                return true;
            }

            if (from2Value < from1Value && to2Value > from1Value) {
                return true;
            }

            if (from1Value == from2Value || to1Value == to2Value)
                return true; // If any set is the same time, then by default there must be some overlap. 


            if (from1Value < from2Value) {
                if (to1Value > from2Value && to1Value < to2Value)
                    return true; // Condition 1

                if (to1Value > to2Value)
                    return true; // Condition 3
            }
            else {
                if (to2Value > from1Value && to2Value < to1Value)
                    return true; // Condition 2

                if (to2Value > to1Value)
                    return true; // Condition 4
            }

            return false;
        },

        rangeContains: function (from1, to1, from2, to2) {
            return (from1 <= from2 && to2 <= to1);
        },

        monthDays: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        // Number of milliseconds of one day
        msPerDay: 1000 * 60 * 60 * 24,
        maxYear: 9999,
        ORDINAL_BASE: new Date(1970, 0, 1),

        getYearDay: function (date) {
            var dateNoTime = new Date(
                date.getFullYear(), date.getMonth(), date.getDate());
            return Math.ceil(
                (dateNoTime - new Date(date.getFullYear(), 0, 1))
                / $.jqx.scheduler.utilities.msPerDay) + 1;
        },

        isLeapYear: function (year) {
            if (year instanceof Date) {
                year = year.getFullYear();
            }
            return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
        },

        tzOffset: function (date) {
            return date.getTimezoneOffset() * 60 * 1000
        },

        monthRange: function (year, month) {
            var date = new Date(year, month, 1);
            return [$.jqx.scheduler.utilities.getWeekday(date), $.jqx.scheduler.utilities.getMonthDays(date)];
        },

        getMonthDays: function (date) {
            var month = date.getMonth();
            return month == 1 && $.jqx.scheduler.utilities.isLeapYear(date)
                ? 29
                : $.jqx.scheduler.utilities.monthDays[month];
        },

        getWeekday: function (date) {
            var weekDays = [6, 0, 1, 2, 3, 4, 5];
            return weekDays[date.getDay()];
        },

        combine: function (date, time) {
            time = time || date;
            return new Date(
                date.getFullYear(), date.getMonth(), date.getDate(),
                time.getHours(), time.getMinutes(), time.getSeconds()
            );
        },

        sort: function (dates) {
            dates.sort(function (a, b) {
                return a.getTime() - b.getTime();
            });
        },

        timeToUntilString: function (time) {
            var date = new Date(time);
            var comp, comps = [
                date.getUTCFullYear(),
                date.getUTCMonth() + 1,
                date.getUTCDate(),
                'T',
                date.getUTCHours(),
                date.getUTCMinutes(),
                date.getUTCSeconds(),
                'Z'
            ];
            for (var i = 0; i < comps.length; i++) {
                comp = comps[i];
                if (!/[TZ]/.test(comp) && comp < 10) {
                    comps[i] = '0' + String(comp);
                }
            }
            return comps.join('');
        },

        untilStringToDate: function (until) {
            var re = /^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z)?$/;
            var bits = re.exec(until);
            if (!bits) {
                throw new Error('Invalid UNTIL value: ' + until)
            }
            return new Date(
                Date.UTC(bits[1],
                bits[2] - 1,
                bits[3],
                bits[5] || 0,
                bits[6] || 0,
                bits[7] || 0
            ));
        },

        Time: function (hour, minute, second) {
            this.hour = hour;
            this.minute = minute;
            this.second = second;
            this.that = this;
            this.getHours = function () {
                return that.hour;
            }

            this.getMinutes = function () {
                return that.minute;
            },

            this.getSeconds = function () {
                return that.second;
            },

            this.getTime = function () {
                return ((that.hour * 60 * 60)
                         + (that.minute * 60)
                         + that.second)
                       * 1000;
            }
        }
    }

    $.jqx.scheduler.appointment = function () {
        var that = this;
        that.from = new $.jqx.date();
        that.to = new $.jqx.date().addHours(1);
        that.subject = "";
        that.description = "";
        that.location = "";
        that.tooltip = "";
        that.hidden = false;
        that.resourceId = null;
        that.id = "";
        that.background = null;
        that.color = null;
        that.borderColor = null;
        that.status = "busy";
        that.style = null;
        that.exceptions = new Array();
        that.exceptionDates = new Array();
        that.recurrencePattern = null;
        that.recurrenceException = new Array();
        that.occurrenceEnumerator = null;
        that.rootAppointment = null;
        that.hiddenByResourceId = false;
        that.draggable = true;
        that.resizable = true;
        that.recurrentAppointment = false;
        that.allDay = false;
        that.readOnly = false;
        that.showStatus = true;
        that.timeZone = null;
        that.scheduler = null;
        that.elements = new Array();
        that.duration = function () {
            var milliseconds = that.to - that.from;
            var ticks = milliseconds * 10000;
            return new $.jqx.timeSpan(ticks);
        }

        that.toString = function (local) {
            var charsLimit = function (text) {
                var out = '';
                while (text.length > 75) {
                    out += text.substr(0, 75) + '\n';
                    text = ' ' + text.substr(75);
                }
                out += text;
                return out;
            };
            var _formatNumber = function (value) {
                return (value < 10 ? '0' : '') + value;
            }

            var formatDateTime = function (dateTime, local) {
                return (!dateTime ? '' : (local ?
                    '' + dateTime.getFullYear() + _formatNumber(dateTime.getMonth() + 1) +
                    _formatNumber(dateTime.getDate()) + 'T' + _formatNumber(dateTime.getHours()) +
                    _formatNumber(dateTime.getMinutes()) + _formatNumber(dateTime.getSeconds()) :
                    '' + dateTime.getUTCFullYear() + _formatNumber(dateTime.getUTCMonth() + 1) +
                    _formatNumber(dateTime.getUTCDate()) + 'T' + _formatNumber(dateTime.getUTCHours()) +
                    _formatNumber(dateTime.getUTCMinutes()) + _formatNumber(dateTime.getUTCSeconds()) + 'Z'));
            }

            var exceptions = function () {
                var result = "";
                for (var i = 0; i < that.recurrenceException.length; i++) {
                    result += formatDateTime(that.recurrenceException[i].toDate(), local);
                    if (i < that.recurrenceException.length - 1)
                        result += ",";
                }
                return result;
            }

            var status = that.status;
            if (!status) status = "CONFIRMED";
            if (status.toLowerCase() == "busy") status = "CONFIRMED";
            if (status.toLowerCase() == "tentative") status = "TENTATIVE";
            if (status.toLowerCase() == "free") status = "CANCELLED";
            if (status.toLowerCase() == "outOfOffice") status = "CANCELLED";

            return 'BEGIN:VEVENT\n' +
               'UID:' + that.id + '\n' +
               'DTSTAMP:' + formatDateTime(new Date(), local) + '\n' +
               charsLimit('TITLE:' + that.subject) + '\n' +
               'DTSTART:' + formatDateTime(that.from.toDate(), local) + '\n' +
               'DTEND:' + formatDateTime(that.to.toDate(), local) + '\n' +
               (that.recurrencePattern ? 'RRULE:' + that.recurrencePattern.toString() + '\n' : '') +
               (that.recurrenceException && that.recurrenceException.length > 0 ? 'EXDATE:' + exceptions() + '\n' : '') +
               (that.subject ? charsLimit('SUMMARY:' + that.subject) + '\n' : '') +
               'TRANSP:OPAQUE\n' +
               (that.status ? charsLimit('STATUS:' + status) + '\n' : '') +
               (that.description ? charsLimit('DESCRIPTION:' + that.description) + '\n' : '') +
               (that.location ? charsLimit('LOCATION:' + that.location) + '\n' : '') +
               'END:VEVENT';
        }

        that.range = function () {
            if (!that.allDay) {
                return { from: that.from, to: that.to };
            }
            else {
                return { from: $.jqx.scheduler.utilities.getStartOfDay(that.from), to: $.jqx.scheduler.utilities.getEndOfDay(that.to) }
            }
        }

        that.clearRecurrence = function () {
            if (that.recurrencePattern) {
                that.exceptions = new Array();
                that.exceptionDates = new Array();
                that.recurrencePattern = null;
                that.recurrenceException = new Array();
                that.hidden = false;
            }
        }

        that.isAllDayAppointment = function () {
            return this.duration().days() >= 1 || this.allDay;
        }

        that.cloneAppointmentAttributes = function (appointment) {
            appointment.subject = that.subject;
            appointment.description = that.description;
            appointment.location = that.location;
            appointment.tooltip = that.tooltip;
            appointment.resourceId = that.resourceId;
            appointment.category = that.category;
            appointment.status = that.status;
            appointment.rootAppointment = that;
            appointment.color = that.color;
            appointment.borderColor = that.borderColor;
            appointment.background = that.background;
            appointment.hidden = that.hidden;
            appointment.timezone = that.timeZone;
            appointment.style = that.style;
            appointment.hiddenByResourceId = that.hiddenByResourceId;
        }

        that.createOccurrence = function (from) {
            if (from == null)
                return null;

            var occurrence = new $.jqx.scheduler.appointment();
            occurrence.allDay = that.allDay;

            var duration = that.duration();
            if (that.allDay) {
                duration = new $.jqx.timeSpan(10000 * (that.to - that.from));
            }

            occurrence.from = from;
            occurrence.to = from.add(duration);
            occurrence.occurrenceFrom = from.clone();
            occurrence.subject = that.subject;
            occurrence.description = that.description;
            occurrence.location = that.location;
            occurrence.tooltip = that.tooltip;
            occurrence.resourceId = that.resourceId;
            occurrence.category = that.category;
            occurrence.status = that.status;
            occurrence.rootAppointment = that;
            occurrence.color = that.color;
            occurrence.draggable = that.draggable;
            occurrence.resizable = that.resizable;
            occurrence.borderColor = that.borderColor;
            occurrence.background = that.background;
            occurrence.recurrentAppointment = true;
            occurrence.timeZone = that.timeZone;
            occurrence.style = that.style;
            occurrence.hiddenByResourceId = that.hiddenByResourceId;
            if (that.hiddenByResourceId) {
                occurrence.hidden = true;
            }
            occurrence.id = that.id + "." + $.jqx.scheduler.utilities.guid();
            that.hidden = true;
            that.occurrenceIndex++;
            return occurrence;
        }

        that.clone = function () {
            var app = new $.jqx.scheduler.appointment();
            app.allDay = that.allDay;
            app.from = that.from.clone();
            app.to = that.to.clone();
            app.subject = that.subject;
            app.description = that.description;
            app.location = that.location;
            app.tooltip = that.tooltip;
            app.resourceId = that.resourceId;
            app.category = that.category;
            app.status = that.status;
            app.color = that.color;
            app.borderColor = that.borderColor;
            app.background = that.background;
            app.style = that.style;
            app.timeZone = that.timeZone;
            app.hiddenByResourceId = that.hiddenByResourceId;
            if (that.hiddenByResourceId) {
                app.hidden = true;
            }
            app.id = that.id + "." + $.jqx.scheduler.utilities.guid();
            return app;
        }

        that.isRecurrentAppointment = function () {
            return that.recurrentAppointment || that.recurrencePattern != null;
        }

        that.anyExceptions = function () {
            return that.exceptions != null && that.exceptions.length > 0;
        }

        that.anyOccurrences = function () {
            return that.occurrenceEnumerator != null && that.occurrenceEnumerator.getNextAppointment();
        }

        that.isException = function () {
            var rootAppointment = that.rootAppointment || this;
            if (!rootAppointment.recurrenceException)
                return false;

            for (var i = 0; i < rootAppointment.recurrenceException.length; i++) {
                var date = rootAppointment.recurrenceException[i];
                if (that.occurrenceFrom && date.equals(that.occurrenceFrom))
                    return true;
            }

            return false;
        }

        that.getOccurrences = function (from, to) {
            that.occurrenceIndex = 0;
            var start = from !== null ? from : that.from;
            var recurrenceList = new $.jqx.scheduler.recurrentAppointmentsList(that, that.calendar, start, to, that.scheduler);
            that.occurrences = recurrenceList.list;
            return recurrenceList.list;
        }

        if (arguments.length === 1) {
            if ($.type(arguments[0]) == "object") {
                for (var key in arguments[0]) {
                    var value = arguments[0][key];
                    if (this[key] !== undefined) {
                        this[key] = value;
                    }
                }
            }
            else {
                that.from = arguments[0];
                that.to = new $.jqx.date(that.from).addHours(1);
            }
        }
        else if (arguments.length === 2) {
            that.from = arguments[0];
            that.to = arguments[1];
        }
        else if (arguments.length === 3) {
            that.from = arguments[0];
            that.to = arguments[1];
            that.subject = arguments[2];
        }
        else if (arguments.length === 3) {
            that.from = arguments[0];
            that.to = arguments[1];
            that.subject = arguments[2];
            that.description = arguments[3];
        }
        if (that.recurrencePattern != null) {
            that.recurrencePattern.setFrom(that.from);
        }
    }

    $.jqx.scheduler.recurrentAppointmentsList = function () {
        var that = this;
        that.recurrentAppointment = null;
        that.currentTime = null;
        that.calendar = $.jqx.scheduler.calendar;
        that.from = new $.jqx.date(0);
        that.to = new $.jqx.date(9999, 12, 31);
        that.foundItems = 0;
        that.list = new Array();
        that.scheduler = null;

        that.getOccurrences = function (appointment, from, to) {
            if (appointment == undefined)
                return that.list;

            return new $.jqx.scheduler.recurrentAppointmentsList(appointment, that.calendar, from, to).list;
        }

        that.current = function () {
            return that.recurrentAppointment.createOccurrence(that.currentTime);
        }

        that.fillList = function () {
            that.currentTime = null;
            that.foundItems = 0;

            that.list = new Array();
            var pattern = that.recurrentAppointment.recurrencePattern;
            pattern.step = 0;
            pattern.current = 0;
            pattern.currentYearDay = 0;

            if (pattern == null) {
                return false;
            }

            while (that.getNextAppointment(pattern)) {
                var app = that.current();
                if (app) {
                    that.list.push(app);
                }
            }
        }


        that.getNextAppointment = function (pattern) {
            if (that.recurrentAppointment == null) {
                return false;
            }

            var MAX_INT = 4294967295;
            var view = this.scheduler._views[this.scheduler._view].type;
            var viewObject = this.scheduler._views[this.scheduler._view];

            var daysToAdd = 0;
            switch (pattern.freq) {
                case "weekly":
                    daysToAdd = 7;
                    break;
                case "monthly":
                    daysToAdd = 31;
                    break;
                case "yearly":
                    daysToAdd = 365;
                    break;
            }
            for (var i = 0; i < MAX_INT; i++) {
                var from = pattern.getNewOccurenceDate();
                pattern.currentTime = from;
                if ((pattern.to < from && pattern.to.addDays(daysToAdd) >= from) || (that.to < from && that.to.addDays(daysToAdd) >= from)) {
                    that.currentTime = null;
                    return true;
                }

                if (pattern.to.addDays(daysToAdd) < from || that.to.addDays(daysToAdd) < from) {
                    that.currentTime = null;
                    return false;
                }

                var canSetCurrentTime = true;
                canSetCurrentTime = that.getCanSetTime(pattern, from, canSetCurrentTime);

                if (pattern.canCreateNewOccurence(from, that.calendar)) {
                    var canAdd = true;
                    if (false === viewObject.showWeekends) {
                        if (from.dayOfWeek() == 6 || from.dayOfWeek() == 0)
                            canAdd = false;
                    }
                    if (canAdd) {
                        that.foundItems++;
                    }
                }
                if (!canSetCurrentTime)
                    continue;

                that.currentTime = from;

                if (that.foundItems > pattern.count)
                    return false;

                return true;
            }

            return false;
        }

        that.getCanSetTime = function (recurrencePattern, from, canSetCurrentTime) {
            if (!recurrencePattern.canCreateNewOccurence(from, that.calendar)) {
                canSetCurrentTime = false;
            }

            if (from < that.from && from.add(that.recurrentAppointment.duration()) <= that.from) {
                canSetCurrentTime = false;
            }

            if (that.to <= from) {
                canSetCurrentTime = false;
            }

            return canSetCurrentTime;
        }

        that.isException = function (ocurrenceStart, eventDuration, pattern) {
            var exceptions = that.recurrentAppointment.exceptions;
            for (var i = 0; i < exceptions.length; i++) {
                if (pattern.isDateInExceptionAppointment(ocurrenceStart, eventDuration, exceptions[i])) {
                    if (-1 === pattern.newExceptions.indexOf(exceptions[i])) {
                        return true;
                    }
                }
            }

            return false;
        }

        if (arguments && arguments.length > 0) {
            that.recurrentAppointment = arguments[0];
            if (arguments[1]) {
                that.calendar = arguments[1];
            }
            if (arguments[2]) {
                that.from = arguments[2];
            }

            if (arguments[3]) {
                that.to = arguments[3];
            }

            if (arguments[4]) {
                that.scheduler = arguments[4];
            }

            if (arguments[2] === undefined) {
                that.from = new $.jqx.date(0);
                that.to = new $.jqx.date(9999, 12, 31);
            }
            that.fillList();
        }

        return that;
    }

    $.jqx.scheduler.recurrencePattern = function () {
        var that = this;
        var settings =
            {
                from: new $.jqx.date(0),
                to: new $.jqx.date(9999, 12, 31),
                count: 1000,
                interval: 1,
                exceptions: new Array(),
                newExceptions: new Array(),
                month: 1,
                day: 1,
                current: 0,
                currentYearDay: 0,
                step: 0,
                days: [],
                bynweekday: [],
                isEveryWeekDay: true,
                timeZone: null,
                weekDays: {
                    Sunday: 0,
                    Monday: 1,
                    Tuesday: 2,
                    Wednesday: 3,
                    Thursday: 4,
                    Friday: 5,
                    Saturday: 6
                },
                freq: "daily", // possible values: "daily", "weekly", "yearly", "monthly", "custom" 
                bymonth: null,
                bymonthday: null,
                byyearday: null,
                byweekno: null,
                byweekday: null
            }
        $.extend(true, that, settings);

        that.getNewOccurenceDate = function () {
            var repeat = function (value, times) {
                var i = 0, array = [];
                if (value instanceof Array) {
                    for (; i < times; i++) {
                        array[i] = [].concat(value);
                    }
                } else {
                    for (; i < times; i++) {
                        array[i] = value;
                    }
                }
                return array;
            };

            var module = function (a, b) {
                var r = a % b;
                // If r and b differ in sign, add b to wrap the result to the correct sign.
                return (r * b < 0) ? r + b : r;
            };
            var range = function (start, end) {
                if (arguments.length === 1) {
                    end = start;
                    start = 0;
                }
                var rang = [];
                for (var i = start; i < end; i++) {
                    rang.push(i);
                }
                return rang;
            };
            var M366RANGE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
            var M365RANGE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
            var year = that.from.year();
            var weekDays = [6, 0, 1, 2, 3, 4, 5];
            var recalculateMasks = function (year) {
                that.yearlen = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) ? 366 : 365;
                that.nextyearlen = (1 + year) % 4 == 0 && ((1 + year) % 100 != 0 || (1 + year) % 400 == 0) ? 366 : 365;
                var firstyday = new Date(year, 0, 1);
                var wday = weekDays[new Date(year, 0, 1).getDay()];

                var WDAYMASK = (function () {
                    for (var wdaymask = [], i = 0; i < 55; i++) {
                        wdaymask = wdaymask.concat(range(7));
                    }
                    return wdaymask;
                }());
                if (that.yearlen == 365) {
                    that.wdaymask = WDAYMASK.slice(wday);
                    that.mrange = [].concat(M365RANGE);
                } else {
                    that.wdaymask = WDAYMASK.slice(wday);
                    that.mrange = [].concat(M366RANGE);
                }
            }
            recalculateMasks(year);

            switch (that.freq) {
                case "daily":
                default:
                    var dateTime = that.from.add(new $.jqx.timeSpan(that.step * that.interval, 0, 0, 0));
                    that.step++;
                    return dateTime;
                case "weekly":
                    if (that.byweekday) {
                        var dateTime = new $.jqx.date(that.from, that.timeZone);
                        dateTime = dateTime.addDays(7 * (that.step * that.interval));
                        if (that.step >= 1) {
                            dateTime = dateTime.addDays(-that.from.dayOfWeek());
                            var endOfWeek = dateTime.addDays(7);
                        }
                        else {
                            var endOfWeek = dateTime.addDays(7 - that.from.dayOfWeek());
                        }
                        var tmpDate = dateTime;
                        for (var i = 0; i < 7; i++) {
                            if (weekDays[tmpDate.dayOfWeek()] === that.byweekday[that.current]) {
                                break;
                            }
                            if (tmpDate >= endOfWeek)
                                break;

                            tmpDate = tmpDate.addDays(1);
                        }
                        dateTime = tmpDate;
                        that.current++;
                        if (undefined == that.byweekday[that.current]) {
                            that.current = 0;
                            that.step++;
                        }
                    }
                    return dateTime;
                case "monthly":
                    if (that.bynweekday.length > 0) {
                        var dateTime = new $.jqx.date(that.from.year(), that.from.month(), 1, that.from.hour(), that.from.minute(), that.from.second());
                        dateTime.timeZone = that.timeZone;
                        dateTime = dateTime.addMonths(that.step * that.interval);
                        recalculateMasks(dateTime.year());
                        var month = dateTime.month();
                        var ranges = [that.mrange.slice(month - 1, month + 1)][0];
                        var first = ranges[0];
                        var last = ranges[1];
                        last -= 1;

                        that.nwdaymask = repeat(0, that.yearlen);
                        that.step++;

                        for (var k = 0; k < that.bynweekday.length; k++) {
                            var wday = that.bynweekday[k][0],
                                n = that.bynweekday[k][1];
                            if (n < 0) {
                                i = last + (n + 1) * 7;
                                i -= module(that.wdaymask[i] - wday, 7);
                            } else {
                                i = first + (n - 1) * 7;
                                i += module(7 - that.wdaymask[i] + wday, 7);
                            }
                            if (first <= i && i <= last) {
                                that.nwdaymask[i] = 1;
                            }
                        }
                        var dayInYear = i + 1;
                        var dayInMonth = dayInYear - first;
                        var dateTime = new $.jqx.date(that.from.year(), that.from.month(), dayInMonth, that.from.hour(), that.from.minute(), that.from.second());
                        dateTime.timeZone = that.timeZone;
                        dateTime = dateTime.addMonths((that.step - 1) * that.interval);
                    }
                    else if (that.bymonthday.length > 0) {
                        var dateTime = new $.jqx.date(that.from.year(), that.from.month(), that.bymonthday[that.current], that.from.hour(), that.from.minute(), that.from.second());
                        dateTime.timeZone = that.timeZone;
                        dateTime = dateTime.addMonths(that.step * that.interval);
                        that.current++;
                        if (!that.bymonthday[that.current]) {
                            that.current = 0;
                            that.step++;
                        }
                    }
                    else {
                        var dateTime = new $.jqx.date(that.from.year(), that.from.month(), that.day, that.from.hour(), that.from.minute(), that.from.second());
                        dateTime.timeZone = that.timeZone;
                        dateTime = dateTime.addMonths(that.step * that.interval);
                        that.step++;
                    }
                    return dateTime;
                case "yearly":
                    if (that.bymonth && that.bymonth.length > 0) {
                        if (that.bynweekday.length > 0) {
                            var dateTime = new $.jqx.date(that.from.year(), that.bymonth[that.current], 1, that.from.hour(), that.from.minute(), that.from.second());
                            dateTime.timeZone = that.timeZone;
                            dateTime = dateTime.addYears(that.step * that.interval);
                            recalculateMasks(dateTime.year());
                            var month = dateTime.month();
                            var ranges = [that.mrange.slice(month - 1, month + 1)][0];
                            var first = ranges[0];
                            var last = ranges[1];
                            last -= 1;

                            that.nwdaymask = repeat(0, that.yearlen);

                            for (var k = 0; k < that.bynweekday.length; k++) {
                                var wday = that.bynweekday[k][0],
                                    n = that.bynweekday[k][1];
                                if (n < 0) {
                                    i = last + (n + 1) * 7;
                                    i -= module(that.wdaymask[i] - wday, 7);
                                } else {
                                    i = first + (n - 1) * 7;
                                    i += module(7 - that.wdaymask[i] + wday, 7);
                                }
                                if (first <= i && i <= last) {
                                    that.nwdaymask[i] = 1;
                                }
                            }
                            var dayInYear = i + 1;
                            var dayInMonth = dayInYear - first;
                            dateTime = new $.jqx.date(dateTime.year(), that.bymonth[that.current], dayInMonth, that.from.hour(), that.from.minute(), that.from.second());
                            dateTime.timeZone = that.timeZone;
                            that.step++;
                        }
                        else if (that.byyearday.length > 0) {
                            var dateTime = new $.jqx.date(that.from.year(), that.bymonth[that.current], that.byyearday[that.currentYearDay], that.from.hour(), that.from.minute(), that.from.second());
                            dateTime.timeZone = that.timeZone;
                            dateTime = dateTime.addYears(that.step * that.interval);
                            that.currentYearDay++;
                            if (!that.byyearday[that.currentYearDay]) {
                                that.currentYearDay = 0;
                                that.current++;
                                if (!that.bymonth[that.current]) {
                                    that.current = 0;
                                    that.step++;
                                }
                            }
                        }
                        else {
                            var dateTime = new $.jqx.date(that.from.year(), that.bymonth[that.current], that.from.day(), that.from.hour(), that.from.minute(), that.from.second());
                            dateTime.timeZone = that.timeZone;
                            dateTime = dateTime.addYears(that.step * that.interval);
                            that.current++;
                            if (!that.bymonth[that.current]) {
                                that.current = 0;
                                that.step++;
                            }
                        }
                    }
                    else if (that.byyearday && that.byyearday.length > 0) {
                        var dateTime = new $.jqx.date(that.from.year(), that.from.month(), that.byyearday[that.current], that.from.hour(), that.from.minute(), that.from.second());
                        dateTime.timeZone = that.timeZone;
                        dateTime = dateTime.addYears(that.step * that.interval);
                        that.current++;
                        if (!that.byyearday[that.current]) {
                            that.current = 0;
                            that.step++;
                        }
                    }
                    else if (that.byweekno != null) {
                        var getDateByWeekOfYear = function (weekNum, date) {
                            var currentWeek = 1;
                            var dateTime = new $.jqx.date(date.year(), 1, 1, date.hour(), date.minute(), date.second());
                            dateTime.timeZone = that.timeZone;
                            while (currentWeek != weekNum) {
                                dateTime = dateTime.addDays(7);
                                currentWeek++;
                                if (currentWeek > 53)
                                    break;
                            }

                            while ($.jqx.scheduler.utilities.getWeekday(dateTime.toDate()) != that.wkst) {
                                dateTime = dateTime.addDays(1);
                            }
                            return dateTime;
                        }
                        var dateTime = that.from.addYears(that.step * that.interval);
                        dateTime = getDateByWeekOfYear(that.byweekno[that.current], dateTime);

                        if (that.byweekday) {
                            var tmpDate = dateTime;
                            for (var i = 0; i < 7; i++) {
                                if (weekDays[tmpDate.dayOfWeek()] === that.byweekday[that.currentYearDay]) {
                                    break;
                                }
                                tmpDate = tmpDate.addDays(1);
                            }
                            dateTime = tmpDate;

                            that.currentYearDay++;
                            if (!that.byweekday[that.currentYearDay]) {
                                that.currentYearDay = 0;
                                that.current++;
                                if (!that.byweekno[that.current]) {
                                    that.current = 0;
                                    that.step++;
                                }
                            }
                        }
                        else {
                            that.current++;
                            if (!that.byweekno[that.current]) {
                                that.current = 0;
                                that.step++;
                            }
                        }
                    }
                    else {
                        var dateTime = new $.jqx.date(that.from.year(), that.month, that.day, that.from.hour(), that.from.minute(), that.from.second());
                        dateTime.timeZone = that.timeZone;
                        dateTime = dateTime.addYears(that.step * that.interval);
                        that.step++;
                    }
                    return dateTime;
            }
        }

        that.isDateInExceptionAppointment = function (eventStart, eventDuration, exception) {
            switch (that.freq) {
                case "daily":
                case "weekly":
                default:
                    return eventStart.year() == exception.from.year() && eventStart.dayOfYear() == exception.from.dayOfYear();

            }
        }

        that.createNewPattern = function () {
            if (that.ical) {
                var pattern = new $.jqx.scheduler.recurrencePattern(that.ical);
                return pattern;
            }
            else {
                var pattern = new $.jqx.scheduler.recurrencePattern();
                pattern.from = that.from;
                pattern.to = that.to;
                pattern.count = that.count;
                pattern.interval = that.interval;
                pattern.exceptions = that.exceptions;
                pattern.newExceptions = that.newExceptions;
                pattern.weekDays = that.weekDays;
                pattern.isEveryWeekDay = that.isEveryWeekDay;
                pattern.month = that.month;
                pattern.day = that.day;
                pattern.current = that.current;
                pattern.currentYearDay = that.currentYearDay;
                pattern.step = that.step;
                pattern.days = that.days;
                pattern.bynweekday = that.bynweekday;
                pattern.bymonth = that.bymonth;
                pattern.bymonthday = that.bymonthday;
                pattern.byyearday = that.byyearday;
                pattern.byweekno = that.byweekno;
                pattern.byweekday = that.byweekday;
                pattern.freq = pattern.freq;
                pattern.timeZone = pattern.timeZone;
                return pattern;
            }
        }

        that.equals = function (otherPattern) {
            var result = that.from == otherPattern.from && that.to == otherPattern.to &&
                that.count === otherPattern.count && that.interval === otherPattern.interval && that.day === otherPattern.day &&
                that.month === otherPattern.month;

            return result;
        }

        that.isDayOfWeekIncluded = function (date) {
            var weekDay = date.dayOfWeek();
            return $.jqx.scheduler.utilities.areWeekDaysIncluded(that.weekDays, weekDay);
        }

        that.getWeekIndexFromDate = function (current, calendar) {
            var firstDayOfWeek = calendar.firstDay;
            var firstWeekStart = $.jqx.scheduler.utilities.getStartOfWeek(that.from, calendar, firstDayOfWeek);
            var fromStart = new $.jqx.timeSpan(current.subtract(firstWeekStart));

            return parseInt(fromStart.days() / 7);
        }

        that.canCreateNewOccurence = function (date, calendar) {
            var jsDate = date.toDate();
            switch (that.freq) {
                case "daily":
                default:
                    if (that.bymonth) {
                        if (that.bymonth.indexOf(date.month()) == -1) {
                            return false;
                        }
                    }

                    if (that.isEveryWeekDay) {
                        if (!that.isDayOfWeekIncluded(date, calendar)) {
                            return false;
                        }
                        else return true;
                    }
                    else return true;
                    break;
                case "weekly":
                    var weekIndex = that.getWeekIndexFromDate(date, calendar);

                    if (that.bymonth) {
                        if (that.bymonth.indexOf(date.month()) == -1) {
                            return false;
                        }
                    }

                    if ((weekIndex % that.interval) != 0) {
                        return false;
                    }

                    if (that.weekDays == {}) {
                        if (that.from.dayOfWeek() != start.dayOfWeek()) {
                            return false;
                        }
                    }
                    else if (!that.isDayOfWeekIncluded(date, calendar)) {
                        return false;
                    }
                    break;
                case "monthly":
                case "yearly":
                    if (that.bymonth) {
                        if (that.bymonth.indexOf(date.month()) == -1) {
                            return false;
                        }
                    }

                    if (date < that.from) {
                        return false;
                    }
                    break;
            }
            return true;
        }

        that.toString = function () {
            var ical = {};
            ical.dtstart = this.from.toDate();
            ical.until = this.to ? this.to.toDate() : null;
            ical.count = this.count;

            var patterns = {};
            patterns.YEARLY = 0;
            patterns.MONTHLY = 1;
            patterns.WEEKLY = 2;
            patterns.DAILY = 3;
            patterns.HOURLY = 4;
            patterns.MINUTELY = 5;
            patterns.SECONDLY = 6;

            ical.freq = patterns[this.freq.toUpperCase()];

            if (ical.freq == "YEARLY") {
                ical.bymonth = this.bymonth ? this.bymonth : new Array().push(this.month);
            }

            ical.byweekday = new Array();
            var days = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

            $.each(this.weekDays, function () {
                ical.byweekday.push(this);
            });
            if (this.byyearday != undefined) {
                ical.byyearday = this.byyearday;
            }
            if (this.byweekno != undefined) {
                ical.byweekno = this.byweekno;
            }
            ical.bymonthday = this.bymonthday;

            ical.wkst = days[this.wkst];
            ical.interval = this.interval;
            var icalRule = new $.jqx.ICalRule(ical);
            return icalRule.toString();
        }

        that.init = function (from) {
            var ical = new $.jqx.ICalRule(that.ical, from);
            var options = ical.options;
            that.from = options.dtstart ? new $.jqx.date(options.dtstart, that.timeZone) : that.from;
            that.count = options.count != undefined ? options.count : that.count;
            that.freq = ical.FREQUENCIES[options.freq].toLowerCase();
            that.interval = options.interval != undefined ? options.interval : that.interval;
            that.to = options.until ? new $.jqx.date(options.until, that.timeZone) : that.to;
            that.wkst = options.wkst;
            that.bymonth = options.bymonth;
            if (that.bymonth && that.bymonth.length > 0) {
                that.month = that.bymonth[0];
            }
            else {
                that.month = that.from.month();
            }
            that.day = that.from.day();

            if (options.byweekday != undefined) {
                var defaultWeekDays = {
                    Sunday: 0,
                    Monday: 1,
                    Tuesday: 2,
                    Wednesday: 3,
                    Thursday: 4,
                    Friday: 5,
                    Saturday: 6
                };
                that.weekDays = {};

                for (var i = 0; i < options.byweekday.length; i++) {
                    var day = options.byweekday[i];
                    switch (day) {
                        case 0:
                            that.weekDays.Monday = 1;
                            break;
                        case 1:
                            that.weekDays.Tuesday = 2;
                            break;
                        case 2:
                            that.weekDays.Wednesday = 3;
                            break;
                        case 3:
                            that.weekDays.Thursday = 4;
                            break;
                        case 4:
                            that.weekDays.Friday = 5;
                            break;
                        case 5:
                            that.weekDays.Saturday = 6;
                            break;
                        case 6:
                            that.weekDays.Sunday = 0;
                            break;
                    }
                }
                that.byweekday = options.byweekday;
            }

            that.byweekno = options.byweekno;
            if (options.bynweekday) {
                that.bynweekday = options.bynweekday;
            }
            if (options.bymonthday != undefined) {
                that.bymonthday = options.bymonthday.sort();
                if (that.bymonthday[0]) {
                    that.day = that.bymonthday[0];
                }
            }
            if (options.byyearday != undefined) {
                that.day = options.byyearday[0];
                that.byyearday = options.byyearday.sort();
            }
            return options;
        }

        that.setFrom = function (from) {
            that.from = from.clone();
            if (that.ical) {
                that.init(from);
            }
        }

        if (arguments.length == 1) {
            that.ical = arguments[0];
            that.init();
        }
        return that;
    }

    $.jqx.scheduler.calendar = {
        // separator of parts of a date (e.g. '/' in 11/05/1955)
        '/': "/",
        // separator of parts of a time (e.g. ':' in 05:44 PM)
        ':': ":",
        // the first day of the week (0 = Sunday, 1 = Monday, etc)
        firstDay: 0,
        days: {
            // full day names
            names: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            // abbreviated day names
            namesAbbr: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            // shortest day names
            namesShort: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
        },
        months: {
            // full month names (13 months for lunar calendards -- 13th month should be "" if not lunar)
            names: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", ""],
            // abbreviated month names
            namesAbbr: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", ""]
        },
        // AM and PM designators in one of these forms:
        // The usual view, and the upper and lower case versions
        //      [standard,lowercase,uppercase]
        // The culture does not use AM or PM (likely all standard date formats use 24 hour time)
        //      null
        AM: ["AM", "am", "AM"],
        PM: ["PM", "pm", "PM"],
        eras: [
        // eras in reverse chronological order.
        // name: the name of the era in this culture (e.g. A.D., C.E.)
        // start: when the era starts in ticks (gregorian, gmt), null if it is the earliest supported era.
        // offset: offset in years from gregorian calendar
            { "name": "A.D.", "start": null, "offset": 0 }
        ],
        twoDigitYearMax: 2029,
        patterns: {
            // short date pattern
            d: "M/d/yyyy",
            // long date pattern
            D: "dddd, MMMM dd, yyyy",
            // short time pattern
            t: "h:mm tt",
            // long time pattern
            T: "h:mm:ss tt",
            // long date, short time pattern
            f: "dddd, MMMM dd, yyyy h:mm tt",
            // long date, long time pattern
            F: "dddd, MMMM dd, yyyy h:mm:ss tt",
            // month/day pattern
            M: "MMMM dd",
            // month/year pattern
            Y: "yyyy MMMM",
            // S is a sortable format that does not vary by culture
            S: "yyyy\u0027-\u0027MM\u0027-\u0027dd\u0027T\u0027HH\u0027:\u0027mm\u0027:\u0027ss",
            // formatting of dates in MySQL DataBases
            ISO: "yyyy-MM-dd hh:mm:ss",
            ISO2: "yyyy-MM-dd HH:mm:ss",
            d1: "dd.MM.yyyy",
            d2: "dd-MM-yyyy",
            zone1: "yyyy-MM-ddTHH:mm:ss-HH:mm",
            zone2: "yyyy-MM-ddTHH:mm:ss+HH:mm",
            custom: "yyyy-MM-ddTHH:mm:ss.fff",
            custom2: "yyyy-MM-dd HH:mm:ss.fff"
        },
        percentsymbol: "%",
        currencysymbol: "$",
        currencysymbolposition: "before",
        decimalseparator: '.',
        thousandsseparator: ','
    };

    $.jqx.ICalRule = function (options, from) {
        var that = this;

        var range = function (start, end) {
            if (arguments.length === 1) {
                end = start;
                start = 0;
            }
            var rang = [];
            for (var i = start; i < end; i++) {
                rang.push(i);
            }
            return rang;
        };

        var repeat = function (value, times) {
            var i = 0, array = [];
            if (value instanceof Array) {
                for (; i < times; i++) {
                    array[i] = [].concat(value);
                }
            } else {
                for (; i < times; i++) {
                    array[i] = value;
                }
            }
            return array;
        };

        var isBoolean = function (obj) {
            return (obj instanceof Array && obj.length == 0)
                ? false
                : Boolean(obj);
        };

        var contains = function (arr, val) {
            return arr.indexOf(val) != -1;
        };

        var M365MASK = [].concat(
            repeat(1, 31), repeat(2, 28), repeat(3, 31),
            repeat(4, 30), repeat(5, 31), repeat(6, 30),
            repeat(7, 31), repeat(8, 31), repeat(9, 30),
            repeat(10, 31), repeat(11, 30), repeat(12, 31),
            repeat(1, 7)
        );
        var M366MASK = [].concat(
            repeat(1, 31), repeat(2, 29), repeat(3, 31),
            repeat(4, 30), repeat(5, 31), repeat(6, 30),
            repeat(7, 31), repeat(8, 31), repeat(9, 30),
            repeat(10, 31), repeat(11, 30), repeat(12, 31),
            repeat(1, 7)
        );

        var
            M28 = range(1, 29),
            M29 = range(1, 30),
            M30 = range(1, 31),
            M31 = range(1, 32);
        var MDAY366MASK = [].concat(
            M31, M29, M31,
            M30, M31, M30,
            M31, M31, M30,
            M31, M30, M31,
            M31.slice(0, 7)
        );
        var MDAY365MASK = [].concat(
            M31, M28, M31,
            M30, M31, M30,
            M31, M31, M30,
            M31, M30, M31,
            M31.slice(0, 7)
        );

        M28 = range(-28, 0);
        M29 = range(-29, 0);
        M30 = range(-30, 0);
        M31 = range(-31, 0);
        var NMDAY366MASK = [].concat(
            M31, M29, M31,
            M30, M31, M30,
            M31, M31, M30,
            M31, M30, M31,
            M31.slice(0, 7)
        );
        var NMDAY365MASK = [].concat(
            M31, M28, M31,
            M30, M31, M30,
            M31, M31, M30,
            M31, M30, M31,
            M31.slice(0, 7)
        );

        var M366RANGE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
        var M365RANGE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];

        var WDAYMASK = (function () {
            for (var wdaymask = [], i = 0; i < 55; i++) {
                wdaymask = wdaymask.concat(range(7));
            }
            return wdaymask;
        }());


        var Weekday = function (weekday, n) {
            var that = this;
            if (n === 0) {
                throw new Error('Can\'t create weekday with n == 0');
            }
            this.weekday = weekday;
            this.n = n;

            this.nth = function (n) {
                return that.n == n ? that : new Weekday(that.weekday, n);
            }

            this.equals = function (other) {
                return that.weekday == other.weekday && that.n == other.n;
            }

            this.toString = function () {
                var s = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][that.weekday];
                if (this.n) {
                    s = (that.n > 0 ? '+' : '') + String(that.n) + s;
                }
                return s;
            }

            this.getJsWeekday = function () {
                return that.weekday == 6 ? 0 : that.weekday + 1;
            }
        };

        this.FREQUENCIES = [
                'YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY',
                'HOURLY', 'MINUTELY', 'SECONDLY'
        ];

        this.YEARLY = 0;
        this.MONTHLY = 1;
        this.WEEKLY = 2;
        this.DAILY = 3;
        this.HOURLY = 4;
        this.MINUTELY = 5;
        this.SECONDLY = 6;

        this.MO = new Weekday(0);
        this.TU = new Weekday(1);
        this.WE = new Weekday(2);
        this.TH = new Weekday(3);
        this.FR = new Weekday(4);
        this.SA = new Weekday(5);
        this.SU = new Weekday(6);

        var DEFAULT_OPTIONS = {
            freq: null,
            dtstart: null,
            interval: 1,
            wkst: that.MO,
            count: null,
            until: null,
            bysetpos: null,
            bymonth: null,
            bymonthday: null,
            byyearday: null,
            byweekno: null,
            byweekday: null,
            byhour: null,
            byminute: null,
            bysecond: null,
            byeaster: null
        };

        // RFC string
        this._string = null;
        this.toString = function () {
            var options = this.origOptions;
            var key, keys, defaultKeys, value, strValues, pairs = [];

            keys = Object.keys(options);
            defaultKeys = Object.keys(DEFAULT_OPTIONS);

            for (var i = 0; i < keys.length; i++) {

                if (!contains(defaultKeys, keys[i])) continue;

                key = keys[i].toUpperCase();
                value = options[keys[i]];
                strValues = [];

                if (value === null || value instanceof Array && !value.length) {
                    continue;
                }

                switch (key) {
                    case 'FREQ':
                        value = that.FREQUENCIES[options.freq];
                        break;
                    case 'WKST':
                        if (!value) value = 0;
                        value = value.toString();
                        break;
                    case 'BYWEEKDAY':
                        key = 'BYDAY';
                        if (!(value instanceof Array)) {
                            value = [value];
                        }
                        for (var wday, j = 0; j < value.length; j++) {
                            wday = value[j];
                            if (wday instanceof Weekday) {
                                // good
                            } else if (wday instanceof Array) {
                                wday = new Weekday(wday[0], wday[1]);
                            } else {
                                wday = new Weekday(wday);
                            }
                            strValues[j] = wday.toString();
                        }
                        value = strValues;
                        break;
                    case 'DTSTART':
                    case 'UNTIL':
                        value = $.jqx.scheduler.utilities.timeToUntilString(value);
                        break;
                    default:
                        if (value instanceof Array) {
                            for (var j = 0; j < value.length; j++) {
                                strValues[j] = String(value[j]);
                            }
                            value = strValues;
                        } else {
                            value = String(value);
                        }

                }
                pairs.push([key, value]);
            }

            var strings = [];
            for (var i = 0; i < pairs.length; i++) {
                var attr = pairs[i];
                strings.push(attr[0] + '=' + attr[1].toString());
            }
            return strings.join(';');
        }

        this.parseString = function (rfcString) {
            rfcString = rfcString.replace(/^\s+|\s+$/, '');
            if (!rfcString.length) {
                return null;
            }

            var i, j, key, value, attr,
                attrs = rfcString.split(';'),
                options = {};

            for (i = 0; i < attrs.length; i++) {
                attr = attrs[i].split('=');
                key = attr[0];
                value = attr[1];
                if (key == "")
                    continue;

                switch (key) {
                    case 'COUNT':
                    case 'INTERVAL':
                    case 'BYSETPOS':
                    case 'BYMONTH':
                    case 'BYMONTHDAY':
                    case 'BYYEARDAY':
                    case 'BYWEEKNO':
                    case 'BYHOUR':
                    case 'BYMINUTE':
                    case 'BYSECOND':
                        if (value.indexOf(',') != -1) {
                            value = value.split(',');
                            for (j = 0; j < value.length; j++) {
                                if (/^[+-]?\d+$/.test(value[j])) {
                                    value[j] = Number(value[j]);
                                }
                            }
                        } else if (/^[+-]?\d+$/.test(value)) {
                            value = Number(value);
                        }
                        key = key.toLowerCase();
                        options[key] = value;
                        break;
                    case 'BYDAY': // => byweekday
                        var n, wday, day, days = value.split(',');
                        options.byweekday = [];
                        for (j = 0; j < days.length; j++) {
                            day = days[j];
                            if (day.length == 2) { // MO, TU, ...
                                wday = that[day]; // wday instanceof Weekday
                                options.byweekday.push(wday);
                            } else { // -1MO, +3FR, 1SO, ...
                                day = day.match(/^([+-]?\d)([A-Z]{2})$/);
                                n = Number(day[1]);
                                wday = day[2];
                                wday = that[wday].weekday;
                                options.byweekday.push(new Weekday(wday, n));
                            }
                        }
                        break;
                    case 'FREQ':
                        options.freq = that[value];
                        break;
                    case 'WKST':
                        options.wkst = that[value];
                        break;
                    case 'DTSTART':
                        options.dtstart = $.jqx.scheduler.utilities.untilStringToDate(value);
                        break;
                    case 'UNTIL':
                        options.until = $.jqx.scheduler.utilities.untilStringToDate(value);
                        break;
                    case 'BYEASTER':
                        options.byeaster = Number(value);
                        break;
                    default:
                        throw new Error("Unknown ICalRule property '" + key + "'");
                }
            }
            that.options = options;
            return options;
        };

        if ($.type(options) === "string") {
            this.options = this.parseString(options);
        }
        else {
            this.options = options || {};
        }

        var options = this.options;

        if (!Array.prototype.forEach) {

            Array.prototype.forEach = function (callback, thisArg) {

                var T, k;

                if (this == null) {
                    throw new TypeError(' this is null or not defined');
                }

                // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
                var O = Object(this);

                // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
                // 3. Let len be ToUint32(lenValue).
                var len = O.length >>> 0;

                // 4. If IsCallable(callback) is false, throw a TypeError exception.
                if (typeof callback !== "function") {
                    throw new TypeError(callback + ' is not a function');
                }

                // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
                if (arguments.length > 1) {
                    T = thisArg;
                }

                // 6. Let k be 0
                k = 0;

                // 7. Repeat, while k < len
                while (k < len) {

                    var kValue;

                    // a. Let Pk be ToString(k).
                    //   This is implicit for LHS operands of the in operator
                    // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
                    //   This step can be combined with c
                    // c. If kPresent is true, then
                    if (k in O) {

                        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                        kValue = O[k];

                        // ii. Call the Call internal method of callback with T as the this value and
                        // argument list containing kValue, k, and O.
                        callback.call(T, kValue, k, O);
                    }
                    // d. Increase k by 1.
                    k++;
                }
                // 8. return undefined
            };
        }

        if (!Object.keys) {
            Object.keys = (function () {
                'use strict';
                var hasOwnProperty = Object.prototype.hasOwnProperty,
                    hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
                    dontEnums = [
                      'toString',
                      'toLocaleString',
                      'valueOf',
                      'hasOwnProperty',
                      'isPrototypeOf',
                      'propertyIsEnumerable',
                      'constructor'
                    ],
                    dontEnumsLength = dontEnums.length;

                return function (obj) {
                    if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                        throw new TypeError('Object.keys called on non-object');
                    }

                    var result = [], prop, i;

                    for (prop in obj) {
                        if (hasOwnProperty.call(obj, prop)) {
                            result.push(prop);
                        }
                    }

                    if (hasDontEnumBug) {
                        for (i = 0; i < dontEnumsLength; i++) {
                            if (hasOwnProperty.call(obj, dontEnums[i])) {
                                result.push(dontEnums[i]);
                            }
                        }
                    }
                    return result;
                };
            }());
        }
        // used by toString()
        this.origOptions = {};
        var invalid = [],
            keys = Object.keys(this.options),
            defaultKeys = Object.keys(DEFAULT_OPTIONS);

        // Shallow copy for origOptions and check for invalid
        keys.forEach(function (key) {
            this.origOptions[key] = this.options[key];
            if (!contains(defaultKeys, key)) invalid.push(key);
        }, this);

        if (invalid.length) {
            throw new Error('Invalid options: ' + invalid.join(', '))
        }

        if (!that.FREQUENCIES[this.options.freq] && options.byeaster === null) {
            throw new Error('Invalid Frequency: ' + String(options.freq))
        }

        // Merge in default options
        defaultKeys.forEach(function (key) {
            if (!contains(keys, key)) options[key] = DEFAULT_OPTIONS[key];
        });

        var opts = this.options;

        if (opts.byeaster !== null) {
            opts.freq = this.YEARLY;
        }

        if (!opts.dtstart) {
            opts.dtstart = new Date();
            opts.dtstart.setMilliseconds(0);
        }
        if (from) {
            opts.dtstart = from.toDate();
        }

        if (opts.wkst === null) {
            opts.wkst = this.MO.weekday;
        } else if (typeof opts.wkst == 'number') {
            // cool, just keep it like that
        } else {
            if (opts.wkst == null) {
                opts.wkst = this.MO.weekday;
            }
            else {
                opts.wkst = opts.wkst.weekday;
            }
        }

        if (opts.bysetpos !== null) {
            if (typeof opts.bysetpos == 'number') {
                opts.bysetpos = [opts.bysetpos];
            }
            for (var i = 0; i < opts.bysetpos.length; i++) {
                var v = opts.bysetpos[i];
                if (v == 0 || !(-366 <= v && v <= 366)) {
                    throw new Error(
                        'bysetpos must be between 1 and 366,' +
                            ' or between -366 and -1'
                    );
                }
            }
        }

        if (!(isBoolean(opts.byweekno) || isBoolean(opts.byyearday)
            || isBoolean(opts.bymonthday) || opts.byweekday !== null
            || opts.byeaster !== null)) {
            switch (opts.freq) {
                case this.YEARLY:
                    if (!opts.bymonth) {
                        opts.bymonth = opts.dtstart.getMonth() + 1;
                    }
                    opts.bymonthday = opts.dtstart.getDate();
                    break;
                case this.MONTHLY:
                    opts.bymonthday = opts.dtstart.getDate();
                    break;
                case this.WEEKLY:
                    opts.byweekday = $.jqx.scheduler.utilities.getWeekday(
                                                opts.dtstart);
                    break;
            }
        }

        // bymonth
        if (opts.bymonth !== null
            && !(opts.bymonth instanceof Array)) {
            opts.bymonth = [opts.bymonth];
        }

        // byyearday
        if (opts.byyearday !== null
            && !(opts.byyearday instanceof Array)) {
            opts.byyearday = [opts.byyearday];
        }

        // bymonthday
        if (opts.bymonthday === null) {
            opts.bymonthday = [];
            opts.bynmonthday = [];
        } else if (opts.bymonthday instanceof Array) {
            var bymonthday = [], bynmonthday = [];

            for (i = 0; i < opts.bymonthday.length; i++) {
                var v = opts.bymonthday[i];
                if (v > 0) {
                    bymonthday.push(v);
                } else if (v < 0) {
                    bynmonthday.push(v);
                }
            }
            opts.bymonthday = bymonthday;
            opts.bynmonthday = bynmonthday;
        } else {
            if (opts.bymonthday < 0) {
                opts.bynmonthday = [opts.bymonthday];
                opts.bymonthday = [];
            } else {
                opts.bynmonthday = [];
                opts.bymonthday = [opts.bymonthday];
            }
        }

        // byweekno
        if (opts.byweekno !== null
            && !(opts.byweekno instanceof Array)) {
            opts.byweekno = [opts.byweekno];
        }

        // byweekday / bynweekday
        if (opts.byweekday === null) {
            opts.bynweekday = null;
        } else if (typeof opts.byweekday == 'number') {
            opts.byweekday = [opts.byweekday];
            opts.bynweekday = null;

        } else if (opts.byweekday instanceof Weekday) {

            if (!opts.byweekday.n || opts.freq > this.MONTHLY) {
                opts.byweekday = [opts.byweekday.weekday];
                opts.bynweekday = null;
            } else {
                opts.bynweekday = [
                    [opts.byweekday.weekday,
                     opts.byweekday.n]
                ];
                opts.byweekday = null;
            }

        } else {
            var byweekday = [], bynweekday = [];

            for (i = 0; i < opts.byweekday.length; i++) {
                var wday = opts.byweekday[i];

                if (typeof wday == 'number') {
                    byweekday.push(wday);
                } else if (!wday.n || opts.freq > this.MONTHLY) {
                    byweekday.push(wday.weekday);
                } else {
                    bynweekday.push([wday.weekday, wday.n]);
                }
            }
            opts.byweekday = isBoolean(byweekday) ? byweekday : null;
            opts.bynweekday = isBoolean(bynweekday) ? bynweekday : null;
        }

        // byhour
        if (opts.byhour === null) {
            opts.byhour = (opts.freq < this.HOURLY)
                ? [opts.dtstart.getHours()]
                : null;
        } else if (typeof opts.byhour == 'number') {
            opts.byhour = [opts.byhour];
        }

        // byminute
        if (opts.byminute === null) {
            opts.byminute = (opts.freq < this.MINUTELY)
                ? [opts.dtstart.getMinutes()]
                : null;
        } else if (typeof opts.byminute == 'number') {
            opts.byminute = [opts.byminute];
        }

        // bysecond
        if (opts.bysecond === null) {
            opts.bysecond = (opts.freq < this.SECONDLY)
                ? [opts.dtstart.getSeconds()]
                : null;
        } else if (typeof opts.bysecond == 'number') {
            opts.bysecond = [opts.bysecond];
        }

        if (opts.freq >= this.HOURLY) {
            this.timeset = null;
        } else {
            this.timeset = [];
            if (opts.byhour) {
                for (i = 0; i < opts.byhour.length; i++) {
                    var hour = opts.byhour[i];
                    for (var j = 0; j < opts.byminute.length; j++) {
                        var minute = opts.byminute[j];
                        for (var k = 0; k < opts.bysecond.length; k++) {
                            var second = opts.bysecond[k];
                            // python:
                            // datetime.time(hour, minute, second,
                            // tzinfo=self._tzinfo))
                            this.timeset.push(new $.jqx.scheduler.utilities.Time(hour, minute, second));
                        }
                    }
                }
            }
            $.jqx.scheduler.utilities.sort(this.timeset);
        }

        return this;

    }

})(jqxBaseFramework);


(function ($) {
    'use strict';

    $.extend($.jqx._jqxScheduler.prototype,
{

    _getexportcolor: function (value) {
        var color = value;
        if (value == 'transparent') color = "#FFFFFF";
        if (!color || !color.toString()) {
            color = "#FFFFFF";
        }

        if (color.toString().indexOf('rgb') != -1) {
            var rgb = color.split(',');
            if (color.toString().indexOf('rgba') != -1) {
                var r = parseInt(rgb[0].substring(5));
                var g = parseInt(rgb[1]);
                var b = parseInt(rgb[2]);
                var a = parseInt(rgb[3].substring(1, 4));
                var rgbObj = { r: r, g: g, b: b };
                var hex = this._rgbToHex(rgbObj);
                if (r == 0 && g == 0 && b == 0 && a == 0) {
                    return "#ffffff";
                }

                return "#" + hex;
            }

            var r = parseInt(rgb[0].substring(4));
            var g = parseInt(rgb[1]);
            var b = parseInt(rgb[2].substring(1, 4));
            var rgbObj = { r: r, g: g, b: b };
            var hex = this._rgbToHex(rgbObj);
            return "#" + hex;
        }
        else if (color.toString().indexOf('#') != -1) {
            if (color.toString().length == 4) {
                var colorPart = color.toString().substring(1, 4);
                color += colorPart;
            }
        }

        return color;
    },

    _rgbToHex: function (rgb) {
        return this._intToHex(rgb.r) + this._intToHex(rgb.g) + this._intToHex(rgb.b);
    },

    _intToHex: function (dec) {
        var result = (parseInt(dec).toString(16));
        if (result.length == 1)
            result = ("0" + result);
        return result.toUpperCase();
    },

    exportData: function (datatype) {
        var that = this;
        if (!$.jqx.dataAdapter.ArrayExporter) {
            throw 'jqxScheduler: Missing reference to jqxdata.export.js!';
        }

        var exportServer = this.exportSettings.serverURL;
        var charset = this.exportSettings.characterSet;

        var filename = this.exportSettings.fileName;
        if (filename === undefined) {
            filename = "jqxScheduler";
        }

        var that = this;

        if (datatype == "ical" || datatype == "ics") {
            if (that._resources.length > 1 && filename && that.resourcesInMultipleICSFiles) {
                var rows = this.getAppointments();
                for (var i = 0; i < that._resources.length; i++) {
                    var resource = that._resources[i];
                    var appointmentsInResource = new Array();
                    for (var j = 0; j < rows.length; j++) {
                        var appointment = rows[j];
                        if (appointment.resourceId == resource) {
                            appointmentsInResource.push(appointment);
                        }
                    }
                    var data = 'BEGIN:VCALENDAR\n' +
                    'VERSION:2.0\n' +
                    'PRODID:jqxScheduler\n' +
                    'METHOD:PUBLISH\n';

                    for (var m = 0; m < appointmentsInResource.length; m++) {
                        data += appointmentsInResource[m].jqxAppointment.toString();
                        if (m < appointmentsInResource.length - 1) data += '\n';
                    }

                    data += '\nEND:VCALENDAR';
                    var length = data.length;
                    var array = new Uint8Array(new ArrayBuffer(length));

                    for (var m = 0; m < length; m++) {
                        array[m] = data.charCodeAt(m);
                    }

                    var blob = new Blob([array], { type: "application/calendar" });
                    saveAs(blob, filename + "_" + resource + ".ics");
                }
            }
            else {
                var rows = this.getAppointments();
                var data = 'BEGIN:VCALENDAR\n' +
                    'VERSION:2.0\n' +
                    'PRODID:jqxScheduler\n' +
                    'METHOD:PUBLISH\n';

                for (var i = 0; i < rows.length; i++) {
                    data += rows[i].jqxAppointment.toString();
                    if (i < rows.length - 1) data += '\n';
                }

                data += '\nEND:VCALENDAR';
                var length = data.length;
                var array = new Uint8Array(new ArrayBuffer(length));

                for (i = 0; i < length; i++) {
                    array[i] = data.charCodeAt(i);
                }

                var blob = new Blob([array], { type: "application/calendar" });
                if (!filename)
                    return data;

                saveAs(blob, filename + ".ics");
            }
            return;
        }

        var rows = this.getDataAppointments();
        var fields = new Array();
        var dataFields = {};
        var styles = {};
        var $cell = this.host.find('.jqx-grid-cell:first');
        $cell.removeClass(this.toThemeProperty('jqx-grid-cell-selected'));
        $cell.removeClass(this.toThemeProperty('jqx-fill-state-pressed'));
        $cell.removeClass(this.toThemeProperty('jqx-grid-cell-hover'));
        $cell.removeClass(this.toThemeProperty('jqx-fill-state-hover'));
        var styleName = 'cell';
        var styleIndex = 1;
        var columnStyleName = 'column';
        var columnStyleIndex = 1;
        var $element = $(this.columns.records[0].element);
        var count = 0;
        $.each(this.appointmentDataFields, function (index, value) {
            dataFields[value] = {};
            dataFields[value].text = value;
            dataFields[value].width = 100;
            dataFields[value].formatString = "";
            dataFields[value].localization = that.schedulerLocalization;
            if (index == "from" || index == "to") {
                dataFields[value].type = "date";
                dataFields[value].formatString = that.exportSettings.dateTimeFormatString;
            }
            else {
                dataFields[value].type = "string";
            }
            dataFields[value].cellsAlign = "left";
            fields.push(dataFields[value]);


            styleName = 'cell' + styleIndex;
            columnStyleName = 'column' + columnStyleIndex;
            if (datatype == 'html' || datatype == 'xls' || datatype == 'pdf') {
                var buildStyle = function (styleName, $element, isColumn, altStyle, meColumn, me, index, customStyle, rowIndex) {
                    styles[styleName] = {};
                    if ($element == undefined)
                        return;

                    styles[styleName]['font-size'] = $element.css('font-size');
                    styles[styleName]['font-weight'] = $element.css('font-weight');
                    styles[styleName]['font-style'] = $element.css('font-style');
                    styles[styleName]['background-color'] = that._getexportcolor($element.css('background-color'));
                    styles[styleName]['color'] = that._getexportcolor($element.css('color'));
                    styles[styleName]['border-color'] = that._getexportcolor($element.css('border-top-color'));
                    if (isColumn) {
                        styles[styleName]['text-align'] = "left";
                    }
                    else {
                        styles[styleName]['text-align'] = "left";
                        styles[styleName]['formatString'] = "";
                        styles[styleName]['dataType'] = "string";
                        if (index == "from" || index == "to") {
                            styles[styleName]['dataType'] = "date";
                            styles[styleName]['formatString'] = that.exportSettings.dateTimeFormatString;
                        }
                    }

                    if (datatype == 'html' || datatype == 'pdf') {
                        styles[styleName]['border-top-width'] = $element.css('border-top-width');
                        styles[styleName]['border-left-width'] = $element.css('border-left-width');
                        styles[styleName]['border-right-width'] = $element.css('border-right-width');
                        styles[styleName]['border-bottom-width'] = $element.css('border-bottom-width');
                        styles[styleName]['border-top-style'] = $element.css('border-top-style');
                        styles[styleName]['border-left-style'] = $element.css('border-left-style');
                        styles[styleName]['border-right-style'] = $element.css('border-right-style');
                        styles[styleName]['border-bottom-style'] = $element.css('border-bottom-style');
                        if (isColumn) {
                            if (count == 0) {
                                styles[styleName]['border-left-width'] = $element.css('border-right-width');
                            }
                            styles[styleName]['border-top-width'] = $element.css('border-right-width');
                            styles[styleName]['border-bottom-width'] = $element.css('border-bottom-width');
                        }
                        else {
                            if (count == 0) {
                                styles[styleName]['border-left-width'] = "1px";
                            }
                            styles[styleName]['border-right-width'] = "1px";
                        }
                    }


                    if (isColumn) {
                        dataFields[value].style = styleName;
                    }
                    dataFields[value].cellStyle = styleName;
                }
                buildStyle(columnStyleName, $element, true, false, this, that, index);
                columnStyleIndex++;
                buildStyle(styleName, $cell, false, false, this, that, index);
                styleIndex++;
            }
            count++;
        });


        var exporter = $.jqx.dataAdapter.ArrayExporter(rows, dataFields, styles, exportServer);
        if (filename == null) {
            // update ui
            this._renderrows();
            var result = exporter.exportTo(datatype);
            setTimeout(function () {
                that.exporting = false;
            }, 50);
            return result;
        }
        else {
            exporter.exportToFile(datatype, filename, exportServer, charset);
        }

        this._renderrows();
        setTimeout(function () {
            that.exporting = false;
        }, 50);
    },

    shadeColor: function (color, percent) {
        var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
    },

    hexToRgba: function (hex, alpha) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        var toString = function () {
            var oldie = $.jqx.browser.msie && $.jqx.browser.version < 10;

            if (this.alpha == undefined || oldie) {
                return "rgb(" + this.r + ", " + this.g + ", " + this.b + ")";
            }
            if (this.alpha > 1) {
                this.alpha = 1;
            } else if (this.alpha < 0) {
                this.alpha = 0;
            }
            return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.alpha + ")";
        }
        if (alpha == undefined) {
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
                toString: toString
            } : null;
        }
        if (alpha > 1) {
            alpha = 1;
        } else if (alpha < 0) {
            alpha = 0;
        }
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            alpha: alpha,
            toString: toString
        } : null;
    },

    getAppointmentColors: function (hexColor) {
        var background = "";
        var border = "";
        var color = "";
        background = this.hexToRgba(hexColor, this.appointmentOpacity).toString();
        border = hexColor;

        var getTextElementByColor = function (color) {
            var nThreshold = 105;
            var bgDelta = (color.r * 0.299) + (color.g * 0.587) + (color.b * 0.114);
            var foreColor = (255 - bgDelta < nThreshold) ? 'Black' : 'White';
            return foreColor;
        }
        color = getTextElementByColor(this.hexToRgba(hexColor, 0.7));

        return { background: background, color: color, border: border };
    },

    getColors: function (resourceIndex) {
        if (resourceIndex == -1) {
            resourceIndex = 0;
        }

        var background = "";
        var border = "";
        var color = "";
        var colorScheme = this.resources ? this.resources.colorScheme : null;
        if (!colorScheme)
            colorScheme = "scheme01";

        var colors = new Array();
        for (var scheme = 0; scheme < this.colorSchemes.length; scheme++) {
            if (this.colorSchemes[scheme].name == colorScheme) {
                colors = this.colorSchemes[scheme].colors;
                break;
            }
        }
        while (resourceIndex > colors.length - 1) {
            var schemeIndex = parseInt(colorScheme.substring(6));
            if (schemeIndex >= 27) schemeIndex = 0;
            colors = colors.concat(this.colorSchemes[schemeIndex].colors);
            schemeIndex++;
        }
        background = colors[resourceIndex];
        background = this.hexToRgba(colors[resourceIndex], 0.7).toString();
        border = colors[resourceIndex];

        var getTextElementByColor = function (color) {
            var nThreshold = 105;
            var bgDelta = (color.r * 0.299) + (color.g * 0.587) + (color.b * 0.114);
            var foreColor = (255 - bgDelta < nThreshold) ? 'Black' : 'White';
            return foreColor;
        }
        color = getTextElementByColor(this.hexToRgba(colors[resourceIndex], 0.7));

        return { background: background, color: color, border: border };
    },

    getAppointments: function () {
        var appointments = this.uiappointments;
        var boundAppointments = new Array();
        for (var i = 0; i < appointments.length; i++) {
            var boundAppointment = appointments[i].boundAppointment;
            boundAppointment.toString = boundAppointment.jqxAppointment.toString;
            boundAppointments.push(boundAppointment);
        }
        return boundAppointments;
    },

    getDataAppointments: function () {
        var appointments = this.uiappointments;
        var boundAppointments = new Array();
        for (var i = 0; i < appointments.length; i++) {
            var boundAppointment = appointments[i].boundAppointment;
            var obj = {};
            $.each(this.appointmentDataFields, function (index, value) {
                obj[value] = boundAppointment[index];
                if (index == "from" || index == "to") {
                    if ("date" != $.type(boundAppointment[index])) {
                        obj[value] = boundAppointment[index].toDate();
                    }
                }
                if (index == "recurrencePattern") {
                    if (boundAppointment[index]) {
                        obj[value] = boundAppointment[index].toString();
                    }
                }
                if (index == "recurrenceException")
                {
                    if (boundAppointment[index])
                    {
                        obj[value] = "";
                        for (var j = 0; j < boundAppointment[index].length; j++)
                        {
                            obj[value] += boundAppointment[index][j].toString();
                            if (j < boundAppointment[index].length - 1)
                            {
                                obj[value] += ",";
                            }
                        }
                    }
                }
                try
                {
                    if (JSON)
                    {
                        obj.toString = function ()
                        {
                            return JSON.stringify(obj);
                        }
                    }
                }
                catch (er)
                {
                }
            });
            boundAppointments.push(obj);
        }
        return boundAppointments;
    },

    _refreshColumns: function () {
        this._initializeColumns();
        this.columnsheader = this.columnsheader || $('<div style="overflow: hidden;"></div>');
        this.columnsheader.children().remove();
        var columnsHeight = this.columnsHeight;
        columnsHeight = this._preparecolumnGroups();
        this.columnsheader.height(columnsHeight);
        this._rendercolumnheaders();
    },

    _refreshColumnTitles: function () {
        var view = this._views[this._view].type;
        var viewObject = this._views[this._view];
        var that = this;
        var columns = new Array();
        if (that.columns.records[0].timeColumn)
            columns.push({});
        if (viewObject.timeRuler && viewObject.timeRuler.timeZones) {
            for (var i = 0; i < viewObject.timeRuler.timeZones.length; i++) {
                columns.push({});
            }
        }

        var createtimelineDayColumns = function (date, resourceName, resourceIndex) {
            var scale = "halfHour";
            if (viewObject.timeRuler && viewObject.timeRuler.scale) {
                scale = viewObject.timeRuler.scale;
            }
            var hours = 24;
            var startHour = 0;
            var endHour = 23;
            if (viewObject.timeRuler) {
                if (viewObject.timeRuler.scaleStartHour != undefined) {
                    var startHour = parseInt(viewObject.timeRuler.scaleStartHour);
                }
                if (viewObject.timeRuler.scaleEndHour != undefined) {
                    var endHour = parseInt(viewObject.timeRuler.scaleEndHour);
                }

                if (startHour < 0) startHour = 0;
                if (endHour < 0) endHour = 23;
                if (startHour > 23) startHour = 0;
                if (endHour > 23) endHour = 23;

                hours = endHour - startHour + 1;
            }
            var minutes = 60;
            var pow = 2;
            if (scale) {
                switch (scale) {
                    case 'sixtyMinutes':
                    case 'hour':
                        pow = 1;
                        break;
                    case 'thirdyMinutes':
                    case 'halfHour':
                        pow = 2;
                        break;
                    case 'fifteenMinutes':
                    case 'quarterHour':
                        pow = 4;
                        break;
                    case 'tenMinutes':
                        pow = 6;
                        break;
                    case 'fiveMinutes':
                        pow = 12;
                        break;
                }
            }

            var rows = new Array();
            var format = "auto";
            if (viewObject.timeRuler && viewObject.timeRuler.formatString) {
                format = viewObject.timeRuler.formatString;
            }
            var currentHour = startHour;
            var columnsCount = hours;
            var currentDate = date.addHours(currentHour);
            if (that.rtl) {
                var currentDate = date.addHours(endHour);
            }

            for (var i = 0; i < columnsCount; i++) {
                var cellvalue = currentDate.toDate();
                if (format === "auto") {
                    if ((cellvalue.getHours() == 0 && cellvalue.getMinutes() == 0) || (cellvalue.getHours() == 12 && cellvalue.getMinutes() == 0)) {
                        var cellsFormat = "hh tt";
                    }
                    else var cellsFormat = "hh:mm";
                }
                else if ($.isFunction(format)) {
                    var cellsFormat = format(cellvalue);
                }

                if ($.jqx.dataFormat.isDate(cellvalue)) {
                    cellvalue = $.jqx.dataFormat.formatdate(cellvalue, cellsFormat, that.schedulerLocalization);
                }
                if (!that.rtl) {
                    currentDate = currentDate.addMinutes(minutes);
                }
                else {
                    currentDate = currentDate.addMinutes(-minutes);
                }
                columns.push({});
                that.columns.records[columns.length - 1].text = cellvalue;
            }
        }
        var index = this.tableColumns;
        for (var j = 0; j < this.tableColumns; j++) {
            switch (view) {
                case "dayView":
                    var viewStart = this.getViewStart();
                    if (false === viewObject.showWeekends) {
                        if (viewStart.dayOfWeek() === 0 || viewStart.dayOfWeek() === 6)
                            viewStart = viewStart.addDays(1);
                        if (viewStart.dayOfWeek() === 0 || viewStart.dayOfWeek() === 6)
                            viewStart = viewStart.addDays(1);
                    }

                    columns.push({});
                    this.columns.records[columns.length - 1].text = this._getDayName(viewStart.dayOfWeek());
                    break;
                case "weekView":
                case "monthView":
                    for (var i = 0; i < 7; i++) {
                        var day = this.schedulerLocalization.firstDay + i;
                        if (false === viewObject.showWeekends) {
                            if (i === 0 || i === 6)
                                continue;
                        }
                        columns.push({});
                        if (that.rtl) {
                            day = 6 - day;
                        }

                        this.columns.records[columns.length - 1].text = this._getDayName(day);
                    }
                    break;
                case "timelineDayView":
                    var resourceName = that._resources[j] ? that._resources[j] : "Resource" + j;
                    createtimelineDayColumns(that.getViewStart(), resourceName);
                    break;
                case "timelineWeekView":
                    for (var i = 0; i < 7; i++) {
                        var day = this.schedulerLocalization.firstDay + i;
                        if (false === viewObject.showWeekends) {
                            if (i === 0 || i === 6)
                                continue;
                        }
                        if (that.rtl) {
                            day = 6 - day;
                        }
                        createtimelineDayColumns(that.getViewStart().addDays(i), this._getDayName(day));
                    }
                    break;
                case "timelineMonthView":
                    var currentDate = that.getViewStart();
                    var format = "auto";
                    if (viewObject.timeRuler && viewObject.timeRuler.formatString) {
                        format = viewObject.timeRuler.formatString;
                    }
                    for (var i = 0; i < 41; i++) {
                        var day = currentDate.dayOfWeek()
                        if (false === viewObject.showWeekends) {
                            if (day === 0 || day === 6)
                                continue;
                        }
                        if (that.rtl) {
                            day = 6 - day;
                        }

                        var cellvalue = currentDate.toDate();

                        if (format === "auto") {
                            var cellsFormat = "dd";
                            cellvalue = currentDate.toDate();
                            if (cellvalue.getDate() === 1) cellsFormat = "MMM dd";
                        }
                        else if ($.isFunction(format)) {
                            var cellsFormat = format(cellvalue);
                        }

                        if ($.jqx.dataFormat.isDate(cellvalue)) {
                            cellvalue = $.jqx.dataFormat.formatdate(cellvalue, cellsFormat, that.schedulerLocalization);
                        }
                        currentDate = currentDate.addDays(1);
                        columns.push({});
                        that.columns.records[columns.length - 1].text = cellvalue;
                    }
                    break;
            }
        }

        var headerheight = that.columnsHeight;
        var getcolumnheight = function (datafield, column) {
            var height = that.columnGroupslevel * that.columnsHeight;
            height = height - (column.level * that.columnsHeight);
            return height;
        }
        var totalOffset = 0;
        for (var i = 0; i < this.columns.records.length; i++) {
            var column = this.columns.records[i];
            if (column.timeColumn)
                continue;

            if (that.columnGroups) {
                if (that.columnGroups.length) {
                    headerheight = getcolumnheight(column.datafield, column);
                }
            }
            var columnContent = column.renderer != null ? column.renderer(column.text, column.align, headerheight) : that._rendercolumnheader(column.text, column.align, headerheight, column);
            if (columnContent == null) {
                columnContent = that._rendercolumnheader(column.text, column.align, headerheight, that);
            }
            if (column.renderer != null) columnContent = $(columnContent);
            $(column.element).html(columnContent);
        }
    },

    initRepeatPanels: function (_editDialog, content, end) {
        var that = this;
        var repeat = $("<div></div>");
        content.append(repeat);
        var repeatLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogRepeatString + "</div>").appendTo(repeat);
        var repeatField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(repeat);
        var repeatInput = $("<div></div>").appendTo(repeatField);
        var repeatPanel = $("<div></div>");
        content.append(repeatPanel);
        var bottomPanel = $("<div></div>");
        repeatPanel.append(bottomPanel);
        var createBottomPanel = function (ownerPanel, panelType) {
            var panel = $("<div></div>").appendTo(ownerPanel);
            var label = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogRepeatEndString + "</div>").appendTo(panel);
            var field = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(panel);
            var neverRadioButton = $("<div style='position:relative; float:left;'><span style='margin-left:2px;'>" + that.schedulerLocalization.editDialogRepeatNeverString + "</span></div>").appendTo(field);
            neverRadioButton.jqxRadioButton({ rtl: that.rtl, groupName: "end" + panelType, theme: that.theme, width: 200, height: 25, checked: true });
            that.editDialogFields[panelType].repeatEndNever = neverRadioButton;
            that.editDialogFields[panelType].repeatEndNeverLabel = label;

            var label2 = $("<div class='jqx-scheduler-edit-dialog-label'></div>").appendTo(panel);
            var field2 = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(panel);
            var afterRadioButton = $("<div style='position:relative;  float:left;'><span style='margin-left:2px;'>" + that.schedulerLocalization.editDialogRepeatAfterString + "</span></div>").appendTo(field2);
            afterRadioButton.jqxRadioButton({ rtl: that.rtl, groupName: "end" + panelType, theme: that.theme, width: 60, height: 25, checked: false });
            var afterInput = $("<div style='margin-left: 3px; float:left;'></div>").appendTo(field2);
            afterInput.jqxNumberInput({ rtl: that.rtl, decimal: 10, min: 1, inputMode: "simple", height: 25, width: 50, spinButtons: true, decimalDigits: 0, theme: that.theme });
            var occurrences = $("<div style='float: left; margin-left: 5px; line-height:25px;'>" + that.schedulerLocalization.editDialogRepeatOccurrencesString + "</div>").appendTo(field2);
            that.editDialogFields[panelType].repeatEndAfter = afterRadioButton;
            that.editDialogFields[panelType].repeatEndAfterValue = afterInput;
            that.editDialogFields[panelType].repeatEndAfterLabel = label2;

            var label3 = $("<div class='jqx-scheduler-edit-dialog-label'></div>").appendTo(panel);
            var field3 = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(panel);
            var onRadioButton = $("<div style='position:relative; float:left;'><span style='margin-left:2px;'>" + that.schedulerLocalization.editDialogRepeatOnString + "</span></div>").appendTo(field3);
            onRadioButton.jqxRadioButton({ rtl: that.rtl, groupName: "end" + panelType, theme: that.theme, width: 60, height: 25, checked: false });
            var onInput = $("<div style='margin-left: 3px; float:left;'></div>").appendTo(field3);
            onInput.jqxDateTimeInput({ dropDownWidth: 220, dropDownHeight: 220, rtl: that.rtl, localization: that._getDateTimeInputLocalization(), firstDayOfWeek: that.schedulerLocalization.firstDay, todayString: that.schedulerLocalization.todayString, clearString: that.schedulerLocalization.clearString, value: end, formatString: that.editDialogDateFormatString, height: 25, width: 150, theme: that.theme });
            var onInputInstance = onInput.jqxDateTimeInput('getInstance');

            that.editDialogFields[panelType].repeatEndOn = onRadioButton;
            that.editDialogFields[panelType].repeatEndOnValue = onInput;
            that.editDialogFields[panelType].repeatEndOnLabel = label3;

            return panel;
        }
        bottomPanel.detach();
        that.editDialogFields.repeatEndPanel = {};
        that.editDialogFields.repeatEndPanelContainer = bottomPanel;
        createBottomPanel(bottomPanel, "repeatEndPanel");

        var createRepeatPanels = function () {
            // daily panel
            var dailyPanel = $("<div style='visibility: hidden;'></div>").appendTo($(document.body));
            var dailyLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogRepeatEveryString + "</div>").appendTo(dailyPanel);
            var dailyField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(dailyPanel);
            var dailyInput = $("<div style='float:left;'></div>").appendTo(dailyField);
            dailyInput.jqxNumberInput({ rtl: that.rtl, decimal: 1, min: 1, inputMode: "simple", height: 25, width: 50, spinButtons: true, decimalDigits: 0, theme: that.theme });
            var dailyEvery = $("<div style='float: left; margin-left: 5px; line-height:25px;'>" + that.schedulerLocalization.editDialogRepeatEveryDayString + "</div>").appendTo(dailyField);
            that.editDialogFields.daily = {};
            that.editDialogFields.daily.repeatDayInterval = dailyInput;
            that.editDialogFields.daily.repeatDayLabel = dailyLabel;
            //    createBottomPanel(dailyPanel, "daily");

            that.editDialogFields.daily.panel = dailyPanel;
            dailyPanel.detach();

            // weekly panel
            that.editDialogFields.weekly = {};

            var weeklyPanel = $("<div style='visibility: hidden;'></div>").appendTo($(document.body));
            var weeklyLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogRepeatEveryString + "</div>").appendTo(weeklyPanel);
            var weeklyField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(weeklyPanel);
            var weeklyInput = $("<div style='float:left;'></div>").appendTo(weeklyField);
            weeklyInput.jqxNumberInput({ rtl: that.rtl, decimal: 1, min: 1, inputMode: "simple", height: 25, width: 50, spinButtons: true, decimalDigits: 0, theme: that.theme });
            var weeklyEvery = $("<div style='float: left; margin-left: 5px; line-height:25px;'>" + that.schedulerLocalization.editDialogRepeatEveryWeekString + "</div>").appendTo(weeklyField);
            that.editDialogFields.weekly.repeatWeekInterval = weeklyInput;
            that.editDialogFields.weekly.repeatWeekIntervalLabel = weeklyLabel;

            var weeklyOnLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogRepeatOnString + "</div>").appendTo(weeklyPanel);
            var weeklyOnField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(weeklyPanel);
            var weeklyOnInput = $("<div style='float:left;'></div>").appendTo(weeklyOnField);
            that.editDialogFields.weekly.repeatDaysLabel = weeklyOnLabel;
            that.editDialogFields.weekly.repeatDays = new Array();
            for (var i = 0; i < 7; i++) {
                var dayName = that._getDayName(i, 'firstTwoLetters');
                var checkbox = $("<div style='position:relative; top: 6px; float:left;'><span style='margin-left:2px;'>" + dayName + "</span></div>");
                weeklyOnInput.append(checkbox);
                var checked = i == 1 ? true : false;
                checkbox.jqxCheckBox({ rtl: that.rtl, height: 25, checked: checked, width: 50, theme: that.theme });
                that.editDialogFields.weekly.repeatDays.push(checkbox);
            }

            //   createBottomPanel(weeklyPanel, "weekly");

            that.editDialogFields.weekly.panel = weeklyPanel;
            weeklyPanel.detach();

            // monthly panel
            that.editDialogFields.monthly = {};
            var monthlyPanel = $("<div style='visibility: hidden;'></div>").appendTo($(document.body));
            var monthlyLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogRepeatEveryString + "</div>").appendTo(monthlyPanel);
            var monthlyField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(monthlyPanel);
            var monthlyInput = $("<div style='float:left;'></div>").appendTo(monthlyField);
            monthlyInput.jqxNumberInput({ rtl: that.rtl, decimal: 1, min: 1, inputMode: "simple", height: 25, width: 50, spinButtons: true, decimalDigits: 0, theme: that.theme });

            var monthlyEvery = $("<div style='float: left; margin-left: 5px; line-height:25px;'>" + that.schedulerLocalization.editDialogRepeatEveryMonthString + "</div>").appendTo(monthlyField);
            that.editDialogFields.monthly.repeatMonth = monthlyInput;
            that.editDialogFields.monthly.repeatMonthLabel = monthlyLabel;

            var monthlyOnLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogRepeatOnString + "</div>").appendTo(monthlyPanel);
            var monthlyOnField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(monthlyPanel);
            var monthlyOnInput = $("<div style='float:left;'></div>").appendTo(monthlyOnField);
            var monthlyOnInputRadioButton = $("<div style='position:relative; top: 6px; float:left;'><span style='margin-left:2px;'>" + that.schedulerLocalization.editDialogRepeatEveryMonthDayString + "</span></div>").appendTo(monthlyOnInput);
            monthlyOnInputRadioButton.jqxRadioButton({ rtl: that.rtl, groupName: "month", height: 25, width: 60, checked: true, theme: that.theme });
            var monthlyDayNumberInput = $("<div style='float:left;'></div>").appendTo(monthlyOnInput);
            monthlyDayNumberInput.jqxNumberInput({ rtl: that.rtl, decimal: 1, min: 1, inputMode: "simple", height: 25, width: 50, spinButtons: true, decimalDigits: 0, theme: that.theme });

            that.editDialogFields.monthly.repeatMonthDay = monthlyDayNumberInput;
            that.editDialogFields.monthly.repeatMonthDayBool = monthlyOnInputRadioButton;
            that.editDialogFields.monthly.repeatMonthDayLabel = monthlyOnLabel;

            var monthlyFirstLabel = $("<div class='jqx-scheduler-edit-dialog-label'></div>").appendTo(monthlyPanel);
            var monthlyFirstField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(monthlyPanel);
            var monthlyFirstInput = $("<div style='float:left;'></div>").appendTo(monthlyFirstField);
            var monthlyFirstInputRadioButton = $("<div style='position:relative; top: 6px; float:left;'><span style='margin-left:2px;'></span></div>").appendTo(monthlyFirstInput);
            monthlyFirstInputRadioButton.jqxRadioButton({ groupName: "month", height: 25, width: 25, checked: false, theme: that.theme });
            var monthlyFirstDropDownList = $("<div style='float:left;'></div>").appendTo(monthlyFirstInput);

            var monthFirstSource = new Array();
            monthFirstSource.push(that.schedulerLocalization.editDialogRepeatFirstString);
            monthFirstSource.push(that.schedulerLocalization.editDialogRepeatSecondString);
            monthFirstSource.push(that.schedulerLocalization.editDialogRepeatThirdString);
            monthFirstSource.push(that.schedulerLocalization.editDialogRepeatFourthString);
            monthFirstSource.push(that.schedulerLocalization.editDialogRepeatLastString);
            monthlyFirstDropDownList.jqxDropDownList({ dropDownWidth: 150, selectedIndex: 0, source: monthFirstSource, autoDropDownHeight: true, height: 25, width: 'auto', theme: that.theme });

            var monthlyDayDropDownList = $("<div style='margin-left: 5px; float:left;'></div>").appendTo(monthlyFirstInput);

            var monthDaySource = new Array();
            for (var i = 0; i < 7; i++) {
                var dayName = that._getDayName(i);
                monthDaySource.push(dayName);
            }
            monthlyDayDropDownList.jqxDropDownList({ rtl: that.rtl, dropDownWidth: 150, autoDropDownHeight: true, selectedIndex: 1, source: monthDaySource, height: 25, width: 'auto', theme: that.theme });
            that.editDialogFields.monthly.repeatDayOfWeekBool = monthlyFirstInputRadioButton;
            that.editDialogFields.monthly.repeatDayOfWeek = monthlyDayDropDownList;
            that.editDialogFields.monthly.repeatDayOfWeekLabel = monthlyFirstLabel;
            that.editDialogFields.monthly.repeatDayOfWeekType = monthlyFirstDropDownList;
            // bottom part.
            //   createBottomPanel(monthlyPanel, "monthly");

            that.editDialogFields.monthly.panel = monthlyPanel;
            monthlyPanel.detach();

            // yearly panel
            that.editDialogFields.yearly = {};
            var yearlyPanel = $("<div style='visibility: hidden;'></div>").appendTo($(document.body));
            var yearlyLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogRepeatEveryString + "</div>").appendTo(yearlyPanel);
            var yearlyField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(yearlyPanel);
            var yearlyInput = $("<div style='float:left;'></div>").appendTo(yearlyField);
            yearlyInput.jqxNumberInput({ decimal: 1, min: 1, inputMode: "simple", height: 25, width: 50, spinButtons: true, decimalDigits: 0, theme: that.theme });
            var yearlyEvery = $("<div style='float: left; margin-left: 5px; line-height:25px;'>" + that.schedulerLocalization.editDialogRepeatEveryYearString + "</div>").appendTo(yearlyField);
            that.editDialogFields.yearly.repeatYear = yearlyInput;
            that.editDialogFields.yearly.repeatYearLabel = yearlyLabel;

            var yearlyOnLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogRepeatOnString + "</div>").appendTo(yearlyPanel);
            var yearlyOnField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(yearlyPanel);
            var yearlyOnInput = $("<div style='float:left;'></div>").appendTo(yearlyOnField);
            var yearlyOnInputRadioButton = $("<div style='position:relative; top: 6px; float:left;'></span></div>").appendTo(yearlyOnInput);
            yearlyOnInputRadioButton.jqxRadioButton({ rtl: that.rtl, groupName: "year", height: 25, width: 25, checked: true, theme: that.theme });
            that.editDialogFields.yearly.repeatYearBool = yearlyOnInputRadioButton;
            that.editDialogFields.yearly.repeatYearBoolLabel = yearlyOnLabel;

            var yearlyOnDayDropDownList = $("<div style='float:left;'></div>").appendTo(yearlyOnInput);
            var yearMonthSource = new Array();
            for (var i = 0; i < 12; i++) {
                var monthName = that.schedulerLocalization.months.names[i];
                yearMonthSource.push(monthName);
            }
            yearlyOnDayDropDownList.jqxDropDownList({ selectedIndex: 0, height: 25, dropDownWidth: 150, width: 'auto', source: yearMonthSource, theme: that.theme });
            that.editDialogFields.yearly.repeatYearMonth = yearlyOnDayDropDownList;

            var yearlyDayNumberInput = $("<div style='margin-left: 5px; float:left;'></div>").appendTo(yearlyOnInput);
            yearlyDayNumberInput.jqxNumberInput({ decimal: 1, min: 1, inputMode: "simple", height: 25, width: 50, spinButtons: true, decimalDigits: 0, theme: that.theme });
            that.editDialogFields.yearly.repeatYearDay = yearlyDayNumberInput;

            var yearlyFirstLabel = $("<div class='jqx-scheduler-edit-dialog-label'></div>").appendTo(yearlyPanel);
            var yearlyFirstField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(yearlyPanel);
            var yearlyFirstInput = $("<div style='float:left;'></div>").appendTo(yearlyFirstField);
            var yearlyFirstInputRadioButton = $("<div style='position:relative; top: 6px; float:left;'><span style='margin-left:2px;'></span></div>").appendTo(yearlyFirstInput);
            yearlyFirstInputRadioButton.jqxRadioButton({ rtl: that.rtl, groupName: "year", height: 25, width: 25, checked: false, theme: that.theme });
            var yearlyFirstDropDownList = $("<div style='float:left;'></div>").appendTo(yearlyFirstInput);
            that.editDialogFields.yearly.repeatDayOfWeekBool = yearlyFirstInputRadioButton;
            that.editDialogFields.yearly.repeatDayOfWeekType = yearlyFirstDropDownList;
            that.editDialogFields.yearly.repeatDayOfWeekLabel = yearlyFirstLabel;

            var yearFirstSource = new Array();
            yearFirstSource.push(that.schedulerLocalization.editDialogRepeatFirstString);
            yearFirstSource.push(that.schedulerLocalization.editDialogRepeatSecondString);
            yearFirstSource.push(that.schedulerLocalization.editDialogRepeatThirdString);
            yearFirstSource.push(that.schedulerLocalization.editDialogRepeatFourthString);
            yearFirstSource.push(that.schedulerLocalization.editDialogRepeatLastString);
            yearlyFirstDropDownList.jqxDropDownList({ dropDownWidth: 150, selectedIndex: 0, source: yearFirstSource, autoDropDownHeight: true, height: 25, width: 'auto', theme: that.theme });

            var yearlyDayDropDownList = $("<div style='margin-left: 5px; float:left;'></div>").appendTo(yearlyFirstInput);
            that.editDialogFields.yearly.repeatDayOfWeek = yearlyDayDropDownList;

            var yearDaySource = new Array();
            for (var i = 0; i < 7; i++) {
                var dayName = that._getDayName(i);
                yearDaySource.push(dayName);
            }

            yearlyDayDropDownList.jqxDropDownList({ rtl: that.rtl, dropDownWidth: 150, selectedIndex: 1, autoDropDownHeight: true, source: yearDaySource, height: 25, width: 'auto', theme: that.theme });

            var yearMonthSource = new Array();

            var yearlyOfString = $("<div style='line-height:25px; height: 25px; margin-left: 5px; float:left;'>" + that.schedulerLocalization.editDialogRepeatOfString + "</div>").appendTo(yearlyFirstInput);
            var yearlyMonthDropDownList = $("<div style='margin-left: 5px; float:left;'></div>").appendTo(yearlyFirstInput);
            for (var i = 0; i < 12; i++) {
                var monthName = that.schedulerLocalization.months.names[i];
                yearMonthSource.push(monthName);
            }
            that.editDialogFields.yearly.repeatDayOfWeekMonth = yearlyMonthDropDownList;

            yearlyMonthDropDownList.jqxDropDownList({ rtl: that.rtl, dropDownWidth: 150, selectedIndex: 0, source: yearMonthSource, height: 25, width: 'auto', theme: that.theme });

            // bottom part.
            //   createBottomPanel(yearlyPanel, "yearly");

            that.editDialogFields.yearly.panel = yearlyPanel;
            yearlyPanel.detach();
        }

        if (that.editAppointment && that.editAppointment.rootAppointment) {
            createRepeatPanels();
        }
        else {
            createRepeatPanels();
        }

        var resetExceptions = $("<div></div>");
        content.append(resetExceptions);
        var resetExceptionsLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogExceptionsString + "</div>").appendTo(resetExceptions);
        var resetExceptionsField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(resetExceptions);
        var resetExceptionsInput = $("<div style='position:relative; top: 6px;'>" + that.schedulerLocalization.editDialogResetExceptionsString + "</div>").appendTo(resetExceptionsField);

        resetExceptionsInput.jqxCheckBox({ height: 25, width: 25, theme: that.theme });
        resetExceptions.hide();
        that.editDialogFields.resetExceptions = resetExceptionsInput;
        that.editDialogFields.resetExceptionsLabel = resetExceptionsLabel;
        that.editDialogFields.resetExceptionsContainer = resetExceptions;

        var repeatSource = new Array();
        repeatSource.push(that.schedulerLocalization.editDialogRepeatNeverString);
        repeatSource.push(that.schedulerLocalization.editDialogRepeatDailyString);
        repeatSource.push(that.schedulerLocalization.editDialogRepeatWeeklyString);
        repeatSource.push(that.schedulerLocalization.editDialogRepeatMonthlyString);
        repeatSource.push(that.schedulerLocalization.editDialogRepeatYearlyString);

        repeatInput.jqxDropDownList({
            rtl: that.rtl,
            width: '100%', height: 25, autoDropDownHeight: true, theme: that.theme, source: repeatSource, selectedIndex: 0
        });
        that.editDialogFields.repeat = repeatInput;
        that.editDialogFields.repeatLabel = repeatLabel;
        that.editDialogFields.repeatContainer = repeat;
        that.editDialogFields.repeatPanel = repeatPanel;
        this.addHandler(repeatInput, "change", function (event) {
            var index = event.args.item.index;
            var changePanel = function () {
                repeatPanel.children().detach();
                switch (index) {
                    case 0:
                        break;
                        // daily 
                    case 1:
                        that.editDialogFields.daily.panel.css('visibility', 'visible');
                        repeatPanel.append(that.editDialogFields.daily.panel);
                        break;
                        // weekly 
                    case 2:
                        that.editDialogFields.weekly.panel.css('visibility', 'visible');
                        repeatPanel.append(that.editDialogFields.weekly.panel);
                        break;
                        // monthly 
                    case 3:
                        that.editDialogFields.monthly.panel.css('visibility', 'visible');
                        repeatPanel.append(that.editDialogFields.monthly.panel);
                        break;
                        // yearly 
                    case 4:
                        that.editDialogFields.yearly.panel.css('visibility', 'visible');
                        repeatPanel.append(that.editDialogFields.yearly.panel);
                        break;
                }

                repeatPanel.append(bottomPanel);
                if (index == 0) {
                    that.editDialogFields.repeatEndPanelContainer.hide();
                }
                else {
                    that.editDialogFields.repeatEndPanelContainer.show();
                }

                if (!that.isTouchDevice()) {
                    _editDialog.jqxWindow({ height: 150 });
                    _editDialog.jqxWindow({ height: content[0].scrollHeight + 40 });
                }
            }();
        });
    },

    _initMenu: function () {
        var that = this;

        if (this.host.jqxMenu) {
            if (this.menu) {
                if (this._hasOpenedMenu)
                    return;


                this.removeHandler(this.menu, 'keydown');
                this.removeHandler(this.menu, 'closed');
                this.removeHandler(this.menu, 'itemclick');
                this.menu.jqxMenu('destroy');
                this.menu.removeData();
                this.menu.remove();
            }
            this.menuitemsarray = new Array();
            this.menu = $('<div id="menu.jqxscheduler' + this.element.id + '" style="white-space: nowrap; z-index: 9999999999999;"></div>');
            this.host.append(this.menu);

            this.addHandler($(window), 'orientationchange.jqxscheduler' + this.element.id, function () {
                that.menu.jqxMenu('close');
                that._hasOpenedMenu = false;
            });
            this.addHandler($(window), 'orientationchanged.jqxscheduler' + this.element.id, function () {
                that.menu.jqxMenu('close');
                that._hasOpenedMenu = false;
            });

            this.removeHandler(this.menu, 'keydown');
            this.addHandler(this.menu, 'keydown', function (event) {
                if (event.keyCode == 27) {
                    that.menu.jqxMenu('close');
                    that._hasOpenedMenu = false;
                    that.focus();
                }
            });

            this.addHandler(this.menu, 'open', function (event) {
                if (that.contextMenuOpen) {
                    that.contextMenuOpen(that.menu, that.selectedJQXAppointment ? that.selectedJQXAppointment.boundAppointment : null, event);
                }
                that._raiseEvent('contextMenuOpen', { menu: that.menu, appointment: that.selectedJQXAppointment ? that.selectedJQXAppointment.boundAppointment : null });
                that._removeFeedbackAndStopResize();
            });


            this.addHandler(this.menu, 'close', function (event) {
                if (that.contextMenuClose) {
                    that.contextMenuClose(that.menu, that.selectedJQXAppointment ? that.selectedJQXAppointment.boundAppointment : null, event);
                }
                that._hasOpenedMenu = false;
                if (document.activeElement && document.activeElement.className.indexOf('jqx-menu') >= 0 && !that.menuOpening) {
                    that.focus();
                }
                that._raiseEvent('contextMenuClose', { menu: that.menu, appointment: that.selectedJQXAppointment ? that.selectedJQXAppointment.boundAppointment : null });
            });

            this.addHandler(this.host, 'contextmenu', function (event) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            });


            this.addHandler(this.menu, "itemclick", function (event) {
                var item = that.menu.jqxMenu('getItem', event.args.id);
                that._raiseEvent('contextMenuItemClick', { item: item, menu: that.menu, appointment: that.selectedJQXAppointment ? that.selectedJQXAppointment.boundAppointment : null });
                if (that.contextMenuItemClick) {
                    var result = that.contextMenuItemClick(that.menu, that.selectedJQXAppointment ? that.selectedJQXAppointment.boundAppointment : null, event);
                    if (result == true) {
                        if (new Date() - that.renderedTime > 500) {
                            that._renderrows();
                        }
                        that.menu.jqxMenu('close');
                        that._hasOpenedMenu = false;
                        return;
                    }
                }

                if (item.id == "createAppointment") {
                    that._initDialog();
                    that._openDialog();
                    if (event.args.clickType == "keyboard") {
                        that.menu.jqxMenu('close');
                        that._hasOpenedMenu = false;
                    }
                }
                else if (item.id == "editAppointment") {
                    var jqxAppointment = that.getJQXAppointmentByElement(that.selectedAppointment);
                    if (!jqxAppointment.readOnly) {
                        var result = that._initDialog(jqxAppointment);
                        if (result !== false) {
                            that._openDialog();
                        }
                    }
                    if (event.args.clickType == "keyboard") {
                        that.menu.jqxMenu('close');
                        that._hasOpenedMenu = false;
                    }
                }
                else {
                    if (event.args.clickType == "keyboard") {
                        that.menu.jqxMenu('close');
                        that._hasOpenedMenu = false;
                    }
                    return true;
                }
            });

            var source = new Array();
            source.push({ label: this.schedulerLocalization.contextMenuEditAppointmentString, id: "editAppointment" });
            source.push({ label: this.schedulerLocalization.contextMenuCreateAppointmentString, id: "createAppointment" });
            var contextMenuSettings = { rtl: this.rtl, keyboardNavigation: true, source: source, popupZIndex: 999999, autoOpenPopup: false, mode: 'popup', theme: this.theme, animationShowDuration: 0, animationHideDuration: 0, animationShowDelay: 0 };
            if (that.contextMenuCreate) {
                that.contextMenuCreate(that.menu, contextMenuSettings);
            }
            that._raiseEvent('contextMenuCreate', { menu: that.menu, settings: contextMenuSettings });

            this.menu.jqxMenu(contextMenuSettings);
        }
    },

    _initDialog: function (appointment, deleteKey) {
        var that = this;
        var range = null;

        if (appointment && appointment.isRecurrentAppointment() && !that.editRecurrenceDialog.jqxWindow('isOpen')) {
            var coord = that.host.coord();
            var top = coord.top + that.host.height() / 2 - that.editRecurrenceDialog.height() / 2;
            var left = coord.left + that.host.width() / 2 - that.editRecurrenceDialog.width() / 2;
            that.editRecurrenceDialog.find('button:first').focus();
            setTimeout(function () {
                that.editRecurrenceDialog.find('button:first').focus();
            }, 25);
            that.editRecurrenceDialog.jqxWindow('move', left, top);
            that.editRecurrenceDialog.jqxWindow('open');
            that.editSeries = function (editSeries) {
                if (editSeries) {
                    that._initDialog(appointment.rootAppointment);
                    that._openDialog();
                }
                else {
                    that._initDialog(appointment);
                    that._openDialog();
                }
            }
            that.overlay.show();
            that.overlay.width(that.host.width());
            that.overlay.height(that.host.height());
            var coord = that.host.coord();
            that.overlay.offset(coord);
            if (!that._editDialog) {
                that._initDialog();
            }
            return false;
        }

        that.editAppointment = appointment;
        if (!appointment) {
            range = that.getSelection();
            if (!range) {
                that.focus();
                that.focusedCell.setAttribute('data-selected', "true");
                that._lastSelectedCell = that.focusedCell;
                that._updateCellsSelection(that.focusedCell);
                range = that.getSelection();
            }
        }

        if (range || appointment) {
            var start = range ? range.from : appointment.from;
            var end = range ? range.to : appointment.to;

            var selectedCells = that.getSelectedCells();
            if (selectedCells.length > 0) {
                var hasEndDate = selectedCells[selectedCells.length - 1].getAttribute('data-end-date');
                if (hasEndDate) {
                    end = $.jqx.scheduler.utilities.getEndOfDay(end);
                }
            }
            that._editStart = start;
            that._editEnd = end;
        }

        if (that.editDialogFields && that.editDialogFields.resourceContainer && that._resources.length > 0) {
            var resources = new Array();
            for (var i = 0; i < that._resources.length; i++) {
                resources.push(that._resources[i]);
            }

            var dropDownHeight = true;
            if (resources.length > 10) dropDownHeight = false;
            that.editDialogFields.resource.jqxDropDownList({ source: resources, selectedIndex: 0, autoDropDownHeight: dropDownHeight });
            if (!appointment) {
                that.editDialogFields.resource.val(range.resourceId);
            }
        }

        if (that.editDialogFields && that.editDialogFields.repeatContainer) {
            if (appointment && appointment.rootAppointment) {
                that.editDialogFields.repeatContainer.hide();
                that.editDialogFields.repeatPanel.hide();
            }
            else {
                that.editDialogFields.repeatContainer.show();
                that.editDialogFields.repeatPanel.show();
            }
        }

        if (that._editDialog == null) {
            that._editDialog = null;
            var title = appointment == null ? that.schedulerLocalization.editDialogCreateTitleString : that.schedulerLocalization.editDialogTitleString;
            var _editDialog = $("<div><div>" + title + "</div><div id='dialog" + this.element.id + "'></div></div>");
            $(_editDialog).jqxWindow({
                rtl: that.rtl, zIndex: 99999,
                autoFocus: false, autoOpen: false, animationType: "none", theme: that.theme, width: 530, maxHeight: 800, minHeight: 110, resizable: false, initContent: function () {
                    that.editDialogFields = {};
                    if (start == null && end == null && that._editStart && that._editEnd) {
                        start = that._editStart;
                        end = that._editEnd;
                    }

                    _editDialog.jqxWindow('setTitle', title);
                    var content = $(_editDialog.children()[1]);
                    var subject = $("<div></div>");
                    content.append(subject);
                    var subjectLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogSubjectString + "</div>").appendTo(subject);
                    var subjectField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(subject);
                    var subjectInput = $("<input type='text'/>").appendTo(subjectField);
                    subjectInput.jqxInput({ rtl: that.rtl, width: '100%', height: 25, theme: that.theme });
                    subjectInput.css('box-sizing', 'border-box');
                    that.editDialogFields.subject = subjectInput;
                    that.editDialogFields.subjectLabel = subjectLabel;
                    that.editDialogFields.subjectContainer = subject;

                    var location = $("<div></div>");
                    content.append(location);
                    var locationLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogLocationString + "</div>").appendTo(location);
                    var locationField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(location);
                    var locationInput = $("<input type='text'/>").appendTo(locationField);
                    locationInput.jqxInput({ rtl: that.rtl, width: '100%', height: 25, theme: that.theme });
                    locationInput.css('box-sizing', 'border-box');

                    that.editDialogFields.location = locationInput;
                    that.editDialogFields.locationLabel = locationLabel;
                    that.editDialogFields.locationContainer = location;

                    var from = $("<div></div>");
                    content.append(from);
                    var fromLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogFromString + "</div>").appendTo(from);
                    var fromField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(from);
                    var fromInput = $("<div></div>").appendTo(fromField);

                    var fromInputDate = null;
                    if (!start) {
                        var date = new Date();
                        date.setHours(9, 0, 0);
                        fromInputDate = date;
                    }
                    else fromInputDate = start.toDate();

                    fromInput.jqxDateTimeInput({ dropDownWidth: 220, dropDownHeight: 220, rtl: that.rtl, localization: that._getDateTimeInputLocalization(), firstDayOfWeek: that.schedulerLocalization.firstDay, todayString: that.schedulerLocalization.todayString, clearString: that.schedulerLocalization.clearString, value: fromInputDate, formatString: that.editDialogDateTimeFormatString, width: '100%', showTimeButton: true, height: 25, theme: that.theme });
                    that.editDialogFields.from = fromInput;
                    that.editDialogFields.fromLabel = fromLabel;
                    that.editDialogFields.fromContainer = from;

                    var to = $("<div></div>");
                    content.append(to);
                    var toLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogToString + "</div>").appendTo(to);
                    var toField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(to);
                    var toInput = $("<div></div>").appendTo(toField);

                    var toInputDate = null;
                    if (!end) {
                        var date = new Date();
                        date.setHours(10, 0, 0);
                        toInputDate = date;
                    }
                    else toInputDate = end.toDate();

                    toInput.jqxDateTimeInput({ dropDownWidth: 220, dropDownHeight: 220, rtl: that.rtl, localization: that._getDateTimeInputLocalization(), firstDayOfWeek: that.schedulerLocalization.firstDay, todayString: that.schedulerLocalization.todayString, clearString: that.schedulerLocalization.clearString, value: toInputDate, formatString: that.editDialogDateTimeFormatString, width: '100%', showTimeButton: true, height: 25, theme: that.theme });

                    that.editDialogFields.to = toInput;
                    that.editDialogFields.toLabel = toLabel;
                    that.editDialogFields.toContainer = to;
                    that._changeFromUser = true;
                    that.addHandler(fromInput, "change", function (event) {
                        if (!that._changeFromUser)
                            return;

                        var args = event.args;
                        var from = event.args.oldValue;
                        var to = toInput.val('date');
                        var milliseconds = new $.jqx.date(to) - new $.jqx.date(from);
                        if (milliseconds > 0) {
                            var ticks = milliseconds * 10000;
                            var duration = $.jqx.timeSpan(ticks);
                            var newTo = new $.jqx.date(event.args.newValue).add(duration);
                            toInput.val(newTo.toDate());
                        }
                    });

                    that.addHandler(toInput, "change", function (event) {
                        if (!that._changeFromUser)
                            return;

                        var args = event.args;
                        var from = event.args.oldValue;
                        var to = toInput.val('date');
                        if (fromInput.val('date') >= to) {
                            toInput.val(from);
                        }
                    });

                    var allDay = $("<div></div>");
                    content.append(allDay);
                    var allDayLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogAllDayString + "</div>").appendTo(allDay);
                    var allDayField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(allDay);
                    var allDayInput = $("<div style='position:relative;'></div>").appendTo(allDayField);
                    allDayInput.jqxCheckBox({ rtl: that.rtl, height: 25, width: 25, theme: that.theme });
                    that.editDialogFields.allDay = allDayInput;
                    that.editDialogFields.allDayLabel = allDayLabel;
                    that.editDialogFields.allDayContainer = allDay;

                    that.addHandler(allDay, "change", function (event) {
                        if (event.args.checked) {
                            toInput.jqxDateTimeInput({ showTimeButton: false, formatString: that.editDialogDateFormatString });
                            fromInput.jqxDateTimeInput({ showTimeButton: false, formatString: that.editDialogDateFormatString });
                        }
                        else {
                            toInput.jqxDateTimeInput({ showTimeButton: true, formatString: that.editDialogDateTimeFormatString });
                            fromInput.jqxDateTimeInput({ showTimeButton: true, formatString: that.editDialogDateTimeFormatString });
                        }
                    });

                    if ($.jqx.scheduler.utilities.getStartOfDay(start).equals(start) && $.jqx.scheduler.utilities.getEndOfDay(end).equals(end)) {
                        that.editDialogFields.allDay.val(true);
                    }
                    if (that._views[that._view].type.indexOf("month") >= 0 || (start && start.equals(end)) || (end && end.equals($.jqx.scheduler.utilities.getEndOfDay(end)))) {
                        that.editDialogFields.allDay.val(true);
                    }

                    var timeZone = $("<div></div>");
                    content.append(timeZone);
                    var timeZoneLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogTimeZoneString + "</div>").appendTo(timeZone);
                    var timeZoneField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(timeZone);
                    var timeZoneInput = $("<div></div>").appendTo(timeZoneField);
                    var timeZones = new Array();
                    timeZones.push({ displayName: that.schedulerLocalization.editDialogSelectTimeZoneString, id: null });
                    timeZones = timeZones.concat(that.timeZones);
                    for (var i = 0; i < timeZones.length; i++) {
                        var tz = timeZones[i];
                        var nameIndex = tz.displayName.indexOf(')');
                        if (nameIndex >= 0) {
                            var searchName = tz.displayName.substring(2 + nameIndex);
                        }
                        else {
                            var searchName = tz.displayName;
                        }
                        tz.searchName = searchName;
                    }

                    timeZoneInput.jqxDropDownList({
                        rtl: that.rtl,
                        placeHolder: that.schedulerLocalization.editDialogSelectTimeZoneString,
                        width: '100%', height: 25, theme: that.theme, searchMember: 'searchName'
                        , source: timeZones, displayMember: 'displayName', valueMember: 'id'
                    });
                    that.editDialogFields.timeZone = timeZoneInput;
                    that.editDialogFields.timeZoneLabel = timeZoneLabel;
                    that.editDialogFields.timeZoneContainer = timeZone;

                    that.initRepeatPanels(_editDialog, content, end.toDate());
                    if (that.editDialogFields && that.editDialogFields.repeatContainer) {
                        if (that.editAppointment && that.editAppointment.rootAppointment) {
                            that.editDialogFields.repeatContainer.hide();
                            that.editDialogFields.repeatPanel.hide();
                        }
                        else {
                            that.editDialogFields.repeatContainer.show();
                            that.editDialogFields.repeatPanel.show();
                        }
                    }
                    // description
                    var description = $("<div></div>");
                    content.append(description);
                    var descriptionLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogDescriptionString + "</div>").appendTo(description);
                    var descriptionField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(description);
                    var descriptionInput = $("<textarea type='text' resizable='off' style='position:relative; top: 3px; padding:3px;'></textarea>").appendTo(descriptionField);
                    descriptionInput.jqxInput({ rtl: that.rtl, height: 40, width: '100%', theme: that.theme });
                    descriptionInput.css('box-sizing', 'border-box');
                    that.editDialogFields.description = descriptionInput;
                    that.editDialogFields.descriptionLabel = descriptionLabel;
                    that.editDialogFields.descriptionContainer = description;

                    // color
                    var color = $("<div></div>");
                    content.append(color);
                    var colorLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogColorString + "</div>").appendTo(color);
                    var colorField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(color);
                    var colorInput = $("<div></div>").appendTo(colorField);
                    var itemTemplate = function (index) {
                        if (index == -1) return "";
                        var color = that.colors[index];
                        var html = "";
                        var html = "";
                        html += "<div style='margin-top: 1px; float: left; border-radius: 3px; width: 96%; height: 20px; border: none; background:" + color + "; margin-left: 2%;'></div>";
                        return html;
                    };

                    var selectionTemplate = function (element, index) {
                        if (index < 0) {
                            element.css('top', '4px');
                            element.css('position', 'relative');
                            return element[0].outerHTML;
                        }
                        var color = that.colors[index];
                        var html = "";
                        html += "<div style='margin-top: 2px; float: left; border-radius: 3px; width: 96%; height: 20px; border: none; background:" + color + "; margin-left: 2%;'></div>";
                        return html;
                    };

                    colorInput.jqxDropDownList({ rtl: that.rtl, selectedIndex: -1, placeHolder: that.schedulerLocalization.editDialogColorPlaceHolderString, selectionRenderer: selectionTemplate, renderer: itemTemplate, source: that.colors, height: 25, width: '100%', theme: that.theme });

                    that.editDialogFields.color = colorInput;
                    that.editDialogFields.colorLabel = colorLabel;
                    that.editDialogFields.colorContainer = color;

                    // status
                    var status = $("<div></div>");
                    content.append(status);
                    var statusLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogStatusString + "</div>").appendTo(status);
                    var statusField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(status);
                    var statusInput = $("<div></div>").appendTo(statusField);

                    statusInput.jqxDropDownList({ rtl: that.rtl, selectedIndex: 2, autoDropDownHeight: true, source: that.schedulerLocalization.editDialogStatuses, height: 25, width: '100%', theme: that.theme });

                    that.editDialogFields.status = statusInput;
                    that.editDialogFields.statusLabel = statusLabel;
                    that.editDialogFields.statusContainer = status;

                    // resource
                    var resource = $("<div></div>");
                    content.append(resource);
                    var resourceLabel = $("<div class='jqx-scheduler-edit-dialog-label'>" + that.schedulerLocalization.editDialogResourceIdString + "</div>").appendTo(resource);
                    var resourceField = $("<div class='jqx-scheduler-edit-dialog-field'></div>").appendTo(resource);
                    var resourceInput = $("<div></div>").appendTo(resourceField);

                    var resources = new Array();
                    for (var i = 0; i < that._resources.length; i++) {
                        resources.push(that._resources[i]);
                    }

                    var dropDownHeight = true;
                    if (resources.length > 10) dropDownHeight = false;
                    resourceInput.jqxDropDownList({ rtl: that.rtl, source: resources, selectedIndex: 0, autoDropDownHeight: dropDownHeight, height: 25, width: '100%', theme: that.theme });
                    that.editDialogFields.resource = resourceInput;
                    that.editDialogFields.resourceLabel = resourceLabel;
                    that.editDialogFields.resourceContainer = resource;
                    if (resources.length == 0) {
                        resource.hide();
                    }
                    if (!appointment && range) {
                        that.editDialogFields.resource.val(range.resourceId);
                    }

                    var buttons = $("<div></div>");
                    content.append(buttons);
                    var buttonsField = $("<div style='width:100%;' class='jqx-scheduler-edit-dialog-field'></div>").appendTo(buttons);
                    var cancelButton = $("<button style='margin-left: 5px; float:right;'>" + that.schedulerLocalization.editDialogCancelString + "</button>").appendTo(buttonsField);
                    var deleteButton = $("<button style='margin-left: 5px; float:right;'>" + that.schedulerLocalization.editDialogDeleteString + "</button>").appendTo(buttonsField);
                    var deleteSeriesButton = $("<button style='display: none; margin-left: 5px; float:right;'>" + that.schedulerLocalization.editDialogRepeatDeleteSeriesString + "</button>").appendTo(buttonsField);
                    var deleteExceptionsButton = $("<button style='display: none; margin-left: 5px; float:right;'>" + that.schedulerLocalization.editDialogRepeatDeleteString + "</button>").appendTo(buttonsField);
                    var saveButton = $("<button style='margin-left: 5px; float:right;'>" + that.schedulerLocalization.editDialogSaveString + "</button>").appendTo(buttonsField);
                    var saveSeriesButton = $("<button style='display: none; margin-left: 5px; float:right;'>" + that.schedulerLocalization.editDialogRepeatSaveSeriesString + "</button>").appendTo(buttonsField);
                    var saveOccurrenceButton = $("<button style='display: none; margin-left: 5px; float:right;'>" + that.schedulerLocalization.editDialogRepeatSaveString + "</button>").appendTo(buttonsField);

                    var buttonHeight = 25;
                    if (that.isTouchDevice()) {
                        buttonHeight = null;
                    }

                    deleteButton.jqxButton({ rtl: that.rtl, theme: that.theme, height: buttonHeight });
                    deleteSeriesButton.jqxButton({ rtl: that.rtl, theme: that.theme, height: buttonHeight });
                    deleteExceptionsButton.jqxButton({ rtl: that.rtl, theme: that.theme, height: buttonHeight });
                    saveButton.jqxButton({ rtl: that.rtl, theme: that.theme, height: buttonHeight });
                    cancelButton.jqxButton({ rtl: that.rtl, theme: that.theme, height: buttonHeight });
                    saveSeriesButton.jqxButton({ rtl: that.rtl, theme: that.theme, height: buttonHeight });
                    saveOccurrenceButton.jqxButton({ rtl: that.rtl, theme: that.theme, height: buttonHeight });
                    saveSeriesButton.hide();
                    saveOccurrenceButton.hide();
                    that.editDialogFields.saveOccurrenceButton = saveOccurrenceButton;
                    that.editDialogFields.saveSeriesButton = saveSeriesButton;
                    that.editDialogFields.saveButton = saveButton;
                    that.editDialogFields.cancelButton = cancelButton;
                    that.editDialogFields.deleteButton = deleteButton;
                    that.editDialogFields.deleteSeriesButton = deleteSeriesButton;
                    that.editDialogFields.deleteExceptionsButton = deleteExceptionsButton;
                    that.editDialogFields.buttons = buttonsField;
                    that.addHandler(deleteButton, "click", function () {
                        _editDialog.jqxWindow("close");
                        that.overlay.hide();
                        that._deleteAppointment(that.editAppointment);
                    });
                    that.addHandler(cancelButton, "click", function () {
                        _editDialog.jqxWindow("close");
                        that.overlay.hide();
                    });
                    that.addHandler(saveOccurrenceButton, "click", function () {
                        if (!that.editAppointment.isException()) {
                            if (that.editAppointment.rootAppointment != null) {
                                that.editAppointment.rootAppointment.exceptions.push(that.editAppointment);
                                that.editAppointment.rootAppointment.recurrenceException.push(that.editAppointment.occurrenceFrom);
                            }
                            else {
                                that.editAppointment.exceptions.push(that.editAppointment);
                                that.editAppointment.recurrenceException.push(that.editAppointment.occurrenceFrom);
                            }
                        }
                        else {
                            var exceptions = that.editAppointment.rootAppointment ? that.editAppointment.rootAppointment.exceptions : that.editAppointment.exceptions;
                            for (var i = 0; i < exceptions.length; i++) {
                                if (exceptions[i].occurrenceFrom.equals(that.editAppointment.occurrenceFrom)) {
                                    exceptions[i] = that.editAppointment;
                                    break;
                                }
                            }
                        }

                        var result = that._setAppointmentPropertiesFromDialog(that.editAppointment, "occurrence");
                        if (!result)
                            return;

                        that.changedAppointments[that.editAppointment.id] = { type: "Update", appointment: that.editAppointment.boundAppointment };
                        that._raiseEvent('appointmentChange', { appointment: that.editAppointment.boundAppointment });
                        that._renderrows();
                        _editDialog.jqxWindow("close");
                        that.overlay.hide();
                    });
                    that.addHandler(saveSeriesButton, "click", function () {
                        var appointment = that.editAppointment;
                        if (appointment.rootAppointment) {
                            appointment = appointment.rootAppointment;
                        }

                        var result = that._setAppointmentPropertiesFromDialog(appointment, "series");
                        if (!result)
                            return;

                        that.changedAppointments[appointment.id] = { type: "Update", appointment: appointment.boundAppointment };
                        that._raiseEvent('appointmentChange', { appointment: appointment.boundAppointment });
                        that._renderrows();
                        _editDialog.jqxWindow("close");
                        that.overlay.hide();
                    });
                    that.addHandler(saveButton, "click", function () {
                        var result = true;
                        if (that.editAppointment == null) {
                            var uiappointment = new $.jqx.scheduler.appointment();
                            result = that._setAppointmentPropertiesFromDialog(uiappointment, "none");
                            if (result) {
                                that.addAppointment(uiappointment);
                            }
                        }
                        else {
                            if (that.editAppointment.rootAppointment) {
                                saveOccurrenceButton.trigger('click');
                                result = false;
                            }
                            else if (that.editAppointment.isRecurrentAppointment()) {
                                saveSeriesButton.trigger('click');
                                result = false;
                            }
                            else {
                                result = that._setAppointmentPropertiesFromDialog(that.editAppointment, "none");
                                if (result) {
                                    that.changedAppointments[that.editAppointment.id] = { type: "Update", appointment: that.editAppointment ? that.editAppointment.boundAppointment : null };
                                    that._raiseEvent('appointmentChange', { appointment: that.editAppointment.boundAppointment });
                                    that._renderrows();
                                }
                            }
                        }
                        if (result) {
                            _editDialog.jqxWindow("close");
                            that.overlay.hide();
                        }
                    });
                    that.addHandler(_editDialog, "close", function (event) {
                        that.overlay.hide();
                        that.focus();
                        if (that.editDialogClose) {
                            that.editDialogClose(_editDialog, that.editDialogFields, that.editAppointment ? that.editAppointment.boundAppointment : null);
                        }
                        that._raiseEvent('editDialogClose', { dialog: _editDialog, fields: that.editDialogFields, appointment: that.editAppointment ? that.editAppointment.boundAppointment : null });
                    });

                    if (that.editDialogCreate) {
                        that.editDialogCreate(_editDialog, that.editDialogFields, that.editAppointment);
                    }
                    that._raiseEvent('editDialogCreate', { dialog: _editDialog, fields: that.editDialogFields, appointment: that.editAppointment ? that.editAppointment.boundAppointment : null });

                    _editDialog.jqxWindow({ height: content[0].scrollHeight + 40 });
                }
            });
            that._editDialog = _editDialog;
        }

        if (!that.dialogOpenings) {
            that.dialogOpenings = 0;
        }
        that.removeHandler(that._editDialog, "open");
        that.addHandler(that._editDialog, "open", function (event) {
            if (that.editDialogOpen && that.editDialogFields) {
                var result = that.editDialogOpen(_editDialog, that.editDialogFields, that.editAppointment ? that.editAppointment.boundAppointment : null);
                if (result == true)
                    return;
            }
            if (that.rtl) {
                that._editDialog.find(".jqx-scheduler-edit-dialog-label").addClass(that.toThemeProperty('jqx-scheduler-edit-dialog-label-rtl'));
                that._editDialog.find(".jqx-scheduler-edit-dialog-field").addClass(that.toThemeProperty('jqx-scheduler-edit-dialog-field-rtl'));
                that.editDialogFields.saveOccurrenceButton.css('float', 'left');
                that.editDialogFields.saveSeriesButton.css('float', 'left');
                that.editDialogFields.saveButton.css('float', 'left');
                that.editDialogFields.cancelButton.css('float', 'left');
                that.editDialogFields.deleteButton.css('float', 'left');
                that.editDialogFields.deleteSeriesButton.css('float', 'left');
                that.editDialogFields.deleteExceptionsButton.css('float', 'left');
                that.editDialogFields.buttons.css('width', 'auto');
                that.editDialogFields.allDay.css('float', 'right');
            }

            setTimeout(function () {
                var editApp = that.editAppointment ? that.editAppointment.boundAppointment : null;
                if (that.editAppointment && that.editAppointment.rootAppointment) {
                    editApp = that.editAppointment.rootAppointment.boundAppointment;
                }

                that._raiseEvent('editDialogOpen', { dialog: that._editDialog, fields: that.editDialogFields, appointment: editApp });
            });
            var focus = function () {
                setTimeout(function () {
                    if (!deleteKey) {
                        that.editDialogFields.subject.focus();
                        that.editDialogFields.subject.select();
                    }
                    else {
                        that.editDialogFields.deleteButton.focus();
                    }
                }, 1);
            }

            if (0 == that.dialogOpenings && !appointment) {
                that.dialogOpenings++;
                if (!that.isTouchDevice()) {
                    that._editDialog.jqxWindow({ height: 150 });
                    that._editDialog.jqxWindow({ height: $(that._editDialog.children())[1].scrollHeight + 40 });
                }
                focus();
                return;
            }
            if (that.editDialogFields) {
                that.editDialogFields.subject.val("");
                that.editDialogFields.location.val("");
                focus();

                that.editDialogFields.resetExceptions.val(false);
                that.editDialogFields.description.val("");
                if (!appointment) {
                    that.editDialogFields.deleteButton.hide();
                }
                if (appointment) {
                    that.dialogOpenings++;
                    that.editDialogFields.deleteButton.show();
                    that.editDialogFields.subject.val(appointment.subject);
                    that.editDialogFields.location.val(appointment.location);
                    that.editDialogFields.description.val(appointment.description);
                    that.editDialogFields.timeZone.val(appointment.timeZone);
                    if (that.colors.indexOf(appointment.borderColor) >= 0) {
                        that.editDialogFields.color.val(appointment.borderColor);
                    }
                    else that.editDialogFields.color.jqxDropDownList('clearSelection');

                    that.editDialogFields.allDay.val(appointment.allDay);
                    that.editDialogFields.resource.val(appointment.resourceId);
                    that.editDialogFields.status.val(appointment.status);
                    if (appointment.timeZone) {
                        appointment.from = appointment.from.toTimeZone(appointment.timeZone);
                        appointment.to = appointment.to.toTimeZone(appointment.timeZone);
                    }
                    start = appointment.from;
                    end = appointment.to;

                    if ($.jqx.scheduler.utilities.getStartOfDay(start).equals(start) && $.jqx.scheduler.utilities.getEndOfDay(end).equals(end)) {
                        that.editDialogFields.allDay.val(true);
                    }

                    that._setAppointmentPropertiesToDialog(appointment, start, end, range ? range.resourceId : null);
                }
                else {
                    that.editDialogFields.saveButton.show();
                    that._setAppointmentPropertiesToDialog(null, start, end, range ? range.resourceId : null);
                }

                if (start && end) {
                    that._changeFromUser = false;
                    that.editDialogFields.from.val(start.toDate());
                    that.editDialogFields.to.val(end.toDate());
                    that._changeFromUser = true;
                }
                if (!that.isTouchDevice()) {
                    that._editDialog.jqxWindow({ height: 150 });
                    that._editDialog.jqxWindow({ height: $(that._editDialog.children())[1].scrollHeight + 40 });
                }
            }
        });

        that.removeHandler(that._editDialog, "keydown");
        that.addHandler(that._editDialog, "keydown", function (event) {
            if (that.editDialogKeyDown) {
                var result = that.editDialogKeyDown(_editDialog, that.editDialogFields, that.editAppointment, event);
                if (result != undefined)
                    return result;
            }
            if (event.keyCode == 13) {
                if ($(document.activeElement).ischildof(that._editDialog)) {
                    if (document.activeElement.nodeName.toLowerCase() == "button")
                        return true;

                    if (appointment) {
                        if (appointment.isException() || appointment.rootAppointment) {
                            that.editDialogFields.saveOccurrenceButton.trigger('click');
                        }
                        else if (appointment.isRecurrentAppointment()) {
                            that.editDialogFields.saveSeriesButton.trigger('click');
                        }
                        else {
                            that.editDialogFields.saveButton.trigger('click');
                        }
                    }
                    else {
                        that.editDialogFields.saveButton.trigger('click');
                    }
                }
            }
            else if (event.keyCode == 27) {
                that.editDialogFields.cancelButton.trigger('click');
            }
        });

    },

    openMenu: function (menuLeft, menuTop) {
        var that = this;
        if (!that.menu) {
            that._initMenu();
        }

        var view = that._views[that._view].type;
     //   if (view == "agendaView")
     //       return;

        if (that.contextMenu && that.menu) {
            if (!that.selectedAppointment) {
                that.menu.jqxMenu('hideItem', 'editAppointment');
            }
            else {
                that.menu.jqxMenu('showItem', 'editAppointment');
            }
            if (arguments.length < 2) {
                if (that.selectedAppointment) {
                    var coord = that.selectedAppointment.coord();
                    menuLeft = coord.left;
                    menuTop = coord.top;
                }
                else if (that.focusedCell) {
                    var coord = $(that.focusedCell).coord();
                }
                menuLeft = coord.left;
                menuTop = coord.top;
            }

            that.menu.jqxMenu('open', menuLeft, menuTop);
            that._hasOpenedMenu = true;
        }
    },

    closeMenu: function () {
        var that = this;
        if (that.contextMenu && that.menu) {
            setTimeout(function () {
                that.menu.jqxMenu('close');
            });
        }
    },

    closeDialog: function () {
        var that = this;
        that._editDialog.jqxWindow('close');
    },

    openDialog: function (dialogLeft, dialogTop) {
        var that = this;
        var view = that._views[that._view].type;
   //     if (view == "agendaView")
   //         return;

        if (that.selectedJQXAppointment) {
            var result = that._initDialog(that.selectedJQXAppointment);
            if (result !== false) {
                that._openDialog(dialogLeft, dialogTop);
            }
        }
        else {
            if (that.getSelection() == null) {
                that.focus();
                that.focusedCell.setAttribute('data-selected', "true");
                that._lastSelectedCell = that.focusedCell;
                that._updateCellsSelection(that.focusedCell);
            }
            that._initDialog();
            that._openDialog(dialogLeft, dialogTop);
        }
    },

    _openDialog: function (dialogLeft, dialogTop) {
        var that = this;
        var view = that._views[that._view].type;

        if (!that.editDialog) {
            return;
        }

        var coord = that.host.coord();
        that.overlay.show();
        that.overlay.css('z-index', 9999999);
        that.overlay.width(that.host.width());
        that.overlay.height(that.host.height());
        that.overlay.offset(coord);
        var touchDevice = that.isTouchDevice();
        if (touchDevice) {
            that._editDialog.jqxWindow('move', coord.left, coord.top);
            that._editDialog.jqxWindow({ draggable: false, maxWidth: that.host.width(), maxHeight: that.host.height() });
            that._editDialog.jqxWindow({ width: that.host.width(), height: that.host.height() });
            that._editDialog.jqxWindow('open');
            that._editDialog.jqxWindow('move', coord.left, coord.top);
        }
        else {
            if (dialogLeft != undefined && dialogTop != undefined) {
                that._editDialog.jqxWindow('move', dialogLeft, dialogTop);
                that._editDialog.jqxWindow('open');
            }
            else {
                var dialogHeight = that._editDialog.height();
                if (dialogHeight < 400) dialogHeight = 400;
                var top = coord.top + that.host.height() / 2 - dialogHeight / 2;
                var left = coord.left + that.host.width() / 2 - that._editDialog.width() / 2;
                that._editDialog.jqxWindow('move', left, top);
                that._editDialog.jqxWindow('open');
            }
        }

        setTimeout(function () {
            that.overlay.css('z-index', 999);
        }, 50);
    },

    _setAppointmentPropertiesFromDialog: function (appointment, type) {
        var that = this;
        var setAppointmentProperties = function (appointment) {
            var view = that._views[that._view].type;
            var viewObject = that._views[that._view];
            var from = that.editDialogFields.from.val('date');
            var to = that.editDialogFields.to.val('date');
            if (from > to) {
                that.editDialogFields.from.jqxDateTimeInput('focus');
                return false;
            }
            if (from == to) {
                if (view.indexOf("month") >= 0) {
                    return true;
                }
                return false;
            }

            appointment.resourceId = that.editDialogFields.resource.val();
            if (that.editDialogFields.resourceContainer.css('display') == "none") {
                appointment.resourceId = "";
            }

            appointment.description = that.editDialogFields.description.val();
            appointment.allDay = that.editDialogFields.allDay.val();
            appointment.status = that.editDialogFields.status.val();
            appointment.location = that.editDialogFields.location.val();

            appointment.timeZone = that.editDialogFields.timeZone.val();
            if (appointment.timeZone == "" && that.timeZone != "") {
                appointment.timeZone = that.timeZone;
            }

            appointment.from = new $.jqx.date(from, appointment.timeZone);
            appointment.to = new $.jqx.date(to, appointment.timeZone);

            if (that.timeZone) {
                appointment.from = appointment.from.toTimeZone(that.timeZone);
                appointment.to = appointment.to.toTimeZone(that.timeZone);
            }
            else {
                appointment.from = appointment.from.toTimeZone(null);
                appointment.to = appointment.to.toTimeZone(null);
            }
            if (appointment.allDay) {
                appointment.from = $.jqx.scheduler.utilities.getStartOfDay(appointment.from);
                appointment.to = $.jqx.scheduler.utilities.getEndOfDay(appointment.to);
            }

            if (that.editDialogFields.color.val()) {
                var colors = that.getAppointmentColors(that.editDialogFields.color.val());
                appointment.color = colors.color;
                appointment.background = colors.background;
                appointment.borderColor = colors.border;
            }
            appointment.subject = that.editDialogFields.subject.val();

            var repeatIndex = that.editDialogFields.repeat.jqxDropDownList('selectedIndex');
            var repeatPattern = new $.jqx.scheduler.recurrencePattern();
            var repeatEndPanel = that.editDialogFields.repeatEndPanel;
            repeatPattern.timeZone = that.timeZone;
            repeatPattern.from = appointment.from.clone();
            if (type == "occurrence") {
                if (appointment.rootAppointment) {
                    repeatPattern.from = appointment.rootAppointment.from.clone();
                }
            }

            if (that.editDialogFields.resetExceptions.val()) {
                appointment.exceptions = new Array();
                appointment.recurrenceException = new Array();
            }

            if (repeatEndPanel.repeatEndNever.val()) {
                repeatPattern.count = 1000;
                repeatPattern.to = new $.jqx.date(9999, 12, 31);
            }
            else if (repeatEndPanel.repeatEndAfter.val()) {
                repeatPattern.count = repeatEndPanel.repeatEndAfterValue.val();
                repeatPattern.to = new $.jqx.date(9999, 12, 31);
            }
            else if (repeatEndPanel.repeatEndOn.val()) {
                repeatPattern.count = 1000;
                var to = new $.jqx.date(repeatEndPanel.repeatEndOnValue.jqxDateTimeInput('getDate'), that.timeZone);
                repeatPattern.to = to;
            }

            switch (repeatIndex) {
                case 0:
                default:
                    appointment.clearRecurrence();
                    break;
                case 1:
                    var dailyPattern = that.editDialogFields.daily;
                    var interval = dailyPattern.repeatDayInterval.val();

                    repeatPattern.interval = interval;
                    repeatPattern.freq = "daily";
                    break;
                case 2:
                    var weeklyPattern = that.editDialogFields.weekly;
                    var interval = weeklyPattern.repeatWeekInterval.val();
                    var weekDays = [
                       { Sunday: 0 },
                       { Monday: 1 },
                       { Tuesday: 2 },
                       { Wednesday: 3 },
                       { Thursday: 4 },
                       { Friday: 5 },
                       { Saturday: 6 }
                    ]
                    var days = weeklyPattern.repeatDays;
                    var byweekday = new Array();
                    repeatPattern.weekDays = {};

                    for (var i = 0; i < 7; i++) {
                        var day = days[i].val();
                        if (day) {
                            if (i == 0) {
                                byweekday.push(6);
                            }
                            else {
                                byweekday.push(i - 1);
                            }
                            $.extend(repeatPattern.weekDays, weekDays[i]);
                        }
                    }

                    repeatPattern.freq = "weekly";
                    repeatPattern.byweekday = byweekday;
                    repeatPattern.interval = interval;
                    break;
                case 3:
                    var monthlyPattern = that.editDialogFields.monthly;
                    var interval = monthlyPattern.repeatMonth.val();
                    if (monthlyPattern.repeatMonthDayBool.val()) {
                        repeatPattern.day = monthlyPattern.repeatMonthDay.val();
                        repeatPattern.bymonthday = new Array();
                        repeatPattern.bymonthday.push(repeatPattern.day);
                    }
                    else {
                        var dayOfWeek = monthlyPattern.repeatDayOfWeek.jqxDropDownList('selectedIndex');
                        var bynweekday = new Array();
                        if (dayOfWeek == 0) dayOfWeek = 6;
                        else dayOfWeek--;

                        var dayOfWeekType = monthlyPattern.repeatDayOfWeekType.jqxDropDownList('selectedIndex');
                        // 0 - first
                        // 1 - second
                        // 2 - third
                        // 3 - fourth
                        // 4 - last
                        var dayOfWeekStr = "";
                        switch (dayOfWeekType) {
                            case 0:
                                dayOfWeekStr = 1;
                                break;
                            case 1:
                                dayOfWeekStr = 2;
                                break;
                            case 2:
                                dayOfWeekStr = 3;
                                break;
                            case 3:
                                dayOfWeekStr = 4;
                                break;
                            case 4:
                                dayOfWeekStr = -1;
                                break;

                        }
                        bynweekday.push([dayOfWeek, dayOfWeekStr]);
                        repeatPattern.bynweekday = bynweekday;
                    }

                    repeatPattern.freq = "monthly";
                    repeatPattern.interval = interval;
                    break;
                case 4:
                    var yearlyPattern = that.editDialogFields.yearly;
                    var interval = yearlyPattern.repeatYear.val();
                    if (yearlyPattern.repeatYearBool.val()) {
                        repeatPattern.day = yearlyPattern.repeatYearDay.val();
                        repeatPattern.month = yearlyPattern.repeatYearMonth.jqxDropDownList('selectedIndex');
                        repeatPattern.bymonth = new Array();
                        repeatPattern.bymonth.push(1 + repeatPattern.month);
                        repeatPattern.byyearday = new Array();
                        repeatPattern.byyearday.push(repeatPattern.day);
                    }
                    else {
                        repeatPattern.month = yearlyPattern.repeatDayOfWeekMonth.jqxDropDownList('selectedIndex');
                        repeatPattern.bymonth = new Array();
                        repeatPattern.bymonth.push(1 + repeatPattern.month);
                        var dayOfWeek = yearlyPattern.repeatDayOfWeek.jqxDropDownList('selectedIndex');
                        var bynweekday = new Array();
                        if (dayOfWeek == 0) dayOfWeek = 6;
                        else dayOfWeek--;

                        var dayOfWeekType = yearlyPattern.repeatDayOfWeekType.jqxDropDownList('selectedIndex');
                        // 0 - first
                        // 1 - second
                        // 2 - third
                        // 3 - fourth
                        // 4 - last
                        var dayOfWeekStr = "";
                        switch (dayOfWeekType) {
                            case 0:
                                dayOfWeekStr = 1;
                                break;
                            case 1:
                                dayOfWeekStr = 2;
                                break;
                            case 2:
                                dayOfWeekStr = 3;
                                break;
                            case 3:
                                dayOfWeekStr = 4;
                                break;
                            case 4:
                                dayOfWeekStr = -1;
                                break;

                        }

                        bynweekday.push([dayOfWeek, dayOfWeekStr]);
                        repeatPattern.bynweekday = bynweekday;
                    }

                    repeatPattern.freq = "yearly";
                    repeatPattern.interval = interval;
                    break;
            }

            if (appointment.rootAppointment) {
                appointment.rootAppointment.recurrencePattern = repeatPattern;
            }
            else if (repeatIndex > 0) {
                appointment.recurrencePattern = repeatPattern;
            }
            var boundAppointment = {};
            var originalData = {};
            for (var key in that.appointmentDataFields) {
                var field = that.appointmentDataFields[key];
                var value = appointment[key];
                boundAppointment[key] = value;
                if (key == "from" || key == "to") {
                    value = value.toDate();
                }

                originalData[field] = value;
            }
            boundAppointment.originalData = originalData;
            appointment.boundAppointment = boundAppointment;

            return true;
        }(appointment);
        return setAppointmentProperties;
    },

    _setAppointmentPropertiesToDialog: function (appointment, start, end, resourceId) {
        var that = this;
        var resetRepeatFields = function () {
            var repeatEndPanel = that.editDialogFields.repeatEndPanel;
            repeatEndPanel.repeatEndNever.jqxRadioButton({ checked: true });
            repeatEndPanel.repeatEndAfterValue.val(1);
            repeatEndPanel.repeatEndOnValue.val(endJSDate);


            var endJSDate = end.toDate();

            if (that.editDialogFields.daily) {
                var dailyPattern = that.editDialogFields.daily;
                dailyPattern.repeatDayInterval.val(1);
            }
            if (that.editDialogFields.weekly) {
                var weeklyPattern = that.editDialogFields.weekly;
                for (var i = 0; i < weeklyPattern.repeatDays.length; i++) {
                    if (i == 1) {
                        weeklyPattern.repeatDays[i].jqxCheckBox({ checked: true });
                    }
                    else {
                        weeklyPattern.repeatDays[i].jqxCheckBox({ checked: false });
                    }
                }

                weeklyPattern.repeatWeekInterval.val(1);
            }

            if (that.editDialogFields.monthly) {
                var monthlyPattern = that.editDialogFields.monthly;
                monthlyPattern.repeatDayOfWeek.jqxDropDownList('selectIndex', 1);
                monthlyPattern.repeatDayOfWeekBool.jqxRadioButton({ checked: false });
                monthlyPattern.repeatDayOfWeekType.jqxDropDownList('selectIndex', 0)
                monthlyPattern.repeatMonthDayBool.jqxRadioButton({ checked: true });
                monthlyPattern.repeatMonthDay.val(1);
                monthlyPattern.repeatMonth.val(1);
            }

            if (that.editDialogFields.yearly) {
                var yearlyPattern = that.editDialogFields.yearly;
                yearlyPattern.repeatDayOfWeekMonth.jqxDropDownList('selectIndex', 0);
                yearlyPattern.repeatDayOfWeekBool.jqxRadioButton({ checked: false });
                yearlyPattern.repeatDayOfWeekType.jqxDropDownList('selectIndex', 0)
                yearlyPattern.repeatDayOfWeek.jqxDropDownList('selectIndex', 1);
                yearlyPattern.repeatYear.val(1);
                yearlyPattern.repeatYearMonth.jqxDropDownList('selectIndex', 0);
                yearlyPattern.repeatYearDay.val(1);
                yearlyPattern.repeatYearBool.val(true);
            }
        }
        resetRepeatFields();

        if (appointment && appointment.isRecurrentAppointment()) {
            if (!appointment.rootAppointment) {
                that.editDialogFields.resetExceptionsContainer.show();
            }
            else {
                that.editDialogFields.resetExceptionsContainer.hide();
            }
        }
        else if (appointment) {
            that.editDialogFields.resetExceptionsContainer.hide();
            that.editDialogFields.repeat.jqxDropDownList('selectIndex', 0);
        }

        if (!appointment) {
            that.editDialogFields.timeZone.jqxDropDownList('clearSelection');
            if (!resourceId) {
                that.editDialogFields.resource.jqxDropDownList('selectIndex', 0);
            }
            else {
                that.editDialogFields.resource.val(resourceId);
            }

            that.editDialogFields.allDay.val(false);
            if (that._views[that._view].type.indexOf("month") >= 0 || (start && start.equals(end)) || (end && end.equals($.jqx.scheduler.utilities.getEndOfDay(end)))) {
                that.editDialogFields.allDay.val(true);
            }
            that.editDialogFields.color.jqxDropDownList('clearSelection');
            that.editDialogFields.description.val('');
            that.editDialogFields.subject.val('');
            that.editDialogFields.repeat.jqxDropDownList('selectIndex', 0);
            return;
        }

        var setAppointmentProperties = function (appointment) {
            var repeatPattern = appointment.recurrencePattern;
            if (appointment.rootAppointment) {
                var repeatPattern = appointment.rootAppointment.recurrencePattern;
            }
            if (repeatPattern == null)
                return;

            var freq = repeatPattern.freq;
            var repeatIndex = 0;
            if (freq == "daily") repeatIndex = 1;
            if (freq == "weekly") repeatIndex = 2;
            if (freq == "monthly") repeatIndex = 3;
            if (freq == "yearly") repeatIndex = 4;

            var repeatEndPanel = that.editDialogFields.repeatEndPanel;
            if (repeatPattern.count != 1000) {
                repeatEndPanel.repeatEndAfter.jqxRadioButton({ checked: true });
                repeatEndPanel.repeatEndAfterValue.val(repeatPattern.count);
            }
            else if (repeatPattern.to.year() != 9999) {
                repeatEndPanel.repeatEndOn.jqxRadioButton({ checked: true });
                repeatEndPanel.repeatEndOnValue.val(repeatPattern.to.toDate());
            }
            else {
                repeatEndPanel.repeatEndNever.jqxRadioButton({ checked: true });
            }

            that.editDialogFields.repeat.jqxDropDownList('selectIndex', repeatIndex);
            switch (repeatIndex) {
                case 1:
                    var interval = repeatPattern.interval;
                    var dailyPattern = that.editDialogFields.daily;
                    dailyPattern.repeatDayInterval.val(interval);
                    break;
                case 2:
                    var interval = repeatPattern.interval;
                    var weeklyPattern = that.editDialogFields.weekly;
                    weeklyPattern.repeatWeekInterval.val(interval);

                    var days = repeatPattern.byweekday;

                    for (var i = 0; i < 7; i++) {
                        var day = weeklyPattern.repeatDays[i];
                        day.val(false);
                    }
                    for (var i = 0; i < days.length; i++) {
                        var day = days[i];
                        if (day == 6)
                            weeklyPattern.repeatDays[0].val(true);
                        else {
                            weeklyPattern.repeatDays[day + 1].val(true);
                        }
                    }
                    break;
                case 3:
                    var monthlyPattern = that.editDialogFields.monthly;
                    monthlyPattern.repeatMonth.val(repeatPattern.interval);
                    if (repeatPattern.bymonthday && repeatPattern.bymonthday.length > 0) {
                        monthlyPattern.repeatMonthDayBool.jqxRadioButton({ checked: true });
                        monthlyPattern.repeatMonthDay.val(repeatPattern.day);
                    }
                    else {
                        monthlyPattern.repeatDayOfWeekBool.jqxRadioButton({ checked: true });
                        var bynweekday = repeatPattern.bynweekday;
                        var dayOfWeek = bynweekday[0][0];
                        dayOfWeek++;
                        if (dayOfWeek == 7) dayOfWeek = 0;
                        monthlyPattern.repeatDayOfWeek.jqxDropDownList('selectIndex', dayOfWeek);
                        var dayOfWeekType = bynweekday[0][1];
                        var dayOfWeekIndex = "";
                        switch (dayOfWeekType) {
                            case 1:
                                dayOfWeekIndex = 0;
                                break;
                            case 2:
                                dayOfWeekIndex = 1;
                                break;
                            case 3:
                                dayOfWeekIndex = 2;
                                break;
                            case 4:
                                dayOfWeekIndex = 3;
                                break;
                            case -1:
                                dayOfWeekIndex = 4;
                                break;

                        }
                        monthlyPattern.repeatDayOfWeekType.jqxDropDownList('selectIndex', dayOfWeekIndex);
                    }

                    break;
                case 4:
                    var yearlyPattern = that.editDialogFields.yearly;

                    if (repeatPattern.byyearday && repeatPattern.byyearday.length > 0) {
                        yearlyPattern.repeatYearDay.val(repeatPattern.byyearday[0]);
                        yearlyPattern.repeatYearBool.val(true);
                    }
                    if (repeatPattern.bymonth && repeatPattern.bymonth.length > 0) {
                        yearlyPattern.repeatYearMonth.val(repeatPattern.bymonth[0]);
                        yearlyPattern.repeatYearBool.val(true);
                    }
                    if (!repeatPattern.byyearday || (repeatPattern.byyearday && repeatPattern.byyearday.length == 0)) {
                        yearlyPattern.repeatDayOfWeekMonth.val(repeatPattern.bymonth[0]);
                        yearlyPattern.repeatDayOfWeekBool.jqxRadioButton({ checked: true });
                        var bynweekday = repeatPattern.bynweekday;
                        var dayOfWeek = bynweekday[0][0];
                        dayOfWeek++;
                        if (dayOfWeek == 7) dayOfWeek = 0;
                        yearlyPattern.repeatDayOfWeek.jqxDropDownList('selectIndex', dayOfWeek);
                        var dayOfWeekType = bynweekday[0][1];
                        var dayOfWeekIndex = "";
                        switch (dayOfWeekType) {
                            case 1:
                                dayOfWeekIndex = 0;
                                break;
                            case 2:
                                dayOfWeekIndex = 1;
                                break;
                            case 3:
                                dayOfWeekIndex = 2;
                                break;
                            case 4:
                                dayOfWeekIndex = 3;
                                break;
                            case -1:
                                dayOfWeekIndex = 4;
                                break;

                        }
                        yearlyPattern.repeatDayOfWeekType.jqxDropDownList('selectIndex', dayOfWeekIndex);
                    }
                    break;
            }

        }
        setAppointmentProperties(appointment);
    }
});

    $.jqx.scheduler.column = function (owner, data) {
        this.owner = owner;
        this.datafield = null;
        this.displayfield = null;
        this.text = '';
        this.sortable = true;
        this.editable = true;
        this.hidden = false;
        this.hideable = true;
        this.groupable = true;
        this.renderer = null;
        this.cellsRenderer = null;
        this.columntype = null;
        this.cellsFormat = "";
        this.align = 'center';
        this.cellsalign = 'center';
        this.width = 'auto';
        this.minwidth = 60;
        this.maxwidth = 'auto';
        this.pinned = false;
        this.visibleindex = -1;
        this.filterable = true;
        this.filter = null;
        this.resizable = true;
        this.draggable = true;
        this.initeditor = null;
        this.createeditor = null;
        this.destroyeditor = null;
        this.geteditorvalue = null;
        this.autoCellHeight = true;
        this.validation = null;
        this.classname = '';
        this.cellclassname = '';
        this.rendered = null;
        this.exportable = true;
        this.nullable = true;
        this.columngroup = null;
        this.columntype = "textbox";

        this.getcolumnproperties = function () {
            return {
                nullable: this.nullable,
                sortable: this.sortable,
                hidden: this.hidden, groupable: this.groupable, width: this.width, align: this.align, editable: this.editable,
                minwidth: this.minwidth, maxwidth: this.maxwidth, resizable: this.resizable, datafield: this.datafield, text: this.text,
                exportable: this.exportable, cellsalign: this.cellsalign, pinned: this.pinned, cellsFormat: this.cellsFormat, columntype: this.columntype, classname: this.classname, cellclassname: this.cellclassname, menu: this.menu
            };
        },

        this.setproperty = function (propertyname, value) {
            if (this[propertyname]) {
                var oldvalue = this[propertyname];
                this[propertyname] = value;
                this.owner._columnPropertyChanged(this, propertyname, value, oldvalue);
            }
            else {
                if (this[propertyname.toLowerCase()]) {
                    var oldvalue = this[propertyname.toLowerCase()];
                    this[propertyname.toLowerCase()] = value;
                    this.owner._columnPropertyChanged(this, propertyname.toLowerCase(), value, oldvalue);
                }
            }
        }

        this._initfields = function (data) {
            if (data != null) {
                var that = this;
                if ($.jqx.hasProperty(data, 'dataField')) {
                    this.datafield = $.jqx.get(data, 'dataField');
                }

                if ($.jqx.hasProperty(data, 'displayField')) {
                    this.displayfield = $.jqx.get(data, 'displayField');
                }
                else {
                    this.displayfield = this.datafield;
                }
                if ($.jqx.hasProperty(data, 'columnType')) {
                    this.columntype = $.jqx.get(data, 'columnType');
                }
                if ($.jqx.hasProperty(data, 'validation')) {
                    this.validation = $.jqx.get(data, 'validation');
                }
                if ($.jqx.hasProperty(data, 'autoCellHeight')) {
                    this.autoCellHeight = $.jqx.get(data, 'autoCellHeight');
                }
                if ($.jqx.hasProperty(data, 'text')) {
                    this.text = $.jqx.get(data, 'text');
                }
                else {
                    this.text = this.displayfield;
                }

                if ($.jqx.hasProperty(data, 'sortable')) {
                    this.sortable = $.jqx.get(data, 'sortable');
                }
                if ($.jqx.hasProperty(data, 'hidden')) {
                    this.hidden = $.jqx.get(data, 'hidden');
                }
                if ($.jqx.hasProperty(data, 'groupable')) {
                    this.groupable = $.jqx.get(data, 'groupable');
                }
                if ($.jqx.hasProperty(data, 'renderer')) {
                    this.renderer = $.jqx.get(data, 'renderer');
                }
                if ($.jqx.hasProperty(data, 'align')) {
                    this.align = $.jqx.get(data, 'align');
                }
                if ($.jqx.hasProperty(data, 'cellsAlign')) {
                    this.cellsalign = $.jqx.get(data, 'cellsAlign');
                }
                if ($.jqx.hasProperty(data, 'cellsFormat')) {
                    this.cellsFormat = $.jqx.get(data, 'cellsFormat');
                }
                if ($.jqx.hasProperty(data, 'width')) {
                    this.width = $.jqx.get(data, 'width');
                }
                if ($.jqx.hasProperty(data, 'minWidth')) {
                    this.minwidth = $.jqx.get(data, 'minWidth');
                }
                if ($.jqx.hasProperty(data, 'maxWidth')) {
                    this.maxwidth = $.jqx.get(data, 'maxWidth');
                }
                if ($.jqx.hasProperty(data, 'cellsRenderer')) {
                    this.cellsRenderer = $.jqx.get(data, 'cellsRenderer');
                }
                if ($.jqx.hasProperty(data, 'columnType')) {
                    this.columntype = $.jqx.get(data, 'columnType');
                }
                if ($.jqx.hasProperty(data, 'pinned')) {
                    this.pinned = $.jqx.get(data, 'pinned');
                }
                if ($.jqx.hasProperty(data, 'filterable')) {
                    this.filterable = $.jqx.get(data, 'filterable');
                }
                if ($.jqx.hasProperty(data, 'filter')) {
                    this.filter = $.jqx.get(data, 'filter');
                }
                if ($.jqx.hasProperty(data, 'resizable')) {
                    this.resizable = $.jqx.get(data, 'resizable');
                }
                if ($.jqx.hasProperty(data, 'draggable')) {
                    this.draggable = $.jqx.get(data, 'draggable');
                }
                if ($.jqx.hasProperty(data, 'editable')) {
                    this.editable = $.jqx.get(data, 'editable');
                }
                if ($.jqx.hasProperty(data, 'initEditor')) {
                    this.initeditor = $.jqx.get(data, 'initEditor');
                }
                if ($.jqx.hasProperty(data, 'createEditor')) {
                    this.createeditor = $.jqx.get(data, 'createEditor');
                }
                if ($.jqx.hasProperty(data, 'destroyEditor')) {
                    this.destroyeditor = $.jqx.get(data, 'destroyEditor');
                }
                if ($.jqx.hasProperty(data, 'getEditorValue')) {
                    this.geteditorvalue = $.jqx.get(data, 'getEditorValue');
                }
                if ($.jqx.hasProperty(data, 'className')) {
                    this.classname = $.jqx.get(data, 'className');
                }
                if ($.jqx.hasProperty(data, 'cellClassName')) {
                    this.cellclassname = $.jqx.get(data, 'cellClassName');
                }
                if ($.jqx.hasProperty(data, 'rendered')) {
                    this.rendered = $.jqx.get(data, 'rendered');
                }
                if ($.jqx.hasProperty(data, 'exportable')) {
                    this.exportable = $.jqx.get(data, 'exportable');
                }
                if ($.jqx.hasProperty(data, 'nullable')) {
                    this.nullable = $.jqx.get(data, 'nullable');
                }
                if ($.jqx.hasProperty(data, 'columnGroup')) {
                    this.columngroup = $.jqx.get(data, 'columnGroup');
                }

                if (!data instanceof String && !(typeof data == "string")) {
                    for (var obj in data) {
                        if (!that.hasOwnProperty(obj)) {
                            if (!that.hasOwnProperty(obj.toLowerCase())) {
                                owner.host.remove();
                                throw new Error("jqxScheduler: Invalid property name - " + obj + ".");
                            }
                        }
                    }
                }
            }
        }

        this._initfields(data);
        return this;
    }

    $.jqx.schedulerDataCollection = function (owner) {
        this.records = new Array();
        this.owner = owner;
        this.updating = false;
        this.beginUpdate = function () {
            this.updating = true;
        }

        this.resumeupdate = function () {
            this.updating = false;
        }

        this.clear = function () {
            this.records = new Array();
        }

        this.replace = function (index, object) {
            this.records[index] = object;
        }

        this.isempty = function (index) {
            if (this.records[index] == undefined) {
                return true;
            }

            return false;
        }

        this.initialize = function (size) {
            if (size < 1) size = 1;
            this.records[size - 1] = -1;
        }

        this.length = function () {
            return this.records.length;
        }

        this.indexOf = function (object) {
            return this.records.indexOf(object);
        }

        this.add = function (object) {
            if (object == null)
                return false;

            this.records[this.records.length] = object;
            return true;
        }

        this.insertAt = function (index, object) {
            if (index == null || index == undefined)
                return false;

            if (object == null)
                return false;

            if (index >= 0) {
                if (index < this.records.length) {
                    this.records.splice(index, 0, object);
                    return true;
                }
                else return this.add(object);
            }

            return false;
        }

        this.remove = function (object) {
            if (object == null || object == undefined)
                return false;

            var index = this.records.indexOf(object);
            if (index != -1) {
                this.records.splice(index, 1);
                return true;
            }

            return false;
        }

        this.removeAt = function (index) {
            if (index == null || index == undefined)
                return false;

            if (index < 0)
                return false;

            if (index < this.records.length) {
                var object = this.records[index];
                this.records.splice(index, 1);
                return true;
            }

            return false;
        }

        return this;
    }

    $.jqx.scheduler.dataView = function (id) {
        this.that = this;
        this.scheduler = null;
        this.records = [];
        this.rows = [];
        this.columns = [];
        this.filters = new Array();
        this.pagesize = 0;
        this.pagenum = 0;
        this.source = null;

        this.databind = function (source, objectuniqueId) {
            var that = this;
            if ($.isArray(source)) {
                that.update(source);
                return;
            }
            var isdataadapter = source._source ? true : false;
            var dataadapter = null;
            this._sortData = null;
            this._sortHierarchyData = null;
            if (isdataadapter) {
                dataadapter = source;
                source = source._source;
            }
            else {
                dataadapter = new $.jqx.dataAdapter(source,
                {
                    autoBind: false
                });
            }

            var initadapter = function (that) {
                dataadapter.recordids = [];
                dataadapter.records = new Array();
                dataadapter.cachedrecords = new Array();
                dataadapter.originaldata = new Array();
                dataadapter._options.totalrecords = that.totalrecords;
                dataadapter._options.originaldata = that.originaldata;
                dataadapter._options.recordids = that.recordids;
                dataadapter._options.cachedrecords = new Array();
                dataadapter._options.pagenum = that.pagenum;
                dataadapter._options.pageable = that.pageable;
                if (source.type != undefined) {
                    dataadapter._options.type = source.type;
                }
                if (source.formatdata != undefined) {
                    dataadapter._options.formatData = source.formatdata;
                }
                if (source.contenttype != undefined) {
                    dataadapter._options.contentType = source.contenttype;
                }
                if (source.async != undefined) {
                    dataadapter._options.async = source.async;
                }
                if (source.updaterow != undefined) {
                    dataadapter._options.updaterow = source.updaterow;
                }
                if (source.addrow != undefined) {
                    dataadapter._options.addrow = source.addrow;
                }
                if (source.deleterow != undefined) {
                    dataadapter._options.deleterow = source.deleterow;
                }

                if (that.pagesize == 0) that.pagesize = 10;
                dataadapter._options.pagesize = that.pagesize;
            }

            var updatefromadapter = function (that) {
                that.originaldata = dataadapter.originaldata;
                that.records = dataadapter.records;
                that.hierarchy = dataadapter.hierarchy;
                if (!that.scheduler.serverProcessing) {
                    that._sortData = null;
                    that._sortfield = null;
                    that._filteredData = null;
                    that._sortHierarchyData = null;
                }

                if (!that.hierarchy) {
                    that.hierarchy = new Array();
                    dataadapter.hierarchy = new Array();
                }

                if (dataadapter._source.totalrecords) {
                    that.totalrecords = dataadapter._source.totalrecords;
                }
                else if (dataadapter._source.totalRecords) {
                    that.totalrecords = dataadapter._source.totalRecords;
                }
                else {
                    if (that.hierarchy.length !== 0) {
                        that.totalrecords = that.hierarchy.length;
                    }
                    else {
                        that.totalrecords = that.records.length;
                    }
                }

                that.cachedrecords = dataadapter.cachedrecords;
            }

            initadapter(this);

            this.source = source;
            if (objectuniqueId !== undefined) {
                uniqueId = objectuniqueId;
            }

            var that = this;
            switch (source.datatype) {
                case "local":
                case "array":
                default:
                    if (source.localdata == null) {
                        source.localdata = [];
                    }

                    if (source.localdata != null) {
                        dataadapter.unbindBindingUpdate(id + that.scheduler.element.id);
                        if ((!that.scheduler.autoBind && that.scheduler.isInitialized) || that.scheduler.autoBind) {
                            dataadapter.dataBind();
                        }

                        var updateFunc = function () {
                            updatefromadapter(that);
                            that.update(dataadapter.records);
                        }

                        updateFunc();
                        dataadapter.bindBindingUpdate(id + that.scheduler.element.id, updateFunc);
                    }
                    break;
                case "ics":
                case "json":
                case "jsonp":
                case "xml":
                case "xhtml":
                case "script":
                case "text":
                case "csv":
                case "tab":
                    {
                        if (source.localdata != null) {
                            dataadapter.unbindBindingUpdate(id + that.scheduler.element.id);
                            if ((!that.scheduler.autoBind && that.scheduler.isInitialized) || that.scheduler.autoBind) {
                                dataadapter.dataBind();
                            }

                            var updateFunc = function (changeType) {
                                updatefromadapter(that);
                                that.update(dataadapter.records);
                            }

                            updateFunc();
                            dataadapter.bindBindingUpdate(id + that.scheduler.element.id, updateFunc);
                            return;
                        }

                        var filterdata = {};
                        var filterslength = 0;
                        var postdata = {};
                        var tmpdata = dataadapter._options.data;
                        if (dataadapter._options.data) {
                            $.extend(dataadapter._options.data, postdata);
                        }
                        else {
                            if (source.data) {
                                $.extend(postdata, source.data);
                            }
                            dataadapter._options.data = postdata;
                        }

                        var updateFunc = function () {
                            var ie = $.jqx.browser.msie && $.jqx.browser.version < 9;
                            var doUpdate = function () {
                                updatefromadapter(that);
                                that.update(dataadapter.records);
                            }
                            if (ie) {
                                try {
                                    doUpdate();
                                }
                                catch (error) {
                                }
                            }
                            else {
                                doUpdate();
                            }
                        }

                        dataadapter.unbindDownloadComplete(id + that.scheduler.element.id);
                        dataadapter.bindDownloadComplete(id + that.scheduler.element.id, updateFunc);
                        dataadapter._source.loaderror = function (xhr, status, error) {
                            updateFunc();
                        }

                        if ((!that.scheduler.autoBind && that.scheduler.isInitialized) || that.scheduler.autoBind) {
                            dataadapter.dataBind();
                        }
                        dataadapter._options.data = tmpdata;
                    }
            }
        }

        this.addFilter = function (field, filter) {
            this._sortData = null;
            this._sortHierarchyData = null;
            var filterindex = -1;
            for (var m = 0; m < this.filters.length; m++) {
                if (this.filters[m].datafield == field) {
                    filterindex = m;
                    break;
                }
            }

            if (filterindex == -1) {
                this.filters[this.filters.length] = { filter: filter, datafield: field };
            }
            else {
                this.filters[filterindex] = { filter: filter, datafield: field };
            }
        }

        this.removeFilter = function (field) {
            this._sortData = null;
            this._sortHierarchyData = null;
            for (var i = 0; i < this.filters.length; i++) {
                if (this.filters[i].datafield == field) {
                    this.filters.splice(i, 1);
                    break;
                }
            }
        }

        this._compare = function (value1, value2, type) {
            var value1 = value1;
            var value2 = value2;
            if (value1 === undefined) { value1 = null; }
            if (value2 === undefined) { value2 = null; }
            if (value1 === null && value2 === null) {
                return 0;
            }
            if (value1 === null && value2 !== null) {
                return 1;
            }
            if (value1 !== null && value2 === null) {
                return 1;
            }

            value1 = value1.toString();
            value2 = value2.toString();

            if ($.jqx.dataFormat) {
                if (type && type != "") {
                    switch (type) {
                        case "number":
                        case "int":
                        case "float":
                            if (value1 < value2) { return -1; }
                            if (value1 > value2) { return 1; }
                            return 0;
                        case "date":
                        case "time":
                            if (value1 < value2) { return -1; }
                            if (value1 > value2) { return 1; }
                            return 0;
                        case "string":
                        case "text":
                            value1 = String(value1).toLowerCase();
                            value2 = String(value2).toLowerCase();
                            break;
                    }
                }
                else {
                    if ($.jqx.dataFormat.isNumber(value1) && $.jqx.dataFormat.isNumber(value2)) {
                        if (value1 < value2) { return -1; }
                        if (value1 > value2) { return 1; }
                        return 0;
                    }
                    else if ($.jqx.dataFormat.isDate(value1) && $.jqx.dataFormat.isDate(value2)) {
                        if (value1 < value2) { return -1; }
                        if (value1 > value2) { return 1; }
                        return 0;
                    }
                    else if (!$.jqx.dataFormat.isNumber(value1) && !$.jqx.dataFormat.isNumber(value2)) {
                        value1 = String(value1).toLowerCase();
                        value2 = String(value2).toLowerCase();
                    }
                }
            }
            try {
                if (value1 < value2) { return -1; }
                if (value1 > value2) { return 1; }
            }
            catch (error) {
                var er = error;
            }

            return 0;
        };

        this._equals = function (value1, value2) {
            return (this._compare(value1, value2) === 0);
        }

        this.evaluate = function (rows) {
            if (this.scheduler.serverProcessing) {

                return rows;
            }
            var records = new Array();
            if (this.filters.length) {
                var uniqueRecords = new Array();
                var getRecords = function (records, filtered) {
                    for (var i = 0; i < records.length; i++) {
                        var record = records[i];
                        record._visible = true;

                        // The filter is applied to parents first and to children only if parent fulfils the condition.
                        var filterresult = undefined;
                        for (var j = 0; j < this.filters.length; j++) {
                            var filter = this.filters[j].filter;
                            var value = record[this.filters[j].datafield];
                            var result = filter.evaluate(value);

                            if (filterresult == undefined) {
                                filterresult = result;
                            }
                            else {
                                if (filter.operator == 'or') {
                                    filterresult = filterresult || result;
                                }
                                else {
                                    filterresult = filterresult && result;
                                }
                            }
                        }
                        record._visible = false;
                        if (filterresult || record.aggregate) {
                            record._visible = true;
                            filtered.push(record);
                            uniqueRecords[record.uid] = record;
                        }
                    }
                };
                if (!this._filteredData) {
                    if (this.source.hierarchy || (this.scheduler.source.hierarchy && this.scheduler.source.hierarchy.length > 0)) {
                        var flatList = new Array();
                        var getAsFlatList = function (parent, rows) {
                            for (var i = 0; i < rows.length; i++) {
                                var row = rows[i];
                                flatList.push(row);
                                if (row.records && row.records.length > 0) {
                                    getAsFlatList(row, row.records);
                                }
                            }
                        }
                        getAsFlatList(null, rows);
                        getRecords.call(this, flatList, records);
                        for (var i = 0; i < records.length; i++) {
                            var record = records[i];

                            while (record.parent) {
                                var parent = record.parent;
                                if (!uniqueRecords[parent.uid]) {
                                    parent._visible = true;
                                    uniqueRecords[parent.uid] = parent;
                                }
                                record = parent;
                            }
                        }

                        records = rows;
                    }
                    else {
                        getRecords.call(this, rows, records);
                    }
                    this._filteredData = records;
                    this.rows = records;
                }
                else {
                    this.rows = this._filteredData;
                }
            }
            else {
                this.rows = rows;
            }

            return this.rows;
        }

        this.getid = function (id, record, index) {
            if ($(id, record).length > 0) {
                return $(id, record).text();
            }
            if (this.rows && id != "" && id != undefined && this.rows.length > 0) {
                var lastID = this.rows[this.rows.length - 1][id];
                if (lastID == null) lastID = null;
                for (var i = 1; i <= 100; i++) {
                    var hasID = this.scheduler.appointmentsByKey[i + lastID];
                    if (!hasID) {
                        if (this.scheduler && this.scheduler.treeGrid && this.scheduler.treescheduler.virtualModeCreateRecords) {
                            var hasID = this.scheduler.appointmentsByKey["jqx" + lastID + i];
                            if (hasID)
                                continue;

                            return "jqx" + lastID + i;
                        }
                        return lastID + i;
                    }
                }
            }

            if (id != undefined) {
                if (id.toString().length > 0) {
                    var result = $(record).attr(id);
                    if (result != null && result.toString().length > 0) {
                        if (this.scheduler && this.scheduler.treeGrid && this.scheduler.treescheduler.virtualModeCreateRecords) {
                            return "jqx" + result;
                        }
                        return result;
                    }
                }
            }

            if (this.rows && this.rows.length > 0) {
                var hasID = this.scheduler.appointmentsByKey[index];
                if (hasID) {
                    var lastID = this.rows[this.rows.length - 1][id];
                    if (lastID == null) lastID = "";
                    for (var i = 1; i <= 1000; i++) {
                        var hasID = this.scheduler.appointmentsByKey[i + lastID];
                        if (!hasID) {
                            if (this.scheduler && this.scheduler.treeGrid && this.scheduler.treescheduler.virtualModeCreateRecords) {
                                var hasID = this.scheduler.appointmentsByKey["jqx" + lastID + i];
                                if (hasID)
                                    continue;

                                return "jqx" + lastID + i;
                            }
                            return lastID + i;
                        }
                    }
                }
            }
            if (this.scheduler && this.scheduler.treeGrid && this.scheduler.treescheduler.virtualModeCreateRecords) {
                var hasID = this.scheduler.appointmentsByKey["jqx" + index];
                if (!hasID) {
                    return "jqx" + index;
                }
                else {
                    for (var i = index + 1; i <= 100; i++) {
                        var hasID = this.scheduler.appointmentsByKey["jqx" + i];
                        if (!hasID) {
                            var hasID = this.scheduler.appointmentsByKey["jqx" + i];
                            if (hasID)
                                continue;

                            return "jqx" + i;
                        }
                    }
                }
            }

            return index;
        }

        this.generatekey = function () {
            var S4 = function () {
                return (((1 + Math.random()) * 0x10) | 0);
            };
            return ("" + S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4());
        }

        return this;
    }

})(jqxBaseFramework);
