const Admin = require("../../models/admin.model");
const AdminLog = require("../../models/admin.log.model");
const { AppError } = require("../../middleware/errorHandler");

// Get all admins
exports.getAllAdmins = async (req, res, next) => {
  try {
    const { role, isActive, search } = req.query;

    // Build query
    const query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by status
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const admins = await Admin.find(query)
      .select("-password")
      .sort("role name");

    res.status(200).json({
      status: "success",
      data: {
        admins,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create new admin
exports.createAdmin = async (req, res, next) => {
  try {
    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email: req.body.email });
    if (existingAdmin) {
      return next(new AppError("Email already exists", 400));
    }

    // Create admin
    const admin = await Admin.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      permissions: req.body.permissions,
    });

    // Remove password from output
    admin.password = undefined;

    res.status(201).json({
      status: "success",
      data: {
        admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get admin by ID
exports.getAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password");

    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update admin
exports.updateAdmin = async (req, res, next) => {
  try {
    // Remove password and role from update data
    const updateData = { ...req.body };
    delete updateData.password;
    delete updateData.role;

    const admin = await Admin.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete admin
exports.deleteAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    // Prevent deleting super_admin
    if (admin.role === "super_admin") {
      return next(new AppError("Cannot delete super admin", 403));
    }

    await admin.remove();

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Update admin permissions
exports.updateAdminPermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return next(new AppError("Permissions must be an array", 400));
    }

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { permissions },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Toggle admin status
exports.toggleAdminStatus = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    // Prevent deactivating super_admin
    if (admin.role === "super_admin") {
      return next(new AppError("Cannot deactivate super admin", 403));
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.status(200).json({
      status: "success",
      data: {
        admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get admin activity
exports.getAdminActivity = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    // Get activity logs (you'll need to implement this based on your logging system)
    const activities = []; // Replace with actual activity logs

    res.status(200).json({
      status: "success",
      data: {
        activities,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get admin activity logs
exports.getAdminLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const logs = await AdminLog.find({ admin: req.params.id })
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("admin", "name email");

    const total = await AdminLog.countDocuments({ admin: req.params.id });

    res.status(200).json({
      status: "success",
      data: {
        logs,
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
