# Build

## Prerequisites for all targets

### Software requirements

- [git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en/) (>=20, latest LTS release recommended)
- GNU Make and GNU core utilities (see following)

### Installing GNU Make and GNU core utilities

On Windows you can get these by installing the [Chocolatey](https://chocolatey.org/) package manager and then running the following commands to install GNU Make and the GNU core utilities:

   ```console
   choco install make
   choco install gnuwin32-coreutils.portable
   ```

For other platforms, see platform documentation for installing a compatible version of GNU make and GNU core utilities.

### Fetching tooling dependencies

On all platforms run the following in the `VireoSDK` folder to install JavaScript-based tooling needed for the test infrastructure:

   ```console
   npm install
   ```

## vireo.js target

### Software requirements

- [Python](https://www.python.org/) (>= 3.12)
- emsdk toolchain (see following)

Note: Windows 10 may include a a copy of python seen by running `which python` resulting in the path: `C:\Users\<USER>\AppData\Local\Microsoft\WindowsApps\python.exe`. Make sure to install a copy of python from `python.org`.

### Installing the emsdk toolchain

The emsdk toolchain is used to cross-compile Vireo to Vireo.js to run in Node.js and web browser environments.

1. Create a directory outside of the `VireoSDK` folder to store the emsdk toolchain binaries.

2. Clone the [juj/emsdk](https://github.com/juj/emsdk) GitHub repository

3. From the cloned emsdk repository run the following commands:

   ```console
   emsdk install 2.0.23
   emsdk activate 2.0.23
   emcc -v # should match the sdk version
   ```

NOTE: The above commands only add `emcc` to the path for your current shell session. The emsdk tool provides the `emsdk activate SOME_SDK_VERSION --global` option but there is a known issue where using the `--global` flag [hangs on Windows](https://github.com/juj/emsdk/issues/138).

Instead it is recommended that in a new shell where you wish to build Vireo you run the `emsdk_env.bat` (Windows) or `emsdk_env.sh` (Mac / Linux) from the emsdk folder to update your path variables for the shell session.

For more detailed information about emsdk see the [juj/emsdk](https://github.com/juj/emsdk) GitHub repository.

### Building vireo.js

To create a default (release) build of vireo.js:

```console
make js
```

The above default build of vireo.js is equivalent to:

```console
make js BUILD=release
```

To create a debug build of vireo.js:

```console
make js BUILD=debug
```

To create a profile build of vireo.js:

```console
make js BUILD=profile
```

Notice that vireo.js is created in the `dist` folder based on the `BUILD` type. For example, a default vireo.js build equivalent to `BUILD=release` will be located at: `dist/wasm32-unknown-emscripten/release/vireo.js`

## Vireo Windows Native target

### Software requirements

- Visual Studio 2022 with C++ support, specifically:
  - Windows 10 SDK (10.0.20348.0)
  - MSVC v142 - VS 2019 C++ x64/x86 build tools (v14.29)

### Building Vireo Windows Native

1. Open the `Vireo_VS/VireoCommandLine.sln` solution in Visual Studio
2. Perform a Debug build

Notice the esh executable placed in the `dist` folder.

## Vireo Linux Native target

### Software requirements

- GCC 4.9

### Building Vireo Linux Native

From the root directory run the following:

```console
make native
```

Notice the esh executable placed in the `dist` folder.

There is a flag you can pass to `make` to enable [AddressSanitizer](https://github.com/google/sanitizers/wiki/AddressSanitizer):

```console
make native ASAN=1
```

## Vireo MacOS Native target

### Software requirements

- XCode

### Building Vireo MacOS Native

Open the `Vireo_Xcode/VireoEggShell.xcodeproj`

If you prefer to build from the command line, the instructions for building Vireo Linux Native will work on macOS as well.
