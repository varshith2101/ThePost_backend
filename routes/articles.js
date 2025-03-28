const express = require("express");
const Article = require("../models/Article");
const auth = require("../middleware/Auth");
const router = express.Router();

// Create Article (Admin only)
router.post("/", auth(["admin"]), async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = [
      'title', 'link', 'pubDate', 'creator', 'guid',
      'content', 'post_id', 'post_date', 'post_modified', 'category'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check for duplicate guid or post_id
    const existingArticle = await Article.findOne({ 
      $or: [{ guid: req.body.guid }, { post_id: req.body.post_id }]
    });
    
    if (existingArticle) {
      return res.status(409).json({
        error: "Article with this guid or post_id already exists"
      });
    }

    const article = new Article({
      title: req.body.title,
      link: req.body.link,
      pubDate: new Date(req.body.pubDate),
      creator: req.body.creator,
      guid: req.body.guid,
      content: req.body.content,
      post_id: req.body.post_id,
      post_date: new Date(req.body.post_date),
      post_modified: new Date(req.body.post_modified),
      post_name: req.body.post_name || "",
      category: req.body.category,
      isDeleted: false,
      views: 0
    });

    await article.save();
    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Articles (Public)
router.get("/", async (req, res) => {
  try {
    console.log("Article collection: ", Article.collection.name); // Log the collection name
    const articles = await Article.find().sort({ pubDate: -1 }); // Newest first

    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Article by ID (Public)
router.get("/:id", async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Increment views
    article.views += 1;
    await article.save();

    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Article (Admin only)
router.put("/:id", auth(["admin"]), async (req, res) => {
  try {
    const updates = {
      ...req.body,
      // Ensure dates are properly converted
      ...(req.body.pubDate && { pubDate: new Date(req.body.pubDate) }),
      ...(req.body.post_date && { post_date: new Date(req.body.post_date) }),
      ...(req.body.post_modified && { post_modified: new Date(req.body.post_modified) })
    };

    const article = await Article.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    );

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Soft Delete Article (Admin only)
router.delete("/:id", auth(["admin"]), async (req, res) => {
  try {
    const article = await Article.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json({ message: "Article deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;