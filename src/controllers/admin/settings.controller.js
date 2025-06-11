const Settings = require("../../models/settings.model");
const { AppError } = require("../../middleware/errorHandler");

// Get all settings
exports.getAllSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOne();

    res.status(200).json({
      status: "success",
      data: {
        settings: settings || {},
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update settings
exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: req.body },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

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

// Get commission settings
exports.getCommissionSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOne().select("commission");

    res.status(200).json({
      status: "success",
      data: {
        commission: settings?.commission || {
          defaultRate: 20,
          minRate: 10,
          maxRate: 50,
          withdrawalFee: 2,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update commission settings
exports.updateCommissionSettings = async (req, res, next) => {
  try {
    const { defaultRate, minRate, maxRate, withdrawalFee } = req.body;

    // Validate commission rates
    if (defaultRate < minRate || defaultRate > maxRate) {
      return next(
        new AppError("Default rate must be between min and max rates", 400)
      );
    }

    const settings = await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          "commission.defaultRate": defaultRate,
          "commission.minRate": minRate,
          "commission.maxRate": maxRate,
          "commission.withdrawalFee": withdrawalFee,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        commission: settings.commission,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get payment settings
exports.getPaymentSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOne().select("payment");

    res.status(200).json({
      status: "success",
      data: {
        payment: settings?.payment || {
          razorpay: {
            enabled: true,
            testMode: process.env.NODE_ENV !== "production",
          },
          minimumDeposit: 99,
          maximumDeposit: 10000,
          minimumWithdrawal: 1000,
          maximumWithdrawal: 50000,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update payment settings
exports.updatePaymentSettings = async (req, res, next) => {
  try {
    const {
      razorpay,
      minimumDeposit,
      maximumDeposit,
      minimumWithdrawal,
      maximumWithdrawal,
    } = req.body;

    // Validate min/max values
    if (minimumDeposit > maximumDeposit) {
      return next(
        new AppError(
          "Minimum deposit cannot be greater than maximum deposit",
          400
        )
      );
    }

    if (minimumWithdrawal > maximumWithdrawal) {
      return next(
        new AppError(
          "Minimum withdrawal cannot be greater than maximum withdrawal",
          400
        )
      );
    }

    const settings = await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          "payment.razorpay": razorpay,
          "payment.minimumDeposit": minimumDeposit,
          "payment.maximumDeposit": maximumDeposit,
          "payment.minimumWithdrawal": minimumWithdrawal,
          "payment.maximumWithdrawal": maximumWithdrawal,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        payment: settings.payment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get app settings
exports.getAppSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOne().select("app");

    res.status(200).json({
      status: "success",
      data: {
        app: settings?.app || {
          maintenance: {
            enabled: false,
            message: "",
          },
          version: {
            android: {
              current: "1.0.0",
              minimum: "1.0.0",
              forceUpdate: false,
            },
            ios: {
              current: "1.0.0",
              minimum: "1.0.0",
              forceUpdate: false,
            },
          },
          chat: {
            ratePerMinute: 10,
            minimumDuration: 1,
          },
          call: {
            audio: {
              ratePerMinute: 20,
              minimumDuration: 1,
            },
            video: {
              ratePerMinute: 30,
              minimumDuration: 1,
            },
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update app settings
exports.updateAppSettings = async (req, res, next) => {
  try {
    const { maintenance, version, chat, call } = req.body;

    const settings = await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          "app.maintenance": maintenance,
          "app.version": version,
          "app.chat": chat,
          "app.call": call,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        app: settings.app,
      },
    });
  } catch (error) {
    next(error);
  }
};
