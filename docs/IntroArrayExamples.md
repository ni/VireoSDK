<!--
Copyright (c) 2020 National Instruments
SPDX-License-Identifier: MIT
-->

# Introduction to arrays

## Example 5: Arrays

Arrays come in three forms Fixed size, Variable and Bounded. When a variable is defined, any of the forms can be used.
Input to functions are generally always typed as variable.

```cpp
define (ArrayDemo, dv(.VirtualInstrument, (
    c(
        e(a(Int32 *)     variableArray1d)
        e(a(Int32 5)     fixedArray1d)
        e(a(Int32 -5)    boundedArray1d)

        // Variable size arrays size to fit initializer list
        e(dv(a(Int32 *) (1 2 3 4))  variableArray1dwithDefaults)

        // Extra initializers added as needed
        e(dv(a(Int32 5) (1 2 3 4))  fixedArray1dwithDefaults)

        // Size set by number of initializers
        e(dv(a(Int32 -5) (1 2 3 4)) boundedArray1dwithDefaults)
    )
    clump(
        Println(variableArray1d)
        Println(fixedArray1d)
        Println(boundedArray1d)        
        Println(variableArray1dwithDefaults)
        Println(fixedArray1dwithDefaults)
        Println(boundedArray1dwithDefaults)
   )
) ) )
enqueue (ArrayDemo)
```

### The IntIndex type

Internally Vireo defines a C++ typedef _IntIndex_ for use in array indexing calculations. The type is not directly tied to the size_t defined by the C++ compiler. Currently, it is set to Int32, so the number of elements in any one array is limited to 2^31 though the total size of the elements may require more the 2^31 bytes.  When Vireo is compiled in 64 bit mode, programs can work with sets of data so long as no one contiguous array exceeds the element count limit. While the IntIndex type is used in the core routines, many of the VIA exposed APIs are still defined directly as Int32 (In order to match LabVIEW) so there is still work to be done before Int64 indexes will work.

### Variable sized arrays

The most common array type is the variable sized arrays.  In VIA variable dimensions are identified by an asterisk '*' internally this is encoded as IntIndex.Min meaning the most negative number for the IntIndex type. This means a variable sized array can be considered an array whose dimension can be up to the maximum

### Fixed Sized Arrays

Resizing a Fixed Size array has no effect.

### Bounded Arrays

Bounded arrays specify an maximum size up when defined. In the reference runtime, their storage is allocated at data initialization time, so no allocation occurs when the logical size of the array is changed. Resizing an array to a size beween 0 and its bounded size will change it to that size. Attempting to size it larger that then maximum will leave it unaffected.  Note that whie storage reallocation ins not necessary for bounded arrays. Reallocation can still occur if the size of the elements are themselves dynamic in size.  For example, a bounded array of strings.

### Zero Dimensional Arrays

Zero dimensional arrays are arrays that have no dimensions, not arrays that have a dimension of zero. ZDAs are a bit unique methematically in that they always contain one element while, in comparison arrays with 1 or more dimensions can be empty if one of the dimension sizes is set to 0. ZDA types are not directly used from LabVIEW diagrams but Vireo uses them internally. A key characteristice of ZDAs is that it is possible to detect if the element is holding anything. This makes ZDAs the internal basis for nullable types, LabVIEW variants and objects.  For this reason the IsArray() test is slightly different from checking for Rank() greater than 0.

```cpp
c(
    e(a(Int32 *)       1DArray)            // IsArray = true;  Rank = 1
    e(a(Int32 * *)     2DArray)            // IsArray = true;  Rank = 2
    e(a(Int32 * * *)   3DAdday)            // IsArray = true;  Rank = 3

    e(Int32            SimpleScalar)       // IsArray = false; Rank = 0
    e(a(Int32)         0DArrayOfInt32)     // IsArray = true;  Rank = 0
    e(a(*)             0DArrayOfGeneric)   // IsArray = true;  Rank = 0
)
```

### Running out of memory

Each TypeManger and its corresponding ExecutionContext has a memory threshold, if an array operation would take the total allocation above that limit the allocation fails.
