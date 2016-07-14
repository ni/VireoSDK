#!/usr/bin/python
import sys
import os
import re

if len(sys.argv) >= 2:
    destFile = sys.argv[1]
else:
    destFile = "../dist/vireo.js"

origFile = destFile+".prepatch"
try:
    os.rename(destFile, origFile)
except:
    sys.stderr.write("Cannot read " + destFile + "\n")
    sys.exit(1)

destination = open(destFile, "w")
source= open(origFile, "r")

regex1 = re.compile("if\s*\(!u0\)\s*return str;", 0)
regex2 = re.compile("if\s*\(val\s*!=\s*0\)\s*tty\.output\.push\(val\)", 0)
for line in source:
    line = regex1.sub("if(idx>u8Array.length)return str; /*bcs-don't stop at 0, allow embedded nulls*/", line)
    line = regex2.sub("tty.output.push(val)/*bcs-removed if(val!=0)*/", line)
    destination.write(line)
source.close()
destination.close()
print "Patched " + destFile + "; " + origFile + " saved as backup.\n"
sys.exit(0)
