## The Type Manager

In the introduction, the VIs seen in the examples were running in a _ExecutionContext_, an object that manages scheduling the execution of clumps of code. A core element of each  ExecutionContext is a TypeManager object that manages all types and data allocations needed during VI execution. TypeManagers can be nested allowing a parent TypeManager to provide types that are used by inherited by child TypeManagers. 

To get  better understanding of how the TypeManager works and how types are defined. Lets look at the examples VIs in a bit more detail. The VI itself is a new type, some parts internal to the VI are as well. These will be added to the ExecutionContext's TypeManager.

~~~
// Define a type named "Calc" that is a "VirtualInstrument"
define (Calc  dv(.VirtualInstrument  (
    
    // Define a cluster type with 6 elements that makes up the data space used by the VI   
    c(
        // Each element field in the cluster is a type defiition 
        e(dv(.Int32 6)  i)
        e(dv(.Int32 7)  j)
        e(.Int32  k)
        e(dv(.Double 6.0)  x)
        e(dv(.Double 7.0)  y)
        e(.Double  z)
    )
    
    // Specify a clump of instructions. Clumps are data raw data used in the VIs
    // definition. They are not types.
    clump(1 
        // Instructions are types  
        Mul(i j k)   
        Print(k)
        Mul(x y z)
        Print(k)
    )
) ) )
~~~

In addition to the types defined in the example there are several types referenced (_Int32_, _Double_, _VirtualInstrument_, _Mul_ and _Print_). These types are defined in EggShell's root type manager and can be shared by all ExecutionContexts in the system. Before looking at the new types defined lets look at how some of these core types are defined:

###Int32 Type
All types ultimately describe data that is represented by a block of bits. For simple types like _Int32_ and _UInt32_ the definitions look like this:

~~~
     // Int32 is a cluster with one element that is a BitBlock of 32 bits
     // in signed 2's compliment encoding (SInt).
     define (Int32 c(e(bb(32 SInt))) )
     
     // The UInt32 type only differs by its encoding.
     define (UInt32 c(e(bb(32 UInt))) )     
~~~

Vireo includes built-in definitions for the integer types _UInt8_, _Int8_, _UInt16_, _Int16_, _UInt32_, _Int32_, _UInt64_ and _Int64_. Note that there is no restriction to powers of 2 or multiples of 8. User code can define an Int5 though it will need to define functions that work with that type as well. Clusters round the storage allocation up to smallest addressable unit that meets the alignment requirements for the target architecture.

###Double Type
Some of the primitive types provide more detail about their internals. The type _Double_ is has two definitions that are declared as equivalent. The first, like Int32, is a simple block of bits, in this case 64 bits in the [IEEE754B](http://en.wikipedia.org/wiki/IEEE_floating_point) encoding. The second definition defines the actual layout of the bits using a _BitCluster_ of BitBlocks. BitClusters differ from Clusters in that they pack their elements at the bit level.

Its common to think of an _Equivalence_ as a C union, however, for an Equivalence all members must be the same bit size and it must be valid to view data from any of the views at any time. C unions do not have these restrictions.

~~~
// The low level single bit block definition
define(DoubleAtomic     c(e(bb(64 IEEE754B))) )

// A definition that is more detailed
define(DoubleCluster 
    // This cluster contains a BitCluster, a packed set of BitBlock fields.
    c(e(bc(
        // Clusters or BitCluster elements can have field names.
        e(bb(1  Boolean)      sign) 
        e(bb(11 IntBiased)   exponent)
        e(bb(52 Q1)          fraction)
    )))
)

// The user level definition allows either to be used. The first one is the default.
define(Double eq(e(.DoubleAtomic) e(.DoubleCluster)) )
~~~

Vireo includes built-in definitions for the floating point types _Single_, _Double_, _ComplexSingle_ and _ComplexDouble_.

### VirtualInstrument Type
Internal types used in Vireo also have type definitions. Though the details are not going to be covered here, at the heart of a VirtualInstrument is a cluster of fields.

~~~
define (VirtualInstrument 
    a(c(                               
        e(.ExecutionContext Context)   
        e(a(.*) ParamBlock)             
        e(a(.*) DataSpace)              
        e(a(.VIClump *) Clumps)     // An array of clumps, see definition below.      
        e(.Int32 lineNumberBase)    // Internal fields for maping back to souce code    
        e(.DataPointer ClumpSourceBegin)
        e(.DataPointer ClumpSourceEnd)  
    ))
)

define (VIClump
    c(                                     
        e(.InstructionList CodeStart)         
        e(.DataPointer Next)                
        e(.DataPointer Owner)               
        e(.DataPointer NextWaitingCaller)   
        e(.DataPointer Caller)              
        e(.Instruction SavePC)              
        e(.Int64 WakeUpInfo)                
        e(.Int32 FireCount)                 
        e(.Int32 ShortCount)                
    )
)
~~~

Using a single type system to describe internal data structures and dynamically defined ones from user code makes it easier to consistently allocate, copy and free data the objects. It also makes it easier to develop functions core to the runtime in VIA source. It is not necessary to always use C++. In open system it makes it possible for code dig into the internals of core data structures, For example it possible to read a VIs array of clump and write a disassembler. In secure sand boxed mode these fields will not be accessible to most ExecutionContexts.
    
### Function Types
The signatures for internal functions are also defined as standard types. The type definitions describe the _Parameter Block_ used to pass parameters to the runtime function. Their syntax is similar to cluster definitions except that all elements must be designated as input, output, input-output. Since they are directly associated with C++ functions there are macro constructs that allow the C++ linker to associate the actual function address with each type definition. Here is what a few ParameterBlock type definitions from the examples look like:

~~~
// The print function takes one parameter, This is the raw parameter block definition
//
//            p(i(.StaticTypeAndData))
// 
// To bind the type to an actual function it will be part of the following:

DEFINE_VIREO_BEGIN(LabVIEW_FileIO)
    ... 
    DEFINE_VIREO_FUNCTION(Print, "p(i(.StaticTypeAndData))");
    ...
DEFINE_VIREO_END()
~~~

As noted, the Print function takes one parameter, but its a special one. The _StaticTypeAndData_ type instructs the VIA decoder to generate code that passes both the parameter explicitly listed and the statically derivable type, Since they are passed internally as two separate parameters there is no need to [box](http://en.wikipedia.org/wiki/Object_type_(object-oriented_programming)#Boxing) primtive data types.

~~~
DEFINE_VIREO_BEGIN(LabVIEW_Math)
    ...
    // If many functions take a common signature then the signare can be it own named
    // type. The Generic binOp type takes three anythings.
    DEFINE_VIREO_TYPE(GenericBinOp, "p(i(.*) i(.*) o(.*))")
    ...
    // The simple "Mul" function is generic. This means the function will be called at
    // load time and it will generate the appropriate runtime instruction. It is up
    // this function to determine if the types passed make sense.
    DEFINE_VIREO_GENERIC(Mul, ".GenericBinOp", EmitGenericBinOpInstruction);
    ...
    // The reference runtime does not generate cutoms code on the fly, it relies on
    // predefined primtitves. So the generic Mul function ends up binding to functions 
    // like the following:
    DEFINE_VIREO_FUNCTION(MulInt32,     ".BinOpInt32") 
    DEFINE_VIREO_FUNCTION(MulDouble,    ".BinOpDouble") 

DEFINE_VIREO_END()
~~~

#Types are values




#Type Manager scopes




#Type Manager class hierarchy
