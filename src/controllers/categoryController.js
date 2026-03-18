
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('slugify');

// @desc    Create new category with Materialized Path
// @route   POST /api/v1/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, parentId, metadata, isActive, image } = req.body;

  let level = 0;
  let path = '';
  let slug = slugify(name, { lower: true, strict: true });

  if (parentId) {
    const parent = await Category.findById(parentId);
    if (!parent) {
      res.status(404);
      throw new Error('Parent category not found');
    }
    level = parent.level + 1;
    // Materialized Path: parent/child
    path = parent.path ? `${parent.path}/${slug}` : `${parent.slug}/${slug}`;
  } else {
    path = slug;
  }

  const category = await Category.create({
    name,
    slug,
    path,
    parentId,
    level,
    metadata,
    isActive,
    image
  });

  res.status(201).json({ success: true, data: category });
});

// @desc    Get category tree
// @route   GET /api/v1/categories/tree
// @access  Public
exports.getCategoryTree = asyncHandler(async (req, res) => {
  // Efficiently fetch all active categories
  const categories = await Category.find({ isActive: true })
    .select('name slug parentId path level image')
    .sort({ level: 1 }) // Sort by level helps construction
    .lean();

  // Helper to build tree recursively
  const buildTree = (cats, parentId = null) => {
    return cats
      .filter(c => String(c.parentId) === String(parentId))
      .map(c => ({
        ...c,
        children: buildTree(cats, c._id)
      }));
  };

  // Find root categories (parentId is null)
  const rootCategories = categories.filter(c => !c.parentId);
  const tree = rootCategories.map(root => ({
    ...root,
    children: buildTree(categories, root._id)
  }));

  res.status(200).json({ success: true, count: categories.length, data: tree });
});

// @desc    Get all categories flat
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('path');
  res.status(200).json({ success: true, count: categories.length, data: categories });
});

// @desc    Update category (Handles Moving Subtrees)
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // If parentId is changing, we must recalculate path and update ALL children
  if (req.body.parentId !== undefined && String(req.body.parentId) !== String(category.parentId)) {
    const oldPath = category.path;
    let newPath = '';
    let newLevel = 0;

    if (req.body.parentId) {
      const newParent = await Category.findById(req.body.parentId);
      if (!newParent) throw new Error('New parent category not found');
      newPath = newParent.path ? `${newParent.path}/${category.slug}` : `${newParent.slug}/${category.slug}`;
      newLevel = newParent.level + 1;
    } else {
      // Moving to root
      newPath = category.slug;
      newLevel = 0;
    }

    // 1. Update the category itself
    category.parentId = req.body.parentId;
    category.path = newPath;
    category.level = newLevel;

    // 2. Cascade update for all descendants
    // Find all categories that start with the old path
    const descendants = await Category.find({ path: new RegExp(`^${oldPath}/`) });
    
    for (const child of descendants) {
      // Replace the prefix of the path
      child.path = child.path.replace(oldPath, newPath);
      // Adjust level
      child.level = child.level + (newLevel - category.level); // delta
      await child.save();
    }
  }

  // Update other fields
  if (req.body.name) category.name = req.body.name;
  if (req.body.isActive !== undefined) category.isActive = req.body.isActive;
  if (req.body.image) category.image = req.body.image;
  if (req.body.metadata) category.metadata = req.body.metadata;

  await category.save();

  res.status(200).json({ success: true, data: category });
});

// @desc    Delete category (Soft delete)
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Soft delete logic
  category.isActive = false;
  await category.save();

  // Optional: Soft delete children? 
  // For now, we keep children active but orphaned visually or hidden by filter.
  
  res.status(200).json({ success: true, data: {} });
});
