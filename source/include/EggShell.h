/**
 
Copyright (c) 2014-2015 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief An inital REPL fro Vireo
 */

#ifndef EggShell_h
#define EggShell_h

namespace Vireo
{
 
class TDViaParser;

//! EggShell.cpp - The basics of a simple REPL processor for Vireo
class EggShell
{
public:
    static EggShell* Create(EggShell* parent);

private:
    TypeManagerRef _typeManger;
    
public:
    NIError REPL(SubString *commandBuffer);
    Boolean ShowStats;
    void Delete();
    TypeManagerRef TheTypeManager()  { return _typeManger; }
    
private:
    EggShell(TypeManagerRef tm);
};

} // namespace Vireo

#endif // EggShell_h
