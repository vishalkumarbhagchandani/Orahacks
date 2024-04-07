const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const client = require("./esClient");
const OpenAI = require("openai");
const agent = require("./agent");
const { emitToSubscribers } = require("./socket");

const app = express();

const openai = new OpenAI({
  apiKey: "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",
  dangerouslyAllowBrowser: true,
});
app.use(cors());
app.use(bodyParser.json());

app.get("/posts", async (req, res) => {
  try {
    const results = await client.search({
      index: "posts",
      query: {
        match_all: {},
      },
      size: 50,
    });

    const posts = results.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
    }));

    return res.status(201).json({
      message: "Posts fetched successfully",
      posts,
    });
  } catch (error) {
    console.error("Failed to fetched posts", error);
    return res.status(500).json({ message: "Failed to fetched posts" });
  }
});

app.get("/post/:id", async (req, res) => {
  try {
    const result = await client.get({
      index: "posts",
      id: req.params.id,
    });

    const post = { id: result._id, ...result._source };

    return res.status(201).json({
      message: "Posts fetched successfully",
      post,
    });
  } catch (error) {
    console.error("Failed to fetched posts", error);
    return res.status(500).json({ message: "Failed to fetched posts" });
  }
});

app.post("/posts", async (req, res) => {
  try {
    const post = req.body;
    const response = await client.index({
      index: "posts",
      body: post,
    });
    const result = await client.get({
      index: "posts",
      id: response._id,
    });

    const newPost = { id: result._id, ...result._source };

    // if (subscribers[newPost?.topic]) {
    //   subscribers[topic].forEach((socketID) => {
    //     io.to(socketID).emit("newPost", newPost);
    //   });
    // }

    emitToSubscribers(newPost?.topic, "newPost", newPost);

    return res.status(201).json({ message: "Post created", post: newPost });
  } catch (error) {
    console.error("Failed to index post", error);
    return res.status(500).json({ message: "Failed to create post" });
  }
});

app.post("/posts/multiple", async (req, res) => {
  try {
    const posts = req.body;
    const operations = posts.flatMap((doc) => [
      { index: { _index: "posts" } },
      doc,
    ]);

    const bulkResponse = await client.bulk({ refresh: true, operations });
    console.log(bulkResponse);

    if (bulkResponse.errors) {
      const erroredDocuments = [];
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: operations[i * 2],
            document: operations[i * 2 + 1],
          });
        }
      });
      console.log("Some documents failed to index:", erroredDocuments);
      return res.status(500).json({
        message: "Some documents failed to index",
        details: erroredDocuments,
      });
    }

    const insertedDocuments = bulkResponse.items.map((item, index) => ({
      ...posts[index],
      id: item.index._id,
    }));

    return res.status(201).json({
      message: "All posts created successfully",
      posts: insertedDocuments,
    });
  } catch (error) {
    console.error("Failed to index posts", error);
    return res
      .status(500)
      .json({ message: "Failed to create posts", error: error.message });
  }
});

app.put("/post/:id", async (req, res) => {
  const post = req.body;
  try {
    await client.index({
      index: "posts",
      id: req.params.id,
      body: post,
      refresh: "wait_for",
    });

    const resDoc = await client.get({
      index: "posts",
      id: req.params.id,
    });

    const updatedPost = {
      id: resDoc._id,
      ...resDoc._source,
    };

    console.log(updatedPost);

    res.status(201).json({
      updatedPost,
    });
  } catch (error) {
    console.error("Failed to update posts", error);
    return res.status(500).json({ message: "Failed to update post" });
  }
});

app.delete("/post/:id", async (req, res) => {
  try {
    const response = await client.delete({
      index: "posts",
      id: req.params.id,
    });

    if (response.result === "deleted") {
      res.status(200).json({ message: "Post deleted successfully" });
    } else {
      // If the document to delete was not found, Elasticsearch returns 'not_found'
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    console.error("Failed to delete post", error);
    if (error.meta && error.meta.statusCode === 404) {
      return res.status(404).json({ message: "Post not found" });
    } else {
      return res.status(500).json({ message: "Failed to delete post" });
    }
  }
});

app.get("/post/:id/generateComment", async (req, res) => {
  const result = await client.get({
    index: "posts",
    id: req.params.id,
  });

  const post = { id: result._id, ...result._source };

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `The post title is "${post.title}" and it says "${post.description}". Can you provide a reply or your thoughts on this?`,
      },
    ],
    temperature: 0.7,
    max_tokens: 150,
    n: 1,
    stop: null,
  });

  res.status(200).json({
    message: "AI Generated Comment Successfully",
    comment: completion.choices[0].message,
  });
});

app.post("/search-activities", async (req, res) => {
  const { ipAddress, activity, ipData } = req.body;
  locationText = JSON.stringify(ipData);
  console.log(req.body);
  const response = await agent(
    `Please suggest some activities related to activity = ${activity} based on my location with IP = ${ipAddress} and the location with latitute and longitude text from ${locationText} and the weather`
  );
  return res.status(200).json({
    activities: response,
  });
});

module.exports = app;
