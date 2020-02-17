# Copyright (c) 2020 National Instruments
# SPDX-License-Identifier: MIT

{
  "targets": [
    {
      "target_name": "vireo",
      "sources": 
        [ 
            "../source/core/EggShell.cpp",
            "../source/core/VireoMerged.cpp",
            "../source/core/Thread.cpp",
            "../source/core/TimeTypes.cpp",
            "../source/core/CEntryPoints.cpp",
            "../source/bindings/NodeJSBinding.cpp",
        ],
        "include_dirs": [ "../source/include" ]
    }
  ]
}
