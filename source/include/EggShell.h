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
    ExecutionContextRef _execContext;
    char*   _mallocBuffer;
    
public:
    NIError REPL(SubString *commandBuffer);
    NIError ReadFile(ConstCStr name, SubString *string);
    NIError ReadStdinLine(SubString *string);
    Boolean ShowStats;
    NIError Delete();    
    TypeManagerRef TheTypeManager()           { return _typeManger; }
    ExecutionContextRef TheExecutionContext() { return _execContext; }
    
private:
    EggShell(TypeManagerRef typeManger, ExecutionContextRef execContext);
    void ParseEnqueueVI(TDViaParser* parser);
};

} // namespace Vireo

#endif // EggShell_h
