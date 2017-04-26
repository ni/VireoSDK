/**
\defgroup VIAA_PI VI Assembly Application Programming Interface (API)
\defgroup VIAA_Complex Complex API
\ingroup VIAA_PI 
*/

/**
 * Breaks a complex number into its polar components.\brief 
 * \param 0 [in] It is polymorphic. It can be a complex number, array or cluster of complex numbers, an array of cluster of complex numbers, and so on.
 * \param 1 It is the radial coordinate (r). It has the same data type structure as the input.
 * \param 2 It is the angular coordinate (theta). It has the same data type structure as the input.
\ingroup VIA_Complex
*/
void ComplexToPolar() {}

/**
# Complex to Real/Imaginary
## Breaks a complex number into its rectangular components.
### Param 0 (input) 
It is polymorphic. It can be a complex number, array or cluster of complex numbers, an array of cluster of complex numbers, and so on.
### Param 1 (output) 
It is the real part. It has the same data type structure as the input, with scalar representation instead of complex.
### Param 2 (output) 
It is the imaginary part. It has the same data type structure as the input, with scalar representation instead of complex.
\ingroup VIAA_Complex
*/
void ComplexToReOrIm() {}

/*

\defgroup VIA_API_Conjugate Conjugate
# Conjugate
## Produces the complex conjugate of x + iy
### Param 0 (input) 
It is polymorphic. It can be a complex number, array or cluster of complex numbers, an array of cluster of complex numbers, and so on.
### Param 1 (output) 
It is the complex conjugate of x + iy.
\ingroup VIAA_Complex

\defgroup VIA_API_Polar_to_Complex Polar
# Polar to Complex
## Creates a complex number from two values in polar notation.
### Param 0 (input) 
It is the radial coordinate (r). It is polymorphic. It can be a scalar number, an array or cluster of numbers, an array of cluster of  numbers, and so on.
### Param 1 (input) 
It is the angular coordinate (theta). It is polymorphic. It can be a scalar number, an array or cluster of numbers, an array of cluster of  numbers, and so on.
### Param 2 (output) 
It has the same data type structure as r and theta inputs, with complex representation instead of scalar.
\ingroup VIAA_PI

\defgroup VIA_API_Polar_to_Real_Imaginary PolarToReOrIm
# Polar to Real/Imaginary 
## Converts the polar components of a complex number into its rectangular components.
### Param 0 (input) 
It is the radial coordinate (r). It is polymorphic. It can be a scalar number, an array or cluster of numbers, an array of cluster of  numbers, and so on.
### Param 1 (input) 
It is the angular coordinate (theta). It is polymorphic. It can be a scalar number, an array or cluster of numbers, an array of cluster of  numbers, and so on.
### Param 2 (output) 
It is the real part. It has the same data type structure as r and theta inputs.
### Param 3 (output) 
It is the imaginary part. It has the same data type structure as r and theta inputs.
\ingroup VIAA_PI

\defgroup VIA_API_Real_Imaginary_to_Complex ReOrImToComplex
# Real/Imaginary to Complex
## Creates a complex number from two values in rectangular notation.
### Param 0 (input) 
It is the real part. It can be a scalar number, array or cluster of numbers, array of clusters of numbers, and so on.
### Param 1 (input) 
It is the imaginary part. It can be a scalar number, array or cluster of numbers, array of clusters of numbers, and so on.
### Param 2 (output) 
It is the complex result. It has the same data type structure as the input, with complex representation instead of scalar.
\ingroup VIAA_PI

\defgroup VIA_API_Real_Imaginary_to_Polar ReOrImToPolar
# Real/Imaginary to Polar
## Converts the rectangular components of a complex number into its polar components
### Param 0 (input) 
It is the real part. It is polymorphic. It can be a scalar number, an array or cluster of numbers, an array of cluster of  numbers, and so on.
### Param 1 (input) 
It is the imaginary part. It is polymorphic. It can be a scalar number, an array or cluster of numbers, an array of cluster of  numbers, and so on.
### Param 2 (output) 
It is the radial coordinate (r). It has the same data type structure as real and imaginary inputs.
### Param 3 (output) 
It is the angular coordinate (theta). It has the same data type structure as real and imaginary inputs.
\ingroup VIAA_PI

*/
