const express = require("express");
const router = express.Router();
const MenuItem = require("../models/Menu");
const MenuCategory = require("../models/MenuCategory");
const { adminOnly, staffOrAdmin } = require("../middleware/authMiddleware");

// Get menu items with search, filter, pagination
router.get("/items", async (req, res) => {
  try {
    const { 
      search = "", 
      category = "", 
      sort = "name", 
      page = 1, 
      limit = 20,
      availability = "true"
    } = req.query;

    // Build query
    let query = { isActive: true };
    
    if (availability === "true") {
      query.availability = true;
    }
    
    if (category) {
      query.categoryId = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'popularity':
        sortOption = { popularity: -1 };
        break;
      default:
        sortOption = { name: 1 };
    }

    const skip = (page - 1) * limit;
    
    const items = await MenuItem.find(query)
      .populate('categoryId', 'name icon')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await MenuItem.countDocuments(query);
    
    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await MenuCategory.find({ active: true })
      .sort({ displayOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: Create menu item
router.post("/items", adminOnly, async (req, res) => {
  try {
    const item = new MenuItem(req.body);
    await item.save();
    await item.populate('categoryId', 'name icon');
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: Update menu item
router.put("/items/:id", adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('categoryId', 'name icon');
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: Delete menu item
router.delete("/items/:id", adminOnly, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Staff: Toggle item availability
router.patch("/items/:id/availability", staffOrAdmin, async (req, res) => {
  try {
    const { availability } = req.body;
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { availability },
      { new: true }
    );
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: Category CRUD
router.get("/admin/categories", adminOnly, async (req, res) => {
  try {
    const categories = await MenuCategory.find().sort({ displayOrder: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/categories", adminOnly, async (req, res) => {
  try {
    const category = new MenuCategory(req.body);
    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/categories/:id", adminOnly, async (req, res) => {
  try {
    const category = await MenuCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/categories/:id", adminOnly, async (req, res) => {
  try {
    await MenuCategory.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
