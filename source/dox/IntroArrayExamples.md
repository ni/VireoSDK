## Introduction to arrays

### Example 5: Arrays
Arrays come in three forms Fixed size, Variable and Bounded. When a variable is defined any of the forms can be used. Input to functions are generally always typed as variable. 

~~~(.via)
define (ArrayDemo, dv(.VirtualInstrument, (
 c(   
    e(a(.Int32 *)     variableArray1d)
    e(a(.Int32 5)     fixedArray1d)
    e(a(.Int32 -5)    boundedArray1d)

    e(dv(a(.Int32 *) (1 2 3 4))  variableArray1dwithDefaults)
    e(dv(a(.Int32 5) (1 2 3 4))  fixedArray1dwithDefaults)  	// extra defaults added
    e(dv(a(.Int32 -5) (1 2 3 4)) boundedArray1dwithDefaults)
  )
    clump(1
        Print(variableArray1d)
        Print(fixedArray1d)
        Print(boundedArray1d)        
        Print(variableArray1dwithDefaults)
        Print(fixedArray1dwithDefaults)
        Print(boundedArray1dwithDefaults)
   )
) ) )
enqueue (ArrayDemo)
~~~

// TODO adde results of running program.
This is simple introductions to arrays. It will take a few more to cover details passing arrays, and working with multi dimension arrays. Those will be covered later.

## Next Steps
* [Introduction](index.html)
* [Some more simple type examples](md_dox__intro_type_examples.html)
* [Some array type examples](md_dox__intro_array_examples.html)
* [VIs with parallel execution](md_dox__intro_parallel_clump_examples.html)
* [The TypeManager](md_dox__type_manager.html)

