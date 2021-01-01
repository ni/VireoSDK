<!--
Copyright (c) 2020 National Instruments
SPDX-License-Identifier: MIT
-->

## EBNF grammar for VIA assembly

The VIA grammar is based on simple parentesized lists and are closely related to
[s-expressions](http://en.wikipedia.org/wiki/S-expressions) used in the LISP programming
language and many of its derivatives.  The similarity is strongest for [data sets](#DataValue_EBNF) since they can nest arbitrarily deep.
[VIs](@ref VI_EBNF)  are distictly different though using a common format makes it easier to treat them as data as well

For clarity, the following EBNF grammar goes a bit further and defines the core elements for type, data and VI definitions. Note that terminal expressions for core types such as Int32 are not included since they are typically defined using lower level primitives.

### Grammar for types

~~~{.ebnf}
type                    := ( named_type 
                             | array 
                             | cluster | bit_cluster | equivalence | param_block 
                             | var_type | default_value_type
                           ) [ template_parameters ] 

named_type              := '.'  type_in_dictionary

 type_in_dictionary     := token that is a key for a type in the dictionary
	
							
array                   := 'a' '(' type dimension* ')'

  dimension             := variable_dimension | fixed_dimension | bounded_dimension

  variable_dimension    := wild_card

  fixed_dimension       := whole_number_token

  bounded_dimension     := negative_number_token


cluster                 := 'c'  '(' cluster_element* ')'

param_block             := 'p'  '(' cluster_element* ')'

equivalence             := 'eq' '(' cluster_element* ')'

bit_cluster             := 'bc' '(' cluster_element* ')'

cluster_element         := 'element_usage_type '(' type [element_name] ')'

  element_usage_type    := 'e' | 'i' | 'io' | 'o' | 's' | 't' | 'x' | 'im' | 'al'

  element_name          := token

bit_block               := 'bb' '(' bit_count encoding ')'

  bit_count             := natural_number_token

  encoding              := 'Cluster' | 'ParamBlock' | 'Array' | 'Generic' |
                         | 'Boolean' | 'UInt' | 'S2cInt' | 'Unicode' | 'Ascii'
                         | 'BiasedInt' | 'IEEE754B' | 'Pointer'
                         | 'Q' | 'Q1' |

default_value_type      := 'dv' '(' type { data_element } ')'

var_type                := 'var' '(' type { data_element } ')'

template_parameters     := '<' type* '>'

~~~

### Grammar for data values {#DataValue_EBNF}

~~~{.ebnf}
data_element             := [ element_name ':'] ( token | data_collection | data_vi )

data_collection          := '(' data_element* ')'
~~~

### Grammar for a VI expressed as a value {#VI_EBNF}

~~~{.ebnf}
data_vi	                 := '('
                                data_element*
                                data_clump*
                             ')'

data_clump              := 'clump' '(' data_instruction* ')'

data_instruction        := instruction_name '(' instruction_argument* ')'

instruction_name        := 'Perch' | 'FireCount' | type_name

instruction_argument    := token | wild_card
~~~

### Grammar rules for low level tokens

~~~
whole_number_token      := token that is a legal number >= 0
 
natural_number_token    := token that is a legal number > 0

negative_number_token   := token that is a legal number < 0

token                   := quoted_string | non_white_sp_string

  quoted_string         := escaped_quoted_string | literal_quoted_string

  escaped_quoted_string := ('”' | '’') characters_possibly_with_escapes ('”' | '’')
                          // Surrounding quotes must match, escapes are \n\r etc.
                          // Escape sequences are converted when initialy parsed.

  literal_quoted_string := '@' ('”' | '’') raw_characters ('”' | '’')
                          // Surrounding quotes must match, raw characters cannot
                          // contain the encompassing quote character. escape sequences 
                          // are ignored and are left as the raw characters.

non_white_sp_string     := { letter_char | number_char | symbol_char }

symbol_char             := '.' | '_' | '+' | '-' | '#' | '@' | '%' | '$' | '&'
                         | '!' | '^' | '~' | wild_card

letter_char             := [a-z] | [A-Z] | [non-ascii-unicode chars]

number_char             := [0-9]

wild_card               := '*'

white_space             := ( cr | lf | ht )*
                         // White space can occur before any terminal pattern
                         // for simplicity, this has not be annotated
                         // in the grammar described above

~~~
