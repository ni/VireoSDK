<!--
Copyright (c) 2020 National Instruments
SPDX-License-Identifier: MIT
-->

\defgroup VIA_Function_Reference VI Assembly and Function Reference

\defgroup VIA_Mathematics_VIs Mathematics
\ingroup VIA_Function_Reference

\defgroup VIA_Numeric_Functions Numeric Functions
\ingroup VIA_Mathematics_VIs

\defgroup VIA_Complex_Functions Complex Functions
\ingroup VIA_Numeric_Functions


\defgroup VIA_API_Complex_to_Polar ComplexToPolar
# Complex to Polar
ComplexToPolar (complex[in] r[out] theta[out])
## Breaks a complex number into its polar components.
| Parameter | Description |
| --- | --- |
| **complex** | It is polymorphic. It can be a complex number, array or cluster of complex numbers, an array of cluster of complex numbers, and so on. |
| **r** | It is the radial coordinate (r). It has the same data type structure as the input. |
| **theta** | It is the angular coordinate (theta). It has the same data type structure as the input. |
\ingroup VIA_Complex_Functions

\defgroup VIA_API_Complex_to_Real_Imaginary ComplexToReOrIm 
# Complex to Real/Imaginary
ComplexToReOrIm (complex[in] real[out] imaginary[out])
## Breaks a complex number into its rectangular components.
| Parameter | Description |
| --- | --- |
| **complex** | It is polymorphic. It can be a complex number, array or cluster of complex numbers, an array of cluster of complex numbers, and so on. |
| **real** | It is the real part. It has the same data type structure as the input, with scalar representation instead of complex. |
| **imaginary** | It is the imaginary part. It has the same data type structure as the input, with scalar representation instead of complex. |
\ingroup VIA_Complex_Functions

\defgroup VIA_API_Conjugate Conjugate
# Conjugate
Conjugate (complex[in] result[out])
## Produces the complex conjugate of x + iy
| Parameter | Description |
| --- | --- |
| **complex** | It is polymorphic. It can be a complex number, array or cluster of complex numbers, an array of cluster of complex numbers, and so on. |
| **result** | It is the complex conjugate of x + iy. |
\ingroup VIA_Complex_Functions

\defgroup VIA_API_Polar_to_Complex Polar
# Polar to Complex
Polar (r[in] theta[in] complex[out])
## Creates a complex number from two values in polar notation.
| Parameter | Description |
| --- | --- |
| **r** | It is the radial coordinate (r). It is polymorphic. It can be a scalar number, an array or cluster of numbers, an array of cluster of  numbers, and so on. |
| **theta** | It is the angular coordinate (theta). It is polymorphic. It can be a scalar number, an array or cluster of numbers, an array of cluster of  numbers, and so on. |
| **complex** | It has the same data type structure as r and theta inputs, with complex representation instead of scalar. |
\ingroup VIA_Complex_Functions

\defgroup VIA_API_Polar_to_Real_Imaginary PolarToReOrIm
# Polar to Real/Imaginary
PolarToReOrIm (r[in] theta[in] real[out] imaginary[out])
## Converts the polar components of a complex number into its rectangular components.
| Parameter | Description |
| --- | --- |
| **r** | It is the radial coordinate (r). It is polymorphic. It can be a scalar number, an array or cluster of numbers, an array of cluster of  numbers, and so on. |
| **theta** | It is the angular coordinate (theta). It is polymorphic. It can be a scalar number, an array or cluster of numbers, an array of cluster of  numbers, and so on. |
| **real** | It is the real part. It has the same data type structure as r and theta inputs. |
| **imaginary** | It is the imaginary part. It has the same data type structure as r and theta inputs. |
\ingroup VIA_Complex_Functions

\defgroup VIA_API_Real_Imaginary_to_Complex ReOrImToComplex
# Real/Imaginary to Complex
ReOrImToComplex (real[in] imaginary[in] complex[out])
## Creates a complex number from two values in rectangular notation.
| Parameter | Description |
| --- | --- |
| **real** | It is the real part. It can be a scalar number, array or cluster of numbers, array of clusters of numbers, and so on. |
| **imaginary** | It is the imaginary part. It can be a scalar number, array or cluster of numbers, array of clusters of numbers, and so on. |
| **complex** | It is the complex result. It has the same data type structure as the input, with complex representation instead of scalar. |
\ingroup VIA_Complex_Functions

\defgroup VIA_API_Real_Imaginary_to_Polar ReOrImToPolar
# Real/Imaginary to Polar
ReOrImToPolar (real[in] imaginary[in] r[out] theta[out])
## Converts the rectangular components of a complex number into its polar components
| Parameter | Description |
| --- | --- |
| **real** | It is the real part. It can be a scalar number, array or cluster of numbers, array of clusters of numbers, and so on. |
| **imaginary** | It is the imaginary part. It can be a scalar number, array or cluster of numbers, array of clusters of numbers, and so on. |
| **r** | It is the radial coordinate (r). It has the same data type structure as the inputs. |
| **theta** | It is the angular coordinate (theta). It has the same data type structure as the inputs. |
\ingroup VIA_Complex_Functions
