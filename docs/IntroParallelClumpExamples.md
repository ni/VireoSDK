<!--
Copyright (c) 2020 National Instruments
SPDX-License-Identifier: MIT
-->

# Introduction to parallel execution

## Example 4: Parallelism

The classic LabVIEW parallelism demo is two loops. It's a core demo because, in LabVIEW, everything is parallel unless there is a data dependency. This model is significantly different from languages where everything is sequential unless threads are explicitly used. That distinction is the difference between a conventional programming language and a system design tool like LabVIEW.
Since textual languages are read sequentially it is easy to describe sequential tasks. In comparison when you look at things visually the default interpretation is that the things run independently. For example, when you look in the kitchen and see several appliances lined up on the counter the default interpretation is that they work independently; the toaster and blender can both run independent of the other. This short diversion into program philosophy is to note that while VIA files provide a concurrency model that is a bit more abstract than explicit thread creation, it is typically not perceived as intuitive as the graphical representation.

```cpp
// Parallel.via - Do two things at once
define (Parallel dv(.VirtualInstrument (
     c(
        e(v(Int32 1000)  oneThousand)
        e(v(Int32 500)  fiveHundred)
        e(v(String 'Pat you head.') sHead)
        e(v(String 'Rub your tummy.') sTummy)
    )
    clump(              // Clump 0 (the root clump)
         Trigger(1)     // Trigger Clump #1        
         WaitMilliseconds(fiveHundred)
         Trigger(2)     
         Wait(1)        // Wait till clump #1 is complete (will it?)
         Wait(2)
    )
    clump(              // Clump 1
        Perch(0)        // Labels are scoped to a clump, this is Label 0
        Println(sHead)
        WaitMilliseconds(oneThousand)
        Branch(0)       // Branch to Perch 0
    )
    clump(              // Clump 2
        Perch(0)
        Println(sTummy)
        WaitMilliseconds(oneThousand)
        Branch(0)
    )
)))
enqueue (Parallel)
```

When Parallel.via is run, the VIs root clump will trigger two separate clumps that then run on their own. The root loop will wait till sub clumps are complete. Alas, in this program, that will never happen because booth loops never end.

```console
$ esh Parallel.via
Pat you head.
Rub your tummy.
Pat you head.
Rub your tummy.
^C  program stopped with ctrl+c
$
```
