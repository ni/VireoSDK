echo off
echo "Setting up Visual Studio 2012 32 bit build environment and deleting old objects files"
del /Q objs\*.* 2>NUL
call "C:\Program Files (x86)\Microsoft Visual Studio 12.0\VC\vcvarsall.bat" x86
echo
