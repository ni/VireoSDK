### Know what you are getting into ###
The Vireo repository is in a very green development phase. In it, there is a source directory, a unit test directory, directories for some common IDEs (Eclipse, XCode, Visual Studio) and one for building from the command line. At this point most development is done from XCode and the command line.

### Getting the source
The best way to get the source is from the git repository. You will need to make a bitbucket account at this point to get it. 
There are plenty of tips on the web for git. I am using SourceTree which I am pretty pleased with. Windows users that don't have git or ssh installed may find the bundled git support helpful. 

```bash
# If you have ssh set up it will look like this. If you use https your account name will also be included. 
git clone https://github.com/PaulAustin/Vireo.git
cd vireo
ls
AUTHORS		    LICENSE.txt	    Vireo_VS2012    bin		    sample-vis	    test-it
Documents	    README.md	    Vireo_XCode	    make-it		source
```

### Building Vireo

For Vireo, the egg shell comes first (esh). It's in a fledgling state. This is how to build it.
It will try to copy the binary to /usr/local/bin. 

### Linux/Unix
```bash
cd make-it
make v64

# esh should now be built and will be in the current directory. There is a make instal option
# that will copy it to /usr/local/bin (or Applicaiton folder for Macs). It is there for you convience 

make install
Password:########
 
cd ../test-it
esh HelloWorld.via

Hello World, I can fly.
```

### Windows 
```bash
# Launch a vcvasrall.bat shell for the Visual Studio tool chain you want to use (32 or 64 bit).
# Microsoft's compilers are not set up to run from the default command line shell. The make-it 
# directory has some batch files to help (vc2010.bat & vc2012.bat)

cd make-it
vc2012.bat          # set up compiler (in x86 mode) 
make.bat

# esh should now be built and copied to the bin folder in you vireo directory 
# ( ../bin from the make directory) you will need to add that directory to you system path. 
 
cd ../test-it
esh HelloWorld.via 

Hello World, I can fly.
```

### Runing unit tests
Now see if all is well for your platform. The run-tests script will load and run all via files in the directory.
Each run is compared with expected results that can be found in the results directory. If you add a via file it the initial results will be saved the first time you run run-tests. Note on windows, run-test, is a batch file the output is slightly different.

```
SDG (paulaustin)$ ./run-tests.sh 
--- Running test ArrayDefines.via
--- Running test BranchInstructions.via
--- Running test ClumpTriggerWait.via
.
.
.
--- Running test TicTock.via
--- Running test UserTypes.via
--- Running test VectorOps.via
--- Running test hw100.via

--------------------------------
All results matched expected.
Number of outputs validated
     1423 total
```

It's best to write tests before working on a feature. With the tests in place, you can use them to prove that it works the way you want. Remember to add the test AND the expected results to your submission or pull request.

### Building documentation
If you have doxygen installed the make tool can build that as well on Unix/Linux platforms

```
# From the root of the repo
cd make-it
make dox
cd ../Documents
open index.html
```

