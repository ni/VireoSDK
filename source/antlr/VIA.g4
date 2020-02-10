// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

grammar VIA;

// TODO UTF-8 adaptations needed.

//------------------------------------------------------------
// The VIA streamis a series of symobl expressions.
viaStream
    : symbol (symbol)*
    ;

//------------------------------------------------------------
// Symbols in Vireo represent a value encoded in some
// structure of bits. A symbol can be used for its value
// or for properties of the structure that hold the value.
symbol
    : literal               // 42, true, "Hello"
    | temaplateSymbol       // Queue<Int32>
    | invokeSymbol          // Add(4 x z)
    | SIMPLE_SYMBOL         // Pi
    ;

//------------------------------------------------------------
// Literals are pure values. Once loaded a symbol will be
// created using an appropriate strcutre that can contain
// the value. Collections may be a mix of pure values
// and symbols.
literal
    : BOOLEAN               // true, false
    | NUMBER                // 42, 3.14
    | STRING                // "Hello"
    | viaCollection         // (1 2 3 4)
    | jsonishArray          // [1,2,3,4]
    | jsonishCluster        // {"x":1,"y":1}
    ;

//------------------------------------------------------------
// Aggregates, a few options are under consideration.

// Via collections covers array and cluster initializers
viaCollection
    : '(' element* ')' ;

// JSON arays use square brackes and use commas (optional in via)
jsonishArray
    : '[' symbol? (','? symbol)* ']' ;

// JSON "clusters" use curly braces and use commas (optional in via)
jsonishCluster
    : '{' (fieldName symbol)? (','? fieldName symbol)* '}' ;

//------------------------------------------------------------
// Strings come in two formats.
STRING: (ESCAPED_STRING | VERBATIM_STRING);

//------------------------------------------------------------
// Escaped strings have C / JSON like back slash escapes
// and must fit on a sinlge line.
fragment ESCAPED_STRING
    : (ESCAPED_SQ | ESCAPED_DQ);

fragment ESCAPED_SQ : '\'' (ESC | ~[\'\\\n\r])* '\'' ;
fragment ESCAPED_DQ : '"' (ESC |  ~["\\\n\r])* '"' ;

fragment ESC : ('\\' (["\'\\/bfnrt])) ;
fragment HEX : [0-9a-fA-F] ;

// Support upper or lower case hex but avoid mixing the two
fragment HEX_CAP : [0-9A-F] ;
fragment HEX_LC : [0-9a-f] ;

//------------------------------------------------------------
// Verbatim strings continue until the mathcing delimeter.
// As the name implies it's verbatim so there is no way to
// escape the initial delimeter.
fragment VERBATIM_STRING
    : '@' (VERBATIM_SQ | VERBATIM_DQ);

fragment VERBATIM_SQ : '\'' (~[\'])* '\'';
fragment VERBATIM_DQ : '"' (~["])* '"';

//------------------------------------------------------------
// Boolean literals.
BOOLEAN : 'true' | 'false' ;

//------------------------------------------------------------
// Numbers, both integer and IEEE754. Adapted from ANTLR's
// JSON grammar. Numeric key words have to be excluded from
// gerenal symbols.
NUMBER
    :   '-'? INT '.' [0-9]+ EXP?    // 505.0,
    |   '-'? INT EXP                // 3.14e10, 3.14-e10
    |   '-'? INT                    // -3, 45
    |   '0x' (HEX_LC* | HEX_CAP*)   // 0xFFF, 0xff (don't mix capitalization)
    |   '0b' [01]*                  // 0b0010011
    |   [+\-]? NOT_A_NUMBER
    |   [+\-]? INFINITY
    ;

fragment INT :   '0' | [1-9] [0-9]* ; // Don't allow leading zeros.
fragment EXP :   [Ee] [+\-]? INT ;

fragment INFINITY : ('inf' | 'Infinity') ;
fragment NOT_A_NUMBER : ('nan' | 'NaN') ;

// Numbers should not be followed by symbol characters.
// This token matches that pattern.
INVALID_NUMBER : NUMBER [0-9a-zA-Z_.]* ;

//------------------------------------------------------------
// Symbols can be used in three forms,
// (1)simple, (2)templated, and (3)invoke.

// Simple is a the symbol token followed by WS
SIMPLE_SYMBOL: SYMBOL_CORE | SYMBOL_VERBATIM;

// Template is a the symbol token followed by '<' no WS
temaplateSymbol: TEMPLATED_SYMBOL element* CLOSE_TEMPLATE;

    TEMPLATED_SYMBOL: SIMPLE_SYMBOL OPEN_TEMPLATE ;

    fragment OPEN_TEMPLATE: '<';

    CLOSE_TEMPLATE: '>';

// Invoke is a the symbol token followed by '(' no WS
invokeSymbol: INVOKE_SYMBOL element* CLOSE_INVOKE;

    INVOKE_SYMBOL: SIMPLE_SYMBOL OPEN_INVOKE;

    fragment OPEN_INVOKE: '(';

    CLOSE_INVOKE: ')';

// Elements can be prefixed by a name.
// Names are used as cluster field names or
// parameter names for templates or invoke expressions.
element : (fieldName? symbol) ;

// Field names can be symbols, or quoted strings
// Quoted strings allow for JSON style inializers
fieldName: FIELD_NAME ;
FIELD_NAME:  (SYMBOL_CORE | ESCAPED_STRING) ':' ;

    // Need to extend to full UTF-8 set.
    fragment SYMBOL_CORE : ('*' | (PERCENT_ESC | [._a-zA-Z]) (PERCENT_ESC | [._a-zA-Z0-9])*) ;

    // PERCENT_ESC encoding uses the %XX encodings pattern that is part of
    // RFC 1738. for example a space ' ' is %20
    fragment PERCENT_ESC : '%' ((HEX_CAP HEX_CAP) | (HEX_LC HEX_LC));

    // SYMBOL_VERBATIM uses back slashes to delimit names with
    // special characters. VHDL-93 calls this an 'extended identified'.
    fragment SYMBOL_VERBATIM : '\\' ('\\\\' | ~[|])* '\\' ;

//------------------------------------------------------------
// Things to ignore
WS : [ \t\n\r]+ -> skip ;

//   /* A block comment */
BLOCK_COMMENT : ('/*' .*? '*/') -> skip ;

//   // A comment to end of line
LINE_COMMENT : ('//' ~[\r\n]*) -> skip ;
