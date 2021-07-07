<!--
Copyright (c) 2020 National Instruments
SPDX-License-Identifier: MIT
-->

# Introduction to types and functions

## Example 2: Basic types and functions

LabVIEW's VIs are written using a language called G; a language that is primarily strictly typed. As a result, the VI assembly can be strictly typed, as well.  The following VIA file has two VIs; one does 32 bit integer multiplication, and the other uses IEEE754 double precision.

```cpp
// Calculate.via
define (CalcUsingIntegers  dv(.VirtualInstrument  (
    c(
        e(dv(Int32 6)  i)
        e(dv(Int32 7)  j)
        e(Int32  k)
    )
    clump(1
        MulInt32(i j k)
        Println(k)
    )
) ) )

define (CalcUsingDoubles  dv(.VirtualInstrument  (
    c(
        e(dv(Double 6)  x)
        e(dv(Double 7)  y)
        e(Double  z)
    )
    clump(1
        MulDouble(x y z)
        Println(z)
   )
) ) )

enqueue (CalcUsingIntegers)
enqueue (CalcUsingDoubles)
```

Running the script yields the results of both vis. There is no guarantee one print will execute first. Though the characters will never be interleaved since the print operation is atomic.

```console
$esh Calculate.via
42
42.000000
```

## Example 3: Generic functions

The type specific functions in the previous example allow vireo to execute programs efficiently without runtime type checking. The TADM system also supports generic function definitions that can evaluate to a type specific function at code load time.  In simple cases, like the one below, the generic function evaluates to a type specific (non generic)  function  ( Mull(x y z) => MulDouble(x y z)). However, the system is more general than C++ style function overloading. For example, a generic function can evaluate to more complex patterns  such as a vector operation that applies the primitive to every element in an array.

```cpp
// CalculateGeneric.via
define (Calc  dv(.VirtualInstrument  (
    c(
        e(dv(Int32 6)  i)
        e(dv(Int32 7)  j)
        e(Int32  k)
        e(dv(Double 6.0)  x)
        e(dv(Double 7.0)  y)
        e(Double  z)
    )
    clump(1
        Mul(i j k)   // Will resolve to MulInt32 at load time
        Println(k)
        Mul(x y z)    // Will resolve to MulDouble at load time
        Println(k)
   )
) ) )
```

```console
$esh Calculate.via
42
42.000000
```
