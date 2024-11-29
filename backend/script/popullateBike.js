require("dotenv").config();

const Typesense = require("typesense");
const { MongoClient } = require("mongodb");

module.exports = (async () => {
  // Typesense Configuration
  const TYPESENSE_CONFIG = {
    nodes: [
      {
        host: process.env.TYPESENSE_HOST,
        port: process.env.TYPESENSE_PORT,
        protocol: process.env.TYPESENSE_PROTOCOL,
      },
    ],
    apiKey: process.env.TYPESENSE_ADMIN_API_KEY,
  };

  console.log("Config: ", TYPESENSE_CONFIG);

  const typesense = new Typesense.Client(TYPESENSE_CONFIG);

  const schema = {
    name: "ebikes",
    num_documents: 0,
    fields: [
      { name: "title", type: "string", facet: false },
      { name: "make", type: "string", facet: true },
      { name: "model", type: "string", facet: true },
    ],
  };

  // MongoDB Configuration
  const MONGO_URI =
    "mongodb+srv://hritikevfy:EvfyMongo123@evfy.ieqkt9f.mongodb.net/electrify?retryWrites=true&w=majority";
  const DB_NAME = "electrify"; // Your database name
  const COLLECTION_NAME = "bikemodels"; // Your collection name

  console.log("Connecting to MongoDB...");

  let ebikes = [];

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
  };

  try {
    console.log("Trying....");
    const client = new MongoClient(MONGO_URI, options);
    console.log("object: ", client);

    await client.connect();

    console.log("Trying...", client);

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Fetch all ebikes data
    ebikes = await collection.find({}).toArray();

    console.log(`Fetched ${ebikes.length} documents from MongoDB`);

    // Ensure MongoDB connection is closed
    await client.close();
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    return;
  }

  try {
    const collection = await typesense.collections("ebikes").retrieve();
    console.log("Found existing collection of ebikes");
    console.log(JSON.stringify(collection, null, 2));

    if (collection.num_documents !== ebikes.length) {
      console.log("Collection has different number of documents than data");
      console.log("Deleting collection");
      await typesense.collections("ebikes").delete();
    }
  } catch (err) {
    console.error(
      "No existing collection found. Proceeding to create a new one."
    );
  }

  console.log("Creating schema...");
  console.log(JSON.stringify(schema, null, 2));

  await typesense.collections().create(schema);

  console.log("Populating collection...");

  try {
    // Transform MongoDB documents to match Typesense schema
    const transformedEbikes = ebikes.map((ebike) => ({
      title: ebike.title || "",
      make: ebike.make || "",
      model: ebike.model || "",
    }));

    const returnData = await typesense
      .collections("ebikes")
      .documents()
      .import(transformedEbikes, { action: "upsert" }); // Use upsert to update or insert

    console.log("Return data: ", returnData);
  } catch (err) {
    console.error(err);
  }
})();
