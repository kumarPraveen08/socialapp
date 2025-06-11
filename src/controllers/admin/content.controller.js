const Content = require("../../models/content.model");
const { AppError } = require("../../middleware/errorHandler");

exports.getAllContent = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "type order",
      type,
      isActive,
      language,
      search,
    } = req.query;

    // Build query
    const query = {};

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Filter by language
    if (language) {
      query.language = language;
    }

    // Search by title or content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const content = await Content.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await Content.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        content,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getContent = async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return next(new AppError("Content not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        content,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createContent = async (req, res, next) => {
  try {
    // Get the highest order number for this type
    const maxOrder = await Content.findOne({ type: req.body.type })
      .sort("-order")
      .select("order");

    // Set the order to be one more than the highest
    req.body.order = maxOrder ? maxOrder.order + 1 : 0;

    const content = await Content.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        content,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateContent = async (req, res, next) => {
  try {
    const content = await Content.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!content) {
      return next(new AppError("Content not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        content,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteContent = async (req, res, next) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);

    if (!content) {
      return next(new AppError("Content not found", 404));
    }

    // Reorder remaining content
    await Content.updateMany(
      {
        type: content.type,
        order: { $gt: content.order },
      },
      { $inc: { order: -1 } }
    );

    res.status(200).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleContentStatus = async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return next(new AppError("Content not found", 404));
    }

    content.isActive = !content.isActive;
    await content.save();

    res.status(200).json({
      status: "success",
      data: {
        content,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.reorderContent = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return next(new AppError("Items must be an array", 400));
    }

    // Update order for each item
    await Promise.all(
      items.map((item, index) =>
        Content.findByIdAndUpdate(item.id, { order: index }, { new: true })
      )
    );

    res.status(200).json({
      status: "success",
      message: "Content reordered successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getContentByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { language = "en", isActive = true } = req.query;

    const content = await Content.find({
      type,
      language,
      ...(isActive === "true" && { isActive: true }),
    }).sort("order");

    res.status(200).json({
      status: "success",
      data: {
        content,
      },
    });
  } catch (error) {
    next(error);
  }
};
