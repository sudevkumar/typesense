require("dotenv").config();
const Typesense = require("typesense");
const { MongoClient } = require("mongodb");

(async () => {
  const typesense = new Typesense.Client({
    nodes: [
      {
        host: process.env.TYPESENSE_HOST || "localhost",
        port: process.env.TYPESENSE_PORT || 8108,
        protocol: process.env.TYPESENSE_PROTOCOL || "http",
      },
    ],
    apiKey: process.env.TYPESENSE_ADMIN_API_KEY,
  });

  const schema = {
    name: "ecars",
    num_documents: 0,
    fields: [
      { name: "title", type: "string", facet: false },
      { name: "make", type: "string", facet: true },
      { name: "model", type: "string", facet: true },
    ],
  };

  const MONGO_URI = process.env.MONGO_URI;
  const DB_NAME = "electrify";
  const COLLECTION_NAME = "carmodels";

  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();

    const db = client.db(DB_NAME);
    const ecars = await db.collection(COLLECTION_NAME).find({}).toArray();

    console.log(`Fetched ${ecars.length} documents from MongoDB`);

    // Check for existing collection
    try {
      const collection = await typesense.collections("ecars").retrieve();
      if (collection.num_documents !== ecars.length) {
        console.log("Deleting and recreating collection...");
        await typesense.collections("ecars").delete();
      }
    } catch {
      console.log("No existing collection found. Creating a new one.");
    }

    await typesense.collections().create(schema);

    const transformedEcars = ecars.map((car) => ({
      title: car.title || "",
      make: car.make || "",
      model: car.model || "",
    }));

    const importResponse = await typesense
      .collections("ecars")
      .documents()
      .import(transformedEcars, { action: "upsert" });

    console.log("Imported ecars:", importResponse);
  } catch (error) {
    console.error("Error:", error);
  }
})();
