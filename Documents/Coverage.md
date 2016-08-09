# Viewing the Test Coverage for Vireo

### Running the Coverage
There is already a `make` rule for generating the coverage report as an html page.

Requirements: (this was done on an Ubuntu Linux machine)
- A working build system for Vireo with a working binary and passing tests
- clang
- llvm-cov
- lcov

Then just run: `make coverage` in the `make-it/` directory.

The output coverage report for HTML will be created in the `make-it/` directory as: `html_coverage_output/'

