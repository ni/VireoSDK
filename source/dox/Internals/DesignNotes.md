A log of design decisions and other notes that do nto have a home of their own.




9/5/2015 Note on "Ref" names like TypedArrayCoreRef vs TypedArrayCore*
While some obejects are frequently used as a values on the stack or inline in other objects.  Other types are used as objects that most alwasy allocated on the heap and refered to by a pointer. Type that fall into the second case have both a type for the core class and a ref type. some examples include (TypeCommon, TypeRef) (String, StringRef) (TypedArrayCore, TypedArrayCoreRef) The Ref types are typicaly just typedefs. Note that in many cases the memory allocated that will contian Ref values, is allocated by by dynamicall described types, so C++ constructors and the like that implement smart pointers cannot be relied on. This has been the pattern used in Vireo for some time, older code is being brought inline with this conventon.

5/5/2015 Documentation strategies
Most of the documentation for Vireo is in the source or in the dox folder in the source directory as *.md markdown files such as this one. Experiements have been done with wikis and separate word or iWork pages files but the results have never been very satisfactory. Thre have alwasy been tracking chages, making the tools easy to acess while developing tests or code, working ofline as well as online or working from differnet platforms.

5/5/2015 Some key design points to go into deeper.
    > Queues and lists that are integral to core objecs instead of separate conatainers
    > Using native tickcount on each platfrom instead of a unit like microseconds on all platfroms
    > The StringBuffer class, the core of efficient codecs.
    > EvenLogs and Error handeling strategies
    > Namesapces
    > Avoding new, delete and standard C++ constructors/destructors
    > Steps left to do for UTF8 support, and why UTF16 is not used.
    > Build strategies: BuildConfig.h and VireoMerged.cpp" and makefiles
    > Performance 
    > Ideas on JIT
    > Generic funcitons
    > Fucntion CallValidation
    > Array views
    > Iterators

9/1/2014 inline constants

8/25/2014 Token grammar and special characters
Upstream tools like LV place few restrictions on symbol names. VI can have spaces commas and many other special characters. For this reason generated via files had dummy names 'videf1' 'videf2'. The VIACodec now supports URL encoding of names so the name "Hello World" can be encoded "Hello%20World". In general, special characters like '+' '-' '%' are not special tokens. Unless they stand alone they are simply part of the token they are embedded in, all tokens in the VIA codec are separated only by space, tab or parens. As further restriction, tokens that are dictionary symbols can only contain {[A-Z] | [a-z] | [0-9] | '_' | '%'} and must not start with a number, other patterns are reserved for future use. As a result of this change, upstream tools can sanitize user symbol names by prepending their symbols with a character such as '_' and using %XX URL encoding for non alpha-num characters.


2012 : Use of lvalue declarator in C++ (e.g. Int32& param)
Vireo avoids using the lvalue declarator in order to make interop with simple C easier and to make pointer opertions clearer. In general there is no goal to hide pointer operations that will happen any way. This goes for the new rvalue declarator "&&" as well.















