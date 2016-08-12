//****************************************
// Array Viewer View Model
// National Instruments Copyright 2014
//****************************************
(function (parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.ViewModels.ArrayViewerViewModel = function (element, model) {
        parent.call(this, element, model);

        // Public Instance Properties
        // None

        // Private Instance Properties
        this._viewModelData = {};
        this._recreateCellsRequested = false;
    };

    // Static Public Variables
    // None

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.ViewModels.ArrayViewerViewModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    var arrayElementSizeChanged = function (arrayElementViewModel, rootArrayViewModel) {
        var i, renderBuffer, arrayViewers, arrayElementModel, arrayModel, arrayElement;
        arrayElementModel = arrayElementViewModel.model;
        arrayModel = arrayElementModel.getOwner();
        arrayElement = arrayElementViewModel.element.parentElement;

        arrayViewers = [arrayElement];
        if (arrayModel !== rootArrayViewModel.model) {
            Array.prototype.push.apply(arrayViewers, rootArrayViewModel._viewModelData[arrayElement.niControlId].getClones());
        }

        for (i = 0; i < arrayViewers.length; i++) {
            renderBuffer = NationalInstruments.HtmlVI.RenderEngine.getOrAddRenderBuffer(arrayViewers[i]);
            renderBuffer.properties.elementSize = { width: parseInt(arrayElementModel.width), height: parseInt(arrayElementModel.height) };
            NationalInstruments.HtmlVI.RenderEngine.enqueueDomUpdate(arrayViewers[i]);
        }
    };

    var copyRenderBuffer = function (srcRenderBuffer, destRenderBuffer) {
        var i, newStyle, newAttr, newProp;

        for (i = 0; i < srcRenderBuffer.cssClasses.toAdd.length; i++) {
            destRenderBuffer.cssClasses.toAdd[i] = srcRenderBuffer.cssClasses.toAdd[i];
        }

        for (i = 0; i < srcRenderBuffer.cssClasses.toRemove.length; i++) {
            destRenderBuffer.cssClasses.toRemove[i] = srcRenderBuffer.cssClasses.toRemove[i];
        }

        for (newStyle in srcRenderBuffer.cssStyles) {
            if (srcRenderBuffer.cssStyles.hasOwnProperty(newStyle)) {
                destRenderBuffer.cssStyles[newStyle] = srcRenderBuffer.cssStyles[newStyle];
            }
        }

        for (newAttr in srcRenderBuffer.attributes) {
            if (srcRenderBuffer.attributes.hasOwnProperty(newAttr)) {
                destRenderBuffer.attributes[newAttr] = srcRenderBuffer.attributes[newAttr];
            }
        }

        // TODO we'll have to think about if we could run into any issues for property values that
        // can be objects (like a numeric with {numberValue:1}. If the template control's value changes,
        // then we would end up with the clones referring to the same value object.
        for (newProp in srcRenderBuffer.properties) {
            if (srcRenderBuffer.properties.hasOwnProperty(newProp)) {
                destRenderBuffer.properties[newProp] = srcRenderBuffer.properties[newProp];
            }
        }
    };

    var updateElementsFromRenderBuffer = function (elements, renderBuffer) {
        var curBuffer, i;

        for (i = 0; i < elements.length; i++) {
            curBuffer = NationalInstruments.HtmlVI.RenderEngine.getOrAddRenderBuffer(elements[i]);
            copyRenderBuffer(renderBuffer, curBuffer);
            NationalInstruments.HtmlVI.RenderEngine.enqueueDomUpdate(elements[i]);
        }
    };

    var elementFontChanged = function (elements, childViewModel) {
        var i;
        var fontSize = childViewModel.model.fontSize;
        var fontFamily = childViewModel.model.fontFamily;
        var fontWeight = childViewModel.model.fontWeight;
        var fontStyle = childViewModel.model.fontStyle;

        for (i = 0; i < elements.length; i++) {
            elements[i].setFont(fontSize, fontFamily, fontWeight, fontStyle);
        }
    };

    var findRootArrayViewModel = function (controlModel, viRef) {
        var currControlModel = controlModel, rootArrayModel = null;
        var viModel, rootArrayViewModel;

        while (currControlModel.insideTopLevelContainer()) {
            if (currControlModel instanceof NationalInstruments.HtmlVI.Models.ArrayViewerModel) {
                rootArrayModel = currControlModel;
            }

            currControlModel = currControlModel.getOwner();
        }

        if (currControlModel instanceof NationalInstruments.HtmlVI.Models.ArrayViewerModel) {
            rootArrayModel = currControlModel;
        }

        viModel = NationalInstruments.HtmlVI.viReferenceService.getVIModelByVIRef(viRef);
        rootArrayViewModel = viModel.getControlViewModel(rootArrayModel.niControlId);

        return rootArrayViewModel;
    };

    var createElementShims = function (rootArrayViewModel, childViewModel) {
        var originalUserInteractionChanged = childViewModel.userInteractionChanged;
        var originalModelPropertyChanged = childViewModel.modelPropertyChanged;
        var originalChildViewModelAdded = childViewModel.onChildViewModelAdded;
        var originalChildViewModelRemoved = childViewModel.onChildViewModelRemoved;
        var owner = childViewModel.model.getOwner();
        var isArrayElement = owner instanceof NationalInstruments.HtmlVI.Models.ArrayViewerModel;

        return {
            setCallback: function () {
                childViewModel.userInteractionChanged = function (newState) {
                    var viewModelData = rootArrayViewModel._viewModelData[childViewModel.element.niControlId], renderBuffer;
                    var updateClonesAfterInteractionEnded = false;
                    if (newState === 'start') {
                        viewModelData.suppressBoundsChanges = true;
                    } else if (newState === 'end') {
                        viewModelData.suppressBoundsChanges = false;
                        if (isArrayElement) {
                            arrayElementSizeChanged(childViewModel, rootArrayViewModel);
                            rootArrayViewModel.element.updateTemplateCss(childViewModel.element);
                        } else {
                            if (viewModelData.recreateCellsOnUserInteractionEnd === true) {
                                rootArrayViewModel.recreateAllCells();
                                viewModelData.recreateCellsOnUserInteractionEnd = false;
                            } else {
                                updateClonesAfterInteractionEnded = true;
                            }
                        }
                    }

                    originalUserInteractionChanged.call(childViewModel, newState);
                    // The original userInteractionChanged function will tell the control's resizeStrategy to commit the bounds change.
                    // This usually calls niResizeStrategy.setBoundsToRenderBuffer, so after that's done, the render buffer for that
                    // control should have pending CSS style changes for left / top / width / height.
                    if (updateClonesAfterInteractionEnded) {
                        renderBuffer = NationalInstruments.HtmlVI.RenderEngine.getOrAddRenderBuffer(childViewModel.element);
                        if (Object.keys(renderBuffer.cssStyles).length !== 0) {
                            updateElementsFromRenderBuffer(viewModelData.getClones(), renderBuffer);
                        }

                        rootArrayViewModel.element.updateTemplateCss(childViewModel.element);
                    }
                };

                childViewModel.modelPropertyChanged = function (propertyName) {
                    var viewModelData = rootArrayViewModel._viewModelData[childViewModel.element.niControlId], elements;
                    var focusedClone = null;
                    var renderBuffer;
                    if (viewModelData.suppressBoundsChanges && childViewModel.element._niFocusedCloneId !== undefined) {
                        focusedClone = document.querySelector('[ni-control-id=\'' + childViewModel.element._niFocusedCloneId + '\']');
                    }

                    renderBuffer = originalModelPropertyChanged.call(childViewModel, propertyName);
                    if (propertyName === 'left' || propertyName === 'top' || propertyName === 'width' || propertyName === 'height' ||
                        propertyName === NationalInstruments.HtmlVI.ResizeStrategy.ResizeCSS.TRANSFORM_CSS || propertyName === NationalInstruments.HtmlVI.ResizeStrategy.ResizeCSS.TRANSFORM_ORIGIN_CSS) {
                        if (isArrayElement) {
                            if ((propertyName === 'width' || propertyName === 'height') && !viewModelData.suppressBoundsChanges) {
                                arrayElementSizeChanged(childViewModel, rootArrayViewModel);
                                rootArrayViewModel.element.updateTemplateCss(childViewModel.element);
                            }
                        } else {
                            if (viewModelData.suppressBoundsChanges) {
                                elements = [];
                                if (focusedClone !== null) {
                                    elements[0] = focusedClone;
                                }
                            } else {
                                elements = viewModelData.getClones();
                                rootArrayViewModel.element.updateTemplateCss(childViewModel.element);
                            }

                            updateElementsFromRenderBuffer(elements, renderBuffer);
                        }
                    } else if (propertyName === 'fontSize' || propertyName === 'fontFamily' || propertyName === 'fontWeight' || propertyName === 'fontStyle') {
                        elementFontChanged(viewModelData.getClones(), childViewModel);
                        rootArrayViewModel.element.updateTemplateCss(childViewModel.element);
                    } else {
                        elements = viewModelData.getClones();
                        updateElementsFromRenderBuffer(elements, renderBuffer);
                    }

                    return renderBuffer;
                };

                childViewModel.onChildViewModelAdded = function (viewModel, isInitialLoad) {
                    var viewModelData, viViewModel;
                    originalChildViewModelAdded.call(childViewModel, viewModel, isInitialLoad);

                    rootArrayViewModel.initializeElementViewModel(viewModel);
                    viewModelData = rootArrayViewModel._viewModelData[viewModel.element.niControlId];

                    viViewModel = NationalInstruments.HtmlVI.viReferenceService.getVIViewModelByVIRef(viewModel.element.viRef);
                    if (!isInitialLoad) {
                        if (viViewModel.isUserInteracting(viewModel.element.niControlId)) {
                            viewModelData.recreateCellsOnUserInteractionEnd = true;

                            // Optimally we would just add a copy of the new control in all of the array cells.
                            // For now, we reinitialize the array (based on the current state of the template) when a descendant is added or removed,
                            // which is much simpler to implement, but also worse performance.
                            // We'll only update the focused cell at first, then the full array will be refreshed on user interaction end.
                            window.requestAnimationFrame(function () {
                                rootArrayViewModel.element.recreateCells(false);
                            });
                        } else {
                            // A child has been added, after initial load, and not part of a user interaction. This is probably undo / redo, so we need to
                            // immediately update the whole array.
                            window.requestAnimationFrame(function () {
                                rootArrayViewModel.element.recreateCells(true);
                            });
                        }
                    }
                };

                childViewModel.onChildViewModelRemoved = function (viewModel) {
                    var viewModelData, elements, i;

                    viewModelData = rootArrayViewModel._viewModelData[viewModel.element.niControlId];
                    elements = viewModelData.getClones();

                    // If this is for an array, niArrayViewerViewModel.onChildViewModelRemoved is called here (when we call the original function.)
                    // That will call removeShim on the child, and remove it from the viewModelData map. So, for arrays, we skip doing those things
                    // later in this function.
                    originalChildViewModelRemoved.call(childViewModel, viewModel);

                    for (i = 0; i < elements.length; i++) {
                        elements[i].parentElement.removeChild(elements[i]);
                    }

                    if (!(childViewModel.model instanceof NationalInstruments.HtmlVI.Models.ArrayViewerModel)) {
                        viewModelData.shim.removeShim();
                        rootArrayViewModel._viewModelData[viewModel.element.niControlId] = undefined;
                    }
                };
            }, removeShim: function () {
                childViewModel.userInteractionChanged = originalUserInteractionChanged;
                childViewModel.modelPropertyChanged = originalModelPropertyChanged;
                childViewModel.onChildViewModelAdded = originalChildViewModelAdded;
                childViewModel.onChildViewModelRemoved = originalChildViewModelRemoved;
            }
        };
    };

    // Public Prototype Methods
    proto.registerViewModelProperties(proto, function (targetPrototype, parentMethodName) {
        parent.prototype[parentMethodName].call(this, targetPrototype, parentMethodName);

        proto.addViewModelProperty(targetPrototype, { propertyName: 'dimensions' });
        proto.addViewModelProperty(targetPrototype, { propertyName: 'indexEditorWidth' });
        proto.addViewModelProperty(targetPrototype, { propertyName: 'indexVisibility' });
        proto.addViewModelProperty(targetPrototype, { propertyName: 'rowsAndColumns' });
        proto.addViewModelProperty(targetPrototype, { propertyName: 'orientation' });
        proto.addViewModelProperty(targetPrototype, { propertyName: 'verticalScrollbarVisibility' });
        proto.addViewModelProperty(targetPrototype, { propertyName: 'horizontalScrollbarVisibility' });
        proto.addViewModelProperty(targetPrototype, { propertyName: 'focusedCell' });
    });

    proto.modelPropertyChanged = function (propertyName) {
        var renderBuffer = parent.prototype.modelPropertyChanged.call(this, propertyName);

        switch (propertyName) {
            case 'value':
                this.element.setArrayValue(this.model.value);
                break;
        }

        return renderBuffer;
    };

    proto.recreateAllCells = function () {
        var that = this;
        if (!this._recreateCellsRequested) {
            this._recreateCellsRequested = true;
            window.requestAnimationFrame(function () {
                that.element.recreateCells(true);
                that._recreateCellsRequested = false;
            });
        }
    };

    proto.bindToView = function () {
        parent.prototype.bindToView.call(this);
        var that = this;
        var viModel, childModel;

        that.element.addEventListener('value-changed', function (evt) {
            if (evt.target === that.element) {
                that.model.value = evt.detail.value;
                that.model.controlChanged();
            }
        });
        that.element.addEventListener('scroll-changed', function (evt) {
            if (evt.target === that.element) {
                that.model.scrollChanged(evt.detail.indices);
            }
        });

        if (that.model.childModels.length > 0) {
            childModel = that.model.childModels[0];
            viModel = NationalInstruments.HtmlVI.viReferenceService.getVIModelByVIRef(that.viRef);
            that.initializeArrayElementViewModel(viModel.getControlViewModel(childModel.niControlId));
        }
    };

    proto.setRenderHints = function () {
        // We explicitly decide to not call the parent function.
        this.resizeStrategy = new NationalInstruments.HtmlVI.PaintResizeStrategy();
    };

    proto.updateModelFromElement = function () {
        parent.prototype.updateModelFromElement.call(this);

        this.model.value = this.element.getArrayValue();
    };

    proto.applyModelToElement = function () {
        parent.prototype.applyModelToElement.call(this);

        this.element.setArrayValue(this.model.value);
    };

    proto.onChildViewModelAdded = function (childViewModel) {
        parent.prototype.onChildViewModelAdded.call(this, childViewModel);
        this.initializeArrayElementViewModel(childViewModel);
    };

    proto.onChildViewModelRemoved = function (childViewModel) {
        var rootArrayViewModel = findRootArrayViewModel(childViewModel.model, this.element.viRef);

        var viewModelData = rootArrayViewModel._viewModelData[childViewModel.element.niControlId];
        viewModelData.shim.removeShim();
        rootArrayViewModel._viewModelData[childViewModel.element.niControlId] = undefined;
    };

    proto.initializeArrayElementViewModel = function (childViewModel) {
        var rootArrayViewModel = findRootArrayViewModel(childViewModel.model, this.element.viRef);

        if (rootArrayViewModel === this) {
            this.initializeElementViewModel(childViewModel);
        }
    };

    proto.initializeElementViewModel = function (childViewModel) {
        var i, curChild, viModel, shim, curViewModel, childModels, viewModelData;

        if (childViewModel instanceof NationalInstruments.HtmlVI.ViewModels.VisualViewModel) {
            shim = createElementShims(this, childViewModel);
            shim.setCallback();
            viewModelData = {};
            viewModelData.shim = shim;
            viewModelData.cssCloneSelector = this.element.getFullCssSelectorForNIVisual(childViewModel.element);
            viewModelData.getClones = function () {
                var results = document.querySelectorAll(viewModelData.cssCloneSelector);
                return results;
            };

            this._viewModelData[childViewModel.model.niControlId] = viewModelData;
            childModels = Array.prototype.slice.call(childViewModel.model.childModels);
            for (i = 0; i < childModels.length; i++) {
                curChild = childModels[i];
                viModel = NationalInstruments.HtmlVI.viReferenceService.getVIModelByVIRef(this.element.viRef);
                curViewModel = viModel.getControlViewModel(curChild.niControlId);
                this.initializeElementViewModel(curViewModel);
            }
        }
    };

    NationalInstruments.HtmlVI.NIModelProvider.registerViewModel(child, NationalInstruments.HtmlVI.Elements.ArrayViewer, NationalInstruments.HtmlVI.Models.ArrayViewerModel);
}(NationalInstruments.HtmlVI.ViewModels.VisualViewModel));
