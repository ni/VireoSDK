/**

Copyright (c) 2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

grammar VIA;

// TODO UTF-8 adaptations needed.

viaStream
    : symbol (symbol)*
    ;

symbol
    : literal
    | temaplateSymbol
    | invokeSymbol
    | viaCollection
    | jsonishArray
    | jsonishCluster
    | SIMPLE_SYMBOL
    ;

literal
    : BOOLEAN
    | NUMBER
    | STRING
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
    :   '-'? INT '.' [0-9]+ EXP?    // 1.35, 1.35E-9, 0.3, -4.5
    |   '-'? INT EXP                // 1e10 -3e4
    |   '-'? INT                    // -3, 45
    |   '0x' (HEX_LC* | HEX_CAP*)   // 0xFFF, oxff
    |   '0b' [01]*                  // 0b0010011
    |   [+\-]? NOT_A_NUMBER
    |   [+\-]? INFINITY
    ;

fragment INT :   '0' | [1-9] [0-9]* ; // no leading zeros
fragment EXP :   [Ee] [+\-]? INT ;    // \- since - means "range" inside [...]

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

    TEMPLATED_SYMBOL: SYMBOL_CORE OPEN_TEMPLATE ;

    fragment OPEN_TEMPLATE: '<';

    CLOSE_TEMPLATE: '>';

// Invoke is a the symbol token followed by '(' no WS
invokeSymbol: INVOKE_SYMBOL element* CLOSE_INVOKE;

    INVOKE_SYMBOL: SYMBOL_CORE OPEN_INVOKE;

    fragment OPEN_INVOKE: '(';

    CLOSE_INVOKE: ')';

// Elements can be prefixed by a name.
// Names are used as cluster field names or
// parameter names for templates or invoke expressions.
element : (fieldName? symbol) ;

// Field names be symbols, or quoted strings
// Quoted strings allow for JSON style inializers
fieldName: FIELD_NAME ;
FIELD_NAME:  (SYMBOL_CORE | ESCAPED_STRING) ':' ;

// Need to extend to full UTF-8 set.
fragment SYMBOL_CORE : ('*' | (PERCENT_ESC | [._a-zA-Z]) (PERCENT_ESC | [._a-zA-Z0-9])*) ;
//fragment SYMBOL_VERBATIM : '\\' ('\\\\' | ~[\\])* '\\' ;
fragment SYMBOL_VERBATIM : '|' ('\\\\' | ~[|])* '|' ;
fragment PERCENT_ESC : '%' ((HEX_CAP HEX_CAP) | (HEX_LC HEX_LC));

//------------------------------------------------------------
// Things to ignore
WS : [ \t\n\r]+ -> skip ;

//   /* A block comment */
BLOCK_COMMENT : ('/*' .*? '*/') -> skip ;

//   // A comment to end of line
LINE_COMMENT : ('//' ~[\r\n]*) -> skip ;
