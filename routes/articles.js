const express = require("express");
const Article = require("../models/Article");
const router = express.Router();

// Create Article (User/ Admin)
router.post("/", async (req, res) => {
  try {
    const article = new Article(req.body);
    await article.save();
    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Articles (Public)
router.get("/", async (req, res) => {
  try {
    const articles = await Article.find();
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Article by ID
router.get("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article || article.isDeleted) return res.status(404).json({ error: "Article not found" });

    // Increment views
    article.views += 1;
    await article.save();

    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Article (Author / Admin)
router.put("/:id", async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Soft Delete Article (Author / Admin)
router.delete("/:id", async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json({ message: "Article deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
