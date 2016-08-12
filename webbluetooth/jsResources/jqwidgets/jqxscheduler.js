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

    $.jqx.jqxWidget('jqxScheduler', '', {});

    $.extend($.jqx._jqxScheduler.prototype, {
        defineInstance: function () {
            var settings = {
                // sets the alternating row style.
                altRows: false,
                // automatically displays the load element.
                autoShowLoadElement: true,
                // sets the columns height.
                columnsHeight: 30,
                // sets the columns.
                columns: [],
                // sets the column groups.
                columnGroups: null,
                // sets the grid data view.
                dataview: null,
                // enables or disables the scheduler.
                disabled: false,
                // enables the hover effect.
                enableHover: true,
                appointmentOpacity: 0.8,
                // header z index.
                headerZIndex: 359,
                // sets the height.
                height: 600,
                // sets the row details indent column widget.
                timeRulerWidth: 60,
                // this message is displayed when the user tries to call a method before the binding complete.
                loadingErrorMessage: "The data is still loading and you cannot set a property or call a method. You can do that once the data binding is completed. jqxScheduler raises the 'bindingComplete' event when the binding is completed.",
                // sets the localization object.
                localization: null,
                // callback function called when the widget is ready for usage.
                ready: null,
                // callback function called for rendering the tool bar.
                renderToolBar: null,
                renderAppointment: null,
                // callback function called after the rendering.
                rendered: null,
                // callback function called before the rendering.
                rendering: null,
                // enables right-to-left.
                rtl: false,
                showToolbar: true,
                // shows the status bar.
                showLegend: false,
                legendPosition: "bottom",
                // sets the status bar's height.
                legendHeight: 34,
                rowsHeight: 27,
                touchRowsHeight: 36,
                appointmentsMinHeight: 18,
                touchAppointmentsMinHeight: 27,
                appointmentsRenderMode: "default",
                // enables the server processing.
                serverProcessing: false,
                // sets the selection mode.
                selectionMode: "multiplerows",
                // sets the scrollbar's size
                scrollBarSize: $.jqx.utilities.scrollBarSize,
                touchScrollBarSize: $.jqx.utilities.touchScrollBarSize,
                // shows or hides the grid's columns header.
                showHeader: true,
                maxHeight: 999999,
                maxWidth: 999999,
                autoBind: true,
                showAllDayRow: true,
                changedAppointments: new Array(),
                renderMode: "simple",
                views: new Array(),
                view: 0, // day, week, month
                min: new $.jqx.date(0),
                max: new $.jqx.date(9999, 12, 31),
                date: new $.jqx.date('todayDate'),
                colors: [
                    '#307DD7', '#AA4643', '#89A54E', '#71588F', '#4198AF',
                    '#7FD13B', '#EA157A', '#FEB80A', '#00ADDC', '#738AC8',
                    '#E8601A', '#FF9639', '#F5BD6A', '#599994', '#115D6E',
                    '#D02841', '#FF7C41', '#FFC051', '#5B5F4D', '#364651',
                    '#25A0DA', '#309B46', '#8EBC00', '#FF7515', '#FFAE00',
                    '#0A3A4A', '#196674', '#33A6B2', '#9AC836', '#D0E64B',
                    '#CC6B32', '#FFAB48', '#FFE7AD', '#A7C9AE', '#888A63',
                    '#3F3943', '#01A2A6', '#29D9C2', '#BDF271', '#FFFFA6',
                    '#1B2B32', '#37646F', '#A3ABAF', '#E1E7E8', '#B22E2F',
                    '#5A4B53', '#9C3C58', '#DE2B5B', '#D86A41', '#D2A825',
                    '#993144', '#FFA257', '#CCA56A', '#ADA072', '#949681',
                    '#105B63', '#EEEAC5', '#FFD34E', '#DB9E36', '#BD4932',
                    '#BBEBBC', '#F0EE94', '#F5C465', '#FA7642', '#FF1E54',
                    '#60573E', '#F2EEAC', '#BFA575', '#A63841', '#BFB8A3',
                    '#444546', '#FFBB6E', '#F28D00', '#D94F00', '#7F203B',
                    '#583C39', '#674E49', '#948658', '#F0E99A', '#564E49',
                    '#142D58', '#447F6E', '#E1B65B', '#C8782A', '#9E3E17',
                    '#4D2B1F', '#635D61', '#7992A2', '#97BFD5', '#BFDCF5',
                    '#844341', '#D5CC92', '#BBA146', '#897B26', '#55591C',
                    '#56626B', '#6C9380', '#C0CA55', '#F07C6C', '#AD5472',
                    '#96003A', '#FF7347', '#FFBC7B', '#FF4154', '#642223',
                    '#5D7359', '#E0D697', '#D6AA5C', '#8C5430', '#661C0E',
                    '#16193B', '#35478C', '#4E7AC7', '#7FB2F0', '#ADD5F7',
                    '#7B1A25', '#BF5322', '#9DA860', '#CEA457', '#B67818',
                    '#0081DA', '#3AAFFF', '#99C900', '#FFEB3D', '#309B46',
                    '#0069A5', '#0098EE', '#7BD2F6', '#FFB800', '#FF6800',
                    '#FF6800', '#A0A700', '#FF8D00', '#678900', '#0069A5'
                ],
                colorSchemes: [
                    { name: 'scheme01', colors: ['#307DD7', '#AA4643', '#89A54E', '#71588F', '#4198AF'] },
                    { name: 'scheme02', colors: ['#7FD13B', '#EA157A', '#FEB80A', '#00ADDC', '#738AC8'] },
                    { name: 'scheme03', colors: ['#E8601A', '#FF9639', '#F5BD6A', '#599994', '#115D6E'] },
                    { name: 'scheme04', colors: ['#D02841', '#FF7C41', '#FFC051', '#5B5F4D', '#364651'] },
                    { name: 'scheme05', colors: ['#25A0DA', '#309B46', '#8EBC00', '#FF7515', '#FFAE00'] },
                    { name: 'scheme06', colors: ['#0A3A4A', '#196674', '#33A6B2', '#9AC836', '#D0E64B'] },
                    { name: 'scheme07', colors: ['#CC6B32', '#FFAB48', '#FFE7AD', '#A7C9AE', '#888A63'] },
                    { name: 'scheme08', colors: ['#3F3943', '#01A2A6', '#29D9C2', '#BDF271', '#FFFFA6'] },
                    { name: 'scheme09', colors: ['#1B2B32', '#37646F', '#A3ABAF', '#E1E7E8', '#B22E2F'] },
                    { name: 'scheme10', colors: ['#5A4B53', '#9C3C58', '#DE2B5B', '#D86A41', '#D2A825'] },
                    { name: 'scheme11', colors: ['#993144', '#FFA257', '#CCA56A', '#ADA072', '#949681'] },
                    { name: 'scheme12', colors: ['#105B63', '#EEEAC5', '#FFD34E', '#DB9E36', '#BD4932'] },
                    { name: 'scheme13', colors: ['#BBEBBC', '#F0EE94', '#F5C465', '#FA7642', '#FF1E54'] },
                    { name: 'scheme14', colors: ['#60573E', '#F2EEAC', '#BFA575', '#A63841', '#BFB8A3'] },
                    { name: 'scheme15', colors: ['#444546', '#FFBB6E', '#F28D00', '#D94F00', '#7F203B'] },
                    { name: 'scheme16', colors: ['#583C39', '#674E49', '#948658', '#F0E99A', '#564E49'] },
                    { name: 'scheme17', colors: ['#142D58', '#447F6E', '#E1B65B', '#C8782A', '#9E3E17'] },
                    { name: 'scheme18', colors: ['#4D2B1F', '#635D61', '#7992A2', '#97BFD5', '#BFDCF5'] },
                    { name: 'scheme19', colors: ['#844341', '#D5CC92', '#BBA146', '#897B26', '#55591C'] },
                    { name: 'scheme20', colors: ['#56626B', '#6C9380', '#C0CA55', '#F07C6C', '#AD5472'] },
                    { name: 'scheme21', colors: ['#96003A', '#FF7347', '#FFBC7B', '#FF4154', '#642223'] },
                    { name: 'scheme22', colors: ['#5D7359', '#E0D697', '#D6AA5C', '#8C5430', '#661C0E'] },
                    { name: 'scheme23', colors: ['#16193B', '#35478C', '#4E7AC7', '#7FB2F0', '#ADD5F7'] },
                    { name: 'scheme24', colors: ['#7B1A25', '#BF5322', '#9DA860', '#CEA457', '#B67818'] },
                    { name: 'scheme25', colors: ['#0081DA', '#3AAFFF', '#99C900', '#FFEB3D', '#309B46'] },
                    { name: 'scheme26', colors: ['#0069A5', '#0098EE', '#7BD2F6', '#FFB800', '#FF6800'] },
                    { name: 'scheme27', colors: ['#FF6800', '#A0A700', '#FF8D00', '#678900', '#0069A5'] }
                ],
                resources: null,
                contextMenu: true,
                contextMenuOpen: null,
                contextMenuClose: null,
                contextMenuItemClick: null,
                contextMenuCreate: null,
                timeZone: null,
                statuses:
                {
                    free: "white",
                    tentative: "tentative",
                    busy: "transparent",
                    outOfOffice: "#800080"
                },
                appointmentDataFields:
                {
                    from: "from",
                    to: "to",
                    id: "id",
                    calendarId: "calendarId",
                    description: "description",
                    location: "location",
                    subject: "subject",
                    background: "background",
                    color: "color",
                    borderColor: "borderColor",
                    style: "style",
                    recurrencePattern: "recurrencePattern",
                    recurrenceException: "recurrenceException",
                    draggable: "draggable",
                    resizable: "resizable",
                    resourceId: "resourceId",
                    status: "status",
                    tooltip: "tooltip",
                    hidden: "hidden",
                    allDay: "allDay",
                    timeZone: "timeZone",
                    ownerId: "ownerId"
                },
                appointmentTooltips: true,
                tableColumns: 1,
                tableRows: 1,
                // Possible values: shortest, firstTwoLetters, firstLetter, abbr, full
                dayNameFormat: 'full',
                touchDayNameFormat: "abbr",
                toolBarRangeFormat: "dd MMMM yyyy",
                toolBarRangeFormatAbbr: "dd MM yyyy",
                columnRenderer: null,
                exportSettings: {
                    serverURL: null,
                    characterSet: null,
                    fileName: "jqxScheduler",
                    dateTimeFormatString: "S",
                    resourcesInMultipleICSFiles: false
                },
                // sets the datatable's source.
                source:
                {
                    beforeprocessing: null,
                    beforesend: null,
                    loaderror: null,
                    localdata: null,
                    data: null,
                    datatype: 'array',
                    // {name: name, map: map}
                    datafields: [],
                    url: "",
                    root: '',
                    record: '',
                    id: '',
                    totalrecords: 0,
                    recordstartindex: 0,
                    recordendindex: 0,
                    loadallrecords: true,
                    sortcolumn: null,
                    sortdirection: null,
                    sort: null,
                    filter: null,
                    sortcomparer: null
                },
                editDialogDateTimeFormatString: "dd/MM/yyyy hh:mm tt",
                editDialogDateFormatString: "dd/MM/yyyy",
                editDialogOpen: null,
                editDialogCreate: null,
                editDialogKeyDown: null,
                editDialogClose: null,
                editDialog: true,
                // toolbar height.
                toolbarHeight: 54,
                // table z index.
                tableZIndex: 369,
                // private members
                _updating: false,
                touchMode: 'auto',
                // sets the width.
                width: 800,
                that: this,
                beginDrag: null,
                endDrag: null,
                dragging: null,
                timeZones:
                [
                { id: 'Dateline Standard Time', offset: -720, offsetHours: -12, displayName: '(UTC-12:00) International Date Line West', supportsDaylightSavingTime: false },
                { id: 'UTC-11', offset: -660, offsetHours: -11, displayName: '(UTC-11:00) Coordinated Universal Time-11', supportsDaylightSavingTime: false },
                { id: 'Hawaiteratoran Standard Time', offset: -600, offsetHours: -10, displayName: '(UTC-10:00) Hawaiterator', supportsDaylightSavingTime: false },
                { id: 'Alaskan Standard Time', offset: -540, offsetHours: -9, displayName: '(UTC-09:00) Alaska', supportsDaylightSavingTime: true },
                { id: 'Pacific Standard Time (Mexico)', offset: -480, offsetHours: -8, displayName: '(UTC-08:00) Baja California', supportsDaylightSavingTime: true },
                { id: 'Pacific Standard Time', offset: -480, offsetHours: -8, displayName: '(UTC-08:00) Pacific Time (US & Canada)', supportsDaylightSavingTime: true },
                { id: 'US Mountain Standard Time', offset: -420, offsetHours: -7, displayName: '(UTC-07:00) Arizona', supportsDaylightSavingTime: false },
                { id: 'Mountain Standard Time (Mexico)', offset: -420, offsetHours: -7, displayName: '(UTC-07:00) Chihuahua, La Paz, Mazatlan', supportsDaylightSavingTime: true },
                { id: 'Mountain Standard Time', offset: -420, offsetHours: -7, displayName: '(UTC-07:00) Mountain Time (US & Canada)', supportsDaylightSavingTime: true },
                { id: 'Central Standard Time', offset: -360, offsetHours: -6, displayName: '(UTC-06:00) Central Time (US & Canada)', supportsDaylightSavingTime: true },
                { id: 'Central America Standard Time', offset: -360, offsetHours: -6, displayName: '(UTC-06:00) Central America', supportsDaylightSavingTime: false },
                { id: 'Canada Central Standard Time', offset: -360, offsetHours: -6, displayName: '(UTC-06:00) Saskatchewan', supportsDaylightSavingTime: false },
                { id: 'Central Standard Time (Mexico)', offset: -360, offsetHours: -6, displayName: '(UTC-06:00) Guadalajara, Mexico City, Monterrey', supportsDaylightSavingTime: true },
                { id: 'SA Pacific Standard Time', offset: -300, offsetHours: -5, displayName: '(UTC-05:00) Bogota, Lima, Quito, Rio Branco', supportsDaylightSavingTime: false },
                { id: 'Eastern Standard Time', offset: -300, offsetHours: -5, displayName: '(UTC-05:00) Eastern Time (US & Canada)', supportsDaylightSavingTime: true },
                { id: 'US Eastern Standard Time', offset: -300, offsetHours: -5, displayName: '(UTC-05:00) Indiana (East)', supportsDaylightSavingTime: true },
                { id: 'Venezuela Standard Time', offset: -270, offsetHours: -4.5, displayName: '(UTC-04:30) Caracas', supportsDaylightSavingTime: false },
                { id: 'Atlantic Standard Time', offset: -240, offsetHours: -4, displayName: '(UTC-04:00) Atlantic Time (Canada)', supportsDaylightSavingTime: true },
                { id: 'Paraguay Standard Time', offset: -240, offsetHours: -4, displayName: '(UTC-04:00) Asuncion', supportsDaylightSavingTime: true },
                { id: 'Central Brazilian Standard Time', offset: -240, offsetHours: -4, displayName: '(UTC-04:00) Cuiaba', supportsDaylightSavingTime: true },
                { id: 'Pacific SA Standard Time', offset: -240, offsetHours: -4, displayName: '(UTC-04:00) Santiago', supportsDaylightSavingTime: true },
                { id: 'SA Western Standard Time', offset: -240, offsetHours: -4, displayName: '(UTC-04:00) Georgetown, La Paz, Manaus', supportsDaylightSavingTime: false },
                { id: 'Newfoundland Standard Time', offset: -210, offsetHours: -3.5, displayName: '(UTC-03:30) Newfoundland', supportsDaylightSavingTime: true },
                { id: 'SA Eastern Standard Time', offset: -180, offsetHours: -3, displayName: '(UTC-03:00) Cayenne, Fortaleza', supportsDaylightSavingTime: false },
                { id: 'Argentina Standard Time', offset: -180, offsetHours: -3, displayName: '(UTC-03:00) Buenos Aires', supportsDaylightSavingTime: true },
                { id: 'E. South America Standard Time', offset: -180, offsetHours: -3, displayName: '(UTC-03:00) Brasilia', supportsDaylightSavingTime: true },
                { id: 'Bahia Standard Time', offset: -180, offsetHours: -3, displayName: '(UTC-03:00) Salvador', supportsDaylightSavingTime: true },
                { id: 'Montevideo Standard Time', offset: -180, offsetHours: -3, displayName: '(UTC-03:00) Montevideo', supportsDaylightSavingTime: true },
                { id: 'Greenland Standard Time', offset: -180, offsetHours: -3, displayName: '(UTC-03:00) Greenland', supportsDaylightSavingTime: true },
                { id: 'UTC-02', offset: -120, offsetHours: -2, displayName: '(UTC-02:00) Coordinated Universal Time-02', supportsDaylightSavingTime: false },
                { id: 'Mid-Atlantic Standard Time', offset: -120, offsetHours: -2, displayName: '(UTC-02:00) Mid-Atlantic - Old', supportsDaylightSavingTime: true },
                { id: 'Azores Standard Time', offset: -60, offsetHours: -1, displayName: '(UTC-01:00) Azores', supportsDaylightSavingTime: true },
                { id: 'Cape Verde Standard Time', offset: -60, offsetHours: -1, displayName: '(UTC-01:00) Cape Verde Is.', supportsDaylightSavingTime: false },
                { id: 'Morocco Standard Time', offset: 0, offsetHours: 0, displayName: '(UTC) Casablanca', supportsDaylightSavingTime: true },
                { id: 'UTC', offset: 0, offsetHours: 0, displayName: '(UTC) Coordinated Universal Time', supportsDaylightSavingTime: false },
                { id: 'GMT Standard Time', offset: 0, offsetHours: 0, displayName: '(UTC) Dublin, Edinburgh, Lisbon, London', supportsDaylightSavingTime: true },
                { id: 'Greenwich Standard Time', offset: 0, offsetHours: 0, displayName: '(UTC) Monrovia, Reykjavik', supportsDaylightSavingTime: false },
                { id: 'Central European Standard Time', offset: 60, offsetHours: 1, displayName: '(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb', supportsDaylightSavingTime: true },
                { id: 'Namibia Standard Time', offset: 60, offsetHours: 1, displayName: '(UTC+01:00) Windhoek', supportsDaylightSavingTime: true },
                { id: 'W. Central Africa Standard Time', offset: 60, offsetHours: 1, displayName: '(UTC+01:00) West Central Africa', supportsDaylightSavingTime: false },
                { id: 'W. Europe Standard Time', offset: 60, offsetHours: 1, displayName: '(UTC+01:00) Amsterdam, Berlin, Rome', supportsDaylightSavingTime: true },
                { id: 'Central Europe Standard Time', offset: 60, offsetHours: 1, displayName: '(UTC+01:00) Belgrade, Budapest, Prague', supportsDaylightSavingTime: true },
                { id: 'Romance Standard Time', offset: 60, offsetHours: 1, displayName: '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris', supportsDaylightSavingTime: true },
                { id: 'FLE Standard Time', offset: 120, offsetHours: 2, displayName: '(UTC+02:00) Helsinki, Kyiv, Riga, Sofia', supportsDaylightSavingTime: true },
                { id: 'South Africa Standard Time', offset: 120, offsetHours: 2, displayName: '(UTC+02:00) Harare, Pretoria', supportsDaylightSavingTime: false },
                { id: 'Turkey Standard Time', offset: 120, offsetHours: 2, displayName: '(UTC+02:00) Istanbul', supportsDaylightSavingTime: true },
                { id: 'GTB Standard Time', offset: 120, offsetHours: 2, displayName: '(UTC+02:00) Athens, Bucharest', supportsDaylightSavingTime: true },
                { id: 'Libya Standard Time', offset: 120, offsetHours: 2, displayName: '(UTC+02:00) Tripoli', supportsDaylightSavingTime: true },
                { id: 'E. Europe Standard Time', offset: 120, offsetHours: 2, displayName: '(UTC+02:00) E. Europe', supportsDaylightSavingTime: true },
                { id: 'Jordan Standard Time', offset: 120, offsetHours: 2, displayName: '(UTC+02:00) Amman', supportsDaylightSavingTime: true },
                { id: 'Middle East Standard Time', offset: 120, offsetHours: 2, displayName: '(UTC+02:00) Beirut', supportsDaylightSavingTime: true },
                { id: 'Egypt Standard Time', offset: 120, offsetHours: 2, displayName: '(UTC+02:00) Cairo', supportsDaylightSavingTime: true },
                { id: 'Syria Standard Time', offset: 120, offsetHours: 2, displayName: '(UTC+02:00) Damascus', supportsDaylightSavingTime: true },
                { id: 'Israel Standard Time', offset: 120, offsetHours: 2, displayName: '(UTC+02:00) Jerusalem', supportsDaylightSavingTime: true },
                { id: 'Arab Standard Time', offset: 180, offsetHours: 3, displayName: '(UTC+03:00) Kuwait, Riyadh', supportsDaylightSavingTime: false },
                { id: 'E. Africa Standard Time', offset: 180, offsetHours: 3, displayName: '(UTC+03:00) Nairobi', supportsDaylightSavingTime: false },
                { id: 'Arabic Standard Time', offset: 180, offsetHours: 3, displayName: '(UTC+03:00) Baghdad', supportsDaylightSavingTime: true },
                { id: 'Kaliningrad Standard Time', offset: 180, offsetHours: 3, displayName: '(UTC+03:00) Kaliningrad, Minsk', supportsDaylightSavingTime: true },
                { id: 'Iran Standard Time', offset: 210, offsetHours: 3.5, displayName: '(UTC+03:30) Tehran', supportsDaylightSavingTime: true },
                { id: 'Mauritius Standard Time', offset: 240, offsetHours: 4, displayName: '(UTC+04:00) Port Louis', supportsDaylightSavingTime: true },
                { id: 'Georgian Standard Time', offset: 240, offsetHours: 4, displayName: '(UTC+04:00) Tbilisi', supportsDaylightSavingTime: false },
                { id: 'Caucasus Standard Time', offset: 240, offsetHours: 4, displayName: '(UTC+04:00) Yerevan', supportsDaylightSavingTime: true },
                { id: 'Arabian Standard Time', offset: 240, offsetHours: 4, displayName: '(UTC+04:00) Abu Dhabi, Muscat', supportsDaylightSavingTime: false },
                { id: 'Azerbaijan Standard Time', offset: 240, offsetHours: 4, displayName: '(UTC+04:00) Baku', supportsDaylightSavingTime: true },
                { id: 'Russian Standard Time', offset: 240, offsetHours: 4, displayName: '(UTC+04:00) Moscow, St. Petersburg, Volgograd', supportsDaylightSavingTime: true },
                { id: 'Afghanistan Standard Time', offset: 270, offsetHours: 4.5, displayName: '(UTC+04:30) Kabul', supportsDaylightSavingTime: false },
                { id: 'Pakistan Standard Time', offset: 300, offsetHours: 5, displayName: '(UTC+05:00) Islamabad, Karachi', supportsDaylightSavingTime: true },
                { id: 'West Asia Standard Time', offset: 300, offsetHours: 5, displayName: '(UTC+05:00) Ashgabat, Tashkent', supportsDaylightSavingTime: false },
                { id: 'India Standard Time', offset: 330, offsetHours: 5.5, displayName: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi', supportsDaylightSavingTime: false },
                { id: 'Sri Lanka Standard Time', offset: 330, offsetHours: 5.5, displayName: '(UTC+05:30) Sri Jayawardenepura', supportsDaylightSavingTime: false },
                { id: 'Nepal Standard Time', offset: 345, offsetHours: 5.75, displayName: '(UTC+05:45) Kathmandu', supportsDaylightSavingTime: false },
                { id: 'Central Asia Standard Time', offset: 360, offsetHours: 6, displayName: '(UTC+06:00) Astana', supportsDaylightSavingTime: false },
                { id: 'Bangladesh Standard Time', offset: 360, offsetHours: 6, displayName: '(UTC+06:00) Dhaka', supportsDaylightSavingTime: true },
                { id: 'Ekaterinburg Standard Time', offset: 360, offsetHours: 6, displayName: '(UTC+06:00) Ekaterinburg', supportsDaylightSavingTime: true },
                { id: 'Myanmar Standard Time', offset: 390, offsetHours: 6.5, displayName: '(UTC+06:30) Yangon (Rangoon)', supportsDaylightSavingTime: false },
                { id: 'SE Asia Standard Time', offset: 420, offsetHours: 7, displayName: '(UTC+07:00) Bangkok, Hanoi, Jakarta', supportsDaylightSavingTime: false },
                { id: 'N. Central Asia Standard Time', offset: 420, offsetHours: 7, displayName: '(UTC+07:00) Novosibirsk', supportsDaylightSavingTime: true },
                { id: 'Ulaanbaatar Standard Time', offset: 480, offsetHours: 8, displayName: '(UTC+08:00) Ulaanbaatar', supportsDaylightSavingTime: false },
                { id: 'China Standard Time', offset: 480, offsetHours: 8, displayName: '(UTC+08:00) Beijing, Chongqing, Hong Kong', supportsDaylightSavingTime: false },
                { id: 'Singapore Standard Time', offset: 480, offsetHours: 8, displayName: '(UTC+08:00) Kuala Lumpur, Singapore', supportsDaylightSavingTime: false },
                { id: 'North Asia Standard Time', offset: 480, offsetHours: 8, displayName: '(UTC+08:00) Krasnoyarsk', supportsDaylightSavingTime: true },
                { id: 'Taipei Standard Time', offset: 480, offsetHours: 8, displayName: '(UTC+08:00) Taipei', supportsDaylightSavingTime: false },
                { id: 'W. Australia Standard Time', offset: 480, offsetHours: 8, displayName: '(UTC+08:00) Perth', supportsDaylightSavingTime: true },
                { id: 'Korea Standard Time', offset: 540, offsetHours: 9, displayName: '(UTC+09:00) Seoul', supportsDaylightSavingTime: false },
                { id: 'North Asia East Standard Time', offset: 540, offsetHours: 9, displayName: '(UTC+09:00) Irkutsk', supportsDaylightSavingTime: true },
                { id: 'Tokyo Standard Time', offset: 540, offsetHours: 9, displayName: '(UTC+09:00) Osaka, Sapporo, Tokyo', supportsDaylightSavingTime: false },
                { id: 'AUS Central Standard Time', offset: 570, offsetHours: 9.5, displayName: '(UTC+09:30) Darwin', supportsDaylightSavingTime: false },
                { id: 'Cen. Australia Standard Time', offset: 570, offsetHours: 9.5, displayName: '(UTC+09:30) Adelaide', supportsDaylightSavingTime: true },
                { id: 'West Pacific Standard Time', offset: 600, offsetHours: 10, displayName: '(UTC+10:00) Guam, Port Moresby', supportsDaylightSavingTime: false },
                { id: 'Tasmania Standard Time', offset: 600, offsetHours: 10, displayName: '(UTC+10:00) Hobart', supportsDaylightSavingTime: true },
                { id: 'E. Australia Standard Time', offset: 600, offsetHours: 10, displayName: '(UTC+10:00) Brisbane', supportsDaylightSavingTime: false },
                { id: 'AUS Eastern Standard Time', offset: 600, offsetHours: 10, displayName: '(UTC+10:00) Canberra, Melbourne, Sydney', supportsDaylightSavingTime: true },
                { id: 'Yakutsk Standard Time', offset: 600, offsetHours: 10, displayName: '(UTC+10:00) Yakutsk', supportsDaylightSavingTime: true },
                { id: 'Vladivostok Standard Time', offset: 660, offsetHours: 11, displayName: '(UTC+11:00) Vladivostok', supportsDaylightSavingTime: true },
                { id: 'Central Pacific Standard Time', offset: 660, offsetHours: 11, displayName: '(UTC+11:00) Solomon Is., New Caledonia', supportsDaylightSavingTime: false },
                { id: 'Magadan Standard Time', offset: 720, offsetHours: 12, displayName: '(UTC+12:00) Magadan', supportsDaylightSavingTime: true },
                { id: 'Kamchatka Standard Time', offset: 720, offsetHours: 12, displayName: '(UTC+12:00) Petropavlovsk-Kamchatsky - Old', supportsDaylightSavingTime: true },
                { id: 'Fiji Standard Time', offset: 720, offsetHours: 12, displayName: '(UTC+12:00) Fiji', supportsDaylightSavingTime: true },
                { id: 'New Zealand Standard Time', offset: 720, offsetHours: 12, displayName: '(UTC+12:00) Auckland, Wellington', supportsDaylightSavingTime: true },
                { id: 'UTC+12', offset: 720, offsetHours: 12, displayName: '(UTC+12:00) Coordinated Universal Time+12', supportsDaylightSavingTime: false },
                { id: 'Tonga Standard Time', offset: 780, offsetHours: 13, displayName: '(UTC+13:00) Nuku\'alofa', supportsDaylightSavingTime: false },
                { id: 'Samoa Standard Time', offset: 780, offsetHours: 13, displayName: '(UTC+13:00) Samoa', supportsDaylightSavingTime: true }
                ]
            };
            $.extend(true, this, settings);
            this.that = this;
            return settings;
        },

        createInstance: function (args) {
            var that = this;
            that._views = new Array();
            that._view = that.view;

            for (var i = 0; i < that.views.length; i++) {
                if ($.type(that.views[i]) === "string") {
                    that._views.push({ type: that.views[i] });
                }
                else {
                    that._views.push(that.views[i]);
                }
            }

            for (var i = 0; i < that._views.length; i++) {
                if (that._views[i].type == that.view) {
                    that._view = i;
                    break;
                }
            }

            if ($.jqx.utilities.scrollBarSize != 15) {
                that.scrollBarSize = $.jqx.utilities.scrollBarSize;
            }

            if (that.source && !that.source.dataBind) {
                that.source = new $.jqx.dataAdapter(that.source);
            }
            var datafields = that.source._source.datafields;
            if (datafields && datafields.length > 0) {
                that._camelCase = that.source._source.dataFields !== undefined;
                that.selectionMode = that.selectionMode.toLowerCase();
            }

            if (that.host.attr("tabindex") == null) {
                that.host.attr('tabindex', '0');
            }
            that.host.attr('role', 'grid');
            that.host.attr('align', 'left');
            that.host.addClass(that.toTP('jqx-grid'));
            that.host.addClass(that.toTP('jqx-scheduler'));
            that.host.addClass(that.toTP('jqx-reset'));
            that.host.addClass(that.toTP('jqx-rc-all'));
            that.host.addClass(that.toTP('jqx-widget'));
            that.host.addClass(that.toTP('jqx-widget-content jqx-disableselect'));
            // check for missing modules.
            if (that._testmodules()) {
                return;
            }

            that.overlay = $("<div style='z-index: 999; position:absolute;'></div>");

            that.overlay.hide();
            that.overlay.appendTo(that.host);

            that.render(true);
            $.jqx.utilities.resize(that.host, function () {
                var width = $(window).width();
                var height = $(window).height();
                that._hostWidth = null;
                that._hostHeight = null;

                var hostwidth = that.host.width();
                var hostheight = that.host.height();
                that._hostWidth = hostwidth;
                that._hostHeight = hostheight;

                if (that._lastHostWidth != hostwidth || that._lastHostHeight != hostheight) {
                    that._updatesize(that._lastHostWidth != hostwidth, that._lastHostHeight != hostheight);
                }
                          
                that._lastWidth = width;
                that._lastHeight = height;
                that._lastHostWidth = hostwidth;
                that._lastHostHeight = hostheight;
            });

            that.createEditRecurrenceDialog();
        },

        createEditRecurrenceDialog: function()
        {
            var that = this;
            that.editRecurrenceDialog = null;
            var editRecurrenceDialog = $("<div><div>" + that.schedulerLocalization.editRecurringAppointmentDialogTitleString + "</div><div><div>" + that.schedulerLocalization.editRecurringAppointmentDialogContentString + "</div><div style='position: absolute; white-space:nowrap; text-overflow: ellipsis; left:0px; width:100%; bottom: 0px;'><button title='" + that.schedulerLocalization.editRecurringAppointmentDialogOccurrenceString + "' id='editRecurringAppointmentOccurrence" + "." + that.element.id + "' style='white-space:nowrap; text-overflow: ellipsis; border-left-width: 0px;  border-bottom-width: 0px; border-radius:0px; width:50%;'>" + that.schedulerLocalization.editRecurringAppointmentDialogOccurrenceString + "</button><button title='" + that.schedulerLocalization.editRecurringAppointmentDialogSeriesString + "' id='editRecurringAppointmentSeries" + "." + that.element.id + "' style=' white-space:nowrap; text-overflow: ellipsis; border-bottom-width: 0px;  border-left-width: 0px; border-right-width:0px; width:50%; border-radius:0px;'>" + that.schedulerLocalization.editRecurringAppointmentDialogSeriesString + "</button></div></div></div>");
            that.editRecurrenceDialog = editRecurrenceDialog;
            $(editRecurrenceDialog).jqxWindow({ rtl: that.rtl, autoFocus: false, animationType: "none", autoOpen: false, theme: that.theme, minWidth: 300, minHeight: 110, resizable: false });
            var buttons = editRecurrenceDialog.find('button');
            buttons.jqxButton({ theme: that.theme, width: '50%', height: 30 });
            var fromButton = false;
            buttons.mousedown(function ()
            {
                fromButton = true;
                var id = this.id;
                if (id.indexOf('editRecurringAppointmentOccurrence') >= 0)
                {
                    that.editSeries(false);
                }
                else
                {
                    that.editSeries(true);
                }
                $(editRecurrenceDialog).jqxWindow('close');
            });

            this.addHandler($(editRecurrenceDialog), 'open', function (event)
            {
                that._raiseEvent('editRecurrenceDialogOpen', { dialog: editRecurrenceDialog, appointment: that.selectedJQXAppointment ? that.selectedJQXAppointment.boundAppointment : null });
            });

            that.addHandler($(editRecurrenceDialog), "keydown", function (event)
            {
                if (event.keyCode == 13)
                {
                    if ($(document.activeElement).ischildof($(editRecurrenceDialog)))
                    {
                        if (document.activeElement.nodeName.toLowerCase() == "button")
                        {
                            $(document.activeElement).trigger('mousedown');
                            $(document.activeElement).trigger('mouseup');
                            return true;
                        }
                    }
                }
            });
            this.addHandler($(editRecurrenceDialog), 'close', function (event)
            {
                if (!fromButton)
                {
                    that._removeFeedbackAndStopResize();
                    that.overlay.hide();
                    that.focus();
                    that._raiseEvent('editRecurrenceDialogClose', { dialog: editRecurrenceDialog, appointment: that.selectedJQXAppointment ? that.selectedJQXAppointment.boundAppointment : null });
                    return false;
                }
                fromButton = false;
                that.overlay.hide();
                that.focus();
                that._raiseEvent('editRecurrenceDialogClose', { dialog: editRecurrenceDialog, appointment: that.selectedJQXAppointment ? that.selectedJQXAppointment.boundAppointment : null });
            });

            that.editRecurrenceDialog = editRecurrenceDialog;
        },

        getViewStart: function () {
            var visibleDate = this.getVisibleDate();
            var view = this._views[this._view].type;
            var viewObject = this._views[this._view];

            switch (view) {
                case "dayView":
                case "timelineDayView":
                    return visibleDate;
            }

            var firstDay = this.getFirstDayOfWeek(visibleDate);
            return firstDay;
        },

        // gets the view's end date.
        getViewEnd: function () {
            var start = this.getViewStart();
            var step = 1;
            var view = this._views[this._view].type;
            var viewObject = this._views[this._view];
            switch (view) {
                case "dayView":
                case "timelineDayView":
                    step = 1;
                    if (viewObject.days) {
                        step = viewObject.days;
                    }
                    break;
                case "weekView":
                case "timelineWeekView":
                    step = 7;
                    if (viewObject.days) {
                        step = viewObject.days;
                    }
                    break;
                case "monthView":
                case "timelineMonthView":
                    step = 41;
                    if (viewObject.days) {
                        step = viewObject.days;
                    }
                    break;
                case "agendaView":
                    step = 7;
                    if (viewObject.days) {
                        step = viewObject.days;
                    }
                    break;
            }
            return start.addDays(step);
        },

        getFirstDayOfWeek: function (visibleDate) {
            var date = visibleDate;
            var firstDayOfWeek = this.schedulerLocalization.firstDay;

            if (firstDayOfWeek < 0 || firstDayOfWeek > 6)
                firstDayOfWeek = 6;

            while (date.dayOfWeek() != firstDayOfWeek) {
                date.addDays(-1, false);
            }

            return date;
        },

        // gets the visible date in the current month.
        getVisibleDate: function () {
            var visibleDate = this.date;
            if (visibleDate < this.min) {
                visibleDate = this.min;
            }

            if (visibleDate > this.max) {
                visibleDate = this.max;
            }
            var view = this._views[this._view].type;
            var viewObject = this._views[this._view];

            visibleDate = visibleDate.clearTime();

            switch (view) {
                case "dayView":
                case "weekView":
                case "timelineDayView":
                case "timelineWeekView":
                case "agendaView":
                    return visibleDate;
            }

            var dayInMonth = visibleDate.day();
            var newVisibleDate = visibleDate.addDays(-dayInMonth + 1);
            visibleDate = newVisibleDate;
            return visibleDate;
        },

        _builddataloadelement: function () {
            if (this.dataloadelement) {
                this.dataloadelement.remove();
            }

            this.dataloadelement = $('<div class="jqx-datatable-load" style="z-index: 99998; background-color:rgba(50,50,50,0.1); overflow: hidden; position: absolute;"></div>');
            var table = $('<div style="z-index: 99999; margin-left: -66px; left: 50%; top: 50%; margin-top: -24px; position: relative; width: 100px; height: 33px; padding: 5px; font-family: verdana; font-size: 12px; color: #767676; border-color: #898989; border-width: 1px; border-style: solid; background: #f6f6f6; border-collapse: collapse;"><div style="float: left;"><div style="float: left; overflow: hidden; width: 32px; height: 32px;" class="jqx-grid-load"/><span style="margin-top: 10px; float: left; display: block; margin-left: 5px;" >' + this.schedulerLocalization.loadString + '</span></div></div>');
            table.addClass(this.toTP('jqx-rc-all'));
            this.dataloadelement.addClass(this.toTP('jqx-rc-all'));
            table.addClass(this.toTP('jqx-fill-state-normal'));
            this.dataloadelement.append(table);
            this.dataloadelement.width(this.width);
            this.dataloadelement.height(this.height);

            this.host.prepend(this.dataloadelement);

            if (this.source._source.url != "") {
                var autoHeight = false;
                if (this.height === "auto" || this.height === null || this.autoheight) {
                    if (this.maxHeight == 999999) {
                        autoHeight = true;
                    }
                }
                if (autoHeight) {
                    this.host.height(100);
                    this.dataloadelement.height(100);
                }
                else {
                    this.host.height(this.height);
                    this.dataloadelement.height(this.height);
                }

                var autoWidth = false;
                if (this.width === "auto" || this.width === null || this.autoWidth) {
                    autoWidth = true;
                }
                if (autoWidth) {
                    this.host.width(300);
                    this.dataloadelement.width(300);
                }
                else {
                    this.host.width(this.width);
                    this.dataloadelement.width(this.width);
                }
            }
        },

        _measureElement: function (type) {
            var span = $("<span style='visibility: hidden; white-space: nowrap;'>measure Text</span>");
            span.addClass(this.toTP('jqx-widget'));
            $(document.body).append(span);
            if (type == 'cell') {
                this._cellheight = span.height();
            }
            else this._columnheight = span.height();
            span.remove();
        },

        _testmodules: function () {
            var missingModules = "";
            var that = this;
            var addComma = function () {
                if (missingModules.length != "") missingModules += ",";
            }

            if (!this.host.jqxScrollBar) {
                addComma();
                missingModules += " jqxscrollbar.js";
            }
            if (!this.host.jqxButton) {
                addComma();
                missingModules += " jqxbuttons.js";
            }
            if (!$.jqx.dataAdapter) {
                addComma();
                missingModules += " jqxdata.js";
            }
            if (!this.host.jqxDateTimeInput) {
                addComma();
                missingModules += " jqxdatetimeinput.js";
            }

            if (!this.host.jqxCalendar) {
                addComma();
                missingModules += " jqxcalendar.js";
            }

            try {
                if (!Globalize) {
                    addComma();
                    missingModules += " globalize.js";
                }
            }
            catch (er) {
            }

            if (missingModules != "") {
                throw new Error("jqxScheduler: Missing references to the following module(s): " + missingModules);
                this.host.remove();
                return true;
            }
            return false;
        },

        focus: function () {
            try {
                if (this.isTouchDevice())
                    return;

                if (this._editDialog && this._editDialog.jqxWindow('isOpen')) {
                    var that = this;
                    setTimeout(function () {
                        that.editDialogFields.subject.focus();
                        that.editDialogFields.subject.select();
                    }, 1);
                    this.focused = true;
                    return;
                }

                if (document.activeElement == this.element)
                    return;

                this.host.focus();
                var that = this;
                setTimeout(function ()
                {
                    that.host.focus();
                }, 25);
                this.focused = true;
            }
            catch (error) {
            }
        },

        hiddenParent: function () {
            return $.jqx.isHidden(this.host);
        },

        _updatesize: function (updateWidth, updateHeight) {
            if (this._loading) {
                return;
            }

            var that = this;

            var hostWidth = that.host.width();
            var hostHeight = that.host.height();

            if (!that._oldWidth) {
                that._oldWidth = hostWidth;
            }

            if (!that._oldHeight) {
                that._oldHeight = hostHeight;
            }

            if (that._resizeTimer != undefined) {
                clearTimeout(that._resizeTimer);
                that._resizeTimer = null;
            }

            var delay = 300;
            var resize = function () {
                if (that._resizeTimer) {
                    clearTimeout(that._resizeTimer);
                }
                that.resizingGrid = true;
                if ($.jqx.isHidden(that.host))
                    return;

                that._updatecolumnwidths();
                that.refresh();

                that._oldWidth = hostWidth;
                that._oldHeight = hostHeight;
                that.resizingGrid = false;
            }
            resize();
            that._resizeTimer = setTimeout(function () {
                var hostWidth = that.host.width();
                var hostHeight = that.host.height();
                if (that._oldWidth != hostWidth || that._oldHeight != hostHeight) {
                    resize();
                }
            }, delay);
        },

        resize: function (width, height) {
            if (width != undefined) {
                this.width = width;
            }
            if (height != undefined) {
                this.height = height;
            }
            this._updatecolumnwidths();
            this.refresh();
        },

        isTouchDevice: function () {
            if (this.touchDevice != undefined)
                return this.touchDevice;

            var isTouchDevice = $.jqx.mobile.isTouchDevice();
            this.touchDevice = isTouchDevice;
            if (this.touchMode == true) {
                isTouchDevice = true;
                $.jqx.mobile.setMobileSimulator(this.element);
                this.touchDevice = isTouchDevice;
            }
            else if (this.touchMode == false) {
                isTouchDevice = false;
            }
            if (isTouchDevice) {
                this.touchDevice = true;
                this.host.addClass(this.toThemeProperty('jqx-touch'));
                this.host.find('jqx-widget-content').addClass(this.toThemeProperty('jqx-touch'));
                this.host.find('jqx-widget-header').addClass(this.toThemeProperty('jqx-touch'));
                this.scrollBarSize = this.touchScrollBarSize;
            }
            return isTouchDevice;
        },

        toTP: function (name) {
            return this.toThemeProperty(name);
        },

        localizestrings: function (localizationobj, refresh) {
            this._cellscache = new Array();
            if ($.jqx.dataFormat) {
                $.jqx.dataFormat.cleardatescache();
            }

            if (this._loading) {
                throw new Error('jqxScheduler: ' + this.loadingErrorMessage);
                return false;
            }

            if (localizationobj != null) {
                for (var obj in this.schedulerLocalization) {
                    if (localizationobj[obj]) {
                        this.schedulerLocalization[obj] = localizationobj[obj];
                    }
                }

                if (localizationobj.loadingErrorMessage) {
                    this.loadingErrorMessage = localizationobj.loadingErrorMessage;
                }

                if (refresh !== false) {
                    this._builddataloadelement();
                    $(this.dataloadelement).css('visibility', 'hidden');
                    $(this.dataloadelement).css('display', 'none');
                }
            }
            else {
                this.schedulerLocalization =
                {
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
                    {"name": "A.D.", "start": null, "offset": 0 }
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
                        d3: "dd-MMMM-yyyy",
                        d4: "dd-MM-yy",
                        d5: "H:mm",
                        d6: "HH:mm",
                        d7: "HH:mm tt",
                        d8: "dd/MMMM/yyyy",
                        d9: "MMMM-dd",
                        d10: "MM-dd",
                        d11: "MM-dd-yyyy"
                    },
                    agendaDateColumn: "Date",
                    agendaTimeColumn: "Time",
                    agendaAppointmentColumn: "Appointment",
                    backString: "Back",
                    forwardString: "Forward",
                    toolBarPreviousButtonString: "previous",
                    toolBarNextButtonString: "next",
                    emptyDataString: "No data to display",
                    loadString: "Loading...",
                    clearString: "Clear",
                    todayString: "Today",
                    dayViewString: "Day",
                    weekViewString: "Week",
                    monthViewString: "Month",
                    agendaViewString: "Agenda",
                    timelineDayViewString: "Timeline Day",
                    timelineWeekViewString: "Timeline Week",
                    timelineMonthViewString: "Timeline Month",
                    agendaAllDayString: "all day",
                    loadingErrorMessage: "The data is still loading and you cannot set a property or call a method. You can do that once the data binding is completed. jqxScheduler raises the 'bindingComplete' event when the binding is completed.",
                    editRecurringAppointmentDialogTitleString: "Edit Recurring Appointment",
                    editRecurringAppointmentDialogContentString: "Do you want to edit only this occurrence or the series?",
                    editRecurringAppointmentDialogOccurrenceString: "Edit Occurrence",
                    editRecurringAppointmentDialogSeriesString: "Edit The Series",
                    editDialogTitleString: "Edit Appointment",
                    editDialogCreateTitleString: "Create New Appointment",
                    contextMenuEditAppointmentString: "Edit Appointment",
                    contextMenuCreateAppointmentString: "Create New Appointment",
                    editDialogSubjectString: "Subject",
                    editDialogLocationString: "Location",
                    editDialogFromString: "From",
                    editDialogToString: "To",
                    editDialogAllDayString: "All day",
                    editDialogExceptionsString: "Exceptions",
                    editDialogResetExceptionsString: "Reset on Save",
                    editDialogDescriptionString: "Description",
                    editDialogResourceIdString: "Owner",
                    editDialogStatusString: "Status",
                    editDialogColorString: "Color",
                    editDialogColorPlaceHolderString: "Select Color",
                    editDialogTimeZoneString: "Time Zone",
                    editDialogSelectTimeZoneString: "Select Time Zone",
                    editDialogSaveString: "Save",
                    editDialogDeleteString: "Delete",
                    editDialogCancelString: "Cancel",
                    editDialogRepeatString: "Repeat",
                    editDialogRepeatEveryString: "Repeat every",
                    editDialogRepeatEveryWeekString: "week(s)",
                    editDialogRepeatEveryYearString: "year(s)",
                    editDialogRepeatEveryDayString: "day(s)",
                    editDialogRepeatNeverString: "Never",
                    editDialogRepeatDailyString: "Daily",
                    editDialogRepeatWeeklyString: "Weekly",
                    editDialogRepeatMonthlyString: "Monthly",
                    editDialogRepeatYearlyString: "Yearly",
                    editDialogRepeatEveryMonthString: "month(s)",
                    editDialogRepeatEveryMonthDayString: "Day",
                    editDialogRepeatFirstString: "first",
                    editDialogRepeatSecondString: "second",
                    editDialogRepeatThirdString: "third",
                    editDialogRepeatFourthString: "fourth",
                    editDialogRepeatLastString: "last",
                    editDialogRepeatEndString: "End",
                    editDialogRepeatAfterString: "After",
                    editDialogRepeatOnString: "On",
                    editDialogRepeatOfString: "of",
                    editDialogRepeatOccurrencesString: "occurrence(s)",
                    editDialogRepeatSaveString: "Save Occurrence",
                    editDialogRepeatSaveSeriesString: "Save Series",
                    editDialogRepeatDeleteString: "Delete Occurrence",
                    editDialogRepeatDeleteSeriesString: "Delete Series",
                    editDialogStatuses:
                    {
                        free: "Free",
                        tentative: "Tentative",
                        busy: "Busy",
                        outOfOffice: "Out of Office"
                    }
                };
            }
        },

        _updateScrollbars: function (widgetHeight) {
            var autoWidth = false;
            var that = this;
            if (that.width === "auto" || that.width === null || that.autowidth) {
                if (that.maxWidth == 999999) {
                    autoWidth = true;
                }
            }

            var view = that._views[that._view].type;
            var viewObject = that._views[that._view];
            
            if (view == "monthView" && that.resources && that.resources.orientation == "none" && !viewObject.monthRowAutoHeight) {
                var vScrollBarVisibility = that.vScrollBar[0].style.visibility;
                that.hScrollBar[0].style.visibility = "hidden";
                that.vScrollBar[0].style.visibility = "hidden";
                if ((vScrollBarVisibility != that.vScrollBar[0].style.visibility)) {
                    that._updatecolumnwidths();
                }
                return;
            }

            // scrollbar Size.
            var scrollSize = parseInt(that.scrollBarSize);
            var tableHeight = that.table ? that.table.height() : 0;
            var vOffset = 0;
            var visibility = "inherit";
            var vScrollBarVisibility = that.vScrollBar[0].style.visibility;
            var hScrollBarVisibility = that.hScrollBar[0].style.visibility;
            if (!widgetHeight) {
                var hostHeight = that.host.height();
            }
            else {
                var hostHeight = widgetHeight;
            }

            if (!that.columnGroups) {
                hostHeight -= that.showHeader ? that.columnsHeight : 0;
            }
            else {
                hostHeight -= that.showHeader ? that.columnsheader.height() : 0;
            }

            if (that.filterable) {
                hostHeight -= that.filter.height();
            }
            if (that.pageable) {
                hostHeight -= that.pagerHeight;
                if (that.pagerPosition === "both") {
                    hostHeight -= that.pagerHeight;
                }
            }
            if (that.showToolbar) {
                hostHeight -= that.toolbarHeight;
            }
            if (that.showLegend && that._resources.length > 0) {
                hostHeight -= that.legendHeight;
            }

            var autoHeight = false;
            if (that.height === "auto" || that.height === null || that.autoheight) {
                if (that.maxHeight == 999999) {
                    autoHeight = true;
                }
            }

            if (!autoHeight && tableHeight > hostHeight && (that.getRows().length > 0)) {
                that.vScrollBar[0].style.visibility = visibility;
                vOffset = 4 + parseInt(scrollSize);
                that.vScrollBar.jqxScrollBar({ max: tableHeight - hostHeight });
            }
            else {
                that.vScrollBar[0].style.visibility = "hidden";
            }

            if ((vScrollBarVisibility != that.vScrollBar[0].style.visibility)) {
                 that._updatecolumnwidths();
            }

            var tableWidth = that.table ? that.table.width() : 0;
            if (tableWidth > 4) {
                tableWidth -= 4;
            }

            var borderWidth = parseInt(that.host.css('border-left-width')) + parseInt(that.host.css('border-right-width'));
            var hostWidth = borderWidth + that.host.width() - vOffset;

            if (tableWidth > hostWidth && !autoWidth) {
                that.hScrollBar[0].style.visibility = visibility;
                that.hScrollBar.jqxScrollBar({ max: 2+borderWidth + tableWidth - hostWidth });
                vOffset = 4 + parseInt(scrollSize);
                if (scrollSize == 0) vOffset = 0;
                if (!autoHeight && tableHeight != hostHeight) {
                    if (tableHeight > hostHeight - vOffset + 4 && (that.getRows().length > 0)) {
                        that.hScrollBar.jqxScrollBar({ max: borderWidth + tableWidth - hostWidth });
                        var isHidden = that.vScrollBar[0].style.visibility === "hidden";
                        that.vScrollBar[0].style.visibility = visibility;
                        that._updatecolumnwidths();
                        if (isHidden) {
                            that.hScrollBar.jqxScrollBar({ max: tableWidth - hostWidth + borderWidth });
                        }
                        var newTableWidth = that.table ? that.table.width() : 0;
                        if (newTableWidth > 3) {
                            newTableWidth -= 3;
                        }
                        if (newTableWidth != tableWidth) {
                            if (newTableWidth < hostWidth) {
                                that.hScrollBar.jqxScrollBar({ max: borderWidth + newTableWidth - hostWidth });
                                that.hScrollBar[0].style.visibility = "hidden";
                                vOffset = 0;
                            }
                            else if (!isHidden) {
                                that.hScrollBar.jqxScrollBar({ max: tableWidth - hostWidth + borderWidth - scrollSize });
                            }
                            else if (newTableWidth > hostWidth) {
                                that.hScrollBar.jqxScrollBar({ max: borderWidth + newTableWidth - hostWidth });
                            }
                        }
                    }
                    if (tableHeight - hostHeight > 0) {
                        that.vScrollBar.jqxScrollBar({ max: tableHeight - hostHeight + vOffset });
                    }
                    else {
                        that.vScrollBar[0].style.visibility = "hidden";
                    }
                }
            }
            else {
                that.hScrollBar[0].style.visibility = "hidden";
            }

            if (that.getRows().length === 0) {
                that.vScrollBar[0].style.visibility = "hidden";
                that.bottomRight[0].style.visibility = "hidden";
            }

            if (that.vScrollBar[0].style.visibility == "hidden") {
                if (that.vScrollInstance.value != 0) {
                    that.vScrollInstance.setPosition(0);
                }
            }
        },

        _measureElementWidth: function (text) {
            var span = $("<span style='visibility: hidden; white-space: nowrap;'>" + text + "</span>");
            span.addClass(this.toTP('jqx-widget'));
            span.addClass(this.toTP('jqx-grid'));
            span.addClass(this.toTP('jqx-grid-column-header'));
            span.addClass(this.toTP('jqx-widget-header'));
            $(document.body).append(span);
            var w = span.outerWidth() + 20;
            span.remove();
            return w;
        },

        _arrangeAutoHeight: function (scrollOffset) {
            if (!scrollOffset) scrollOffset = 0;

            if (this.height === "auto" || this.height === null || this.autoheight) {
                var t = this.table.height();
                var heightTotal = 0;

                if (!this.columnGroups) {
                    heightTotal += this.showHeader ? this.columnsHeight : -1;
                }
                else {
                    heightTotal += this.showHeader ? this.columnsheader.height() : -1;
                }

                heightTotal += this.showLegend && this._resources.length > 0 ? this.legendHeight : 0;
                heightTotal += this.showToolbar ? this.toolbarHeight : 0;
                heightTotal += this.pageable ? this.pagerHeight : 0;
                if (this.pagerPosition === 'both') {
                    heightTotal += this.pageable ? this.pagerHeight : 0;
                }
                heightTotal += t;
                if (this.filterable) {
                    var filterconditions = this.filter.find('.filterrow');
                    var filterconditionshidden = this.filter.find('.filterrow-hidden');
                    var filterrow = 1;
                    if (filterconditionshidden.length > 0) {
                        filterrow = 0;
                    }
                    heightTotal += this.filterHeight - 1 + this.filterHeight * filterconditions.length * filterrow;
                }
                if (heightTotal + scrollOffset > this.maxHeight) {
                    this.host.height(this.maxHeight);
                }
                else {
                    this.host.height(heightTotal + scrollOffset);
                }
                return true;
            }
            return false;
        },

        _arrangeAutoWidth: function (scrollOffset) {
            if (!scrollOffset) scrollOffset = 0;
            if (this.width === "auto" || this.width === null || this.autowidth) {
                var w = 0;
                for (var i = 0; i < this.columns.records.length; i++) {
                    var cw = this.columns.records[i].width;
                    if (this.columns.records[i].hidden) continue;
                    if (cw == 'auto') {
                        cw = this._measureElementWidth(this.columns.records[i].text);
                        w += cw;
                    }
                    else {
                        w += cw;
                    }
                }
                width = w;
                if (width + scrollOffset > this.maxWidth) {
                    this.host.width(this.maxWidth);
                }
                else {
                    this.host.width(width + scrollOffset);
                }
                return true;
            }
            return false;
        },

        _measureTopAndHeight: function () {
            var height = this.host.height();
            var top = 0;

            if (this.showToolbar) {
                top += this.toolbarHeight;
                height -= parseInt(this.toolbarHeight);
            }

            if (this.showLegend && this.legendPosition != 'bottom' && this._resources.length > 0) {
                top += parseInt(this.legendHeight) + 1;
            }
            return { top: top, height: height };
        },

        _arrange: function () {
            if (!this.table) {
                return;
            }

            this._arrangeAutoHeight();
            this._arrangeAutoWidth();

            var legendHeight = this.legendHeight;
            if (this._resources.length == 0) {
                legendHeight = 0;
            }

            var width = this._hostWidth ? this._hostWidth  : this.host.width();
            var height = this._hostHeight ? this._hostHeight : this.host.height();

            var hostHeight = height;
            var that = this;
            if (this.showLegend && this.legendPosition == "top") {
                this.legendbartop[0].style.visibility = "inherit";
            }
            else {
                this.legendbartop[0].style.visibility = "hidden";
            }

            var top = 0;

            if (this.showToolbar) {
                this.toolbar.width(width);
                this.toolbar[0].style.height = this.toolbarHeight - 1 + "px";
                this.toolbar[0].style.top = "0px";
                top += this.toolbarHeight;
                height -= parseInt(this.toolbarHeight);
            }
            else {
                this.toolbar[0].style.height = '0px';
            }

            if (this.showLegend && this.legendPosition == "bottom") {
                this.legendbarbottom[0].style.width = width + "px";
                this.legendbarbottom[0].style.height = legendHeight + "px";
            }
            else {
                this.legendbarbottom[0].style.height = '0px';
            }

            if (this.showLegend && this.legendPosition == "top") {
                if (this.legendbartop[0].style.width != width + 'px') {
                    this.legendbartop[0].style.width = parseInt(width) + 'px';
                }
                if (this.legendbartop[0].style.height != legendHeight + 'px') {
                    this.legendbartop[0].style.height = parseInt(legendHeight - 1) + 'px';
                }

                if (this.legendbartop[0].style.top != top + 'px') {
                    this.legendbartop[0].style.top = top + 'px';
                }

                var newContentTop = top + legendHeight + 'px';
                if (this.content[0].style.top != newContentTop) {
                    top = top + legendHeight;
                    this.content[0].style.top = top + 'px';
                }
            }
            if (!this.showLegend) {
                this.legendbartop[0].style.display = "none";
                this.legendbarbottom[0].style.display = "none";
            }
            // scrollbar Size.
            this._updateScrollbars(hostHeight);

            var scrollSize = parseInt(this.scrollBarSize);
            var scrollOffset = 4;
            var bottomSizeOffset = 2;
            var rightSizeOffset = 0;

            // right scroll offset. 
            if (this.vScrollBar[0].style.visibility != 'hidden') {
                rightSizeOffset = scrollSize + scrollOffset;
            }

            // bottom scroll offset.
            if (this.hScrollBar[0].style.visibility != 'hidden') {
                bottomSizeOffset = scrollSize + scrollOffset + 2;
            }

            if (scrollSize == 0)
            {
                bottomSizeOffset = 0;
                rightSizeOffset = 0;
            }

            if ("hidden" != this.vScrollBar[0].style.visibility || "hidden" != this.hScrollBar[0].style.visibility) {
                var autoHeight = this._arrangeAutoHeight(bottomSizeOffset - 2);
                var autoWidth = this._arrangeAutoWidth(rightSizeOffset + 1);
                if (autoHeight || autoWidth) {
                    this.legendbartop[0].style.width = parseInt(width) + 'px';
                    this.toolbar[0].style.width = parseInt(width) + 'px';
                    this.legendbarbottom[0].style.width = parseInt(width) + 'px';
                    this.filter[0].style.width = parseInt(width) + 'px';
                }
                if (autoHeight) {
                    var measured = this._measureTopAndHeight();
                    top = measured.top;
                    height = measured.height;
                }
            }

            var pageheight = 0;

            if (this.showLegend && this.legendPosition == "bottom") {
                bottomSizeOffset += legendHeight;
                pageheight += legendHeight;
            }
            else if (this.showLegend) {
                bottomSizeOffset += legendHeight;
            }

            if (this.hScrollBar[0].style.height != scrollSize + 'px') {
                this.hScrollBar[0].style.height = parseInt(scrollSize) + 'px';
            }

            if (this.hScrollBar[0].style.top != top + height - scrollOffset - scrollSize - pageheight + 'px' || this.hScrollBar[0].style.left != '0px') {
                this.hScrollBar[0].style.top = top + height - scrollOffset - scrollSize - pageheight - 1 + 'px';
                this.hScrollBar[0].style.left = '0px';
            }

            var hScrollWidth = this.hScrollBar[0].style.width;
            var hSizeChange = false;
            var vSizeChange = false;

            if (rightSizeOffset == 0) {
                if (hScrollWidth != (width - 2) + 'px') {
                    this.hScrollBar[0].style.width = (width - 2) + 'px'
                    hSizeChange = true;
                }
            }
            else {
                if (hScrollWidth != (width - scrollSize - scrollOffset) + 'px') {
                    this.hScrollBar[0].style.width = (width - scrollSize - scrollOffset + 'px');
                    hSizeChange = true;
                }
            }

            if (this.vScrollBar[0].style.width != scrollSize + 'px') {
                this.vScrollBar[0].style.width = scrollSize + 'px';
                vSizeChange = true;
            }
            if (this.vScrollBar[0].style.height != parseInt(height) - bottomSizeOffset + 'px') {
                this.vScrollBar[0].style.height = (parseInt(height) - bottomSizeOffset + 'px');
                vSizeChange = true;
            }
            if (this.vScrollBar[0].style.left != parseInt(width) - parseInt(scrollSize) - scrollOffset + 'px' || this.vScrollBar[0].style.top != top + 'px') {
                this.vScrollBar[0].style.top = top + 'px';
                this.vScrollBar[0].style.left = parseInt(width) - parseInt(scrollSize) - scrollOffset + 'px';
            }

            if (this.rtl) {
                this.vScrollBar.css({ left: '0px', top: top });
                if (this.vScrollBar.css('visibility') != 'hidden') {
                    this.hScrollBar.css({ left: scrollSize + 2 });
                }
            }

            var vScrollInstance = this.vScrollInstance;
            vScrollInstance.disabled = this.disabled;
            var hScrollInstance = this.hScrollInstance;
            hScrollInstance.disabled = this.disabled;
            if (hSizeChange) {
                hScrollInstance.refresh();
            }
            if (vSizeChange) {
                vScrollInstance.refresh();
            }

            var updateBottomRight = function (that) {
                if ((that.vScrollBar[0].style.visibility != 'hidden') && (that.hScrollBar[0].style.visibility != 'hidden')) {
                    that.bottomRight[0].style.visibility = 'inherit';
                    that.bottomRight[0].style.left = 1 + parseInt(that.vScrollBar.css('left')) + 'px';
                    that.bottomRight[0].style.top = parseInt(that.hScrollBar.css('top')) + 'px';

                    if (that.rtl) {
                        that.bottomRight.css('left', '0px');
                    }

                    that.bottomRight[0].style.width = parseInt(scrollSize) + 3 + 'px';
                    that.bottomRight[0].style.height = parseInt(scrollSize) + 4 + 'px';
                }
                else {
                    that.bottomRight[0].style.visibility = 'hidden';
                }
            }

            updateBottomRight(this);

            if (this.content[0].style.width != width - rightSizeOffset + 'px') {
                this.content[0].style.width = width - rightSizeOffset + 'px';
            }
            if (this.content[0].style.height != height - bottomSizeOffset + 3 + 'px') {
                this.content[0].style.height = height - bottomSizeOffset + 3 + 'px';
            }
            if (this.content[0].style.top != top + 'px') {
                this.content[0].style.top = parseInt(top) + 'px';
            }
            if (this.rtl) {
                this.content.css('left',rightSizeOffset);
            }

            if (this.showLegend && this.legendPosition == "bottom") {
                this.legendbarbottom.css('top', top - 1 + height - legendHeight - (this.pageable ? this.pagerHeight : 0));
                if (this.rtl) {
                    if (this.hScrollBar.css('visibility') == 'hidden') {
                        this.legendbarbottom.css('left', this.content.css('left'));
                    }
                    else {
                        this.legendbarbottom.css('left', '0px');
                    }
                }
            }

            this.vScrollBar[0].style.zIndex = this.tableZIndex + this.headerZIndex + 10 + this.columns.records.length;
            this.hScrollBar[0].style.zIndex = this.tableZIndex + this.headerZIndex + 10 + this.columns.records.length;

            if (width != parseInt(this.dataloadelement[0].style.width)) {
                this.dataloadelement[0].style.width = this.element.style.width;
            }
            if (height != parseInt(this.dataloadelement[0].style.height)) {
                this.dataloadelement[0].style.height = this.element.style.height;
            }
            this._hostWidth = width;
            this._hostHeight = hostHeight;
            var tableOffset = this.schedulercontent.coord();
            this._tableOffset = tableOffset;
        },

        scrollOffset: function (top, left) {
            if (arguments.length == 0 || (top != null && typeof (top) == "object" && !top.top)) {
                return { left: this.hScrollBar.jqxScrollBar('value'), top: this.vScrollBar.jqxScrollBar('value') };
            }

            if (top != null && typeof (top) == "object") {
                var left = top.left;
                var t = top.top;
                var top = t;
            }

            if (top == null || left == null || top == undefined || left == undefined)
                return;

            this.vScrollBar.jqxScrollBar('setPosition', top);
            this.hScrollBar.jqxScrollBar('setPosition', left);
        },

        scrollleft: function (left) {
            if (left == null || left == undefined)
                return;
            if (this.hScrollBar.css('visibility') != 'hidden') {
                this.hScrollBar.jqxScrollBar('setPosition', left);
            }
        },

        scrolltop: function (top) {
            if (top == null || top == undefined)
                return;
            if (this.vScrollBar.css('visibility') != 'hidden') {
                this.vScrollBar.jqxScrollBar('setPosition', top);
            }
        },

        beginAppointmentsUpdate: function()
        {
            this._appupdating = true;
        },

        endAppointmentsUpdate: function()
        {
            this._appupdating = false;
            this._renderrows();
        },

        beginUpdate: function () {
            this._updating = true;
            this._datachanged = false;
        },

        endUpdate: function (refresh) {
            this._updating = false;

            if (refresh === false) {
                return;
            }

            this._rendercolumnheaders();
            this.refresh();
        },

        updating: function () {
            return this._updating;
        },

        databind: function (source, reason, done) {
            if (this.loadingstate === true) {
                return;
            }

            if (this.host.css('display') == 'block') {
                if (this.autoShowLoadElement) {
                    $(this.dataloadelement).css('visibility', 'visible');
                    $(this.dataloadelement).css('display', 'block');
                    this.dataloadelement.width(this.host.width());
                    this.dataloadelement.height(this.host.height());
                }
                else {
                    $(this.dataloadelement).css('visibility', 'hidden');
                    $(this.dataloadelement).css('display', 'none');
                }
            }

            var that = this;
            if (source == null) {
                source = {};
            }

            if (source.sortcomparer == undefined || source.sortcomparer == null) {
                source.sortcomparer = null;
            }
            if (source.filter == undefined || source.filter == null) {
                source.filter = null;
            }
            if (source.sort == undefined || source.sort == null) {
                source.sort = null;
            }
            if (source.data == undefined || source.data == null) {
                source.data = null;
            }

            var url = null;
            if (source != null) {
                url = source._source != undefined ? source._source.url : source.url;
            }
            this.dataview = this.dataview || new $.jqx.scheduler.dataView("dataView");
            this.resourcesDataView = this.resourcesDataView || new $.jqx.scheduler.dataView("resourcesDataView");

            this.dataview.pageable = this.pageable;
            this.dataview.scheduler = this;
            this.resourcesDataView.scheduler = this;
            this._loading = true;
            this.appointments = new Array();
            this.uiappointments = new Array();

            var expectCalls = 1;
            if (this.resources && this.resources.source) {
                expectCalls = 2;
            }
            var currentCalls = 0;
            var doRender = function () {
                if (currentCalls == expectCalls) {
                    var resourcesCount = that._resources.length > 1 ? that._resources.length : 1;
                    if (that.resources && that.resources.orientation === "horizontal") {
                        that.tableColumns = resourcesCount;
                        that.tableRows = 1;
                    }
                    else if (that.resources && that.resources.orientation === "vertical") {
                        that.tableRows = resourcesCount;
                        that.tableColumns = 1;
                    }
                    else {
                        that.tableColumns = 1;
                        that.tableRows = 1;
                    }

                    that._render();
                    if (that.autoShowLoadElement && !that._loading) {
                        $(that.dataloadelement).css('visibility', 'hidden');
                        $(that.dataloadelement).css('display', 'none');
                    }

                    that._updateTouchScrolling();
                    that._raiseEvent('bindingComplete');
                    if (done) {
                        done();
                    }
                    if (!that.initializedcall) {
                        that.initializedcall = true;
                        that.isInitialized = true;
                        if ((that.width != null && that.width.toString().indexOf('%') != -1) || (that.height != null && that.height.toString().indexOf('%') != -1)) {
                            that._updatesize(true);
                        }
                        if (that.ready) {
                            that.ready();
                        }

                        if (that.host.css('visibility') == 'hidden') {
                            var ie7 = $.jqx.browser.msie && $.jqx.browser.version < 8;

                            if (that.vScrollBar.css('visibility') == 'visible') {
                                that.vScrollBar.css('visibility', 'inherit');
                            }

                            if (that.hScrollBar.css('visibility') == 'visible') {
                                that.hScrollBar.css('visibility', 'inherit');
                            }

                            that._intervalTimer = setInterval(function () {
                                if (that.host.css('visibility') == 'visible') {
                                    that._updatesize(true);
                                    clearInterval(that._intervalTimer);
                                }
                            }, 100);
                        }
                    }
                }
            }

            this.dataview.update = function (rowschanged) {
                that._loading = false;
                that.appointmentsByKey = new Array();
                that.appointments = new Array();
                that.uiappointments = new Array();
                var datafields = that.source._source.datafields;
        
                var defaultFields = [
                    "from",
                    "to",
                    "id",
                    "style",
                    "description",
                    "location",
                    "subject",
                    "background",
                    "color",
                    "borderColor",
                    "recurrencePattern",
                    "recurrenceException",
                    "draggable",
                    "resizable",
                    "tooltip",
                    "hidden",
                    "allDay",
                    "timeZone",
                    "ownerId",
                    "resourceId"
                ];

                var _resources = new Array();
                for (var i = 0; i < that.source.records.length; i++) {
                    var row = that.source.records[i];
                    var appointment = {};

                    for (var key in that.appointmentDataFields) {
                        var field = that.appointmentDataFields[key];
                        var value = row[field];
                        if (key == "from" || key == "to") {
                            value = new $.jqx.date(value);
                        }

                        if (key == "style") {
                            if (value) {
                                var appointmentColors = that.getAppointmentColors(value);
                                appointment.color = appointmentColors.color;
                                appointment.background = appointmentColors.background;
                                appointment.borderColor = appointmentColors.border;
                            }
                        }

                        if (key == "recurrencePattern") {
                            if (value) {
                                value = new $.jqx.scheduler.recurrencePattern(value);
                                value.timeZone = row.timeZone || that.timeZone;
                            }
                        }
                        if (key == "recurrenceException") {
                            var exceptions = new Array();
                            if (value) {
                                if (value.indexOf("EXDATE:") >= 0) {
                                    value = value.substring(value.indexOf("EXDATE:") + 7);
                                }

                                var exdates = new Array();
                                if (value.indexOf(",") >= 0) {
                                    exdates = value.split(',');
                                }
                                else {
                                    exdates.push(value);
                                }
                                for (var exIndex = 0; exIndex < exdates.length; exIndex++) {
                                    var current = exdates[exIndex];
                                    if (current.indexOf(';') >= 0) {
                                        var canDisplay = current.split(';')[1];
                                        current = current.split(';')[0];
                                        if (canDisplay.toLowerCase().indexOf('display') >= 0 && canDisplay.toLowerCase().indexOf('none')) {
                                            appointment["hidden"] = true;
                                        }
                                    }
                                    try {
                                        var date = $.jqx.scheduler.utilities.untilStringToDate(current);
                                        if (date != "Invalid Date") {
                                            if (appointment.timeZone) {
                                                date = new $.jqx.date(date, appointment.timeZone);
                                            }
                                            else if (that.timeZone) {
                                                date = date.toTimeZone(that.timeZone);
                                            }
                                            else {
                                                date = new $.jqx.date(date);
                                            }
                                        }
                                    }
                                    catch (er) {
                                        var date = new $.jqx.date(current, that.timeZone);
                                    }

                                    exceptions.push(date);
                                }
                            }
                            value = exceptions;
                        }
                        appointment[key] = value;
                    }

                    for (var obj in defaultFields) {
                        var key = defaultFields[obj];
                        if (appointment[key] == undefined) {
                            var value = "";
                            if (key == "originalData")
                                continue;

                            if (key == "ownerId") value = null;
                            if (key == "timeZone") value = null;
                            if (key == "recurrencePattern") value = null;
                            if (key == "recurrenceException") value = null;
                            if (key == "allDay") value = false;
                            if (key == "draggable") value = true;
                            if (key == "resizable") value = true;
                            if (key == "hidden") value = false;
                            if (key == "resourceId") value = null;
                            if (key == "from") {
                                value = new $.jqx.date();
                            }
                            if (key == "to") {
                                value = new $.jqx.date().addHours(1);
                            }
                            appointment[key] = value;
                        }
                    }
                    appointment.originalData = row;
                    if (that.resources && !that.resources.source) {
                        if (_resources.indexOf(appointment.resourceId) == -1) {
                            _resources.push(appointment.resourceId);
                        }
                    }

                    that.appointmentsByKey[row.uid] = appointment;
                    that.appointments.push(appointment);
                    var uiappointment = new $.jqx.scheduler.appointment(appointment);
                    if (appointment.timeZone) {
                        uiappointment.from = uiappointment.from.toTimeZone(appointment.timeZone);
                        uiappointment.to = uiappointment.to.toTimeZone(appointment.timeZone);
                    }

                    if (that.timeZone) {
                        if (!appointment.timeZone) {
                            uiappointment.timeZone = that.timeZone;
                        }
                        uiappointment.from = uiappointment.from.toTimeZone(that.timeZone);
                        uiappointment.to = uiappointment.to.toTimeZone(that.timeZone);
                    }
                    else {
                        uiappointment.from = uiappointment.from.toTimeZone(null);
                        uiappointment.to = uiappointment.to.toTimeZone(null);
                    }

                    appointment.jqxAppointment = uiappointment;
                    if (appointment["recurrenceException"]) {
                        for (var ex = 0; ex < appointment["recurrenceException"].length; ex++) {
                            var date = uiappointment.recurrenceException[ex];
                            var exception = uiappointment.clone();
                            exception.occurrenceFrom = date;
                            var duration = uiappointment.duration();
                            if (that.allDay) {
                                duration = new $.jqx.timeSpan(10000 * (that.to - that.from));
                            }

                            exception.from = date;
                            exception.to = date.add(duration);
                            exception.rootAppointment = uiappointment;
                            exception.hidden = true;
                            uiappointment.exceptions.push(exception);
                        }
                    }

                    uiappointment.boundAppointment = appointment;
                    uiappointment.scheduler = that;
                    that.uiappointments.push(uiappointment);
                }

                that._resources = _resources;
                currentCalls++;
                doRender();
            }
            this.resourcesDataView.update = function (records) {
                if (that.resources.dataField) {
                    that._resources = new Array();
                    for (var i = 0; i < records.length; i++) {
                        if (that._resources.indexOf(records[i][that.resources.dataField]) >= 0) {
                            continue;
                        }
                        if (records[i][that.resources.dataField]) {
                            that._resources.push(records[i][that.resources.dataField]);
                        }
                    }
                }
                else {
                    that._resources = records;
                }
                if (that.resources.orientation == undefined) {
                    that.resources.orientation = "none";
                }
                currentCalls++;
                doRender();
            }

            this.dataview.databind(source);
            if (this.resources && this.resources.source) {
                this.resourcesDataView.databind(this.resources.source);
            }
        },

        _raiseEvent: function (id, arg) {
            if (arg == undefined)
                arg = { owner: null };

            var evt = id;
            var args = arg;
            args.owner = this;

            var event = new $.Event(evt);
            event.owner = this;
            event.args = args;
            var result = this.host.trigger(event);

            // save the new event arguments.
            arg = event.args;
            return result;
        },

        ensureAppointmentVisible: function (key) {
            if (this.appointmentsByKey[key]) {
                return this._ensureAppointmentVisible(this.appointmentsByKey[key].jqxAppointment);
            }
            return false;
        },

        _ensureAppointmentVisible: function (appointment) {
            if (this.vScrollBar[0].style.visibility === "hidden" && this.hScrollBar[0].style.visibility === "hidden") {
                return false;
            }
            if (!appointment)
                return false;

            var viewStart = this.getViewStart();
            var viewEnd = this.getViewEnd();
            var inView = $.jqx.scheduler.utilities.rangeIntersection(appointment.from, appointment.to, viewStart, viewEnd)
            if (!inView) {
                this.navigateTo(appointment.from);
                return this._ensureAppointmentVisible(appointment);
            }
            var key = appointment.id;
            var appointmentElements = $('[data-key="' + key + '"]');
            if (appointmentElements.length > 0) {
                var element = appointmentElements[0];
            }
            else if (appointment.elements && appointment.elements.length > 0) {
                var appointmentDataElement = appointment.elements[0];
                var element = appointmentDataElement.element;
            }
            else {
                return false;
            }
            var value = this.vScrollInstance.value;
            var hValue = this.hScrollInstance.value;
            if (this.rtl) {
                var hValue = this.hScrollInstance.max - hValue;
            }

            var tableheight = this.element.clientHeight;
            var tablewidth = this.element.clientWidth;
            var headerHeight = 0;
            if (!this.columnGroups) {
                headerHeight += this.showHeader ? this.columnsHeight : 0;
            }
            else {
                headerHeight += this.showHeader ? this.columnsheader.height() : 0;
            }


            var view = this._views[this._view].type;
            var viewObject = this._views[this._view];
            var allDayRowHeight = 0;
            if (view == "dayView" || view == "weekView") {
                var showAllDayRow = this.showAllDayRow;
                if (viewObject.timeRuler && (view === "dayView" || view === "weekView")) {
                    if (viewObject.timeRuler.showAllDayRow != undefined) {
                        showAllDayRow = viewObject.timeRuler.showAllDayRow;
                    }
                }
                if (showAllDayRow) {
                    if (this.tableRows == 1) {
                        allDayRowHeight = this.table[0].rows[0].clientHeight;
                    }
                    else {
                        allDayRowHeight = this.table[0].rows[1].clientHeight;
                    }
                }
                var allDayAppointment = appointment.duration().days() >= 1 || appointment.allDay;
                if (allDayAppointment && this.tableRows == 1 && this.tableColumns == 1)
                    return false;
            }

            if (this.showToolbar) {
                headerHeight += this.toolbarHeight;
            }

            tableheight -= headerHeight;
            if (this.showLegend && this._resources.length > 0) {
                tableheight -= this.legendHeight;
            }

            var tableTop = 0;
            var tableLeft = 0;

            var view_top = value - tableTop;
            var view_bottom = tableheight + view_top - allDayRowHeight;
            var view_left = hValue - tableLeft;
            var view_right = tablewidth + view_left;
            var item = element;
            item = $(item);
            var itemOuterHeight = item[0].clientHeight;
            var item_top = item.position().top - allDayRowHeight;
            var item_bottom = item_top + itemOuterHeight;

            if (item_top <= view_top) {
                var topOffset = item_top;
                if (topOffset < 0) topOffset = 0;
                if (!allDayAppointment || (allDayAppointment && this.tableRows > 1)) {
                    this.vScrollBar.jqxScrollBar('setPosition', topOffset);
                }
            }
            else if (item_top >= view_bottom) {
                var topOffset = item_top;
                if (topOffset < 0) topOffset = 0;
                if (!allDayAppointment || (allDayAppointment && this.tableRows > 1)) {
                    this.vScrollBar.jqxScrollBar('setPosition', topOffset - 2);
                }
            }

            var item_left = item.position().left;
            item_left = Math.round(item_left);
            var item_right = item_left + item.outerWidth();

            if (Math.round(item.position().left) === 0) {
                this.hScrollBar.jqxScrollBar('setPosition', 0);
            }

            if (item_left <= view_left) {
                var leftOffset = item_left - item.outerWidth() + tableLeft;
                if (leftOffset < 0) leftOffset = 0;
                if (!this.rtl) {
                    this.hScrollBar.jqxScrollBar('setPosition', item_left);
                }
                else {
                    this.hScrollBar.jqxScrollBar('setPosition', this.hScrollBar.jqxScrollBar('max') - item_left);
                }
            }

            if (item_left > view_right) {
                if (!this.rtl) {
                    this.hScrollBar.jqxScrollBar('setPosition', item_left);
                }
                else {
                    this.hScrollBar.jqxScrollBar('setPosition', this.hScrollBar.jqxScrollBar('max') - item_left);
                }
            }
        },

        ensureVisible: function (jqxDate, resourceID)
        {
            var that = this;
            var dateTime = $.type(jqxDate) == "date" ? jqxDate : jqxDate.toDate();
            for (var i = 0; i < that.rows.length; i++) {
                for (var j = 0; j < that.rows[i].cells.length; j++) {
                    var cell = that.rows[i].cells[j];
                    if (resourceID) {
                        if (cell.getAttribute("data-view") !== resourceID)
                            continue;
                    }

                    var dateString = cell.getAttribute("data-date");
                    var getDate = that._getDateByString;
                    var cellDate = getDate(dateString);
                    if (cellDate.valueOf() == dateTime.valueOf()) {
                        return that._ensureVisible(cell);
                    }
                }
            }
        },

        _ensureVisible: function (cell) {
            if (this.vScrollBar[0].style.visibility === "hidden" && this.hScrollBar[0].style.visibility === "hidden") {
                return false;
            }
            var value = this.vScrollBar.jqxScrollBar('value');
            var hValue = this.hScrollBar.jqxScrollBar('value');
            if (this.rtl) {
                hValue = this.hScrollBar.jqxScrollBar('max') - hValue;
            }

            var tableheight = this._hostHeight;
            var tablewidth = this._hostWidth;
            var headerHeight = 0;
            if (!this.columnGroups) {
                headerHeight += this.showHeader ? this.columnsHeight : 0;
            }
            else {
                headerHeight += this.showHeader ? this.columnsheader.height() : 0;
            }

            if (this.showToolbar) {
                headerHeight += this.toolbarHeight;
            }

            tableheight -= headerHeight;
            if (this.showLegend && this._resources.length > 0) {
                tableheight -= this.legendHeight;
            }
            if (this.hScrollBar.css('visibility') != 'hidden') {
                tableheight -= 20;
            }

            var tableTop = 0;
            var tableLeft = 0;
            var view = this._views[this._view].type;
            var viewObject = this._views[this._view];
            var allDayRowHeight = 0;
            if (view == "dayView" || view == "weekView") {
                var showAllDayRow = this.showAllDayRow;
                if (viewObject.timeRuler && (view === "dayView" || view === "weekView")) {
                    if (viewObject.timeRuler.showAllDayRow != undefined) {
                        showAllDayRow = viewObject.timeRuler.showAllDayRow;
                    }
                }
                if (showAllDayRow) {
                    if (this.tableRows == 1) {
                        allDayRowHeight = this.table[0].rows[0].clientHeight;
                    }
                    else {
                        allDayRowHeight = this.table[0].rows[1].clientHeight;
                    }
                }
            }

            var view_top = value - tableTop;
            var view_bottom = tableheight + view_top - allDayRowHeight;
            var view_left = hValue - tableLeft;
            var view_right = tablewidth + view_left;
            var item = cell;
            item = $(item);
            var item_top = item.position().top - allDayRowHeight;
            var item_bottom = item_top + item.outerHeight();

            var item_left = item.position().left;
            item_left = Math.round(item_left);
            var item_right = item_left + item.outerWidth();

            if (Math.round(item.position().left) === 0) {
                this.hScrollBar.jqxScrollBar('setPosition', 0);
            }

            if (item_left <= view_left) {
                var leftOffset = item_left - item.outerWidth() + tableLeft;
                if (leftOffset < 0) leftOffset = 0;
                if (!this.rtl) {
                    this.hScrollBar.jqxScrollBar('setPosition', leftOffset);
                }
                else {
                    this.hScrollBar.jqxScrollBar('setPosition', this.hScrollBar.jqxScrollBar('max') - leftOffset);
                }
            }

            if (item_right >= view_right) {
                if (!this.rtl) {
                    this.hScrollBar.jqxScrollBar('setPosition', 2 + tableLeft + item_right - tablewidth);
                }
                else {
                    this.hScrollBar.jqxScrollBar('setPosition', this.hScrollBar.jqxScrollBar('max') - (2 + tableLeft + item_right - tablewidth));
                }
            }
            
            var row = item.parent().index();
            if (this.tableRows > 0) row--;
            if (Math.round(item.position().top) === 0 || row === 0) {
                return this.vScrollBar.jqxScrollBar('setPosition', 0);
            }
            else {
                var lastindex = this.table[0].rows.length - 1;
                var lastRow = this.table[0].rows[lastindex];
                if (lastRow[0] === item.parent()[0]) {
                    return this.vScrollBar.jqxScrollBar('setPosition', this.vScrollBar.jqxScrollBar('max'));
                }
            }

            if (item_top <= view_top) {
                var topOffset = item_top;
                if (topOffset < 0) topOffset = 0;
                return this.vScrollBar.jqxScrollBar('setPosition', topOffset);
            }

            if (item_bottom >= view_bottom) {
                return this.vScrollBar.jqxScrollBar('setPosition', 4 + item_bottom - tableheight + allDayRowHeight);
            }
        },

        getColumn: function (datafield) {
            var column = null;
            if (this.columns.records) {
                $.each(this.columns.records, function () {
                    if (this.datafield == datafield || this.displayfield == datafield) {
                        column = this;
                        return false;
                    }
                });
            }
            return column;
        },

        _setcolumnproperty: function (datafield, propertyname, value) {
            if (datafield == null || propertyname == null || value == null)
                return null;

            propertyname = propertyname.toLowerCase();
            var column = this.getColumn(datafield);
            if (column == null)
                return;

            var oldvalue = column[propertyname];
            column[propertyname] = value;

            var _cachedcolumn = this.getColumn(datafield);
            if (_cachedcolumn != null) {
                _cachedcolumn[propertyname] = value;
            }

            switch (propertyname) {
                case "text":
                case "hidden":
                case "hideable":
                case "renderer":
                case "align":
                case "cellsalign":
                case "contenttype":
                case "cellclass":
                case "cellclassname":
                case "class":
                case "width":
                case "minwidth":
                case "maxwidth":
                    if (propertyname == "align") {
                        this._rendercolumnheaders();
                        this.refresh();
                    }
                    else if (propertyname == "text" || propertyname == "class" || propertyname == "hidden" || propertyname == "pinned" || propertyname == "resizable" || propertyname == "renderer") {
                        this._rendercolumnheaders();
                        this.refresh();
                    }
                    else if (propertyname == "width" || propertyname == "maxwidth" || propertyname == "minwidth") {
                        column['_width'] = null;
                        column['_percentagewidth'] = null;

                        this._updatecolumnwidths();
                        this.refresh();
                    }
                    else {
                        this.refresh();
                    }
                    break;
            }
        },

        getColumnProperty: function (datafield, propertyname) {
            if (datafield == null || propertyname == null)
                return null;

            propertyname = propertyname.toLowerCase();

            var column = this.getColumn(datafield);
            return column[propertyname];
        },

        // sets a property of a column.
        setColumnProperty: function (datafield, propertyname, value) {
            this._setcolumnproperty(datafield, propertyname, value);
        },

        // hides a column.
        hideColumn: function (datafield) {
            this._setcolumnproperty(datafield, 'hidden', true);
        },

        // shows a column.
        showColumn: function (datafield) {
            this._setcolumnproperty(datafield, 'hidden', false);
        },

        updateBoundData: function (reason, done) {
            this.databind(this.source, reason, done);
        },

        refresh: function (initialRefresh) {
            if (initialRefresh != true) {
                var that = this;
                if ($.jqx.isHidden(that.host))
                    return;

                that.table[0].style.top = "0px";
                that.vScrollInstance.setPosition(0);

                that._renderrows();
                that._arrange();
                that._renderhorizontalscroll();
                that._updateTouchScrolling();
                that._refreshToolBar();
                that._updateFocusedCell();
            }
        },

        _updateFocusedCell: function () {
            var that = this;

            if (that.focusedCell) {
                that._updateCellsSelection();
                return;
            }

            var view = that._views[that._view].type;
            var viewObject = that._views[that._view];
            var showAllDayRow = that.showAllDayRow;
            if (viewObject.timeRuler && (view === "dayView" || view === "weekView")) {
                if (viewObject.timeRuler.showAllDayRow != undefined) {
                    showAllDayRow = viewObject.timeRuler.showAllDayRow;
                }
            }
            if (!showAllDayRow || (view != "dayView" && view != "weekView")) {
                that.focusedCell = that.rows[0].cells[0];
                if (that.rtl) {
                    that.focusedCell = that.rows[0].cells[that.rows[0].cells.length - 1];
                }
            }
            else {
                that.focusedCell = that.rows[1].cells[0];
                if (that.rtl) {
                    that.focusedCell = that.rows[1].cells[that.rows[1].cells.length - 1];
                }
            }
            if (that.focusedCell.className.indexOf('jqx-scheduler-disabled-cell') >= 0) {
                that.focusedCell = null;
                for (var i = 0; i < this.rows.length; i++) {
                    for (var j = 0; j < this.rows[i].cells.length; j++) {
                        var cell = this.rows[i].cells[j];
                        if (cell.className.indexOf('jqx-scheduler-disabled-cell') == -1) {
                            that.focusedCell = cell;
                            break;
                        }
                    }
                    if (that.focusedCell)
                        break;
                }
            }

            that._lastSelectedCell = that.focusedCell;
            that._updateCellsSelection();
        },

        _updateTouchScrolling: function () {
            var that = this.that;
            if (that.isTouchDevice()) {
                var touchstart = $.jqx.mobile.getTouchEventName('touchstart');
                var touchend = $.jqx.mobile.getTouchEventName('touchend');
                var touchmove = $.jqx.mobile.getTouchEventName('touchmove');
                if (that.schedulercontent) {
                    that.removeHandler(that.table, touchstart + '.touchScroll');
                    that.removeHandler(that.table, touchmove + '.touchScroll');
                    that.removeHandler(that.table, touchend + '.touchScroll');
                    that.removeHandler(that.table, 'touchcancel.touchScroll');
                    $.jqx.mobile.touchScroll(that._table[0], Math.max(that.vScrollInstance.max, that.hScrollInstance.max), function (left, top) {
                        if (that.dragOrResize)
                        {
                            return;
                        }
                        if (top != null && that.vScrollBar.css('visibility') != 'hidden')
                        {
                            var oldValue = that.vScrollInstance.value;
                            that.vScrollInstance.setPosition(top);
                        }
                        if (left != null && that.hScrollBar.css('visibility') != 'hidden') {
                            var oldValue = that.hScrollInstance.value;
                            that.hScrollInstance.setPosition(left);
                        }
                        that.scrolled = new Date();
                    }, this.element.id, this.hScrollBar, this.vScrollBar);
                }
            }
        },

        scrollWidth: function()
        {
            return this.hScrollInstance.max;
        },

        scrollHeight: function () {
            return this.vScrollInstance.max;
        },

        scrollLeft: function(left)
        {
            if (this.hScrollBar[0].style.visibility != "hidden") {
                this.hScrollInstance.setPosition(left);
            }
        },

        scrollTop: function (top) {
            if (this.vScrollBar[0].style.visibility != "hidden") {
                this.vScrollInstance.setPosition(top);
            }
        },

        render: function (init) {
            var gridStructure = "<div style='overflow: hidden; -webkit-appearance: none; outline: none; width:100%; height: 100%; align:left; border: 0px; padding: 0px; margin: 0px; left: 0px; top: 0px; valign:top; position: relative;'>" +
                       "<div id='wrapper" + this.element.id + "' style='overflow: hidden; -webkit-appearance: none; border: none; background: transparent; outline: none; width:100%; height: 100%; padding: 0px; margin: 0px; align:left; left: 0px; top: 0px; valign:top; position: relative;'>" +
                       "<div id='toolbar' style='visibility: hidden; align:left; valign:top; left: 0px; top: 0px; position: absolute;'></div>" +
                       "<div id='legendbartop' style='align:left; valign:top; left: 0px; top: 0px; position: absolute;'></div>" +
                       "<div id='filter' style='visibility: hidden; align:left; valign:top; left: 0px; top: 0px; position: absolute;'></div>" +
                       "<div id='content" + this.element.id + "' style='overflow: hidden; -webkit-appearance: none; border: none; background: transparent; outline: none; border: none; padding: 0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; align:left; valign:top; left: 0px; top: 0px; position: absolute;'></div>" +
                       "<div id='verticalScrollBar" + this.element.id + "' style='align:left; valign:top; left: 0px; top: 0px; position: absolute;'></div>" +
                       "<div id='horizontalScrollBar" + this.element.id + "' style='align:left; valign:top; left: 0px; top: 0px; position: absolute;'></div>" +
                       "<div id='bottomRight' style='align:left; valign:top; left: 0px; top: 0px; border: none; position: absolute;'></div>" +
                       "<div id='aggregates' style='align:left; valign:top; left: 0px; top: 0px; position: absolute;'></div>" +
                       "<div id='legendbarbottom' style='align:left; valign:top; left: 0px; top: 0px; position: absolute;'></div>" +
                       "<div id='pager' style='z-index: 20; align:left; valign:top; left: 0px; top: 0px; position: absolute;'></div>" +
                       "</div>" +
                       "</div>";

            this.element.innerHTML = gridStructure;
            this.wrapper = this.host.find("#wrapper" + this.element.id);
            this.content = this.host.find("#content" + this.element.id);
            this.content.addClass(this.toTP('jqx-reset'));

            var verticalScrollBar = this.host.find("#verticalScrollBar" + this.element.id);
            var horizontalScrollBar = this.host.find("#horizontalScrollBar" + this.element.id);
            this.bottomRight = this.host.find("#bottomRight").addClass(this.toTP('jqx-grid-bottomright')).addClass(this.toTP('jqx-scrollbar-state-normal'));
            if (this.vScrollBar) {
                this.vScrollBar.jqxScrollBar('destroy');
            }
            if (this.hScrollBar) {
                this.hScrollBar.jqxScrollBar('destroy');
            }

            this.vScrollBar = verticalScrollBar.jqxScrollBar({ 'vertical': true, rtl: this.rtl, touchMode: this.touchMode, theme: this.theme, _triggervaluechanged: false });
            this.hScrollBar = horizontalScrollBar.jqxScrollBar({ 'vertical': false, rtl: this.rtl, touchMode: this.touchMode, theme: this.theme, _triggervaluechanged: false });
            this.vScrollBar.css('visibility', 'hidden');
            this.hScrollBar.css('visibility', 'hidden');

            this.vScrollInstance = $.data(this.vScrollBar[0], 'jqxScrollBar').instance;
            this.hScrollInstance = $.data(this.hScrollBar[0], 'jqxScrollBar').instance;

            this.pager = this.host.find("#pager");
            this.pager[0].id = "pager" + this.element.id;
            this.toolbar = this.host.find("#toolbar");
            this.toolbar[0].id = "toolbar" + this.element.id;
            this.toolbar.addClass(this.toTP('jqx-scheduler-toolbar'));
            this.toolbar.addClass(this.toTP('jqx-widget-header'));

            this.legendbarbottom = this.host.find("#legendbarbottom");
            this.legendbarbottom[0].id = "legendbarbottom" + this.element.id;
            this.legendbarbottom.addClass(this.toTP('jqx-scheduler-legend-bar-bottom'));
            this.legendbarbottom.addClass(this.toTP('jqx-scheduler-legend-bar'));
            this.legendbarbottom.addClass(this.toTP('jqx-widget-header'));

            this.pager.addClass(this.toTP('jqx-grid-pager'));
            this.pager.addClass(this.toTP('jqx-widget-header'));

            this.legendbartop = this.host.find("#legendbartop");
            this.legendbartop.addClass(this.toTP('jqx-scheduler-legend-bar-top'));
            this.legendbartop.addClass(this.toTP('jqx-scheduler-legend-bar'));
            this.legendbartop.addClass(this.toTP('jqx-widget-header'));
            this.schedulertable = null;

            if (this.localizestrings) {
                this.localizestrings();
                if (this.localization != null) {
                    this.localizestrings(this.localization, false);
                }
            }

            this._builddataloadelement();
            this._cachedcolumns = this.columns;
            var datafields = this.source.datafields;
            if (datafields == null && this.source._source) {
                datafields = this.source._source.datafields;
            }

            if (datafields) {
                for (var m = 0; m < this.columns.length; m++) {
                    var column = this.columns[m];
                    if (column && column.cellsFormat && column.cellsFormat.length > 2) {
                        for (var t = 0; t < datafields.length; t++) {
                            if (datafields[t].name == column.datafield && !datafields[t].format) {
                                datafields[t].format = column.cellsFormat;
                                break;
                            }
                        }
                    }
                }
            }

            this.databind(this.source);

            if (this.showToolbar) {
                this.toolbar.css('visibility', 'inherit');
            }
            if (this.showLegend) {
                this.legendbarbottom.css('visibility', 'inherit');
            }

            this.tableheight = null;
            var that = this;
            var clearoffset = function () {
                if (that.content) {
                    that.content[0].scrollTop = 0;
                    that.content[0].scrollLeft = 0;
                }
                if (that.schedulercontent) {
                    that.schedulercontent[0].scrollLeft = 0;
                    that.schedulercontent[0].scrollTop = 0;
                }
            }

            this.removeHandler(this.content, 'scroll');
            this.removeHandler(this.content, 'mousedown');

            this.addHandler(this.content, 'scroll',
            function (event) {
                clearoffset();
                return false;
            });

            if (init !== true) {
                this._render();
            }
        },

        _render: function () {
            var that = this;
            if (that.dataview == null)
                return;

            if (that._loading) {
                return;
            }

            if (that.columnsHeight != 25 || that.columnGroups) {
                that._measureElement('column');
            }

            that.rowinfo = new Array();
            that._removeHandlers();

            if (that.columns == null) {
                that.columns = new $.jqx.schedulerDataCollection(that.element);
            }
            else {
                that._initializeColumns();
            }

            that.host.height(that.height);
            that.host.width(that.width);

            $.jqx.utilities.html(that.content, '');
            that.columnsheader = that.columnsheader || $('<div style="overflow: hidden;"></div>');
            that.columnsheader.remove();
            that.columnsheader.addClass(that.toTP('jqx-widget-header'));
            that.columnsheader.addClass(that.toTP('jqx-grid-header'));

            if (!that.showHeader) {
                that.columnsheader.css('display', 'none');
            }
            else {
                if (that.columnsheader) {
                    that.columnsheader.css('display', 'block');
                }
            }

            that.schedulercontent = that.schedulercontent || $('<div style="width: 100%; overflow: hidden; position: absolute;"></div>');
            that.schedulercontent.remove();

            var columnsHeight = that.columnsHeight;
            columnsHeight = that._preparecolumnGroups();
            that.columnsheader.height(columnsHeight);

            that.content.append(that.columnsheader);
            that.content.append(that.schedulercontent);
            that._rendercolumnheaders();

            that.tableheight = null;

            that.schedulercontent.find('#contenttable' + that.element.id).remove();
            if (that.table != null) {
                that.table.remove();
                that.table = null;
            }
            if (that.pinnedtable != null) {
                that.pinnedtable.remove();
                that.pinnedtable = null;
            }
            that.table = $('<div id="contenttable' + that.element.id + '" style="overflow: hidden; position: relative;"></div>');
            that.pinnedtable = $('<div id="contenttable2' + that.element.id + '" style="display: none; overflow: hidden; position: relative;"></div>');
            that.schedulercontent.addClass(that.toTP('jqx-grid-content'));
            that.schedulercontent.addClass(that.toTP('jqx-widget-content'));
            that.schedulercontent.append(that.table);
            if (that.tableRows == 1) {
                that.schedulercontent.append(that.pinnedtable);
            }

            that._renderrows();
            that._arrange();
            that._resourcesElements = new Array();

            var createLegend = function (bar, barPosition) {
                bar.children().remove();
                var bar = $("<div style='margin:5px; position: relative;'></div>").appendTo(bar);
                that._resourcesElements[barPosition] = new Array();
                $.each(that._resources, function (index) {
                    var colors = that.getColors(index);
                    var label = this.toString();
                    var element = $("<div data-toggle='on' style='border-color: " + colors.border + "; background: " + colors.background + ";' class='" + that.toThemeProperty('jqx-scheduler-legend') + "'></div>");
                    element.appendTo(bar);
                    var labelElement = $("<div class='" + that.toThemeProperty('jqx-scheduler-legend-label') + "'>" + label + "</div>");
                    labelElement.appendTo(bar);
                    that._resourcesElements[barPosition][label] = element;
                    var toggle = function () {
                        if (element.attr('data-toggle') == 'on') {
                            that.hideAppointmentsByResource(label);
                        }
                        else {
                            that.showAppointmentsByResource(label);
                        }
                    }

                    that.addHandler(element, 'mousedown', function () {
                        toggle();
                        return false;
                    });
                    that.addHandler(labelElement, 'mousedown', function () {
                        toggle();
                        return false;
                    });
                });
            }
            createLegend(that.legendbarbottom, "bottom");
            createLegend(that.legendbartop, "top");
            if (that.legendPosition == "top") {
                that.legendbarbottom.hide();
            }
            else {
                that.legendbartop.hide();
            }
            if (that._resources.length == 0) {
                that.legendbarbottom.hide();
                that.legendbartop.hide();
            }

            if (that.renderToolBar) {
                that.renderToolBar(that.toolbar);
            }
            else {
                that._renderToolBar();
            }

            if (that.disabled) {
                that.host.addClass(that.toThemeProperty('jqx-fill-state-disabled'));
            }
            that._renderhorizontalscroll();

            that._addHandlers();

            that.clearSelection();
            var view = that._views[that._view].type;
            var viewObject = that._views[that._view];
            var showAllDayRow = that.showAllDayRow;
            if (viewObject.timeRuler && (view === "dayView" || view === "weekView")) {
                if (viewObject.timeRuler.showAllDayRow != undefined) {
                    showAllDayRow = viewObject.timeRuler.showAllDayRow;
                }
            }
            if (!showAllDayRow || (view != "dayView" && view != "weekView")) {
                that.focusedCell = that.rows[0].cells[0];
            }
            else {
                that.focusedCell = that.rows[1].cells[0];
            }
            that._lastSelectedCell = that.focusedCell;
            that._updateCellsSelection();
        },

        clear: function () {
            if (this.source) {
                this.source.records = new Array();
                this.source.hierarchy = new Array();
            }
            this.dataview._filteredData = new Array();
            this.databind(null);
            this._render();
        },

        getAppointmentElement: function(appElement)
        {
            var appointment = null;

            if (appElement.className.indexOf('jqx-scheduler-appointment') >= 0 && appElement.className.indexOf('jqx-scheduler-appointment-inner-content') == -1 && appElement.className.indexOf('jqx-scheduler-appointment-content') == -1 && appElement.className.indexOf('jqx-scheduler-appointment-resize-indicator') == -1)
            {
                appointment = appElement;
            }
            var element = appElement;
            for (var i = 0; i < 4; i++)
            {
                if (element.parentNode)
                {
                    if (element.className.indexOf('jqx-scheduler-appointment') >= 0 && element.className.indexOf('jqx-scheduler-appointment-innter-content') == -1 && element.className.indexOf('jqx-scheduler-appointment-content') == -1 && element.className.indexOf('jqx-scheduler-appointment-resize-indicator') == -1)
                    {
                        appointment = element;
                    }

                    element = element.parentNode;
                }
                else break;
            }
            return appointment;
        },

        getJQXAppointmentByElement: function (appointment) {
            var that = this;
            var key = appointment.getAttribute ? appointment.getAttribute('data-key') : appointment.attr('data-key');
            if (key.indexOf(".") >= 0) {
                var rootKey = key.substring(0, key.indexOf("."));
                var subKey = key.substring(key.indexOf(".") + 1);
                var appointmentObject = that.appointmentsByKey[rootKey];
                var jqxAppointment = appointmentObject.jqxAppointment.renderedAppointments[key];
            }
            else {
                var appointmentObject = that.appointmentsByKey[key];
                var jqxAppointment = appointmentObject.jqxAppointment;
            }

            return jqxAppointment;
        },

        _renderToolBar: function () {
            var that = this;
            var tablerow = $('<div style="width: 100%; height: 100%; position: relative;"></div>');
            var top = (this.toolbarHeight - 20) / 2;
            tablerow.css('top', top);
            that.toolbarLeftButton = $('<div type="button" style="outline: none; padding: 0px; margin-top: 3px; margin-left: 3px; margin-right: 3px; width: 27px; float: left;"></div>');
            that.toolbarRightButton = $('<div type="button" style="outline: none; padding: 0px; margin-top: 3px; margin-right: 3px; width: 27px; float: left;"></div>');
            that.toolbarLeftButton.attr('title', that.schedulerLocalization.toolBarPreviousButtonString);
            that.toolbarRightButton.attr('title', that.schedulerLocalization.toolBarNextButtonString);
            that.toolbarRightButton.jqxButton({
                enableHover: false,
                enableDefault: false,
                enablePressed: false,
                cursor: 'pointer', disabled: that.disabled, theme: that.theme
            });
            that.toolbarLeftButton.jqxButton({
                enableHover: false,
                enableDefault: false,
                enablePressed: false, cursor: 'pointer', disabled: that.disabled, theme: that.theme
            });
            that.dateTimeInput = $('<div style="outline: none; padding: 0px; margin-top: 0px; margin-right: 3px; width: 27px; float: left;"></div>');
            that.toolbarLeftButton.find('.jqx-icon-arrow-left').remove();
            that.toolbarRightButton.find('.jqx-icon-arrow-right').remove();

            var leftarrow = $("<div style='outline: none; margin-left: 6px; width: 15px; height: 15px;'></div>");
            leftarrow.addClass(that.toThemeProperty('jqx-icon-arrow-left'));
            that.toolbarLeftButton.wrapInner(leftarrow);

            var rightarrow = $("<div style='outline: none; margin-left: 6px; width: 15px; height: 15px;'></div>");
            rightarrow.addClass(that.toThemeProperty('jqx-icon-arrow-right'));
            that.toolbarRightButton.wrapInner(rightarrow);

            if (that.rtl) {
                that.toolbarLeftButton.css('float', 'right');
                that.toolbarRightButton.css('float', 'right');
                that.dateTimeInput.css('float', 'right');
            }

            that.addHandler(that.toolbarRightButton, 'mouseenter', function () {
                rightarrow.addClass(that.toThemeProperty('jqx-icon-arrow-right-hover'));
            });

            that.addHandler(that.toolbarLeftButton, 'mouseenter', function () {
                leftarrow.addClass(that.toThemeProperty('jqx-icon-arrow-left-hover'));
            });

            that.addHandler(that.toolbarRightButton, 'mouseleave', function () {
                rightarrow.removeClass(that.toThemeProperty('jqx-icon-arrow-right-hover'));
            });

            that.addHandler(that.toolbarLeftButton, 'mouseleave', function () {
                leftarrow.removeClass(that.toThemeProperty('jqx-icon-arrow-left-hover'));
            });

            that.addHandler(that.toolbarRightButton, 'mousedown', function () {
                rightarrow.addClass(that.toThemeProperty('jqx-icon-arrow-right-selected'));
            });

            that.addHandler(that.toolbarRightButton, 'mouseup', function () {
                rightarrow.removeClass(that.toThemeProperty('jqx-icon-arrow-right-selected'));
            });

            that.addHandler(that.toolbarLeftButton, 'mousedown', function () {
                leftarrow.addClass(that.toThemeProperty('jqx-icon-arrow-left-selected'));
            });

            that.addHandler(that.toolbarLeftButton, 'mouseup', function () {
                leftarrow.removeClass(that.toThemeProperty('jqx-icon-arrow-left-selected'));
            });

            that.addHandler($(document), 'mouseup.pagerbuttons' + that.element.id, function () {
                rightarrow.removeClass(that.toThemeProperty('jqx-icon-arrow-right-selected'));
                leftarrow.removeClass(that.toThemeProperty('jqx-icon-arrow-left-selected'));
            });

            that.addHandler(that.toolbarRightButton, 'click', function () {
                if (!that.toolbarRightButton.jqxButton('disabled')) {
                    if (!that.rtl) {
                        that.navigateForward();
                    }
                    else {
                        that.navigateBackward();
                    }
                    that.focus();
                }
            });
            that.addHandler(that.toolbarLeftButton, 'click', function () {
                if (!that.toolbarLeftButton.jqxButton('disabled')) {
                    if (!that.rtl) {
                        that.navigateBackward();
                    }
                    else {
                        that.navigateForward();
                    }
                    that.focus();
                }
            });

            that.toolbar.children().remove();
            that.toolbar.append(tablerow);

            if (!that.rtl) {
                tablerow.append(that.toolbarLeftButton);
                tablerow.append(that.dateTimeInput);
                tablerow.append(that.toolbarRightButton);
            }
            else {
                tablerow.append(that.toolbarRightButton);
                tablerow.append(that.dateTimeInput);
                tablerow.append(that.toolbarLeftButton);
            }

            that.toolbarDetails = $('<div class="' + that.toTP("jqx-scheduler-toolbar-details") + '" style="margin-left: 7px; margin-top:2px; float: left;"></div>');
            that.toolbarViews = $('<div style="margin-right: 10px; margin-top:0px; float: right;"></div>');
            if (that.rtl) {
                that.toolbarDetails.css('float', 'right');
                that.toolbarDetails.css('margin-left', '0px');
                that.toolbarDetails.css('margin-right', '7px');
                that.toolbarViews.css('margin-left', '10px');
                that.toolbarViews.css('margin-right', '0px');

                that.toolbarViews.css('float', 'left');
            }

            var tabKeyElements = new Array();
            if (!that.rtl) {
                tabKeyElements.push(that.toolbarLeftButton);
                tabKeyElements.push(that.dateTimeInput);
                tabKeyElements.push(that.toolbarRightButton);
            }
            else {
                tabKeyElements.push(that.toolbarRightButton);
                tabKeyElements.push(that.dateTimeInput);
                tabKeyElements.push(that.toolbarLeftButton);
            }

            var viewLength = that._views.length - 1;
            $.each(that._views, function (i) {
                var text = "";
                var index = i;
                if (that.rtl) index = viewLength - i;
                if (that._views[index].text != undefined)
                    text = that._views[index].text;
                  
                else {
                    switch (that._views[index].type) {
                        case "dayView":
                            text = that.schedulerLocalization.dayViewString;
                            break;
                        case "weekView":
                            text = that.schedulerLocalization.weekViewString;
                            break;
                        case "monthView":
                            text = that.schedulerLocalization.monthViewString;
                            break;
                        case "agendaView":
                            text = that.schedulerLocalization.agendaViewString;
                            break;
                        case "timelineDayView":
                            text = that.schedulerLocalization.timelineDayViewString;
                            break;
                        case "timelineWeekView":
                            text = that.schedulerLocalization.timelineWeekViewString;
                            break;
                        case "timelineMonthView":
                            text = that.schedulerLocalization.timelineMonthViewString;
                            break;
                    }
                }
                var element = '<span data-type="' + that._views[index].type + '" style="cursor: pointer; outline: none; margin-left: -1px; position: relative;">' + text + '</span>';
                var $element = $(element);
                $element.addClass(that.toTP('jqx-group-button-normal jqx-button jqx-fill-state-normal'));
                tabKeyElements.push($element);
                if (index == 0) {
                    if (!that.rtl) {
                        $element.addClass(that.toTP('jqx-rc-l'));
                    }
                    else {
                        $element.addClass(that.toTP('jqx-rc-r'));
                    }
                }
                if (index == that._views.length - 1) {
                    if (!that.rtl) {
                        $element.addClass(that.toTP('jqx-rc-r'));
                    }
                    else {
                        $element.addClass(that.toTP('jqx-rc-l'));
                    }
                }
                if (index === that._view) {
                    $element.addClass(that.toTP('jqx-fill-state-pressed'));
                }
                $element.mouseenter(function () {
                    $element.addClass(that.toTP('jqx-fill-state-hover'));
                });
                $element.mouseleave(function () {
                    $element.removeClass(that.toTP('jqx-fill-state-hover'));
                });
                $element.mousedown(function () {
                    that._setView(index);
                    that.focus();
                });
                $(that.toolbarViews).append($element);
            });

            tablerow.append(that.toolbarDetails);
            tablerow.append(that.toolbarViews);
            if (that._views.length < 2) {
                that.toolbarViews.hide();
            }

            that.dateTimeInput.jqxDateTimeInput({dropDownWidth: 220, dropDownHeight: 220, rtl: that.rtl, localization: that._getDateTimeInputLocalization(), firstDayOfWeek: that.schedulerLocalization.firstDay, todayString: that.schedulerLocalization.todayString, clearString: that.schedulerLocalization.clearString, showFooter: true, height: 19, width: 18, renderMode: "simple" });
        
            that.addHandler(that.dateTimeInput, "change", function (event) {
                if (!that.fromNavigate) {
                    that.navigateTo(new $.jqx.date(event.args.date, that.timeZone));
                    that.focus();
                }
            });
            that.tabKeyElements = tabKeyElements;
            var viewType = that._views[that._view].type;

            var renderDetails = function (formatString) {
                var start = $.jqx.formatDate(that.getViewStart().toDate(), formatString, that.schedulerLocalization);
                var end = $.jqx.formatDate(that.getViewEnd().toDate(), formatString, that.schedulerLocalization);
                if (viewType === "dayView" || viewType === "timelineDayView") {
                    that.toolbarDetails.html(start);
                }
                else {
                    that.toolbarDetails.html(start + " - " + end);
                }
                if (that.rtl) {
                    that.toolbarDetails.addClass('jqx-rtl');
                    that.toolbarDetails.html("<span style='direction:rtl;'>" + end + "<span> - <span style='direction:rtl;'>" + start + "</span>");
                }
                else {
                    that.toolbarDetails[0].style.direction = "ltr";
                }
            }

            renderDetails(that.toolBarRangeFormat);
            var width = that.toolbarViews.width() + that.toolbarDetails.width() + 120;
            var formatString = that.toolBarRangeFormat;
            if (width > that.host.width()) {
                formatString = that.toolBarRangeFormatAbbr;
                renderDetails(formatString);
                var width = that.toolbarViews.width() + that.toolbarDetails.width() + 120;
                if (width > that.host.width()) {
                    that.toolbarDetails.hide();
                    var width = that.toolbarViews.width() + 120;
                    if (width > that.host.width()) {
                        that.toolbarViews.hide();
                    }
                }
            }
            else that.currentToolbarFormat = that.toolBarRangeFormat;
        },

        _setView: function (index) {
            var that = this;
            that.toolbarViews.find('.jqx-fill-state-pressed').removeClass(that.toTP('jqx-fill-state-pressed'));
            if (!that.rtl) {
                $(that.toolbarViews.children()[index]).addClass(that.toTP('jqx-fill-state-pressed'));
            }
            else {
                $(that.toolbarViews.children()[that._views.length - 1 - index]).addClass(that.toTP('jqx-fill-state-pressed'));
                
            }
            if (that._view === index)
                return;

            var vScrollBarVisibility = that.vScrollBar[0].style.visibility;
            if (vScrollBarVisibility) {
                if (!that._scrollPosition) {
                    that._scrollPosition = new Array();
                }
                that._scrollPosition[that._view] = that.vScrollInstance.value;
            }

            var hScrollBarVisibility = that.hScrollBar[0].style.visibility;
            if (hScrollBarVisibility) {
                if (!that._hscrollPosition) {
                    that._hscrollPosition = new Array();
                }
                that._hscrollPosition[that._view] = that.hScrollInstance.value;
            }

            var oldViewType = that._views[that._view].type;
            var newViewType = that._views[index].type;

            that._view = index;
            that._refreshColumns();
            that.refresh();
            var hScrollBarVisibilityAfterRefresh = that.hScrollBar[0].style.visibility;
            if (hScrollBarVisibility !== hScrollBarVisibilityAfterRefresh) {
                that._renderrows();
            }

            if (that._scrollPosition[that._view]) {
                that.vScrollInstance.setPosition(that._scrollPosition[that._view]);
            }

            if (that._hscrollPosition[that._view]) {
                that.hScrollInstance.setPosition(that._hscrollPosition[that._view]);
            }

            if (that.selectedJQXAppointment) {
                that._ensureAppointmentVisible(that.selectedJQXAppointment);
            }

            var viewStart = that.getViewStart();
            var viewEnd = $.jqx.scheduler.utilities.getEndOfDay(that.getViewEnd());

            that._raiseEvent('viewChange', { date: that.date, from: viewStart, to: viewEnd, oldViewType: oldViewType, newViewType: newViewType });
        },

        _getDateTimeInputLocalization: function()
        {
            var that = this;
            var localization = {};
            localization.backString = that.schedulerLocalization.backString;
            localization.forwardString = that.schedulerLocalization.forwardString;
            localization.todayString = that.schedulerLocalization.todayString;
            localization.clearString = that.schedulerLocalization.clearString;
            localization.calendar = that.schedulerLocalization;
            return localization;
        },

        setView: function (view) {
            switch (view) {
                case "dayView":
                    this._setView(0);
                    break;
                case "weekView":
                    this._setView(1);
                    break;
                case "monthView":
                    this._setView(2);
                    break;
                case "timelineDayView":
                    this._setView(3);
                    break;
                case "timelineWeekView":
                    this._setView(4);
                    break;
                case "timelineMonthView":
                    this._setView(5);
                    break;
            }
            this.view = view;
        },

        navigateForward: function () {
            var that = this;
            var view = this._views[this._view].type;
            var viewObject = this._views[this._view];
            var date = new $.jqx.date(this.date, that.timeZone);
            var avoidWeekend = function () {
                while ((date.dayOfWeek() == 0 || date.dayOfWeek() == 6) && false === viewObject.showWeekends) {
                    date = date.addDays(1);
                }
                return date;
            }
            switch (view) {
                case "dayView":
                case "timelineDayView":
                    date = date.addDays(1);
                    date = avoidWeekend();
                    break;
                case "weekView":
                case "timelineWeekView":
                    date = date.addDays(7);
                    break;
                case "monthView":
                case "timelineMonthView":
                    var day = date.day();
                    var month = date.month();
                    var year = date.year();
                    var firstDateInMonth = new $.jqx.date(year, month, 1);
                    firstDateInMonth.timeZone = that.timeZone;
                    date = firstDateInMonth.addMonths(1);
                    break;
                case "agendaView":
                    if (viewObject.days) {
                        date = date.addDays(viewObject.days);
                    }
                    else {
                        date = date.addDays(7);
                    }
                    break;
            }

            return this.navigateTo(date);
        },

        navigateBackward: function () {
            var that = this;
            var view = this._views[this._view].type;
            var viewObject = this._views[this._view];
            var date = new $.jqx.date(this.date, that.timeZone);
            var avoidWeekend = function () {
                while ((date.dayOfWeek() == 0 || date.dayOfWeek() == 6) && false === viewObject.showWeekends) {
                    date = date.addDays(-1);
                }
                return date;
            }
            switch (view) {
                case "dayView":
                case "timelineDayView":
                    date = date.addDays(-1);
                    date = avoidWeekend();
                    break;
                case "weekView":
                case "timelineWeekView":
                    date = date.addDays(-7);
                    break;
                case "monthView":
                case "timelineMonthView":
                    var day = date.day();
                    var month = date.month();
                    var year = date.year();
                    var firstDateInMonth = new $.jqx.date(year, month, 1);
                    firstDateInMonth.timeZone = that.timeZone;
                    date = firstDateInMonth.addMonths(-1);
                    break;
                case "agendaView":
                    if (viewObject.days) {
                        date = date.addDays(-viewObject.days);
                    }
                    else {
                        date = date.addDays(-7);
                    }
                    break;
            }

            return this.navigateTo(date);
        },

        _refreshToolBar: function (navigate) {
            var that = this;
            var viewStart = that.getViewStart();
            var viewEnd = that.getViewEnd();
       
            var renderDetails = function (formatString) {
                var start = $.jqx.formatDate(viewStart.toDate(), formatString, that.schedulerLocalization);
                var end = $.jqx.formatDate(viewEnd.toDate(), formatString, that.schedulerLocalization);
                var viewType = that._views[that._view].type;
                var viewObject = that._views[that._view];
                if (viewObject.showWeekends === false) {
                    if (viewStart.dayOfWeek() == 0 || viewStart.dayOfWeek() == 6) {
                        viewStart = viewStart.addDays(1);
                    }
                    if (viewStart.dayOfWeek() == 0 || viewStart.dayOfWeek() == 6) {
                        viewStart = viewStart.addDays(1);
                    }
                    if (viewEnd.dayOfWeek() == 0 || viewEnd.dayOfWeek() == 6) {
                        viewEnd = viewEnd.addDays(-1);
                    }
                    if (viewEnd.dayOfWeek() == 0 || viewEnd.dayOfWeek() == 6) {
                        viewEnd = viewEnd.addDays(-1);
                    }
                    var start = $.jqx.formatDate(viewStart.toDate(), formatString, that.schedulerLocalization);
                    var end = $.jqx.formatDate(viewEnd.toDate(), formatString, that.schedulerLocalization);
                }
                if (viewType === "dayView" || viewType === "timelineDayView") {
                    that.toolbarDetails.html(start);
                }
                else {
                    that.toolbarDetails.html(start + " - " + end);
                }
                if (that.rtl) {
                    that.toolbarDetails.addClass('jqx-rtl');
                    that.toolbarDetails.html("<span style='direction:rtl;'>" + end + "<span> - <span style='direction:rtl;'>" + start + "</span>");
                }
                else {
                    that.toolbarDetails[0].style.direction = "ltr";
                }
            }

            if (navigate) {
                renderDetails(that._lastFormatString || that.toolBarRangeFormat);

                return;
            }

            renderDetails(that.toolBarRangeFormat);
            that.toolbarDetails.show();
            that.toolbarViews.show();
            var twidth = that.toolbarViews.width() + that.toolbarDetails.width() + 120;
            if (twidth > that.host.width()) {
                renderDetails(that.toolBarRangeFormatAbbr);
                var twidth = that.toolbarViews.width() + that.toolbarDetails.width() + 120;
                if (twidth > that.host.width()) {
                    that.toolbarDetails.hide();
                    var twidth = that.toolbarViews.width() + 120;
                    if (twidth > that.host.width()) {
                        that.toolbarViews.hide();
                    }
                }
            }
        },

        navigateTo: function (date) {
            var that = this;
            if ($.type(date) == "date") {
                date = new $.jqx.date(date);
            }

            if (date < this.min)
                return;
            if (date > this.max)
                return;


            date.timeZone = that.timeZone;
            that.date = date;
            that._refreshToolBar(true);
            that.fromNavigate = true;
            that.dateTimeInput.val(date.toDate());
            that.fromNavigate = false;
            that._refreshColumnTitles();
            that._renderrows();
            that._updateFocusedCell();

            var viewStart = that.getViewStart();
            var viewEnd = $.jqx.scheduler.utilities.getEndOfDay(that.getViewEnd());

            that._raiseEvent('dateChange', {date: date, from: viewStart, to: viewEnd  });
        },

        _preparecolumnGroups: function () {
            var columnsHeight = this.columnsHeight;
            if (this.columnGroups) {
                this.columnshierarchy = new Array();
                if (this.columnGroups.length) {
                    var that = this;
                    for (var i = 0; i < this.columnGroups.length; i++) {
                        this.columnGroups[i].parent = null;
                        this.columnGroups[i].groups = null;
                    }
                    for (var i = 0; i < this.columns.records.length; i++) {
                        this.columns.records[i].parent = null;
                        this.columns.records[i].groups = null;
                    }

                    var getParentGroup = function (name) {
                        for (var i = 0; i < that.columnGroups.length; i++) {
                            var group = that.columnGroups[i];
                            if (group.name === name)
                                return group;
                        }
                        return null;
                    }

                    for (var i = 0; i < this.columnGroups.length; i++) {
                        var group = this.columnGroups[i];
                        if (!group.groups) {
                            group.groups = null;
                        }
                        if (group.parentGroup) group.parentgroup = group.parentGroup;

                        if (group.parentgroup) {
                            var parentgroup = getParentGroup(group.parentgroup);
                            if (parentgroup) {
                                group.parent = parentgroup;
                                if (!parentgroup.groups) {
                                    parentgroup.groups = new Array();
                                }
                                if (parentgroup.groups.indexOf(group) === -1) {
                                    parentgroup.groups.push(group);
                                }
                            }
                        }
                    }
                    for (var i = 0; i < this.columns.records.length; i++) {
                        var group = this.columns.records[i];
                        if (group.columngroup) {
                            var parentgroup = getParentGroup(group.columngroup);
                            if (parentgroup) {
                                if (!parentgroup.groups) {
                                    parentgroup.groups = new Array();
                                }
                                group.parent = parentgroup;
                                if (parentgroup.groups.indexOf(group) === -1) {
                                    parentgroup.groups.push(group);
                                }
                            }
                        }
                    }
                    var totalmaxlevel = 0;
                    for (var i = 0; i < this.columns.records.length; i++) {
                        var group = this.columns.records[i];
                        var initialgroup = group;
                        group.level = 0;
                        while (initialgroup.parent) {
                            initialgroup = initialgroup.parent;
                            group.level++;
                        }
                        var initialgroup = group;
                        var maxlevel = group.level;
                        totalmaxlevel = Math.max(totalmaxlevel, group.level);
                        while (initialgroup.parent) {
                            initialgroup = initialgroup.parent;
                            if (initialgroup) {
                                initialgroup.level = --maxlevel;
                            }
                        }
                    }

                    var getcolumns = function (group) {
                        var columns = new Array();
                        if (group.columngroup) {
                            columns.push(group);
                        }
                        if (!group.groups) {
                            return new Array();
                        }
                        for (var i = 0; i < group.groups.length; i++) {
                            if (group.groups[i].columngroup) {
                                columns.push(group.groups[i]);
                            }
                            else {
                                if (group.groups[i].groups) {
                                    var tmpcolumns = getcolumns(group.groups[i]);
                                    for (var j = 0; j < tmpcolumns.length; j++) {
                                        columns.push(tmpcolumns[j]);
                                    }
                                }
                            }
                        }
                        return columns;
                    }

                    for (var i = 0; i < this.columnGroups.length; i++) {
                        var group = this.columnGroups[i];
                        var columns = getcolumns(group);
                        group.columns = columns;
                        var indexes = new Array();
                        var pinned = 0;
                        for (var j = 0; j < columns.length; j++) {
                            indexes.push(this.columns.records.indexOf(columns[j]));
                            if (columns[j].pinned) {
                                pinned++;
                            }
                        }
                        if (pinned != 0) {
                            throw new Error("jqxScheduler: Column Groups initialization Error. Please, check the initialization of the jqxScheduler's columns array. The columns in a column group cannot be pinned.");
                        }

                        indexes.sort(function (value1, value2) {
                            value1 = parseInt(value1);
                            value2 = parseInt(value2);

                            if (value1 < value2) { return -1; }
                            if (value1 > value2) { return 1; }
                            return 0;
                        }
                        );
                        for (var index = 1; index < indexes.length; index++) {
                            if (indexes[index] != indexes[index - 1] + 1) {
                                throw new Error("jqxScheduler: Column Groups initialization Error. Please, check the initialization of the jqxScheduler's columns array. The columns in a column group are expected to be siblings in the columns array.");
                                this.host.remove();
                            }
                        }
                    }
                }
                this.columnGroupslevel = 1 + totalmaxlevel;
                columnsHeight = this.columnGroupslevel * this.columnsHeight;
            }
            return columnsHeight;
        },

        // performs mouse wheel.
        wheel: function (event, that) {
            if (that.editRecurrenceDialog && that.editRecurrenceDialog.jqxWindow('isOpen'))
                return true;

            if (that._editDialog && that._editDialog.jqxWindow('isOpen'))
                return true;

            if (that.autoheight && that.hScrollBar.css('visibility') == 'hidden') {
                event.returnValue = true;
                return true;
            }

            var delta = 0;
            if (!event) /* For IE. */
                event = window.event;

            if (event.originalEvent && event.originalEvent.wheelDelta) {
                event.wheelDelta = event.originalEvent.wheelDelta;
            }

            if (event.wheelDelta) { /* IE/Opera. */
                delta = event.wheelDelta / 120;
            } else if (event.detail) { /** Mozilla case. */
                delta = -event.detail / 3;
            }

            if (delta) {
                var result = that._handleDelta(delta);
                if (result) {
                    if (event.preventDefault)
                        event.preventDefault();

                    if (event.originalEvent != null) {
                        event.originalEvent.mouseHandled = true;
                    }

                    if (event.stopPropagation != undefined) {
                        event.stopPropagation();
                    }
                }

                if (result) {
                    result = false;
                    event.returnValue = result;
                    return result;
                }
                else {
                    return false;
                }
            }

            if (event.preventDefault)
                event.preventDefault();
            event.returnValue = false;
        },

        _handleDelta: function (delta) {
            if (this.vScrollBar.css('visibility') != 'hidden') {
                var oldvalue = this.vScrollInstance.value;
                if (delta < 0) {
                    this.vScrollInstance.setPosition(this.vScrollInstance.value + 2 * 10);
                }
                else {
                    this.vScrollInstance.setPosition(this.vScrollInstance.value - 2 * 10);
                }
                var newvalue = this.vScrollInstance.value;
                if (oldvalue != newvalue) {
                    return true;
                }
            }
            else if (this.hScrollBar.css('visibility') != 'hidden') {
                var oldvalue = this.hScrollInstance.value;
                if (delta > 0) {
                    if (this.hScrollInstance.value > 2 * 10) {
                        this.hScrollInstance.setPosition(this.hScrollInstance.value - 2 * 10);
                    }
                    else {
                        this.hScrollInstance.setPosition(0);
                    }
                }
                else {
                    if (this.hScrollInstance.value < this.hScrollInstance.max) {
                        this.hScrollInstance.setPosition(this.hScrollInstance.value + 2 * 10);
                    }
                    else this.hScrollInstance.setPosition(this.hScrollInstance.max);

                }
                var newvalue = this.hScrollInstance.value;
                if (oldvalue != newvalue) {
                    return true;
                }
            }

            return false;
        },


        _removeHandlers: function () {
            var that = this;
            if (that._mousewheelfunc) {
                that.removeHandler(this.host, 'mousewheel', that._mousewheelfunc);
            }
        
            that.removeHandler($(document), 'keydown.scheduler' + that.element.id);
            that.removeHandler(that.host, 'focus');
            that.removeHandler(that.host, 'blur');
            that.removeHandler(that.host, 'dragstart.' + that.element.id);
            that.removeHandler(that.host, 'selectstart.' + that.element.id);
            that.removeHandler($(window), 'jqxReady.' + that.element.id);
            that.removeHandler(that.host, 'mousewheel', that._mousewheelfunc);
       
            var eventname = 'mousedown';
            if (that.isTouchDevice()) {
                eventname = $.jqx.mobile.getTouchEventName('touchstart');
                if ($.jqx.browser.msie && $.jqx.browser.version < 10) {
                    eventname = 'mousedown';
                }
            }
            if (that.table) {
                that.removeHandler(that.table, 'mouseleave');
            }
            var mousemove = 'mousemove.scheduler' + that.element.id;
            var mouseup = "mouseup.scheduler" + that.element.id;
            if (that.isTouchDevice() && that.touchMode !== true) {
                mousemove = $.jqx.mobile.getTouchEventName('touchmove') + '.scheduler' + that.element.id;
                mouseup = $.jqx.mobile.getTouchEventName('touchend') + '.scheduler' + that.element.id;
            }

            that.removeHandler($(document), mousemove);
            that.removeHandler($(document), mouseup);

            if (!that.isTouchDevice()) {
                try {
                    if (document.referrer != "" || window.frameElement) {
                        if (window.top != null && window.top != window.self) {
                            var parentLocation = null;
                            if (window.parent && document.referrer) {
                                parentLocation = document.referrer;
                            }

                            if (parentLocation && parentLocation.indexOf(document.location.host) != -1) {
                                that.removeHandler($(window.top.document), 'mouseup.jqxscheduler' + that.element.id);
                            }
                        }
                    }
                }
                catch (error) {
                }
            }

            that.removeHandler(that.host, mousemove);
            that.removeHandler($(document), 'keydown.jqxscheduler' + that.element.id);
            that.removeHandler(that.host, 'keydown');
            if (that.table) {
                that.removeHandler(that.table, 'dblclick');
                that.removeHandler(that.pinnedtable, eventname);
                that.removeHandler(that.table, eventname);
            }
        },

        selectAppointment: function(key)
        {
            if (this.appointmentsByKey[key]) {
                this._selectAppointment(this.appointmentsByKey[key].jqxAppointment);
            }
        },

        _selectAppointment: function (appointment, htmlElement, selectionType) {
            if (!appointment)
                return;

            var that = this;
            if (that.selectedAppointment) {
                that.clearAppointmentsSelection();
            }

            var key = appointment.id;
            var appointmentElements = $('[data-key="' + key + '"]');

            if (appointmentElements.length > 0) {
                that.selectedJQXAppointment = appointment;
                if (!htmlElement) {
                    that.selectedAppointment = $(appointmentElements[0]);
                }
                else {
                    that.selectedAppointment = $(htmlElement);
                }


                var view = that._views[that._view].type;
                var viewObject = that._views[that._view];

                if (view == "agendaView")
                {
                    that.clearSelection();
                    return;
                }

                appointmentElements.addClass(that.toTP('jqx-scheduler-selected-appointment'));
                if (appointment.resizable)
                {
                    appointmentElements.find(".jqx-scheduler-appointment-resize-indicator").show();
                }

                switch (view)
                {
                    case "dayView":
                        $(appointmentElements).find(".jqx-scheduler-appointment-left-resize-indicator").hide();
                        $(appointmentElements).find(".jqx-scheduler-appointment-right-resize-indicator").hide();
                        break;
                    case "weekView":
                        break;
                    case "monthView":
                    case "timeLineMonthView":
                    case "timeLineDayView":
                    case "timeLineWeekView":
                        if (appointmentElements.length > 1) {
                            $.each(appointmentElements, function (index) {
                                if (!that.rtl) {
                                    if (index > 0) {
                                        $(this).find(".jqx-scheduler-appointment-left-resize-indicator").hide();
                                    }
                                    if (index < appointmentElements.length - 1) {
                                        $(this).find(".jqx-scheduler-appointment-right-resize-indicator").hide();
                                    }
                                }
                                else {
                                    if (index > 0) {
                                        $(this).find(".jqx-scheduler-appointment-right-resize-indicator").hide();
                                    }
                                    if (index < appointmentElements.length - 1) {
                                        $(this).find(".jqx-scheduler-appointment-left-resize-indicator").hide();
                                    }
                                }
                            });
                        }
                        break;
                }
                if (selectionType == "mouse") {
                    that.clearSelection();
                    return;
                }
            }
            that.clearSelection();
        },

        clearAppointmentsSelection: function () {
            var that = this;
            if (that.selectedAppointment) {
                var key = that.selectedAppointment.attr('data-key');
                var appointmentElements = $('[data-key="' + key + '"]');
                appointmentElements.removeClass(that.toTP('jqx-scheduler-selected-appointment'));
                appointmentElements.find(".jqx-scheduler-appointment-resize-indicator").hide();

                that.selectedAppointment = null;
                that.selectedJQXAppointment = null;
            }
        },

        selectCell: function (date, allDay, resourceID) {
            var that = this;
            var dateTime = date.toDate();
            for (var i = 0; i < that.rows.length; i++) {
                for (var j = 0; j < that.rows[i].cells.length; j++) {
                    var cell = that.rows[i].cells[j];
                    if (resourceID) {
                        if (cell.getAttribute("data-view") !== resourceID)
                            continue;
                    }

                    var dateString = cell.getAttribute("data-date");
                    var getDate = that._getDateByString;
                    var cellDate = getDate(dateString);

                    if (allDay && cell.getAttribute("data-end-date")) {
                        if (cellDate.valueOf() == date.valueOf()) {
                            cell.setAttribute('data-selected', 'true');
                            that.focusedCell = cell;
                            that._lastSelectedCell = cell;
                            that._updateCellsSelection();
                            that._ensureVisible(that.focusedCell);
                            return;
                        }
                    }
                    else if (!allDay && cell.getAttribute("data-end-date"))
                        continue;

                    if (cellDate.valueOf() == dateTime.valueOf()) {
                        cell.setAttribute('data-selected', 'true');
                        that.focusedCell = cell;
                        that._lastSelectedCell = cell;
                        that._updateCellsSelection();
                        that._ensureVisible(that.focusedCell);
                        return;
                    }
                }
            }
            that._updateCellsSelection();
        },

        selectRange: function (from, to, allDay, resourceID) {
            var that = this;
            if (from < this.min) from = this.min;
            if (to > this.max) to = this.max;
            var dateTime1 = from.toDate();
            var dateTime2 = to.toDate();
            var selected = false;
            for (var i = 0; i < that.rows.length; i++) {
                for (var j = 0; j < that.rows[i].cells.length; j++) {
                    var cell = that.rows[i].cells[j];
                    if (resourceID) {
                        if (cell.getAttribute("data-view") !== resourceID)
                            continue;
                    }

                    var dateString = cell.getAttribute("data-date");
                    var getDate = that._getDateByString;
                    var cellDate = getDate(dateString);

                    if (allDay && cell.getAttribute("data-end-date")) {
                        if (cellDate.valueOf() >= dateTime1.valueOf() && cellDate.valueOf() <= dateTime2.valueOf()) {
                            cell.setAttribute('data-selected', 'true');
                        }
                    }
                    else if (!allDay && cell.getAttribute("data-end-date"))
                        continue;

                    if (cellDate.valueOf() >= dateTime1.valueOf() && cellDate.valueOf() <= dateTime2.valueOf()) {
                        cell.setAttribute('data-selected', 'true');
                        if (!selected) {
                            that._lastSelectedCell = cell;
                            that.focusedCell = cell;
                            selected = true;
                        }
                    }
                }
            }
            that._updateCellsSelection();
        },

        _selectRange: function (dragcell, clickedcell) {
            var that = this;
            if (that._views[that._view].type == "agendaView")
                return;

            var td = dragcell;
            var clickedDataView = clickedcell.getAttribute("data-view");

            if (dragcell.getAttribute("data-view") !== clickedDataView)
                return;

            var dateString1 = clickedcell.getAttribute("data-date");
            var dateString2 = td.getAttribute("data-date");
            if (null == dateString1 || null == dateString2)
                return;

            var endDate = clickedcell.getAttribute("data-end-date");
            var dragEndDate = td.getAttribute("data-end-date");
            var allDayCells = endDate != null || dragEndDate != null;
            var fullDayCells = endDate != null && dragEndDate != null;

            var getDate = that._getDateByString;
            var date1 = getDate(dateString1);
            var date2 = getDate(dateString2);
            if (date1 < this.min.toDate()) date1 = this.min.toDate();
            if (date2 < this.min.toDate()) date2 = this.min.toDate();
            if (date1 > this.max.toDate()) date1 = this.max.toDate();
            if (date2 > this.max.toDate()) date2 = this.max.toDate();

            var min = Math.min(date1, date2);
            var max = Math.max(date1, date2);
            var rows = that.rows;
            var start = 0;
            var end = 0;
            if (start > 0 && that.rtl) {
                start = 0;
                end = 1;
            }
            var length = rows.length;
            if (allDayCells) {
                length = 1;
                if (dragcell.getAttribute("data-end-date") == null) {
                    date2.setHours(0, 0, 0, 0);
                    var allDayDate = new $.jqx.date(date2, that.timeZone).toString();
                    var dragCellRow = $(td).parent().index();
                    $.each(rows[0].cells, function () {
                        var date = this.getAttribute("data-date");
                        if (date === allDayDate) {
                            dragcell = this;
                            fullDayCells = clickedcell.getAttribute("data-end-date") != null && dragcell.getAttribute("data-end-date") != null;
                            var dateString1 = clickedcell.getAttribute("data-date");
                            var dateString2 = dragcell.getAttribute("data-date");
                            var date1 = getDate(dateString1);
                            var date2 = getDate(dateString2);
                            min = Math.min(date1, date2);
                            max = Math.max(date1, date2);
                            return false;
                        }
                    });
                }
            }

            for (var i = 0; i < length; i++) {
                var row = rows[i];
                if (allDayCells && this.tableRows > 1) {
                    var resourceIndex = parseInt(dragcell.getAttribute("data-view"));
                    var rowsPerVew = rows.length / that.tableRows;
                    var rowIndex = (-1 + resourceIndex) * rowsPerVew;
                    cells = rows[rowIndex];
                    row = rows[rowIndex];
                }

                var cells = row.cells;

                for (var j = start; j < cells.length - end; j++) {
                    if (cells[j].getAttribute("data-view") !== clickedDataView)
                        continue;

                    cells[j].removeAttribute('data-selected');

                    if (!fullDayCells && cells[j].getAttribute("data-end-date")) {
                        continue;
                    }
                    var dateString = cells[j].getAttribute("data-date");
                    var date = getDate(dateString).valueOf();
                    if (min <= date && date <= max) {
                        cells[j].setAttribute('data-selected', 'true');
                    }
                }
            }
            that._updateCellsSelection();
        },

        findCell: function (x, y) {
            var that = this;
            var td = null;
            if (!that._tableOffset) {
                var tableOffset = that.schedulercontent.coord();
                that._tableOffset = tableOffset;
            }
            var offset = that._tableOffset;
            var tableTop = offset.top;
            var tableLeft = offset.left;
            if (y < tableTop)
                return null;
            if (x < tableLeft)
                return null;
            if (y > tableTop + that._hostHeight)
                return null;
            if (x > tableLeft + that._hostWidth)
                return null;

            var foundCell = false;
            var rows = that.rows;
            var viewObject = that._views[that._view];
            var view = viewObject.type;
            var allDayHeight = 0;
            var vScrollValue = that.vScrollInstance.value;
            var hScrollValue = that.hScrollInstance.value;

            for (var j = 0; j < rows.length; j++) {
                if (foundCell)
                    break;

                var row = rows[j];
                var cells = row.cells;
                var showAllDayRow = false;
                
                if (j == 0 && view == "dayView" || view == "weekView") {
                    showAllDayRow = that.showAllDayRow;
                    if (viewObject.timeRuler && (view === "dayView" || view === "weekView")) {
                        if (viewObject.timeRuler.showAllDayRow != undefined) {
                            showAllDayRow = viewObject.timeRuler.showAllDayRow;
                        }
                    }
                    if (showAllDayRow) {
                        allDayHeight = that._allDayRowFullHeight;
                    }
                }

                for (var i = 0; i < cells.length; i++) {
                    var cell = cells[i];
                    if (i == 0 && cell.getAttribute("data-time-slot"))
                        continue;

                    if (!cell._left) {
                        var left = cell.offsetLeft + tableLeft;
                        var top = cell.offsetTop + tableTop;
                        var width = cell.offsetWidth;
                        var height = cell.offsetHeight;
                        cell._left = left;
                        cell._top = top;
                        cell._width = width;
                        cell._height = height;
                    }
                    else {
                        var left = cell._left;
                        var top = cell._top;
                        var width = cell._width;
                        var height = cell._height;
                    }

                    cell._left = left;
                    cell._top = top;
                    cell._width = width;
                    cell._height = height;
                    if (width === 0 || height === 0) {
                        continue;
                    }

                    if (!that.rtl) {
                        left -= hScrollValue;
                    }
                    else {
                        if (that.hScrollInstance.element.style.visibility != "hidden") {
                            left -= (that.hScrollInstance.max - hScrollValue);
                        }
                    }

                    top -= vScrollValue;

                    if (j == 0 && showAllDayRow) {
                        top += vScrollValue;
                    }

                    if (top <= y && y < top + height) {
                        if (left <= x && x < left + width) {
                            td = cell;
                            foundCell = true;
                            break;
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            return td;
        },

        _removeFeedbackAndStopResize: function()
        {
            var that = this;
            if (!that.feedback)
                return;
 
            that.feedback.remove();
            that.feedback = null;
            that.pinnedfeedback.remove();
            that.pinnedfeedback = null;
            if (that.feedbacks) {
                for (var i = 0; i < that.feedbacks.length; i++) {
                    that.feedbacks[i].remove();
                }
            }

            that._resizeDays = 0;
            that._resizeStep = 0;
            that._lastX = null;
            that.feedbacks = new Array();
            that.leftResize = false;
            that.rightResize = false;
            that.topResize = false;
            that.bottomResize = false;
            that.overlay.hide();
            that.resizing = false;
            that.resizeFrom = null;
            that._dragCell = null;
            that._dragStartCell = null;
            that.resizeTo = null;
            that.dragOrResize = false;
            that.isMouseDown = false;
            if (that.selectedJQXAppointment) {
                var appointments = $('[data-key="' + that.selectedJQXAppointment.id + '"]');
                appointments.removeClass(that.toTP('jqx-scheduler-feedback-appointment jqx-disableselect'));
            }
            if (that.openedMonthCellPopup) {
                that.openedMonthCellPopup.remove();
            }
        },

        _saveChangesAfterDragOrResize: function (param, appointment, dragCell, resizing) {
            var that = this;
            if (param === false) {
                if (!appointment.isException()) {
                    if (!appointment.rootAppointment.recurrenceException) {
                        appointment.rootAppointment.recurrenceException = new Array();
                    }

                    if (appointment.rootAppointment != null) {
                        appointment.rootAppointment.exceptions.push(appointment);
                        appointment.rootAppointment.recurrenceException.push(appointment.occurrenceFrom);
                    }
                    else {
                        appointment.exceptions.push(appointment);
                        appointment.recurrenceException.push(appointment.occurrenceFrom);
                    }
                }
                else {
                    var exceptions = appointment.rootAppointment ? appointment.rootAppointment.exceptions : appointment.exceptions;
                    for (var i = 0; i < exceptions.length; i++) {
                        if (exceptions[i].occurrenceFrom.equals(appointment.occurrenceFrom)) {
                            exceptions[i] = appointment;
                            break;
                        }
                    }
                }
            }
            else if (param === true) {
                if (appointment.isException()) {
                    var exceptions = appointment.rootAppointment ? appointment.rootAppointment.exceptions : appointment.exceptions;
                    for (var i = 0; i < exceptions.length; i++) {
                        if (exceptions[i].occurrenceFrom.equals(appointment.occurrenceFrom)) {
                            for (var j = 0; j < appointment.rootAppointment.recurrenceException.length; j++) {
                                if (appointment.rootAppointment.recurrenceException[j].equals(exceptions[i].occurrenceFrom)) {
                                    var dragFrom = appointment.from;
                                    var newFrom = new $.jqx.date(exceptions[i].occurrenceFrom.year(), exceptions[i].occurrenceFrom.month(), exceptions[i].occurrenceFrom.day(), appointment.from.hour(), appointment.from.minute(), appointment.from.second());

                                    appointment.rootAppointment.recurrenceException[j] = newFrom;
                                    break;
                                }
                            }

                            exceptions[i] = appointment;
                            var dragFrom = appointment.from;
                            var newFrom = new $.jqx.date(exceptions[i].occurrenceFrom.year(), exceptions[i].occurrenceFrom.month(), exceptions[i].occurrenceFrom.day(), appointment.from.hour(), appointment.from.minute(), appointment.from.second());

                            exceptions[i].occurrenceFrom = newFrom;

                            break;
                        }
                    }
                }

                if (appointment.rootAppointment != null) {
                    appointment.rootAppointment.recurrencePattern = appointment.rootAppointment.recurrencePattern.createNewPattern();
                    var from = appointment.rootAppointment.from;
                    var rootDuration = appointment.rootAppointment.duration();
                    var freq = appointment.rootAppointment.recurrencePattern.freq;
                    var newFrom = null;
                    switch (freq) {
                        case "daily":
                            newFrom = new $.jqx.date(from.year(), from.month(), from.day(), appointment.from.hour(), appointment.from.minute(), appointment.from.second());
                            break;
                        case "weekly":
                            newFrom = new $.jqx.date(from.year(), from.month(), from.day(), appointment.from.hour(), appointment.from.minute(), appointment.from.second());
                            break;
                        case "monthly":
                            newFrom = new $.jqx.date(from.year(), from.month(), from.day(), appointment.from.hour(), appointment.from.minute(), appointment.from.second());
                            break;
                        case "yearly":
                            newFrom = new $.jqx.date(from.year(), from.month(), from.day(), appointment.from.hour(), appointment.from.minute(), appointment.from.second());
                            break;
                    }

                    if (resizing) {
                        appointment.rootAppointment.from = from;;
                        appointment.rootAppointment.to = from.add(appointment.duration());
                    }
                    else {
                        appointment.rootAppointment.from = newFrom;
                        appointment.rootAppointment.to = newFrom.add(rootDuration);
                    }

                    appointment.rootAppointment.allDay = appointment.allDay;
                    appointment.rootAppointment.resourceId = appointment.resourceId;
                    appointment.rootAppointment.color = appointment.color;
                    appointment.rootAppointment.borderColor = appointment.borderColor;
                    appointment.rootAppointment.background = appointment.background;
                    appointment.rootAppointment.timezone = appointment.timezone;
                    appointment.rootAppointment.subject = appointment.subject;
                    appointment.rootAppointment.description = appointment.description;
                    appointment.rootAppointment.location = appointment.location;
                    appointment.rootAppointment.category = appointment.category;
                    appointment.rootAppointment.status = appointment.status;
                    if (!that.resizing) {
                        appointment.rootAppointment.recurrencePattern.setFrom(newFrom);
                    }
                    else {
                        appointment.rootAppointment.recurrencePattern.setFrom(from);
                    }
                }
                else {
                    appointment.recurrencePattern = appointment.recurrencePattern.createNewPattern();
                    appointment.recurrencePattern.setFrom(appointment.from);
                }

                var view = $(dragCell).attr('data-view');
                var resourceId = that._resources[parseInt(view) - 1];
                if (resourceId != null) {
                    if (appointment.rootAppointment != null) {
                        appointment.rootAppointment.resourceId = resourceId;
                    }
                    else {
                        appointment.resourceId = resourceId;
                    }
                }
            }
        },
       
        _handleMouseUp: function (jqxAppointment, dragCell, resizing)
        {
            var that = this;

            clearInterval(that._verticalIntervalDragVelocity);
            clearInterval(that._horizontalIntervalDragVelocity);
            clearInterval(that._intervalDrag);
            clearInterval(that._horizontalIntervalDrag);
            var appointment = jqxAppointment;

            var cancel = false;
            if (!resizing) {
                if (that._dragStartCell == dragCell) {
                    cancel = true;
                }
            }
            else {
                if (that.resizeTo) {
                    if (appointment.to.equals(that.resizeTo)) {
                        cancel = true;
                    }
                }
                else if (that.resizeFrom) {
                    if (appointment.from.equals(that.resizeFrom)) {
                        cancel = true;
                    }
                }
            }
            if (cancel) {
                var appointments = $('[data-key="' + jqxAppointment.id + '"]');
                appointments.removeClass(that.toTP('jqx-scheduler-feedback-appointment jqx-disableselect'));
                that._removeFeedbackAndStopResize();
                return;
            }

            var duration = appointment.duration();
            var allDayAppointment = appointment.duration().days() >= 1 || appointment.allDay;
            var commit = function (param, appointment) {
                if (appointment.allDay || allDayAppointment) {
                    var allDayRowsCountOld = that.getMaxAllDayAppointments(that.appointmentsToRender);
                }

                if (resizing) {
                    if (that.resizeTo) {
                        if (that.resizeTo > that.max)
                            that.resizeTo = that.max;
                        if (that.resizeTo < that.min)
                            that.resizeTo = that.min;

                        appointment.to = that.resizeTo;
                    }
                    else if (that.resizeFrom) {
                        if (that.resizeFrom > that.max)
                            that.resizeFrom = that.max;
                        if (that.resizeFrom < that.min)
                            that.resizeFrom = that.min;

                        appointment.from = that.resizeFrom;
                    }
                    if (appointment.from.hour() == 0 && appointment.from.minute() == 0 && appointment.to.hour() == 23 && appointment.to.minute() == 59) {
                        appointment.allDay = true;
                    }
                }
                else {
                    var view = that._views[that._view].type;
                    var viewObject = that._views[that._view];

                    var date = $(dragCell).attr('data-date');
                    var allDayCell = $(dragCell).attr('data-end-date') != null;

                    var jqxDate = new $.jqx.date(date, that.timeZone);
                    if (jqxDate < that.min)
                        jqxDate = that.min;
                    if (jqxDate > that.max)
                        jqxDate = that.max;

                    if (that.rtl && allDayAppointment && allDayCell) {
                        appointment.to = $.jqx.scheduler.utilities.getEndOfDay(jqxDate);
                    }
                    else if (that.rtl && (view == "monthView" || view == "timelineMonthView")) {
                        appointment.to = $.jqx.scheduler.utilities.getEndOfDay(jqxDate);
                    }
                    else if (that.rtl && (view == "timelineDayView" || view == "timelineWeekView"))
                    {
                        var minutesPerScale = that.getMinutesPerScale();
                        appointment.to = jqxDate.addMinutes(minutesPerScale);
                    }
                    else {
                        appointment.from = jqxDate;
                    }

                    if (view === "dayView" || view === "weekView") {
                        if (!allDayAppointment && !allDayCell) {
                            appointment.to = jqxDate.add(duration);
                            appointment.allDay = false;
                        }
                        else if (!allDayAppointment && allDayCell) {
                            appointment.to = $.jqx.scheduler.utilities.getEndOfDay(jqxDate);
                            appointment.allDay = true;
                        }
                        else if (allDayAppointment && allDayCell && !that.rtl) {
                            appointment.to = jqxDate.add(duration);
                            if (appointment.from.hour() == 0 && appointment.from.minute() == 0 && appointment.to.hour() == 23 && appointment.to.minute() == 59) {
                                appointment.allDay = true;
                            }
                        }
                        else if (allDayAppointment && allDayCell && that.rtl) {
                            appointment.from = $.jqx.scheduler.utilities.getStartOfDay(appointment.to.add(new $.jqx.timeSpan(-duration)));
                            if (appointment.from.hour() == 0 && appointment.from.minute() == 0 && appointment.to.hour() == 23 && appointment.to.minute() == 59) {
                                appointment.allDay = true;
                            }
                        }
                        else if (allDayAppointment && !allDayCell) {
                            var minutes = 30;
                            var scale = viewObject.timeRuler && viewObject.timeRuler.scale;
                            switch (scale) {
                                case 'sixtyMinutes':
                                case 'hour':
                                    minutes = 60;
                                    break;
                                case 'fifteenMinutes':
                                case 'quarterHour':
                                    minutes = 15;
                                    break;
                                case 'tenMinutes':
                                    minutes = 10;
                                    break;
                                case 'fiveMinutes':
                                    minutes = 5;
                                    break;
                            }
                            appointment.to = jqxDate.addMinutes(minutes);
                            appointment.allDay = false;
                        }
                    }
                    else if (view === "monthView") {
                        if (!that.rtl) {
                            appointment.to = jqxDate.add(duration);
                        }
                        else {
                            appointment.from = $.jqx.scheduler.utilities.getStartOfDay(appointment.to.add(new $.jqx.timeSpan(-duration)));
                        }
                    }
                    else if (view === "timelineDayView" || view === "timelineWeekView" || view === "timelineMonthView") {
                        if (!that.rtl) {
                            appointment.to = jqxDate.add(duration);
                        }
                        else {
                            if (view == "timelineMonthView") {
                                appointment.from = $.jqx.scheduler.utilities.getStartOfDay(appointment.to.add(new $.jqx.timeSpan(-duration)));
                            }
                            else {
                                var minutesPerScale = that.getMinutesPerScale();
                                appointment.from = jqxDate.addMinutes(minutesPerScale).add(new $.jqx.timeSpan(-duration));
                            }
                        }
                    }
                }

          
                that._saveChangesAfterDragOrResize(param, appointment, dragCell, that.resizing);
                var view = $(dragCell).attr('data-view');
                var resourceId = that._resources[parseInt(view) - 1];
                if (resourceId != null) {
                    appointment.resourceId = resourceId;
                }

                that.resizing = false;
                that.resizeFrom = null;
                that._dragCell = null;
                that.resizeTo = null;


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

                that._raiseEvent('appointmentChange', { appointment: appointment.boundAppointment });
                that.changedAppointments[appointment.id] = { type: "Update", appointment: appointment.boundAppointment };

                that.table.find('.jqx-icon-arrow-down').hide();
                if (that._views[that._view].type == "monthView" && that._views[that._view].monthRowAutoHeight) {
                    that._renderrows();
                }
                else if ((that._views[that._view].type == "weekView" || that._views[that._view].type == "dayView") && (appointment.allDay || allDayAppointment)) {
                    if (that.tableRows > 1) {
                        that._renderrows();
                    }
                    else {
                        var viewStart = that.getViewStart();
                        var viewEnd = $.jqx.scheduler.utilities.getEndOfDay(that.getViewEnd());
                        that._prepareAppointmentsInView(viewStart, viewEnd);
                        that._renderAppointments(viewStart, viewEnd);
                        var allDayRowsCount = that.getMaxAllDayAppointments(that.appointmentsToRender);
                        if (allDayRowsCount != allDayRowsCountOld) {
                            var allDayRowHeight = allDayRowsCount * (that._defaultRowHeight - 2);
                            if (that.isTouchDevice()) {
                                allDayRowHeight = Math.max(22+that._defaultRowHeight, 17 + allDayRowHeight);
                            }
                            else {
                                allDayRowHeight = Math.max(3 * that._defaultRowHeight, 17 + allDayRowHeight);
                            }
                            if (that.tableRows == 1) {
                                $($(that.table[0].rows[0]).find('td')).css('height', allDayRowHeight + "px");
                            }
                            else {
                                $($(that.table[0].rows[1]).find('td')).css('height', allDayRowHeight + "px");
                            }

                            $(that.oldRow).find('td').css('height', allDayRowHeight + "px");
                            $(that.pinnedTableRow).find('td').css('height', allDayRowHeight + "px");
                       
                            that.pinnedtable.height(allDayRowHeight);
                            that._updateScrollbars(that._hostHeight ? that._hostHeight : that.host.height());
                        }
                    }
                }
                else {
                    var viewStart = that.getViewStart();
                    var viewEnd = $.jqx.scheduler.utilities.getEndOfDay(that.getViewEnd());
                    that._prepareAppointmentsInView(viewStart, viewEnd);
                    that._renderAppointments(viewStart, viewEnd);
                }
                that._removeFeedbackAndStopResize();
            }

            if (appointment.isRecurrentAppointment()) {
                commit(false, appointment);
            }
            else {
                commit(null, appointment);
            }
        },

        _handleDayWeekViewResize: function(x, y, td, position, appointment)
        {
            var that = this;
            var view = that._views[that._view].type;
            var viewObject = that._views[that._view];
            var allDayAppointment = appointment.duration().days() >= 1 || appointment.allDay;
            if (!allDayAppointment && !td.getAttribute('data-end-date')) {
                var validateHeight = function (height) {
                    if (height < 10)
                        return false;
                    return true;
                }
                var sameColumnTD = that.findCell(that.feedback.coord().left, y);

                if (that.topResize) {
                    if (!that._lastResizeY) {
                        that._lastResizeY = that.mouseDownPosition.top;
                    }

                    if (y > that._lastResizeY + $(td).height() / 2) {
                        var newHeight = that.selectedAppointmentTableBounds.height + that.selectedAppointmentTableBounds.top - position.top - $(td).height() - 3;
                        if (validateHeight(newHeight)) {
                            that.feedback.css('top', 2 + position.top + $(td).height());
                            that.feedback.height(newHeight);
                            that._lastResizeY = that.feedback.coord().top;

                            var date = new $.jqx.date(sameColumnTD.getAttribute('data-date'), that.timeZone);
                            that.resizeFrom = date.addMinutes(that.getMinutesPerScale());
                        }
                    }
                    else if (y < that._lastResizeY - $(td).height() / 2) {
                        var newHeight = that.selectedAppointmentTableBounds.height + that.selectedAppointmentTableBounds.top - position.top - 3;
                        if (validateHeight(newHeight)) {
                            that.feedback.css('top', 2 + position.top);
                            that.feedback.height(newHeight);
                            that._lastResizeY = that.feedback.coord().top;
                            that.resizeFrom = new $.jqx.date(sameColumnTD.getAttribute('data-date'), that.timeZone);
                        }
                    }
                }
                else if (that.bottomResize) {
                    if (!that._lastResizeY) {
                        that._lastResizeY = that.mouseDownPosition.top;
                    }

                    if (y > that._lastResizeY + $(td).height() / 2) {
                        var offset = -5 + $(td).height() + position.top - that.selectedAppointmentTableBounds.height - that.selectedAppointmentTableBounds.top;
                        var newHeight = that.selectedAppointmentTableBounds.height + offset;
                        if (validateHeight(newHeight)) {
                            that.feedback.height(newHeight);
                            that._lastResizeY = that.selectedAppointmentTableBounds.height + offset + that.feedback.coord().top;
                            that.resizeTo = new $.jqx.date(sameColumnTD.getAttribute('data-date'), that.timeZone).addMinutes(that.getMinutesPerScale());
                        }
                    }
                    else if (y < that._lastResizeY - $(td).height() / 2) {
                        var offset = -5 + position.top - that.selectedAppointmentTableBounds.height - that.selectedAppointmentTableBounds.top;
                        var newHeight = that.selectedAppointmentTableBounds.height + offset;
                        if (validateHeight(newHeight)) {
                            that.feedback.height(newHeight);
                            that._lastResizeY = that.selectedAppointmentTableBounds.height + offset + that.feedback.coord().top;
                            that.resizeTo = new $.jqx.date(sameColumnTD.getAttribute('data-date'), that.timeZone);
                        }
                    }
                }
            }
            else {
                var validateWidth = function (width) {
                    if (width < that.cellWidth - 10)
                        return false;
                    return true;
                }
                var exactTime = viewObject.appointmentsRenderMode && viewObject.appointmentsRenderMode == "exactTime";
                if (appointment.allDay || !exactTime) {
                    if (that.leftResize) {
                        if (!that._lastResizeX) {
                            that._lastResizeX = that.mouseDownPosition.left;
                        }

                        if (x > that._lastResizeX + $(td).width() / 2) {
                            var newWidth = that.selectedAppointmentTableBounds.width + that.selectedAppointmentTableBounds.left - position.left - that.cellWidth;
                            if (validateWidth(newWidth)) {
                                that.feedback.css('left', 5 + position.left + that.cellWidth);
                                that.feedback.width(newWidth - 5);
                                that.feedback.hide();
                                that.pinnedfeedback.css('left', 5 + position.left + that.cellWidth);
                                that.pinnedfeedback.width(newWidth - 5);
                                that._lastResizeX = that.pinnedfeedback.coord().left;
                                if (!that.rtl) {
                                    that.resizeFrom = new $.jqx.date(td.getAttribute('data-date'), that.timeZone).addDays(1);
                                }
                                else {
                                    that.resizeTo = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(td.getAttribute('data-date'), that.timeZone)).addDays(-1);
                                }
                            }
                        }
                        else if (x < that._lastResizeX - $(td).width() / 2) {
                            var newWidth = that.selectedAppointmentTableBounds.width + that.selectedAppointmentTableBounds.left - position.left;
                            if (validateWidth(newWidth)) {
                                that.feedback.css('left', 5 + position.left);
                                that.feedback.width(newWidth - 5);
                                that.feedback.hide();
                                that.pinnedfeedback.css('left', 5 + position.left);
                                that.pinnedfeedback.width(newWidth - 5);
                                that._lastResizeX = that.pinnedfeedback.coord().left;
                                if (!that.rtl) {
                                    that.resizeFrom = new $.jqx.date(td.getAttribute('data-date'), that.timeZone);
                                }
                                else {
                                    that.resizeTo = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(td.getAttribute('data-date'), that.timeZone));
                                }
                            }
                        }
                    }
                    else if (that.rightResize) {
                        if (!that._lastResizeX) {
                            that._lastResizeX = that.selectedAppointmentTableBounds.width + that.selectedAppointmentTableBounds.left;
                        }

                        var resizeOffset = $(td).width() / 2;
                        if (x > that._lastResizeX + resizeOffset) {
                            var offset = $(td).width() + position.left - that.selectedAppointmentTableBounds.width - that.selectedAppointmentTableBounds.left;
                            var newWidth = that.selectedAppointmentTableBounds.width + offset;
                            if (validateWidth(newWidth)) {
                                that.feedback.hide();
                                that.feedback.width(newWidth - 6);
                                that.feedback.css('left', 5 + position.left);
                                that.pinnedfeedback.width(newWidth - 6);
                                that._lastResizeX = that.selectedAppointmentTableBounds.width + offset + that.pinnedfeedback.coord().left;
                                if (!that.rtl) {
                                    that.resizeTo = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(td.getAttribute('data-date'), that.timeZone));
                                }
                                else {
                                    that.resizeFrom = new $.jqx.date(td.getAttribute('data-date'), that.timeZone);
                                }
                            }
                        }
                        else if (x < that._lastResizeX - resizeOffset) {
                            var offset = position.left - that.selectedAppointmentTableBounds.width - that.selectedAppointmentTableBounds.left;
                            var newWidth = that.selectedAppointmentTableBounds.width + offset;
                            if (validateWidth(newWidth)) {
                                that.feedback.hide();
                                that.feedback.css('left', 5 + position.left);
                                that.feedback.width(newWidth - 6);
                                that.pinnedfeedback.width(newWidth - 6);
                                that._lastResizeX = that.selectedAppointmentTableBounds.width + offset + that.pinnedfeedback.coord().left;
                                if (!that.rtl) {
                                    that.resizeTo = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(td.getAttribute('data-date'), that.timeZone).addDays(-1));
                                }
                                else {
                                    that.resizeFrom = new $.jqx.date(td.getAttribute('data-date'), that.timeZone).addDays(1);
                                }
                            }
                        }
                    }
                }
                else {
                    var resizePositions = new Array();
                    var resizeDates = new Array();
                    var startPosition = -1;
                    var endPosition = -1;
                    var left = this.host.coord().left;
                    var timeColumns = 0;
                    var hScrollValue = that.hScrollInstance.value;
                    if (that.rtl) {
                        var hScrollValue = that.hScrollInstance.max - that.hScrollInstance.value;
                    }
                    if (that.hScrollBar[0].style.visibility == "hidden") {
                        hScrollValue = 0;
                    }

                    var positionLeft = x + hScrollValue;

                    for (var i = 0; i < this.columns.records.length; i++) {
                        if (this.columns.records[i].timeColumn) {
                            if (!that.rtl) {
                                left += this.columns.records[i].width;
                                timeColumns++;
                            }
                        }
                    }
                    var viewStart = that.getViewStart();
                    var viewEnd = that.getViewEnd();

                    for (var i = 0; i < this._getColumnsLengthPerView() ; i++) {
                        var width = this.columns.records[i + timeColumns].width;
                        if (that.leftResize) {
                            if (!that.rtl) {
                                resizePositions.push(left);
                                resizeDates.push(viewStart.addDays(i));

                                if (appointment.from.hour() != 0 || (appointment.from.hour() == 0 && appointment.from.minute() != 0)) {
                                    if (left < that.selectedAppointmentTableBounds.left && left + width > that.selectedAppointmentTableBounds.left) {
                                        resizePositions.push(that.selectedAppointmentTableBounds.left);
                                        resizeDates.push(appointment.from);
                                        startPosition = resizePositions.length - 1;
                                    }
                                }
                                if (appointment.to.hour() != 23 || (appointment.to.hour() == 23 && appointment.to.minute() != 59)) {
                                    if (left < that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width && left + width > that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width) {
                                        resizePositions.push(that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width + 8);
                                        resizeDates.push(appointment.to);
                                        endPosition = resizePositions.length - 1;
                                    }
                                }
                            }

                            if (that.rtl) {
                                resizePositions.push(left);
                                resizeDates.push(viewEnd.addDays(-i - 1));

                                if (appointment.from.hour() != 0 || (appointment.from.hour() == 0 && appointment.from.minute() != 0)) {
                                    if (left < that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width && left + width > that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width) {
                                        resizePositions.push(that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width + 8);
                                        resizeDates.push(appointment.from);
                                        startPosition = resizePositions.length - 1;
                                    }
                                }
                                if (appointment.to.hour() != 23 || (appointment.to.hour() == 23 && appointment.to.minute() != 59)) {
                                    if (left < that.selectedAppointmentTableBounds.left && left + width > that.selectedAppointmentTableBounds.left) {
                                        resizePositions.push(that.selectedAppointmentTableBounds.left);
                                        resizeDates.push(appointment.to);
                                        endPosition = resizePositions.length - 1;
                                    }
                                }
                            }
                            left += width;
                        }
                        else {
                            if (!that.rtl) {
                                if (appointment.from.hour() != 0 || (appointment.from.hour() == 0 && appointment.from.minute() != 0)) {
                                    if (left < that.selectedAppointmentTableBounds.left && left + width > that.selectedAppointmentTableBounds.left) {
                                        resizePositions.push(that.selectedAppointmentTableBounds.left);
                                        resizeDates.push(appointment.from);
                                        startPosition = resizePositions.length - 1;
                                    }
                                }
                                if (appointment.to.hour() != 23 || (appointment.to.hour() == 23 && appointment.to.minute() != 59)) {
                                    if (left < that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width && left + width > that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width) {
                                        resizePositions.push(that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width + 8);
                                        resizeDates.push(appointment.to);
                                        endPosition = resizePositions.length - 1;
                                    }
                                }
                                left += width;
                                resizePositions.push(left);
                                resizeDates.push(viewStart.addDays(i));
                            }
                            else {
                                if (appointment.from.hour() != 0 || (appointment.from.hour() == 0 && appointment.from.minute() != 0)) {
                                    if (left < that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width && left + width > that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width) {
                                        resizePositions.push(that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width + 8);
                                        resizeDates.push(appointment.from);
                                        startPosition = resizePositions.length - 1;
                                    }
                                }
                                if (appointment.to.hour() != 23 || (appointment.to.hour() == 23 && appointment.to.minute() != 59)) {
                                    if (left < that.selectedAppointmentTableBounds.left && left + width > that.selectedAppointmentTableBounds.left) {
                                        resizePositions.push(that.selectedAppointmentTableBounds.left);
                                        resizeDates.push(appointment.to);
                                        endPosition = resizePositions.length - 1;
                                    }
                                }
                                left += width;
                                resizePositions.push(left);
                                resizeDates.push(viewEnd.addDays(-i-1));
                            }
                        }
                    }

                    if (that.leftResize) {
                        for (var i = 0; i < resizePositions.length ; i++) {
                            var position = resizePositions[i];
                            var nextPosition = resizePositions[i + 1];
                            if (!nextPosition) nextPosition = position;
                            var condition = i < resizePositions.length - 1 ? positionLeft >= position && positionLeft <= nextPosition : positionLeft >= position;
                            if (condition) {
                                var width = -position + that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width;
                                var previousWidth = that.pinnedfeedback.width();
                                var previousLeft = that.pinnedfeedback.css('left');
                                var previousResizeTo = that.resizeTo
                                var previousResizeFrom = that.resizeFrom;
                                if (width > 0) {
                                    that.pinnedfeedback.css('left', position);
                                    that.pinnedfeedback.width(width);
                                    if (i == startPosition) {
                                        if (!that.rtl) {
                                            that.resizeFrom = appointment.from;
                                        }
                                        else {
                                            that.resizeTo = appointment.from;
                                        }
                                    } else if (i == endPosition) {
                                        if (!that.rtl) {
                                            that.resizeFrom = appointment.to;
                                        }
                                        else {
                                            that.resizeTo = appointment.to;
                                        }
                                    }
                                    else {
                                        if (!that.rtl) {
                                            that.resizeFrom = resizeDates[i];
                                        }
                                        else {
                                            that.resizeTo =  $.jqx.scheduler.utilities.getEndOfDay(resizeDates[i]);
                                        }
                                    }
                                }
                            }
                        }
                        var from = that.resizeFrom;
                        var to = that.resizeTo;
                        if (that.rtl) {
                            from = appointment.from;
                        }
                        else to = appointment.to;
                        var duration = new $.jqx.timeSpan(10000 * (to - from));
                        if (duration.days() < 1) {
                            that.pinnedfeedback.css('left', previousLeft);
                            that.pinnedfeedback.width(previousWidth);
                            that.resizeFrom = previousResizeFrom;
                            that.resizeTo = previousResizeTo;
                        }
                    }
                    else if (that.rightResize) {
                        for (var i = 0; i < resizePositions.length ; i++) {
                            var position = resizePositions[i];
                            var nextPosition = resizePositions[i + 1];
                            if (!nextPosition) nextPosition = position;
                            var condition = i < resizePositions.length - 1 ? x >= position - this.cellWidth / 3 && x <= nextPosition - this.cellWidth / 3 : x >= position - this.cellWidth / 3;
                            if (condition) {
                                var width = position - that.selectedAppointmentTableBounds.left - 15;
                                var previousWidth = that.pinnedfeedback.width();
                                that.pinnedfeedback.width(width);
                                var previousResizeTo = that.resizeTo
                                var previousResizeFrom = that.resizeFrom;
                                if (i == startPosition) {
                                    if (!that.rtl) {
                                        that.resizeTo = appointment.from;
                                    }
                                    else {
                                        that.resizeFrom = appointment.from;
                                    }
                                    var width = position - that.selectedAppointmentTableBounds.left - 9;
                                    that.pinnedfeedback.width(width);
                                    break;
                                } else if (i == endPosition) {
                                    if (!that.rtl) {
                                        that.resizeTo = appointment.to;
                                    }
                                    else {
                                        that.resizeFrom = appointment.to;
                                    }
                                    var width = position - that.selectedAppointmentTableBounds.left - 9;
                                    that.pinnedfeedback.width(width);
                                    break;
                                }
                                else {
                                    if (!that.rtl) {
                                        that.resizeTo = $.jqx.scheduler.utilities.getEndOfDay(resizeDates[i]);
                                    }
                                    else {
                                        that.resizeFrom = resizeDates[i];
                                    }
                                    break;
                                }
                            }
                        }
                        var from = that.resizeFrom;
                        var to = that.resizeTo;
                        if (!that.rtl) {
                            from = appointment.from;
                        }
                        else to = appointment.to;
                        var duration = new $.jqx.timeSpan(10000 * (to - from));
                        if (duration.days() < 1) {
                            that.pinnedfeedback.width(previousWidth);
                            that.resizeFrom = previousResizeFrom;
                            that.resizeTo = previousResizeTo;
                        }
                    }
                }
            }
        },

        _handleTimelineMonthViewResize: function (x, y, td, position, appointment) {
            var that = this;
            var view = that._views[that._view].type;
            var viewObject = that._views[that._view];
            var validateWidth = function (width) {
                if (width < 10)
                    return false;
                return true;
            }
            var sameRowTD = that.findCell(x, that.feedback.coord().top);
            if (appointment.allDay) {
                if (that.leftResize) {
                    if (!that._lastResizeX) {
                        that._lastResizeX = that.mouseDownPosition.left;
                    }

                    if (x > that._lastResizeX + $(td).width() / 2) {
                        var newWidth = that.selectedAppointmentTableBounds.width + that.selectedAppointmentTableBounds.left - position.left - $(td).width();
                        if (validateWidth(newWidth)) {
                            that.feedback.css('left', position.left + $(td).width());
                            that.feedback.width(newWidth);
                            that._lastResizeX = that.feedback.coord().left;
                            if (!that.rtl) {
                                that.resizeFrom = new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone).addDays(1);
                            }
                            else {
                                that.resizeTo = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone).addDays(-1));
                            }
                        }
                    }
                    else if (x < that._lastResizeX - $(td).width() / 2) {
                        var newWidth = that.selectedAppointmentTableBounds.width + that.selectedAppointmentTableBounds.left - position.left;
                        if (validateWidth(newWidth)) {
                            that.feedback.css('left', position.left);
                            that.feedback.width(newWidth);
                            that._lastResizeX = that.feedback.coord().left;
                            if (!that.rtl) {
                                that.resizeFrom = new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone);
                            }
                            else {
                                that.resizeTo = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone));
                            }
                        }
                    }
                }
                else if (that.rightResize) {
                    if (!that._lastResizeX) {
                        that._lastResizeX = that.mouseDownPosition.left;
                    }

                    if (x > that._lastResizeX + $(td).width() / 2) {
                        var offset = $(td).width() + position.left - that.selectedAppointmentTableBounds.width - that.selectedAppointmentTableBounds.left;
                        var newWidth = that.selectedAppointmentTableBounds.width + offset - 5;
                        if (validateWidth(newWidth)) {
                            that.feedback.width(newWidth);
                            that._lastResizeX = that.selectedAppointmentTableBounds.width + offset + that.feedback.coord().left;
                            if (!that.rtl) {
                                that.resizeTo = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone));
                            }
                            else {
                                that.resizeFrom = new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone);
                            }
                        }
                    }
                    else if (x < that._lastResizeX - $(td).width() / 2) {
                        var offset = position.left - that.selectedAppointmentTableBounds.width - that.selectedAppointmentTableBounds.left;
                        var newWidth = that.selectedAppointmentTableBounds.width + offset - 5;
                        if (validateWidth(newWidth)) {
                            that.feedback.width(newWidth);
                            that._lastResizeX = that.selectedAppointmentTableBounds.width + offset + that.feedback.coord().left;
                            if (!that.rtl) {
                                that.resizeTo = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone).addDays(-1));
                            }
                            else {
                                that.resizeFrom = new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone).addDays(1);
                            }
                        }
                    }
                }
            }
            else {
                var resizePositions = new Array();
                var resizeDates = new Array();
                var startPosition = -1;
                var endPosition = -1;
                var left = this.host.coord().left;
                var timeColumns = 0;
                for (var i = 0; i < this.columns.records.length; i++) {
                    if (this.columns.records[i].timeColumn) {
                        left += this.columns.records[i].width;
                        timeColumns++;
                    }
                }
                var hScrollValue = that.hScrollInstance.value;
                if (that.rtl) {
                    var hScrollValue = that.hScrollInstance.max - that.hScrollInstance.value;
                }
                if (that.hScrollBar[0].style.visibility == "hidden") {
                    hScrollValue = 0;
                }
                var positionLeft = x + hScrollValue;
                var viewStart = that.getViewStart();
                var viewEnd = that.getViewEnd();
                var length = this._getColumnsLengthPerView() - 1;
                for (var i = 0; i < this._getColumnsLengthPerView() ; i++) {
                    var width = this.columns.records[i + timeColumns].width;
                    if (that.leftResize) {
                        resizePositions.push(left);
                        if (!that.rtl) {
                            resizeDates.push(viewStart.addDays(i));
                        }
                        else {
                            resizeDates.push(viewEnd.addDays(-i));
                        }

                        if (appointment.from.hour() != 0 || (appointment.from.hour() == 0 && appointment.from.minute() != 0)) {
                            if (left < that.selectedAppointmentTableBounds.left && left + width > that.selectedAppointmentTableBounds.left) {
                                resizePositions.push(that.selectedAppointmentTableBounds.left);
                                resizeDates.push(appointment.from);
                                startPosition = resizePositions.length - 1;
                            }
                        }
                        if (appointment.to.hour() != 23 || (appointment.to.hour() == 23 && appointment.to.minute() != 59)) {
                            if (left < that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width && left + width > that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width) {
                                resizePositions.push(that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width + 8);
                                resizeDates.push(appointment.to);
                                endPosition = resizePositions.length - 1;
                            }
                        }
                        left += width;
                    }
                    else {
                        if (appointment.from.hour() != 0 || (appointment.from.hour() == 0 && appointment.from.minute() != 0)) {
                            if (left < that.selectedAppointmentTableBounds.left && left + width > that.selectedAppointmentTableBounds.left) {
                                resizePositions.push(that.selectedAppointmentTableBounds.left);
                                resizeDates.push(appointment.from);
                                startPosition = resizePositions.length - 1;
                            }
                        }
                        if (appointment.to.hour() != 23 || (appointment.to.hour() == 23 && appointment.to.minute() != 59)) {
                            if (left < that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width && left + width > that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width) {
                                resizePositions.push(that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width);
                                resizeDates.push(appointment.to);
                                endPosition = resizePositions.length - 1;
                            }
                        }
                        left += width;
                        resizePositions.push(left);
                        if (!that.rtl) {
                            resizeDates.push(viewStart.addDays(i));
                        }
                        else {
                            resizeDates.push(viewEnd.addDays(-i-1));
                        }
                    }
                }

                if (that.leftResize) {
                    for (var i = 0; i < resizePositions.length ; i++) {
                        var resizePosition = resizePositions[i];
                        var nextPosition = resizePositions[i + 1];
                        if (!nextPosition) nextPosition = resizePosition;
                        var condition = i < resizePositions.length - 1 ? positionLeft >= resizePosition && positionLeft <= nextPosition : positionLeft >= resizePosition;
                        if (condition) {
                            var width = -resizePosition + that.selectedAppointmentTableBounds.left + that.selectedAppointmentTableBounds.width;
                            var previousWidth = that.feedback.width();
                            var previousLeft = that.feedback.css('left');
                            var previousResizeTo = that.resizeTo
                            var previousResizeFrom = that.resizeFrom;

                            that.feedback.css('left', resizePosition);
                            that.feedback.width(width);
                            if (i == startPosition) {
                                if (!that.rtl) {
                                    that.resizeFrom = appointment.from;
                                }
                                else {
                                    that.resizeTo = appointment.from;
                                }
                            } else if (i == endPosition) {
                                if (!that.rtl) {
                                    that.resizeFrom = appointment.to;
                                }
                                else {
                                    that.resizeTo = appointment.to;
                                }
                            }
                            else {
                                if (!that.rtl) {
                                    that.resizeFrom = resizeDates[i];
                                }
                                else {
                                    that.resizeTo = resizeDates[i];
                                }
                            }
                        }
                    }
                    var from = that.resizeFrom;
                    var to = that.resizeTo;
                    if (that.rtl) {
                        from = appointment.from;
                    }
                    else to = appointment.to;
                    var duration = new $.jqx.timeSpan(10000 * (to - from));
                    if (that.feedback.width()<20) {
                        that.feedback.css('left', previousLeft);
                        that.feedback.width(previousWidth);
                        that.resizeFrom = previousResizeFrom;
                        that.resizeTo = previousResizeTo;
                    }
                }
                else if (that.rightResize) {
                    for (var i = 0; i < resizePositions.length ; i++) {
                        var resizePosition = resizePositions[i];
                        var nextPosition = resizePositions[i + 1];
                        if (!nextPosition) nextPosition = resizePosition;
                        var condition = i < resizePositions.length - 1 ? positionLeft >= resizePosition - this.cellWidth / 3 && positionLeft <= nextPosition - this.cellWidth / 3 : positionLeft >= resizePosition - this.cellWidth / 3;
                        if (condition) {
                            var width = resizePosition - that.selectedAppointmentTableBounds.left-12;
                            var previousWidth = that.feedback.width();
                            that.feedback.width(width);
                            var previousResizeTo = that.resizeTo
                            var previousResizeFrom = that.resizeFrom;
                            if (i == startPosition) {
                                if (!that.rtl) {
                                    that.resizeTo = appointment.from;
                                }
                                else {
                                    that.resizeFrom = appointment.from;
                                }
                                var width = resizePosition - that.selectedAppointmentTableBounds.left;
                                that.feedback.width(width);
                                break;
                            } else if (i == endPosition) {
                                if (!that.rtl) {
                                    that.resizeTo = appointment.to;
                                }
                                else {
                                    that.resizeFrom = appointment.to;
                                }
                                var width = resizePosition - that.selectedAppointmentTableBounds.left;
                                that.feedback.width(width);
                                break;
                            }
                            else {
                                if (!that.rtl) {
                                    that.resizeTo = $.jqx.scheduler.utilities.getEndOfDay(resizeDates[i]);
                                }
                                else {
                                    that.resizeFrom = resizeDates[i];
                                }
                                break;
                            }
                        }
                    }
                    var from = that.resizeFrom;
                    var to = that.resizeTo;
                    if (!that.rtl) {
                        from = appointment.from;
                    }
                    else to = appointment.to;
                    var duration = new $.jqx.timeSpan(10000 * (to - from));
                    if (that.feedback.width()<20) {
                        that.feedback.width(previousWidth);
                        that.resizeFrom = previousResizeFrom;
                        that.resizeTo = previousResizeTo;
                    }
                }
            }
        },

        _handleMonthViewResize: function (x, y, td, position, appointment)
        {
            var that = this;

            if (!that.selectedJQXAppointment) {
                return;
            }
            var view = that._views[that._view].type;
            var viewObject = that._views[that._view];
            var validateWidth = function (width) {
                if (width < 10)
                    return false;
                return true;
            }

            var monthWidth = -5;
            if (that.tableColumns > 1) {
                monthWidth = parseInt(-5 / that.tableColumns);
            }

            for (var i = 0; i < that.columns.records.length / that.tableColumns; i++) {
                if (that.columns.records[i].timeColumn)
                    continue;

                monthWidth += that.columns.records[i].width;
            }

            var resourceId = that.selectedJQXAppointment.resourceId;
            var resourceIndex = that._resources.indexOf(resourceId);
            if (that.resources && that.resources.orientation == "none")
                resourceIndex = -1;
            var viewLeft = "0px";
            if (resourceIndex != -1 && that.tableRows == 1) {
                viewLeft = monthWidth * resourceIndex + "px";
            }
            if (viewObject.showWeekNumbers) {
                if (!that.rtl) {
                    viewLeft = parseInt(viewLeft) + that.columns.records[0].width + "px";
                }
            }

            var tdWidth = td.offsetWidth;
            var tdHeight = td.offsetHeight;
            var topOffset = 18;
            if (that.isTouchDevice()) topOffset = 2;
            for (var i = 0; i < 6; i++) {
                that.feedbacks[i][0].style.left = viewLeft;
                that.feedbacks[i][0].style.width = monthWidth + "px";
                that.feedbacks[i][0].style.display = "block";
                that.feedbacks[i][0].style.top = parseInt(that.rows[i].top) + topOffset + "px";
                if (that.tableRows > 1) {
                    that.feedbacks[i][0].style.top = parseInt(that.rows[6 * resourceIndex + i].top) + topOffset + "px";
                }
                $(that.feedbacks[i][0]).find(".jqx-scheduler-appointment-resize-indicator").css('visibility', 'inherit');
            }

            var elements = that.selectedJQXAppointment.elements;
            var firstCell = elements[0].cells[0].cell;
            var lastCell = elements[elements.length - 1];
            var lastCellPositionTop = lastCell.lastCellY;
            var lastCellPositionLeft = lastCell.lastCellX;
            var firstCellPositionTop = elements[0].cellY;
            var firstCellPositionLeft = elements[0].cellX;
            var positionTop = parseInt(position.top);
            var positionLeft = parseInt(position.left);

            if (!that.rtl) {
                if (that.leftResize) {
                    var resizeFromSet = false;
                    for (var i = 0; i < 6; i++) {
                        var feedback = that.feedbacks[i];
                        var feedbackTop = parseInt(feedback[0].style.top) - topOffset;
                        var feedbackLeft = parseInt(feedback[0].style.left);
                        // full row width for elements above cursor.
                        if (feedbackTop < positionTop) {
                            feedback[0].style.width = monthWidth + "px";
                            for (var j = 0; j < elements.length; j++) {
                                var top = elements[j].cellY;
                                if (top == feedbackTop) {
                                    feedback[0].style.top = elements[j].y + "px";
                                }
                            }
                        }
                        else {
                            for (var j = 0; j < elements.length; j++) {
                                var top = elements[j].cellY;
                                if (top == feedbackTop) {
                                    feedback[0].style.width = elements[j].width + "px";
                                    feedback[0].style.top = elements[j].y + "px";
                                }
                            }
                        }
                        // handle the feedback for the first element.
                        var element = elements[0];
                        var left = parseInt(element.x);

                        // handle first element's feedback.
                        if (feedbackTop == firstCellPositionTop) {
                            feedback[0].style.left = left + "px";
                            if (positionTop == firstCellPositionTop) {
                                feedback[0].style.left = 1 + position.left + "px";
                                feedback[0].style.width = -1 + element.x + element.width - position.left + "px";
                                if (viewObject.appointmentsRenderMode == "exactTime" && !that.selectedJQXAppointment.allDay) {
                                    var w = that.cellWidth - (element.x - firstCellPositionLeft);
                                    var hostLeft = that.host.coord().left;
                                    if (x - hostLeft >= element.x && x - hostLeft <= element.x + w + 2) {
                                        feedback[0].style.left = left + "px";
                                        feedback[0].style.width = element.width + "px";
                                        resizeFromSet = true;
                                    }
                                }
                            }
                            else if (positionTop > firstCellPositionTop) {
                                feedback[0].style.left = left + "px";
                                feedback[0].style.width = element.width + "px";
                            }
                            else if (positionTop < firstCellPositionTop) {
                                feedback[0].style.left = viewLeft;
                                feedback[0].style.width = element.x + element.width - parseInt(viewLeft) + "px";
                            }
                        }
                            // handle the cursor position below the first element.
                        else if (feedbackTop == positionTop) {
                            feedback[0].style.width = monthWidth - position.left + parseInt(viewLeft) + "px";
                            feedback[0].style.left = position.left + "px";
                        }

                        // hide feedbacks below last element.
                        if (feedbackTop > lastCellPositionTop) {
                            feedback[0].style.display = "none";
                        }

                        // hide feedbacks above cursor.
                        if (feedbackTop < positionTop) {
                            feedback[0].style.display = "none";
                        }

                        if (positionTop >= lastCellPositionTop) {
                            for (var j = 0; j < elements.length; j++) {
                                var top = elements[j].cellY;
                                if (positionTop > lastCellPositionTop || (positionTop == lastCellPositionTop && positionLeft > lastCellPositionLeft)) {
                                    if (top == feedbackTop) {
                                        feedback[0].style.display = "block";
                                        feedback[0].style.width = elements[j].width + "px";
                                        feedback[0].style.left = elements[j].x + "px";
                                    }
                                }
                                else if (positionTop == lastCellPositionTop && positionLeft <= lastCellPositionLeft) {
                                    if (firstCellPositionTop != lastCellPositionTop) {
                                        feedback[0].style.width = elements[j].width - position.left + parseInt(viewLeft) + "px";
                                    }
                                }
                            }
                        }
                    }

                    var newDate = new $.jqx.date(td.getAttribute('data-date'), that.timeZone);
                    if (newDate < that.selectedJQXAppointment.to && !resizeFromSet) {
                        that.resizeFrom = newDate;
                    }
                    else {
                        that.resizeFrom = that.selectedJQXAppointment.from;
                    }
                }
                    // RESIZE RIGHT
                else if (that.rightResize) {
                    var resizeToSet = false;
                    for (var i = 0; i < 6; i++) {
                        var feedback = that.feedbacks[i];
                        var feedbackTop = parseInt(feedback[0].style.top) - topOffset;
                        var feedbackLeft = parseInt(feedback[0].style.left);
                        // full row width for elements above cursor.
                        if (feedbackTop < positionTop) {
                            feedback[0].style.width = monthWidth + "px";
                        }

                        for (var j = 0; j < elements.length; j++) {
                            var top = elements[j].cellY;
                            if (top == feedbackTop) {
                                feedback[0].style.top = elements[j].y + "px";
                            }
                        }

                        // handle the feedback for the first element.
                        var element = elements[0];
                        var left = parseInt(element.x);

                        // handle first element's feedback.
                        if (feedbackTop == firstCellPositionTop) {
                            feedback[0].style.left = left + "px";
                            if (positionTop == firstCellPositionTop) {
                                if (positionLeft >= firstCellPositionLeft) {
                                    feedback[0].style.width = positionLeft + tdWidth - left - 5 + "px";
                                    if (viewObject.appointmentsRenderMode == "exactTime" && !that.selectedJQXAppointment.allDay) {
                                        var hostLeft = that.host.coord().left;
                                        if (x - hostLeft >= lastCellPositionLeft && x - hostLeft <= element.x + element.width + 15) {
                                            feedback[0].style.width = element.width + "px";
                                            resizeToSet = true;
                                        }
                                    }
                                }
                                else {
                                    feedback[0].style.width = element.width + "px";
                                }
                            }
                            else if (positionTop < firstCellPositionTop) {
                                feedback[0].style.left = left + "px";
                                feedback[0].style.width = element.width + "px";
                            }
                            else if (positionTop > firstCellPositionTop) {
                                feedback[0].style.left = left + "px";
                                feedback[0].style.width = monthWidth - left + parseInt(viewLeft) + "px";
                            }
                        }
                            // handle the cursor position below the first element.
                        else if (feedbackTop == positionTop) {
                            feedback[0].style.width = positionLeft + tdWidth - 5 - parseInt(viewLeft) + "px";
                        }

                        // hide feedbacks above first element.
                        if (feedbackTop < firstCellPositionTop) {
                            feedback[0].style.display = "none";
                        }

                        // hide feedbacks below cursor and after the first element.
                        if (feedbackTop > positionTop && feedbackTop > firstCellPositionTop) {
                            feedback[0].style.display = "none";
                        }

                        if (positionTop <= firstCellPositionTop) {
                            for (var j = 0; j < elements.length; j++) {
                                var top = elements[j].cellY;
                                if (positionTop < firstCellPositionTop || (positionTop == firstCellPositionTop && positionLeft < firstCellPositionLeft)) {
                                    if (top == feedbackTop) {
                                        feedback[0].style.display = "block";
                                        feedback[0].style.width = elements[j].width + "px";
                                    }
                                }
                            }
                        }
                    }

                    var newDate = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(td.getAttribute('data-date'), that.timeZone));
                    if (newDate > that.selectedJQXAppointment.from && !resizeToSet) {
                        that.resizeTo = newDate;
                    }
                    else {
                        that.resizeTo = that.selectedJQXAppointment.to;
                    }

                }

            } // RTL
            else {
                if (that.leftResize) {
                    var resizeToSet = false;
                    for (var i = 0; i < 6; i++) {
                        var feedback = that.feedbacks[i];
                        var feedbackTop = parseInt(feedback[0].style.top) - topOffset;
                        var feedbackLeft = parseInt(feedback[0].style.left);
                        // full row width for elements above cursor.
                        if (feedbackTop < positionTop) {
                            feedback[0].style.width = monthWidth + "px";
                        }
                        else {
                            for (var j = 0; j < elements.length; j++) {
                                var top = elements[j].cellY;
                                if (top == feedbackTop) {
                                    feedback[0].style.width = elements[j].width + "px";
                                    feedback[0].style.top = elements[j].y + "px";
                                }
                            }
                        }
                        // handle the feedback for the first element.
                        var element = elements[0];
                        var left = parseInt(element.x);

                        // handle first element's feedback.
                        if (feedbackTop == firstCellPositionTop) {
                            feedback[0].style.left = left + "px";
                            if (positionTop == firstCellPositionTop) {
                                feedback[0].style.left = 1 + position.left + "px";
                                feedback[0].style.width = -1 + element.x + element.width - position.left + "px";
                                if (position.left > element.x + element.width) {
                                    feedback[0].style.width = element.width + "px";
                                    feedback[0].style.left = element.x + "px";
                                }

                                if (viewObject.appointmentsRenderMode == "exactTime" && !that.selectedJQXAppointment.allDay) {
                                    var hostLeft = that.host.coord().left;
                                    if (x - hostLeft >= element.x - 10 && x - hostLeft <= element.cellX + that.cellWidth) {
                                        feedback[0].style.width = element.width + "px";
                                        feedback[0].style.left = element.x + "px";
                                        resizeToSet = true;
                                    }
                                }
                            }
                            else if (positionTop < firstCellPositionTop) {
                                feedback[0].style.left = left + "px";
                                feedback[0].style.width = element.width + "px";
                            }
                            else if (positionTop > firstCellPositionTop) {
                                feedback[0].style.left = viewLeft;
                                feedback[0].style.width = element.x + element.width - parseInt(viewLeft) + "px";
                            }
                        }
                            // handle the cursor position below the first element.
                        else if (feedbackTop == positionTop) {
                            feedback[0].style.width = monthWidth - position.left + parseInt(viewLeft) + "px";
                            feedback[0].style.left = position.left + "px";
                        }

                        // hide feedbacks above last element.
                        if (feedbackTop < firstCellPositionTop) {
                            feedback[0].style.display = "none";
                        }

                        // hide feedbacks below cursor.
                        if (feedbackTop > positionTop) {
                            feedback[0].style.display = "none";
                        }


                        if (positionTop < firstCellPositionTop) {
                            for (var j = 0; j < elements.length; j++) {
                                var top = elements[j].cellY;
                                if (top == feedbackTop) {
                                    feedback[0].style.display = "block";
                                    feedback[0].style.width = elements[j].width + "px";
                                    feedback[0].style.left = elements[j].x + "px";
                                }
                            }
                        }

                        if (positionTop == firstCellPositionTop) {
                            for (var j = 0; j < elements.length; j++) {
                                var top = elements[j].cellY;
                                if (positionTop < firstCellPositionTop || (positionTop == firstCellPositionTop)) {
                                    if (top == feedbackTop && firstCellPositionTop != lastCellPositionTop) {
                                        //  feedback[0].style.display = "block";
                                        feedback[0].style.left = 1 + position.left + parseInt(viewLeft) + "px";
                                        if (1 + position.left + parseInt(viewLeft) > element.x + element.width) {
                                            feedback[0].style.left = element.x + "px";
                                        }

                                        feedback[0].style.width = -1 + element.x + element.width - position.left + "px";

                                    }
                                }
                            }
                        }
                    }

                    var newDate = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(td.getAttribute('data-date'), that.timeZone));
                    if (newDate > that.selectedJQXAppointment.from && !resizeToSet) {
                        that.resizeTo = newDate;
                    }
                    else {
                        that.resizeTo = that.selectedJQXAppointment.to;
                    }
                }
                    // RESIZE RIGHT
                else if (that.rightResize) {
                    var resizeFromSet = false;
                    for (var i = 0; i < 6; i++) {
                        var feedback = that.feedbacks[i];
                        var feedbackTop = parseInt(feedback[0].style.top) - topOffset;
                        var feedbackLeft = parseInt(feedback[0].style.left);
                        // full row width for elements above cursor.
                        if (feedbackTop < positionTop) {
                            feedback[0].style.width = monthWidth + "px";
                        }

                        for (var j = 0; j < elements.length; j++) {
                            var top = elements[j].cellY;
                            if (top == feedbackTop) {
                                feedback[0].style.top = elements[j].y + "px";
                            }
                        }

                        // handle the feedback for the first element.
                        var element = elements[0];
                        var left = parseInt(element.x);

                        // handle first element's feedback.
                        if (feedbackTop == firstCellPositionTop) {
                            feedback[0].style.left = left + "px";
                            if (positionTop == firstCellPositionTop) {
                                if (positionLeft >= firstCellPositionLeft) {
                                    feedback[0].style.width = positionLeft + tdWidth - left - 5 + "px";
                                    if (viewObject.appointmentsRenderMode == "exactTime" && !that.selectedJQXAppointment.allDay) {
                                        var hostLeft = that.host.coord().left;
                                        if (x - hostLeft >= element.lastCellX && x - hostLeft <= element.x + element.width + 15) {
                                            feedback[0].style.width = element.width + "px";
                                            resizeFromSet = true;
                                        }
                                    }
                                }
                                else {
                                    feedback[0].style.width = element.width + "px";
                                }
                            }
                            else if (positionTop > firstCellPositionTop) {
                                feedback[0].style.left = left + "px";
                                feedback[0].style.width = element.width + "px";
                            }
                            else if (positionTop < firstCellPositionTop) {
                                feedback[0].style.left = left + "px";
                                feedback[0].style.width = monthWidth - left + parseInt(viewLeft) + "px";
                            }
                        }
                            // handle the cursor position below the first element.
                        else if (feedbackTop == positionTop) {
                            feedback[0].style.width = positionLeft + tdWidth - 5 - parseInt(viewLeft) + "px";
                        }

                        // hide feedbacks below last element.
                        if (feedbackTop > lastCellPositionTop) {
                            feedback[0].style.display = "none";
                        }

                        // hide feedbacks below cursor and after the first element.
                        if (feedbackTop < positionTop) {
                            feedback[0].style.display = "none";
                        }

                        if (positionTop > lastCellPositionTop) {
                            for (var j = 0; j < elements.length; j++) {
                                var top = elements[j].cellY;
                                if (top == feedbackTop) {
                                    feedback[0].style.display = "block";
                                }
                                if (feedbackTop == lastCellPositionTop) {
                                    feedback[0].style.width = elements[j].width + "px";
                                    feedback[0].style.left = elements[j].x + "px";
                                }
                            }
                        }

                        if (positionTop <= lastCellPositionTop) {
                            if (feedbackTop == lastCellPositionTop) {
                                for (var j = 0; j < elements.length; j++) {
                                    var top = elements[j].cellY;

                                    if (feedbackTop != positionTop && top == feedbackTop && firstCellPositionTop != lastCellPositionTop) {
                                        feedback[0].style.width = elements[j].width + "px";
                                        feedback[0].style.left = elements[j].x + "px";
                                    }
                                    else if (feedbackTop == positionTop && top == feedbackTop && firstCellPositionTop != lastCellPositionTop) {
                                        feedback[0].style.left = elements[j].x + "px";
                                        feedback[0].style.width = positionLeft + tdWidth - 5 - parseInt(viewLeft) - elements[j].x + "px";
                                    }
                                }
                            }
                        }
                    }

                    var newDate = new $.jqx.date(td.getAttribute('data-date'), that.timeZone);
                    if (newDate < that.selectedJQXAppointment.to && !resizeFromSet) {
                        that.resizeFrom = newDate;
                    }
                    else {
                        that.resizeFrom = that.selectedJQXAppointment.from;
                    }
                }
            }

            var visibleFeedbacks = new Array();
            for (var i = 0; i < 6; i++) {
                var feedback = that.feedbacks[i];

                if (feedback[0].style.display == "block") {
                    visibleFeedbacks.push(feedback);
                }
            }

            $.each(visibleFeedbacks, function (index) {
                if (!that.rtl) {
                    if (index > 0) {
                        $(this).find(".jqx-scheduler-appointment-left-resize-indicator")[0].style.visibility = "hidden";
                    }
                    if (index < visibleFeedbacks.length - 1) {
                        $(this).find(".jqx-scheduler-appointment-right-resize-indicator")[0].style.visibility = "hidden";
                    }
                }
                else {
                    if (index > 0) {
                        $(this).find(".jqx-scheduler-appointment-right-resize-indicator")[0].style.visibility = "hidden";
                    }
                    if (index < visibleFeedbacks.length - 1) {
                        $(this).find(".jqx-scheduler-appointment-left-resize-indicator")[0].style.visibility = "hidden";
                    }
                }
            });
        },

        _handleTimelineDayWeekViewResize: function (x, y, td, position, appointment)
        {
            var that = this;
            var view = that._views[that._view].type;
            var viewObject = that._views[that._view];
            var minutes = that.getMinutesPerScale();
            var validateWidth = function (width) {
                if (width < 10)
                    return false;
                return true;
            }
            var sameRowTD = that.findCell(x, that.feedback.coord().top);

            if (that.leftResize) {
                if (!that._lastResizeX) {
                    that._lastResizeX = that.mouseDownPosition.left;
                }

                if (x > that._lastResizeX + $(td).width() / 2) {
                    var newWidth = that.selectedAppointmentTableBounds.width + that.selectedAppointmentTableBounds.left - position.left - $(td).width();
                    if (validateWidth(newWidth)) {
                        that.feedback.css('left', 2 + position.left + $(td).width());
                        that.feedback.width(newWidth);
                        that._lastResizeX = that.feedback.coord().left;
                        if (!that.rtl) {
                            that.resizeFrom = new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone).addMinutes(minutes);
                        }
                        else {
                            that.resizeTo = new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone);
                        }
                    }
                }
                else if (x < that._lastResizeX - $(td).width() / 2) {
                    var newWidth = that.selectedAppointmentTableBounds.width + that.selectedAppointmentTableBounds.left - position.left;
                    if (validateWidth(newWidth)) {
                        that.feedback.css('left', 2 + position.left);
                        that.feedback.width(newWidth);
                        that._lastResizeX = that.feedback.coord().left;
                        if (!that.rtl) {
                            that.resizeFrom = new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone);
                        }
                        else {
                            that.resizeTo = new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone).addMinutes(minutes);;
                        }
                    }
                }
            }
            else if (that.rightResize) {
                if (!that._lastResizeX) {
                    that._lastResizeX = that.mouseDownPosition.left;
                }

                if (x > that._lastResizeX + $(td).width() / 2) {
                    var offset = $(td).width() + position.left - that.selectedAppointmentTableBounds.width - that.selectedAppointmentTableBounds.left;
                    var newWidth = that.selectedAppointmentTableBounds.width + offset;
                    if (validateWidth(newWidth)) {
                        that.feedback.width(newWidth);
                        that._lastResizeX = that.selectedAppointmentTableBounds.width + offset + that.feedback.coord().left;
                        if (!that.rtl) {
                            that.resizeTo = new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone).addMinutes(minutes);
                        }
                        else {
                            that.resizeFrom = new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone);
                        }
                    }
                }
                else if (x < that._lastResizeX - $(td).width() / 2) {
                    var offset = position.left - that.selectedAppointmentTableBounds.width - that.selectedAppointmentTableBounds.left;
                    var newWidth = that.selectedAppointmentTableBounds.width + offset;
                    if (validateWidth(newWidth)) {
                        that.feedback.width(newWidth);
                        that._lastResizeX = that.selectedAppointmentTableBounds.width + offset + that.feedback.coord().left;
                        if (!that.rtl) {
                            that.resizeTo = new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone);
                        }
                        else {
                            that.resizeFrom = new $.jqx.date(sameRowTD.getAttribute('data-date'), that.timeZone).addMinutes(minutes);
                        }
                    }
                }
            }
        },

        _handleResize: function (x, y, td, position, appointment) {
            var that = this;
            var view = that._views[that._view].type;
            var viewObject = that._views[that._view];

            if (view === "dayView" || view === "weekView") {
                that._handleDayWeekViewResize(x, y, td, position, appointment);
            }
            else if (view === "timelineMonthView") {
                that._handleTimelineMonthViewResize(x, y, td, position, appointment);
            }
            else if (view === "monthView") {
                that._handleMonthViewResize(x, y, td, position, appointment);
            }
            else if (view === "timelineDayView" || view === "timelineWeekView") {
                that._handleTimelineDayWeekViewResize(x, y, td, position, appointment);
            }

            if (view === "timelineDayView" || view === "timelineMonthView" || view === "timelineWeekView") {
                clearInterval(that._horizontalIntervalDrag);
                that._horizontalIntervalDrag = setInterval(function () {
                    var tablewdith = that.host.width();
                    var tableLeft = that.host.coord().left;
                    var view_left = tableLeft + 25;
                    var view_right = tablewdith + view_left - 45;
                    if (!that.rtl) {
                        if (x < view_left) {
                            that.hScrollInstance.setPosition(that.hScrollInstance.value - 5);
                        }
                        else if (x > view_right) {
                            that.hScrollInstance.setPosition(that.hScrollInstance.value + 5);
                        }
                    }
                    else {
                        if (x > view_right) {
                            that.hScrollInstance.setPosition(that.hScrollInstance.value - 5);
                        }
                        else if (x < view_left) {
                            that.hScrollInstance.setPosition(that.hScrollInstance.value + 5);
                        }
                    }
                }, 5);
            }
            else if (view === "dayView" || view === "weekView") {
                clearInterval(that._intervalDrag);
                that._intervalDrag = setInterval(function () {
                    var tableheight = that.host.height();
                    var headerHeight = 0;
                    if (!that.columnGroups) {
                        headerHeight += that.showHeader ? that.columnsHeight : 0;
                    }
                    else {
                        headerHeight += that.showHeader ? that.columnsheader.height() : 0;
                    }

                    if (that.showToolbar) {
                        headerHeight += that.toolbarHeight;
                    }

                    tableheight -= headerHeight;
                    var legendHeight = that.legendHeight;
                    if (that._resources.length == 0) {
                        legendHeight = 0;
                    }

                    if (that.showLegend) {
                        tableheight -= legendHeight;
                    }

                    var tableTop = headerHeight + that.host.coord().top;
                    var showAllDayRow = that.showAllDayRow;
                    if (viewObject.timeRuler && (view === "dayView" || view === "weekView")) {
                        if (viewObject.timeRuler.showAllDayRow != undefined) {
                            showAllDayRow = viewObject.timeRuler.showAllDayRow;
                        }
                    }

                    var allDayAppointment = appointment.duration().days() >= 1 || appointment.allDay;
                    if (showAllDayRow && allDayAppointment)
                        tableTop -= 20;
                    else
                        if (showAllDayRow && that.resizing) {
                            tableTop += $(that.table[0].rows[0]).height();
                            tableheight -= $(that.table[0].rows[0]).height();
                        }

                    var view_top = tableTop + 25;
                    var view_bottom = tableheight + view_top - 45;
                    if (y < view_top) {
                        that.vScrollInstance.setPosition(that.vScrollInstance.value - 5);
                    }
                    else if (y > view_bottom) {
                        that.vScrollInstance.setPosition(that.vScrollInstance.value + 5);
                    }
                }, 5);
            }

            that.resizing = true;
        },

        _startTimers: function (x, y, appointment) {
            var that = this;
            var coord = that.host.coord();
            var velocity = 0;
            var vvelocity = 0;
            if (that.hScrollInstance.element.style.visibility != "hidden") {
                clearInterval(that._horizontalIntervalDragVelocity);
                that._horizontalIntervalDragVelocity = setInterval(function () {
                    velocity++;
                    if (velocity > 40)
                        velocity = 40;
                }, 100);

                clearInterval(that._horizontalIntervalDrag);
                that._horizontalIntervalDrag = setInterval(function () {
                    var tablewdith = that._hostWidth;
                    var tableLeft = coord.left;
                    var view_left = tableLeft + 30;
                    var view_right = tablewdith + view_left - 60;
                    if (!that.rtl) {
                        if (x < view_left) {
                            that.hScrollInstance.setPosition(that.hScrollInstance.value - 10 - velocity);
                        }
                        else if (x > view_right) {
                            that.hScrollInstance.setPosition(that.hScrollInstance.value + 10 + velocity);
                        }
                        else velocity = 0;
                    }
                    else {
                        if (x < view_left) {
                            that.hScrollInstance.setPosition(that.hScrollInstance.value + 10 + velocity);
                        }
                        else if (x > view_right) {
                            that.hScrollInstance.setPosition(that.hScrollInstance.value - 10 - velocity);
                        }
                        else velocity = 0;
                    }
                }, 10);
            }
            if (that.vScrollInstance.element.style.visibility != "hidden") {
                clearInterval(that._verticalIntervalDragVelocity);
                that._verticalIntervalDragVelocity = setInterval(function () {
                    vvelocity++;
                    if (vvelocity > 40)
                        vvelocity = 40;
                }, 100);

                clearInterval(that._intervalDrag);
                that._intervalDrag = setInterval(function () {
                    var tableheight = that._hostHeight;
                    var headerHeight = 0;
                    if (!that.columnGroups) {
                        headerHeight += that.showHeader ? that.columnsHeight : 0;
                    }
                    else {
                        headerHeight += that.showHeader ? that.columnsheader.height() : 0;
                    }
                    var view = that._views[that._view].type;
                    var viewObject = that._views[that._view];
                    
                    if (that.showToolbar) {
                        headerHeight += that.toolbarHeight;
                    }

                    tableheight -= headerHeight;

                    if (that.showLegend && that._resources.length > 0) {
                        tableheight -= that.legendHeight;
                    }

                    var widgetTop = coord.top;
                    var tableTop = headerHeight + widgetTop;
                    if (view == "dayView" || view == "weekView") {
                        var showAllDayRow = that.showAllDayRow;
                        if (viewObject.timeRuler && (view === "dayView" || view === "weekView")) {
                            if (viewObject.timeRuler.showAllDayRow != undefined) {
                                showAllDayRow = viewObject.timeRuler.showAllDayRow;
                            }
                        }

                        var allDayAppointment = appointment.duration().days() >= 1 || appointment.allDay;
                        if (showAllDayRow && allDayAppointment)
                            tableTop -= 20;
                        else
                            if (showAllDayRow && that.resizing) {
                                 tableTop += $(that.table[0].rows[0]).height();
                            }
                    }

                    var view_top = tableTop + 30;
                    var view_bottom = widgetTop + tableheight + headerHeight - 30;
                    if (y < view_top) {
                        that.vScrollInstance.setPosition(that.vScrollInstance.value - 10 - vvelocity);
                    }
                    else if (y > view_bottom) {
                        that.vScrollInstance.setPosition(that.vScrollInstance.value + 10 + vvelocity);
                    }
                    else vvelocity = 0;
                }, 10);
            }
        },

        _hoverCell: function (cell) {
            var that = this;

            if (!that.enableHover) {
                return true;
            }

            if (that._resources.length > 0) {
                if (cell.className.indexOf('pinned') >= 0) {
                    return true;
                }
            }
            if (cell.className.indexOf('time-column') >= 0) {
                return true;
            }

            if (cell.className.indexOf('jqx-scheduler-disabled-cell') >= 0) {
                return true;
            }
            if (cell && cell == that.hoveredCell)
            {
                return true;
            }

            that.hoveredCell = cell;
            if (!cell) {
                return true;
            }
            that._removeHoveredCell();
            that.hoveredCell = cell;
            cell.className += " " + that.toTP('jqx-fill-state-hover') + " " + that.toTP('jqx-grid-cell-hover') + " " + that.toTP('jqx-scheduler-cell-hover');
            cell.jqxClassName = cell.className;
        },

        _removeHoveredCell: function () {
            var that = this;
            if (that.hoveredCell) {
                var cell = that.hoveredCell;
                var removeHoverState = function (cells) {
                    var className = cell.className;
                    className = className.replace(" " + that.toTP('jqx-fill-state-hover'), "");
                    className = className.replace(" " + that.toTP('jqx-grid-cell-hover'), "");
                    className = className.replace(" " + that.toTP('jqx-scheduler-cell-hover'), "");
                    cell.className = className;
                    cell.jqxClassName = className;
                }
                removeHoverState(cell);
            }
            that.hoveredCell = null;
        },

    _addHandlers: function () {
        var that = this;
        this._mousewheelfunc = this._mousewheelfunc || function (event) {
            that.wheel(event, that);
            return false;
        };

        this.focused = false;
        var focusBack = false;
        this.addHandler($(document), 'keydown.scheduler' + that.element.id, function (event) {
            focusBack = false;
            if (event.keyCode === 9 && event.shiftKey && !that.focused) {
                focusBack = true;
            }
        });
        this.addHandler(this.host, 'focus', function (event) {
            if (that.focusedCell && !that.selectedAppointment && !focusBack) {
                $(that.focusedCell).addClass(that.toThemeProperty('jqx-scheduler-cell-focus'));
            }
            that.focused = true;
            if (focusBack) {
                if (that.appointmentsToRender.length > 0) {
                    var jqxAppointment = that.appointmentsToRender[that.appointmentsToRender.length - 1];
                    that._selectAppointment(jqxAppointment);
                    that._lastSelectedAppointment = jqxAppointment;
                }
                else
                    if (!that.focusedCell) {
                        that._updateFocusedCell();
                    }
                    else if (that.focusedCell) {
                        if (that.focusedCell.className.indexOf('-focus') == -1) {
                            that._updateCellsSelection();
                            return false;
                        }
                    }
            }
        });
        this.addHandler(this.host, 'blur', function (event) {
            if (that.focusedCell) {
                if (document.activeElement == that.element)
                    return true;

                if ($(document.activeElement).ischildof(that.host)) {
                    return true;
                }
                $(that.focusedCell).removeClass(that.toThemeProperty('jqx-scheduler-cell-focus'));
                that.focused = false;
            }
        });


        this.addHandler(this.host, 'dragstart.' + this.element.id, function (event) {
            return false;
        });
        this.addHandler(this.host, 'selectstart.' + this.element.id, function (event) {
            if (that.enableBrowserSelection) {
                return true;
            }

            if (that.showToolBar) {
                if ($(event.target).ischildof(that.toolbar)) {
                    return true;
                }
            }

            if (that.rowDetails) {
                if ($(event.target).parents('[data-role=details]').length > 0) {
                    return true;
                }
            }

            if (undefined == that.editKey) {
                return false;
            }
        });

        this.addHandler($(window), 'jqxReady.' + this.element.id,
        function () {
//            that._updatecolumnwidths();
//            that.refresh();
        });

        this.removeHandler(this.host, 'mousewheel', this._mousewheelfunc);
        this.addHandler(this.host, 'mousewheel', this._mousewheelfunc);
        var isTouch = this.isTouchDevice();
     
        this.vScrollInstance.valueChanged = function (params) {
            if (that._timer) {
                clearTimeout(that._timer);
            }

            if (isTouch)
            {
                if (that.table)
                {
                    that.table[0].style.top = 0 - that.vScrollInstance.value + 'px';
                }
            }
            else
            {
                that._timer = setTimeout(function ()
                {
                    if (that.table)
                    {
                        that.table[0].style.top = 0 - that.vScrollInstance.value + 'px';
                    }
                }, 1);
            }
        }
        this.hScrollInstance.valueChanged = function (params) {
            if (that._htimer) {
                clearTimeout(that._htimer);
            }
            if (isTouch)
            {
                if (that.table)
                {
                    that._renderhorizontalscroll();
                }
            }
            else
            {
                that._htimer = setTimeout(function ()
                {
                    if (that.table)
                    {
                        that._renderhorizontalscroll();
                    }
                }, 1);
            }
        }

        var eventname = 'mousedown';
        if (this.isTouchDevice()) {
            eventname = $.jqx.mobile.getTouchEventName('touchstart');
            if ($.jqx.browser.msie && $.jqx.browser.version < 10) {
                eventname = 'mousedown';
            }
        }

        this.addHandler(this.table, 'mouseleave', function (event) {
            that._removeHoveredCell();
        });

        if (that.isTouchDevice()) {
            that.enableHover = false;
        }

        var mousemove = 'mousemove.scheduler' + this.element.id;
        var mouseup = "mouseup.scheduler" + this.element.id;
        if (this.isTouchDevice() && this.touchMode !== true) {
            mousemove = $.jqx.mobile.getTouchEventName('touchmove') + '.scheduler' + this.element.id;
            mouseup = $.jqx.mobile.getTouchEventName('touchend') + '.scheduler' + this.element.id;
        }

        this.addHandler($(document), mousemove, function (event) {
            var x = event.pageX;
            var y = event.pageY;
            if (that.isTouchDevice()) {
                var position = $.jqx.position(event);
                x = position.left;
                y = position.top;
                if (isNaN(x) || isNaN(y)) {
                    var position = $.jqx.position(event.originalEvent);
                    x = position.left;
                    y = position.top;
                }
            }
            if (that.disabled || event.which === 3) {
                return true;
            }

            if (!that.isMouseDown) {
                return true;
            }

            if (that.hScrollInstance.isScrolling() || that.vScrollInstance.isScrolling()) {
                return true;
            }

            if (that._hostWidth) {
                var hostOffset = that.host.coord();
                if (hostOffset.left + that._hostWidth < x || x < hostOffset.left)
                    return true;
                if (hostOffset.top + that._hostHeight < y || y < hostOffset.top)
                    return true;
            }

            if (that.mouseDownPosition) {
                if ((Math.abs(that.mouseDownPosition.left - x) >= 3 && Math.abs(that.mouseDownPosition.left - x) <= 10) || (Math.abs(that.mouseDownPosition.top - y) >= 3 && Math.abs(that.mouseDownPosition.top - y) <= 10)) {
                    that.dragOrResize = true;
                }
            }


            if (that.selectedAppointment && that.dragOrResize) {
                var appointment = null;
                if (that._hasOpenedMenu)
                    return true;

                if (that.editRecurrenceDialog.jqxWindow('isOpen'))
                    return true;

                var view = that._views[that._view].type;
                var viewObject = that._views[that._view];

                var allDayAppointment = false;

                if (event.target.nodeName.toLowerCase() === "td") {
                    var td = event.target;
                }
                else {
                    var td = that.findCell(x, y);
                }
                if (!td) {
                    return true;
                }

                if (td.getAttribute('data-time-slot') != undefined)
                    return true;

                if (td.className.indexOf('jqx-grid-cell-pinned') >= 0)
                    return true;

                if (!that.feedback) {
                    appointment = that.getJQXAppointmentByElement(that.selectedAppointment);
               
                    if (!appointment.draggable && !appointment.resizable) {
                        appointment = null;
                        return true;
                    }

                    if (that.beginDrag) {
                        var canDrag = that.beginDrag(appointment);
                        if (!canDrag)
                            return true;
                    }
                
                    var appointments = $('[data-key="' + appointment.id + '"]');
                    var coord = that.selectedAppointment.position();

                    that.feedback = that.selectedAppointment.clone(true);
                    that.pinnedfeedback = that.selectedAppointment.clone(true);
                    var notResizable = !(that.selectedAppointment[0].style.cursor == "row-resize" || that.selectedAppointment[0].style.cursor == "col-resize" || that.resizing);

                    var createFeedback = function (feedback) {
                        if (notResizable) {
                            feedback.find(".jqx-scheduler-appointment-resize-indicator").hide();
                        }
                        appointments.addClass(that.toTP('jqx-scheduler-feedback-appointment jqx-disableselect'));
                        feedback.find(".jqx-scheduler-appointment-duration-status").hide();
                        feedback.addClass(that.toTP('jqx-scheduler-feedback-appointment'));
                        feedback.addClass(that.toTP('jqx-scheduler-feedback-drag-appointment'));
                        if (!notResizable) {
                            feedback.css('z-index', 400);
                        }
                        else {
                            feedback.css('z-index', 401);
                        }
                    }
                    createFeedback(that.feedback);
                    createFeedback(that.pinnedfeedback);

                    if (that._views[that._view].type != "monthView" || notResizable) {
                        that.table.append(that.feedback);
                        if (that.tableRows == 1) {
                            that.pinnedtable.append(that.pinnedfeedback);
                        }
                        else {
                            that.table.append(that.pinnedfeedback);
                        }

                        that.feedback.css('left', coord.left);
                        that.feedback.css('top', coord.top);
                        that.pinnedfeedback.css('left', coord.left);
                        that.pinnedfeedback.css('top', coord.top);

                        if (that._views[that._view].type == "monthView" && that.isTouchDevice()) {
                            that.feedbacks = new Array();
                            for (var i = 0; i < 6; i++) {
                                that.feedbacks.push(that.feedback.clone(true));
                                $(that.feedbacks[i]).hide();
                                that.table.append($(that.feedbacks[i]));
                            }
                        }
                    }
                    else {
                        that.feedbacks = new Array();
                        for (var i = 0; i < 6; i++) {
                            that.feedbacks.push(that.feedback.clone(true));
                            $(that.feedbacks[i]).hide();
                            that.table.append($(that.feedbacks[i]));
                        }
                    }
                }

                if (that.dragging) {
                    var canDrag = that.dragging(appointment, td, that.feedback);
                    if (false === canDrag)
                        return true;

                }

                var position = $(td).position();
                if (that.endDrag) {
                    var oldLeft = that.feedback.css('left');
                    var oldTop = that.feedback.css('top');
                    var oldWidth = that.feedback.width();
                    var oldHeight = that.feedback.height;
                }
                if (!appointment) {
                    appointment = that.selectedJQXAppointment;
                }
                if (!appointment) {
                    that.selectAppointment(that.uiappointments[0].id);
                    appointment = that.selectedJQXAppointment;
                }
                var resourceId = appointment.resourceId;
                var resourceIndex = that._resources.indexOf(resourceId);
                if (that.resources && that.resources.orientation == "none")
                    resourceIndex = -1;

                var resizeOnTouch = false;
                var touchDevice = that.isTouchDevice();
                if (touchDevice && that.touchMode !== true && that._dragCell == null && !(that.leftResize || that.rightResize || that.topResize || that.bottomResize || that.resizing)) {
                    switch (view) {
                        case "dayView":
                        case "weekView":
                            var allDayAppointment = appointment.duration().days() >= 1 || appointment.allDay;
                            if (!allDayAppointment) {
                                if (y >= that.selectedAppointmentBounds.top - 15 && y <= that.selectedAppointmentBounds.top + 15) {
                                    resizeOnTouch = true;
                                    that.topResize = true;
                                }
                                if (y >= that.selectedAppointmentBounds.top - 15 + that.selectedAppointmentBounds.height && y <= that.selectedAppointmentBounds.top + that.selectedAppointmentBounds.height + 15) {
                                    resizeOnTouch = true;
                                    that.bottomResize = true;
                                }
                            }
                            else {
                                if (x >= that.selectedAppointmentBounds.left - 15 && x <= that.selectedAppointmentBounds.left + 15) {
                                    resizeOnTouch = true;
                                    that.leftResize = true;
                                }
                                if (x >= that.selectedAppointmentBounds.left + that.selectedAppointmentBounds.width - 15 && x <= that.selectedAppointmentBounds.left + that.selectedAppointmentBounds.width + 15) {
                                    resizeOnTouch = true;
                                    that.rightResize = true;
                                }
                            }
                            break;
                        default:
                            if (x >= that.selectedAppointmentBounds.left - 15 && x <= that.selectedAppointmentBounds.left + 15) {
                                resizeOnTouch = true;
                                that.leftResize = true;
                            }
                            if (x >= that.selectedAppointmentBounds.left + that.selectedAppointmentBounds.width - 15 && x <= that.selectedAppointmentBounds.left + that.selectedAppointmentBounds.width + 15) {
                                resizeOnTouch = true;
                                that.rightResize = true;
                            }

                            break;
                    }
                }

                if (touchDevice && (that.leftResize || that.rightResize || that.topResize || that.bottomResize || that.resizing) || resizeOnTouch) {
                    if (td.getAttribute('data-view') != resourceIndex + 1 && that._resources.length > 0) {
                        if (that.resources.orientation != "none")
                            return true;
                    }

                    var cellDate = that._getDateByString(td.getAttribute("data-date"));
                    if (cellDate < that.min.toDate() || cellDate > that.max.toDate())
                        return;

                    that._handleResize(x, y, td, position, appointment);

                    that._oldResizeTD = td;
                }
                else if (!touchDevice && that.selectedAppointment[0].style.cursor == "row-resize" || that.selectedAppointment[0].style.cursor == "col-resize" || that.resizing) {
                    if (td.getAttribute('data-view') != resourceIndex + 1 && that._resources.length > 0) {
                        if (that.resources && that.resources.orientation != "none")
                            return true;
                    }

                    var cellDate = that._getDateByString(td.getAttribute("data-date"));
                    if (cellDate < that.min.toDate() || cellDate > that.max.toDate())
                        return;

                    that._handleResize(x, y, td, position, appointment);

                    that._oldResizeTD = td;
                }
                else {
                    if (!appointment.draggable) {
                        that._removeFeedbackAndStopResize();
                        return true;
                    }

                    if (that._dragCell == td) {
                        that._startTimers(x, y, appointment);
                        if (that.isTouchDevice() && that.touchMode !== true) {
                            event.stopPropagation();
                            return false;
                        }
                        else {
                            return;
                        }
                    }

                    var cellDate = that._getDateByString(td.getAttribute("data-date"));
                    if (cellDate < that.min.toDate() || cellDate > that.max.toDate()) {
                        return;
                    }

                    var duration = appointment.duration();
                    if (view.indexOf('month') >= 0 && new $.jqx.date(cellDate).add(duration) > that.max) {
                        return;
                    }

                    var scrollWidth = that.vScrollBar[0].style.visibility == "hidden" ? 0 : 6 + that.vScrollBar.outerWidth();
                    that._dragCell = td;
                    
                    that.feedback[0].style.left = 2 + position.left + "px";
                    that.feedback[0].style.top = 2 + position.top + "px";

                    if (view === "dayView" || view === "weekView") {
                        that.pinnedfeedback.css('left', 2 + position.left);
                        that.pinnedfeedback.css('top', 2 + position.top);
                        var width = 0;
                        if (td.getAttribute('data-end-date')) {
                            var appointmentHeight = that.appointmentsMinHeight;
                            if (that.isTouchDevice()) {
                                appointmentHeight = that.touchAppointmentsMinHeight;
                            }

                            if (viewObject.appointmentHeight) {
                                appointmentHeight = viewObject.appointmentHeight;
                            }

                            allDayAppointment = appointment.duration().days() >= 1 || appointment.allDay;
                            that.feedback.css('top', 2 + position.top + appointmentHeight);
                            that.pinnedfeedback.css('top', 2 + position.top + 18);
                            if (view == "dayView") {
                                var l = that.selectedAppointment.coord().left-9;
                                that.feedback.css('left', l);
                                that.pinnedfeedback.css('left', l);
                            }

                            if (allDayAppointment) {
                                that.pinnedfeedback.css('top', appointment.elements[0].y);
                                width = that.selectedAppointment.width();
                                if (2 + position.left + width > that.host.width() - scrollWidth) {
                                    var result = 2 + position.left + width - that.host.width() + scrollWidth + 6;
                                    width -= result;
                                }

                                that.feedback.width(width);
                                that.feedback.height(appointmentHeight);
                                that.pinnedfeedback.width(width);
                                that.pinnedfeedback.height(appointmentHeight);
                            }
                            else {
                                width = $(td).width() - 4;
                                that.feedback.width(width);
                                that.feedback.height(appointmentHeight);
                                that.pinnedfeedback.width(width);
                                that.pinnedfeedback.height(appointmentHeight);
                            }
                            that.feedback.hide();
                            that.pinnedfeedback.show();
                        }
                        else {
                            that.feedback.show();
                            that.pinnedfeedback.hide();
                            var cellsCount = 2;
                            var minutes = 30;
                            var scale = viewObject.timeRuler && viewObject.timeRuler.scale;
                            switch (scale) {
                                case 'sixtyMinutes':
                                case 'hour':
                                    cellsCount = 1;
                                    break;
                                case 'thirtyMinutes':
                                case 'halfHour':
                                    cellsCount = 2;
                                    break;
                                case 'fifteenMinutes':
                                case 'quarterHour':
                                    cellsCount = 4;
                                    break;
                                case 'tenMinutes':
                                    cellsCount = 6;
                                    break;
                                case 'fiveMinutes':
                                    cellsCount = 12;
                                    break;
                            }

                            width = $(td).width() - 4;
                            that.feedback.width(width);
                            allDayAppointment = appointment.duration().days() >= 1 || appointment.allDay;
                            if (allDayAppointment) {
                                that.feedback.height(($(td).height()) - 6);
                            }
                            else {
                                that.feedback.height(that.selectedAppointment.height());
                            }
                        }

                        that._startTimers(x, y, appointment);
                    }
                    else if (view === "monthView") {
                        that.feedback.css('left', 1 + position.left);
                        var appointmentPosition = that.selectedAppointmentTableBounds;
                        var appointmentTop = parseInt(appointmentPosition.top);
                        if (appointmentTop > position.top && appointmentTop < position.top + td.offsetHeight) {
                            that.feedback.css('top', appointmentTop + "px");
                        }
                        else {
                            that.feedback.css('top', that.selectedAppointment.height() + position.top - 2);
                        }
                        if (that.isTouchDevice()) {
                            that.feedback.css('top', position.top+2);
                        }

                        width = that.selectedAppointment.width();

                        that.feedback.width(width);
                        that.feedback.height(that.selectedAppointment.height());
                        that._startTimers(x, y, appointment);
                    }
                    else if (view === "timelineDayView" || view === "timelineMonthView" || view === "timelineWeekView") {
                        var appointmentPosition = that.selectedAppointmentTableBounds;
                        var appointmentTop = parseInt(appointmentPosition.top);
                        if (appointmentTop > position.top && appointmentTop < position.top + td.offsetHeight) {
                            that.feedback.css('top', appointmentTop + "px");
                        }

                        that._startTimers(x, y, appointment);
                    }
                }

                if (that.endDrag) {
                    var canDrag = that.endDrag(appointment, td, that.feedback);
                    if (!canDrag)
                        that.feedback.width(oldWidth);
                    that.feedback.height(oldHeight);
                    that.feedback.css('top', oldTop);
                    that.feedback.css('left', oldLeft);
                    return true;
                }

                if (that.isTouchDevice() && that.touchMode !== true) {
                    event.stopPropagation();
                    return false;
                }
            }
        });

        var mouseUpHandler = function(event)
        {
            that.isMouseDown = false;
            that.dragOrResize = false;

            if (that.contextMenu && that.menu && event.which !== 3) {
                that.menu.jqxMenu('close');
                that._hasOpenedMenu = false;
            }

            if (event.which === 3)
                return true;

            if (that.selectedAppointment && that.feedback) {
                if (that.editRecurrenceDialog.jqxWindow('isOpen'))
                    return;

                that._handleMouseUp(that.selectedJQXAppointment, that._dragCell, that.resizing);
            }
        }

        this.addHandler($(document), mouseup, function (event) {
            return mouseUpHandler(event);
        });

        if (!this.isTouchDevice()) {
            try {
                if (document.referrer != "" || window.frameElement) {
                    if (window.top != null && window.top != window.self) {
                        var parentLocation = null;
                        if (window.parent && document.referrer) {
                            parentLocation = document.referrer;
                        }

                        if (parentLocation && parentLocation.indexOf(document.location.host) != -1) {
                            var eventHandle = function (event) {
                                if (!that.disabled)
                                    return mouseUpHandler(event);

                            };

                            that.addHandler($(window.top.document), 'mouseup' + '.jqxscheduler' + that.element.id, eventHandle);
                            
                        }
                    }
                }
            }
            catch (error) {
            }
        }

        this.addHandler(this.host, mousemove, function (event) {
            var x = event.pageX;
            var y = event.pageY;

            if (that.disabled || event.which === 3) {
                return true;
            }

            if (that.selectedAppointment && that.isMouseDown) {
                return true;
            }

            if (that.hScrollInstance.isScrolling() || that.vScrollInstance.isScrolling()) {
                return true;
            }

            if (that._hasOpenedMenu)
                return true;

            if (that.overlay[0].style.display !== "none")
                return true;

            var appointment = null;

            if (event.target.className.indexOf('jqx-scheduler-appointment') >= 0 && event.target.className.indexOf('jqx-scheduler-appointment-inner-content') == -1 && event.target.className.indexOf('jqx-scheduler-appointment-content') == -1 && event.target.className.indexOf('jqx-scheduler-appointment-resize-indicator') == -1) {
                appointment = event.target;
            }
            var element = event.target;
            for (var i = 0; i < 4; i++) {
                if (element.parentNode) {
                    if (element.className.indexOf('jqx-scheduler-appointment') >= 0 && element.className.indexOf('jqx-scheduler-appointment-innter-content') == -1 && element.className.indexOf('jqx-scheduler-appointment-content') == -1 && element.className.indexOf('jqx-scheduler-appointment-resize-indicator') == -1) {
                        appointment = element;
                    }

                    element = element.parentNode;
                }
                else break;
            }

            if (appointment) {
                var view = that._views[that._view].type;
                var viewObject = that._views[that._view];
                var jqxAppointment = that.getJQXAppointmentByElement(appointment);
            
                if (jqxAppointment.resizable) {
                    var duration = jqxAppointment.duration();
                    var allDayAppointment = jqxAppointment.allDay || duration.days() >= 1 || (duration.hours() == 23 && duration.minutes == 59 && duration.seconds == 59)
                    var coord = $(appointment).coord();
                    var position = $(appointment).position();
                    that.selectedAppointmentBounds = { top: coord.top, left: coord.left, width: $(appointment).width(), height: $(appointment).height() };
                    that.selectedAppointmentTableBounds = { top: position.top, left: position.left, width: $(appointment).width(), height: $(appointment).height() };
                    var bounds = that.selectedAppointmentBounds;
                    if (view == "weekView" || view == "dayView") {
                        if (!allDayAppointment) {
                            if (y >= bounds.top - 3 && y <= bounds.top + 6) {
                                appointment.style.cursor = 'row-resize';
                                that.topResize = true;
                                that.bottomResize = false;
                            }
                            else if (y >= bounds.top + bounds.height - 6 && y <= bounds.top + bounds.height + 3) {
                                appointment.style.cursor = 'row-resize';
                                that.topResize = false;
                                that.bottomResize = true;
                            }
                            else appointment.style.cursor = 'pointer';
                        }
                        else {
                            if (view != "dayView") {
                                if (x >= bounds.left - 3 && x <= bounds.left + 6) {
                                    appointment.style.cursor = 'col-resize';
                                    that.leftResize = true;
                                    that.rightResize = false;
                                }
                                else if (x >= bounds.left + bounds.width - 6 && x <= bounds.left + bounds.width + 3) {
                                    appointment.style.cursor = 'col-resize';
                                    that.leftResize = false;
                                    that.rightResize = true;
                                }
                                else {
                                    appointment.style.cursor = 'pointer';
                                }
                            }
                            else appointment.style.cursor = 'pointer';
                        }
                    }
                    else {
                        if (view == "monthView" && jqxAppointment.elements.length > 1) {
                            var hostCoord = that.table.coord();
                            for (var i = 0; i < jqxAppointment.elements.length; i++) {
                                var app = jqxAppointment.elements[i];
                                var bounds = { top: hostCoord.top + app.y, left: hostCoord.left + app.x, width: app.width, height: app.height };
                                if ((i == 0 && !that.rtl) || (i == jqxAppointment.elements.length - 1 && that.rtl)) {
                                    if (x >= bounds.left - 3 && x <= bounds.left + 6) {
                                        if (y >= bounds.top && y <= bounds.top + bounds.height) {
                                            appointment.style.cursor = 'col-resize';
                                            that.leftResize = true;
                                            that.rightResize = false;
                                            that.selectedAppointment = $(appointment);
                                            break;
                                        }
                                        else appointment.style.cursor = 'pointer';
                                    }
                                    else appointment.style.cursor = 'pointer';
                                }
                                else if ((i == jqxAppointment.elements.length - 1 && !that.rtl) || (i == 0 && that.rtl)) {
                                    if (x >= bounds.left + bounds.width - 6 && x <= bounds.left + bounds.width + 3) {
                                        if (y >= bounds.top && y <= bounds.top + bounds.height) {
                                            appointment.style.cursor = 'col-resize';
                                            that.leftResize = false;
                                            that.rightResize = true;
                                            that.selectedAppointment = $(appointment);
                                            break;
                                        } else appointment.style.cursor = 'pointer';
                                    }
                                    else appointment.style.cursor = 'pointer';
                                }
                            }
                        }
                        else {
                            if (x >= bounds.left - 3 && x <= bounds.left + 6) {
                                appointment.style.cursor = 'col-resize';
                                that.leftResize = true;
                                that.rightResize = false;
                            }
                            else if (x >= bounds.left + bounds.width - 6 && x <= bounds.left + bounds.width + 3) {
                                appointment.style.cursor = 'col-resize';
                                that.leftResize = false;
                                that.rightResize = true;
                            }
                            else appointment.style.cursor = 'pointer';
                        }
                    }
                }
            }

            if (!that.enableHover) {
                return true;
            }

            if (event.target.nodeName.toLowerCase() === "td") {
                var td = event.target;
            }
            else {
                var td = that.findCell(x, y);
            }
            if (!td) {
                return true;
            }

            that._removeHoveredCell();

            if (that.renderedRecords && that.renderedRecords.length === 0)
                return true;


            if (that.isMouseDown) {
                if (Math.abs(that.mousecaptureposition.left - x) > 3 || Math.abs(that.mousecaptureposition.top - y) > 3) {
                    if (that.mousecaptureposition.clickedcell.length === 0) {
                        that.selectionarea[0].style.visibility = "hidden";
                        return;
                    }
                    if (that.lastHoveredCell != td) {
                        if (that._selectRangeTimer) clearTimeout(that._selectRangeTimer);
                        that._selectRangeTimer = setTimeout(function () {
                            var view = that._views[that._view].type;
                            if (view != "agendaView") {
                                that._selectRange(td, that.mousecaptureposition.clickedcell[0]);
                            }
                        }, 1);
                    }
                    that.lastHoveredCell = td;
                }
            }
            else if (!appointment) {
                if (that.rows.length == 1 && that.rows[0].cells.length == 1)
                    return true;

                that._hoverCell(td);
            }
            return true;
        });

        this.addHandler($(document), 'keydown.jqxscheduler' + that.element.id, function (event) {
            if (that.focused && event.ctrlKey) {
                if (event.keyCode == 68) {
                    return false;
                }
            }
        });

        this.addHandler(this.host, 'keydown', function (event) {
            return that._handleKey(event);
        });

        if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
            this.addHandler(this.table, 'dblclick', function (event) {
                that.table.trigger('mousedown', event);
            });
        }
        // clicks
        var clickHandler = function (event) {
            var target = event.target;
            var td = null;

            if (that.disabled) {
                return true;
            }

            if (!that.menu && event.which == 3) {
                that._initMenu();
            }

            var tableOffset = that.table.coord();
            
            var x = event.pageX;
            var y = event.pageY;
            if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                if (arguments && arguments.length == 2) {
                    x = arguments[1].pageX;
                    y = arguments[1].pageY;
                }
            }
            if (that.isTouchDevice()) {
                var position = $.jqx.position(event);
                x = position.left;
                y = position.top;
                if (isNaN(x) || isNaN(y)) {
                    var position = $.jqx.position(event.originalEvent);
                    x = position.left;
                    y = position.top;
                }
            }
            that.mouseDown = { top: y, left: x };

            // to remove
            var td = that.findCell(x, y);

            if (event.target.nodeName.toLowerCase() === "td") {
                var td = event.target;
            }
            else {
                var td = that.findCell(x, y);
            }

            var view = that._views[that._view].type;
            var viewObject = that._views[that._view];
            if (view === "monthView" && viewObject.weekViewNavigation) {
                if (td && td.getAttribute('data-time-slot')) {
                    var cellDate = that._getDateByString(td.getAttribute("data-date"));
                    var cellJQXDate = new $.jqx.date(cellDate);
                    that.date = cellJQXDate;
                    that.setView('weekView');
                }
            }
            if (view === "monthView" && viewObject.dayViewNavigation) {
                var tdPos = $(td).coord().top;
                if (td && y >= tdPos && tdPos + 16 >= y) {
                    var cellDate = that._getDateByString(td.getAttribute("data-date"));
                    var cellJQXDate = new $.jqx.date(cellDate);
                    that.date = cellJQXDate;
                    that.setView('dayView');
                }
            }
            if (event.target.nodeName.toLowerCase() === "span" && (event.target.className.indexOf('jqx-icon-arrow-down') >= 0 || event.target.className.indexOf('jqx-icon-close') >= 0)) {
                if (event.target.mousedown) {
                    event.target.mousedown();
                }
                return true;
            }

            var row = $(td).parent();
            var key = row.attr('data-key');

            that.mousecaptureposition = { left: event.pageX, top: event.pageY, clickedrow: $(row).index(), clickedcell: $(td) };
            if (event.which !== 3) {
                that.isMouseDown = true;
                that.isMouseDownDate = new Date();
            }
            else {
                that.isMouseDown = false;
            }

            if (that.contextMenu && that.menu && event.which !== 3) {
                that.menu.jqxMenu('close');
                that._hasOpenedMenu = false;
            }

            var openMenu = function (firstItem) {
                if (event.which === 3) {
                    if (that.contextMenu && that.menu) {
                        if (firstItem) {
                            that.menu.find('li:first').show();
                        }
                        else {
                            that.menu.find('li:first').hide();
                        }
                        var menuPosition = that.menu.coord();
                        if (that.menu.css('display') == "block" && menuPosition.left == event.pageX && menuPosition.top == event.pageY) {
                            that._hasOpenedMenu = true;
                            event.preventDefault();
                            event.stopPropagation();
                            return;
                        }
                        if (view === "agendaView")
                        {
                   //         return;
                        }

                        that.menuOpening = true;
                        that.menu.jqxMenu('open', event.pageX, event.pageY);
                        that.menuOpening = false;
                        that._hasOpenedMenu = true;
                        event.preventDefault();
                        event.stopPropagation();
                        setTimeout(function () {
                            that.menu.jqxMenu('focus');
                        }, 50);
                    }
                }
            }

            var clearSelection = function () {
                for (var i = 0; i < rows.length; i++) {
                    var cells = rows[i].cells;

                    for (var j = 0; j < cells.length; j++) {
                        cells[j].removeAttribute('data-selected');
                    }
                }
            }

            var appointment = event.target.className.indexOf('jqx-scheduler-appointment') >= 0 && event.target.className.indexOf('jqx-scheduler-appointment-duration-status') == -1 && event.target.className.indexOf('jqx-scheduler-appointment-inner-content') == -1 && event.target.className.indexOf('jqx-scheduler-appointment-status') == -1 && event.target.className.indexOf('jqx-scheduler-appointment-resize-indicator') == -1 && event.target.className.indexOf('jqx-scheduler-appointment-content') == -1 ? $(event.target) : $(event.target).parents('.jqx-scheduler-appointment');
            if (appointment.length == 0)
                appointment = null;

            if (appointment && appointment[0].className.indexOf('feedback') == -1) {
                if (appointment.parents('.jqx-scheduler-month-cell-popup').length > 0) {
                    return true;
                }

                that.mouseDownPosition = { top: y, left: x };
                var coord = $(appointment).coord();
                that.selectedAppointmentBounds = { top: coord.top, left: coord.left, width: $(appointment).width(), height: $(appointment).height() };
                var position = $(appointment).position();
                that.selectedAppointmentTableBounds = { top: position.top, left: position.left, width: $(appointment).width(), height: $(appointment).height() };
                if (!that._dragStartCell) {
                    that._dragStartCell = that.findCell(coord.left, coord.top);
                }

                var jqxAppointment = that.getJQXAppointmentByElement(appointment);
                that._selectAppointment(jqxAppointment, appointment, "mouse");
                that._raiseEvent('appointmentClick', { appointment: jqxAppointment.boundAppointment });
                that.clearSelection();
                var time = new Date().getTime();
                var timeInterval = 300;
                if ($.jqx.browser.msie && $.jqx.browser.version < 9)
                    timeInterval = 1000;
                if (!that.clickTime) that.clickTime = new Date();

                if ((time - that.clickTime.getTime() < timeInterval) && that._lastSelectedAppointment && jqxAppointment.id == that._lastSelectedAppointment.id && event.which != 3) {
                    if (!jqxAppointment.readOnly && !that.editRecurrenceDialog.jqxWindow('isOpen') && (!that._editDialog || (that._editDialog && !that._editDialog.jqxWindow('isOpen')))) {
                        var result = that._initDialog(jqxAppointment);
                        if (result !== false) {
                            that._openDialog();
                        }
                    }
                    that.mouseDownPosition = null;
                    that.isMouseDown = false;
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    that._raiseEvent('appointmentDoubleClick', { appointment: jqxAppointment.boundAppointment });
                }
                else
                {
                    if (!jqxAppointment.readOnly)
                    {
                        if (event.which !== 3)
                        {
                            that.focus();
                        }
                    }
                }
                that._lastSelectedAppointment = jqxAppointment;
                if (event.preventDefault) {
                    event.preventDefault();
                }
                event.stopPropagation();
                that.clickTime = new Date();
                if (!jqxAppointment.readOnly) {
                    if (event.which == 3) {
                        openMenu(true);
                    }
                }
                return;
            }
            else if (event.which === 3) {
                var selection = that.getSelection();
                if (selection !== null) {
                    openMenu(false);
                }
                else {
                    that.clearAppointmentsSelection();
                    td.setAttribute('data-selected', "true");
                    that._lastSelectedCell = td;
                    that.focusedCell = td;
                    that._updateCellsSelection(td);
                    openMenu(false);
                    var date = new $.jqx.date(td.getAttribute('data-date'), that.timeZone);
                    that._raiseEvent('cellClick', { cell: td, date: date });
                }
            }
            else if (event.which != 3) {
                that.clearAppointmentsSelection();
            }

            if (that.view == "agendaView")
            {
                var appointment = event.target.className.indexOf('jqx-scheduler-agenda-appointment') != -1;
                if (appointment)
                {
                    appointment = event.target;
                    var jqxAppointment = that.getJQXAppointmentByElement(appointment);
                    that._selectAppointment(jqxAppointment, appointment, "mouse");
                    that._raiseEvent('appointmentClick', { appointment: jqxAppointment.boundAppointment });
                    var time = new Date().getTime();
                    var timeInterval = 300;
                    if ($.jqx.browser.msie && $.jqx.browser.version < 9)
                        timeInterval = 1000;
                    if (!that.clickTime) that.clickTime = new Date();

                    if ((time - that.clickTime.getTime() < timeInterval) && that._lastSelectedAppointment && jqxAppointment.id == that._lastSelectedAppointment.id && event.which != 3)
                    {
                        if (!jqxAppointment.readOnly && !that.editRecurrenceDialog.jqxWindow('isOpen') && (!that._editDialog || (that._editDialog && !that._editDialog.jqxWindow('isOpen'))))
                        {
                            var result = that._initDialog(jqxAppointment);
                            if (result !== false)
                            {
                                that._openDialog();
                            }
                        }
                        that.mouseDownPosition = null;
                        that.isMouseDown = false;
                        if (event.preventDefault)
                        {
                            event.preventDefault();
                        }
                        that._raiseEvent('appointmentDoubleClick', { appointment: jqxAppointment.boundAppointment });
                    }
                    that._lastSelectedAppointment = jqxAppointment;
                    if (event.preventDefault)
                    {
                        event.preventDefault();
                    }
                    event.stopPropagation();
                    that.clickTime = new Date();
                    if (!jqxAppointment.readOnly)
                    {
                        if (event.which == 3)
                        {
                            openMenu(true);
                        }
                    }
                }
            }

            var focus = function () {
                if (!that.enableBrowserSelection) {
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                }

                var scrollTop = $(document).scrollTop();
                that.host.focus();
                $(document).scrollTop(scrollTop);
            }

            if (key !== undefined && event.which != 3) {
                that.clickedTD = td;
                var date = new $.jqx.date(td.getAttribute('data-date'), that.timeZone);
                that._raiseEvent('cellClick', { cell: td, date: date });
                var rowdata = that.rowinfo[key];
                var doubleClick = false;
                if (rowdata) {
                    var time = new Date().getTime();
                    var timeInterval = 300;
                    if (!that.clickTime) that.clickTime = new Date();
                    that.focus();

                    if (that._lastSelectedCell && that._lastSelectedCell.getAttribute('data-selected') == "true" && td.getAttribute('data-selected') === "true" && (time - that.clickTime.getTime() < timeInterval)) {
                        // double click.
                        var date = new $.jqx.date(td.getAttribute('data-date'), that.timeZone);
                        that._raiseEvent('cellDoubleClick', { cell: td, date: date });
                        doubleClick = true;
                        that._initDialog();
                        that._openDialog();
                        if (event.preventDefault) {
                            event.preventDefault();
                        }
                    }
                }

                var rows = that.rows;

                if (td.getAttribute('data-selected') != 'true' || event.shiftKey || time - that.clickTime.getTime() > timeInterval) {
                    if (td.getAttribute('data-time-slot') == 'true') {
                        return;
                    }

                    // clear old selections.
                    if (!event.shiftKey) {
                        that.shiftSelectedCell = null;
                    }

                    if (event.shiftKey && that._lastSelectedCell && view != "agendaView") {
                        if (!that.shiftSelectedCell) {
                            that.shiftSelectedCell = that._lastSelectedCell;
                        }
                        if (td.getAttribute('data-view') === that.shiftSelectedCell.getAttribute('data-view')) {
                            clearSelection();
                        }
                        that._selectRange(td, that.shiftSelectedCell);
                    }


                    if (!event.shiftKey) {
                        clearSelection();
                        var cellDate = that._getDateByString(td.getAttribute("data-date"));
                        if (cellDate >= that.min.toDate() && cellDate <= that.max.toDate()) {
                            td.setAttribute('data-selected', "true");
                        }
                        else {
                            td.setAttribute('data-selected', "false");
                        }
                    }

                    $('[data-key="' + key + '"]').removeClass(that.toTP('jqx-scheduler-selected-appointment'));
                    that.selectedAppointment = null;

                    var cellDate = that._getDateByString(td.getAttribute("data-date"));
                    if (cellDate >= that.min.toDate() && cellDate <= that.max.toDate()) {
                        that._lastSelectedCell = td;
                        that.focusedCell = td;
                    }

                    that._updateCellsSelection(td);
                    if (that.openedMonthCellPopup) {
                        that.openedMonthCellPopup.remove();
                    }
                }
                that.clickTime = new Date();
                if (event.stopPropagation)
                    event.stopPropagation();
            }
        }

        this.addHandler(this.pinnedtable, eventname, function (event) {
            var result = clickHandler(event);
            if (result != undefined)
                return result;
        });

        this.addHandler(this.table, eventname, function (event) {
            var result = clickHandler(event);
            if (result != undefined)
                return result;
        });
    },

    moveAppointment: function (uiappointment, date, resourceId, newCell, resizing) {
        var that = this;
        var allDayCell = newCell.getAttribute('data-end-date');
        if (uiappointment) {
            if (that.editRecurrenceDialog.jqxWindow('isOpen'))
                return;

            clearInterval(that._verticalIntervalDragVelocity);
            clearInterval(that._horizontalIntervalDragVelocity);
            clearInterval(that._intervalDrag);
            clearInterval(that._horizontalIntervalDrag);
            var duration = uiappointment.duration();
            var allDayAppointment = uiappointment.duration().days() >= 1 || uiappointment.allDay;
            var commit = function (param) {
                if (!resizing) {
                    var view = that._views[that._view].type;
                    var viewObject = that._views[that._view];
                    var jqxDate = date;
                    uiappointment.from = jqxDate;
                    if (view === "dayView" || view === "weekView") {
                        if (!allDayAppointment && !allDayCell) {
                            uiappointment.to = jqxDate.add(duration);
                            uiappointment.allDay = false;
                        }
                        else if (!allDayAppointment && allDayCell) {
                            uiappointment.to = $.jqx.scheduler.utilities.getEndOfDay(jqxDate);
                            uiappointment.allDay = true;
                        }
                        else if (allDayAppointment && allDayCell) {
                            uiappointment.to = jqxDate.add(duration);
                        }
                        else if (allDayAppointment && !allDayCell) {
                            var minutes = 30;
                            var scale = viewObject.timeRuler && viewObject.timeRuler.scale;
                            switch (scale) {
                                case 'sixtyMinutes':
                                case 'hour':
                                    minutes = 60;
                                    break;
                                case 'fifteenMinutes':
                                case 'quarterHour':
                                    minutes = 15;
                                    break;
                                case 'tenMinutes':
                                    minutes = 10;
                                    break;
                                case 'fiveMinutes':
                                    minutes = 5;
                                    break;
                            }
                            uiappointment.to = jqxDate.addMinutes(minutes);
                            uiappointment.allDay = false;
                        }
                    }
                    else if (view === "monthView") {
                        uiappointment.to = jqxDate.add(duration);
                    }
                    else if (view === "timelineDayView" || view === "timelineWeekView" || view === "timelineMonthView") {
                        uiappointment.to = jqxDate.add(duration);
                    }
                }

                that._saveChangesAfterDragOrResize(param, uiappointment, newCell, resizing);

                if (resourceId != null) {
                    uiappointment.resourceId = resourceId;
                }

                that.table.find('.jqx-icon-arrow-down').hide();
                if (uiappointment.allDay || allDayAppointment) {
                    that._renderrows();
                }
                else {
                    var viewStart = that.getViewStart();
                    var viewEnd = $.jqx.scheduler.utilities.getEndOfDay(that.getViewEnd());
                    that._prepareAppointmentsInView(viewStart, viewEnd);
                    that._renderAppointments(viewStart, viewEnd);
                }

                that._raiseEvent('appointmentChange', { appointment: uiappointment.boundAppointment });
                that.changedAppointments[uiappointment.id] = { type: "Update", appointment: uiappointment.boundAppointment };
                that._ensureAppointmentVisible(that.selectedJQXAppointment);
            }

            if (uiappointment.isRecurrentAppointment()) {
                commit(false);
            }
            else {
                commit(null);
            }
        }
    },

    getAppointmentProperty: function(key, propertyName)
    {
        var that = this;
        var appointment = null;

        if (this.appointmentsByKey[key]) {
            appointment = this.appointmentsByKey[key].jqxAppointment;
        }

        if (!appointment)
            return;

        return appointment[propertyName];
    },

    setAppointmentProperty: function (key, propertyName, value) {
        var that = this;
        var appointment = null;

        if (this.appointmentsByKey[key]) {
            appointment = this.appointmentsByKey[key].jqxAppointment;
        }

        if (!appointment)
            return;

        appointment[propertyName] = value;

        that.changedAppointments[key] = { type: propertyName, appointment: appointment.boundAppointment };
        switch (key) {
            case "draggable":
            case "resizable":
                break;
            case "background":
            case "color":
            case "borderColor":
            case "status":
            case "tooltip":
            case "subject":
            case "location":
            case "description":
            case "style":
                var viewStart = that.getViewStart();
                var viewEnd = $.jqx.scheduler.utilities.getEndOfDay(that.getViewEnd());
                that._prepareAppointmentsInView(viewStart, viewEnd);
                that._renderAppointments(viewStart, viewEnd);
                break;
            case "hidden":
            case "timeZone":
                if (appointment.isAllDayAppointment()) {
                    that._renderrows();
                }
                else {
                    var viewStart = that.getViewStart();
                    var viewEnd = $.jqx.scheduler.utilities.getEndOfDay(that.getViewEnd());
                    that._prepareAppointmentsInView(viewStart, viewEnd);
                    that._renderAppointments(viewStart, viewEnd);
                }
                break;
            default:
                that._renderrows();
        }
    },


    deleteAppointment: function(key)
    {
        if (this.appointmentsByKey[key]) {
            this._deleteAppointment(this.appointmentsByKey[key].jqxAppointment);
        }
    },

    _deleteAppointment: function (uiappointment) {
        var that = this;

        if (uiappointment.rootAppointment) {
            if (!uiappointment.isException()) {
                if (uiappointment.rootAppointment != null) {
                    uiappointment.rootAppointment.exceptions.push(that.editAppointment);
                    uiappointment.rootAppointment.recurrenceException.push(that.editAppointment.occurrenceFrom);
                }
                else {
                    uiappointment.exceptions.push(that.editAppointment);
                    uiappointment.recurrenceException.push(that.editAppointment.occurrenceFrom);
                }
            }
            else {
                var exceptions = uiappointment.rootAppointment ? uiappointment.rootAppointment.exceptions : uiappointment.exceptions;
                for (var i = 0; i < exceptions.length; i++) {
                    if (exceptions[i].occurrenceFrom.equals(that.editAppointment.occurrenceFrom)) {
                        exceptions[i] = uiappointment;
                        break;
                    }
                }
            }
            uiappointment.hidden = true;
            that._renderrows();
            return;
        }

        that._raiseEvent('appointmentDelete', { appointment: uiappointment.boundAppointment });

        var key = uiappointment.id;
        delete that.appointmentsByKey[key];
        var deleteIndex = -1;
        for (var i = 0; i < that.appointments.length; i++) {
            if (that.appointments[i] == uiappointment.boundAppointment || that.appointments[i].id == uiappointment.boundAppointment.id) {
                deleteIndex = i;
                break;
            }
        }
        if (deleteIndex != -1) {
            that.appointments.splice(deleteIndex, 1);
        }
        deleteIndex = -1;

        for (var i = 0; i < that.uiappointments.length; i++) {
            if (that.uiappointments[i] == uiappointment || that.uiappointments[i].id == uiappointment.id) {
                deleteIndex = i;
                break;
            }
        }

        if (deleteIndex != -1) {
            that.uiappointments.splice(deleteIndex, 1);
        }

        if (that.selectedJQXAppointment == uiappointment) {
            that.clearAppointmentsSelection();
            if (that.uiappointments[deleteIndex + 1])
                that.selectAppointment(that.uiappointments[deleteIndex + 1].id);
            else if (that.uiappointments[deleteIndex - 1])
                that.selectAppointment(that.uiappointments[deleteIndex - 1].id);
            else if (that.uiappointments[0])
                that.selectAppointment(that.uiappointments[0].id);
        }

        that.changedAppointments[key] = { type: "Delete", appointment: uiappointment.boundAppointment };
        that._renderrows();
    },

    addAppointment: function (uiappointment) {
        var that = this;
        if (!uiappointment.scheduler) {
            uiappointment.scheduler = this;
        }
        if (!uiappointment.duration) {
            if (!uiappointment.from && !uiappointment.to) {
                var row = uiappointment;
                var appointment = {};

                var defaultFields = [
                    "from",
                    "to",
                    "id",
                    "style",
                    "description",
                    "location",
                    "subject",
                    "background",
                    "color",
                    "borderColor",
                    "recurrencePattern",
                    "recurrenceException",
                    "draggable",
                    "resizable",
                    "tooltip",
                    "hidden",
                    "allDay",
                    "timeZone",
                    "ownerId",
                    "resourceId"
                ];

                for (var key in that.appointmentDataFields) {
                    var field = that.appointmentDataFields[key];
                    var value = row[field];
                    if (key == "from" || key == "to") {
                        value = new $.jqx.date(value);
                    }

                    if (key == "style") {
                        if (value) {
                            var appointmentColors = that.getAppointmentColors(value);
                            appointment.color = appointmentColors.color;
                            appointment.background = appointmentColors.background;
                            appointment.borderColor = appointmentColors.border;
                        }
                    }

                    if (key == "recurrencePattern") {
                        if (value) {
                            value = new $.jqx.scheduler.recurrencePattern(value);
                            value.timeZone = row.timeZone || that.timeZone;
                        }
                    }
                    if (key == "recurrenceException") {
                        var exceptions = new Array();
                        if (value) {
                            if (value.indexOf("EXDATE:") >= 0) {
                                value = value.substring(value.indexOf("EXDATE:") + 7);
                            }

                            var exdates = new Array();
                            if (value.indexOf(",") >= 0) {
                                exdates = value.split(',');
                            }
                            else {
                                exdates.push(value);
                            }
                            for (var exIndex = 0; exIndex < exdates.length; exIndex++) {
                                var current = exdates[exIndex];
                                if (current.indexOf(';') >= 0) {
                                    var canDisplay = current.split(';')[1];
                                    current = current.split(';')[0];
                                    if (canDisplay.toLowerCase().indexOf('display') >= 0 && canDisplay.toLowerCase().indexOf('none')) {
                                        appointment["hidden"] = true;
                                    }
                                }
                                try {
                                    var date = $.jqx.scheduler.utilities.untilStringToDate(current);
                                    if (date != "Invalid Date") {
                                        if (appointment.timeZone) {
                                            date = new $.jqx.date(date, appointment.timeZone);
                                        }
                                        else if (that.timeZone) {
                                            date = date.toTimeZone(that.timeZone);
                                        }
                                        else {
                                            date = new $.jqx.date(date);
                                        }
                                    }
                                }
                                catch (er) {
                                    var date = new $.jqx.date(current, that.timeZone);
                                }

                                exceptions.push(date);
                            }
                        }
                        value = exceptions;
                    }
                    appointment[key] = value;
                }

                for (var obj in defaultFields) {
                    var key = defaultFields[obj];
                    if (appointment[key] == undefined) {
                        var value = "";
                        if (key == "originalData")
                            continue;

                        if (key == "ownerId") value = null;
                        if (key == "timeZone") value = null;
                        if (key == "recurrencePattern") value = null;
                        if (key == "recurrenceException") value = null;
                        if (key == "allDay") value = false;
                        if (key == "draggable") value = true;
                        if (key == "resizable") value = true;
                        if (key == "hidden") value = false;
                        if (key == "resourceId") value = null;
                        if (key == "from") {
                            value = new $.jqx.date();
                        }
                        if (key == "to") {
                            value = new $.jqx.date().addHours(1);
                        }
                        appointment[key] = value;
                    }
                }
                appointment.originalData = row;

                var uiappointment = new $.jqx.scheduler.appointment(appointment);
                if (appointment.timeZone) {
                    uiappointment.from = uiappointment.from.toTimeZone(appointment.timeZone);
                    uiappointment.to = uiappointment.to.toTimeZone(appointment.timeZone);
                }

                if (that.timeZone) {
                    if (!appointment.timeZone) {
                        uiappointment.timeZone = that.timeZone;
                    }
                    uiappointment.from = uiappointment.from.toTimeZone(that.timeZone);
                    uiappointment.to = uiappointment.to.toTimeZone(that.timeZone);
                }
                else {
                    uiappointment.from = uiappointment.from.toTimeZone(null);
                    uiappointment.to = uiappointment.to.toTimeZone(null);
                }
            }
            else {
                var app = new $.jqx.scheduler.appointment();
                for (var key in uiappointment) {
                    app[key] = uiappointment[key];
                }
                uiappointment = app;
            }
        }
        var key = that.dataview.generatekey();
        uiappointment.id = key;
        that.appointmentsByKey[key] = uiappointment;
        that.appointments.push(uiappointment);
        var boundAppointment = {};
        var originalData = {};
        for (var keyValue in that.appointmentDataFields) {
            var field = that.appointmentDataFields[keyValue];
            var value = uiappointment[keyValue];
            boundAppointment[keyValue] = value;
            if (keyValue == "from" || keyValue == "to") {
                value = value.toDate();
            }
 
            originalData[field] = value;
        }
        boundAppointment.originalData = originalData;
        uiappointment.boundAppointment = boundAppointment;
        boundAppointment.jqxAppointment = uiappointment;
        uiappointment.jqxAppointment = uiappointment;
        that._raiseEvent('appointmentAdd', { appointment: uiappointment.boundAppointment });

        that.uiappointments.push(uiappointment);
        that.changedAppointments[key] = { type: "Add", appointment: uiappointment.boundAppointment };
        if (that.hiddenResources && that.hiddenResources[uiappointment.resourceId]) {
            that.hideAppointmentsByResource(uiappointment.resourceId);
        }
        else {
            that._renderrows();
        }

        that._selectAppointment(uiappointment);
        that._lastSelectedAppointment = uiappointment;
    },

    _updateCellsSelection: function () {
        var that = this;
        var rows = that.rows;

        var start = 0;
        var end = 0;
        if (start > 0 && that.rtl) {
            start = 0;
            end = 1;
        }

        for (var i = 0; i < rows.length; i++) {
            var cells = rows[i].cells;

            for (var j = start; j < cells.length - end; j++) {
                var cell = cells[j];
                if (cell.getAttribute('data-selected') == "true") {
                    var className = cell.jqxClassName || cell.className;
                    if (className.indexOf("jqx-fill-state-pressed") >= 0) {
                        if (cell != that.focusedCell) {
                            className = className.replace(" " + 'jqx-scheduler-cell-focus', "");
                            className = className.replace(" " + 'jqx-scheduler-cell-focus-' + that.theme, "");
                        }
                        else if (cell == that.focusedCell && that.focused) {
                            className = className.replace(" " + 'jqx-scheduler-cell-focus', "");
                            className = className.replace(" " + 'jqx-scheduler-cell-focus-' + that.theme, "");
                            if (!that.selectedAppointment) {
                                className = className += " " + that.toTP('jqx-scheduler-cell-focus');
                            }
                        }

                        if (cell.className != className) {
                            cell.className = className;
                        }
                        cell.jqxClassName = className;
                        continue;
                    }

                    className = className.replace(" " + 'jqx-fill-state-pressed', "");
                    className = className.replace(" " + 'jqx-fill-state-pressed-' + that.theme, "");
                    className = className.replace(" " + 'jqx-scheduler-cell-focus', "");
                    className = className.replace(" " + 'jqx-scheduler-cell-focus-' + that.theme, "");
                    className = className.replace(" " + 'jqx-grid-cell-selected', "");
                    className = className.replace(" " + 'jqx-grid-cell-selected-' + that.theme, "");
                    className = className.replace(" " + 'jqx-scheduler-cell-selected', "");
                    className = className.replace(" " + 'jqx-scheduler-cell-selected-' + that.theme, "");
                    className = className += " " + that.toTP('jqx-fill-state-pressed jqx-grid-cell-selected jqx-scheduler-cell-selected');

                    if (cell == that.focusedCell && that.focused && !that.selectedAppointment) {
                        className = className += " " + that.toTP('jqx-scheduler-cell-focus');
                    }

                    if (cell.className != className) {
                        cell.className = className;
                    }
                    cell.jqxClassName = className;
                }
                else {
                    var className = cell.jqxClassName || cell.className;
                    if (className.indexOf("jqx-fill-state-pressed") == -1) {
                        if (cell != that.focusedCell) {
                            className = className.replace(" " + 'jqx-scheduler-cell-focus', "");
                            className = className.replace(" " + 'jqx-scheduler-cell-focus-' + that.theme, "");
                        }
                        else if (cell == that.focusedCell && that.focused) {
                            className = className.replace(" " + 'jqx-scheduler-cell-focus', "");
                            className = className.replace(" " + 'jqx-scheduler-cell-focus-' + that.theme, "");

                            if (!that.selectedAppointment) {
                                className = className += " " + that.toTP('jqx-scheduler-cell-focus');
                            }
                        }
                        if (cell.className != className) {
                            cell.className = className;
                        }
                        cell.jqxClassName = className;
                        continue;
                    }
                    else if (cell == that.focusedCell && that.focused) {
                        className = className.replace(" " + 'jqx-scheduler-cell-focus', "");
                        className = className.replace(" " + 'jqx-scheduler-cell-focus-' + that.theme, "");
                        if (!that.selectedAppointment) {
                            className = className += " " + that.toTP('jqx-scheduler-cell-focus');
                        }
                        if (cell.className != className) {
                            cell.className = className;
                        }
                        cell.jqxClassName = className;
                    }

                    className = className.replace(" " + 'jqx-fill-state-pressed', "");
                    className = className.replace(" " + 'jqx-fill-state-pressed-' + that.theme, "");
                    className = className.replace(" " + 'jqx-scheduler-cell-focus', "");
                    className = className.replace(" " + 'jqx-scheduler-cell-focus-' + that.theme, "");
                    className = className.replace(" " + 'jqx-grid-cell-selected', "");
                    className = className.replace(" " + 'jqx-grid-cell-selected-' + that.theme, "");
                    className = className.replace(" " + 'jqx-scheduler-cell-selected', "");
                    className = className.replace(" " + 'jqx-scheduler-cell-selected-' + that.theme, "");

                    if (cell == that.focusedCell && that.focused && !that.selectedAppointment) {
                        className = className += " " + that.toTP('jqx-scheduler-cell-focus');
                    }

                    if (cell.className != className) {
                        cell.className = className;
                    }
                    cell.jqxClassName = className;
                    cell.removeAttribute('data-selected');
                }
            }
        }
    },

    _getuikey: function (index, type) {
        var key = null;
        var children = this.table[0].rows;
        key = $(children[index]).attr('data-key');
        if ($(children[index]).attr('data-role')) {
            var uirow = $(children[index]);
            if (type == "next") {
                while (uirow) {
                    uirow = uirow.next();
                    if (uirow) {
                        var role = uirow.attr('data-role');
                        if (!role) {
                            key = uirow.attr('data-key');
                            return key;
                        }
                    }
                }
            }
            else if (type == "prev") {
                while (uirow) {
                    uirow = uirow.prev();
                    if (uirow) {
                        var role = uirow.attr('data-role');
                        if (!role) {
                            key = uirow.attr('data-key');
                            return key;
                        }
                    }
                }
            }
            return null;
        }

        return key;
    },

    getRows: function () {
        var view = this._views[this._view].type;
        var viewObject = this._views[this._view];
        var scale = "halfHour";
        if (viewObject.timeRuler && viewObject.timeRuler.scale) {
            scale = viewObject.timeRuler.scale;
        }
        var hours = 24;
        var showAllDayRow = this.showAllDayRow;
        if (viewObject.timeRuler && (view === "dayView" || view === "weekView")) {
            var startHour = 0;
            var endHour = 23;
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
            if (viewObject.timeRuler.showAllDayRow != undefined) {
                showAllDayRow = viewObject.timeRuler.showAllDayRow;
            }
        }

        var rows = new Array();
        var pageSize = 0;
        switch (view) {
            case "dayView":
            case "weekView":
            default:
                var pageSize = hours * 2;
                if (scale === "hour" || scale === "sixtyMinutes") {
                    var pageSize = hours;
                }
                else if (scale === "quarterHour" || scale === "fifteenMinutes") {
                    var pageSize = hours * 4;
                }
                else if (scale === "tenMinutes") {
                    var pageSize = hours * 6;
                }
                else if (scale === "fiveMinutes") {
                    var pageSize = hours * 12;
                }

                if (showAllDayRow) {
                    pageSize++;
                }
                break;
            case "monthView":
                var pageSize = 6;
                break;
            case "timelineDayView":
            case "timelineWeekView":
            case "timelineMonthView":
                var pageSize = 1;
                break;
            case "agendaView":
                var pageSize = this.appointments ? this.appointments.length : 0;
                break;
        }
        for (var i = 0; i < pageSize; i++) {
            rows.push({ uid: i });
        }
        return rows;
    },

    _getDateByString: function (dateString) {
        var parts = dateString.split(" ");
        var dateParts = parts[0].split("-");
        var timeParts = parts[1].split(":");
        var year = parseInt(dateParts[0], 10);
        var month = parseInt(dateParts[1], 10) - 1;
        var day = parseInt(dateParts[2], 10)
        var hour = parseInt(timeParts[0], 10);
        var minutes = parseInt(timeParts[1], 10);
        var seconds = parseInt(timeParts[2], 10);
        var date = new Date(year, month, day, hour, minutes, seconds);
        if (year < 1970)
            date.setFullYear(year, month, day);

        return date;
    },

    _getCellByDate: function (date, avoidAllDayCells, resource) {
        var rows = this.rows;
        if (avoidAllDayCells === undefined)
            avoidAllDayCells = false;
        if (resource === undefined) {
            if (this.focusedCell)
                resource = this.focusedCell.getAttribute("data-view");
        }

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (row.element.getAttribute('data-group-row'))
                continue;

            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                if (cell.getAttribute('rowspan') != null)
                    continue;

                if (cell.getAttribute('data-view') !== resource)
                    continue;

                if (cell.getAttribute('data-time-slot'))
                    continue;

                if (avoidAllDayCells && cell.getAttribute('data-end-date') != null)
                    continue;

                var dateString = cell.getAttribute('data-date');
                var cellDate = this._getDateByString(dateString);
                if (cellDate.valueOf() == date.valueOf())
                    return cell;
            }
        }
    },

    _handleKey: function (event) {
        if (this._loading) {
            return true;
        }

        var shift = event.shiftKey;
        var ctrl = event.ctrlKey || event.metaKey;

        var that = this;
        var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;

        if (that._hasOpenedMenu) {
            if (key == 27)
            {
                that.closeMenu();
            }
            else
            {
                that.menu.jqxMenu('focus');
            }
            return true;
        }

        if (key === 13 || (that.selectedAppointment && key == 46)) {
            if (that.editRecurrenceDialog && that.editRecurrenceDialog.jqxWindow('isOpen'))
                return true;

            if (that._editDialog && that._editDialog.jqxWindow('isOpen'))
                return true;

            if (!that.selectedAppointment) {
                that._initDialog();
                that._openDialog();
            }
            else {
                var jqxAppointment = that.getJQXAppointmentByElement(that.selectedAppointment);
                if (!jqxAppointment.readOnly) {
                    if (key == 46) {
                        var result = that._initDialog(jqxAppointment, 'delete');
                        if (result !== false) {
                            that._openDialog();
                        }
                    }
                    else {
                        var result = that._initDialog(jqxAppointment);
                        if (result !== false) {
                            that._openDialog();
                        }
                    }
                }
            }
        }
        if (key === 27) {
            if (that.dragOrResize) {
                that.table.find('.jqx-icon-arrow-down').hide();
                var viewStart = that.getViewStart();
                var viewEnd = $.jqx.scheduler.utilities.getEndOfDay(that.getViewEnd());
                that._prepareAppointmentsInView(viewStart, viewEnd);
                that._renderAppointments(viewStart, viewEnd);
                that._removeFeedbackAndStopResize();
                return false;
            }
        }


        var move = function (type) {
            var appointment = that.selectedAppointment;
            var jqxAppointment = that.getJQXAppointmentByElement(appointment);
            var cell = jqxAppointment.elements[0].cells[0].cell;
            var lastCell = jqxAppointment.elements[jqxAppointment.elements.length - 1].cells[jqxAppointment.elements[jqxAppointment.elements.length - 1].cells.length - 1].cell;
            var lastViewCell = that.rows[that.rows.length - 1].cells[that.rows[that.rows.length - 1].cells.length - 1];
            if (shift || (!shift && !ctrl && (type == "down" || type == "right"))) {
                cell = lastCell;
            }
            var view = that._views[that._view].type;
            var viewObject = that._views[that._view];

            var newCell = cell;

            switch (type) {
                case "left":
                    var row = that.rowByCell[cell.getAttribute("data-key")];
                    var cellIndex = row.indexOf(cell);
                    if (cellIndex > 0 && !shift) {
                        newCell = row.cells[cellIndex - 1];
                    }
                    else if (view == "monthView" && !shift) {
                        var aboveRow = row.aboveRow;
                        if (aboveRow) {
                            newCell = aboveRow.cells[aboveRow.cells.length - 1];
                        }
                    }
                    break;
                case "right":
                    var row = that.rowByCell[cell.getAttribute("data-key")];
                    var cellIndex = row.indexOf(cell);
                    if (cellIndex < row.cells.length - 1) {
                        newCell = row.cells[cellIndex + 1];
                    }
                    else if (view == "monthView") {
                        var belowRow = row.belowRow;
                        if (belowRow) {
                            newCell = belowRow.cells[0];
                        }
                    }

                    if (view == "monthView" && !shift && ctrl && lastCell == lastViewCell) {
                        newCell = cell;
                    }

                    break;
                case "up":
                    var row = that.rowByCell[cell.getAttribute("data-key")];
                    var cellIndex = row.indexOf(cell);
                    var aboveRow = row.aboveRow;
                    if (aboveRow && !shift) {
                        newCell = aboveRow.cells[cellIndex];
                    }
                    break;
                case "down":
                    var row = that.rowByCell[cell.getAttribute("data-key")];
                    var cellIndex = row.indexOf(cell);
                    var belowRow = row.belowRow;
                    if (belowRow) {
                        newCell = belowRow.cells[cellIndex];
                    }
                    break;
            }

            var dateString = newCell.getAttribute('data-date');
            var date = new $.jqx.date(dateString, that.timeZone);
            var view = $(newCell).attr('data-view');
            var resourceId = that._resources[parseInt(view) - 1];

            if (shift) {
                var view = that._views[that._view].type;
                var viewObject = that._views[that._view];
                var changed = false;
                if (view === "dayView" || view === "weekView") {
                    if (cell.getAttribute('data-end-date')) {
                        if (type == "left" && (jqxAppointment.elements[0].cells.length > 1 || that.rtl)) {
                            if (!that.rtl) {
                                jqxAppointment.to = $.jqx.scheduler.utilities.getEndOfDay(date.addDays(-1));
                            }
                            else {
                                jqxAppointment.to = $.jqx.scheduler.utilities.getEndOfDay(date.addDays(1));
                            }

                            changed = true;
                        }
                        else if (type == "right") {
                            if (!that.rtl || (that.rtl && jqxAppointment.elements[0].cells.length > 1)) {
                                jqxAppointment.to = $.jqx.scheduler.utilities.getEndOfDay(date);
                            }
                            changed = true;
                        }
                    }
                    else {
                        if (type == "up" && jqxAppointment.elements[0].cells.length > 1) {
                            jqxAppointment.to = date;
                            changed = true;
                        }
                        else if (type == "down") {
                            jqxAppointment.to = date.addMinutes(that.getMinutesPerScale());
                            changed = true;
                        }
                    }
                }
                else if (view.indexOf("month") >= 0) {
                    if (type == "left" && (jqxAppointment.elements[0].cells.length > 1 || jqxAppointment.elements.length > 1)) {
                        jqxAppointment.to = $.jqx.scheduler.utilities.getEndOfDay(date.addDays(-1));
                        changed = true;
                    }
                    else if (type == "right") {
                        jqxAppointment.to = $.jqx.scheduler.utilities.getEndOfDay(date);
                        changed = true;
                    }
                }
                else {
                    if ((!that.rtl && type == "left" && jqxAppointment.elements[0].cells.length > 1) || (that.rtl && type == "right" && jqxAppointment.elements[0].cells.length > 1)) {
                        jqxAppointment.to = date;
                        if (that.rtl) {
                            jqxAppointment.to = date.addMinutes(that.getMinutesPerScale());
                        }
                        changed = true;
                    }
                    else if ((!that.rtl && type == "right") || (that.rtl && type == "left")) {
                        jqxAppointment.to = date.addMinutes(that.getMinutesPerScale());
                        if (that.rtl) {
                            jqxAppointment.to = jqxAppointment.to.addMinutes(that.getMinutesPerScale());
                        }
                        changed = true;
                    }
                }

                if (changed) {
                    that.moveAppointment(jqxAppointment, date, resourceId, newCell, true);
                }
            }
            else if (ctrl) {
                that.moveAppointment(jqxAppointment, date, resourceId, newCell);
            }
            else {
                that.clearAppointmentsSelection();
                var allDay = true;
                if (type == "down") allDay = false;
                that.selectCell(date, allDay, view);
                that._ensureVisible(newCell);
            }

            if (that.selectedAppointment) {
                that.selectedAppointment.removeClass(that.toTP('jqx-scheduler-selected-appointment'));
                var key = that.selectedAppointment.attr('data-key');
                $('[data-key="' + key + '"]').addClass(that.toTP('jqx-scheduler-selected-appointment'));

                that.clearSelection();
            }
        }

        if (event.altKey && that._resourcesElements && that._resources && that._resources.length > 0) {
            var toggleResource = function (label) {
                var element = that._resourcesElements["bottom"][label];
                if (element.attr('data-toggle') == 'on') {
                    that.hideAppointmentsByResource(label);
                }
                else {
                    that.showAppointmentsByResource(label);
                }
            }

            var num = key >= 49 && key <= 58 ? num = key - 48 : -1;
            if (num >= 1) {
                $.each(that._resources, function (index, value) {
                    if (index == num - 1) {
                        toggleResource(value);
                        return false;
                    }
                });
                return false;
            }
        }

        if (event.ctrlKey) {
            if (!that.selectedAppointment) {
                if (key == 37) {
                    that.toolbarLeftButton.trigger('click');
                    that._ensureVisible(that.focusedCell);
                    return false;
                }
                else if (key == 39) {
                    that.toolbarRightButton.trigger('click');
                    that._ensureVisible(that.focusedCell);
                    return false;
                }
            }
            if (key == 49) {
                that._setView(0);
                return false;
            }
            else if (key == 50) {
                that._setView(1);
                return false;
            }
            else if (key == 51) {
                that._setView(2);
                return false;
            }
            else if (key == 52) {
                that._setView(3);
                return false;
            }
            else if (key == 53) {
                that._setView(4);
                return false;
            }
            else if (key == 54) {
                that._setView(5);
                return false;
            }
            else if (key == 68) {
                that.dateTimeInput.jqxDateTimeInput('open');
                return false;
            }
            else if (key == 77) {
                that.openMenu();
                return false;
            }
        }

        if (key == 9) {
            if (!event.shiftKey) {
                if (that.selectedAppointment) {
                    that.clearSelection();
                    var appointment = that.selectedAppointment;
                    var jqxAppointment = that.getJQXAppointmentByElement(appointment);
                    var index = that.tabKeyAppointments.indexOf(jqxAppointment);
                    if (index < that.tabKeyAppointments.length - 1) {
                        jqxAppointment = that.tabKeyAppointments[index + 1];
                        that._selectAppointment(jqxAppointment);
                        that._lastSelectedAppointment = jqxAppointment;
                        that._ensureAppointmentVisible(jqxAppointment);
                        return false;
                    }
                    else {
                        that.clearAppointmentsSelection();
                        return true;
                    }
                }
                else {
                    var jqxAppointment = that.tabKeyAppointments[0];
                    if (jqxAppointment) {
                        that._selectAppointment(jqxAppointment);
                        that._lastSelectedAppointment = jqxAppointment;
                        that._ensureAppointmentVisible(jqxAppointment);
                        return false;
                    }
                    else if (!that.focusedCell) {
                        that._updateFocusedCell();
                        that._ensureVisible(that.focusedCell);
                        return false;
                    }
                    else if (that.focusedCell) {
                        if (that.focusedCell.className.indexOf('-focus') == -1) {
                            that._updateCellsSelection();
                            that._ensureVisible(that.focusedCell);
                            return false;
                        }
                    }
                }
            }
            else {
                if (that.selectedAppointment) {
                    that.clearSelection();
                    var appointment = that.selectedAppointment;
                    var jqxAppointment = that.getJQXAppointmentByElement(appointment);
                    if (jqxAppointment) {
                        var index = that.tabKeyAppointments.indexOf(jqxAppointment);
                        if (index > 0) {
                            jqxAppointment = that.tabKeyAppointments[index - 1];
                            that._selectAppointment(jqxAppointment);
                            that._lastSelectedAppointment = jqxAppointment;
                            that._ensureAppointmentVisible(jqxAppointment);
                            return false;
                        }
                        else {
                            that.clearAppointmentsSelection();
                            if (!that.focusedCell) {
                                that._updateFocusedCell();
                                that._ensureVisible(that.focusedCell);
                                return false;
                            }
                            else if (that.focusedCell) {
                                if (that.focusedCell.className.indexOf('-focus') == -1) {
                                    that._updateCellsSelection();
                                    that._ensureVisible(that.focusedCell);
                                    return false;
                                }
                            }

                            return true;
                        }
                    }
                }
                else {
                    if (!that.focusedCell) {
                        that._updateFocusedCell();
                        that._ensureVisible(that.focusedCell);
                    }
                    else if (that.focusedCell) {
                        if (that.focusedCell.className.indexOf('-focus') == -1) {
                            that._updateCellsSelection();
                            that._ensureVisible(that.focusedCell);
                            return false;
                        }
                    }
                }
            }
        }

        if (that.selectedAppointment) {
            if (key == 37) {
                move("left");
            }
            else if (key == 38) {
                move("up");
            }
            else if (key == 40) {
                move("down");
            }
            else if (key == 39) {
                move("right");
            }
            if (key >= 37 && key <= 40)
                return false;
            return;
        }

        var td = this._lastSelectedCell;
        if (!td)
            return;

        if (!$(this._lastSelectedCell).parent()[0]) {
            this._lastSelectedCell = this.rows[0].cells[0];
            td = this._lastSelectedCell;
        }

        var rows = this.rows;

        var view = this._views[this._view].type;
        var viewObject = this._views[this._view];
        var scale = "halfHour";
        if (viewObject.timeRuler && viewObject.timeRuler.scale) {
            scale = viewObject.timeRuler.scale;
        }

        var select = function (cell, type) {
            var minutes = 30;

            switch (scale) {
                case 'sixtyMinutes':
                case 'hour':
                    minutes = 60;
                    break;
                case 'thirtyMinutes':
                case 'halfHour':
                    minutes = 30;
                    break;
                case 'fifteenMinutes':
                case 'quarterHour':
                    minutes = 15;
                    break;
                case 'tenMinutes':
                    minutes = 10;
                    break;
                case 'fiveMinutes':
                    minutes = 5;
                    break;
            }
            var dateString = cell.getAttribute('data-date');
            var selectNewCell = function (newCell, cell, date) {
                if (newCell && (newCell.getAttribute('rowspan') == null || view == "agendaView") && newCell.getAttribute('data-time-slot') == null) {
                    if (date < that.min || date > that.max)
                        return;

                    var rows = that.rows;
                    var prevCell = that._lastSelectedCell;
                    that._lastSelectedCell = newCell;
                    if (event.shiftKey && that._lastSelectedCell) {
                        if (!that.shiftSelectedCell) {
                            that.shiftSelectedCell = td;
                        }
                    }
                    else if (!event.shiftKey) {
                        that.shiftSelectedCell = null;
                    }
                    if (!that.shiftSelectedCell) {
                        for (var i = 0; i < rows.length; i++) {
                            var row = rows[i];
                            if (row.element.getAttribute('data-group-row'))
                                continue;

                            for (var j = 0; j < row.cells.length; j++) {
                                var cell = row.cells[j];
                                cell.removeAttribute('data-selected', "false");
                            }
                        }
                        newCell.setAttribute('data-selected', 'true');
                        that.focusedCell = newCell;
                    }
                    else {
                        if (newCell.getAttribute('data-end-date') && that.shiftSelectedCell.getAttribute('data-end-date')) {
                            that.focusedCell = newCell;
                            that._selectRange(newCell, that.shiftSelectedCell);
                        }
                        else if (!newCell.getAttribute('data-end-date') && !that.shiftSelectedCell.getAttribute('data-end-date')) {
                            that.focusedCell = newCell;
                            that._selectRange(newCell, that.shiftSelectedCell);
                        }
                        else {
                            that.focusedCell = prevCell;
                            that._lastSelectedCell = prevCell;
                        }
                    }

                    that._ensureVisible(that.focusedCell);
                }
            }
            var date = new $.jqx.date(dateString, that.timeZone);
            var resource = cell.getAttribute("data-view");
            switch (type) {
                case "left":
                    var row = that.rowByCell[cell.getAttribute("data-key")];
                    var cellIndex = row.indexOf(cell);
                    if (cellIndex > 0) {
                        var newCell = row.cells[cellIndex - 1];
                        var newDate = new $.jqx.date(newCell.getAttribute("data-date"), that.timeZone);
                    }
                    selectNewCell(newCell, cell, newDate);
                    break;
                case "right":
                    var row = that.rowByCell[cell.getAttribute("data-key")];
                    var cellIndex = row.indexOf(cell);
                    if (cellIndex < row.cells.length - 1) {
                        var newCell = row.cells[cellIndex + 1];
                        var newDate = new $.jqx.date(newCell.getAttribute("data-date"), that.timeZone);
                    }
                    selectNewCell(newCell, cell, newDate);
                    break;
                case "up":
                    var row = that.rowByCell[cell.getAttribute("data-key")];
                    var cellIndex = row.indexOf(cell);
                    var aboveRow = row.aboveRow;
                    if (aboveRow) {
                        var newCell = aboveRow.cells[cellIndex];
                        if (cellIndex == 0 && newCell.getAttribute('rowspan')) {
                            var rowIndex = -1+that.rows.indexOf(row);
                            var newCell = cell;
                            while (rowIndex >= 0) {
                                if (that.rows[rowIndex].cells[0] == newCell) {
                                    rowIndex--;
                                }
                                else {
                                    newCell = that.rows[rowIndex].cells[0];
                                    break;
                                }
                            }
                        }

                        var newDate = new $.jqx.date(newCell.getAttribute("data-date"), that.timeZone);
                        selectNewCell(newCell, cell, newDate);
                    }
                    break;
                case "down":
                    var row = that.rowByCell[cell.getAttribute("data-key")];
                    var cellIndex = row.indexOf(cell);
                    var belowRow = row.belowRow;
                    if (belowRow) {
                        var newCell = belowRow.cells[cellIndex];
                        if (cellIndex == 0 && newCell.getAttribute('rowspan')) {
                            var rowIndex = 1 + that.rows.indexOf(row);
                            var newCell = cell;
                            while (rowIndex < that.rows.length) {
                                if (that.rows[rowIndex].cells[0] == newCell) {
                                    rowIndex++;
                                }
                                else {
                                    newCell = that.rows[rowIndex].cells[0];
                                    break;
                                }
                            }
                        }
                        var newDate = new $.jqx.date(newCell.getAttribute("data-date"), that.timeZone);
                        selectNewCell(newCell, cell, newDate);
                    }
                    break;
                case "home":
                    var row = that.rowByCell[cell.getAttribute("data-key")];
                    var cellIndex = row.indexOf(cell);
                    var firstRow = that.rows[0];
                    var newCell = firstRow.cells[cellIndex];
                    var newDate = new $.jqx.date(newCell.getAttribute("data-date"), that.timeZone);
                    selectNewCell(newCell, cell, newDate);
                    break;
                case "end":
                    var row = that.rowByCell[cell.getAttribute("data-key")];
                    var cellIndex = row.indexOf(cell);
                    var lastRow = that.rows[that.rows.length - 1];
                    var newCell = lastRow.cells[cellIndex];
                    var newDate = new $.jqx.date(newCell.getAttribute("data-date"), that.timeZone);
                    selectNewCell(newCell, cell, newDate);
                    break;
            }
            that._updateCellsSelection();
        }


        var home = function () {
            select(td, "home");
        }

        var end = function () {
            select(td, "end");
        }

        if (key == 36 || (ctrl && key == 38)) {
            home();
            return false;
        }
        else if (key == 35 || (ctrl && key == 40)) {
            end();
            return false;
        }
        else if (key == 37) {
            // left
            if (that.selectedAppointment) {
                move(td, "left");
            }
            else {
                select(td, "left");
            }
            return false;
        }
        else if (key == 38) {
            // up
            if (that.selectedAppointment) {
                move(td, "up");
            }
            else {
                select(td, "up");
            }
            return false;
        }
        else if (key == 40) {
            // down
            if (that.selectedAppointment) {
                move(td, "down");
            }
            else {
                select(td, "down");
            }
            return false;
        }
        else if (key == 39) {
            // right
            if (that.selectedAppointment) {
                move(td, "right");
            }
            else {
                select(td, "right");
            }
            return false;
        }
    },

    getSelectedCells: function () {
        var that = this;
        var rows = that.rows;
        var length = rows.length;
        var selectedCells = new Array();
        for (var i = 0; i < length; i++) {
            var cells = rows[i].cells;

            for (var j = 0; j < cells.length; j++) {
                if (cells[j].getAttribute('data-selected')) {
                    selectedCells.push(cells[j]);
                }
            }
        }
        return selectedCells.sort(function (x, y) {
            return that._sortByDate(x, y);
        }
        );
    },

    getSelection: function () {
        var that = this;
        var selectedCells = that.getSelectedCells();
        if (selectedCells.length == 0)
            return null;

        var date1 = selectedCells[0].getAttribute('data-date');
        var date2 = selectedCells[selectedCells.length - 1].getAttribute('data-date');
        var minutes = that.getMinutesPerScale();
        var view = that._views[that._view].type;

        if (view.toLowerCase().indexOf("month") >= 0) {
            minutes = 0;
        }
        if (selectedCells[0].getAttribute("data-end-date")) {
            minutes = 0;
        }
        date2 = new $.jqx.date(date2, that.timeZone).addMinutes(minutes);

        var view = parseInt(selectedCells[0].getAttribute('data-view'))-1;
        var resource = that._resources[view];

        if (that._views[that._view].type.toLowerCase().indexOf("month") >= 0) {
            return { from: new $.jqx.date(date1, that.timeZone), to: $.jqx.scheduler.utilities.getEndOfDay(date2), resourceId: resource };
        }

        return { from: new $.jqx.date(date1, that.timeZone), to: date2, resourceId: resource };
    },

    clearSelection: function () {
        var that = this;
        var rows = that.rows;
        var length = rows.length;
        for (var i = 0; i < length; i++) {
            var cells = rows[i].cells;

            for (var j = 0; j < cells.length; j++) {
                cells[j].removeAttribute('data-selected');
            }
        }
        that._updateCellsSelection();
    },

    _getvirtualcolumnsindexes: function (left, tablewidth, columnstart, columnend, hasgroups) {
     //   if (this.rowdetails || this.editcell || (this.width && this.width.toString().indexOf('%') >= 0) || this.exporting) {
     //       return { start: 0, end: columnstart + columnend };
     //   }

        if (this.rtl) {
            left = this.hScrollInstance.max - left;
        }

        var xcolumn = 0;
        var hcolumnstart = -1;
        var hcolumnend = columnstart + columnend;

        if (this.autorowheight) {
            return { start: 0, end: columnstart + columnend };
        }

        if (!hasgroups) {
            for (var j = 0; j < columnstart + columnend; j++) {
                var rendercolumn = j;


                if (!this.columns.records[j].hidden) {
                    xcolumn += this.columns.records[j].width;
                }

                if (xcolumn >= left && hcolumnstart == -1) {
                    hcolumnstart = j;
                }

                if (xcolumn > tablewidth + left) {
                    hcolumnend = j
                    break;
                }
            }
        }

        hcolumnend++;
        if (hcolumnend > columnstart + columnend) {
            hcolumnend = columnstart + columnend;
        }

        if (hcolumnstart == -1) {
            hcolumnstart = 0;
        }

        return { start: hcolumnstart, end: hcolumnend };
    },

    _renderhorizontalscroll: function () {
        var that = this;
        var hScrollInstance = that.hScrollInstance;
        var horizontalscrollvalue = hScrollInstance.value;
        if (that.hScrollBar[0].style.visibility === 'hidden') {
            hScrollInstance.value = 0;
            horizontalscrollvalue = 0;
        }

        var left = parseInt(horizontalscrollvalue);
        if (that.table == null)
            return;

        //

        var validParentNode = function (element) {
            if (element.parentNode && element.parentNode.nodeName != "#document-fragment") {
                return true;
            }
            return false;
        }

        var virtualcolumnsindexes = that._getvirtualcolumnsindexes(left, that._hostWidth, 0, that.columns.records.length, false);
        var hvirtualcolumnstart = virtualcolumnsindexes.start;
        var hvirtualcolumnend = virtualcolumnsindexes.end;
        var allrows = that.rows;
        for (var cindex = 0; cindex < hvirtualcolumnstart; cindex++) {
            var rendercolumn = cindex;
            var columnrecord = that.columns.records[rendercolumn].element[0];
            if (validParentNode(columnrecord)) {
                columnrecord.parentNode.removeChild(columnrecord);
            }
        }
        for (var cindex = hvirtualcolumnend; cindex < that.columns.records.length; cindex++) {
            var rendercolumn = cindex;
            var columnrecord = that.columns.records[rendercolumn].element[0];
            if (validParentNode(columnrecord)) {
                columnrecord.parentNode.removeChild(columnrecord);
            }
        }
        for (var cindex = hvirtualcolumnstart; cindex < hvirtualcolumnend; cindex++) {
            var rendercolumn = cindex;
            columnrecord = that.columns.records[rendercolumn].element[0];
            if (!validParentNode(columnrecord)) {
                that.columnsrow[0].appendChild(columnrecord);
            }
        }
        //

        var columnsrow = that.columnsrow;
        var columnstart = 0;
        var columnend = that.columns.records.length - columnstart;
        var columns = that.columns.records;
        var isempty = that.source.records.length == 0;
        if (that.rtl) {
            if (that.hScrollBar.css('visibility') != 'hidden') {
                left = hScrollInstance.max - left;
            }
        }

        that.table[0].style.left = -left + 'px';
        if (that.pinnedtable[0].style.display == "block") {
            that.pinnedtable[0].style.left = -left + 'px';
        }

        if (that._resources.length > 0 && that.tableRows > 0)
        {
            for (var i = 0; i < this.table[0].rows.length; i++)
            {
                var row = this.table[0].rows[i];
                if (row.getAttribute('data-group-row'))
                {
                    $(row).find('span').css('left', 5+left);
                }
            }
        }

        columnsrow[0].style.marginLeft = -left + 'px';
    },

    _getDayName: function (day, format) {
        if (day >= 7) day -= 7;
        if (!format) {
            format = this.dayNameFormat;
            if (this.isTouchDevice()) {
                format = this.touchDayNameFormat;
            }
        }

        var dayString = this.schedulerLocalization.days.names[day];
        switch (format) {
            case 'full':
                dayString = this.schedulerLocalization.days.names[day];
                break;
            case 'abbr':
                dayString = this.schedulerLocalization.days.namesAbbr[day];
                break;
            case 'shortest':
                dayString = this.schedulerLocalization.days.namesShort[day];
                break;
            case 'firstTwoLetters':
                dayString = dayString.substring(0, 2);
                break;
            case 'firstLetter':
                dayString = dayString.substring(0, 1);
                break;
        }
        return dayString;
    },

    _initializeColumns: function () {
        if (this._views.length === 0) {
            this._views.push({ type: "dayView" });
        }
        if (!this._views[this._view]) {
            throw new Error("jqxScheduler: View is undefined. You need to define the View in the Views Array when you create jqxScheduler");
        }

        var view = this._views[this._view].type;
        var viewObject = this._views[this._view];
        if (viewObject.timeSlotWidth)
        {
            viewObject.timeSlotWidth = Math.max(viewObject.timeSlotWidth, 30);
            viewObject.columnWidth = viewObject.timeSlotWidth;
        }

        if (viewObject.columnWidth)
        {
            if (viewObject.columnWidth < 30)
            {
                viewObject.columnWidth = 30;
            }
        }

        if (this.columns && this.columns.records) {
            for (var i = 0; i < this.columns.records.length; i++) {
                this._removecolumnhandlers(this.columns.records[i]);
            }
        }
        this.columns = new Array();
        var columnGroups = new Array();
        var that = this;
        var createtimelineDayColumns = function (date, resourceName) {
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
                    case 'thirtyMinutes':
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
            var width = "auto";
            if (viewObject.columnWidth) {
                width = pow * viewObject.columnWidth;
            }
            else {
                width = pow * 80;
            }
            for (var i = 0; i < columnsCount; i++) {
                var cellvalue = currentDate.toDate();
                if (format === "auto")
                {
                    if ((cellvalue.getHours() == 0 && cellvalue.getMinutes() == 0) || (cellvalue.getHours() == 12 && cellvalue.getMinutes() == 0))
                    {
                        var cellsFormat = "hh tt";
                    }
                    else var cellsFormat = "hh:mm";
                }
                else if ($.isFunction(format))
                {
                    var cellsFormat = format(cellvalue);
                }
                else
                {
                    cellsFormat = format;
                }

                if ($.jqx.dataFormat.isDate(cellvalue)) {
                    cellvalue = $.jqx.dataFormat.formatdate(cellvalue, cellsFormat, that.schedulerLocalization);
                }
                currentDate = currentDate.addMinutes(minutes, false);
                that.columns.push({ columnGroup: resourceName, text: cellvalue, minwidth: 30, width: width });
            }
        }

        for (var j = 0; j < this.tableColumns; j++) {
            if (this.tableColumns > 1) {
                var resourceName = that._resources[j] ? that._resources[j] : "Resource" + j;

                columnGroups.push({
                    text: resourceName, name: resourceName
                });
            }
            var align = "left";
            if (this.rtl) align = "right";
            switch (view) {
                case "dayView":
                    var viewStart = this.getViewStart();
                    if (false === viewObject.showWeekends) {
                        if (viewStart.dayOfWeek() === 0 || viewStart.dayOfWeek() === 6)
                            viewStart = viewStart.addDays(1);

                        if (viewStart.dayOfWeek() === 0 || viewStart.dayOfWeek() === 6)
                            viewStart = viewStart.addDays(1);
                    }
                    var width = "auto";
                    if (viewObject && viewObject.columnWidth) {
                        width = viewObject.columnWidth;
                    }
                    var resourceName = that._resources[j] ? that._resources[j] : "Resource" + j;
                    this.columns.push({ align: align, width: width, columnGroup: resourceName, text: this._getDayName(viewStart.dayOfWeek()) });
                    break;
                case "weekView":
                case "monthView":
                    for (var i = 0; i < 7; i++) {
                        var day = this.schedulerLocalization.firstDay + i;
                        if (false === viewObject.showWeekends) {
                            if (i === 0 || i === 6)
                                continue;
                        }
                        var width = "auto";
                        if (viewObject && viewObject.columnWidth) {
                            width = viewObject.columnWidth;
                        }
                        var resourceName = that._resources[j] ? that._resources[j] : "Resource" + j;
                        this.columns.push({ align: view == "weekView" ? align : "center", width: width, columnGroup: resourceName, text: this._getDayName(day) });
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
                        var resourceName = that._resources[j] ? that._resources[j] : "Resource" + j;
                        columnGroups.push({align: that.rtl ? "right" : "left", parentGroup: resourceName, name: this._getDayName(day) + j, text: this._getDayName(day) });
                        createtimelineDayColumns(that.getViewStart().addDays(i), this._getDayName(day) + j);
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
                        var width = "auto";
                        if (viewObject.columnWidth) {
                            width = viewObject.columnWidth;
                        }
                        else {
                            width = 100;
                        }
                        var cellvalue = currentDate.toDate();

                        if (format === "auto") {
                            var cellsFormat = "dd";
                            cellvalue = currentDate.toDate();
                            if (cellvalue.getDate() === 1) cellsFormat = "MMM dd";
                        }
                        else if ($.isFunction(format))
                        {
                            var cellsFormat = format(cellvalue);
                        }
                        else
                        {
                            cellsFormat = format;
                        }

                        if ($.jqx.dataFormat.isDate(cellvalue)) {
                            cellvalue = $.jqx.dataFormat.formatdate(cellvalue, cellsFormat, that.schedulerLocalization);
                        }
                        currentDate = currentDate.addDays(1);
                        var resourceName = that._resources[j] ? that._resources[j] : "Resource" + j;
                        that.columns.push({ minwidth: 30, columnGroup: resourceName, text: cellvalue, width: width });
                    }
                    break;
                case "agendaView":
                    var dateColumnWidth = viewObject.dateColumnWidth;
                    var timeColumnWidth = viewObject.timeColumnWidth;
                    var appointmentColumnWidth = viewObject.appointmentColumnWidth;
                    if (!appointmentColumnWidth) appointmentColumnWidth = "70%";
                    if (!timeColumnWidth) timeColumnWidth = "auto";
                    if (!dateColumnWidth) dateColumnWidth = "auto";

                    that.columns.push({ text: that.schedulerLocalization.agendaDateColumn, width: dateColumnWidth });
                    that.columns.push({ text: that.schedulerLocalization.agendaTimeColumn, width: timeColumnWidth });
                    that.columns.push({ text: that.schedulerLocalization.agendaAppointmentColumn, width: appointmentColumnWidth });
                    break;
            }
        }

        if (columnGroups.length > 0) {
            this.columnGroups = columnGroups;
        }
        var that = this;
        var _columns = new $.jqx.schedulerDataCollection(this.element);
        var visibleindex = 0;
        this._columns = this.columns;


        var position = "left";
        var column = new $.jqx.scheduler.column(that, this);
        column.visibleindex = visibleindex++;
        column.text = "";
        column.width = that.timeRulerWidth;
        column.editable = false;
        column.timeColumn = true;
        position = "left";
        column.text = "";
        column.hidden = false;
        column.width = that.timeRulerWidth;
        var gmtColumn = false;
        if (viewObject.timeRuler && (view === "dayView" || view === "weekView")) {
            column._text = viewObject.timeRuler.text || "";
            position = viewObject.timeRuler.position || "left";
            column.hidden = viewObject.timeRuler.hidden || false;
            column.width = viewObject.timeRuler.width || that.timeRulerWidth;
            if (viewObject.timeRuler.timeZones) {
                gmtColumn = true;
            }
        }
        else if (view !== "dayView" && view !== "weekView") {
            column.hidden = true;
        }

        var addTZColumn = function (index) {
            var column = new $.jqx.scheduler.column(that, that);
            column.visibleindex = visibleindex++;
            column.text = "";
            column.width = that.timeRulerWidth;
            column.editable = false;
            column.timeColumn = true;
            position = "left";
            column.text = "";
            column.hidden = false;
            column.timeZone = viewObject.timeRuler.timeZones[index].id;
            column.width = that.timeRulerWidth;
            if (viewObject.timeRuler && (view === "dayView" || view === "weekView")) {
                column._text = viewObject.timeRuler.timeZones[i].text || "";
                column.hidden = viewObject.timeRuler.hidden || false;
                column.width = viewObject.timeRuler.width || that.timeRulerWidth;
                _columns.add(column);
            }
        }

        if (position === "left" && (view === "dayView" || view === "weekView")) {
            if (viewObject.timeRuler && viewObject.timeRuler.timeZones) {
                for (var i = 0; i < viewObject.timeRuler.timeZones.length; i++) {
                    addTZColumn(i);
                }
            }
            _columns.add(column);
        }

        if (position === "left" && view === "monthView" && viewObject.showWeekNumbers) {
            column.hidden = false;
            _columns.add(column);
        }

        var keys = new Array();
        $.each(this.columns, function (index) {
            if (that.columns[index] != undefined) {
                var column = new $.jqx.scheduler.column(that, this);
                column.visibleindex = visibleindex++;

                _columns.add(column);
            }
        });
        if (position === "right" && (view === "dayView" || view === "weekView")) {
            if (viewObject.timeRuler) {
                for (var i = 0; i < viewObject.timeRuler.timeZones.length; i++) {
                    addTZColumn(i);
                }
            }
            _columns.add(column);
        }
        if (position === "right" && view === "monthView" && viewObject.showWeekNumbers) {
            column.hidden = false;
            _columns.add(column);
        }

        if (this.rtl) {
            _columns.records.reverse();
        }

        this.columns = _columns;
    },

    _getColumnsLengthPerView: function () {
        var view = this._views[this._view].type;
        var viewObject = this._views[this._view];

        var columnsLengthPerView = 1;
        switch (view) {
            case "dayView":
                columnsLengthPerView = 1;
                break;
            case "weekView":
                if (viewObject.showWeekends !== false) {
                    columnsLengthPerView = 7;
                }
                else {
                    columnsLengthPerView = 5;
                }
                break;
            case "monthView":
                if (viewObject.showWeekends !== false) {
                    columnsLengthPerView = 7;
                }
                else {
                    columnsLengthPerView = 5;
                }
                break;
            case "timelineDayView":
            case "timelineWeekView":
            case "timelineMonthView":
                columnsLengthPerView = this.columns.records.length;
                break;
            case "agendaView":
                columnsLengthPerView = this.columns.records.length;
                break;
        }
        return columnsLengthPerView;
    },
 
    _renderagenda: function () {
        var that = this;
        var view = that._views[that._view].type;
        var viewObject = that._views[that._view];
        var viewStart = that.getViewStart();
        var viewEnd = $.jqx.scheduler.utilities.getEndOfDay(that.getViewEnd().addDays(-1));
        that._prepareAppointmentsInView(viewStart, viewEnd);
        var pageSize = that.appointmentsToRender.length;
        var dates = new Array();
        var totalrows = 0;
        for (var i = 0; i < that.appointmentsToRender.length; i++) {
            var ownerAppointment = that.appointmentsToRender[i];
            var date = ownerAppointment.from.clearTime();
            while (date < $.jqx.scheduler.utilities.getEndOfDay(ownerAppointment.to)) {
                var dateMidnightString = date.toString();
                if (!dates[dateMidnightString]) {
                    dates[dateMidnightString] = { date: date, appointments: new Array() };
                    dates[dateMidnightString].appointments.push(ownerAppointment);
                    dates[dates.length] = dates[dateMidnightString];
                    totalrows++;
                }
                else {
                    dates[dateMidnightString].appointments.push(ownerAppointment);
                    totalrows++;
                }
                date = date.addDays(1).clearTime();
            }
        }

        var start = 0;
        var tablewidth = 0;
        that.rows = new Array();
        var isIE7 = $.jqx.browser.msie && $.jqx.browser.version < 8;
        var firstIndex = 0;
        var widthOffset = 0;
        var rtlTableClassName = that.rtl ? " " + that.toTP('jqx-grid-table-rtl') : "";
        var emptyWidth = 0;
        var tableHTML = "<table cellspacing='0' cellpadding='0' class='" + that.toTP('jqx-grid-table') + rtlTableClassName + "' id='table" + that.element.id + "'><colgroup>";
        var columnslength = that.columns.records.length;
        for (var j = 0; j < columnslength; j++) {
            var columnrecord = that.columns.records[j];
            if (columnrecord.hidden) {
                firstIndex++;
                nonHiddenColumns--;
                continue;
            }
            var width = columnrecord.width;
            if (width < columnrecord.minwidth) width = columnrecord.minwidth;
            if (width > columnrecord.maxwidth) width = columnrecord.maxwidth;
            width -= widthOffset;
            if (width < 0) {
                width = 0;
            }

            if (isIE7) {
                var w = width;
                if (j == firstIndex) w++;
                tableHTML += "<col style='max-width: " + w + "px; width: " + w + "px;'>";
            }
            else {
                tableHTML += "<col style='max-width: " + width + "px; width: " + width + "px;'>";
            }
            emptyWidth += width;
        }
        tableHTML += "</colgroup>";
        if (pageSize == 0) {
            var tablerow = '<tr role="row">';
            var height = this.host.height();
            var headerHeight = 0;
            if (!that.columnGroups) {
                headerHeight += that.showHeader ? that.columnsHeight : 0;
            }
            else {
                headerHeight += that.showHeader ? that.columnsheader.height() : 0;
            }

            if (that.showToolbar) {
                headerHeight += that.toolbarHeight;
            }

            if (that.showLegend && that._resources.length > 0) {
                headerHeight += that.legendHeight;
            }
            height -= headerHeight;

            var tablecolumn = '<td data-date="' + viewStart.toString() + '" colspan="' + this.columns.records.length + '" role="gridcell" style="border: none; min-height: ' + height + 'px; height: ' + height + 'px; max-width:' + emptyWidth + 'px; width:' + emptyWidth + 'px;';
            var cellclass = this.toTP('jqx-cell') + " " + this.toTP('jqx-grid-cell') + " " + this.toTP('jqx-item');
            cellclass += ' ' + this.toTP('jqx-center-align');
            tablecolumn += '" class="' + cellclass + '">';
            tablecolumn += this.schedulerLocalization.emptyDataString;
            tablecolumn += '</td>';
            tablerow += tablecolumn;
            tablerow += "</tr>";
            tableHTML += tablerow;
            this.table[0].style.width = emptyWidth + 2 + 'px';
            tablewidth = emptyWidth;
        }

        var rowHeight = that.rowsHeight;
        if (that.isTouchDevice()) {
            rowsHeight = that.touchRowsHeight;
        }

        for (var i = 0; i < dates.length; i++) {
            var key = i;
            var date = dates[i];

            for (var r = 0; r < date.appointments.length; r++) {
                var left = 0;
                var tablerow = '<tr data-key="' + key + '" role="row">';
                start = 0;
                var appointment = date.appointments[r];
                for (var j = 0; j < columnslength; j++) {
                    var column = that.columns.records[j];
                    var columnIndex = j;
                    if (that.rtl) {
                        columnIndex = columnslength - 1 - j;
                    }

                    var width = column.width;
                    if (width < column.minwidth) width = column.minwidth;
                    if (width > column.maxwidth) width = column.maxwidth;
                    width -= widthOffset;

                    if (width < 0) {
                        width = 0;
                    }

                    var cellclass = that.toTP('jqx-cell') + " " + that.toTP('jqx-grid-cell') + " " + that.toTP('jqx-item');

                    if (that.rtl) {
                        cellclass += ' ' + that.toTP('jqx-cell-rtl');
                    }

                    var colspan = "";
                    var key = that.dataview.generatekey();
                    var currentView = -1;
                    var currentDate = date.date;
                    var height = rowHeight + "px";
                    var tablecolumn = '<td data-key="' + key + '" data-view="' + (currentView) + '" data-date="' + currentDate.toString() + '" role="gridcell" ' + colspan + ' style="max-width:' + width + 'px; width:' + width + 'px; height: ' + height + '; min-height: ' + rowHeight + 'px;';
                    if (columnIndex == 0 && r == 0) {
                        var rowspan = date.appointments.length;
                        var tablecolumn = '<td rowspan="' + rowspan + '" data-key="' + key + '" data-view="' + (currentView) + '" data-date="' + currentDate.toString() + '" role="gridcell" ' + colspan + ' style="max-width:' + width + 'px; width:' + width + 'px;  min-height: ' + rowHeight + 'px;';
                        cellclass += ' ' + that.toTP('jqx-center-align');
                    }
                    else if (columnIndex == 0) {
                        start++;
                        continue;
                    }
                    if (that.rtl && columnIndex == 1) {
                        cellclass += ' ' + that.toTP('jqx-right-align');
                    }

                    if (!(column.hidden)) {
                        left += widthOffset + width;
                        if (start == 0 && !that.rtl) {
                            tablecolumn += 'border-left-width: 0px;'
                        }
                        else {
                            tablecolumn += 'border-left-width: 1px;'
                        }

                        start++;
                    }
                    else {
                        tablecolumn += 'display: none;'
                        that._hiddencolumns = true;
                    }

                    tablecolumn += '" class="' + cellclass + '">';
                    var cellvalue = "";
                    if (columnIndex == 0 && r == 0) {
                        var dayName = currentDate.toString("dddd", that.schedulerLocalization);
                        var monthYearName = currentDate.toString("MMMM, yyyy", that.schedulerLocalization);

                        var className = that.toTP("jqx-scheduler-agenda-date");
                        var className2 = that.toTP("jqx-scheduler-agenda-day");
                        var className3 = that.toTP("jqx-scheduler-agenda-week");
                        cellvalue = '<div class="' + className + '"><strong class="' + className2 + '">' + currentDate.day() + '</strong><br/><em class="' + className3 + '">' + dayName + '</em><br/><span class="' + className + '">' + monthYearName + '</span></div>';

                    }
                    if (columnIndex == 1) {
                        var format = "auto";
                        var viewObject = this._views[this._view];
                        var from = appointment.from;
                        var to = appointment.to;

                        if (viewObject.timeRuler && viewObject.timeRuler.formatString) {
                            format = viewObject.timeRuler.formatString;
                        }

                        var fromFormat = format;
                        var toFormat = format;
                        if (format === "auto") {
                            if ((from.hour() == 0 && from.minute() == 0) || (from.hour() == 12 && from.minute() == 0)) {
                                var fromFormat = "hh tt";
                            }
                            else var fromFormat = "hh:mm";
                            if ((to.hour() == 0 && to.minute() == 0) || (to.hour() == 12 && to.minute() == 0)) {
                                var toFormat = "hh tt";
                            }
                            else var toFormat = "hh:mm";
                        }
                        var className = that.toTP("jqx-scheduler-agenda-time");
                        if (appointment.allDay) {
                            cellvalue = "<span class='" + className + "'>" + that.schedulerLocalization.agendaAllDayString + "</span>";
                        }
                        else {
                            if (!that.rtl) {
                                cellvalue = "<span class='" + className + "'>" + from.toString(fromFormat, that.schedulerLocalization) + " - " + to.toString(toFormat, that.schedulerLocalization) + "</span>";
                            }
                            else {
                                cellvalue = "<span class='" + className + "'>" + to.toString(toFormat, that.schedulerLocalization) + " - " + from.toString(fromFormat, that.schedulerLocalization) + "</span>";
                            }
                        }
                    }
                    else if (columnIndex == 2) {
                        if (appointment.resourceId) {
                            $.each(that._resources, function (index, value) {
                                if (appointment.resourceId == value) {
                                    var colors = that.getColors(index);
                                    var label = this.toString();
                                    var className = that.toTP("jqx-scheduler-agenda-appointment-resource jqx-scheduler-legend");
                                    if (that.rtl) {
                                        var className = that.toTP("jqx-scheduler-agenda-appointment-resource-rtl jqx-scheduler-legend");
                                    }

                                    var element = "<div data-key='" + appointment.id + "' class='" + className + "' style='margin-right: 5px; border-color: " + colors.border + "; background: " + colors.background + ";' class='" + that.toThemeProperty('jqx-scheduler-legend') + "'></div>";
                                    cellvalue = element;
                                }
                            });
                        }
                        var title = appointment.subject ? appointment.subject : "(No Title)";
                        var location = appointment.location;
                        var description = appointment.description;
                        var status = appointment.status ? that.schedulerLocalization.editDialogStatuses[appointment.status] : "";
                        var isRecurrent = appointment.isRecurrentAppointment();
                        var isException = appointment.isException();

                        var tooltip = ""
                        + that.schedulerLocalization.editDialogSubjectString + ": " + title + "";
                        if (location) {
                            tooltip += "\n" + that.schedulerLocalization.editDialogLocationString + ": " + location + ""
                        }
                        if (description) {
                            tooltip += "\n" + that.schedulerLocalization.editDialogDescriptionString + ": " + description + ""
                        }
                        if (status) {
                            tooltip += "\n" + that.schedulerLocalization.editDialogStatusString + ": " + status + ""
                        }
                        if (isRecurrent) {
                            tooltip += "\n" + that.schedulerLocalization.editDialogRepeatString + ": " + isRecurrent + "";
                        }
                        var className = that.toTP("jqx-scheduler-agenda-appointment jqx-scheduler-legend-label");
                        if (that.rtl) {
                            var className = that.toTP("jqx-scheduler-agenda-appointment-rtl jqx-scheduler-legend-label");
                        }

                        cellvalue += "<span data-key='" + appointment.id + "' title='" + tooltip + "' class='" + className + "'>" + title + "</span>";
                    }

                    tablecolumn += cellvalue;
                    tablecolumn += '</td>';
                    tablerow += tablecolumn;
                }
                if (tablewidth == 0) {
                    that.table[0].style.width = left + 2 + 'px';
                    that.pinnedtable[0].style.width = left + 2 + 'px';
                    tablewidth = left;
                }
                tablerow += "</tr>";
                tableHTML += tablerow;
            }
        }

        tableHTML += '</table>';

        that.table[0].innerHTML = tableHTML;
        that.pinnedtable[0].innerHTML = tableHTML;
        that.pinnedtable[0].style.display = "none";
        var t = $(that.table[0].firstChild);
        var t2 = $(that.pinnedtable[0].firstChild);
        that._table = t;
        that._pinnedtable = t2;
        if ($.jqx.browser.msie && $.jqx.browser.version < 10) {
            that._table[0].style.width = tablewidth + 'px';
            that._pinnedtable[0].style.width = tablewidth + 'px';
        }
        if (pageSize === 0) {
            that._table[0].style.width = (2 + tablewidth) + 'px';
            that._pinnedtable[0].style.width = (2 + tablewidth) + 'px';
            that._pinnedtable[0].style.display = "none";
        }
        that._pinnedtable[0].style.display = "none";

        that._table.addClass('jqx-grid-table-one-cell jqx-disableselect');
        that.table[0].rows = that.table[0].firstChild.rows;
        that.rowByCell = new Array();
        that.columnCells = new Array();

        function createRow() {
            var obj = {};
            obj.cells = new Array();
            obj.indexOf = function (cell) {
                for (var i = 0; i < obj.cells.length; i++) {
                    if (obj.cells[i].getAttribute('data-key') == cell.getAttribute('data-key'))
                        return i;
                }
                return -1;
            }
            return obj;
        }

        that.cellWidth = 0;
        that.cellHeight = 0;
        var rowsLength = that.table[0].rows.length;
        for (var i = 0; i < rowsLength; i++) {
            var tableRow = that.table[0].rows[i];
            if (tableRow.getAttribute('data-group-row'))
                continue;

            var row = new createRow();
            row.aboveRow = null;
            row.belowRow = null;
            if (that.rows.length > 0) {
                row.aboveRow = that.rows[that.rows.length - 1];
                that.rows[that.rows.length - 1].belowRow = row;
            }
            row.element = tableRow;
            that.rows.push(row);
            var addedCell = false;
            for (var j = 0; j < tableRow.cells.length; j++) {
                if (tableRow.cells.length < that.columns.records.length && !addedCell) {
                    var x = i;
                    while (x >= 0) {
                        var prevRow = that.table[0].rows[x];
                        if (that.table[0].rows[x].cells.length == that.columns.records.length) {
                            var cell = prevRow.cells[0];
                            if (!that.columnCells[row.cells.length])
                                that.columnCells[row.cells.length] = new Array();

                            that.columnCells[row.cells.length].push(cell);
                            if (that.cellWidth == 0) {
                                that.cellWidth = cell.clientWidth;
                            }
                            if (that.cellHeight == 0 && (rowsLength == 1 || i > 1)) {
                                that.cellHeight = cell.clientHeight;
                            }

                            row.cells.push(cell);
                            addedCell = true;
                            break;
                        }
                        x--
                    }
                }

                var cell = tableRow.cells[j];
                if (cell.style.display === "none")
                    continue;

                if (cell.className.indexOf('jqx-grid-cell-pinned') >= 0)
                    continue;

                if (!that.columnCells[row.cells.length])
                    that.columnCells[row.cells.length] = new Array();

                that.columnCells[row.cells.length].push(cell);

                if (that.cellWidth == 0) {
                    that.cellWidth = cell.clientWidth;
                }
                if (that.cellHeight == 0 && (rowsLength == 1 || i > 1)) {
                    that.cellHeight = cell.clientHeight;
                }

                row.cells.push(cell);
                that.rowByCell[cell.getAttribute('data-key')] = row;
            }
        }
        if (pageSize === 0) {
            that._table[0].style.tableLayout = "auto";
        }

        that._updateScrollbars(that.host.height());
        that._arrange();

        if (that.rendered) {
            that.rendered();
        }
        that.renderedTime = new Date();
    },

    _renderrows: function () {
        var that = this;
        if (that._loading)
            return;

        if (that._updating || that._appupdating) {
            return;
        }

        if (that.rendering) {
            that.rendering();
        }

        var that = this;
        var view = that._views[that._view].type;
        var viewObject = that._views[that._view];
        if (view == "agendaView") {
            that._renderagenda();
            return;
        }

        var allDayRowsCount = 1;
        var viewStart = that.getViewStart();
        var viewEnd = $.jqx.scheduler.utilities.getEndOfDay(that.getViewEnd());
        that._prepareAppointmentsInView(viewStart, viewEnd);

        var monthRowHeights = new Array();
        if (view === "weekView" || view === "dayView") {
            var allDayRowsCount = that.getMaxAllDayAppointments(that.appointmentsToRender);
        }
        else if (view === "monthView" && viewObject.monthRowAutoHeight && that.rows && that.rows.length == 6) {
            monthRowHeights = that._getMonthAppointmentsPerWeek();
        }

        var resourcesCount = that.tableRows > 1 ? that.tableRows : 0;
        var scale = "halfHour";
        var rowHeight = null;
        var allDayRowHeight;
        if (viewObject.rowHeight) {
            rowHeight = viewObject.rowHeight;
        }
        if (viewObject && viewObject.allDayRowHeight) {
            allDayRowHeight = viewObject.allDayRowHeight;
        }
        if (viewObject.timeRuler && viewObject.timeRuler.scale) {
            scale = viewObject.timeRuler.scale;
        }
        var tablewidth = 0;
        that.table[0].rows = new Array();
        that.rows = new Array();
        var cellclass = that.toTP('jqx-cell') + " " + that.toTP('jqx-widget-content');
        if (that.rtl) {
            cellclass += " " + that.toTP('jqx-cell-rtl')
        }

        var columnslength = that.columns.records.length;
        var columnsLengthPerView = that._getColumnsLengthPerView();

        var isIE7 = $.jqx.browser.msie && $.jqx.browser.version < 8;
        if (isIE7) {
            that.host.attr("hideFocus", "true");
        }

        that._lastSelectedCell = null;
        that.focusedCell = null;
        var records = new Array();
        var filterRecords = that.source.records;
        filterRecords = that.dataview.evaluate(filterRecords);
        that.dataViewRecords = filterRecords;
        that.cells = new Array();
        var records = that.dataViewRecords;

        that.renderedRecords = that.getRows();
        var zindex = that.tableZIndex;

        var pageSize = that.getRows().length;
        var widthOffset = 0;
        var emptyWidth = 0;
        if (isIE7) {
            for (var j = 0; j < columnslength; j++) {
                var columnrecord = that.columns.records[j];
                var width = columnrecord.width;
                if (width < columnrecord.minwidth) width = columnrecord.minwidth;
                if (width > columnrecord.maxwidth) width = columnrecord.maxwidth;
                var tablecolumn = $('<table><tr><td role="gridcell" style="max-width: ' + width + 'px; width:' + width + 'px;" class="' + cellclass + '"></td></tr></table>');
                $(document.body).append(tablecolumn);
                var td = tablecolumn.find('td');
                widthOffset = 1 + parseInt(td.css('padding-left')) + parseInt(td.css('padding-right'));
                tablecolumn.remove();
                break;
            }
        }

        var rtlTableClassName = that.rtl ? " " + that.toTP('jqx-grid-table-rtl') : "";
        var tableHTML = "<table cellspacing='0' cellpadding='0' class='" + that.toTP('jqx-grid-table') + rtlTableClassName + "' id='table" + that.element.id + "'><colgroup>";
        var firstIndex = 0;
        var nonHiddenColumns = columnslength;
        var pow = 2;
        var minutes = 30;
        switch (scale) {
            case 'sixtyMinutes':
            case 'hour':
                minutes = 60;
                pow = 1;
                break;
            case 'thirtyMinutes':
            case 'halfHour':
                minutes = 30;
                pow = 2;
                break;
            case 'fifteenMinutes':
            case 'quarterHour':
                minutes = 15;
                pow = 4;
                break;
            case 'tenMinutes':
                minutes = 10;
                pow = 6;
                break;
            case 'fiveMinutes':
                minutes = 5;
                pow = 12;
                break;
        }
        var columnsPow = 1;
        if (view === "timelineDayView" || view === "timelineWeekView") {
            columnslength = pow * columnslength;
            columnsPow = pow;
            columnsLengthPerView = columnslength / that.tableColumns;
        }
        else if (view === "timelineMonthView") {
            columnsLengthPerView = columnslength / that.tableColumns;
        }
        else if (view === "monthView") {
            if (viewObject.showWeekNumbers) {
                columnsLengthPerView = (columnslength - that.tableColumns) / that.tableColumns;
            }
            else {
                columnsLengthPerView = columnslength / that.tableColumns;
            }
        }

        var getColumnByIndex = function (index) {
            var columnrecord = that.columns.records[index];
            if (columnrecord)
                return columnrecord;

            while (index >= that.columns.records.length) {
                index -= that.columns.records.length;
            }

            var columnrecord = that.columns.records[index];
            return columnrecord;
        }
        for (var j = 0; j < columnslength; j++) {
            var columnrecord = getColumnByIndex(j);
            if (columnrecord.hidden) {
                firstIndex++;
                nonHiddenColumns--;
                continue;
            }
            var width = columnrecord.width / columnsPow;
            if (width < columnrecord.minwidth) width = columnrecord.minwidth / columnsPow;
            if (width > columnrecord.maxwidth) width = columnrecord.maxwidth / columnsPow;
            width -= widthOffset;
            if (width < 0) {
                width = 0;
            }
            if (view == "monthView" && that.rtl && columnrecord.timeColumn) {
                width++;
            }
            if (isIE7) {
                var w = width;
                if (j == firstIndex) w++;
                tableHTML += "<col style='max-width: " + w + "px; width: " + w + "px;'>";
            }
            else {
                tableHTML += "<col style='max-width: " + width + "px; width: " + width + "px;'>";
            }
            emptyWidth += width;
        }
        tableHTML += "</colgroup>";

        that._hiddencolumns = false;

        if (pageSize === 0) {
            var tablerow = '<tr role="row">';
            var height = that.host.height();
            if (that.pageable) {
                height -= that.pagerHeight;
                if (that.pagerPosition === "both") {
                    height -= that.pagerHeight;
                }
            }
            height -= that.columnsHeight;
            if (that.showLegend && that._resources.length > 0) {
                height -= that.legendHeight;
            }

            if (height < 25) {
                height = 25;
            }
            if (that.hScrollBar[0].style.visibility != "hidden") {
                height -= that.hScrollBar.outerHeight();
            }

            if (that.height === "auto" || that.height === null || that.autoheight) {
                height = 300;
            }

            var tablecolumn = '<td colspan="' + that.columns.records.length + '" role="gridcell" style="border: none; min-height: ' + height + 'px; height: ' + height + 'px; max-width:' + emptyWidth + 'px; width:' + emptyWidth + 'px;';
            var cellclass = that.toTP('jqx-cell') + " " + that.toTP('jqx-grid-cell') + " " + that.toTP('jqx-item');
            if (that.rtl) {
                cellclass += ' ' + that.toTP('jqx-cell-rtl');
            }

            cellclass += ' ' + that.toTP('jqx-center-align');
            tablecolumn += '" class="' + cellclass + '">';
            tablecolumn += that.schedulerLocalization.emptyDataString;
            tablecolumn += '</td>';
            tablerow += tablecolumn;
            tableHTML += tablerow;
            that.table[0].style.width = emptyWidth + 2 + 'px';
            tablewidth = emptyWidth;
        }
        var tableRows = that.getRows();
        var viewStart = that.getViewStart();
        var height = that._hostHeight ? that._hostHeight : that.host.height();
        var headerHeight = 0;
        if (!that.columnGroups) {
            headerHeight += that.showHeader ? that.columnsHeight : 0;
        }
        else {
            headerHeight += that.showHeader ? that.columnsheader.height() : 0;
        }

        if (that.showToolbar) {
            headerHeight += that.toolbarHeight;
        }

        if (that.showLegend && that._resources.length > 0) {
            headerHeight += that.legendHeight;
        }

        var showAllDayRow = that.showAllDayRow;
        var resourcesHeight = 23;
        if (viewObject.resourceHeaderRowHeight) {
            resourcesHeight = viewObject.resourcesRowHeight;
        }
        resourcesHeight += 2;
        if (viewObject.showAllDayRow != undefined) {
            showAllDayRow = viewObject.showAllDayRow;
        }

        var hscroll = that._columnswidth > that._hostWidth;
        var scrollSize = hscroll ? (3 + that.scrollBarSize) : 0;
        var resourcesInView = that.tableRows > 1 ? that.resources.unitsInView : 1;
        if (resourcesInView == undefined)
            resourcesInView = that._resources.length;

        if (that.resources && that.resources.resourceRowHeight) {
            rowHeight = that.resources.resourceRowHeight;
        }
        if (rowHeight == null || rowHeight == "auto") {
            var defaultRowHeight = that.rowsHeight;
            var threeDefaultRowHeight = 3 * defaultRowHeight;
            if (that.isTouchDevice()) {
                defaultRowHeight = that.touchRowsHeight;
                var threeDefaultRowHeight = 22+defaultRowHeight;
            }
            
            if (that.tableRows == 1) {
                rowHeight = height > 0 ? (height - headerHeight) : defaultRowHeight;
                if (that.columns.records.length > 10) {
                    rowHeight = height > 0 ? (height - that.scrollBarSize - 5 - headerHeight) : defaultRowHeight;
                }
            }
            else {
                rowHeight = height > 0 ? (height - headerHeight - resourcesHeight) / (pageSize) : defaultRowHeight;
                if (that.columns.records.length > 10) {
                    rowHeight = height > 0 ? (height - that.scrollBarSize - 5 - headerHeight - resourcesInView * resourcesHeight) / (resourcesInView * pageSize) : defaultRowHeight;
                }
            }

            if (view === "dayView" || view === "weekView") {
                if (showAllDayRow) {
                    if (allDayRowHeight == null || allDayRowHeight == "auto") {
                        rowHeight = height > 0 ? (height - headerHeight) / (that.tableRows * (pageSize)) : threeDefaultRowHeight;
                        allDayRowHeight = rowHeight;
                    }
                    else {
                        rowHeight = height > 0 ? (height - headerHeight - allDayRowHeight - resourcesInView * resourcesHeight) / (resourcesInView * (pageSize - 1)) : defaultRowHeight;
                    }
                }
            }
            else if (view === "monthView") {
                if (that.hScrollBar[0].style.visibility == "hidden") {
                    scrollSize = 0;
                }

                if (that.tableRows == 1) {
                    rowHeight = height > 0 ? (height - headerHeight - scrollSize) / pageSize : defaultRowHeight;
                }
                else {
                    rowHeight = height > 0 ? (height - headerHeight - resourcesHeight - scrollSize) / (pageSize) : defaultRowHeight;
                }
            }
            rowHeight = Math.max(defaultRowHeight, rowHeight);
            if (!allDayRowHeight) allDayRowHeight = threeDefaultRowHeight;
            allDayRowHeight = Math.max(threeDefaultRowHeight, allDayRowHeight);
            that._allDayRowHeight = allDayRowHeight;
            that._defaultRowHeight = defaultRowHeight;
            allDayRowHeight = allDayRowsCount * (defaultRowHeight - 2);
            allDayRowHeight = Math.max(threeDefaultRowHeight, 17 + allDayRowHeight);
            that._allDayRowFullHeight = allDayRowHeight;
            if (viewObject.allDayRowHeight) {
                that._allDayRowHeight = viewObject.allDayRowHeight;
                allDayRowHeight = allDayRowsCount * (viewObject.allDayRowHeight - 2);
                that._allDayRowFullHeight = allDayRowHeight;
            }
        }

        var colors = new Array();
        if (that.resources && that.resources.colorScheme) {
            for (var scheme = 0; scheme < that.colorSchemes.length; scheme++) {
                if (that.colorSchemes[scheme].name == that.resources.colorScheme) {
                    colors = that.colorSchemes[scheme].colors;
                    break;
                }
            }
            while (that._resources.length > colors.length - 1) {
                var schemeIndex = parseInt(that.resources.colorScheme.substring(6));
                if (schemeIndex >= 27) schemeIndex = 0;
                colors = colors.concat(that.colorSchemes[schemeIndex].colors);
                schemeIndex++;
            }
        }

        for (var viewIndex = 0; viewIndex < that.tableRows; viewIndex++) {
            var hour = 0;
            var startHour = 0;
            var endHour = 23;
            if (viewObject.timeRuler && viewObject.timeRuler.scaleStartHour != undefined) {
                var startHour = parseInt(viewObject.timeRuler.scaleStartHour);
            }
            if (viewObject.timeRuler && viewObject.timeRuler.scaleEndHour != undefined) {
                var endHour = parseInt(viewObject.timeRuler.scaleEndHour);
            }
            var date = viewStart;
            if (false === viewObject.showWeekends) {
                if (date.dayOfWeek() == 0 || date.dayOfWeek() == 6) {
                    date = date.addDays(1);
                }
            }
            var slotDates = new Array();
            var rowStart = view != "monthView" && view != "timelineDayView" && view != "timelineWeekView" && view != "timelineMonthView" && showAllDayRow ? 1 : 0;
            if (that.tableRows > 1) {
                var tablerow = '<tr data-group-row="true" role="row">';
                var cellclass = that.toTP('jqx-cell') + " " + that.toTP('jqx-grid-cell') + " " + that.toTP('jqx-item');

                if (that.rtl) {
                    cellclass += ' ' + that.toTP('jqx-cell-rtl');
                }
                if (!isIE7) {
                    cellclass += ' ' + that.toTP('jqx-grid-cell-pinned');
                    colspan += ' colspan="' + columnslength + '"';

                    var w = 0;
                    for (var t = 0; t < columnslength; t++) {
                        var c = getColumnByIndex(t);
                        var columnWidth = c.width / columnsPow;
                        if (columnWidth < c.minwidth) width = c.minwidth / columnsPow;
                        if (columnWidth > c.maxwidth) width = c.maxwidth / columnsPow;
                        columnWidth -= widthOffset;

                        if (columnWidth < 0) {
                            columnWidth = 0;
                        }
                        if (!c.hidden) {
                            w += columnWidth;
                        }
                    }
                    width = w;
                }
                else {
                    cellclass += ' ' + that.toTP('jqx-grid-cell-pinned');
                }

                var tablecolumn = '<td style="height:' + resourcesHeight + 'px;';
                if (j == columnslength - 1 && columnslength == 1 && !that.rtl) {
                    tablecolumn += 'border-right-color: transparent;'
                }
                if (that._resources.length > 0 && that.resources.colorScheme && that.resources.orientation != "none") {
                    var background = "";
                    var border = "";
                    var color = "";

                    var getTextElementByColor = function (color) {
                        var nThreshold = 105;
                        var bgDelta = (color.r * 0.299) + (color.g * 0.587) + (color.b * 0.114);
                        var foreColor = (255 - bgDelta < nThreshold) ? 'Black' : 'White';
                        return foreColor;
                    }
                    background = colors[viewIndex];
                    background = that.hexToRgba(colors[viewIndex], 0.7).toString();
                    color = getTextElementByColor(that.hexToRgba(colors[viewIndex], 0.7));

                    border = colors[viewIndex];
                    tablecolumn += 'background: ' + background + ';'
                    tablecolumn += 'border-color: ' + border + ';'
                    tablecolumn += 'color: ' + color + ';'
                }
                tablecolumn += '" class="' + cellclass + '" role="gridcell" ' + colspan + '';

                var resourcevalue = that._resources[viewIndex];
                tablecolumn += ">" + "<span style='position: relative;'>" + resourcevalue + "</span>";
                tablecolumn += "</td>";
                tablerow += tablecolumn;
                tableHTML += tablerow;
            }

            for (var i = 0; i < pageSize; i++) {
                var row = {};
                var key = i;
                row.uid = key;
                var tablerow = '<tr data-key="' + key + '" role="row">';

                var left = 0;
                var start = 0;
                if (slotDates[0] && i > rowStart) {
                    var minutes = 30;

                    if (view != "monthView") {
                        switch (scale) {
                            case 'sixtyMinutes':
                            case 'hour':
                                minutes = 60;
                                break;
                            case 'thirtyMinutes':
                            case 'halfHour':
                                minutes = 30;
                                break;
                            case 'fifteenMinutes':
                            case 'quarterHour':
                                minutes = 15;
                                break;
                            case 'tenMinutes':
                                minutes = 10;
                                break;
                            case 'fiveMinutes':
                                minutes = 5;
                                break;
                        }

                        for (var q = 0; q < columnslength; q++) {
                            slotDates[q] = slotDates[q].addMinutes(minutes, false);
                        }
                    }
                    else {
                        for (var q = 0; q < columnslength; q++) {
                            slotDates[q] = slotDates[q].addDays(7, false);
                        }
                    }
                }

                var currentColumn = 0;
                var resourceIndex = 1;
                var minuteSlotCount = 0;
                if (viewObject.showWeekends || viewObject.showWeekends == undefined) {
                    minuteSlotCount = (that.columns.records.length) / (7 * that.tableColumns);
                    minuteSlotCount *= pow;
                }
                else {
                    minuteSlotCount = (that.columns.records.length) / (5 * that.tableColumns);
                    minuteSlotCount *= pow;
                }
                var currentMinuteSlotCount = 0;
                if (that.rtl)
                    currentMinuteSlotCount = 1;

                var daysSlotCount = 0;
                for (var j = 0; j < columnslength; j++) {
                    var column = getColumnByIndex(j);

                    if (currentColumn >= columnsLengthPerView) {
                        currentColumn = 0;
                        daysSlotCount = 0;
                        currentMinuteSlotCount = 0;
                        if (that.rtl)
                            currentMinuteSlotCount = 1;
                        resourceIndex++;
                    }
                    if (!slotDates[j]) {
                        if (!that.rtl) {
                            if (view.toString().indexOf("timelineDayView") >= 0) {
                                var minutesPow = j;
                                slotDates[j] = date.addHours(startHour).addMinutes(minutesPow * minutes, false);
                            }
                            else if (view.toString().indexOf("timelineWeekView") >= 0) {
                                slotDates[j] = date.addDays(daysSlotCount).addHours(startHour, false).addMinutes(currentMinuteSlotCount * minutes, false);
                            }
                            else {
                                slotDates[j] = date.addDays(currentColumn).addHours(startHour, false);
                            }
                            if (that.timeZone) {
                                slotDates[j].timeZone = that.timeZone;
                            }
                        }
                        else {
                            if (view.toString().indexOf("timelineDayView") >= 0) {
                                var minutesPow = 1+j;
                                slotDates[j] = date.addHours(1 + endHour).addMinutes(-minutesPow * minutes, false);
                            }
                            else if (view.toString().indexOf("timelineWeekView") >= 0) {
                                if (viewObject.showWeekends || viewObject.showWeekends == undefined) {
                                    slotDates[j] = date.addDays(6 - daysSlotCount).addHours(1 + endHour, false).addMinutes(-currentMinuteSlotCount * minutes, false);
                                }
                                else {
                                    slotDates[j] = date.addDays(4 - daysSlotCount).addHours(1+endHour, false).addMinutes(-currentMinuteSlotCount * minutes, false);
                                }
                            }
                            else if (view == "dayView" || view == "monthView" || view == "weekView") {
                                if (viewObject.showWeekends || viewObject.showWeekends == undefined) {
                                    slotDates[j] = date.addDays(6 - currentColumn).addHours(startHour, false);
                                }
                                else {
                                    slotDates[j] = date.addDays(4 - currentColumn).addHours(startHour, false);
                                }
                            }
                            else {
                                slotDates[j] = date.addDays(columnsLengthPerView - currentColumn - 1).addHours(startHour, false);
                            }
                            if (that.timeZone) {
                                slotDates[j].timeZone = that.timeZone;
                            }
                        }
                    }

                    currentMinuteSlotCount++;
                    if (currentMinuteSlotCount >= minuteSlotCount) {
                        currentMinuteSlotCount = 0;
                        daysSlotCount++;
                    }


                    if (!column.timeColumn && (view === "dayView" || view === "weekView")) {
                        currentColumn++;
                    }
                    else if (!column.timeColumn && (view === "monthView" && viewObject.showWeekNumbers)) {
                        currentColumn++;
                    }
                    else if ((view === "monthView" && !(viewObject.showWeekNumbers)) || view === "timelineMonthView") {
                        currentColumn++;
                    }
                    else if (view == "timelineDayView" || view == "timelineWeekView") {
                        currentColumn++;
                    }

                    var currentDate = slotDates[j];
                    var width = column.width / columnsPow;
                    if (width < column.minwidth) width = column.minwidth / columnsPow;
                    if (width > column.maxwidth) width = column.maxwidth / columnsPow;
                    width -= widthOffset;

                    if (width < 0) {
                        width = 0;
                    }

                    var cellclass = that.toTP('jqx-cell') + " " + that.toTP('jqx-grid-cell') + " " + that.toTP('jqx-item');
                    if (column.pinned) {
                        cellclass += ' ' + that.toTP('jqx-grid-cell-pinned');
                    }
                    if (that.sortcolumn === column.displayfield) {
                        cellclass += ' ' + that.toTP('jqx-grid-cell-sort');
                    }
                    if (that.altRows && i % 2 != 0) {
                        cellclass += ' ' + that.toTP('jqx-grid-cell-alt');
                    }
                    if (i == 0 && showAllDayRow && (view === "dayView" || view === "weekView")) {
                        cellclass += ' ' + that.toTP('jqx-grid-cell-alt');
                    }
                    if (currentDate > that.max || currentDate < that.min) {
                        cellclass += ' ' + that.toTP('jqx-scheduler-disabled-cell');
                    }

                    if (that.rtl) {
                        cellclass += ' ' + that.toTP('jqx-cell-rtl');
                    }

                    var colspan = "";
                    var key = that.dataview.generatekey();
                    var currentView = viewIndex + resourceIndex;
                    if (that.resources && that.resources.orientation == "none") {
                        currentView = -1;
                    }
                    if (that._resources.length == 0) {
                        currentView = -1;
                    }

                    var tablecolumn = '<td data-key="' + key + '" data-view="' + (currentView) + '" data-date="' + currentDate.toString() + '" role="gridcell" ' + colspan + ' style="max-width:' + width + 'px; width:' + width + 'px;  height:' + rowHeight + 'px;';
                    if (i == 0 && showAllDayRow && (view === "dayView" || view === "weekView")) {
                        var tablecolumn = '<td  data-key="' + key + '" data-view="' + (currentView) + '" data-end-date="' + $.jqx.scheduler.utilities.getEndOfDay(currentDate).toString() + '" data-date="' + currentDate.clearTime().toString() + '" role="gridcell" ' + colspan + ' style="max-width:' + width + 'px; width:' + width + 'px; height:' + allDayRowHeight + 'px;';
                    }

                    if (view == "monthView" && viewObject.monthRowAutoHeight && monthRowHeights.length > 0) {
                        if (monthRowHeights[i] && monthRowHeights[i] != "auto") {
                            if (rowHeight < monthRowHeights[i]) {
                                var tablecolumn = '<td data-key="' + key + '" data-view="' + (currentView) + '" data-date="' + currentDate.toString() + '" role="gridcell" ' + colspan + ' style="max-width:' + width + 'px; width:' + width + 'px;  height:' + monthRowHeights[i] + 'px;';
                            }
                        }
                    }

                    if (that.resources && that._resources.length > 0 && that.resources.colorScheme && that.resources.orientation !== "none") {
                        var background = "";
                        var border = "";

                        background = colors[viewIndex + resourceIndex - 1];
                        if (!(i == 0 && showAllDayRow && (view === "dayView" || view === "weekView"))) {
                            background = that.hexToRgba(colors[viewIndex + resourceIndex - 1], 0.3).toString();
                        }
                        else {
                            background = that.shadeColor(colors[viewIndex + resourceIndex - 1], 0.3).toString();
                        }

                        if (!(i == 0 && showAllDayRow && (view === "dayView" || view === "weekView"))) {
                            if (view.indexOf("month") == -1) {
                                if (!column.timeColumn) {
                                    if (viewObject.showWorkTime !== false) {
                                        var dayOfWeekStart = 1;
                                        var dayOfWeekEnd = 5;
                                        var hourStart = 8;
                                        var hourEnd = 18;

                                        if (viewObject.workTime) {
                                            var dayOfWeekStart = viewObject.workTime.fromDayOfWeek ? viewObject.workTime.fromDayOfWeek : 0;
                                            var dayOfWeekEnd = viewObject.workTime.toDayOfWeek ? viewObject.workTime.toDayOfWeek : 0;
                                            var hourStart = viewObject.workTime.fromHour ? viewObject.workTime.fromHour : 8;
                                            var hourEnd = viewObject.workTime.toHour ? viewObject.workTime.toHour : 8;
                                        }

                                        if (currentDate.dayOfWeek() >= dayOfWeekStart && currentDate.dayOfWeek() <= dayOfWeekEnd) {
                                            if (currentDate.hour() >= hourStart && currentDate.hour() < hourEnd) {
                                                background = that.hexToRgba(colors[viewIndex + resourceIndex - 1], 0.1).toString();
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        border = colors[resourceIndex + viewIndex - 1];
                        tablecolumn += 'background: ' + background + ';'
                        tablecolumn += 'border-color: ' + border + ';'
                    }

                    if (j == columnslength - 1 && columnslength == 1 && !that.rtl) {
                        tablecolumn += 'border-right-color: transparent;'
                    }

                    if (column.timeColumn && !column.hidden && view === "monthView") {
                        var cellclass = that.toTP('jqx-scheduler-time-column') + " " + that.toTP('jqx-widget-header') + " " + that.toTP('jqx-cell') + " " + that.toTP('jqx-grid-cell') + " " + that.toTP('jqx-item');
                        cellclass += " " + that.toTP('jqx-scheduler-week-number-column');
                      
                        if (that.tableRows > 1) {
                            var cellclass = that.toTP('jqx-cell') + " " + that.toTP('jqx-grid-cell') + " " + that.toTP('jqx-item');
                        }
                        if (that.rtl) {
                            cellclass += ' ' + that.toTP('jqx-cell-rtl');
                        }

                        if (currentDate.minute() === 0) {
                            var tablecolumn = '<td classname="jqx-disableselect" data-time-slot="true" data-date="' + currentDate.toString() + '" role="gridcell" style="max-width:' + width + 'px; width:' + width + 'px;';
                            if (j == columnslength - 1 && columnslength == 1 && !that.rtl) {
                                tablecolumn += 'border-right-color: transparent;'
                            }
                            else if (that.rtl && j == 0) {
                                tablecolumn += 'border-left-color: transparent;'
                            }
                            if (j == columnslength - 1 && that.rtl) {
                                tablecolumn += 'border-right-color: transparent;'
                            }
                        }
                        else {
                            start++;
                            continue;
                        }
                    }

                    if (column.timeColumn && !column.hidden && (view === "dayView" || view === "weekView")) {
                        var cellclass = that.toTP('jqx-scheduler-time-column') + " " + that.toTP('jqx-widget-header') + " " + that.toTP('jqx-cell') + " " + that.toTP('jqx-grid-cell') + " " + that.toTP('jqx-item');
                        if (that.tableRows > 1) {
                            var cellclass = that.toTP('jqx-cell') + " " + that.toTP('jqx-grid-cell') + " " + that.toTP('jqx-item');
                        }
                        if (that.rtl) {
                            cellclass += ' ' + that.toTP('jqx-cell-rtl');
                        }

                        if (i > 0) {
                            if (currentDate.minute() === 0) {
                                var tablecolumn = '<td classname="jqx-disableselect" data-time-slot="true" data-date="' + currentDate.toString() + '" rowspan=' + pow + ' role="gridcell" ' + colspan + ' style="max-width:' + width + 'px; width:' + width + 'px;';
                                if (j == columnslength - 1 && columnslength == 1 && !that.rtl) {
                                    tablecolumn += 'border-right-color: transparent;'
                                }
                                else if (that.rtl && j == 0) {
                                    tablecolumn += 'border-left-color: transparent;'
                                }
                            }
                            else {
                                start++;
                                continue;
                            }
                        }
                        else {
                            if (that.resources && that.resources.orientation == "none") {
                                currentView = -1;
                            }

                            if (i == 0 && showAllDayRow && (view === "dayView" || view === "weekView")) {
                                var tablecolumn = '<td data-view="' + (currentView) + '" data-time-slot="true" data-end-date="' + $.jqx.scheduler.utilities.getEndOfDay(currentDate).toString() + '" data-date="' + currentDate.toString() + '" role="gridcell" ' + colspan + ' style="max-width:' + width + 'px; width:' + width + 'px;';
                            }
                            if (j == columnslength - 1 && columnslength == 1 && !that.rtl) {
                                tablecolumn += 'border-right-color: transparent;'
                            }
                            else if (j == 0 && columnslength == 1 && that.rtl) {
                                tablecolumn += 'border-right-color: transparent;'
                            }
                            if (that.rtl)
                                tablecolumn += 'border-left-width: 1px;'

                            if (that.tableRows > 1) {
                                tablecolumn += 'background: ' + background + ';'
                                tablecolumn += 'border-color: ' + border + ';'
                            }
                        }
                    }
                    else if (i > 0) {
                        var borderLeftWidth = 'border-left-width: 1px;';
                        if (that.rtl && j == 0 && view == "monthView" && viewObject.showWeekNumbers) {
                             borderLeftWidth = 'border-left-width: 0px;';
                        }
                        tablecolumn += borderLeftWidth;
                    }

                    if (column.cellsalign != "left") {
                        if (column.cellsalign === "right") {
                            cellclass += ' ' + that.toTP('jqx-right-align');
                        }
                        else {
                            cellclass += ' ' + that.toTP('jqx-center-align');
                        }
                    }

                    if (!column.timeColumn) {
                        if (that.rowinfo[row.uid]) {
                            if (that.rowinfo[row.uid].selected) {
                                if (that.editKey !== row.uid) {
                                    if (that.selectionMode !== "none") {
                                        cellclass += ' ' + that.toTP('jqx-grid-cell-selected');
                                        cellclass += ' ' + that.toTP('jqx-fill-state-pressed');
                                        cellclass += ' ' + that.toTP('jqx-scheduler-cell-selected');
                                    }
                                }
                            }
                        }
                    }

                    if (!(column.hidden)) {
                        left += widthOffset + width;
                        if (start == 0 && !that.rtl) {
                            tablecolumn += 'border-left-width: 0px;'
                        }
                        start++;
                    }
                    else {
                        tablecolumn += 'display: none;'
                        that._hiddencolumns = true;
                    }

                    if (!(i == 0 && showAllDayRow && (view === "dayView" || view === "weekView"))) {
                        if (view.indexOf("month") == -1) {
                            cellclass += ' ' + that.toTP('jqx-grid-cell-nowrap');
                            if (i % 2 == 1 && !column.timeColumn) {
                                cellclass += ' ' + that.toTP('jqx-scheduler-middle-cell');
                            }
                            if (!column.timeColumn) {
                                if (viewObject.showWorkTime !== false) {
                                    var dayOfWeekStart = 1;
                                    var dayOfWeekEnd = 5;
                                    var hourStart = 8;
                                    var hourEnd = 18;

                                    if (viewObject.workTime) {
                                        var dayOfWeekStart = viewObject.workTime.fromDayOfWeek ? viewObject.workTime.fromDayOfWeek : 0;
                                        var dayOfWeekEnd = viewObject.workTime.toDayOfWeek ? viewObject.workTime.toDayOfWeek : 0;
                                        var hourStart = viewObject.workTime.fromHour ? viewObject.workTime.fromHour : 8;
                                        var hourEnd = viewObject.workTime.toHour ? viewObject.workTime.toHour : 8;
                                    }

                                    if (currentDate.dayOfWeek() >= dayOfWeekStart && currentDate.dayOfWeek() <= dayOfWeekEnd) {
                                        if (currentDate.hour() >= hourStart && currentDate.hour() < hourEnd) {
                                            cellclass += ' ' + that.toTP('jqx-scheduler-work-time-cell');
                                        }
                                        else {
                                            cellclass += ' ' + that.toTP('jqx-scheduler-not-work-time-cell');
                                        }
                                    }
                                    else {
                                        cellclass += ' ' + that.toTP('jqx-scheduler-not-work-time-cell');
                                    }
                                }
                            }
                        }
                    }

                    var cellvalue = "";
                    if (view === "monthView") {
                        if (!that.touchDevice && !column.timeColumn) {
                            cellclass += ' ' + that.toTP('jqx-top-align');
                        }
                        var monthDayFormat = "dd";
                        cellvalue = currentDate.toDate();
                        var otherMonth = that.toTP("jqx-scheduler-month-outer-cell") + " ";
                        var weekend = that.toTP("jqx-scheduler-month-weekend-cell");
                        if (that.date.month() == currentDate.month()) {
                            otherMonth = "";
                        }
                        if (!currentDate.isWeekend()) {
                            weekend = "";
                        }
                        else {
                            cellclass += ' ' + weekend;
                        }

                        if (cellvalue.getDate() === 1) {
                            monthDayFormat = "MMM dd";
                        }
                        if (that.touchDevice) {
                            if (rowHeight > 16) {
                                cellvalue = "<div class='" + otherMonth + that.toTP("jqx-scheduler-month-cell-touch") + "'>" + $.jqx.dataFormat.formatdate(cellvalue, monthDayFormat, that.schedulerLocalization) + "<span style='display: none; float: right; cursor: pointer; width:16px; height: 16px;' class='" + that.toTP('jqx-icon-arrow-down') + "'></span></div>";
                            }
                            else {
                                cellvalue = "<div class='" + otherMonth + that.toTP("jqx-scheduler-month-cell-touch") + "'>" + $.jqx.dataFormat.formatdate(cellvalue, monthDayFormat, that.schedulerLocalization) + "<span style='display: none; float: right; cursor: pointer;' class='" + that.toTP('jqx-icon-arrow-down') + "'></span></div>";
                            }
                        }
                        else {
                            if (rowHeight > 16) {
                                cellvalue = "<div class='" + otherMonth + that.toTP("jqx-scheduler-month-cell") + "'>" + $.jqx.dataFormat.formatdate(cellvalue, monthDayFormat, that.schedulerLocalization) + "<span style='display: none; float: right; cursor: pointer; width:16px; height: 16px;' class='" + that.toTP('jqx-icon-arrow-down') + "'></span></div>";
                            }
                            else {
                                cellvalue = "<div class='" + otherMonth + that.toTP("jqx-scheduler-month-cell") + "'>" + $.jqx.dataFormat.formatdate(cellvalue, monthDayFormat, that.schedulerLocalization) + "<span style='display: none; float: right; cursor: pointer;' class='" + that.toTP('jqx-icon-arrow-down') + "'></span></div>";
                            }
                        }
                    }
                    else if (view === "timelineWeekView" || view === "timelineDayView" || view === "timelineMonthView") {
                        cellclass += ' ' + that.toTP('jqx-right-align jqx-bottom-align');
                        cellvalue = "<span style='display: none; float: right; cursor: pointer; width:16px; height: 16px;' class='" + that.toTP('jqx-icon-arrow-down') + "'></span>";
                    }

                    if (i == 0 && showAllDayRow && (view === "dayView" || view === "weekView") && !column.timeColumn) {
                        cellclass += ' ' + that.toTP('jqx-top-align');
                        cellclass += ' ' + that.toTP('jqx-scheduler-all-day-cell');
                        if (that.rtl) {
                            cellclass += ' ' + that.toTP('jqx-rtl');
                        }

                        cellvalue = currentDate.toDate();
                        cellvalue = "<span>" + $.jqx.dataFormat.formatdate(cellvalue, "dd", that.schedulerLocalization) + "</span>";
                    }

                    var cellsFormat = column.cellsFormat;

                    if (column.timeColumn && !column.hidden) {
                        cellvalue = currentDate.toDate();
                        if (column.timeZone) {
                            cellvalue = currentDate.clone().toTimeZone(column.timeZone);
                            cellvalue = cellvalue.toDate();
                        }
                        var format = "auto";
                        if (viewObject.timeRuler && viewObject.timeRuler.formatString) {
                            cellsFormat = viewObject.timeRuler.formatString;
                        }
                        else
                        if (!column.timeColumn.format) {
                            if (cellvalue.getHours() == 0 || cellvalue.getHours() == 12) {
                                cellsFormat = "hh tt";
                            }
                            else cellsFormat = "hh:mm";
                        }
                        if ($.jqx.dataFormat.isDate(cellvalue)) {
                            cellvalue = $.jqx.dataFormat.formatdate(cellvalue, cellsFormat, that.schedulerLocalization);
                        }
                        if (i < rowStart) {
                            if (!that.rtl) {
                                cellclass += ' ' + that.toTP('jqx-scheduler-time-column-header-cell');
                            }
                            else {
                                cellclass += ' ' + that.toTP('jqx-scheduler-time-column-header-cell-rtl');
                            }

                            cellvalue = "";
                        }
                        if (i < rowStart) {
                            if (column._text) {
                                cellclass += ' ' + that.toTP('jqx-bottom-align');
                            }

                            if (viewObject.timeRuler && viewObject.timeRuler.timeZones && viewObject.timeRuler.timeZones.length > 0) {
                                if (j < viewObject.timeRuler.timeZones.length) {
                                    cellvalue = column._text;
                                }
                            }
                        }
                        if (view == "monthView") {
                            cellvalue = currentDate.weekOfYear(that.schedulerLocalization.firstDay);
                        }
                    }
                    else {
                        if (cellsFormat != '') {
                            if ($.jqx.dataFormat) {
                                if ($.jqx.dataFormat.isDate(cellvalue)) {
                                    cellvalue = $.jqx.dataFormat.formatdate(cellvalue, cellsFormat, that.schedulerLocalization);
                                }
                                else if ($.jqx.dataFormat.isNumber(cellvalue) || (!isNaN(parseFloat(cellvalue)) && isFinite(cellvalue))) {
                                    cellvalue = $.jqx.dataFormat.formatnumber(cellvalue, cellsFormat, that.schedulerLocalization);
                                }
                            }
                        }
                    }
                    if (column.cellclassname != '' && column.cellclassname) {
                        if (typeof column.cellclassname == "string") {
                            cellclass += ' ' + column.cellclassname;
                        }
                        else {
                            var customclassname = column.cellclassname(i, column.datafield, cellvalue, row);
                            if (customclassname) {
                                cellclass += ' ' + customclassname;
                            }
                        }
                    }

                    if (column.cellsRenderer != '' && column.cellsRenderer) {
                        var rowIndex = tableRows.indexOf(row);
                        cellvalue = column.cellsRenderer(rowIndex, column.datafield, cellvalue, row);
                    }


                    tablecolumn += '" class="' + cellclass + '">';
                    tablecolumn += cellvalue;
                    tablecolumn += '</td>';

                    tablerow += tablecolumn;
                }

                if (tablewidth == 0) {
                    that.table[0].style.width = left + 2 + 'px';
                    that.pinnedtable[0].style.width = left + 2 + 'px';
                    tablewidth = left;
                }

                tablerow += '</tr>';

                tableHTML += tablerow;
                if (!that.rowinfo[row.uid]) {
                    that.rowinfo[row.uid] = { row: row };
                }
                else {
                    if (!("row" in that.rowinfo[row.uid])) {
                        that.rowinfo[row.uid].row = row;
                    }
                }
            }
        }
        tableHTML += '</table>';

        that.table[0].innerHTML = tableHTML;
        that.pinnedtable[0].innerHTML = tableHTML;
        that.table[0].rows = that.table[0].firstChild.rows;
        var isOldIE = $.jqx.browser.msie && $.jqx.browser.version < 9;
        var pinnedTableRow = null;
        if (showAllDayRow && (view === "dayView" || view === "weekView") && that.tableRows == 1) {
            that.pinnedtable[0].style.display = "block";
            that.pinnedtable[0].style.zIndex = "400";
            that.pinnedtable[0].style.position = "absolute";
            that.pinnedtable[0].style.top = "0px";
            that.pinnedtable[0].style.height = allDayRowHeight + "px";
            if (!isOldIE) {
                if (that.tableRows == 1) {
                    that.oldRow = that.table[0].rows[0];
                    that.table[0].rows[0] = that.pinnedtable.find('tr')[0];
                    pinnedTableRow = that.pinnedtable.find('tr')[0];
                    that.pinnedTableRow = pinnedTableRow;
                }
                else {
                    that.oldRow = that.table[0].rows[1];
                    that.table[0].rows[1] = that.pinnedtable.find('tr')[1];
                    pinnedTableRow = that.pinnedtable.find('tr')[1];
                    that.pinnedTableRow = pinnedTableRow;
                }
            }
        }
        else {
            that.pinnedtable[0].style.display = "none";
        }

        var t = $(that.table[0].firstChild);
        var t2 = $(that.pinnedtable[0].firstChild);
        that._table = t;
        that._pinnedtable = t2;
        if ($.jqx.browser.msie && $.jqx.browser.version < 10) {
            that._table[0].style.width = tablewidth + 'px';
            that._pinnedtable[0].style.width = tablewidth + 'px';
        }
        if (pageSize === 0) {
            that._table[0].style.width = (2 + tablewidth) + 'px';
            that._pinnedtable[0].style.width = (2 + tablewidth) + 'px';
        }


        that._table.addClass('jqx-grid-table-one-cell jqx-disableselect');
        that._pinnedtable.addClass('jqx-grid-table-one-cell jqx-disableselect');

        that.rowByCell = new Array();
        that.columnCells = new Array();

        function createRow() {
            var obj = {};
            obj.cells = new Array();
            obj.indexOf = function (cell) {
                for (var i = 0; i < obj.cells.length; i++) {
                    if (obj.cells[i].getAttribute('data-key') == cell.getAttribute('data-key'))
                        return i;
                }
                return -1;
            }
            return obj;
        }

        that.cellWidth = 0;
        that.cellHeight = 0;
        var rowsLength = that.table[0].rows.length;
        for (var i = 0; i < rowsLength; i++) {
            var tableRow = that.table[0].rows[i];
            if (i == 0 && pinnedTableRow)
                tableRow = pinnedTableRow;

            if (tableRow.getAttribute('data-group-row'))
                continue;

            var row = new createRow();
            row.aboveRow = null;
            row.belowRow = null;
            if (that.rows.length > 0) {
                row.aboveRow = that.rows[that.rows.length - 1];
                that.rows[that.rows.length - 1].belowRow = row;
            }

            row.element = tableRow;

            that.rows.push(row);

            for (var j = 0; j < tableRow.cells.length; j++) {
                var cell = tableRow.cells[j];
                if (cell.getAttribute('data-time-slot'))
                    continue;
                if (cell.style.display === "none")
                    continue;
                if (cell.className.indexOf('jqx-grid-cell-pinned') >= 0)
                    continue;

                if (!that.columnCells[row.cells.length])
                    that.columnCells[row.cells.length] = new Array();

                that.columnCells[row.cells.length].push(cell);

                if (that.cellWidth == 0) {
                    that.cellWidth = cell.clientWidth;
                }
                if (that.cellHeight == 0 && (rowsLength == 1 || i > 1)) {
                    that.cellHeight = cell.clientHeight;
                }

                if (that._views[that._view].type == "monthView") {
                    if (row.top == undefined) {
                        row.top = parseInt($(cell).position().top);
                    }
                }

                row.cells.push(cell);
                that.rowByCell[cell.getAttribute('data-key')] = row;
            }
        }
        if (pageSize === 0) {
            that._table[0].style.tableLayout = "auto";
        }


        that._renderAppointments(viewStart, viewEnd);

        if (that.pinnedtable[0].style.display != "none" || ((view == "dayView" || view == "weekView") && that.tableRows > 1)) {
            that._updateScrollbars(that.host.height());
        }

        if (view === "monthView" && viewObject.monthRowAutoHeight) {
            if (monthRowHeights.length == 0) {
                that._renderrows();
            }
            else {
                that._updateScrollbars(that.host.height());
            }
        }

        if (that.rendered) {
            that.rendered();
        }
        that.renderedTime = new Date();
    },

    showAppointmentsByResource: function (resource) {
        var that = this;
        for (var i = 0; i < that.uiappointments.length; i++) {
            var app = that.uiappointments[i];
            if (app.resourceId == resource) {
                app.hidden = false;
                app.hiddenByResourceId = false;
                if (app.exceptions) {
                    for (var j = 0; j < app.exceptions.length; j++) {
                        app.exceptions[j].hiddenByResourceId = false;
                        app.exceptions[j].hidden = false;
                    }
                }
            }
        }

        if (that._resourcesElements) {
            var colors = that.getColors(that._resources.indexOf(resource));
            that._resourcesElements["top"][resource].attr('data-toggle', 'on');
            that._resourcesElements["top"][resource].css('background', colors.background);
            that._resourcesElements["bottom"][resource].attr('data-toggle', 'on');
            that._resourcesElements["bottom"][resource].css('background', colors.background);
        }


        if (that.hiddenResources) {
            delete that.hiddenResources[resource];
        }

        that._renderrows();
    },

    hideAppointmentsByResource: function (resource) {
        var that = this;
        for (var i = 0; i < that.uiappointments.length; i++) {
            var app = that.uiappointments[i];
            if (app.resourceId == resource) {
                app.hidden = true;
                app.hiddenByResourceId = true;
                if (app.exceptions) {
                    for (var j = 0; j < app.exceptions.length; j++) {
                        app.exceptions[j].hiddenByResourceId = true;
                        app.exceptions[j].hidden = true;
                    }
                }
            }
        }

        if (that._resourcesElements) {
            that._resourcesElements["top"][resource].attr('data-toggle', 'off');
            that._resourcesElements["top"][resource].css('background', 'transparent');
            that._resourcesElements["bottom"][resource].attr('data-toggle', 'off');
            that._resourcesElements["bottom"][resource].css('background', 'transparent');
        }
        if (!that.hiddenResources) {
            that.hiddenResources = new Array();
        }

        that.hiddenResources[resource] = true;
        that._renderrows();
    },

    _prepareAppointmentsInView: function (viewStart, viewEnd) {
        var that = this;
        if (that._appupdating)
        {
            return;
        }

        var appointmentsToRender = new Array();
        for (var i = 0; i < this.uiappointments.length; i++) {
            var app = this.uiappointments[i];

            if (app.hidden && app.recurrencePattern == null)
                continue;


            var inView = $.jqx.scheduler.utilities.rangeIntersection(app.from, app.to, viewStart, viewEnd)
            if (inView && !app.recurrencePattern) {
                appointmentsToRender.push(app);
            }
            app.renderedAppointments = new Array();

            var foundSelectedAppointment = false;

            if (app.recurrencePattern) {
                var occurences = app.getOccurrences(viewStart, viewEnd);
                var exceptions = app.exceptions;
                for (var j = 0; j < occurences.length; j++) {
                    var occurrence = occurences[j];
                    if (occurrence.hidden)
                        continue;

                    var canAdd = true;
                    for (var m = 0; m < exceptions.length; m++) {
                        var exception = exceptions[m];
                        var exceptionDate = exception.occurrenceFrom ? exception.occurrenceFrom : exception;

                        if (that.selectedJQXAppointment && that.selectedJQXAppointment.rootAppointment) {
                            if (!foundSelectedAppointment && that.selectedJQXAppointment.occurrenceFrom.clearTime().equals(exceptionDate.clearTime())) {
                                that.selectedJQXAppointment = exception;
                                foundSelectedAppointment = true;
                            }
                        }

                        if (exceptionDate.clearTime().equals(occurrence.from.clearTime())) {
                            canAdd = false;
                            break;
                        }
                    }
                    if (!canAdd) {
                        continue;
                    }

                    if (that.selectedJQXAppointment && that.selectedJQXAppointment.rootAppointment) {
                        if (!foundSelectedAppointment && that.selectedJQXAppointment.occurrenceFrom.clearTime().equals(occurrence.occurrenceFrom.clearTime())) {
                            that.selectedJQXAppointment = occurrence;
                            foundSelectedAppointment = true;
                        }
                    }
                    app.renderedAppointments[occurrence.id] = occurrence;
                    appointmentsToRender.push(occurrence);
                }
                for (var m = 0; m < exceptions.length; m++) {
                    var exception = exceptions[m];
                    var exceptionDate = exception.occurrenceFrom ? exception.from : exception;
                    var exceptionAppointment = app.createOccurrence(exceptionDate);
                    if (exception.occurrenceFrom) {
                        exception.cloneAppointmentAttributes(exceptionAppointment);
                        if (exception.hidden)
                            continue;
                    }

                    if (exceptionAppointment != app) {
                        appointmentsToRender.push(exception);
                        app.renderedAppointments[exception.id] = exception;
                    }
                }
            }
        }

        var appointmentsToRenderWithTimeZone = new Array();
        this.tabKeyAppointments = new Array();
        for (var i = 0; i < appointmentsToRender.length; i++) {
            var appointment = appointmentsToRender[i];
            appointmentsToRenderWithTimeZone.push(appointment);
            this.tabKeyAppointments.push(appointment);
        }

        appointmentsToRenderWithTimeZone.sort(this._sortAppointmentsByFrom);
        if (this._resources.length > 0) {
            this.tabKeyAppointments.sort(function (a, b) {
                return that._sortAppointmentsByResourceId(a, b, that);
            }
            );
        }
        else {
            this.tabKeyAppointments.sort(this._sortAppointmentsByFrom);
        }

        this.appointmentsToRender = appointmentsToRenderWithTimeZone;
    },

    _renderDayWeekAppointments: function () {
        var that = this;
        var viewType = that._views[that._view].type;
        var viewObject = that._views[that._view];
        var allElements = new Array();
        var allDayElements = new Array();
        var rows = this.rows;
        var showAllDayRow = that.showAllDayRow;
        var scaleMinutes = that.getMinutesPerScale();

        if (viewObject.timeRuler && viewObject.timeRuler.showAllDayRow != undefined) {
            showAllDayRow = viewObject.timeRuler.showAllDayRow;
        }
        for (var appIndex = 0; appIndex < this.appointmentsToRender.length; appIndex++) {
            var appointment = this.appointmentsToRender[appIndex];
            var from = appointment.from;
            var to = appointment.to;
            var toAllDay = $.jqx.scheduler.utilities.getEndOfDay(to);
            var day = from.day();
            var allDay = appointment.allDay;
            var getDate = that._getDateByString;

            var appointmentCells = new Array();
            var appointmentDays = new Array();
            var resourceId = appointment.resourceId;
            var resourceIndex = that._resources.indexOf(resourceId);
            if (that.resources &&that.resources.orientation == "none")
                resourceIndex = -1;

            var fromValue = from.toDate().valueOf();
            var toValue = to.toDate().valueOf();
            var toValueAllDay = toAllDay.toDate().valueOf();
            var sortCells = function (value1, value2) {
                if (value1.date < value2.date)
                    return -1;

                if (value1.date == value2.date)
                    return 0;

                if (value1.date > value2.date)
                    return 1;
            };


            if (!appointment.allDay && appointment.duration().days() < 1 || !showAllDayRow) {
                var toDate = to.toDate();
                var toLastCell = false;
                if (toDate.getHours() == 0 && toDate.getMinutes() == 0) {
                    toLastCell = true;
                }

                for (var i = 0; i < that.columnCells.length; i++) {
                    if (!that.columnCells[i])
                        continue;

                    var cells = that.columnCells[i];
                    if (that.rtl) {
                        cells = that.columnCells[that.columnCells.length - 1 - i];
                    }
                    for (var j = 0; j < cells.length; j++) {
                        if (cells[j].getAttribute("data-end-date")) {
                            continue;
                        }

                        var dateString = cells[j].getAttribute("data-date");
                        var date = getDate(dateString);
                        var date2 = getDate(dateString);
                        date2.setMinutes(date2.getMinutes() + scaleMinutes - 1);
                        var dateValue = date.valueOf();
                        var dateValue2 = date2.valueOf();
                        if (dateValue > to) {
                            continue;
                        }

                        if ((fromValue <= dateValue && dateValue < toValue) || (fromValue <= dateValue2 && dateValue2 < toValue) || (fromValue >= dateValue && dateValue2 >= toValue)) {
                            if (resourceIndex != -1) {
                                if ((1 + resourceIndex) != cells[j].getAttribute('data-view'))
                                    continue;
                            }

                            if (day != date.getDate()) {
                                appointmentCells.sort(sortCells);
                                appointmentDays.push(appointmentCells);
                                appointmentCells = new Array();
                                day = from.addDays(1).day();
                            }
                            appointmentCells.push({ cell: cells[j], date: date });
                        }
                    }
                }

                appointmentCells.sort(sortCells);
                appointmentDays.push(appointmentCells);

                var appointmentElements = new Array();

                for (var i = 0; i < appointmentDays.length; i++) {
                    var cells = appointmentDays[i];
                    if (cells.length == 0)
                        continue;

                    var width = that.cellWidth;
                    var bottom = cells[cells.length - 1].cell.offsetTop + that.cellHeight;
                    var x = cells[0].cell.offsetLeft;
                    var y = cells[0].cell.offsetTop;

                //    var bottom = $(cells[cells.length - 1].cell).position().top + that.cellHeight;
                //    var cellPosition = $(cells[0].cell).position();
                //    var x = cellPosition.left;
                //    var y = cellPosition.top;
                    var minutes = that.getMinutesPerScale();
                    var toDate = new $.jqx.date(cells[cells.length - 1].date, that.timeZone).addMinutes(minutes);
                    var data = { cells: cells, x: x, y: y, height: bottom - y, width: width, appointment: appointment, from: new $.jqx.date(cells[0].date, that.timeZone), to: toDate };
                    appointmentElements.push(data);
                    allElements.push(data);
                }
                appointment.elements = appointmentElements;

                if (appointment.rootAppointment) {
                    appointment.rootAppointment.elements = appointment.rootAppointment.elements.concat(appointment.elements);
                }
            }
                // all day.
            else {
                var cells = rows[0].cells;
                if (this.tableRows > 1) {
                    var rowsPerVew = rows.length / that.tableRows;
                    var rowIndex = resourceIndex * rowsPerVew;
                    cells = rows[rowIndex].cells;
                }
                for (var j = 0; j < cells.length; j++) {
                    var dateString = cells[j].getAttribute("data-date");
                    var jsDate = getDate(dateString);
                    var date = new $.jqx.date(jsDate, that.timeZone);
                    date = $.jqx.scheduler.utilities.getEndOfDay(date);
                    var dateValue = date.toDate().valueOf();
                    if (dateValue > toAllDay) {
                        continue;
                    }
                    if (from <= date && date <= toAllDay) {
                        if (resourceIndex != -1) {
                            if ((1 + resourceIndex) != cells[j].getAttribute('data-view'))
                                continue;
                        }

                        if (appointmentCells.length == 0) {
                            date = $.jqx.scheduler.utilities.getStartOfDay(date);
                        }

                        appointmentCells.push({ cell: cells[j], date: date });
                    }
                }

                appointmentCells.sort(sortCells);
                appointmentDays.push(appointmentCells);

                var appointmentElements = new Array();

                for (var i = 0; i < appointmentDays.length; i++) {
                    var cells = appointmentDays[i];
                    if (cells.length == 0)
                        break;

                    var cellPosition = $(cells[0].cell).position();
                    var width = $(cells[cells.length - 1].cell).position().left + this.cellWidth - cellPosition.left;
                    var bottom = $(cells[cells.length - 1].cell).position().top;
                    var x = cellPosition.left;
                    var y = cellPosition.top;
                    if (this.rtl) {
                        var cellPosition = $(cells[cells.length - 1].cell).position();
                        var x = cellPosition.left;
                        var width = $(cells[0].cell).position().left + this.cellWidth - cellPosition.left;
                    }

                    var toCellDate = cells[cells.length - 1].date;
                    toCellDate = new $.jqx.date($.jqx.scheduler.utilities.getEndOfDay(toCellDate), that.timeZone);
                    var data = { cells: cells, x: x, y: y, height: bottom - y + this.cellHeight, width: width, appointment: appointment, from: $.jqx.scheduler.utilities.getStartOfDay(new $.jqx.date(cells[0].date, that.timeZone)), to: toCellDate };
                    appointmentElements.push(data);
                    allDayElements.push(data);
                }
                appointment.elements = appointmentElements;
                if (appointment.rootAppointment) {
                    appointment.rootAppointment.elements = appointment.rootAppointment.elements.concat(appointment.elements);
                }
            }
        }

        var viewStart = this.getViewStart();
        var viewEnd = this.getViewEnd();

        if (this._resources.length < 2 || this.resources.orientation == "none") {
            var appointmentsPerDay = new Array();
            var currentDate = viewStart;
            var index = 0;
            while (currentDate < viewEnd) {
                appointmentsPerDay[index] = new Array();
                for (var i = 0; i < allElements.length; i++) {
                    var element = allElements[i];
                    if (element.from.day() == currentDate.day()) {
                        element.column = -1;
                        element.columnSpan = 1;

                        appointmentsPerDay[index].push(element);
                    }
                }
                index++;
                currentDate = currentDate.addDays(1);
            }

            for (var i = 0; i < appointmentsPerDay.length; i++) {
                this._renderAppointmentsInDay(appointmentsPerDay[i]);
            }
            this._renderAllDayAppointments(allDayElements);
        }
        else {
            for (var j = 0; j < this._resources.length; j++) {
                var id = this._resources[j];
                var appointmentsPerDay = new Array();
                var currentDate = viewStart;
                var index = 0;
                while (currentDate < viewEnd) {
                    appointmentsPerDay[index] = new Array();
                    for (var i = 0; i < allElements.length; i++) {
                        var element = allElements[i];
                        if (element.from.day() == currentDate.day()) {
                            element.column = -1;
                            element.columnSpan = 1;
                            if (element.appointment.resourceId == id) {
                                appointmentsPerDay[index].push(element);
                            }
                        }
                    }
                    index++;
                    currentDate = currentDate.addDays(1);
                }

                for (var i = 0; i < appointmentsPerDay.length; i++) {
                    this._renderAppointmentsInDay(appointmentsPerDay[i]);
                }
                var allDayAppointments = new Array();
                for (var i = 0; i < allDayElements.length; i++) {
                    if (allDayElements[i].appointment.resourceId == id) {
                        allDayAppointments.push(allDayElements[i]);
                    }
                }

                this._renderAllDayAppointments(allDayAppointments);
            }
        }
    },

    _renderAllDayAppointments: function (appointments) {
        var that = this;
        var showAllDayRow = this.showAllDayRow;
        var viewObject = this._views[this._view];
        if (viewObject.timeRuler && viewObject.timeRuler.showAllDayRow != undefined) {
            showAllDayRow = viewObject.timeRuler.showAllDayRow;
        }
        if (!showAllDayRow)
            return;

        if (appointments.length == 0)
            return;

        var dayAppointments = appointments;
        var rowsCount = 1;

        rowsCount = this.getMaxAllDayAppointments(appointments);
        if (this.tableRows == 1) {
            var allDayRowHeight = this.table[0].rows[0].clientHeight / rowsCount;
        }
        else {
            var allDayRowHeight = this.table[0].rows[1].clientHeight / rowsCount;
        }

        for (var j = 0; j < appointments.length; j++) {
            var dayAppointment = appointments[j];

            dayAppointment.row = -1;
            var collisionAppointments = this.getCollisionAppointments(dayAppointment, appointments);
            collisionAppointments.sort(this._sortAppointmentsByFrom);
            var currentAppointmentIndex = collisionAppointments.indexOf(dayAppointment);

            if (currentAppointmentIndex >= 0) {
                for (var p = currentAppointmentIndex; p < collisionAppointments.length; p++) {
                    collisionAppointments[p].row = -1;
                }
            }

            // iterate through the collision appointments and set the column.
            for (var m = 0; m < rowsCount; m++) {
                var currentRow = m;

                for (var index in collisionAppointments) {
                    if (index == "indexOf")
                        break;

                    var collisionAppointment = collisionAppointments[index];
                    if (collisionAppointment.row == -1 && !this.isBusyRow(currentRow, collisionAppointments)) {
                        collisionAppointment.row = currentRow;

                        var maxRowsCount = rowsCount;
                        var currentColissions = this.getMaxAllDayAppointments(collisionAppointments);
                        if (maxRowsCount > currentColissions) {
                            maxRowsCount = currentColissions;
                        }

                        collisionAppointment.rowsCount = maxRowsCount;
                    }
                }
            }
        }

        for (var m = 0; m < dayAppointments.length; m++) {
            var dayAppointment = dayAppointments[m];
            var collisionAppointments = this.getCollisionAppointments(dayAppointment, dayAppointments);
            collisionAppointments.sort(this._sortAppointmentsByFrom);

            var maxRows = 1;
            for (var index in collisionAppointments) {
                if (index == "indexOf")
                    break;

                var item = collisionAppointments[index];
                maxRows = Math.max(maxRows, item.rowsCount);
            }

            for (var index in collisionAppointments) {
                if (index == "indexOf")
                    break;

                var item = collisionAppointments[index];
                item.rowsCount = maxRows;
            }

            // set the column span
            if (collisionAppointments.length == 1) {
                dayAppointment.rowSpan = maxRows;
            }
            else {
                var span = 0;
                var canProceed = true;
                for (var p = dayAppointment.row; p < maxRows; p++) {
                    for (var index in collisionAppointments) {
                        if (index == "indexOf")
                            break;

                        var collisionAppointment = collisionAppointments[index];
                        if (collisionAppointment == dayAppointment)
                            continue;

                        if (collisionAppointment.row == p) {
                            canProceed = false;
                        }
                    }

                    if (!canProceed)
                        break;

                    span++;
                }
                dayAppointment.rowSpan = span;
            }
        }

        var appHeight = that.appointmentsMinHeight + 2;
        if (that.isTouchDevice()) {
            var appHeight = that.touchAppointmentsMinHeight + 2;
        }
        for (var x = 0; x < dayAppointments.length; x++) {

            var currentRowHeight = appHeight;
            var dayAppointment = dayAppointments[x];
            dayAppointment.height = appHeight;
            var yLocation = currentRowHeight * dayAppointment.row;
            dayAppointment.y = 18 + dayAppointment.y + yLocation + (4 * dayAppointment.row);
            dayAppointment.x += 3;
            dayAppointment.width -= 8;

            if (dayAppointment.appointment.from.hour() != 0 || dayAppointment.appointment.to.hour() != 23) {
                var viewStart = this.getViewStart();
                var viewEnd = this.getViewEnd();
                if (!that.rtl) {
                    var xOffset = parseFloat(that.cellWidth / 24) * (dayAppointment.appointment.from.hour()) + parseFloat(that.cellWidth / 48) * (dayAppointment.appointment.from.minute() / 30);
                    if (dayAppointment.appointment.from < viewStart) {
                        xOffset = 0;
                    }

                    dayAppointment.timewidth = dayAppointment.width;
                    dayAppointment.timex = xOffset;
                    var wOffset = parseFloat(that.cellWidth / 24) * (dayAppointment.appointment.to.hour()) + parseFloat(that.cellWidth / 48) * (dayAppointment.appointment.to.minute() / 30);
                    if (dayAppointment.appointment.to > viewEnd) {
                        wOffset = 0;
                    }

                    dayAppointment.timewidth -= xOffset;
                    if (wOffset > 0) {
                        dayAppointment.timewidth -= that.cellWidth;
                        dayAppointment.timewidth += wOffset;
                    }
                
                    if (viewObject.appointmentsRenderMode == "exactTime") {
                        dayAppointment.width = dayAppointment.timewidth;
                        dayAppointment.x += xOffset;
                    }
                }
                else {
                    var xOffset = parseFloat(that.cellWidth / 24) * (dayAppointment.appointment.to.hour()) + parseFloat(that.cellWidth / 48) * (dayAppointment.appointment.to.minute() / 30);
                 
                    var wOffset = (parseFloat(that.cellWidth / 24) * (dayAppointment.appointment.from.hour()) + parseFloat(that.cellWidth / 48) * (dayAppointment.appointment.from.minute() / 30));
                    if (xOffset > 0) {
                        xOffset = that.cellWidth - xOffset;
                    }

                    if (dayAppointment.appointment.from < viewStart) {
                        wOffset = 0;
                    }
                    if (dayAppointment.appointment.to > viewEnd) {
                            xOffset = 0;
                    }

                    if (viewObject.appointmentsRenderMode == "exactTime") {
                        dayAppointment.x += xOffset;
                        dayAppointment.width -= xOffset;
                        dayAppointment.width -= wOffset;
                    }
                   
                    if (dayAppointment.appointment.duration().days() < 1) {
                        if (dayAppointment.width < 15) {
                            dayAppointment.width = 15;
                        }
                    }

                    dayAppointment.timewidth = dayAppointment.width;
                    if (viewObject.appointmentsRenderMode == "exactTimeStatus") {
                        dayAppointment.timewidth -= xOffset;
                        dayAppointment.timewidth -= wOffset;
                    }
                    dayAppointment.timex = xOffset;
                }
            }
        }

        for (var x = 0; x < dayAppointments.length; x++) {
            var uiappointment = dayAppointments[x];
            var html = "";

            var format = "auto";
            var viewObject = this._views[this._view];
            var from = uiappointment.appointment.from;
            var to = uiappointment.appointment.to;

            if (viewObject.timeRuler && viewObject.timeRuler.formatString) {
                format = viewObject.timeRuler.formatString;
            }

            var fromFormat = format;
            if (format === "auto") {
                if ((from.hour() == 0 && from.minute() == 0) || (from.hour() == 12 && from.minute() == 0)) {
                    var fromFormat = "hh tt";
                }
                else var fromFormat = "hh:mm";
                if ((to.hour() == 0 && to.minute() == 0) || (to.hour() == 12 && to.minute() == 0)) {
                    var toFormat = "hh tt";
                }
                else var toFormat = "hh:mm";
            }

            var formattedFrom = from.toString(fromFormat);
            var formattedTo = to.toString(toFormat);
            var duration = uiappointment.appointment.duration();
            var allDay = uiappointment.appointment.allDay || (duration.hours === 23 && duration.minutes === 59 && duration.seconds === 59);

            var bgColor = uiappointment.appointment.background;
            var title = uiappointment.appointment.subject ? uiappointment.appointment.subject : "(No Title)";
            var color = uiappointment.appointment.color;
            var resourceId = uiappointment.appointment.resourceId;
            var colors = that.getColors(that._resources.indexOf(resourceId));
            var resourceAttribute = " data-resourceId='" + resourceId + "' ";
            var borderColor = uiappointment.appointment.borderColor;
            var location = uiappointment.appointment.location;
            if (location.length > 0)
                location = ", " + location;

            if (!bgColor)
                bgColor = colors.background;
            if (!borderColor)
                borderColor = colors.border;
            if (!color)
                color = colors.color;

            var isRecurrent = uiappointment.appointment.isRecurrentAppointment();
            var isException = uiappointment.appointment.isException();
            var formatString = formattedFrom + "-" + formattedTo;
            if (allDay) {
                formattedFrom = "";
                formattedTo = "";
            }
            var defaultHTML = "";

            // define status
            var statusClass = that.toTP('jqx-scheduler-appointment-status');
            var statusElement = "";
            var status = that.statuses[uiappointment.appointment.status];
            var hasStatus = false;
            if (status) {
                if (status == "transparent") {
                    hasStatus = false;
                }
                else {
                    statusElement = "<div style='background: " + status + "; border-right-color: " + borderColor + "' class='" + statusClass + "'></div>";
                    if (status == "tentative") {
                        statusClass = that.toTP('jqx-scheduler-appointment-status jqx-scheduler-appointment-status-stripes');
                        statusElement = "<div style='background-color: " + borderColor + "; border-right-color: " + borderColor + "' class='" + statusClass + "'></div>";
                    }
                    hasStatus = true;
                }
            }

            var bottomStatusClass = that.toTP('jqx-scheduler-appointment-duration-status');
            var bottomStatus = "<div style='width: " + uiappointment.timewidth + "px; left: " + uiappointment.timex + "px;' class='" + bottomStatusClass + "'></div>";
            if (allDay) bottomStatus = "";
            var rtlStatusElement = "";
            if (viewObject.appointmentsRenderMode != "exactTimeStatus") {
                bottomStatus = "";
            }
            if (that.rtl) {
                var statusClass = that.toTP('jqx-scheduler-appointment-status-rtl jqx-scheduler-appointment-status');
                statusElement = "<div style='background: " + status + "; border-left-color: " + borderColor + "' class='" + statusClass + "'></div>";
                if (status == "tentative") {
                    statusClass = that.toTP('jqx-scheduler-appointment-status-rtl jqx-scheduler-appointment-status jqx-scheduler-appointment-status-stripes');
                    statusElement = "<div style='background-color: " + borderColor + "; border-left-color: " + borderColor + "' class='" + statusClass + "'></div>";
                }

                rtlStatusElement = statusElement;
                statusElement = "";
            }

            var customCSSClass = "";
            var defaultContent = title + location;
            if (!allDay) {
                defaultContent = title + location + bottomStatus;
            }

            if (that.renderAppointment) {
                var appointmentFormatData = that.renderAppointment({ appointment: uiappointment.appointment.boundAppointment, textColor: color, background: bgColor, borderColor: borderColor, html: defaultContent, cssClass: "", style: "", width: uiappointment.width, height: uiappointment.height, view: that._views[that._view].type });
                if (appointmentFormatData) {
                    var html = appointmentFormatData.html;
                    if (html != defaultContent) {
                        defaultContent = html;
                    }

                    color = appointmentFormatData.textColor;
                    bgColor = appointmentFormatData.background;
                    borderColor = appointmentFormatData.borderColor;
                    if (appointmentFormatData.cssClass) {
                        customCSSClass = appointmentFormatData.cssClass + " ";
                    }
                    if (appointmentFormatData.style != "") {
                        var colors = that.getAppointmentColors(appointmentFormatData.style);
                        bgColor = colors.background;
                        borderColor = colors.border;
                        color = colors.color;
                    }
                }
            }

            // end status.
            if (defaultHTML === "") {
                if (hasStatus) {
                    var defaultHTML = "<div style='white-space:nowrap;' class='" + that.toTP('jqx-scheduler-appointment-content') + "'>" + statusElement + "<div class='" + that.toTP('jqx-scheduler-appointment-inner-content') + "'>" + defaultContent + "</div>" + rtlStatusElement + "</div>";
                }
                else {
                    var defaultHTML = "<div style='white-space:nowrap;' class='" + that.toTP('jqx-scheduler-appointment-content') + "'><div class='" + that.toTP('jqx-scheduler-appointment-inner-content') + "'>" + defaultContent + "</div></div>";
                }
            }

            var rtlClass = "";
            if (that.rtl) {
                rtlClass = that.toTP('jqx-rtl jqx-scheduler-appointment-rtl') + " ";
            }

            if (isException) {
                var exceptionClass = color.toLowerCase() == "white" ? that.toTP('jqx-icon-recurrence-exception-white') : that.toTP('jqx-icon-recurrence-exception');
                html = "<div data-key='" + uiappointment.appointment.id + "'" + resourceAttribute + "class='" + rtlClass + customCSSClass + that.toTP('jqx-scheduler-appointment jqx-rc-all') + "' style='position:absolute; z-index: 399; left: " + uiappointment.x + "px; top: " + uiappointment.y + "px; width: " + uiappointment.width + "px; line-height: " + uiappointment.height + "px; height: " + uiappointment.height + "px; border-color:" + borderColor + "; color:" + color + "; background:" + bgColor + ";'><div class='" + exceptionClass + "'></div>" + defaultHTML + "<div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-left-resize-indicator") + "'></div><div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-right-resize-indicator") + "'></div>";
            }
            else if (isRecurrent) {
                var recurrenceClass = color.toLowerCase() == "white" ? that.toTP('jqx-icon-recurrence-white') : that.toTP('jqx-icon-recurrence');
                html = "<div data-key='" + uiappointment.appointment.id + "'" + resourceAttribute + "class='" + rtlClass + customCSSClass + that.toTP('jqx-scheduler-appointment jqx-rc-all') + "' style='position:absolute; z-index: 399; left: " + uiappointment.x + "px; top: " + uiappointment.y + "px; width: " + uiappointment.width + "px; line-height: " + uiappointment.height + "px; height: " + uiappointment.height + "px; border-color:" + borderColor + "; color:" + color + "; background:" + bgColor + ";'><div class='" + recurrenceClass + "'></div>" + defaultHTML + "<div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-left-resize-indicator") + "'></div><div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-right-resize-indicator") + "'></div>";
            }
            else {
                html = "<div data-key='" + uiappointment.appointment.id + "'" + resourceAttribute + "class='" + rtlClass + customCSSClass + that.toTP('jqx-scheduler-appointment jqx-rc-all') + "' style='position:absolute; z-index: 399; left: " + uiappointment.x + "px; top: " + uiappointment.y + "px; width: " + uiappointment.width + "px; line-height: " + uiappointment.height + "px; height: " + uiappointment.height + "px; border-color:" + borderColor + "; color:" + color + "; background:" + bgColor + ";'>" + defaultHTML + "<div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-left-resize-indicator") + "'></div><div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-right-resize-indicator") + "'></div>";
            }

            var $appointment = $(html);
            if (this.tableRows == 1) {
                $appointment.appendTo(this.pinnedtable);
            }
            else {
                $appointment.appendTo(this.table);
            }

            uiappointment.element = $appointment;
            if (this.appointmentTooltips) {
                if (!uiappointment.appointment.tooltip) {
                    var tooltip = uiappointment.appointment.subject;
                    if (formattedFrom) {
                        tooltip = formattedFrom + " - " + formattedTo + " " + tooltip;
                    }
                    if (tooltip) {
                        var location = uiappointment.appointment.location;
                        if (location) tooltip += "\n" + location;
                        $appointment[0].setAttribute('title', tooltip);
                    }
                }
                else {
                    $appointment[0].setAttribute('title', uiappointment.appointment.tooltip);
                }
            }
        }
    },

    _renderAppointmentsInDay: function (appointments, i) {
        if (appointments.length == 0)
            return;

        var that = this;
        var viewObject = this._views[this._view];
        var dayAppointments = appointments;
        var viewStart = this.getViewStart();
        var viewEnd = this.getViewEnd();

        var columnsCount = 1;
        var dayWidth = 0; ;
        if (viewObject.timeRuler) {
            dayWidth = this.columns.records[1].width;
            if (viewObject.timeRuler.timeZones) {
                dayWidth = this.columns.records[1 + viewObject.timeRuler.timeZones.length].width;
            }
        }
        else {
            dayWidth = this.columns.records[1].width
        }

        columnsCount = this.getMaxColumnsInADay(appointments);

        var columnWidth = dayWidth / columnsCount;
        if (columnWidth < 0) {
            return;
        }

        for (var j = 0; j < appointments.length; j++) {
            var dayAppointment = appointments[j];

            dayAppointment.column = -1;
            var collisionAppointments = this.getCollisionAppointments(dayAppointment, appointments);
            collisionAppointments.sort(this._sortAppointmentsByFrom);
            var currentAppointmentIndex = collisionAppointments.indexOf(dayAppointment);

            if (currentAppointmentIndex >= 0) {
                for (var p = currentAppointmentIndex; p < collisionAppointments.length; p++) {
                    collisionAppointments[p].column = -1;
                }
            }

            // iterate through the collision appointments and set the column.
            for (var m = 0; m < columnsCount; m++) {
                var currentColumn = m;

                for (var index in collisionAppointments) {
                    if (index == "indexOf")
                        break;

                    var collisionAppointment = collisionAppointments[index];
                    if (collisionAppointment.column == -1 && !this.isBusyColumn(currentColumn, collisionAppointments)) {
                        collisionAppointment.column = currentColumn;

                        var maxColumnsCount = columnsCount;
                        var currentColissions = this.getMaxColumnsInADay(collisionAppointments);
                        if (maxColumnsCount > currentColissions) {
                            maxColumnsCount = currentColissions;
                        }

                        collisionAppointment.columnsCount = maxColumnsCount;
                    }

                }
            }
        }

        for (var m = 0; m < dayAppointments.length; m++) {
            var dayAppointment = dayAppointments[m];
            var collisionAppointments = this.getCollisionAppointments(dayAppointment, dayAppointments);
            collisionAppointments.sort(this._sortAppointmentsByFrom);

            var maxColumns = 1;
            for (var index in collisionAppointments) {
                if (index == "indexOf")
                    break;
                var item = collisionAppointments[index];
                if (item.columnsCount == undefined)
                    continue;
                maxColumns = Math.max(maxColumns, item.columnsCount);
            }

            for (var index in collisionAppointments) {
                if (index == "indexOf")
                    break;
                var item = collisionAppointments[index];
                item.columnsCount = maxColumns;
            }

            // set the column span
            if (collisionAppointments.length == 1) {
                dayAppointment.columnSpan = maxColumns;
            }
            else {
                var span = 0;
                var canProceed = true;
                for (var p = dayAppointment.column; p < maxColumns; p++) {
                    for (var index in collisionAppointments) {
                        if (index == "indexOf")
                            break;
                        var collisionAppointment = collisionAppointments[index];
                        if (collisionAppointment.column == undefined)
                            continue;

                        if (collisionAppointment == dayAppointment)
                            continue;

                        if (collisionAppointment.column == p) {
                            canProceed = false;
                        }
                    }

                    if (!canProceed)
                        break;

                    span++;
                }
                dayAppointment.columnSpan = span;
            }
        }


        for (var x = 0; x < dayAppointments.length; x++) {
            var currentColumnWidth = dayWidth / dayAppointments[x].columnsCount;
            var dayAppointment = dayAppointments[x];
            dayAppointment.width = -5 + (currentColumnWidth * dayAppointment.columnSpan);
            var xLocation = currentColumnWidth * dayAppointment.column;
            dayAppointment.x = 2 + dayAppointment.x + xLocation;
            dayAppointment.height -= 5;
            dayAppointment.y += 1;

            if (viewObject.appointmentsRenderMode == "exactTime") {
                var minutes = that.getMinutesPerScale();
                if (dayAppointment.appointment.from.minute() % minutes != 0) {
                    var offsetMinutes = dayAppointment.appointment.from.minute() % minutes;
                    var yOffset = parseFloat(that.cellHeight / minutes) * offsetMinutes;
                }
                else var yOffset = 0;

                if (dayAppointment.appointment.to.minute() % minutes != 0) {
                    var offsetMinutes = dayAppointment.appointment.to.minute() % minutes;
                    var hOffset = that.cellHeight - parseFloat(that.cellHeight / minutes) * offsetMinutes;
                }
                else hOffset = 0;

                dayAppointment.y += yOffset;
                dayAppointment.height -= yOffset;
                dayAppointment.height -= hOffset;
            }
        }

        for (var x = 0; x < dayAppointments.length; x++) {
            var uiappointment = dayAppointments[x];
            var html = "";

            var format = "auto";
            var viewObject = this._views[this._view];
            var from = uiappointment.appointment.from;
            var to = uiappointment.appointment.to;

            if (viewObject.timeRuler && viewObject.timeRuler.formatString) {
                format = viewObject.timeRuler.formatString;
            }

            var fromFormat = format;
            if (format === "auto") {
                if ((from.hour() == 0 && from.minute() == 0) || (from.hour() == 12 && from.minute() == 0)) {
                    var fromFormat = "hh tt";
                }
                else var fromFormat = "hh:mm";
                if ((to.hour() == 0 && to.minute() == 0) || (to.hour() == 12 && to.minute() == 0)) {
                    var toFormat = "hh tt";
                }
                else var toFormat = "hh:mm";
            }

            var formattedFrom = from.toString(fromFormat);
            var formattedTo = to.toString(toFormat);

            var bgColor = uiappointment.appointment.background;
            var title = uiappointment.appointment.subject ? uiappointment.appointment.subject : "(No Title)";
            var location = uiappointment.appointment.location ? uiappointment.appointment.location : "";
            var color = uiappointment.appointment.color;
            var resourceId = uiappointment.appointment.resourceId;
            var colors = that.getColors(that._resources.indexOf(resourceId));
            var resourceAttribute = " data-resourceId='" + resourceId + "' ";
            var borderColor = uiappointment.appointment.borderColor;

            if (!bgColor)
                bgColor = colors.background;
            if (!borderColor)
                borderColor = colors.border;
            if (!color)
                color = colors.color;

            var isRecurrent = uiappointment.appointment.isRecurrentAppointment();
            var isException = uiappointment.appointment.isException();
            var defaultHTML = "";

            // define status
            var statusClass = that.toTP('jqx-scheduler-appointment-status');
            var statusElement = "";
            var status = that.statuses[uiappointment.appointment.status];
            var hasStatus = false;
            if (status) {
                if (status == "transparent") {
                    hasStatus = false;
                }
                else {
                    statusElement = "<div style='background: " + status + "; border-right-color: " + borderColor + "' class='" + statusClass + "'></div>";
                    if (status == "tentative") {
                        statusClass = that.toTP('jqx-scheduler-appointment-status jqx-scheduler-appointment-status-stripes');
                        statusElement = "<div style='background-color: " + borderColor + "; border-right-color: " + borderColor + "' class='" + statusClass + "'></div>";
                    }
                    hasStatus = true;
                }
            }

            var rtlStatusElement = "";
            if (that.rtl) {
                var statusClass = that.toTP('jqx-scheduler-appointment-status-rtl jqx-scheduler-appointment-status');
                statusElement = "<div style='background: " + status + "; border-left-color: " + borderColor + "' class='" + statusClass + "'></div>";
                if (status == "tentative") {
                    statusClass = that.toTP('jqx-scheduler-appointment-status-rtl jqx-scheduler-appointment-status jqx-scheduler-appointment-status-stripes');
                    statusElement = "<div style='background-color: " + borderColor + "; border-left-color: " + borderColor + "' class='" + statusClass + "'></div>";
                }

                rtlStatusElement = statusElement;
                statusElement = "";
            }

            var customCSSClass = "";
            var defaultContent = title + "<br/>" + location;
            if (!location) {
                var defaultContent = title;
            }

            if (that.renderAppointment) {
                var appointmentFormatData = that.renderAppointment({ appointment: uiappointment.appointment.boundAppointment, textColor: color, background: bgColor, borderColor: borderColor, html: defaultContent, cssClass: "", style: "", width: uiappointment.width, height: uiappointment.height, view: that._views[that._view].type});
                if (appointmentFormatData) {
                    var html = appointmentFormatData.html;
                    if (html != defaultContent) {
                        defaultContent = html;
                    }

                    color = appointmentFormatData.textColor;
                    bgColor = appointmentFormatData.background;
                    borderColor = appointmentFormatData.borderColor;
                    if (appointmentFormatData.cssClass) {
                        customCSSClass = appointmentFormatData.cssClass + " ";
                    }
                    if (appointmentFormatData.style != "") {
                        var colors = that.getAppointmentColors(appointmentFormatData.style);
                        bgColor = colors.background;
                        borderColor = colors.border;
                        color = colors.color;
                    }
                }
            }

            // end status.
            if (defaultHTML === "") {
                if (hasStatus) {
                    var defaultHTML = "<div class='" + that.toTP('jqx-scheduler-appointment-content') + "'>" + statusElement + "<div class='" + that.toTP('jqx-scheduler-appointment-inner-content') + "'>" + defaultContent + "</div>" + rtlStatusElement + "</div>";
                }
                else {
                    var defaultHTML = "<div class='" + that.toTP('jqx-scheduler-appointment-content') + "'><div class='" + that.toTP('jqx-scheduler-appointment-inner-content') + "'>" + defaultContent + "</div></div>";
                }
            }

            var rtlClass = "";
            if (that.rtl) {
                rtlClass = that.toTP('jqx-rtl jqx-scheduler-appointment-rtl') + " ";
            }

            if (isException) {
                var exceptionClass = color.toLowerCase() == "white" ? that.toTP('jqx-icon-recurrence-exception-white') : that.toTP('jqx-icon-recurrence-exception');
                html = "<div data-key='" + uiappointment.appointment.id + "'" + resourceAttribute + "class='" + rtlClass + customCSSClass + that.toTP('jqx-scheduler-appointment jqx-rc-all') + "' style='position:absolute; z-index: 399; left: " + uiappointment.x + "px; top: " + uiappointment.y + "px; width: " + uiappointment.width + "px; height: " + uiappointment.height + "px; border-color:" + borderColor + "; color:" + color + "; background:" + bgColor + ";'><div class='" + exceptionClass + "'></div>" + defaultHTML + "<div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-top-resize-indicator") + "'></div><div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-bottom-resize-indicator") + "'></div></div>";
            }
            else if (isRecurrent) {
                var recurrenceClass = color.toLowerCase() == "white" ? that.toTP('jqx-icon-recurrence-white') : that.toTP('jqx-icon-recurrence');
                html = "<div data-key='" + uiappointment.appointment.id + "'" + resourceAttribute + "class='" + rtlClass + customCSSClass + that.toTP('jqx-scheduler-appointment jqx-rc-all') + "' style='position:absolute; z-index: 399; left: " + uiappointment.x + "px; top: " + uiappointment.y + "px; width: " + uiappointment.width + "px; height: " + uiappointment.height + "px; border-color:" + borderColor + "; color:" + color + "; background:" + bgColor + ";'><div class='" + recurrenceClass + "'></div>" + defaultHTML + "<div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-top-resize-indicator") + "'></div><div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-bottom-resize-indicator") + "'></div></div>";
            }
            else {
                html = "<div data-key='" + uiappointment.appointment.id + "'" + resourceAttribute + "class='" + rtlClass + customCSSClass + that.toTP('jqx-scheduler-appointment jqx-rc-all') + "' style='position:absolute; z-index: 399; left: " + uiappointment.x + "px; top: " + uiappointment.y + "px; width: " + uiappointment.width + "px; height: " + uiappointment.height + "px; border-color:" + borderColor + "; color:" + color + "; background:" + bgColor + ";'>" + defaultHTML + "<div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-top-resize-indicator") + "'></div><div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-bottom-resize-indicator") + "'></div></div>";
            }

            var $appointment = $(html);
            $appointment.appendTo(this.table);
            uiappointment.element = $appointment;
            if (this.appointmentTooltips) {
                if (!uiappointment.appointment.tooltip) {
                    var tooltip = uiappointment.appointment.subject;
                    if (tooltip) {
                        var location = uiappointment.appointment.location;
                        if (location) tooltip += "\n" + location;
                        $appointment[0].setAttribute('title', tooltip);
                    }
                }
                else {
                    $appointment[0].setAttribute('title', uiappointment.appointment.tooltip);
                }
            }
        }
    },

    getCollisionAppointments: function (appointment, appointments) {
        var collisionAppointments = new Array();
        var from = appointment.from;
        var to = appointment.to;
        for (var i = 0; i < appointments.length; i++) {
            var item = appointments[i];
            var from2 = item.from;
            var to2 = item.to;
            if ($.jqx.scheduler.utilities.rangeIntersection(from, to, from2, to2)) {
                collisionAppointments.push(item);
            }
        }

        return collisionAppointments;
    },

    getAllDayCollisionAppointments: function (appointment, appointments) {
        var collisionAppointments = new Array();
        var from = $.jqx.scheduler.utilities.getStartOfDay(appointment.from);
        var to = $.jqx.scheduler.utilities.getEndOfDay(appointment.to);
        for (var i = 0; i < appointments.length; i++) {
            var item = appointments[i];
            var from2 = $.jqx.scheduler.utilities.getStartOfDay(item.from);
            var to2 = $.jqx.scheduler.utilities.getEndOfDay(item.to);
            if ($.jqx.scheduler.utilities.rangeIntersection(from, to, from2, to2)) {
                collisionAppointments.push(item);
            }
        }

        return collisionAppointments;
    },

    _renderAppointments: function (viewStart, viewEnd) {
        var that = this;
        if (that._appupdating) {
            return;
        }
        that.table.find('.jqx-scheduler-appointment').remove();
        that.pinnedtable.find('.jqx-scheduler-appointment').remove();
        var viewType = that._views[that._view].type;
        if (viewType === "dayView" || viewType === "weekView") {
            that._renderDayWeekAppointments(viewStart, viewEnd);
        }
        else if (viewType === "monthView") {
            that._renderMonthAppointments(viewStart, viewEnd);
        }
        else if (viewType === "timelineWeekView" || viewType === "timelineDayView" || viewType === "timelineMonthView") {
            that._renderTimelineAppointments(viewStart, viewEnd);
        }
        if (that.selectedJQXAppointment) {
            that._selectAppointment(that.selectedJQXAppointment);
        }
    },

    _renderTimelineAppointments: function (viewStart, viewEnd) {
        var that = this;
        var viewType = that._views[that._view].type;
        var viewObject = that._views[that._view];
        var allElements = new Array();
        var rows = this.rows;
        var cellHeight = this.cellHeight;
        var cellWidth = this.cellWidth;
        var minutes = that.getMinutesPerScale();

        for (var appIndex = 0; appIndex < this.appointmentsToRender.length; appIndex++) {
            var appointment = this.appointmentsToRender[appIndex];
            var from = appointment.from;
            var to = appointment.to;
            var getDate = that._getDateByString;

            var appointmentCells = new Array();
            var fromValue = from.toDate().valueOf();
            var toValue = to.toDate().valueOf();

            if (viewType === "timelineMonthView") {
                fromValue = from.clearTime().toDate().valueOf();
            }

            var sortCells = function (value1, value2) {
                if (value1.date < value2.date)
                    return -1;

                if (value1.date == value2.date)
                    return 0;

                if (value1.date > value2.date)
                    return 1;
            };

            var row = that.rows[0];
            var resourceId = appointment.resourceId;
            var resourceIndex = that._resources.indexOf(resourceId);
            if (that._resources.length > 0) {
                if (that.resources.orientation !== "horizontal") {
                    if (resourceIndex >= 1) {
                        row = that.rows[resourceIndex];
                    }
                }
            }
            if (that.resources && that.resources.orientation == "none") {
                resourceIndex = -1;
                var row = that.rows[0];
            }

            var cells = row.cells;
            for (var j = 0; j < cells.length; j++) {
                var dateString = cells[j].getAttribute("data-date");
                cells[j].appointments = new Array();
                var date = getDate(dateString);
                var dateValue = date.valueOf();
                var date2 = getDate(dateString);
                date2.setMinutes(date2.getMinutes() + minutes - 1);
                var dateValue2 = date2.valueOf();
                   
                if (dateValue > to) {
                    continue;
                }

                if ((fromValue <= dateValue && dateValue < toValue) || (fromValue <= dateValue2 && dateValue2 < toValue)) {
                    if (resourceIndex != -1) {
                        if ((1 + resourceIndex) != cells[j].getAttribute('data-view'))
                            continue;
                    }
                    appointmentCells.push({ cell: cells[j], date: date });
                    row = i;
                }
            }


            appointmentCells.sort(sortCells);
            var appointmentElements = new Array();
            var cells = appointmentCells;
            if (cells.length == 0)
                break;

            var appointmentHeight = that.appointmentsMinHeight;
            if (that.isTouchDevice()) {
                appointmentHeight = that.touchAppointmentsMinHeight;
            }

            if (viewObject.appointmentHeight) {
                appointmentHeight = viewObject.appointmentHeight;
            }

            var position = $(cells[0].cell).position();
            var height = appointmentHeight;
            var width = $(cells[cells.length - 1].cell).position().left - position.left + cellWidth;

            var x = position.left;
            var y = position.top;

            if (that.rtl) {
                var position = $(cells[cells.length - 1].cell).position();
                var width = $(cells[0].cell).position().left - position.left + cellWidth;

                var x = position.left;
                var y = position.top;
            }
            var toDate = new $.jqx.date(cells[cells.length - 1].date, that.timeZone).addMinutes(minutes);

            if (viewType === "timelineMonthView") {
                var toDate = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(cells[cells.length - 1].date, that.timeZone));
            }

            var data = { cellX: x, cellY: y, cellHeight: cellHeight, cells: cells, x: x, y: y, height: height, width: width, appointment: appointment, from: new $.jqx.date(cells[0].date, that.timeZone), to: toDate };
            appointmentElements.push(data);
            allElements.push(data);
            appointment.elements = appointmentElements;
            if (appointment.rootAppointment) {
                appointment.rootAppointment.elements = appointment.rootAppointment.elements.concat(appointment.elements);
            }
        }

        if (this._resources.length < 2 || this.resources.orientation == "none") {
            this._renderUITimelineAppointments(allElements, viewStart, viewEnd);
        }
        else {
            for (var j = 0; j < this._resources.length; j++) {
                var id = this._resources[j];
                var elements = new Array();
                for (var i = 0; i < allElements.length; i++) {
                    if (allElements[i].appointment.resourceId == id) {
                        elements.push(allElements[i]);
                    }
                }
                this._renderUITimelineAppointments(elements, viewStart, viewEnd);
            }
        }
    },

    _renderUITimelineAppointments: function (appointments, viewStart, viewEnd) {
        var that = this;
        var viewType = that._views[that._view].type;
        var viewObject = that._views[that._view];
        var weekAppointments = appointments;
        var rowsCount = 1;
        var that = this;
        var cacheCollisions = new Array();
        rowsCount = that.getMaxTimelineAppointments(appointments, cacheCollisions, viewStart, viewEnd);
        var appointmentHeight = that.appointmentsMinHeight;
        if (that.isTouchDevice()) {
            appointmentHeight = that.touchAppointmentsMinHeight;
        }

        if (viewObject.appointmentHeight) {
            appointmentHeight = viewObject.appointmentHeight;
        }

        for (var j = 0; j < appointments.length; j++) {
            var weekAppointment = appointments[j];

            weekAppointment.row = -1;
            var collisionAppointments = that.getCollisionAppointments(weekAppointment, appointments);
            collisionAppointments.sort(that._sortAppointmentsByFrom);
            var currentAppointmentIndex = collisionAppointments.indexOf(weekAppointment);

            if (currentAppointmentIndex >= 0) {
                for (var p = currentAppointmentIndex; p < collisionAppointments.length; p++) {
                    collisionAppointments[p].row = -1;
                }
            }

            // iterate through the collision appointments and set the row.
            for (var m = 0; m < rowsCount; m++) {
                var currentRow = m;

                for (var index in collisionAppointments) {
                    if (index == "indexOf")
                        break;

                    var collisionAppointment = collisionAppointments[index];
                    if (collisionAppointment.row == -1 && !that.isBusyRow(currentRow, collisionAppointments)) {
                        collisionAppointment.row = currentRow;

                        var maxRowsCount = rowsCount;
                        var currentColissions = that.getMaxTimelineAppointments(collisionAppointments, cacheCollisions, viewStart, viewEnd);
                        if (maxRowsCount > currentColissions) {
                            maxRowsCount = currentColissions;
                        }

                        collisionAppointment.rowsCount = maxRowsCount;
                    }

                }
            }
        }

        for (var m = 0; m < weekAppointments.length; m++) {
            var weekAppointment = weekAppointments[m];
            var collisionAppointments = that.getCollisionAppointments(weekAppointment, weekAppointments);
            collisionAppointments.sort(that._sortAppointmentsByFrom);

            var maxRows = 1;
            for (var index in collisionAppointments) {
                if (index == "indexOf")
                    break;
                var item = collisionAppointments[index];
                maxRows = Math.max(maxRows, item.rowsCount);
            }

            for (var index in collisionAppointments) {
                if (index == "indexOf")
                    break;
                var item = collisionAppointments[index];
                item.rowsCount = maxRows;
            }

            if (collisionAppointments.length == 1) {
                weekAppointment.rowSpan = maxRows;
            }
            else {
                var span = 0;
                var canProceed = true;
                for (var p = weekAppointment.row; p < maxRows; p++) {
                    for (var index in collisionAppointments) {
                        if (index == "indexOf")
                            break;
                        var collisionAppointment = collisionAppointments[index];
                        if (collisionAppointment == weekAppointment)
                            continue;

                        if (collisionAppointment.row == p) {
                            canProceed = false;
                        }
                    }

                    if (!canProceed)
                        break;

                    span++;
                }
                weekAppointment.rowSpan = span;
            }
        }


        for (var x = 0; x < weekAppointments.length; x++) {
            var currentRowHeight = appointmentHeight;
            var weekAppointment = weekAppointments[x];
            weekAppointment.height = currentRowHeight;
            var yLocation = 2 + (3 + currentRowHeight) * weekAppointment.row;
            weekAppointment.y = weekAppointment.y + yLocation;
            weekAppointment.x += 1;
            weekAppointment.width -= 5;

            var view = that._views[that._view].type;
            var viewObject = that._views[that._view];

            if (view == "timelineMonthView" && viewObject.appointmentsRenderMode) {
                if (weekAppointment.appointment.from.hour() != 0 || weekAppointment.appointment.to.hour() != 23) {
                    if (!that.rtl) {
                        var xOffset = parseFloat(that.cellWidth / 24) * (weekAppointment.appointment.from.hour()) + parseFloat(that.cellWidth / 48) * (weekAppointment.appointment.from.minute() / 30);
                        var wOffset = parseFloat(that.cellWidth / 24) * (weekAppointment.appointment.to.hour()) + parseFloat(that.cellWidth / 48) * (weekAppointment.appointment.to.minute() / 30);
                        weekAppointment.timewidth = weekAppointment.width;
                        weekAppointment.timex = xOffset;
                        weekAppointment.timewidth -= xOffset;
                        weekAppointment.timewidth -= that.cellWidth;
                        weekAppointment.timewidth += wOffset;

                        if (viewObject.appointmentsRenderMode == "exactTime") {
                            weekAppointment.width = weekAppointment.timewidth;
                            weekAppointment.x += xOffset;
                            if (weekAppointment.appointment.duration().days() < 1) {
                                if (weekAppointment.width < 15) {
                                    weekAppointment.width = 15;
                                    if (xOffset + 15 > that.cellWidth) {
                                        var xNegativeOffset = that.cellWidth - xOffset - 15;
                                        weekAppointment.x += xNegativeOffset;
                                    }
                                }
                            }
                        }
                    }
                    else {
                        var xOffset = parseFloat(that.cellWidth / 24) * (weekAppointment.appointment.to.hour()) + parseFloat(that.cellWidth / 48) * (weekAppointment.appointment.to.minute() / 30);
                        var wOffset = (parseFloat(that.cellWidth / 24) * (weekAppointment.appointment.from.hour()) + parseFloat(that.cellWidth / 48) * (weekAppointment.appointment.from.minute() / 30));
                        if (xOffset > 0) {
                            xOffset = that.cellWidth - xOffset;
                        }
                        if (viewObject.appointmentsRenderMode == "exactTime") {
                            weekAppointment.x += xOffset;
                            weekAppointment.width -= xOffset;
                            weekAppointment.width -= wOffset;
                        }
                        if (weekAppointment.appointment.duration().days() < 1) {
                            if (weekAppointment.width < 15) {
                                weekAppointment.width = 15;
                            }
                        }
                        weekAppointment.timewidth = weekAppointment.width;
                        weekAppointment.timex = xOffset;
                    }
                }
            }
            else if (viewObject.appointmentsRenderMode) {
                if (viewObject.appointmentsRenderMode == "exactTime") {
                    var minutes = that.getMinutesPerScale();
                    if (weekAppointment.appointment.from.minute() % minutes != 0) {
                        var offsetMinutes = weekAppointment.appointment.from.minute() % minutes;
                        var xOffset = parseFloat(that.cellWidth / minutes) * offsetMinutes;
                        if (that.rtl) {
                            var xOffset = parseFloat(that.cellWidth / minutes) * offsetMinutes;
                        }
                    }
                    else var xOffset = 0;

                    if (weekAppointment.appointment.to.minute() % minutes != 0) {
                        var offsetMinutes = weekAppointment.appointment.to.minute() % minutes;
                        var wOffset = that.cellWidth - parseFloat(that.cellWidth / minutes) * offsetMinutes;
                        if (that.rtl) {
                            var wOffset = that.cellWidth - parseFloat(that.cellWidth / minutes) * offsetMinutes;
                        }
                    }
                    else wOffset = 0;

                    if (!that.rtl) {
                        weekAppointment.x += xOffset;
                        weekAppointment.width -= xOffset;
                        weekAppointment.width -= wOffset;
                    }
                    else {
                        weekAppointment.x += wOffset;
                        weekAppointment.width -= xOffset;
                        weekAppointment.width -= wOffset;
                    }
                }
            }
        }
  
        var appointmentsHTML = "";
        for (var x = 0; x < weekAppointments.length; x++) {
            var uiappointment = weekAppointments[x];
            var html = "";

            var format = "auto";
            var viewObject = that._views[that._view];
            var from = uiappointment.appointment.from;
            var to = uiappointment.appointment.to;

            if (viewObject.timeRuler && viewObject.timeRuler.formatString) {
                format = viewObject.timeRuler.formatString;
            }

            var bgColor = uiappointment.appointment.background;
            var title = uiappointment.appointment.subject ? uiappointment.appointment.subject : "(No Title)";
            var location = uiappointment.appointment.location;
            if (location && location.length > 1) {
                location = ", " + location;
            }
            var color = uiappointment.appointment.color;
            var resourceId = uiappointment.appointment.resourceId;
            var colors = that.getColors(that._resources.indexOf(resourceId));
            var resourceAttribute = " data-resourceId='" + resourceId + "' ";
            var borderColor = uiappointment.appointment.borderColor;
                
            if (!bgColor)
                bgColor = colors.background;
            if (!borderColor)
                borderColor = colors.border;
            if (!color)
                color = colors.color;

            var isRecurrent = uiappointment.appointment.isRecurrentAppointment();
            var isException = uiappointment.appointment.isException();
            var defaultHTML = "";

            // define status
            var statusClass = that.toTP('jqx-scheduler-appointment-status');
            var statusElement = "";
            var status = that.statuses[uiappointment.appointment.status];
            var hasStatus = false;
            if (status) {
                if (status == "transparent") {
                    hasStatus = false;
                }
                else {
                    statusElement = "<div style='background: " + status + "; border-right-color: " + borderColor + "' class='" + statusClass + "'></div>";
                    if (status == "tentative") {
                        statusClass = that.toTP('jqx-scheduler-appointment-status jqx-scheduler-appointment-status-stripes');
                        statusElement = "<div style='background-color: " + borderColor + "; border-right-color: " + borderColor + "' class='" + statusClass + "'></div>";
                    }
                    hasStatus = true;
                }
            }

            var rtlStatusElement = "";
            if (that.rtl) {
                var statusClass = that.toTP('jqx-scheduler-appointment-status-rtl jqx-scheduler-appointment-status');
                statusElement = "<div style='background: " + status + "; border-left-color: " + borderColor + "' class='" + statusClass + "'></div>";
                if (status == "tentative") {
                    statusClass = that.toTP('jqx-scheduler-appointment-status-rtl jqx-scheduler-appointment-status jqx-scheduler-appointment-status-stripes');
                    statusElement = "<div style='background-color: " + borderColor + "; border-left-color: " + borderColor + "' class='" + statusClass + "'></div>";
                }

                rtlStatusElement = statusElement;
                statusElement = "";
            }

            var customCSSClass = "";
            var defaultContent = title + "<br/>" + location;
            if (that.renderAppointment) {
                var appointmentFormatData = that.renderAppointment({ appointment: uiappointment.appointment.boundAppointment, textColor: color, background: bgColor, borderColor: borderColor, html: defaultContent, cssClass: "", style: "", width: uiappointment.width, height: uiappointment.height, view: that._views[that._view].type });
                if (appointmentFormatData) {
                    var html = appointmentFormatData.html;
                    if (html != defaultContent) {
                        defaultContent = html;
                    }

                    color = appointmentFormatData.textColor;
                    bgColor = appointmentFormatData.background;
                    borderColor = appointmentFormatData.borderColor;
                    if (appointmentFormatData.cssClass) {
                        customCSSClass = appointmentFormatData.cssClass + " ";
                    }
                    if (appointmentFormatData.style != "") {
                        var colors = that.getAppointmentColors(appointmentFormatData.style);
                        bgColor = colors.background;
                        borderColor = colors.border;
                        color = colors.color;
                    }
                }
            }

            // end status.
            if (defaultHTML === "") {
                if (hasStatus) {
                    var defaultHTML = "<div style='white-space:nowrap;' class='" + that.toTP('jqx-scheduler-appointment-content') + "'>" + statusElement + "<div class='" + that.toTP('jqx-scheduler-appointment-inner-content') + "'>" + defaultContent + "</div>" + rtlStatusElement + "</div>";
                }
                else {
                    var defaultHTML = "<div style='white-space:nowrap;' class='" + that.toTP('jqx-scheduler-appointment-content') + "'><div class='" + that.toTP('jqx-scheduler-appointment-inner-content') + "'>" + defaultContent + "</div></div>";
                }
            }


            var rtlClass = "";
            if (that.rtl) {
                rtlClass = that.toTP('jqx-rtl jqx-scheduler-appointment-rtl') + " ";
            }

            if (isException) {
                var exceptionClass = color.toLowerCase() == "white" ? that.toTP('jqx-icon-recurrence-exception-white') : that.toTP('jqx-icon-recurrence-exception');
                html = "<div data-key='" + uiappointment.appointment.id + "'" + resourceAttribute + "class='" + rtlClass + customCSSClass + that.toTP('jqx-scheduler-appointment jqx-rc-all') + "' style='position:absolute; z-index: 399; left: " + uiappointment.x + "px; top: " + uiappointment.y + "px; width: " + uiappointment.width + "px; height: " + uiappointment.height + "px; line-height: " + uiappointment.height + "px; border-color:" + borderColor + "; color:" + color + "; background:" + bgColor + ";'><div class='" + exceptionClass + "'></div>" + defaultHTML + "<div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-left-resize-indicator") + "'></div><div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-right-resize-indicator") + "'></div>";
            }
            else if (isRecurrent) {
                var recurrenceClass = color.toLowerCase() == "white" ? that.toTP('jqx-icon-recurrence-white') : that.toTP('jqx-icon-recurrence');
                html = "<div data-key='" + uiappointment.appointment.id + "'" + resourceAttribute + "class='" + rtlClass + customCSSClass + that.toTP('jqx-scheduler-appointment jqx-rc-all') + "' style='position:absolute; z-index: 399; left: " + uiappointment.x + "px; top: " + uiappointment.y + "px; width: " + uiappointment.width + "px; height: " + uiappointment.height + "px; line-height: " + uiappointment.height + "px; border-color:" + borderColor + "; color:" + color + "; background:" + bgColor + ";'><div class='" + recurrenceClass + "'></div>" + defaultHTML + "<div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-left-resize-indicator") + "'></div><div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-right-resize-indicator") + "'></div>";
            }
            else {
                html = "<div data-key='" + uiappointment.appointment.id + "'" + resourceAttribute + "class='" + rtlClass + customCSSClass + that.toTP('jqx-scheduler-appointment jqx-rc-all') + "' style='position:absolute; z-index: 399; left: " + uiappointment.x + "px; top: " + uiappointment.y + "px; width: " + uiappointment.width + "px; height: " + uiappointment.height + "px; line-height: " + uiappointment.height + "px; border-color:" + borderColor + "; color:" + color + "; background:" + bgColor + ";'>" + defaultHTML + "<div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-left-resize-indicator") + "'></div><div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-right-resize-indicator") + "'></div>";
            }

            appointmentsHTML = html;
            var $appointment = $(html);
            $appointment.appendTo(this.table);
            uiappointment.element = $appointment;
            if (this.appointmentTooltips) {
                if (!uiappointment.appointment.tooltip) {
                    var tooltip = uiappointment.appointment.subject;
                    if (tooltip) {
                        var location = uiappointment.appointment.location;
                        if (location) tooltip += "\n" + location;
                        $appointment[0].setAttribute('title', tooltip);
                    }
                }
                else {
                    $appointment[0].setAttribute('title', uiappointment.appointment.tooltip);
                }
            }
        }
        var renderedAppointments = that.table.find('.jqx-scheduler-appointment');
        var getAppointmentByKey = function (key) {
            for (var i = 0; i < renderedAppointments.length; i++) {
                var appKey = renderedAppointments[i].getAttribute('data-key');
                if (appKey == key)
                    return renderedAppointments[i];
            }
        }

        for (var x = 0; x < weekAppointments.length; x++) {
            var uiappointment = weekAppointments[x];
            var outOfBounds = false;
            var $appointment = $(getAppointmentByKey(uiappointment.appointment.id));

            $.each(uiappointment.cells, function (index) {
                var cell = $(this.cell);
                var top = uiappointment.cellY;
                var left = uiappointment.cellX;
                var cellHeight = uiappointment.cellHeight;
                if (!cell[0].appointments)
                    cell[0].appointments = new Array();

                cell[0].appointments.push({ ui: $appointment, appointment: uiappointment });
                $appointment = $appointment;

                if (uiappointment.y + uiappointment.height >= top + cellHeight - 12) {
                    $appointment[0].style.visibility = "hidden";
                    var arrow = cell.find('.jqx-icon-arrow-down');
                    if (arrow.length > 0) {
                        arrow[0].style.display = "block";
                        arrow[0].mousedown = function () {
                            if (that.openedMonthCellPopup) that.openedMonthCellPopup.remove();
                            var popup = $("<div></div>");
                            var date = new $.jqx.date(cell.attr('data-date'), that.timeZone);
                            var header = $("<div class='" + that.toTP("jqx-scheduler-month-cell") + "'><span style='float: right; cursor: pointer; width:16px; height: 16px;' class='" + that.toTP('jqx-icon-close') + "'></span></div>");
                            header.height(16);
                            header.find('span')[0].mousedown = function () {
                                popup.remove();
                            }
                            header.addClass(that.toTP('jqx-widget-header'));
                            popup.addClass(that.toTP('jqx-widget'));
                            popup.addClass(that.toTP('jqx-window'));
                            popup.addClass(that.toTP('jqx-scheduler-month-cell-popup'));
                            popup.addClass(that.toTP('jqx-popup'));
                            var content = $("<div></div>");
                            popup.append(header);
                            popup.append(content);
                            content.addClass(that.toTP('jqx-widget-content'));
                            var width = cell.width();
                            var height = 21;
                            for (var i = 0; i < cell[0].appointments.length; i++) {
                                var app = cell[0].appointments[i].ui.clone(true);
                                app.css('left', '3px');
                                app.css('top', '0px');
                                app.css('margin-top', '2px');
                                app.css('position', 'relative');
                                app.css('visibility', 'visible');
                                app.width(width - 6);
                                app.click(function (event)
                                {
                                    var appJQX = that.getJQXAppointmentByElement(that.getAppointmentElement(event.target));
                                    that._raiseEvent('appointmentClick', { appointment: appJQX.boundAppointment });
                                });
                                app.dblclick(function (event)
                                {
                                    var appJQX = that.getJQXAppointmentByElement(that.getAppointmentElement(event.target));
                                    if (!appJQX.readOnly && !that.editRecurrenceDialog.jqxWindow('isOpen') && (!that._editDialog || (that._editDialog && !that._editDialog.jqxWindow('isOpen'))))
                                    {
                                        var result = that._initDialog(appJQX);
                                        if (result !== false)
                                        {
                                            that._openDialog();
                                        }
                                    }
                                    that._raiseEvent('appointmentDoubleClick', { appointment: appJQX.boundAppointment });
                                });
                                height += app.outerHeight() + 4;
                                content.append(app);
                            }
                            popup.css('overflow', 'hidden');
                            popup.css('position', 'absolute');
                            var maxHeight = that.table.height() - top - 25;
                            if (maxHeight < cellHeight) maxHeight = cellHeight;
                            popup.css('max-height', maxHeight);
                            popup.height(height);
                            popup.width(width);
                            popup.css('z-index', '9999');
                            var position = cell.position();

                            popup.css('top', position.top);
                            popup.css('left', position.left);

                            that.table.append(popup);
                            that.openedMonthCellPopup = popup;
                        }
                    }
                }
            });
        }
    },

    _renderMonthAppointments: function () {
        var that = this;
        var viewType = that._views[that._view].type;
        var viewObject = that._views[that._view];
        var allElements = new Array();
        var rows = this.rows;
        var monthCellHeight = $(".jqx-scheduler-month-cell:first").height();

        for (var appIndex = 0; appIndex < this.appointmentsToRender.length; appIndex++) {
            var appointment = this.appointmentsToRender[appIndex];
            var from = $.jqx.scheduler.utilities.getStartOfDay(appointment.from);
            var to = $.jqx.scheduler.utilities.getEndOfDay(appointment.to);
            var allDay = appointment.allDay;
            var getDate = that._getDateByString;

            var appointmentCells = new Array();
            var appointmentDays = new Array();

            var fromValue = from.toDate().valueOf();
            var toValue = to.toDate().valueOf();
            var sortCells = function (value1, value2) {
                if (value1.date < value2.date)
                    return -1;

                if (value1.date == value2.date)
                    return 0;

                if (value1.date > value2.date)
                    return 1;
            };

            var row = -1;
            var resourceId = appointment.resourceId;
            var resourceIndex = that._resources.indexOf(resourceId);
            if (that.resources && that.resources.orientation == "none")
                resourceIndex = -1;

            for (var i = 0; i < that.rows.length; i++) {
                var cells = that.rows[i].cells;
                for (var j = 0; j < cells.length; j++) {
                    var dateString = cells[j].getAttribute("data-date");
                    var date = getDate(dateString);
                    var dateValue = date.valueOf();
                    if (dateValue > to) {
                        continue;
                    }
                    cells[j].appointments = new Array();

                    if (resourceIndex != -1) {
                        if ((1 + resourceIndex) != cells[j].getAttribute('data-view'))
                            continue;
                    }

                    if (fromValue <= dateValue && dateValue < toValue) {
                        if (row != i && row != -1) {
                            appointmentCells.sort(sortCells);
                            appointmentDays.push(appointmentCells);
                            appointmentCells = new Array();
                        }
                        appointmentCells.push({ cell: cells[j], date: date });
                        row = i;
                    }
                }
            }

            appointmentCells.sort(sortCells);
            appointmentDays.push(appointmentCells);

            var appointmentElements = new Array();

            for (var i = 0; i < appointmentDays.length; i++) {
                var cells = appointmentDays[i];
                if (cells.length == 0)
                    break;

                var appointmentHeight = that.appointmentsMinHeight;
                if (that.isTouchDevice()) {
                    appointmentHeight = that.touchAppointmentsMinHeight;
                }

                if (viewObject.appointmentHeight) {
                    appointmentHeight = viewObject.appointmentHeight;
                }

                var height = appointmentHeight;
                var lastCellLeft = $(cells[cells.length - 1].cell).position().left;
                var width = lastCellLeft - $(cells[0].cell).position().left + that.columns.records[0].width;
                if (viewObject.showWeekNumbers) {
                    var width = lastCellLeft - $(cells[0].cell).position().left + that.columns.records[1].width;
                }

                var pos = $(cells[0].cell).position();
                var x = pos.left;

                var y = pos.top + monthCellHeight;
                var toDate = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(cells[cells.length - 1].date, that.timeZone));
                var fromDate = new $.jqx.date(cells[0].date, that.timeZone);
                if (that.rtl) {
                    var toDate = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(cells[0].date, that.timeZone));
                    var fromDate = new $.jqx.date(cells[cells.length - 1].date, that.timeZone);
                    var pos = $(cells[cells.length-1].cell).position();
                    var x = pos.left;
                    var y = pos.top + monthCellHeight;
              
                    var lastCellLeft = $(cells[0].cell).position().left;
                    var width = lastCellLeft - $(cells[cells.length - 1].cell).position().left + that.columns.records[0].width;
                    if (viewObject.showWeekNumbers) {
                        var width = lastCellLeft - $(cells[cells.length - 1].cell).position().left + that.columns.records[1].width;
                    }
                }

                var data = { cells: cells, cellY: parseInt(pos.top), cellX: parseInt(pos.left), lastCellY: parseInt(pos.top), lastCellX: lastCellLeft, x: x, y: y, height: height, width: width, appointment: appointment, from: fromDate, to: toDate };
                appointmentElements.push(data);
                allElements.push(data);
            }
            appointment.elements = appointmentElements;
            if (appointment.rootAppointment) {
                appointment.rootAppointment.elements = appointment.rootAppointment.elements.concat(appointment.elements);
            }
        }

        var viewStart = this.getViewStart();
        var viewEnd = this.getViewEnd();

        if (this._resources.length < 2 || this.resources.orientation == "none") {
            var appointmentsPerWeek = new Array();
            var currentDate = viewStart;
            var index = 0;
            while (currentDate < viewEnd) {
                appointmentsPerWeek[index] = new Array();
                for (var i = 0; i < allElements.length; i++) {
                    var element = allElements[i];
                    if (currentDate <= element.from && element.to < currentDate.addDays(7)) {
                        element.row = -1;
                        element.rowSpan = 1;

                        appointmentsPerWeek[index].push(element);
                    }
                }
                index++;
                currentDate = currentDate.addDays(7);
            }
            for (var i = 0; i < appointmentsPerWeek.length; i++) {
                if (appointmentsPerWeek[i].length > 0) {
                    this._renderUIMonthAppointments(appointmentsPerWeek[i]);
                }
            }
        }
        else {
            for (var j = 0; j < this._resources.length; j++) {
                var id = this._resources[j];
                var elements = new Array();
                var appointmentsPerWeek = new Array();
                var currentDate = viewStart;
                var index = 0;
                while (currentDate < viewEnd) {
                    appointmentsPerWeek[index] = new Array();
                    for (var i = 0; i < allElements.length; i++) {
                        var element = allElements[i];
                        if (currentDate <= element.from && element.to < currentDate.addDays(7)) {
                            element.row = -1;
                            element.rowSpan = 1;
                            if (element.appointment.resourceId == id) {
                                appointmentsPerWeek[index].push(element);
                            }
                        }
                    }
                    index++;
                    currentDate = currentDate.addDays(7);
                }
                for (var i = 0; i < appointmentsPerWeek.length; i++) {
                    if (appointmentsPerWeek[i].length > 0) {
                        this._renderUIMonthAppointments(appointmentsPerWeek[i]);
                    }
                }
            }
        }
    },

    _getMonthAppointmentsPerWeek: function()
    {
        var that = this;
        var viewType = that._views[that._view].type;
        var viewObject = that._views[that._view];
        var allElements = new Array();
        var rows = this.rows;
        var monthCellHeight = $(".jqx-scheduler-month-cell:first").height();
        if (!that.rows)
            return new Array();

        for (var appIndex = 0; appIndex < this.appointmentsToRender.length; appIndex++) {
            var appointment = this.appointmentsToRender[appIndex];
            var from = $.jqx.scheduler.utilities.getStartOfDay(appointment.from);
            var to = $.jqx.scheduler.utilities.getEndOfDay(appointment.to);
            var allDay = appointment.allDay;
            var getDate = that._getDateByString;

            var appointmentCells = new Array();
            var appointmentDays = new Array();

            var fromValue = from.toDate().valueOf();
            var toValue = to.toDate().valueOf();
            var sortCells = function (value1, value2) {
                if (value1.date < value2.date)
                    return -1;

                if (value1.date == value2.date)
                    return 0;

                if (value1.date > value2.date)
                    return 1;
            };

            var row = -1;
            var resourceId = appointment.resourceId;
            var resourceIndex = that._resources.indexOf(resourceId);
            if (that.resources && that.resources.orientation == "none")
                resourceIndex = -1;

            for (var i = 0; i < that.rows.length; i++) {
                var cells = that.rows[i].cells;
                for (var j = 0; j < cells.length; j++) {
                    var dateString = cells[j].getAttribute("data-date");
                    var date = getDate(dateString);
                    var dateValue = date.valueOf();
                    if (dateValue > to) {
                        continue;
                    }
                 
                    if (resourceIndex != -1) {
                        if ((1 + resourceIndex) != cells[j].getAttribute('data-view'))
                            continue;
                    }

                    if (fromValue <= dateValue && dateValue < toValue) {
                        if (row != i && row != -1) {
                            appointmentCells.sort(sortCells);
                            appointmentDays.push(appointmentCells);
                            appointmentCells = new Array();
                        }
                        appointmentCells.push({ cell: cells[j], date: date });
                        row = i;
                    }
                }
            }

            appointmentCells.sort(sortCells);
            appointmentDays.push(appointmentCells);

            var appointmentElements = new Array();

            for (var i = 0; i < appointmentDays.length; i++) {
                var cells = appointmentDays[i];
                if (cells.length == 0)
                    break;

                var appointmentHeight = that.appointmentsMinHeight;
                if (that.isTouchDevice()) {
                    appointmentHeight = that.touchAppointmentsMinHeight;
                }

                if (viewObject.appointmentHeight) {
                    appointmentHeight = viewObject.appointmentHeight;
                }

                var height = appointmentHeight;
                var lastCellLeft = $(cells[cells.length - 1].cell).position().left;
                var width = lastCellLeft - $(cells[0].cell).position().left + that.columns.records[0].width;
                if (viewObject.showWeekNumbers) {
                    var width = lastCellLeft - $(cells[0].cell).position().left + that.columns.records[1].width;
                }

                var pos = $(cells[0].cell).position();
                var x = pos.left;

                var y = pos.top + monthCellHeight;
                var toDate = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(cells[cells.length - 1].date, that.timeZone));
                var fromDate = new $.jqx.date(cells[0].date, that.timeZone);
                if (that.rtl) {
                    var toDate = $.jqx.scheduler.utilities.getEndOfDay(new $.jqx.date(cells[0].date, that.timeZone));
                    var fromDate = new $.jqx.date(cells[cells.length - 1].date, that.timeZone);
                    var pos = $(cells[cells.length - 1].cell).position();
                    var x = pos.left;
                    var y = pos.top + monthCellHeight;

                    var lastCellLeft = $(cells[0].cell).position().left;
                    var width = lastCellLeft - $(cells[cells.length - 1].cell).position().left + that.columns.records[0].width;
                    if (viewObject.showWeekNumbers) {
                        var width = lastCellLeft - $(cells[cells.length - 1].cell).position().left + that.columns.records[1].width;
                    }
                }

                var data = { cells: cells, cellY: parseInt(pos.top), cellX: parseInt(pos.left), lastCellY: parseInt(pos.top), lastCellX: lastCellLeft, x: x, y: y, height: height, width: width, appointment: appointment, from: fromDate, to: toDate };
                appointmentElements.push(data);
                allElements.push(data);
            }
       
        }

        var viewStart = this.getViewStart();
        var viewEnd = this.getViewEnd();

        if (this._resources.length < 2 || this.resources.orientation == "none") {
            var appointmentsPerWeek = new Array();
            var currentDate = viewStart;
            var index = 0;
            while (currentDate < viewEnd) {
                appointmentsPerWeek[index] = new Array();
                for (var i = 0; i < allElements.length; i++) {
                    var element = allElements[i];
                    if (currentDate <= element.from && element.to < currentDate.addDays(7)) {
                        element.row = -1;
                        element.rowSpan = 1;

                        appointmentsPerWeek[index].push(element);
                    }
                }
                index++;
                currentDate = currentDate.addDays(7);
            }
            var weeks = new Array();
            for (var i = 0; i < appointmentsPerWeek.length; i++) {
                if (appointmentsPerWeek[i].length > 0) {
                    var result = this.getMaxMonthAppointments(appointmentsPerWeek[i]);
                    var appointmentHeight = that.appointmentsMinHeight;
                    if (that.isTouchDevice()) {
                        appointmentHeight = that.touchAppointmentsMinHeight;
                    }

                    if (viewObject.appointmentHeight) {
                        appointmentHeight = viewObject.appointmentHeight;
                    }

                    weeks.push((result * (appointmentHeight + 3)) + 22);
                }
                else weeks.push("auto");
            }
            return weeks;
        }
        else {
            var weeks = new Array();
            for (var j = 0; j < this._resources.length; j++) {
                var id = this._resources[j];
                var elements = new Array();
                var appointmentsPerWeek = new Array();
                var currentDate = viewStart;
                var index = 0;
                while (currentDate < viewEnd) {
                    appointmentsPerWeek[index] = new Array();
                    for (var i = 0; i < allElements.length; i++) {
                        var element = allElements[i];
                        if (currentDate <= element.from && element.to < currentDate.addDays(7)) {
                            element.row = -1;
                            element.rowSpan = 1;
                            if (element.appointment.resourceId == id) {
                                appointmentsPerWeek[index].push(element);
                            }
                        }
                    }
                    index++;
                    currentDate = currentDate.addDays(7);
                }
                for (var i = 0; i < appointmentsPerWeek.length; i++) {
                    if (appointmentsPerWeek[i].length > 0) {
                        var result = this.getMaxMonthAppointments(appointmentsPerWeek[i]);
                        weeks.push((result * (appointmentHeight + 3)) + 22);
                    }
                    else weeks.push("auto");
                }
                return weeks;
            }
        }
    },

    _renderUIMonthAppointments: function (appointments) {
        var viewObject = this._views[this._view];
        var weekAppointments = appointments;
        var viewStart = this.getViewStart();
        var viewEnd = this.getViewEnd();
        var rowsCount = 1;
        var that = this;
        rowsCount = this.getMaxMonthAppointments(appointments);
        var appointmentHeight = that.appointmentsMinHeight;
        if (that.isTouchDevice()) {
            appointmentHeight = that.touchAppointmentsMinHeight;
        }

        if (viewObject.appointmentHeight) {
            appointmentHeight = viewObject.appointmentHeight;
        }

        var sortFunction = this._sortAppointmentsByFrom;
        if (this.rtl) {
            sortFunction = this._sortAppointmentsByTo;
        }

        for (var j = 0; j < appointments.length; j++) {
            var weekAppointment = appointments[j];

            weekAppointment.row = -1;
            var collisionAppointments = this.getCollisionAppointments(weekAppointment, appointments);
            collisionAppointments.sort(sortFunction);
            var currentAppointmentIndex = collisionAppointments.indexOf(weekAppointment);

            if (currentAppointmentIndex >= 0) {
                for (var p = currentAppointmentIndex; p < collisionAppointments.length; p++) {
                    collisionAppointments[p].row = -1;
                }
            }

            // iterate through the collision appointments and set the column.
            for (var m = 0; m < rowsCount; m++) {
                var currentRow = m;

                for (var index in collisionAppointments) {
                    if (index == "indexOf")
                        break;
                    var collisionAppointment = collisionAppointments[index];
                    if (collisionAppointment.row == -1 && !this.isBusyRow(currentRow, collisionAppointments)) {
                        collisionAppointment.row = currentRow;

                        var maxRowsCount = rowsCount;
                        var currentColissions = this.getMaxMonthAppointments(collisionAppointments);
                        if (maxRowsCount > currentColissions) {
                            maxRowsCount = currentColissions;
                        }

                        collisionAppointment.rowsCount = maxRowsCount;
                    }

                }
            }
        }

        for (var m = 0; m < weekAppointments.length; m++) {
            var weekAppointment = weekAppointments[m];
            var collisionAppointments = this.getCollisionAppointments(weekAppointment, weekAppointments);
            collisionAppointments.sort(sortFunction);

            var maxRows = 1;
            for (var index in collisionAppointments) {
                if (index == "indexOf")
                    break;
                var item = collisionAppointments[index];
                maxRows = Math.max(maxRows, item.rowsCount);
            }

            for (var index in collisionAppointments) {
                if (index == "indexOf")
                    break;
                var item = collisionAppointments[index];
                item.rowsCount = maxRows;
            }

            if (collisionAppointments.length == 1) {
                weekAppointment.rowSpan = maxRows;
            }
            else {
                var span = 0;
                var canProceed = true;
                for (var p = weekAppointment.row; p < maxRows; p++) {
                    for (var index in collisionAppointments) {
                        if (index == "indexOf")
                            break;
                        var collisionAppointment = collisionAppointments[index];
                        if (collisionAppointment == weekAppointment)
                            continue;

                        if (collisionAppointment.row == p) {
                            canProceed = false;
                        }
                    }

                    if (!canProceed)
                        break;

                    span++;
                }
                weekAppointment.rowSpan = span;
            }
        }


        for (var x = 0; x < weekAppointments.length; x++) {
            var currentRowHeight = appointmentHeight;
            var weekAppointment = weekAppointments[x];
            weekAppointment.height = currentRowHeight;
            var yLocation = 2 + (3 + currentRowHeight) * weekAppointment.row;
            weekAppointment.y = weekAppointment.y + yLocation;
            weekAppointment.x += 1;
            weekAppointment.width -= 5;
            if (weekAppointment.appointment.from.hour() != 0 || weekAppointment.appointment.to.hour() != 23) {
                if (!that.rtl) {
                    var xOffset = parseFloat(that.cellWidth / 24) * (weekAppointment.appointment.from.hour()) + parseFloat(that.cellWidth / 48) * (weekAppointment.appointment.from.minute() / 30);
                    weekAppointment.timewidth = weekAppointment.width;
                    if (weekAppointment.from.clearTime().toString() == weekAppointment.appointment.from.clearTime().toString()) {
                        weekAppointment.timex = xOffset;
                    }
                    else {
                        xOffset = 0;
                    }

                    if (weekAppointment.appointment.elements.length > 1) {
                        if (weekAppointment.appointment.elements[0] != weekAppointment) {
                            xOffset = 0;
                        }
                    }

                    var wOffset = parseFloat(that.cellWidth / 24) * (weekAppointment.appointment.to.hour()) + parseFloat(that.cellWidth / 48) * (weekAppointment.appointment.to.minute() / 30);

                    if (weekAppointment.appointment.elements.length > 1) {
                        if (weekAppointment.appointment.elements[weekAppointment.appointment.elements.length-1] != weekAppointment) {
                            wOffset = 0;
                        }
                    }

                    weekAppointment.timewidth -= xOffset;
                    if (wOffset > 0) {
                        weekAppointment.timewidth -= that.cellWidth;
                        weekAppointment.timewidth += wOffset;
                    }

                    if (viewObject.appointmentsRenderMode == "exactTime") {
                        if (weekAppointment.from.clearTime().toString() == weekAppointment.appointment.from.clearTime().toString()) {
                            weekAppointment.x += xOffset;
                        }

                        weekAppointment.width = weekAppointment.timewidth;
                        if (weekAppointment.appointment.duration().days() < 1) {
                            if (weekAppointment.width < 15) {
                                weekAppointment.width = 15;
                                if (xOffset + 15 > that.cellWidth) {
                                    var xNegativeOffset = that.cellWidth - xOffset - 15;
                                    weekAppointment.x += xNegativeOffset;
                                }
                            }
                        }
                    }
                }
                else {
                    var xOffset = parseFloat(that.cellWidth / 24) * (weekAppointment.appointment.to.hour()) + parseFloat(that.cellWidth / 48) * (weekAppointment.appointment.to.minute() / 30);              
                    var wOffset = parseFloat(that.cellWidth / 24) * (weekAppointment.appointment.from.hour()) + parseFloat(that.cellWidth / 48) * (weekAppointment.appointment.from.minute() / 30);

                    if (weekAppointment.appointment.elements.length > 1) {
                        if (weekAppointment == weekAppointment.appointment.elements[0]) {
                            if (wOffset > 0) {
                                if (viewObject.appointmentsRenderMode == "exactTime") {
                                    weekAppointment.width -= (that.cellWidth - xOffset);
                                    weekAppointment.width -= wOffset;
                                }
                                else {
                                    weekAppointment.timewidth = weekAppointment.width - that.cellWidth + xOffset - wOffset;
                                }
                            }
                            else {
                                weekAppointment.timewidth = weekAppointment.width;
                                weekAppointment.timex = 0;
                            }
                        }
                        else if (weekAppointment == weekAppointment.appointment.elements[weekAppointment.appointment.elements.length - 1]) {
                            if (viewObject.appointmentsRenderMode == "exactTime") {
                                weekAppointment.x += that.cellWidth;
                                weekAppointment.x -= xOffset;
                                weekAppointment.width += xOffset;
                                weekAppointment.width -= that.cellWidth;
                            }
                            weekAppointment.timewidth = weekAppointment.width - that.cellWidth + xOffset;
                            weekAppointment.timex = that.cellWidth - xOffset;
                        }
                    }
                    else {
                        if (viewObject.appointmentsRenderMode == "exactTime") {
                            weekAppointment.x += that.cellWidth;
                            weekAppointment.x -= xOffset;
                            weekAppointment.width -= (that.cellWidth - xOffset);
                            weekAppointment.width -= wOffset;
                        }
                        if (weekAppointment.appointment.duration().days() < 1) {
                            if (weekAppointment.width < 15) {
                                weekAppointment.width = 15;
                            }
                        }
                        weekAppointment.timewidth = weekAppointment.width - that.cellWidth + xOffset - wOffset;                   
                        weekAppointment.timex = that.cellWidth - xOffset;
                    }
                }
            }
        }

        for (var x = 0; x < weekAppointments.length; x++) {
            var uiappointment = weekAppointments[x];
            var html = "";

            var format = "auto";
            var viewObject = this._views[this._view];
            var from = uiappointment.appointment.from;
            var to = uiappointment.appointment.to;

            var format = "auto";
            var viewObject = this._views[this._view];
            var from = uiappointment.appointment.from;
            var to = uiappointment.appointment.to;

            if (viewObject.timeRuler && viewObject.timeRuler.formatString) {
                format = viewObject.timeRuler.formatString;
            }

            var fromFormat = format;
            var toFormat = format;
            if (format === "auto") {
                if ((from.hour() == 0 && from.minute() == 0) || (from.hour() == 12 && from.minute() == 0)) {
                    var fromFormat = "hh tt";
                }
                else var fromFormat = "hh:mm";
                if ((to.hour() == 0 && to.minute() == 0) || (to.hour() == 12 && to.minute() == 0)) {
                    var toFormat = "hh tt";
                }
                else var toFormat = "hh:mm";
            }

            var formattedFrom = from.toString(fromFormat);
            var formattedTo = to.toString(toFormat);
            var duration = uiappointment.appointment.duration();
            var allDay = uiappointment.appointment.allDay || (duration.hours === 23 && duration.minutes === 59 && duration.seconds === 59);

            var bgColor = uiappointment.appointment.background;
            var title = uiappointment.appointment.subject ? uiappointment.appointment.subject : "(No Title)";
            var color = uiappointment.appointment.color;
            var resourceId = uiappointment.appointment.resourceId;
            var colors = that.getColors(that._resources.indexOf(resourceId));
            var resourceAttribute = " data-resourceId='" + resourceId + "' ";
            var borderColor = uiappointment.appointment.borderColor;
            var location = uiappointment.appointment.location;
            if (location && location.length > 1) {
                location = ", " + location;
            }

            if (!bgColor)
                bgColor = colors.background;
            if (!borderColor)
                borderColor = colors.border;
            if (!color)
                color = colors.color;

            var isRecurrent = uiappointment.appointment.isRecurrentAppointment();
            var isException = uiappointment.appointment.isException();
            var defaultHTML = "";

            // define status
            var statusClass = that.toTP('jqx-scheduler-appointment-status');
            var statusElement = "";
            var status = that.statuses[uiappointment.appointment.status];
            var hasStatus = false;
            if (status) {
                if (status == "transparent") {
                    hasStatus = false;
                }
                else {
                    statusElement = "<div style='background: " + status + "; border-right-color: " + borderColor + "' class='" + statusClass + "'></div>";
                    if (status == "tentative") {
                        statusClass = that.toTP('jqx-scheduler-appointment-status jqx-scheduler-appointment-status-stripes');
                        statusElement = "<div style='background-color: " + borderColor + "; border-right-color: " + borderColor + "' class='" + statusClass + "'></div>";
                    }
                    hasStatus = true;
                }
            }
            var bottomStatusClass = that.toTP('jqx-scheduler-appointment-duration-status');
            var bottomStatus = "<div style='width: " + uiappointment.timewidth + "px; left: " + uiappointment.timex + "px;' class='" + bottomStatusClass + "'></div>";
            if (allDay) bottomStatus = "";
            if (viewObject.appointmentsRenderMode != "exactTimeStatus") {
                bottomStatus = "";
            }

            var rtlStatusElement = "";
            if (that.rtl) {
                var statusClass = that.toTP('jqx-scheduler-appointment-status-rtl jqx-scheduler-appointment-status');
                statusElement = "<div style='background: " + status + "; border-left-color: " + borderColor + "' class='" + statusClass + "'></div>";
                if (status == "tentative") {
                    statusClass = that.toTP('jqx-scheduler-appointment-status-rtl jqx-scheduler-appointment-status jqx-scheduler-appointment-status-stripes');
                    statusElement = "<div style='background-color: " + borderColor + "; border-left-color: " + borderColor + "' class='" + statusClass + "'></div>";
                }

                rtlStatusElement = statusElement;
                statusElement = "";
            }

            var customCSSClass = "";
            var defaultContent = title + location;
            if (!allDay) {
                defaultContent = title + location + bottomStatus;
            }
            if (that.renderAppointment) {
                var appointmentFormatData = that.renderAppointment({ appointment: uiappointment.appointment.boundAppointment, textColor: color, background: bgColor, borderColor: borderColor, html: defaultContent, cssClass: "", style: "", width: uiappointment.width, height: uiappointment.height, view: that._views[that._view].type });
                if (appointmentFormatData) {
                    var html = appointmentFormatData.html;
                    if (html != defaultContent) {
                        defaultContent = html;
                    }

                    color = appointmentFormatData.textColor;
                    bgColor = appointmentFormatData.background;
                    borderColor = appointmentFormatData.borderColor;
                    if (appointmentFormatData.cssClass) {
                        customCSSClass = appointmentFormatData.cssClass + " ";
                    }
                    if (appointmentFormatData.style != "") {
                        var colors = that.getAppointmentColors(appointmentFormatData.style);
                        bgColor = colors.background;
                        borderColor = colors.border;
                        color = colors.color;
                    }
                }
            }

            // end status.
            if (defaultHTML === "") {
                if (hasStatus) {
                    var defaultHTML = "<div style='white-space:nowrap;' class='" + that.toTP('jqx-scheduler-appointment-content') + "'>" + statusElement + "<div class='" + that.toTP('jqx-scheduler-appointment-inner-content') + "'>" + defaultContent + "</div>" + rtlStatusElement + "</div>";
                }
                else {
                    var defaultHTML = "<div style='white-space:nowrap;' class='" + that.toTP('jqx-scheduler-appointment-content') + "'><div class='" + that.toTP('jqx-scheduler-appointment-inner-content') + "'>" + defaultContent + "</div></div>";
                }
            }


            var rtlClass = "";
            if (that.rtl) {
                rtlClass = that.toTP('jqx-rtl jqx-scheduler-appointment-rtl') + " ";
            }

            if (isException) {
                var exceptionClass = color.toLowerCase() == "white" ? that.toTP('jqx-icon-recurrence-exception-white') : that.toTP('jqx-icon-recurrence-exception');
                html = "<div data-key='" + uiappointment.appointment.id + "'" + resourceAttribute + "class='" + rtlClass + customCSSClass + that.toTP('jqx-scheduler-appointment jqx-rc-all') + "' style='position:absolute; z-index: 399; left: " + uiappointment.x + "px; top: " + uiappointment.y + "px; width: " + uiappointment.width + "px; line-height: " + uiappointment.height + "px; height: " + uiappointment.height + "px; border-color:" + borderColor + "; color:" + color + "; background:" + bgColor + ";'><div class='" + exceptionClass + "'></div>" + defaultHTML + "<div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-left-resize-indicator") + "'></div><div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-right-resize-indicator") + "'></div>";
            }
            else if (isRecurrent) {
                var recurrenceClass = color.toLowerCase() == "white" ? that.toTP('jqx-icon-recurrence-white') : that.toTP('jqx-icon-recurrence');
                html = "<div data-key='" + uiappointment.appointment.id + "'" + resourceAttribute + "class='" + rtlClass + customCSSClass + that.toTP('jqx-scheduler-appointment jqx-rc-all') + "' style='position:absolute; z-index: 399; left: " + uiappointment.x + "px; top: " + uiappointment.y + "px; width: " + uiappointment.width + "px; line-height: " + uiappointment.height + "px; height: " + uiappointment.height + "px; border-color:" + borderColor + "; color:" + color + "; background:" + bgColor + ";'><div class='" + recurrenceClass + "'></div>" + defaultHTML + "<div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-left-resize-indicator") + "'></div><div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-right-resize-indicator") + "'></div>";
            }
            else {
                html = "<div data-key='" + uiappointment.appointment.id + "'" + resourceAttribute + "class='" + rtlClass + customCSSClass + that.toTP('jqx-scheduler-appointment jqx-rc-all') + "' style='position:absolute; z-index: 399; left: " + uiappointment.x + "px; top: " + uiappointment.y + "px; width: " + uiappointment.width + "px; line-height: " + uiappointment.height + "px; height: " + uiappointment.height + "px; border-color:" + borderColor + "; color:" + color + "; background:" + bgColor + ";'>" + defaultHTML + "<div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-left-resize-indicator") + "'></div><div class='" + that.toTP("jqx-scheduler-appointment-resize-indicator jqx-scheduler-appointment-right-resize-indicator") + "'></div>";
            }

            var $appointment = $(html);
            $appointment.appendTo(this.table);
            uiappointment.element = $appointment;
            if (this.appointmentTooltips) {
                if (!uiappointment.appointment.tooltip) {
                    var tooltip = uiappointment.appointment.subject;
                    if (formattedFrom && !allDay) {
                        tooltip = formattedFrom + " - " + formattedTo + " " + tooltip;
                    }

                    if (tooltip) {
                        var location = uiappointment.appointment.location;
                        if (location) tooltip += "\n" + location;
                        $appointment[0].setAttribute('title', tooltip);
                    }
                }
                else {
                    $appointment[0].setAttribute('title', uiappointment.appointment.tooltip);
                }
            }
            var outOfBounds = false;
            $.each(uiappointment.cells, function () {
                var cell = $(this.cell);
                var position = cell.position();
                if (!cell[0].appointments) {
                    cell[0].appointments = new Array();
                }

                cell[0].appointments.push({ ui: $appointment, appointment: uiappointment });

                if (uiappointment.y + uiappointment.height + 2 >= position.top + cell.height()) {
                    $appointment.css('visibility', 'hidden');
                    var arrow = cell.find('.jqx-icon-arrow-down');
                    arrow.show();
                    if (arrow[0]) {
                        arrow[0].mousedown = function () {
                            if (that.openedMonthCellPopup) that.openedMonthCellPopup.remove();
                            var popup = $("<div></div>");

                            var header = cell.find('div').clone(true);
                            header.find('span').removeClass().addClass(that.toTP('jqx-icon-close'));
                            header.find('span')[0].mousedown = function () {
                                popup.remove();
                            }
                            header.addClass(that.toTP('jqx-widget-header'));
                            popup.addClass(that.toTP('jqx-widget'));
                            popup.addClass(that.toTP('jqx-window'));
                            popup.addClass(that.toTP('jqx-scheduler-month-cell-popup'));
                            popup.addClass(that.toTP('jqx-popup'));
                            var content = $("<div></div>");
                            popup.append(header);
                            popup.append(content);
                            content.addClass(that.toTP('jqx-widget-content jqx-disableselect'));
                            var width = cell.width();
                            var height = 5 + cell.find('div').outerHeight();
                            for (var i = 0; i < cell[0].appointments.length; i++) {
                                var app = cell[0].appointments[i].ui.clone(true);
                                app.css('left', '3px');
                                app.css('top', '0px');
                                app.css('margin-top', '2px');
                                app.css('position', 'relative');
                                app.css('visibility', 'visible');
                                app.width(width - 6);
                                height += app.outerHeight() + 4;
                                content.append(app);
                                app.click(function (event)
                                {
                                    var appJQX = that.getJQXAppointmentByElement(that.getAppointmentElement(event.target));
                                    that._raiseEvent('appointmentClick', { appointment: appJQX.boundAppointment });
                                });
                                app.dblclick(function (event)
                                {
                                    var appJQX = that.getJQXAppointmentByElement(that.getAppointmentElement(event.target));

                                    if (!appJQX.readOnly && !that.editRecurrenceDialog.jqxWindow('isOpen') && (!that._editDialog || (that._editDialog && !that._editDialog.jqxWindow('isOpen'))))
                                    {
                                        var result = that._initDialog(appJQX);
                                        if (result !== false)
                                        {
                                            that._openDialog();
                                        }
                                    }

                                    that._raiseEvent('appointmentDoubleClick', { appointment: appJQX.boundAppointment });
                                });
                            }
                            popup.css('overflow', 'hidden');
                            popup.css('position', 'absolute');
                            popup.height(height);
                            popup.width(width);
                            popup.css('z-index', '9999');
                            popup.css('top', position.top);
                            popup.css('left', position.left);

                            that.table.append(popup);
                            that.openedMonthCellPopup = popup;
                        }
                    }
                }
            });
        }
    },

    _sortByDate: function (x, y) {
        var date1 = x.getAttribute('data-date');
        date1 = this._getDateByString(date1);

        var date2 = y.getAttribute('data-date');
        date2 = this._getDateByString(date2);

        if (date1 < date2)
            return -1;
        if (date1 > date2)
            return 1;
        if (date1 == date2)
            return 0;
    },

    _sortAppointmentsByFrom: function (x, y) {
        if (x.from.equals(y.from)) {
            var milliseconds = x.to - x.from;
            var ticks = milliseconds * 10000;
            var milliseconds = y.to - y.from;
            var ticks2 = milliseconds * 10000;
            if (ticks > ticks2) {
                return -1;
            }

        }

        if (x.from < y.from)
            return -1;
        if (x.from > y.from)
            return 1;
        if (x.from == y.from)
            return 0;
    },

    _sortAppointmentsByTo: function (x, y) {
        if (x.to.equals(y.to)) {
            var milliseconds = x.to - x.from;
            var ticks = milliseconds * 10000;
            var milliseconds = y.to - y.from;
            var ticks2 = milliseconds * 10000;
            if (ticks > ticks2) {
                return -1;
            }
        }

        if (x.to < y.to)
            return -1;
        if (x.to > y.to)
            return 1;
        if (x.to == y.to)
            return 0;
    },

    _sortAppointmentsByResourceId: function (x, y, that) {
        var resourceIndex1 = that._resources.indexOf(x.resourceId);
        var resourceIndex2 = that._resources.indexOf(y.resourceId);

        if (resourceIndex1 == resourceIndex2) {
            return 0;
        }
        if (resourceIndex1 < resourceIndex2)
            return -1;
        if (resourceIndex1 > resourceIndex2)
            return -1;
    },

    isBusyRow: function (row, appointments) {
        for (var i = 0; i < appointments.length; i++) {
            var appointment = appointments[i];
            if (appointment.row == row) {
                return true;
            }

        }
        return false;
    },

    isBusyColumn: function (column, appointments) {
        for (var i = 0; i < appointments.length; i++) {
            var appointment = appointments[i];
            if (appointment.column == column) {
                return true;
            }

        }
        return false;
    },

    getMaxTimelineAppointments: function (appointments, cacheAppointments, viewStart, viewEnd) {
        if (appointments.length == 0)
            return 1;
        var that = this;
        var viewType = that._views[that._view].type;
        var viewObject = that._views[that._view];
        var rows = 1;
        var fromDate = viewStart;
        var toDate = viewEnd;
        var minutes = this.getMinutesPerScale();
        var min = null;
        var max = null;
        var key = "";
        for (var index in appointments) {
            if (index == "indexOf")
                break;

            var appointment = appointments[index];
            if (!min) min = appointment.from;
            if (!max) max = appointment.to;
            min = Math.min(appointment.from, min);
            max = Math.max(appointment.to, max);
            key += appointment.appointment.id;
        }
        key += min;
        key += max;
        if (cacheAppointments[key])
            return cacheAppointments[key];

        min = new $.jqx.date(min, that.timeZone);
        max = new $.jqx.date(max, that.timeZone);
        var fromDate = min;

        while (min < max) {
            var from = fromDate;
            if (viewType === "timelineMonthView") {
                var to = from.addDays(1);
            }
            else {
                var to = from.addMinutes(minutes);
            }
            var currentPeriodIntersections = 0;
            for (var index in appointments) {
                if (index == "indexOf")
                    break;

                var appointment = appointments[index];
                var from2 = appointment.from;
                var to2 = appointment.to;
                var result = $.jqx.scheduler.utilities.rangeIntersection(from, to, from2, to2);
                if (result) {
                    currentPeriodIntersections++;
                }
            }

            rows = Math.max(currentPeriodIntersections, rows);
            if (viewType === "timelineMonthView") {
                fromDate = fromDate.addDays(1, false);
            }
            else {
                fromDate = fromDate.addMinutes(minutes, false);
            }
        }
        cacheAppointments[key] = rows;
        return rows;
    },

    getMaxMonthAppointments: function (appointments) {
        var view = this._views[this._view].type;
        var viewObject = this._views[this._view];

        if (appointments.length == 0)
            return 1;

        var rows = 1;
        var fromDate = this.getViewStart().clone();
        var toDate = this.getViewEnd();

        while (fromDate < toDate) {
            var from = fromDate;
            var to = $.jqx.scheduler.utilities.getEndOfDay(from);
            var currentPeriodIntersections = 0;
            for (var index in appointments) {
                if (index == "indexOf")
                    break;

                var appointment = appointments[index];
                var from2 = appointment.from;
                var to2 = appointment.to;
                var result = $.jqx.scheduler.utilities.rangeIntersection(from, to, from2, to2);
                if (result) {
                    currentPeriodIntersections++;
                }
            }

            rows = Math.max(currentPeriodIntersections, rows);

            fromDate = fromDate.addDays(1, false);
        }

        return rows;
    },

    getMaxAllDayAppointments: function (uiappointments) {
        var view = this._views[this._view].type;
        var viewObject = this._views[this._view];
        var that = this;
        if (uiappointments.length == 0)
            return 1;

        var getRows = function (appointments) {

            var rows = 1;
            var fromDate = that.getViewStart();
            var toDate = that.getViewEnd();

            while (fromDate < toDate) {
                var from = fromDate;
                var to = $.jqx.scheduler.utilities.getEndOfDay(from);
                var currentPeriodIntersections = 0;
                for (var index in appointments) {
                    if (index == "indexOf")
                        break;

                    var appointment = appointments[index];
                    var jqxAppointment = appointment;
                    if (appointment.appointment) {
                        jqxAppointment = appointment.appointment;
                    }
                    if (jqxAppointment.hidden == true) {
                        continue;
                    }

                    if (!jqxAppointment.duration)
                        continue;
                    if (jqxAppointment.allDay || jqxAppointment.duration().days() >= 1) {
                        var from2 = appointment.from;
                        var to2 = appointment.to;
                        var result = $.jqx.scheduler.utilities.rangeIntersection(from, to, from2, to2);
                        if (result) {
                            currentPeriodIntersections++;
                        }
                    }
                }

                rows = Math.max(currentPeriodIntersections, rows);

                fromDate = fromDate.addDays(1, false);
            }
            return rows;
        }

        if (this._resources.length < 2 || (!this.resources.orientation || this.resources.orientation == "none")) {
            var rows = getRows(uiappointments);
        }
        else {
            var maxRows = 1;
            for (var j = 0; j < this._resources.length; j++) {
                var id = this._resources[j];
                var appointments = new Array();
                for (var i = 0; i < uiappointments.length; i++) {
                    if (uiappointments[i].appointment && uiappointments[i].appointment.resourceId == id) {
                        appointments.push(uiappointments[i]);
                    }
                    else if (uiappointments[i].resourceId != undefined && uiappointments[i].resourceId == id) {
                        appointments.push(uiappointments[i]);
                    }
                }
                var rows = getRows(appointments);
                maxRows = Math.max(maxRows, rows);
            }
            rows = maxRows;
        }

        return rows;
    },

    getMinutesPerScale: function () {
        var view = this._views[this._view].type;
        var viewObject = this._views[this._view];
        var minutes = 30;
        var scale = "halfHour";
        if (viewObject.timeRuler && viewObject.timeRuler.scale) {
            scale = viewObject.timeRuler.scale;
        }
         
        switch (scale) {
            case 'sixtyMinutes':
            case 'hour':
                minutes = 60;
                break;
            case 'thirtyMinutes':
            case 'halfHour':
                minutes = 30;
                break;
            case 'fifteenMinutes':
            case 'quarterHour':
                minutes = 15;
                break;
            case 'tenMinutes':
                minutes = 10;
                break;
            case 'fiveMinutes':
                minutes = 5;
                break;
        }
        return minutes;
    },

    getMaxColumnsInADay: function (appointments) {
        var view = this._views[this._view].type;
        var viewObject = this._views[this._view];
        var minutes = 30;
        var scale = "halfHour";
        if (viewObject.timeRuler && viewObject.timeRuler.scale) {
            scale = viewObject.timeRuler.scale;
        }

        switch (scale) {
            case 'sixtyMinutes':
            case 'hour':
                minutes = 60;
                break;
            case 'thirtyMinutes':
            case 'halfHour':
                minutes = 30;
                break;
            case 'fifteenMinutes':
            case 'quarterHour':
                minutes = 15;
                break;
            case 'tenMinutes':
                minutes = 10;
                break;
            case 'fiveMinutes':
                minutes = 5;
                break;
        }

        if (appointments.length == 0)
            return 1;

        var columns = 1;
        var fromDate = appointments[0].from.clone();
        var toDate = fromDate.addMinutes(minutes);
        var endOfDay = $.jqx.scheduler.utilities.getEndOfDay(fromDate);

        while (fromDate < endOfDay) {
            var from = fromDate;
            var to = toDate;
            var currentPeriodIntersections = 0;
            for (var index in appointments) {
                if (index == "indexOf")
                    break;

                var appointment = appointments[index];
                if (!appointment.from && !appointment.to)
                    continue;

                var from2 = appointment.from;
                var to2 = appointment.to;
                var result = $.jqx.scheduler.utilities.rangeIntersection(from, to, from2, to2);
                if (result) {
                    currentPeriodIntersections++;
                }
            }

            columns = Math.max(currentPeriodIntersections, columns);

            fromDate = fromDate.addMinutes(minutes, false);
            toDate = toDate.addMinutes(minutes, false);
        }

        return columns;
    },

    getTouches: function (e) {
        return $.jqx.mobile.getTouches(e);
    },

    _updatecolumnwidths: function () {
        var that = this;
        var totalwidth = this._hostWidth;
        var hostwidth = totalwidth;
        if (this.vScrollBar.css('visibility') !== "hidden" && this.scrollBarSize > 0) {
            totalwidth -= parseInt(this.scrollBarSize) + 6;
            if (this.rtl) {
                totalwidth += 3; 
            }
            hostwidth = totalwidth;
        }

        var allcharacters = '';
        if (this.columns == undefined || this.columns.records == undefined)
            return;

        var that = this;
        var requiresRowsRender = false;
        var totalWidthColumns = new Array();
        $.each(this.columns.records, function (i, value) {
            if (!(this.hidden)) {
                if (this.width.toString().indexOf('%') != -1 || this._percentagewidth != undefined) {
                    var value = 0;
                    var offset = that.vScrollBar[0].style.visibility == 'hidden' ? 0 : that.scrollBarSize + 5;
                    if (that.scrollBarSize == 0)
                        offset = 0;
                    value = parseFloat(this.width) * hostwidth / 100;
                    if (this._percentagewidth != undefined) {
                        value = parseFloat(this._percentagewidth) * (hostwidth) / 100;
                    }

                    if (value < this.minwidth && this.minwidth != 'auto') value = this.minwidth;
                    if (value > this.maxwidth && this.maxwidth != 'auto') value = this.maxwidth;
                    totalwidth -= Math.round(value);
                }
                else if (this.width != 'auto' && !this._width) {
                    totalwidth -= this.width;
                }
                else {
                    allcharacters += this.text;
                }
                if (this._width == "auto") {
                    totalWidthColumns[totalWidthColumns.length] = this;
                }
            }
        });

        var columnheader = this.columnsheader.find('#columntable' + this.element.id);
        if (columnheader.length == 0)
            return;

        var totalOffset = 0;
        var columns = columnheader.find('.jqx-grid-column-header');
        var left = 0;

        $.each(this.columns.records, function (i, value) {
            var column = this.element;
            var percentage = false;
            var desiredwidth = this.width;
            var oldwidth = this.width;
            if (this.width.toString().indexOf('%') != -1 || this._percentagewidth != undefined) {
                if (this._percentagewidth != undefined) {
                    desiredwidth = parseFloat(this._percentagewidth) * hostwidth / 100;
                }
                else {
                    desiredwidth = parseFloat(this.width) * hostwidth / 100;
                }
                desiredwidth = Math.round(desiredwidth);
                percentage = true;
            }

            if (this.width != 'auto' && !this._width && !percentage) {
                if (parseInt(column[0].style.width) != this.width) {
                    column.width(this.width);
                }
            }
            else if (percentage) {
                if (desiredwidth < this.minwidth && this.minwidth != 'auto') {
                    desiredwidth = this.minwidth;
                    this.width = desiredwidth;
                }
                if (desiredwidth > this.maxwidth && this.maxwidth != 'auto') {
                    desiredwidth = this.maxwidth;
                    this.width = desiredwidth;
                }

                if (parseInt(column[0].style.width) != desiredwidth) {
                    column.width(desiredwidth);
                    this.width = desiredwidth;
                }
            }
            else {
                var columnsCount = that.columns.records.length;
                var viewType = that._views[that._view].type;
                if (viewType === "dayView" || viewType === "weekView") {
                    var vw = that._views[that._view];
                    if (vw.timeRuler) {
                        if (vw.timeRuler.timeZones) {
                            columnsCount -= vw.timeRuler.timeZones.length;
                        }
                        columnsCount--;
                    }
                    else {
                        columnsCount--;
                    }
                }
                else if (viewType === "monthView" && that._views[that._view].showWeekNumbers) {
                    columnsCount--;
                }

                var width = Math.floor(totalwidth * (1 / columnsCount));
                if (that.resources && that.resources.resourceColumnWidth && that.resources.resourceColumnWidth != "auto") {
                    width = that.resources.resourceColumnWidth;
                }
                else if (that.resources && that.resources.resourceColumnWidth && that.resources.resourceColumnWidth == "auto") {
                    if (that.resources.orientation == "horizontal") {
                        width = Math.round((2 + totalwidth) * (1 / that._getColumnsLengthPerView()));
                    }
                }
                var diff = (totalwidth * (1 / columnsCount)) - width;
                totalOffset += diff;
                if (totalOffset >= 1) {
                    totalOffset -= 1;
                    width++;
                }
                if (totalOffset >= 0.5 && i == that.columns.records.length - 1) {
                    width++;
                }

                if (viewType == "agendaView") {
                    width = totalwidth / totalWidthColumns.length;
                    width++;
                }

                if (width < 0) {
                    var $element = $('<span>' + this.text + '</span>');
                    $(document.body).append($element);
                    width = 10 + $element.width();
                    $element.remove();
                }
                if (width < this.minwidth)
                    width = this.minwidth;
                if (width > this.maxwidth) {
                    width = this.maxwidth;
                }

                this._width = 'auto';
                this.width = parseInt(width);
                column.width(this.width);
            }
            if (parseInt(column[0].style.left) != left) {
                column.css('left', left);
            }

            if (!(this.hidden)) {
                left += this.width;
            }

            this._requirewidthupdate = true;
            if (oldwidth !== this.width) {
                requiresRowsRender = true;
            }
        });

        this.columnsheader.width(2 + left);
        columnheader.width(this.columnsheader.width());

        this._resizecolumnGroups();
   
        if (requiresRowsRender) {
            this._renderrows();
            that._arrange();
        }
    },

    _rendercolumnheaders: function () {
        var that = this;
        if (this._updating) {
            return;
        }

        var viewObject = this._views[this._view];
        this._columnsbydatafield = new Array();
        this.columnsheader.find('#columntable' + this.element.id).remove();
        var columnheader = $('<div id="columntable' + this.element.id + '" style="height: 100%; position: relative;"></div>')
        columnheader[0].cells = new Array();

        var k = 0;
        var left = 0;

        var allcharacters = "";
        var hWidth = this._hostWidth;
        if (!hWidth) {
            this._hostWidth = this.host.width();
        }

        var totalwidth = this._hostWidth;
        var hostwidth = totalwidth;

        var pageSize = this.getRows().length;
        var defaultRowHeight = this.rowsHeight;
        if (this.isTouchDevice()) {
            defaultRowHeight = this.touchRowsHeight;
        }

        if (pageSize * defaultRowHeight > this.host.height()) {
            this.vScrollBar[0].style.visibility = "inherit";
        }

        if (this.vScrollBar.css('visibility') !== "hidden" && this.scrollBarSize > 0) {
            totalwidth -= parseInt(this.scrollBarSize) + 6;
            if (this.rtl) {
                totalwidth += 3;
            }
          
            hostwidth = totalwidth;
        }
        var normalcolumns = new Array();
        var totalWidthColumns = new Array();
        $.each(this.columns.records, function (i, value) {
            if (!(this.hidden)) {
                if (this.width != 'auto' && !this._width) {
                    if (this.width < this.minwidth && this.minwidth != 'auto') {
                        totalwidth -= this.minwidth;
                    }
                    else if (this.width > this.maxwidth && this.maxwidth != 'auto') {
                        totalwidth -= this.maxwidth;
                    }
                    else if (this.width.toString().indexOf('%') != -1) {
                        var value = 0;
                        value = parseFloat(this.width) * hostwidth / 100;
                        if (value < this.minwidth && this.minwidth != 'auto') value = this.minwidth;
                        if (value > this.maxwidth && this.maxwidth != 'auto') value = this.maxwidth;
                        totalwidth -= value;
                    }
                    else {
                        if (typeof this.width == 'string') this.width = parseInt(this.width);
                        totalwidth -= this.width;
                    }
                }
                else {
                    allcharacters += this.text;
                }
            }
            if (this.width == null || this.width == "auto") {
                totalWidthColumns[totalWidthColumns.length] = this;
            }

            normalcolumns[normalcolumns.length] = this;
        });

        if (this.rtl) {
            for (var j = 0; j < normalcolumns.length; j++) {
                this.columns.replace(j, normalcolumns[j]);
            }
        }

        var zindex = this.headerZIndex;
        var groupslength = 0;

        var headerheight = that.columnsHeight;
        var getcolumnheight = function (datafield, column) {
            var height = that.columnGroupslevel * that.columnsHeight;
            height = height - (column.level * that.columnsHeight);
            return height;
        }
        var totalOffset = 0;
        var frag = document.createDocumentFragment();
        $.each(this.columns.records, function (i, value) {
            this.height = that.columnsHeight;
            if (that.columnGroups) {
                if (that.columnGroups.length) {
                    this.height = getcolumnheight(this.datafield, this);
                    headerheight = this.height;
                }
            }
            var classname = that.toTP('jqx-grid-column-header') + " " + that.toTP('jqx-widget-header');
            if (that.rtl) {
                classname += " " + that.toTP('jqx-grid-column-header-rtl');
            }

            if (!that.enableBrowserSelection) {
                classname += " " + that.toTP('jqx-disableselect');
            }
            var columnZIndex = !that.rtl ? zindex-- : zindex++;

            var col = document.createElement("div");
            col.setAttribute('role', 'columnheader');
            col.style.position = "absolute";
            col.style.zIndex = columnZIndex;
            col.style.height = "100%";
            col.className = classname;
            var column = $(col);
            if (that.rtl && i === 0) {
                column[0].style.borderLeftColor = "transparent";
            }

            if (that.columnGroups) {
                column[0].style.height = headerheight + 'px';
                column[0].style.bottom = '0px';
            }
            else if (!this.timeColumn) {
                column[0].style.height = -1 + headerheight + 'px';
            }

            this.uielement = column;
            this.element = column;
            if (this.classname != '' && this.classname) {
                column.addClass(this.classname);
            }

            var desiredwidth = this.width;
            var percentage = false;
            if (this.width === null) {
                this.width = "auto";
            }

            if (this.width.toString().indexOf('%') != -1 || this._percentagewidth != undefined) {
                if (this._percentagewidth != undefined) {
                    desiredwidth = parseFloat(this._percentagewidth) * hostwidth / 100;
                }
                else {
                    desiredwidth = parseFloat(this.width) * hostwidth / 100;
                }
                desiredwidth = Math.round(desiredwidth);
                percentage = true;
            }

            if (this.width != 'auto' && !this._width && !percentage) {
                if (desiredwidth < this.minwidth && this.minwidth != 'auto') {
                    desiredwidth = this.minwidth;
                }
                if (desiredwidth > this.maxwidth && this.maxwidth != 'auto') {
                    desiredwidth = this.maxwidth;
                }

                column[0].style.width = parseInt(desiredwidth) + 'px';
            }
            else if (percentage) {
                if (desiredwidth < this.minwidth && this.minwidth != 'auto') {
                    desiredwidth = this.minwidth;
                }
                if (desiredwidth > this.maxwidth && this.maxwidth != 'auto') {
                    desiredwidth = this.maxwidth;
                }

                if (this._percentagewidth == undefined || this.width.toString().indexOf('%') != -1) {
                    this._percentagewidth = this.width;
                }
                column.width(desiredwidth);
                this.width = desiredwidth;
            }
            else {
                var columnsCount = that.columns.records.length;

                var viewType = that._views[that._view].type;
                if (viewType === "dayView" || viewType === "weekView") {
                    var vw = that._views[that._view];
                    if (vw.timeRuler) {
                        if (vw.timeRuler.timeZones) {
                            columnsCount -= vw.timeRuler.timeZones.length;
                        }
                        columnsCount--;
                    }
                    else {
                        columnsCount--;
                    }
                }
                else if (viewType === "monthView" && that._views[that._view].showWeekNumbers) {
                    columnsCount--;
                }

                var width = Math.floor(totalwidth * (1 / columnsCount));
                if (that.resources && that.resources.resourceColumnWidth && that.resources.resourceColumnWidth != "auto") {
                    width = that.resources.resourceColumnWidth;
                }
                else if (that.resources && that.resources.resourceColumnWidth && that.resources.resourceColumnWidth == "auto") {
                    if (that.resources.orientation == "horizontal") {
                        width = Math.round((2 + totalwidth) * (1 / that._getColumnsLengthPerView()));
                    }
                }

                var diff = (totalwidth * (1 / columnsCount)) - width;
                totalOffset += diff;
                if (totalOffset >= 1) {
                    totalOffset -= 1;
                    width++;
                }
                if (totalOffset >= 0.5 && i == that.columns.records.length - 1) {
                    width++;
                }

                if (isNaN(width)) {
                    width = this.minwidth;
                }

                if (viewType == "agendaView") {
                    width = totalwidth / totalWidthColumns.length;
                    width++;
                }

                if (width < 0) {
                    $element = $('<span>' + this.text + '</span>');
                    $(document.body).append($element);
                    width = 10 + $element.width();
                    $element.remove();
                }
                if (width < this.minwidth)
                    width = this.minwidth;
                if (width > this.maxwidth) {
                    width = this.maxwidth;
                }

                this._width = 'auto';
                this.width = parseInt(width);
                desiredwidth = this.width;
                column.width(this.width);
            }

            if (this.timeColumn) {
                column.css('border-bottom-color', 'transparent');

                if (viewObject.timeRuler && viewObject.timeRuler.timeZones) {
                    if (i < viewObject.timeRuler.timeZones.length) {
                        column.css('border-right-color', 'transparent');
                    }
                }

                if (this.tableRows == 1) {
                    column.addClass(that.toTP("jqx-scheduler-time-column"));
                }
            }

            if (this.hidden) {
                column.css('display', 'none');
            }

            var columncontentcontainer = $(column.children()[0]);
            columnheader[0].cells[i] = column[0];

            var columnContent = that._rendercolumnheader(this.text, this.align, headerheight, that);

            column[0].innerHTML = columnContent;

            frag.appendChild(column[0]);

            var columnitem = this;
            column[0].style.left = left + "px";

            if (!(this.hidden)) {
                left += desiredwidth;
            }
        });

        columnheader[0].appendChild(frag);
        if (left > 0) {
            this.columnsheader[0].style.width = 2 + left + "px";
        }
        else {
            this.columnsheader[0].style.width = left + "px";
        }

        this._columnswidth = left;
        this.columnsrow = columnheader;
        that.columnsheader.append(columnheader);
        columnheader[0].style.width = left + "px";

        if (this.columnGroups) {
            this._rendercolumnGroups();
        }
    },

    _rendercolumnGroups: function () {
        if (!this.columnGroups) return;

        var zindex = this.headerZIndex + this.columns.records.length;
        var that = this;
        var classname = that.toTP('jqx-grid-column-header') + " " + that.toTP('jqx-grid-columngroup-header') + " " + that.toTP('jqx-widget-header');
        if (that.rtl) {
            classname += " " + that.toTP('jqx-grid-columngroup-header-rtl');
        }
        var columnheader = this.columnsheader.find('#columntable' + this.element.id);
        columnheader.find('jqx-grid-columngroup-header').remove();

        for (var j = 0; j < this.columnGroupslevel - 1; j++) {
            for (var i = 0; i < this.columnGroups.length; i++) {
                var group = this.columnGroups[i];
                var level = group.level;
                if (level !== j)
                    continue;

                var top = level * this.columnsHeight;
                var left = 99999;
                if (group.groups) {
                    var getwidth = function (group) {
                        var width = 0;
                        for (var j = 0; j < group.groups.length; j++) {
                            var currentgroup = group.groups[j];
                            if (!currentgroup.groups) {
                                if (!currentgroup.hidden) {
                                    width += currentgroup.width;
                                    left = Math.min(parseInt(currentgroup.element[0].style.left), left);
                                }
                            }
                            else {
                                width += getwidth(currentgroup);
                            }
                        }
                        return width;
                    }
                    group.width = getwidth(group);
                    group.left = left;

                    var height = this.columnsHeight;
                    var columnZIndex = zindex--;
                    var column = $('<div role="columnheader" style="z-index: ' + columnZIndex + ';position: absolute;" class="' + classname + '"></div>');
                    var element = $(this._rendercolumnheader(group.text, group.align, this.columnsHeight, this));
                    if (group.renderer) {
                        group.renderer(column, group.text);
                    }
                    column.append(element);
                    column[0].style.left = left + 'px';
                    if (left === 0) {
                        column[0].style.borderLeftColor = 'transparent';
                    }
                    column[0].style.top = top + 'px';
                    column[0].style.height = height + 'px';
                    column[0].style.width = -1 + group.width + 'px';
                    columnheader.append(column);
                    group.element = column;
                }
            }
        }
    },

    _resizecolumnGroups: function () {
        if (!this.columnGroups) return;
        for (var i = 0; i < this.columnGroups.length; i++) {
            var group = this.columnGroups[i];
            var level = group.level;
            var top = level * this.columnsHeight;
            var left = 99999;
            if (group.groups) {
                var getwidth = function (group) {
                    var width = 0;
                    for (var j = 0; j < group.groups.length; j++) {
                        var currentgroup = group.groups[j];
                        if (!currentgroup.groups) {
                            width += currentgroup.width;
                            left = Math.min(parseInt(currentgroup.element[0].style.left), left);
                        }
                        else {
                            width += getwidth(currentgroup);
                        }
                    }
                    return width;
                }
                group.width = getwidth(group);
                group.left = left;

                var height = this.columnsHeight;
                var column = group.element;
                column[0].style.left = left + 'px';
                column[0].style.top = top + 'px';
                column[0].style.height = height + 'px';
                column[0].style.width = -1 + group.width + 'px';
            }
        }
    },

    _removecolumnhandlers: function (columnitem) {
        var that = this;
        var column = $(columnitem.element);
        if (column.length > 0) {
            that.removeHandler(column, 'mouseenter');
            that.removeHandler(column, 'mouseleave');
            var $filtericon = $(columnitem.filtericon);
            that.removeHandler($filtericon, 'mousedown');
            that.removeHandler($filtericon, 'click');
            that.removeHandler(column, 'click');
        }
    },

    destroy: function () {
        var that = this;
      
        that._removeHandlers();
        if (that._editDialog) {
            that._editDialog.jqxWindow('destroy');
        }

        if (that.menu) {
            that.menu.jqxMenu('destroy');
        }
        if (that.editRecurrenceDialog) {
            that.editRecurrenceDialog.jqxWindow('destroy');
        }
        that.vScrollBar.jqxScrollBar('destroy');
        that.hScrollBar.jqxScrollBar('destroy');
        delete that.vScrollBar;
        delete that.hScrollBar;
        delete that._mousewheelfunc;
        $.jqx.utilities.resize(that.host, null, true);
        that.host.remove();
    },


    propertiesChangedHandler: function (object, oldValues, newValues)
    {
        if (newValues && newValues.width && newValues.height && Object.keys(newValues).length == 2)
        {
            object.host.height(object.height);
            object.host.width(object.width);
            object._updatesize(false, true);
        }
    },

    propertyChangedHandler: function (object, key, oldvalue, value) {
        if (this.isInitialized == undefined || this.isInitialized == false)
            return;

        if (object.batchUpdate && object.batchUpdate.width && object.batchUpdate.height && Object.keys(object.batchUpdate).length == 2)
        {
            return;
        }

        if (value !== oldvalue) {
            if (key == "filterable") {
                object._render();
            }
            else if (key == "view")
            {
                object.setView(value);
            }
            else if (key == "views")
            {
                object._columns = null;
                object._views = new Array();
                object._view = object.view;

                for (var i = 0; i < object.views.length; i++)
                {
                    if ($.type(object.views[i]) === "string")
                    {
                        object._views.push({ type: object.views[i] });
                    }
                    else
                    {
                        object._views.push(object.views[i]);
                    }
                }

                for (var i = 0; i < object._views.length; i++)
                {
                    if (object._views[i].type == object.view)
                    {
                        object._view = i;
                        break;
                    }
                }
                object._render();
            }
            else if (key === "height")
            {
                object.host.height(object.height);
                object.host.width(object.width);
                object._updatesize(false, true);
            }
            else if (key === "width")
            {
                object.host.height(object.height);
                object.host.width(object.width);
                object._updatesize(true, false);

            }
            else if (key === "source")
            {
                object.updateBoundData();
            }
            else if (key == "resources")
            {
                object.updateBoundData();
            }
            else if (key === "columns" || key === "columnGroups")
            {
                object._columns = null;
                object._render();
            }
            else if (key === "selectionMode")
            {
                object.selectionMode = value.toLowerCase();
            }
            else if (key == "touchMode")
            {
                object._removeHandlers();
                object.touchDevice = null;
                object.vScrollBar.jqxScrollBar({ touchMode: value });
                object.hScrollBar.jqxScrollBar({ touchMode: value });
                object.refresh();
                object._addHandlers();
            }
            else if (key == "enableHover")
            {
                return;
            }
            else if (key == "showLegend")
            {
                object.legendbartop.show();
                object.legendbarbottom.show();
                object.refresh();
            }
            else if (key == 'disabled')
            {
                if (value)
                {
                    object.host.addClass(this.toThemeProperty('jqx-fill-state-disabled'));
                }
                else
                {
                    object.host.removeClass(this.toThemeProperty('jqx-fill-state-disabled'));
                }
                object.host.find('.jqx-grid-group-collapse').css('cursor', value ? 'default' : 'pointer');
                object.host.find('.jqx-grid-group-expand').css('cursor', value ? 'default' : 'pointer');
            }
            else if (key == 'columnsHeight')
            {
                object._render();
            }
            else if (key == 'localization')
            {
                object._render();
                if (object.editRecurrenceDialog )
                {
                    object.editRecurrenceDialog.jqxWindow('destroy');
                    object.createEditRecurrenceDialog();
                }
            }
            else if (key == 'theme')
            {
                $.jqx.utilities.setTheme(oldvalue, value, object.host);
                if (object._editDialog)
                {
                    $.jqx.utilities.setTheme(oldvalue, value, object._editDialog);
                }

                if (object.editRecurrenceDialog)
                {
                    $.jqx.utilities.setTheme(oldvalue, value, object.editRecurrenceDialog);
                }

                if (object.menu)
                {
                    object.menu.jqxMenu({ theme: object.theme });
                }

                object.vScrollBar.jqxScrollBar({ theme: object.theme });
                object.hScrollBar.jqxScrollBar({ theme: object.theme });
                object.refresh();
            }
            else
            {
                object.refresh();
            }
        }
    },

    _rendercolumnheader: function (text, align, headerheight, that) {
        var margin = '4px';

        if (that.columnGroups) {
            margin = (headerheight / 2 - this._columnheight / 2);
            if (margin < 0) {
                margin = 4;
            }
            margin += 'px';
        }
        else {
            if (this.columnsHeight != 25) {
                margin = (this.columnsHeight / 2 - this._columnheight / 2);
                if (margin < 0) {
                    margin = 4;
                }
                margin += 'px';
            }
        }

        var columnHTML = '<div style="overflow: hidden; text-overflow: ellipsis; text-align: ' + align + '; margin-left: 4px; margin-right: 4px; margin-bottom: ' + margin + '; margin-top: ' + margin + ';">' + '<span style="text-overflow: ellipsis; cursor: default;">' + text + '</span>' + '</div>';
        if (this.columnRenderer) {
            var result = this.columnRenderer(text, align, headerheight, columnHTML);
            if (result != undefined)
                return result;
        }

        return columnHTML;
    }
});



})(jqxBaseFramework);
