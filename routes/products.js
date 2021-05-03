const express = require("express");
const app = express();
//model
const Product = require("../models/Product");
const User = require("../models/User");
//router
const productRouter = new express.Router();

const { authAdmin, authenticate } = require("../middlewares/Authentication");

//multer
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/productImages");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toDateString() + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 50,
  },
});

////////////// PRODUCT AREA  /////////////
//comment in a product

productRouter.post("/comments", authenticate, async (req, res) => {
  try {
    const { id, name, image, text } = req.body;
    comment = {
      id,
      name,
      image,
      text,
      date: Date.now(),
    };
    
    const product = await Product.updateOne(
      { _id: id },
      { $push: { comments: comment } },
      function (err, result) {
        if (err) {
          res.send(err);
        } else {
          res.json(result);
        }
      }
    );
    // Product.find({stock:20} ,"comments",function(err, docs) {
    //   res.json(docs[0])
    // })
  } catch (err) {
    res.status(404).json({
      message :err
    })
  }
});

//Update product image
productRouter.patch(
  "/updateImage/:id",
  upload.single("productImage"),
  authAdmin,
  async (req, res) => {
    try {
      const id = req.params.id;
      const image = req.file.filename;

      const updatedProduct = await Product.updateOne(
        { _id: id },
        {
          image: image,
        }
      ).exec();
      res.send({ messege: "Product's image updated successfully" });
    } catch {
      console.log(err);
      res.statusCode = 422;
      res.send({ status: false, message: "Image Update failed, try again" });
    }
  }
);

//search by product's name
productRouter.get("/search/:productName", async (req, res) => {
  try {
    const { productName } = req.params;
    //return all matched product names
    const filteredProducts = await Product.find({
      name: { $regex: new RegExp(productName.toLowerCase(), "i") },
    }).exec();
    const result = filteredProducts.length;
    // console.log(typeof filteredProducts,result)
    res.status(200).send({ resultNumber: result, filteredProducts });
  } catch (error) {
    res.status(401).send(error);
  }
});

//get all  products -no need for authentication here
productRouter.get("/", async (req, res) => {
  const product = await Product.find().exec();
  res.send(product);
});

// //get product by id
productRouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const product = await Product.findOne({ _id: id }).exec();
    res.send(product);
  } catch (error) {
    console.log(error);
    res.send("no Such product Exist");
  }
});

//add product
productRouter.post("/", authAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, category, description, price, quantity, country } = req.body;

    if (!req.body) return res.send("Please Enter product data");
    if (!req.file) return res.send("Please upload a file");

    const image = req.file.filename;
    console.log(req.file);

    const product = await Product.create({
      name,
      category,
      description,
      price,
      quantity,
      country,
      image,
    });
    res.send({ message: "product created successfully", product });
  } catch (err) {
    console.log(err);
    res.send({ message: "product was not created" });
  }
});

//delete product
productRouter.delete("/:id", authAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOne({ _id: id }).remove().exec();

    res.send({ status: true, message: "Product is deleted" });
  } catch (error) {
    console.log(error);
    res.send({ status: false, message: "Product is not deleted" });
  }
});

//Update product
productRouter.patch(
  "/:id",
  authAdmin,
  upload.single("file"),
  async (req, res) => {
    try {
      const {
        name,
        category,
        description,
        price,
        quantity,
        country,
      } = req.body;

      if (!req.body) return res.send("Please Enter product data");

      const reqProduct = await Product.findById(req.params.id);
      console.log(reqProduct);
      const image = req.file ? req.file.filename : reqProduct.image;
      console.log(image);

      await Product.updateOne(
        { _id: req.params.id },
        {
          name,
          category,
          description,
          price,
          quantity,
          country,
          image,
        }
      ).exec();
      res.send({ messege: "Product updated successfully" });
    } catch (err) {
      console.log(err);
      res.statusCode = 422;
      res.send({ status: false, message: "Update failed, try again" });
    }
  }
);

module.exports = productRouter;
