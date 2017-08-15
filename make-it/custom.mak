# ********** IMPORTANT **********
# All the contents of this file should be commented when checked in.
# This file is ONLY for developers to turn on different flags for debugging
# purposes in their local machines. Any changes to compiler flags that affect
# distribution builds should be made in the actual Makefile's and not in this
# custom.mak file.
# *******************************
# Turn on the following flags to debug access violation exceptions
# EM_OPTFLAG = -s ASSERTIONS=2 -s SAFE_HEAP=1
#
# Turn on the following flags to enable debug builds. Highly recommended for 
# debugging with browser or nodejs
# EM_OPTFLAG = -gD
