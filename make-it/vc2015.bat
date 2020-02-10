echo off
rem Copyright (c) 2020 National Instruments
rem SPDX-License-Identifier: MIT

echo "Setting up Visual Studio 2015 (AKA v14.0) 32 bit build environment and deleting old objects files"
del /Q objs\*.* 2>NUL
call "C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\vcvarsall.bat" x86
echo
