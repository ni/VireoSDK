vireo = require('./objs/vireo.js')

var text = 'define (HelloWorld dv(.VirtualInstrument (\n' + 
    'Locals: c(e(dv(.String "Hello, world. I can fly.你好世界。我能飛。") variable1))\n' +
    'clump (Println(variable1)) ) ) )\n\n\n'  +
    'enqueue (HelloWorld)\n'

vireo.loadVia(text);
vireo.executeSlices(1000);

message = vireo.readString('HelloWorld', 'variable1');
console.log('{' + message + '}');

//vireo.writeString('HelloWorld', 'variable1','你好世界。');
message = vireo.readString('HelloWorld', 'variable1');
console.log('{' + message + '}');
