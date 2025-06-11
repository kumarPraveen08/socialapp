const Setting = require("../../models/setting.model");
const { AppError } = require("../../middleware/errorHandler");

exports.getAllSettings = async (req, res, next) => {
  try {
    const { category, isPublic, search } = req.query;

    // Build query
    const query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by public status
    if (isPublic !== undefined) {
      query.isPublic = isPublic === "true";
    }

    // Search by key or description
    if (search) {
      query.$or = [
        { key: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const settings = await Setting.find(query)
      .populate("lastUpdatedBy", "name")
      .sort("category key");

    res.status(200).json({
      status: "success",
      data: {
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSettingsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { isPublic } = req.query;

    const settings = await Setting.getByCategory(category, isPublic === "true");

    res.status(200).json({
      status: "success",
      data: {
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSettingByKey = async (req, res, next) => {
  try {
    const { key } = req.params;

    const setting = await Setting.findOne({ key });

    if (!setting) {
      return next(new AppError("Setting not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        setting,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createSetting = async (req, res, next) => {
  try {
    // Check if key already exists
    const existingSetting = await Setting.findOne({ key: req.body.key });
    if (existingSetting) {
      return next(new AppError("Setting with this key already exists", 400));
    }

    // Add admin as lastUpdatedBy
    req.body.lastUpdatedBy = req.user.id;

    const setting = await Setting.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        setting,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSetting = async (req, res, next) => {
  try {
    // Add admin as lastUpdatedBy
    req.body.lastUpdatedBy = req.user.id;

    const setting = await Setting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!setting) {
      return next(new AppError("Setting not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        setting,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSetting = async (req, res, next) => {
  try {
    const setting = await Setting.findByIdAndDelete(req.params.id);

    if (!setting) {
      return next(new AppError("Setting not found", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

exports.bulkUpdateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return next(new AppError("Settings must be an array", 400));
    }

    // Update each setting
    const updatedSettings = await Promise.all(
      settings.map(async ({ id, value }) => {
        const setting = await Setting.findByIdAndUpdate(
          id,
          {
            value,
            lastUpdatedBy: req.user.id,
          },
          {
            new: true,
            runValidators: true,
          }
        );

        if (!setting) {
          throw new AppError(`Setting with id ${id} not found`, 404);
        }

        return setting;
      })
    );

    res.status(200).json({
      status: "success",
      data: {
        settings: updatedSettings,
      },
    });
  } catch (error) {
    next(error);
  }
};
