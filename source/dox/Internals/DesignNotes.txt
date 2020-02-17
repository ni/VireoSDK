Copyright (c) 2020 National Instruments
SPDX-License-Identifier: MIT

A log of design decisions and other notes that do nto have a home of their own.

9/15/2014 Hex constants (and possibly binary constants)
SubString::ReadInt() has been extended to support the 0x1234ABCDE hex style notation common to many languages. One consideration is "Is the format an unsigned type?". Strickly speaking no, its simply considered a direct bit description format for the codec. That means the hex format describes the bits that will be stored in memory, four bits at a time. The last hex character in the token will represent the least significant nibble in the values allocated block of memory. This also means that unlike decimal numbers (e.g. 10 and -10) the negative sign '-' cannot be applied to hex constants. The negative sign is not considered a unary operator. It is simply part of the numeric value.

9/6/2014 Notes on using STL, and other C++ features.
Vireo usese very little STL, only the Map<> class since it fits the need well and does not pull in other dependencies.
Vireo does use the begin, end pointer design pattern for controlled sequences. So algorithymically hopefully STL users will feel somewhat at home. Also No Exceptions, and No RTTI is used.

9/5/2014 Note on "Ref" names like TypedArrayCoreRef vs TypedArrayCore*
While some obejects are frequently used as a values on the stack or inline in other objects.  Other types are used as objects that most alwasy allocated on the heap and refered to by a pointer. Type that fall into the second case have both a type for the core class and a ref type. some examples include (TypeCommon, TypeRef) (String, StringRef) (TypedArrayCore, TypedArrayCoreRef) The Ref types are typicaly just typedefs. Note that in many cases the memory allocated that will contian Ref values, is allocated by by dynamicall described types, so C++ constructors and the like that implement smart pointers cannot be relied on. This has been the pattern used in Vireo for some time, older code is being brought inline with this conventon.

9/5/2014 Documentation strategies
Most of the documentation for Vireo is in the source or in the dox folder in the source directory as *.md markdown files such as this one. Experiements have been done with wikis and separate word or iWork pages files but the results have never been very satisfactory. Thre have alwasy been tracking chages, making the tools easy to acess while developing tests or code, working ofline as well as online or working from differnet platforms.

9/5/2014 Some key design points to go into deeper.
    > Queues and lists that are integral to core objecs instead of separate conatainers
    > Using native tickcount on each platfrom instead of a unit like microseconds on all platfroms
    > The StringBuffer class, the core of efficient codecs.
    > EventLogs and Error handling strategies
    > Namesapces
    > Avoding new, delete and standard C++ constructors/destructors
    > Steps left to do for UTF8 support, and why UTF16 is not used.
    > Build strategies: BuildConfig.h and VireoMerged.cpp" and makefiles
    > Performance 
    > Ideas on JIT
    > Generic functions
    > Fucntion call validation for generic functions
    > Array views
    > Iterators

9/1/2014 inline constants
Basic inline constants have been added. This primarily helps in writing unit test. LabVIEW's via generator does not use this feature. Currently this will only work if the bound function has strick types (e.g. not the generic type "*")

8/25/2014 Token grammar and special characters
Upstream tools like LV place few restrictions on symbol names. VI can have spaces commas and many other special characters. For this reason generated via files had dummy names 'videf1' 'videf2'. The VIACodec now supports URL encoding of names so the name "Hello World" can be encoded "Hello%20World". In general, special characters like '+' '-' '%' are not special tokens. Unless they stand alone they are simply part of the token they are embedded in, all tokens in the VIA codec are separated only by space, tab or parens. As further restriction, tokens that are dictionary symbols can only contain {[A-Z] | [a-z] | [0-9] | '_' | '%'} and must not start with a number, other patterns are reserved for future use. As a result of this change, upstream tools can sanitize user symbol names by prepending their symbols with a character such as '_' and using %XX URL encoding for non alpha-num characters.

2012 : Use of lvalue declarator in C++ (e.g. Int32& param)
Vireo avoids using the lvalue declarator in order to make interop with simple C easier and to make pointer opertions clearer. In general there is no goal to hide pointer operations that will happen any way. This goes for the new rvalue declarator "&&" as well.
