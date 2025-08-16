import { DevServer } from "@ravenjs/wings/server";
import { router } from "./index.js";

const port = 3000;

const server = new DevServer(router);
server.listen(port).catch(console.error);

console.log(`🚀 Hello World server running at http://localhost:${port}`);
console.log(`📝 Edit examples/helloworld/index.js to see changes live`);
