const bcrypt = require("bcryptjs");
const path = require("path");

const User = require("../models/user.model");
const Modal = require("../models/modal.model");
const Admin = require("../models/admin.model");
const Transaction = require("../models/transaction.model");
const Withdrawal = require("../models/withdrawal.model");
const Gift = require("../models/gift.model");
const Settings = require("../models/settings.model");
const AdminLog = require("../models/admin.log.model");
const Ticket = require("../models/ticket.model");
const Livestream = require("../models/livestream.model");
const Content = require("../models/content.model");

const adminNavigation = {
  users: { name: "User Management", icon: "User" },
  modals: { name: "Modal Management", icon: "Star" },
  transactions: { name: "Finance", icon: "Dollar" },
  settings: { name: "Settings", icon: "Settings" },
  admin: { name: "Administration", icon: "Shield" },
  support: { name: "Support", icon: "MessageCircle" },
  content: { name: "Content", icon: "Image" },
};

const getAdminOptions = async () => {
  const { default: AdminJS } = await import("adminjs");
  const { ComponentLoader } = await import("adminjs");
  const { bundler } = await import("@adminjs/bundler");

  // Register bundler
  AdminJS.prototype.bundler = bundler;

  // Initialize ComponentLoader
  const componentLoader = new ComponentLoader();

  // Add components
  const Components = {
    Dashboard: componentLoader.add(
      "Dashboard",
      path.join(__dirname, "./components/dashboard")
    ),
    ShowImage: componentLoader.add(
      "ShowImage",
      path.join(__dirname, "./components/show-image")
    ),
    UploadImage: componentLoader.add(
      "UploadImage",
      path.join(__dirname, "./components/upload-image")
    ),
  };

  const resources = [
    {
      resource: User,
      options: {
        navigation: adminNavigation.users,
        properties: {
          password: {
            isVisible: { list: false, edit: true, filter: false, show: false },
            type: "password",
          },
          _id: {
            isVisible: { list: false, filter: true, show: true, edit: false },
          },
        },
        actions: {
          new: {
            before: async (request) => {
              if (request.payload.password) {
                request.payload.password = await bcrypt.hash(
                  request.payload.password,
                  12
                );
              }
              return request;
            },
          },
          edit: {
            before: async (request) => {
              if (request.payload.password) {
                request.payload.password = await bcrypt.hash(
                  request.payload.password,
                  12
                );
              }
              return request;
            },
          },
          delete: { isAccessible: true },
          bulkDelete: { isAccessible: false },
        },
      },
    },
    {
      resource: Modal,
      options: {
        navigation: adminNavigation.modals,
        properties: {
          password: {
            isVisible: { list: false, edit: true, filter: false, show: false },
            type: "password",
          },
          _id: {
            isVisible: { list: false, filter: true, show: true, edit: false },
          },
        },
        actions: {
          new: {
            before: async (request) => {
              if (request.payload.password) {
                request.payload.password = await bcrypt.hash(
                  request.payload.password,
                  12
                );
              }
              return request;
            },
          },
          edit: {
            before: async (request) => {
              if (request.payload.password) {
                request.payload.password = await bcrypt.hash(
                  request.payload.password,
                  12
                );
              }
              return request;
            },
          },
          delete: { isAccessible: true },
          bulkDelete: { isAccessible: false },
        },
      },
    },
    {
      resource: Transaction,
      options: {
        navigation: adminNavigation.transactions,
        properties: {
          _id: {
            isVisible: { list: false, filter: true, show: true, edit: false },
          },
        },
        actions: {
          new: { isAccessible: false },
          delete: { isAccessible: false },
          bulkDelete: { isAccessible: false },
          edit: { isAccessible: false },
        },
      },
    },
    {
      resource: Withdrawal,
      options: {
        navigation: adminNavigation.transactions,
        properties: {
          _id: {
            isVisible: { list: false, filter: true, show: true, edit: false },
          },
          user: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            reference: "User",
          },
          amount: {
            type: "number",
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected", "completed"],
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          bankDetails: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          transactionId: {
            isVisible: { list: true, filter: true, show: true, edit: false },
          },
          notes: {
            type: "textarea",
            isVisible: { list: false, filter: false, show: true, edit: true },
          },
          processedAt: {
            type: "datetime",
            isVisible: { list: true, filter: true, show: true, edit: false },
          },
          processedBy: {
            reference: "Admin",
            isVisible: { list: true, filter: true, show: true, edit: false },
          },
          createdAt: {
            type: "datetime",
            isVisible: { list: true, filter: true, show: true, edit: false },
          },
        },
        actions: {
          new: { isAccessible: false },
          edit: { isAccessible: true },
          delete: { isAccessible: false },
          bulkDelete: { isAccessible: false },
          approve: {
            actionType: "record",
            icon: "CheckCircle",
            handler: async (request, response, context) => {
              const withdrawal = await context.resource.findOne(
                request.params.id
              );
              withdrawal.status = "approved";
              withdrawal.processedAt = new Date();
              withdrawal.processedBy = request.currentAdmin.id;
              await withdrawal.save();
              return {
                record: withdrawal.toJSON(),
                notice: {
                  message: "Withdrawal request approved successfully",
                  type: "success",
                },
              };
            },
            guard: "Are you sure you want to approve this withdrawal request?",
          },
          reject: {
            actionType: "record",
            icon: "XCircle",
            handler: async (request, response, context) => {
              const withdrawal = await context.resource.findOne(
                request.params.id
              );
              withdrawal.status = "rejected";
              withdrawal.processedAt = new Date();
              withdrawal.processedBy = request.currentAdmin.id;
              await withdrawal.save();
              return {
                record: withdrawal.toJSON(),
                notice: {
                  message: "Withdrawal request rejected successfully",
                  type: "success",
                },
              };
            },
            guard: "Are you sure you want to reject this withdrawal request?",
          },
        },
      },
    },
    {
      resource: Gift,
      options: {
        navigation: adminNavigation.content,
        properties: {
          _id: {
            isVisible: { list: false, filter: true, show: true, edit: false },
          },
          name: {
            isTitle: true,
            isRequired: true,
          },
          description: {
            type: "textarea",
            isVisible: { list: false, filter: false, show: true, edit: true },
          },
          category: {
            type: "string",
            isRequired: true,
            availableValues: [
              { value: "basic", label: "Basic" },
              { value: "premium", label: "Premium" },
              { value: "exclusive", label: "Exclusive" },
              { value: "seasonal", label: "Seasonal" },
            ],
          },
          price: {
            type: "number",
            isRequired: true,
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          coins: {
            type: "number",
            isRequired: true,
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          image: {
            isVisible: { list: true, filter: true, show: true, edit: true },
            isRequired: true,
            components: {
              show: Components.ShowImage,
              edit: Components.UploadImage,
            },
          },
          animation: {
            type: "string",
            isVisible: { list: false, filter: false, show: true, edit: true },
          },
          isActive: {
            type: "boolean",
            isVisible: { list: true, filter: true, show: true, edit: true },
            default: true,
          },
          isFeatured: {
            type: "boolean",
            isVisible: { list: true, filter: true, show: true, edit: true },
            default: false,
          },
          validFrom: {
            type: "datetime",
            isVisible: { list: false, filter: true, show: true, edit: true },
          },
          validUntil: {
            type: "datetime",
            isVisible: { list: false, filter: true, show: true, edit: true },
          },
          purchaseCount: {
            type: "number",
            isVisible: { list: true, filter: true, show: true, edit: false },
          },
          totalRevenue: {
            type: "number",
            isVisible: { list: true, filter: true, show: true, edit: false },
          },
        },
        actions: {
          new: {
            isAccessible: true,
            before: async (request) => {
              // Don't validate image here since it's handled by the UploadImage component
              return request;
            },
          },
          edit: {
            isAccessible: true,
            before: async (request) => {
              // Don't validate image here since it's handled by the UploadImage component
              return request;
            },
          },
          delete: { isAccessible: true },
          bulkDelete: { isAccessible: true },
        },
      },
    },
    {
      resource: Livestream,
      options: {
        navigation: adminNavigation.content,
        properties: {
          _id: {
            isVisible: { list: false, filter: true, show: true, edit: false },
          },
          title: { isTitle: true },
          description: {
            type: "textarea",
            isVisible: { list: false, filter: false, show: true, edit: true },
          },
          status: {
            type: "string",
            enum: ["scheduled", "live", "ended"],
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          scheduledAt: {
            type: "datetime",
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          thumbnail: {
            isVisible: { list: true, filter: false, show: true, edit: true },
            components: {
              show: Components.ShowImage,
              edit: Components.UploadImage,
            },
          },
        },
        actions: {
          new: { isAccessible: true },
          edit: { isAccessible: true },
          delete: { isAccessible: true },
          bulkDelete: { isAccessible: true },
        },
      },
    },
    {
      resource: Settings,
      options: {
        navigation: adminNavigation.settings,
        properties: {
          _id: {
            isVisible: { list: false, filter: true, show: true, edit: false },
          },
          key: { isTitle: true },
          value: {
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          description: {
            type: "richtext",
            isVisible: { list: true, filter: false, show: true, edit: true },
          },
        },
        actions: {
          new: { isAccessible: true },
          edit: { isAccessible: true },
          delete: { isAccessible: true },
          bulkDelete: { isAccessible: false },
        },
      },
    },
    {
      resource: Admin,
      options: {
        navigation: adminNavigation.admin,
        properties: {
          password: {
            isVisible: { list: false, edit: true, filter: false, show: false },
          },
          _id: {
            isVisible: { list: false, filter: true, show: true, edit: false },
          },
        },
        actions: {
          new: {
            before: async (request) => {
              if (request.payload.password) {
                request.payload.password = await bcrypt.hash(
                  request.payload.password,
                  12
                );
              }
              return request;
            },
          },
          edit: {
            before: async (request) => {
              if (request.payload.password) {
                request.payload.password = await bcrypt.hash(
                  request.payload.password,
                  12
                );
              }
              return request;
            },
          },
        },
      },
    },
    {
      resource: Content,
      options: {
        navigation: adminNavigation.content,
        properties: {
          _id: {
            isVisible: { list: false, filter: true, show: true, edit: false },
          },
          title: { isTitle: true },
          content: {
            type: "richtext",
            isVisible: { list: false, filter: false, show: true, edit: true },
          },
          type: {
            type: "string",
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          language: {
            type: "string",
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          order: {
            type: "number",
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          isActive: {
            type: "boolean",
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          metadata: {
            isVisible: { list: false, filter: false, show: true, edit: true },
            components: {
              show: Components.ShowImage,
              edit: Components.UploadImage,
            },
          },
        },
        actions: {
          new: { isAccessible: true },
          edit: { isAccessible: true },
          delete: { isAccessible: true },
          bulkDelete: { isAccessible: true },
        },
      },
    },
  ];

  return {
    resources,
    rootPath: "/admin",
    loginPath: "/admin/login",
    logoutPath: "/admin/logout",
    branding: {
      companyName: "Dating App Admin",
      logo: false,
      softwareBrothers: false,
    },
    dashboard: {
      handler: async () => {
        return { some: "output" };
      },
      component: Components.Dashboard,
    },
    componentLoader,
  };
};

const DEFAULT_ADMIN = {
  email: "admin@example.com",
  password: "admin123",
};

const authenticate = async (email, password) => {
  console.log("Login attempt:", { email, password });

  if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
    console.log("Login successful");
    return Promise.resolve({
      email: DEFAULT_ADMIN.email,
      title: "Admin User",
      id: "1",
      avatarUrl: null,
    });
  }

  console.log("Login failed");
  return null;
};

module.exports = {
  getAdminOptions,
  authenticate,
};
