<!--
Copyright (c) 2020 National Instruments
SPDX-License-Identifier: MIT
-->

# Coding Guidelines

The Vireo reference implementation is in C++. These are some of the coding guidelines
the source code follows:

- Use C++ as little as possible. Many issues can be avoided following this one step.  The following is a bit of the reasoning behind this guideline.

- The runtime is a framework to build larger work on top of using the parallel MoC of G, the language of Virtual Instruments. As a reference implementation it is a pattern that can be used when writing implementations for platforms with languages that capture the core objectives and complexities of the underlying hardware or software platforms. For example, VHDL or Verilog for FPGAs, and JavaScript for browsers.  Code  written as VIs rarely needs to be rewritten.  In short, Vireo is not a C++ library to base C++ projects on. It a runtime for VI based projects.

   When C++ is used it is mainly C. C++ is used for simple class hierarchies, templates,
better inline notation. When templates (or macros) are used they should be thin so that
different instances don’t bloat code.  As a note, most of the classes the runtime will
see are defined dynamically at runtime anyway. C++’s more advanced features like RTTI
and exceptions are not used.

   Memory management is tracked per ExecutionContext, so Malloc and Free methods on the
Context are used for allocation, not malloc() or new(). The new placement operator is used.

- The C++ reference parameter notation is not used.

  ```cpp
  void Foo (Int& num);      // This format is not used
  ```

- For code formatting guidelines for parentheses and braces the Linux kernel coding style is followed, with one notable exception. Indentation is in steps of 4 spaces, not 8. If it helps, you can consider these “retina tabs”. Linus clearly has a good point on not nesting the code too deeply. Nonetheless, 4 characters leaves additional room for comments and it's our tradition. It allows more room for parallel windows, especially during comparisons.

  <https://www.kernel.org/doc/Documentation/CodingStyle>

  Since Vireo is C++ the “//” form of comments is more commonly used. It's common for
  this form to be avoided in C since it was not officially a standard for plain C
  until the C99 spec.

- Files are encoded in UTF-8, though mostly only simple 7 bit Ascii with no byte order marks. Each line is terminated with a Ascii line feed character. The Ascii horizontal tab character is not used. This reduces dependency on platform or tool settings.

- If you modify code in a file, adhere to the pattern of the code you modify. Don’t let your addition look like a bad paint job on a fender bender. Don’t repaint the whole car to match you new style either.

- These are guidelines. As a run-time engine the top goal is to provide the best performance possible. Platform specific language extensions or C programming techniques are used with ample comments where the benefit is of merit.

- Some C was used to bootstrap Vireo before LabVIEW could directly target it. When possible covert that C to G. See Rule 1.

- For token constants use #defines for C string literals, not character literals. This helps with token concatenation, and helps pave the way for multibyte UTF-8 code points.

- Doxygen notation is used for documentation generation
