<!--
Copyright (c) 2020 National Instruments
SPDX-License-Identifier: MIT
-->

# cpplint

[cpplint.py](https://github.com/cpplint/cpplint/blob/851ceb00cba6301b00167cf5c313532bc05cf1eb/cpplint.py) is a Google tool for checking common style rules common to the
VireoSDK projects as well. It has its own copyright that is included at the
top of cpplint.py.

The initial VireoSDK check-in of cpplint.py is based on the original
source from the URL above. Small modifications may be made specific to
this project, and are reflected in the history of that file.

Noted items allowed:

1. namespace using directives are permitted.
2. Lines longer than 80 characters are OK, avoid lines longer 120 characters.
3. For now c style casts are still permitted.
