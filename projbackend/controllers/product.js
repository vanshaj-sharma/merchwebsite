const Product = require("../models/product");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

exports.getProductById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .exec((err, product) => {
      if (err) {
        return res.status(400).json({
          error: "Product not found",
        });
      }
      req.product = product;
      next;
    });
};

exports.createProduct = (req, res) => {
  let form = new formidable.IncomingForm();

  form.keepExtension = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "Problem with image",
      });
    }

    //destructure the feilds
    const { name, description, price, category, stock } = fields;

    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({
        error: "please inclue all feilds",
      });
    }

    let product = new Product(fields);

    //handle file here ->
    if (file.photo) {
      if (file.photo.size > 3000000) {
        return res.status(400).json({
          error: "FILE SIZE IS LARGE",
        });
      }
      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }

    //save to db
    product.save((err, product) => {
      if (err) {
        res.status(400).json({
          error: "Failed to save Tshirt to DB",
        });
      }
      res.json(product);
    });
  });
};

exports.getProduct = (req, res) => {
  req.product.photo = undefined;
  return req.json(req.product);
};

//middleware
exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set("Content-Type", req, product.photo.contentType);
    return res.send(req.product.photo.data);
  }

  next();
};

//delete controllers
exports.deleteProduct = (req, res) => {
  let product = req.product;
  product.remove((err, deleteProduct) => {
    if (err) {
      return res.status(400).json({
        error: "Product was not deleted",
      });
    }
    res.json({
      message: "Product deleted",
      deleteProduct,
    });
  });
};

//update controllers
exports.updateProduct = (req, res) => {
  let form = new formidable.IncomingForm();

  form.keepExtension = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "Problem with image",
      });
    }

    //updation code
    let product = req.product;
    product = _.extend(product, fields);

    //handle file here ->
    if (file.photo) {
      if (file.photo.size > 3000000) {
        return res.status(400).json({
          error: "FILE SIZE IS LARGE",
        });
      }
      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }

    //save to db
    product.save((err, product) => {
      if (err) {
        res.status(400).json({
          error: "Failed to update Tshirt to DB",
        });
      }
      res.json(product);
    });
  });
};

//product listing
exports.getAllProducts = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 8;
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";

  Product.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, "asc"]])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: "No product found ",
        });
      }
      res.json(products);
    });
};

exports.getAllUniqueCategories = (req, res) => {
  Product.distinct("category", {}, (err, category) => {
    if (err) {
      res.status(400).json({
        error: "No category",
      });
    }
    res.json(category);
  });
};

exports.updateStock = (req, res, next) => {
  let myOperations = req.body.order.products.map((prod) => {
    return {
      updateOne: {
        filter: { _id: prod._id },
        update: { $inc: { stock: -prod.count, sold: +prod.count } },
      },
    };
  });

  Product.bulkWrite(myOperations, {}, (err, products) => {
    if (err) {
      return res.status(400).json({
        error: "Bulk operations failed",
      });
    }
  });
};
