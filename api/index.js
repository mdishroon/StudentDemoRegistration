// This file is for Vercel Functions; the details aren't really important, we
// just need it to make it work when deployed to Vercel.
// https://vercel.com/docs/functions/runtimes/node-js

import app from "../server.js";

app.use("/api", router);

export default app;
