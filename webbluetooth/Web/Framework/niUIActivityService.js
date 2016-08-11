//****************************************
// NI LabVIEW UI Activity Service
// National Instruments Copyright 2014
//****************************************

//********************************************************
// Service that manages UI tracking behavior for browser elements
// The UI Activity Service provides the following behaviors:
// * DOM elements are registered as "activities" with managed callbacks (at least one of down, up, move) and callbacks for the service (cancelled and unregistered)
// * The service attaches down callbacks for all registered activites and sets the current activity when a down event is detected
// * The service guarantees that activity callbacks are fired in the following order down -> move (continuously) -> up / cancelled
// * The service guarantees that a new activity is not started before the current activity is completed (before current activity up or cancelled fired)
// Despite sounding heavy handed, the UI Activity Service is a thin wrapper around the native events (all the event args are passed straight through) that fundamentally provides completion events (cancelled) and precise registration of high-bandwidth UI events (move)
//********************************************************

NationalInstruments.HtmlVI.UIActivityService = (function () {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    var currentActivityId, //TODO: Current assumption is that only one action can occur at a time. Multitouch could mean multiple active elements. mraj
        registeredActivities = {};

    function createUIActivityObject(params) {
        if (params.element === undefined || (params.element instanceof window.HTMLElement) === false) {
            throw new Error(NI_SUPPORT.i18n('msg_PARAMETER_NOT_DOM_ELEMENT', params.element));
        }

        if (params.id === undefined || ((typeof params.id) === 'string') === false) {
            throw new Error(NI_SUPPORT.i18n('msg_PARAMETER_NOT_STRING', params.id));
        }

        if (params.up === undefined && params.down === undefined && params.move === undefined && params.cancelled === undefined && params.unregistered === undefined) {
            throw new Error(NI_SUPPORT.i18n('msg_REQUIRES_AT_LEAST_ONE_PARAMETER', 'up, down, move, cacelled, unregistered', params));
        }

        return {
            id: params.id,
            element: params.element,
            down: params.down,
            downClosure: undefined,
            move: params.move,
            moveClosure: undefined,
            up: params.up,
            upClosure: undefined,
            cancelled: params.cancelled,
            unregistered: params.unregistered
        };
    }

    function stopCurrentActivityListeners() {
        var currActivity;

        if (currentActivityId !== undefined) {
            currActivity = registeredActivities[currentActivityId];

            window.removeEventListener('mouseup', currActivity.upClosure, true);
            window.removeEventListener('mousemove', currActivity.moveClosure, true);

            currActivity.upClosure = currActivity.moveClosure = undefined;

            currentActivityId = undefined;
        }
    }

    function startCurrentActivityListeners(activity) {
        // If any non-atomic activity behaviour will occur then set-up the callbacks and current activity
        if (activity.move !== undefined || activity.up !== undefined) {

            if (typeof activity.up === 'function') {
                activity.upClosure = function () {
                    upAction(activity, arguments);
                };

                window.addEventListener('mouseup', activity.upClosure, true);
            }

            if (typeof activity.move === 'function') {
                activity.moveClosure = function () {
                    moveAction(activity, arguments);
                };

                window.addEventListener('mousemove', activity.moveClosure, true);
            }

            currentActivityId = activity.id;
        }
    }

    // Called when a down occurs and need to register the activity behaviours
    function downAction(activity, evtargs) {
        var currActivity;

        // Fired down on the same source twice so just continue the previous activity and trigger no action
        if (activity.id === currentActivityId) {
            return;
        }

        // If a different activity is in progress, cancel it so we can start making a new one
        if (currentActivityId !== undefined) {

            currActivity = registeredActivities[currentActivityId]; // Save a reference before the id is removed
            stopCurrentActivityListeners();

            if (typeof currActivity.cancelled === 'function') {
                currActivity.cancelled.apply(undefined);
            }
        }

        startCurrentActivityListeners(activity);

        // Run the down callback
        if (typeof activity.down === 'function') {
            activity.down.apply(undefined, evtargs);
        }
    }

    // The up action signifies the completion of the activity
    function upAction(activity, evtargs) {
        if (activity.id === currentActivityId) {
            stopCurrentActivityListeners();

            if (typeof activity.up === 'function') {
                activity.up.apply(undefined, evtargs);
            }

        } else {
            throw new Error(NI_SUPPORT.i18n('msg_UNEXPECTED_BEHAVIOR', 'Attempted to complete activity that was NOT the current activity. Only the current activity should be able to fire the up action.'));
        }
    }

    //should we assume that currentActivityId is fired correctly and move exists?
    function moveAction(activity, evtargs) {
        if (activity.id === currentActivityId) {

            if (typeof activity.move === 'function') {
                activity.move.apply(undefined, evtargs);
            } else {
                throw new Error(NI_SUPPORT.i18n('msg_UNEXPECTED_BEHAVIOR', 'The move callback is not a function. If the move property was not provided this function should not run.'));
            }

        } else {
            throw new Error(NI_SUPPORT.i18n('msg_UNEXPECTED_BEHAVIOR', 'Attempted to complete activity that was NOT the current activity. Only the current activity should be able to fire the move action.'));
        }
    }

    function register(params) {
        if (params === undefined || params === null) {
            throw new Error(NI_SUPPORT.i18n('msg_NO_PARAMETERS_SPECIFIED', 'NationalInstruments.HtmlVI.UIActivityService.register'));
        }

        var activity = createUIActivityObject(params);

        // If creation of an activity object fails then quit registration
        if (activity === undefined) {
            return;
        }

        // If the activity id is currently registered, unregister the existing activity and continue
        // If the activity is currentActivity, running register again means we are cancelling the currentActivity
        if (registeredActivities[activity.id] !== undefined) {
            unregister(activity.id);
        }

        registeredActivities[activity.id] = activity;

        // Add event listeners targeted to each element
        activity.downClosure = function () {
            downAction(activity, arguments);
        };

        activity.element.addEventListener('mousedown', activity.downClosure, true);
    }

    function unregister(id) {
        var activity = registeredActivities[id];

        if (id === undefined || activity === undefined || activity === null) {
            throw new Error(NI_SUPPORT.i18n('msg_UNKNOWN_ID', id, 'Make sure to register an activity with the UIActivityService before attempting to remove the activity.'));
        }

        if (activity.id === currentActivityId) {
            stopCurrentActivityListeners();

            if (typeof activity.cancelled === 'function') {
                activity.cancelled.apply(undefined);
            }
        }

        if (typeof activity.unregistered === 'function') {
            activity.unregistered.apply(undefined);
        }

        // Remove event listeners targeted to each element
        activity.element.removeEventListener('mousedown', activity.downClosure, true);
        delete registeredActivities[id];
    }

    // Add event listeners targeted to the entire page
    // If an activity is running and a window blur occurs then cancel it (use blur to be more aggressive than HTML5 Page Visibility API)
    // Do not capture so only window node targeted events are responded to (blur does not bubble)
    window.addEventListener('blur', function () {
        var currActivity;

        if (currentActivityId !== undefined) {
            currActivity = registeredActivities[currentActivityId]; // Save a reference before the id is removed
            stopCurrentActivityListeners();

            if (typeof currActivity.cancelled === 'function') {
                currActivity.cancelled.apply(undefined);
            }
        }
    }, false);

    return {
        register: register,
        unregister: unregister
    };
}());
