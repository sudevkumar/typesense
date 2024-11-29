const express = require("express");
const Typesense = require("typesense");

const app = express();

const typesense = new Typesense.Client({
  nodes: [
    {
      host: "localhost",
      port: 8108,
      protocol: "http",
    },
  ],
  apiKey: "xyz",
});

app.get("/search", async (req, res) => {
  try {
    const query = req.query.q || "*";

    const results = await typesense.multiSearch.perform({
      searches: [
        {
          collection: "ebikes",
          q: query,
          query_by: "title,make,model",
        },
        {
          collection: "ecars",
          q: query,
          query_by: "title,make,model,variant, about",
        },
        {
          collection: "blogs",
          q: query,
          query_by: "title,short_description",
        },
      ],
    });

    // Combine results from both collections
    const combinedResults = results.results.flatMap((result) => result.hits);

    res.json({ combinedResults });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error querying Typesense");
  }
});

app.listen(4000, () => console.log("Server running on port 4000"));
