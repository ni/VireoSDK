#!/bin/bash
# Copyright (c) 2020 National Instruments
# SPDX-License-Identifier: MIT

echo "// Via file for LabVIEW's EggShell" >hw$1.via
for (( c=0; c<=$1; c++ ))
do 
    echo "define(HelloWorld$c v(.VirtualInstrument ("  >>hw$1.via
    echo "c( e(v(.String 'Hello World$c.')  variable1) ) \n" >>hw$1.via
    echo  "1  clump(1  Println(variable1) )) ) )" >>hw$1.via
    echo \n" " >>hw$1.via
done
echo "enqueue(HelloWorld$1)" >>hw$1.via
