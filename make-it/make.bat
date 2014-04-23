@echo off
REM build Vireo runtime exe and dll

rem IF not "%VisualStudioVersion%" == "" (GOTO :VisualStudioIsSetUp)
rem echo ** Visual Studio is not setup.
rem echo  You can  run one of the bacth files in this directory to set one up
rem echo  They are vc2010.bat, vc2012.bat, vc2013.bat. ( you already have to have a copy of visual studio installed) 
rem GOTO :the_end

:VisualStudioIsSetUp

IF "%1" == "clean" (
 del /q objs\*.* 2>NUL
 del /q asm\*.* 2>NUL
 echo Vireo objects deleted
GOTO :the_end
)
 mkdir asm 2>NUL
 mkdir objs 2>NUL
 set copts= /nologo /Oy- /c /DWIN32 /D_DEBUG /Zi /I..\source\include /MTd /Faasm\ /Foobjs\ /Fdobjs\vc100.pdb
 set linkCmd=/NOLOGO objs\*.obj /DEBUG /OUT:"..\bin\esh.exe"
IF "%1" == "dll" (
 set copts= %copts% /DVIREO_DYNAMIC_LIB
 set linkCmd=/NOLOGO /DLL objs\*.obj /DEBUG /OUT:"..\bin\esh.dll"
)

 @echo ON

 cl ..\source\core\VireoMerged.cpp %copts% 
 cl ..\source\core\EggShell.cpp %copts%
 cl ..\source\core\Thread.cpp %copts%
 cl ..\source\core\TimeTypes.cpp %copts%
 cl ..\source\io\FileIO.cpp %copts%
 cl ..\source\CommandLine\main.cpp %copts%
 cl ..\source\core\CEntryPoints.cpp %copts%
 
 link %linkCmd%
 @echo off

GOTO :the_end

:the_end
