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
    name: "blogs",
    num_documents: 0,
    fields: [
      { name: "title", type: "string", facet: false },
      { name: "short_description", type: "string", facet: true },
    ],
  };

  const MONGO_URI = process.env.MONGO_URI;
  const DB_NAME = "electrify";
  const COLLECTION_NAME = "blogs";

  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();

    const db = client.db(DB_NAME);
    const blogs = await db.collection(COLLECTION_NAME).find({}).toArray();

    console.log(`Fetched ${blogs.length} documents from MongoDB`);

    try {
      const collection = await typesense.collections("blogs").retrieve();
      if (collection.num_documents !== blogs.length) {
        console.log("Deleting and recreating collection...");
        await typesense.collections("blogs").delete();
      }
    } catch {
      console.log("No existing collection found. Creating a new one.");
    }

    await typesense.collections().create(schema);

    const transformedBlogs = blogs.map((blog) => ({
      title: blog.title || "",
      short_description: blog.short_description || "",
    }));

    const importResponse = await typesense
      .collections("blogs")
      .documents()
      .import(transformedBlogs, { action: "upsert" });

    console.log("Imported blogs:", importResponse);
  } catch (error) {
    console.error("Error:", error);
  }
})();
