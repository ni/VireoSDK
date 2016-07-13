# Blacklisted Tests

This is a simple list of tests that currently provide false positives and need to be addressed before being added back into the list of running tests.
-------------------------------|-------------------------------------
filename                       | reason
-------------------------------|-------------------------------------
Canvas2DBezierCurveTo.via      | It throws an exception and stops test execution
BootCamp-Clip1.via             | It fails, expected output is not the same
DebugGPIO.via                  | It fails, expected output is not the same
FlattenAoS.via                 | It fails, expected output is not the same
FlattenArray.via               | It fails, expected output is not the same
FlattenCoA.via                 | It fails, expected output is not the same
GlobalCrossTalk.via            | It fails, expected output is not the same
HelloRequire.via               | It fails, expected output is not the same
Linx.via                       | It fails, expected output is not the same
StringEscapes.via              | It fails, expected output is not the same
