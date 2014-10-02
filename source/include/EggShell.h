/**
 
Copyright (c) 2014 National Instruments Corp.
 
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
    Int64   _commandCount;
    
public:
    NIError REPL(SubString *commandBuffer);
    NIError ReadFile(const char* name, SubString *string);
    NIError ReadStdinLine(SubString *string);
    Int64   CommanCount() { return _commandCount;}
    Boolean ShowStats;
    NIError Delete();    
    TypeManagerRef TheTypeManager()           { return _typeManger; }
    ExecutionContextRef TheExecutionContext() { return _execContext; }
    
private:
    EggShell(TypeManagerRef typeManger, ExecutionContextRef execContext);
    void ParseEnqueueVI(TDViaParser* parser);
    void ParseDefine(TDViaParser* parser);
};

} // namespace Vireo

#endif // EggShell_h
