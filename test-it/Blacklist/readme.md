# Blacklisted Tests

This is a simple list of tests that currently provide false positives and need to be addressed before being added back into the list of running tests.

filename                       | reason
-------------------------------|-------------------------------------
Canvas2DBezierCurveTo.via      | It throws an exception and stops test execution
HelloRequire.via               | It fails, expected output is not the same
