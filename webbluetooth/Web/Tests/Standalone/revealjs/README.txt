To build the demo do the following:

1) From this directory, run the command 'npm install'
    - This only needs to be done the first time the demo is run
    - You may see some errors during npm install about native modules failing to build. This should be safe to ignore
   
2) From this directory execute 'npm run start'
    - This will generate an index.html file in the directory and open a browser window that points to the generated file
    - While the comamnd is running, any changes to documents in the '/files' folder will cause the page to automatically rebuild (still need to manually refresh the page)

DO NOT check in the 'node_modules' folder or the generated 'build/index.html' file