<!--
Copyright (c) 2020 National Instruments
SPDX-License-Identifier: MIT
-->

Version of utf8cpp that is used:
https://github.com/nemtrif/utfcpp/releases/tag/v2.3.5

Github repo and documentation:
https://github.com/nemtrif/utfcpp

Changes to files under utt8cpp below (rest of the files are used as-is):
utfcpp\source\utf8.h:
The change is to ifdef out including "utf8/checked.h" since Vireo.js is built with -fno-exceptions
