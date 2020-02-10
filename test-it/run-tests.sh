#!/bin/sh
# Copyright (c) 2020 National Instruments
# SPDX-License-Identifier: MIT

#  Script.sh
#  CommandLine
#
#  Created by Paul Austin on 8/28/13.
#  Copyright (c) 2013 Paul Austin. All rights reserved.

if test -n "$1"; then
    TESTS="$1"
else
    TESTS=*.via
fi
mkdir -p results
for testFile in $TESTS
do
    resultFile="results/${testFile%.*}.vtr"
    echo "--- Running test $testFile" 
    # If results dont exist make them.
    # If they do, make temp copy and compare results
    if [ -e $resultFile ]
    then
        newResultFile="results/${testFile%.*}.vntr"
        esh $testFile | sed '/^\/\//d' >$newResultFile
        if  diff $resultFile $newResultFile >temp_test_result
        then
            rm $newResultFile
        else
            echo \n" $testFile results are different"
            cat temp_test_result
            echo "--------------------------------\n"
        fi
    else
        esh $testFile | sed '/^\/\//d' >$resultFile
        echo "Saving results for $testFile"
    fi
   # echo "--- Running $f test. with -dl"
   # esh $f -dl
done
rm temp_test_result

echo "--------------------------------\n"
# not test wont work if nullglob is on.
if ls results/*.vntr &> /dev/null; then
  echo "The following results are different from the expected."
  ls results/*.vntr
else
  echo "All results matched expected."
fi
echo "Number of outputs validated"
date >> runlog.txt
wc -l results/*.vtr  | tail -n 1
