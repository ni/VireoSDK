
/*! \file
    \brief The EBNF grammar for VI assembly files, both data and code.
 */

/**

// EBNF grammar for raw types
type						:= named_type | array | cluster | default_value_type 
							 | bit_cluster | equivalence | param_block

named_type				:= '.'  type_in_dictionary

 type_in_dictionary		:= token that is a key for a type in the dictionary
	
							
array                       := 'a' '(' type dimension* ')'

  dimension                 := variable_dimension | fixed_dimension | bounded_dimension

  variable_dimension	:= wild_card

  fixed_dimension		:= whole_number_token

  bounded_dimension		:= negative_number_token


cluster 					:= 'c'  '(' cluster_element* ')' 

param_block 				:= 'p'  '(' cluster_element* ')' 

equivalence 				:= 'eq' '(' cluster_element* ')' 

bit_cluster 				:= 'bc' '(' cluster_element* ')'

cluster_element 			:= 'element_usage_type '(' type [element_name] ')'

  element_usage_type	:= 'e' | 'i' | 'io' | 'o' | 's' | 't' | 'x' | 'im'

  element_name			:= token

bit_block					:= 'bb' '(' bit_count encoding ')'

  bit_count				:= natural_number_token

  encoding				:= 'Boolean' | 'Bits' | 'Enum' 
							 | 'UInt' | 'SInt' | 'Unicode' | 'Ascii' 
							 | 'IntBiased' | 'IEEE754B' | 'Pointer'
							 | 'Generic'

default_value_type		:= 'dv' '(' type data_element ')'


// EBNF rules for data (data validation and parsing is directed by a type)
data_element				:= token | data_collection | data_vi

data_collection		 	:= '(' data_element* ')'
 

// EBNF rules for a VI in data form 
data_vi					:= '(' 
									parameter_type? dataspace_type 
									clump_count 
									data_clump* 
								')' 

parameter_type			:= type

dataspace_type			:= type

data_clump				:= 'clump' '(' fire_count data_instruction* ')'

fire_count				:= whole_number_token

data_instruction			:= instruction_name '(' instruction_argument* ')'

instruction_name			:= 'Perch' , type_name

instruction_argument	:= token | wild_card
								// 

// EBNF rules for low level tokens.
whole_number_token		:= token that is a legal number >= 0
 
natural_number_token	:= token that is a legal number > 0

negative_number_token	:= token that is a legal number < 0

token 						:= quoted_string | non_white_sp_string

  quoted_string			:= escaped_quoted_string | simple_quoted_string   

  escaped_quoted_string	:= ('”' | '’') characters_possibly_with_escapes ('”' | '’')
								// surrounding quotes must match, escapes are /n/r etc. 

  literal_quoted_string	:= '@' ('”' | '’') raw_characters ('”' | '’')
								// surrounding quotes must match, raw characters cannot
								// contain the encompassing quote character 

non_white_sp_string		:= { letter_char | number_char | symbol_char }

symbol_char				:= '.' | '_' | '+' | '-' | '#' | '@' | '%' | '$' | '&' 
							 | '!' | '^' | '~' | wild_card

letter_char 				:= [a-z] | [A-Z] | [non-ascii-unicode chars]

number_char				:= [0-9]

wild_card					:= '*'

white_space				:= ( cr | lf | ht )*
							// white space can occur before any terminal pattern 
							// for simplicity, this has not be annotated
							// in the grammar described above

*/