// Using a modified UMD module format. Specifically a modified returnExports (no dependencies) version
(function (root, globalName, factory) {
    'use strict';
    var buildGlobalNamespace = function () {
        var buildArgs = Array.prototype.slice.call(arguments);
        return globalName.split('.').reduce(function (currObj, subNamespace, currentIndex, globalNameParts) {
            var nextValue = currentIndex === globalNameParts.length - 1 ? factory.apply(undefined, buildArgs) : {};
            return currObj[subNamespace] === undefined ? (currObj[subNamespace] = nextValue) : currObj[subNamespace];
        }, root);
    };

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as a named module.
        define(globalName, [], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. "CommonJS-like" for environments like Node but not strict CommonJS
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        buildGlobalNamespace();
    }
}(this, 'NationalInstruments.Vireo.ModuleBuilders.assignOtherAPIs', function () {
    'use strict';
    // Static Private Variables (all vireo instances)
    var OtherHelper;
    (function () {
        // Static private reference aliases
        // None

        // Constructor Function
        OtherHelper = function () {
            // Public Instance Properties
            // None

            // Private Instance Properties
            // None
        };

        // Static Public Variables
        // None

        // Static Public Functions
        // None

        // Prototype creation
        var child = OtherHelper;
        var proto = child.prototype;

        // Static Private Variables
        // None

        // Static Private Functions
        // None

        // Public Prototype Methods
        proto.example = function () {
            // Empty
        };
    }());

    var inheritFromParent = function (childConstructorFunction, parentConstructorFunction) {
        childConstructorFunction.prototype = Object.create(parentConstructorFunction.prototype);
        childConstructorFunction.prototype.constructor = childConstructorFunction;
        return childConstructorFunction.prototype;
    };

    var OtherHelperChild;
    (function (parent) {
        // Static private reference aliases
        // None

        // Constructor Function
        OtherHelperChild = function () {
            parent.call(this);
            // Public Instance Properties
            // None

            // Private Instance Properties
            // None
        };

        // Static Public Variables
        // None

        // Static Public Functions
        // None

        // Prototype creation
        var child = OtherHelperChild;
        var proto = inheritFromParent(child, parent);

        // Static Private Variables
        // None

        // Static Private Functions
        // None

        // Public Prototype Methods
        proto.example = function () {
            parent.prototype.example.call(this);
        };
    }(OtherHelper));

    // Vireo Core Mixin Function
    var assignOtherAPIs = function (Module, publicAPI) {
        Module.otherAPIs = {};
        publicAPI.otherAPIs = {};

        // Note:
        // Do not create a binding directly to other modules, ie:
        // var MODULE_ANOTHER_API = vireoCore.Module.anotherAPI;
        // MODULE_ANOTHER_API.awesomeFunction();
        // Instead use a dynamic binding to other module functions like:
        // Module.anotherAPI.awesomeFunction();
        // This is because the module load order is not guaranteed and may bind to undefined accidently

        // Private Instance Variables (per vireo instance)
        // None

        // Exported functions
        // None
    };

    return assignOtherAPIs;
}));
