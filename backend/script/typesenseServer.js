const { exec } = require("child_process");
const path = require("path");
require("dotenv").config();

const API_KEY = process.env.TYPESENSE_ADMIN_API_KEY;
const PORT = 8108;

// Get the absolute path to the data directory
const dataDir = path.resolve(process.cwd(), "typesense-server-data");

// Docker command
const command = `docker run -d -p ${PORT}:8108 -v "${dataDir}:/data" \
typesense/typesense:0.25.0 --data-dir /data --api-key=${API_KEY} --listen-port ${PORT} --enable-cors`;

console.log("Running command: ", command);

exec(command, (err, stdout, stderr) => {
  if (!err && !stderr) {
    console.log("Typesense Server is running...");
    console.log("Server output: ", stdout);
    return;
  }

  if (err) {
    console.log("Error running server: ", err);
  }

  if (stderr) {
    console.log("Error running server: ", stderr);
  }
});
