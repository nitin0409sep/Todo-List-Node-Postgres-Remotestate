const express = require("express");

// Controllers
const {
  getItems,
  getSpecificItem,
  postItem,
  updateItem,
  deleteItem,
  deleteMultipleItems,
  deleteAllItems,
} = require("../controller/todo.controller");

// Routes
const route = express.Router();

// Get All or Specific Item By ID
route.get("/view-list/:id?", (req, res, next) => {
  const { id } = req.params;
  if (id) {
    getSpecificItem(req, res, next);
  } else {
    getItems(req, res, next);
  }
});

// Add Item or Items
route.post("/addItem", postItem);

// Update Item
route.put("/updateItem/:id?", (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({ message: "ID parameter is required" });
  }
  next();
},
  updateItem
);

// Delete Item
route.delete("/deleteItem/:id?", (req, res, next) => {
  if (req.query.id && req.params.id) {
    return res.status(400).json({
      message:
        "Send ID as parameter or as query param, can't send both at same time",
    });
  }

  if (!req.params.id && !req.query.id) {
    return res.status(400).json({
      message: "Send ID as parameter or as query param",
    });
  }

  if (req.params.id !== undefined) {
    deleteItem(req, res);
  } else if (req.query.id) {
    deleteMultipleItems(req, res);
  }
});

// Delete All Items
route.delete("/deleteAllItems", deleteAllItems);

module.exports = route;