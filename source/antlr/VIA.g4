/**

Copyright (c) 2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

// TODO UTF-8 adaptations needed.

grammar VIA;

viaStream
    : symbol (symbol)*
    ;

symbol
    : NAMED_SYMBOL
    | literal
    | temaplate
    | invoke
    | viaCollection
    | jsonishArray
    | jsonishCluster
    ;

literal
    : STRING
    | NUMBER
    | BOOLEAN
    ;

//------------------------------------------------------------
// Aggregates, a few options are under consideration.

// Via collections covers array and cluster initializers
viaCollection
    : '('  element* ')' ;

// JSON arays use square brackes and use commas (optional in via)
jsonishArray
    : '[' symbol? (','? symbol)* ']' ;

// JSON arays use curly braces and use commas (optional in via)
jsonishCluster
    : '{' (fieldName symbol)? (','? fieldName symbol)* '}' ;


//------------------------------------------------------------
// Symbols can be used in three forms,
// Simple, templated, and call.

// Simple is a the symbol token followed by WS
NAMED_SYMBOL: SYMBOL_CORE ;

// Template is a the symbol token followed by '<' no WS
temaplate: TEMPLATED_SYMBOL element* CLOSE;
TEMPLATED_SYMBOL: SYMBOL_CORE OPEN_TEMPLATE ;
fragment OPEN_TEMPLATE: '<';
CLOSE: '>';

// Invoke is a the symbol token followed by '(' no WS
invoke: INVOKE_SYMBOL element* CLOSE_INVOKE;
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
fragment PERCENT_ESC : '%' ((HEX_CAP HEX_CAP) | (HEX_LC HEX_LC));

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
BOOLEAN
    : 'true'
    | 'false'
    ;

//------------------------------------------------------------
// Numbers, both integer and IEEE754. Adapted from ANTLR's
// JSON grammar numeric key words have to be excluded from
// gerenal symbols.
NUMBER
    :   '-'? INT '.' [0-9]+ EXP?    // 1.35, 1.35E-9, 0.3, -4.5
    |   '-'? INT EXP                // 1e10 -3e4
    |   '-'? INT                    // -3, 45
    |   '0x' (HEX_LC* | HEX_CAP*)   // 0xFFF, oxff
    |   '0b' [01]*                  // 0b0010011
    |   [+\-]? ('nan' | 'NaN')
    |   [+\-]? ('inf' | 'Infinity')
    ;

// Numbers should not be followed by symbol charactes.
// This matches that pattern.
INVALIDNUMBER : NUMBER [0-9a-zA-Z_.]* ;

fragment INT :   '0' | [1-9] [0-9]* ; // no leading zeros
fragment EXP :   [Ee] [+\-]? INT ;    // \- since - means "range" inside [...]

//------------------------------------------------------------
// Things to ignore
WS : [ \t\n\r]+ -> skip ;

//   /* Block coment */
BLOCK_COMMENT : ('/*' .*? '*/') -> skip ;

//   // Comment to end of line
LINE_COMMENT : ('//' ~[\r\n]*) -> skip ;