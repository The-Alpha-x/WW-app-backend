import { env as workerEnv } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";

// Make Cloudflare bindings available to the existing validated env module
// before loading the Express app and its route/controller dependency graph.
globalThis.__WITCH_WOOFIE_ENV__ = workerEnv;

const { default: app } = await import("./app.js");

// Express's listener is adapted to the Workers fetch runtime by Cloudflare.
app.listen(3000);

export default httpServerHandler({ port: 3000 });
