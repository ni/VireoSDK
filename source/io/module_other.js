var assignOtherAPIs;
(function () {
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
    assignOtherAPIs = function (Module, publicAPI) {
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
}());
export default assignOtherAPIs;
