const Ticket = require("../models/ticket.model");
const { AppError } = require("../middleware/errorHandler");

// Create support ticket
exports.createTicket = async (req, res, next) => {
  try {
    const { subject, description, category, priority = "medium" } = req.body;

    if (!subject || !description || !category) {
      return next(
        new AppError("Subject, description and category are required", 400)
      );
    }

    const ticket = await Ticket.create({
      subject,
      description,
      category,
      priority,
      user: req.user._id,
      status: "open",
      comments: [],
    });

    res.status(201).json({
      status: "success",
      data: {
        ticket,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all tickets
exports.getAllTickets = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "-createdAt",
      status,
      priority,
      category,
      search,
    } = req.query;

    // Build query
    const query = {};

    // If not admin, only show user's tickets
    if (!req.user.isAdmin) {
      query.user = req.user._id;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search in subject or description
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const tickets = await Ticket.find(query)
      .populate("user", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await Ticket.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        tickets,
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

// Get ticket by ID
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    // .populate("user", "name email")
    // .lean();
    // .populate("comments.user", "name email")
    // .lean();

    if (!ticket) {
      return next(new AppError("Ticket not found", 404));
    }

    // Check if user has access to this ticket
    if (
      !req.user.isAdmin &&
      ticket.user._id.toString() !== req.user._id.toString()
    ) {
      return next(new AppError("Not authorized to access this ticket", 403));
    }

    res.status(200).json({
      status: "success",
      data: {
        ticket,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update ticket
exports.updateTicket = async (req, res, next) => {
  try {
    const { subject, description, category, priority } = req.body;
    const updateData = {};

    // Only admins can update priority
    if (req.user.isAdmin && priority) {
      updateData.priority = priority;
    }

    if (subject) updateData.subject = subject;
    if (description) updateData.description = description;
    if (category) updateData.category = category;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return next(new AppError("Ticket not found", 404));
    }

    // Check if user has access to update this ticket
    if (
      !req.user.isAdmin &&
      ticket.user.toString() !== req.user._id.toString()
    ) {
      return next(new AppError("Not authorized to update this ticket", 403));
    }

    // Update ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("user", "name email");

    res.status(200).json({
      status: "success",
      data: {
        ticket: updatedTicket,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add comment to ticket
exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return next(new AppError("Comment content is required", 400));
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return next(new AppError("Ticket not found", 404));
    }

    // Check if user has access to comment on this ticket
    if (
      !req.user.isAdmin &&
      ticket.user.toString() !== req.user._id.toString()
    ) {
      return next(
        new AppError("Not authorized to comment on this ticket", 403)
      );
    }

    ticket.comments.push({
      content,
      user: req.user._id,
      isAdminResponse: req.user.isAdmin,
    });

    // If admin responds, update status to "in-progress"
    if (req.user.isAdmin && ticket.status === "open") {
      ticket.status = "in-progress";
    }

    await ticket.save();
    await ticket.populate("comments.user", "name email");

    res.status(200).json({
      status: "success",
      data: {
        ticket,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Close ticket
exports.closeTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return next(new AppError("Ticket not found", 404));
    }

    // Check if user has access to close this ticket
    if (
      !req.user.isAdmin &&
      ticket.user.toString() !== req.user._id.toString()
    ) {
      return next(new AppError("Not authorized to close this ticket", 403));
    }

    ticket.status = "closed";
    ticket.closedAt = Date.now();
    ticket.closedBy = req.user._id;

    await ticket.save();
    await ticket.populate("user", "name email");

    res.status(200).json({
      status: "success",
      data: {
        ticket,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reopen ticket
exports.reopenTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return next(new AppError("Ticket not found", 404));
    }

    // Check if user has access to reopen this ticket
    if (
      !req.user.isAdmin &&
      ticket.user.toString() !== req.user._id.toString()
    ) {
      return next(new AppError("Not authorized to reopen this ticket", 403));
    }

    if (ticket.status !== "closed") {
      return next(new AppError("Ticket is not closed", 400));
    }

    ticket.status = "open";
    ticket.reopenedAt = Date.now();
    ticket.reopenedBy = req.user._id;

    await ticket.save();
    await ticket.populate("user", "name email");

    res.status(200).json({
      status: "success",
      data: {
        ticket,
      },
    });
  } catch (error) {
    next(error);
  }
};
