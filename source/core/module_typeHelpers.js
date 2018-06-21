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
}(this, 'NationalInstruments.Vireo.Core.assignTypeHelpers', function () {
    'use strict';

    var assignTypeHelpers = function (Module) {
        // Disable new-cap for the cwrap functions so the names can be the same in C and JS
        /* eslint 'new-cap': ['error', {'capIsNewExceptions': [
            'TypeRef_Name'
        ]}], */
        Module.typeHelpers = {};

        var TypeRef_Name = Module.cwrap('TypeRef_Name', 'string', ['number']);

        // Private instance functions
        var validateVisitMethod = function (fn, fnName) {
            if (typeof fn !== 'function') {
                throw new Error('Visitor must have a method named `' + fnName + '`. Found: ' + fn);
            }
        };

        var dispatchVisitBoolean = function (typeVisitor, valueRef, data) {
            validateVisitMethod(typeVisitor.visitBoolean, 'visitBoolean');
            return typeVisitor.visitBoolean(valueRef, data);
        };

        var dispatchVisitEnum = function (typeVisitor, valueRef, data) {
            validateVisitMethod(typeVisitor.visitEnum, 'visitEnum');
            return typeVisitor.visitEnum(typeVisitor, valueRef, data);
        };

        var dispatchVisitInteger = function (typeVisitor, valueRef, data) {
            var typeRef = valueRef.typeRef;
            var isSignedInteger = Module.typeHelpers.isSigned(typeRef);
            var sizeOfInteger = Module.typeHelpers.topAQSize(typeRef);
            var visitFn = undefined;
            var typeName = '';
            if (isSignedInteger === true) {
                switch (sizeOfInteger) {
                case 1:
                    visitFn = typeVisitor.visitInt8;
                    typeName = 'Int8';
                    break;
                case 2:
                    visitFn = typeVisitor.visitInt16;
                    typeName = 'Int16';
                    break;
                case 4:
                    visitFn = typeVisitor.visitInt32;
                    typeName = 'Int32';
                    break;
                case 8:
                    visitFn = typeVisitor.visitInt64;
                    typeName = 'Int64';
                    break;
                default:
                    throw new Error('Unexpected size for Integer');
                }
            } else {
                switch (sizeOfInteger) {
                case 1:
                    visitFn = typeVisitor.visitUInt8;
                    typeName = 'UInt8';
                    break;
                case 2:
                    visitFn = typeVisitor.visitUInt16;
                    typeName = 'UInt16';
                    break;
                case 4:
                    visitFn = typeVisitor.visitUInt32;
                    typeName = 'UInt32';
                    break;
                case 8:
                    visitFn = typeVisitor.visitUInt64;
                    typeName = 'UInt64';
                    break;
                default:
                    throw new Error('Unexpected size for Unsigned Integer. Found: ');
                }
            }

            validateVisitMethod(visitFn, 'visit' + typeName);
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitFloat = function (typeVisitor, valueRef, data) {
            var typeRef = valueRef.typeRef;
            var sizeOfFloat = Module.typeHelpers.topAQSize(typeRef);
            var visitFn;
            var typeName = '';
            switch (sizeOfFloat) {
            case 4:
                visitFn = typeVisitor.visitSingle;
                typeName = 'Single';
                break;
            case 8:
                visitFn = typeVisitor.visitDouble;
                typeName = 'Double';
                break;
            default:
                throw new Error('Unexpected size for a Float value');
            }

            validateVisitMethod(visitFn, 'visit' + typeName);
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitString = function (typeVisitor, valueRef, data) {
            validateVisitMethod(typeVisitor.visitString, 'visitString');
            return typeVisitor.visitString(valueRef, data);
        };

        var dispatchVisitComplex = function (typeVisitor, valueRef, data) {
            var typeRef = valueRef.typeRef,
                sizeOfComplex = Module.typeHelpers.topAQSize(typeRef),
                visitFn,
                typeName;
            switch (sizeOfComplex) {
            case 8:
                visitFn = typeVisitor.visitComplexSingle;
                typeName = 'Single';
                break;
            case 16:
                visitFn = typeVisitor.visitComplexDouble;
                typeName = 'Double';
                break;
            default:
                throw new Error('Unexpected size for a Complex value');
            }

            validateVisitMethod(visitFn, 'visitComplex' + typeName);
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitAnalogWaveform = function (typeVisitor, valueRef, data) {
            validateVisitMethod(typeVisitor.visitAnalogWaveform, 'visitAnalogWaveform');
            return typeVisitor.visitAnalogWaveform(valueRef, data);
        };

        var dispatchVisitTimestamp = function (typeVisitor, valueRef, data) {
            validateVisitMethod(typeVisitor.visitTimestamp, 'visitTimestamp');
            return typeVisitor.visitTimestamp(valueRef, data);
        };

        var dispatchVisitPath = function (typeVisitor, valueRef, data) {
            validateVisitMethod(typeVisitor.visitPath, 'visitPath');
            return typeVisitor.visitPath(valueRef, data);
        };

        var dispatchVisitArray = function (typeVisitor, valueRef, data) {
            validateVisitMethod(typeVisitor.visitArray, 'visitArray');
            return typeVisitor.visitArray(valueRef, data);
        };

        var dispatchVisitCluster = function (typeVisitor, valueRef, data) {
            validateVisitMethod(typeVisitor.visitCluster, 'visitCluster');
            return typeVisitor.visitCluster(typeVisitor, valueRef, data);
        };

        // Exported functions
        Module.typeHelpers.topAQSize = function (typeRef) {
            return Module._TypeRef_TopAQSize(typeRef);
        };

        Module.typeHelpers.typeName = function (typeRef) {
            return TypeRef_Name(typeRef);
        };

        Module.typeHelpers.subElementCount = function (typeRef) {
            return Module._TypeRef_SubElementCount(typeRef);
        };

        Module.typeHelpers.subElementByIndex = function (typeRef, index) {
            return Module._TypeRef_GetSubElementByIndex(typeRef, index);
        };

        Module.typeHelpers.isCluster = function (typeRef) {
            return Module._TypeRef_IsCluster(typeRef) !== 0;
        };

        Module.typeHelpers.isArray = function (typeRef) {
            return Module._TypeRef_IsArray(typeRef) !== 0;
        };

        Module.typeHelpers.isBoolean = function (typeRef) {
            return Module._TypeRef_IsBoolean(typeRef) !== 0;
        };

        Module.typeHelpers.isInteger = function (typeRef) {
            return Module._TypeRef_IsInteger(typeRef) !== 0;
        };

        Module.typeHelpers.isSigned = function (typeRef) {
            return Module._TypeRef_IsSigned(typeRef) !== 0;
        };

        Module.typeHelpers.isEnum = function (typeRef) {
            return Module._TypeRef_IsEnum(typeRef) !== 0;
        };

        Module.typeHelpers.isFloat = function (typeRef) {
            return Module._TypeRef_IsFloat(typeRef) !== 0;
        };

        Module.typeHelpers.isString = function (typeRef) {
            return Module._TypeRef_IsString(typeRef) !== 0;
        };

        Module.typeHelpers.isPath = function (typeRef) {
            return Module._TypeRef_IsPath(typeRef) !== 0;
        };

        Module.typeHelpers.isTimestamp = function (typeRef) {
            return Module._TypeRef_IsTimestamp(typeRef) !== 0;
        };

        Module.typeHelpers.isComplex = function (typeRef) {
            return Module._TypeRef_IsComplex(typeRef) !== 0;
        };

        Module.typeHelpers.isAnalogWaveform = function (typeRef) {
            return Module._TypeRef_IsAnalogWaveform(typeRef) !== 0;
        };

        var typeHandlers = [
            {
                typeChecker: Module.typeHelpers.isBoolean,
                dispatcher: dispatchVisitBoolean
            },
            {
                typeChecker: Module.typeHelpers.isEnum,
                dispatcher: dispatchVisitEnum
            },
            {
                typeChecker: Module.typeHelpers.isInteger,
                dispatcher: dispatchVisitInteger
            },
            {
                typeChecker: Module.typeHelpers.isFloat,
                dispatcher: dispatchVisitFloat
            },
            {
                typeChecker: Module.typeHelpers.isString,
                dispatcher: dispatchVisitString
            },
            {
                typeChecker: Module.typeHelpers.isComplex,
                dispatcher: dispatchVisitComplex
            },
            {
                typeChecker: Module.typeHelpers.isAnalogWaveform,
                dispatcher: dispatchVisitAnalogWaveform
            },
            {
                typeChecker: Module.typeHelpers.isTimestamp,
                dispatcher: dispatchVisitTimestamp
            },
            {
                typeChecker: Module.typeHelpers.isPath,
                dispatcher: dispatchVisitPath
            },
            {
                typeChecker: Module.typeHelpers.isArray,
                dispatcher: dispatchVisitArray
            },
            {
                typeChecker: Module.typeHelpers.isCluster,
                dispatcher: dispatchVisitCluster
            }
        ];

        Module.typeHelpers.findTypeDispatcher = function (typeRef) {
            var i = 0,
                typeHandler;

            for (i = 0; typeHandlers.length; i += 1) {
                typeHandler = typeHandlers[i];
                if (typeHandler.typeChecker(typeRef) === true) {
                    return typeHandler.dispatcher;
                }
            }
            return undefined;
        };
    };

    return assignTypeHelpers;
}));
