 //productsManageRoutes.js
import express from "express";
import { getCollection } from "../config/db.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// ------------------ GET ALL PRODUCTS WITH DETAILS ------------------
router.get("/manage-all-products", async (req, res) => {
  try {
    const productsCollection = await getCollection("products");
    const { email } = req.query; // get email from query

    // build filter conditionally
    const matchStage = email
      ? { $match: { "sellerDetails.sellerEmail": email } }
      : { $match: {} };

    const products = await productsCollection
      .aggregate([
        matchStage, // <---- apply filter first

        // Convert string IDs to ObjectIds for correct $lookup matches
        {
          $addFields: {
            typeIdObj: { $toObjectId: "$productTypeId" },
            categoryIdObj: { $toObjectId: "$categoryId" },
            subCategoryIdObj: { $toObjectId: "$subCategoryId" },
            variantIdObj: { $toObjectId: "$variantId" },
          },
        },

        // ------------------ PRODUCT TYPE LOOKUP ------------------
        {
          $lookup: {
            from: "types",
            localField: "typeIdObj",
            foreignField: "_id",
            as: "type",
          },
        },
        { $unwind: { path: "$type", preserveNullAndEmptyArrays: true } },

        // ------------------ CATEGORY LOOKUP ------------------
        {
          $lookup: {
            from: "categories",
            localField: "categoryIdObj",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

        // ------------------ SUBCATEGORY LOOKUP ------------------
        {
          $lookup: {
            from: "subCategories",
            localField: "subCategoryIdObj",
            foreignField: "_id",
            as: "subCategory",
          },
        },
        { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },

        // ------------------ VARIANT LOOKUP ------------------
        {
          $lookup: {
            from: "variants",
            localField: "variantIdObj",
            foreignField: "_id",
            as: "variant",
          },
        },
        { $unwind: { path: "$variant", preserveNullAndEmptyArrays: true } },

        // ------------------ FINAL PROJECTION ------------------
        {
          $project: {
            _id: 1,
            name: 1,
            quality: 1,
            unit: 1,
            price: 1,
            shortDescription: 1,
            productPhoto: 1,
            productStatus: 1,
            quantity: 1,
            createdAt: 1,
            updatedAt: 1,
            rating: 1,
            reviewCount: 1,
            soldAmount: 1,
            accountStatus: 1,
            isApproved: 1,
            sellerDetails: 1,

            // --- Joined details ---
            "type.typeName": 1,
            "type.typePhoto": 1,
            "type.status": 1,

            "category.categoryName": 1,
            "category.categoryPhoto": 1,
            "category.status": 1,

            "subCategory.subCategoryName": 1,
            "subCategory.subCategoryPhoto": 1,
            "subCategory.status": 1,

            "variant.variantName": 1,
            "variant.variantPhoto": 1,
            "variant.variantStatus": 1,
          },
        },

        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products", error });
  }
});



// ------------------ UPDATE PRODUCT STOCK ------------------
router.patch("/update-stock/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const productsCollection = await getCollection("products");

    // ------------------ UPDATE STOCK VALUE AND STATUS ------------------
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          quantity,
          productStatus: quantity > 0 ? "In stock" : "Out of stock",
          updatedAt: new Date(),
        },
      }
    );

    // ------------------ SEND SUCCESS RESPONSE ------------------
    res.status(200).json({ success: true, message: "Stock updated", result });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ message: "Failed to update stock", error });
  }
});

// ------------------ UPDATE ACCOUNT STATUS (Manual by Seller) ------------------
router.patch("/update-account-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body; // expects "active" or "inactive"
    const productsCollection = await getCollection("products");

    // Validate input
    if (!["active", "inactive"].includes(accountStatus)) {
      return res.status(400).json({ success: false, message: "Invalid account status" });
    }

    // ------------------ UPDATE ACCOUNT STATUS ------------------
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          accountStatus,
          updatedAt: new Date(),
        },
      }
    );

    // ------------------ SEND SUCCESS RESPONSE ------------------
    res.status(200).json({
      success: true,
      message: `Product account status set to ${accountStatus}`,
      result,
    });
  } catch (error) {
    console.error("Error updating account status:", error);
    res.status(500).json({ message: "Failed to update account status", error });
  }
});



//-------------------APPROVED FUNCTIONALITY BY ADMIN------------------
router.patch("/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const productsCollection = await getCollection("products");

    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isApproved: true } }
    );

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to approve product", error });
  }
});
//-------------------REJECT FUNCTIONALITY BY ADMIN------------------
router.patch("/reject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const productsCollection = await getCollection("products");

    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { approvedStatus: "rejected" } }
    );

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to reject product", error });
  }
});


// ------------------ REDUCE QUANTITY WHEN ADDED TO CART ------------------
router.patch("/reduce-quantity/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body; // amount to reduce, e.g., 1
    const productsCollection = await getCollection("products");

    // find current product
    const product = await productsCollection.findOne({ _id: new ObjectId(id) });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // calculate new quantity
    const newQuantity = Math.max(product.quantity - (amount || 1), 0);

    // update product and status
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          quantity: newQuantity,
          productStatus: newQuantity > 0 ? "In stock" : "Out of stock",
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Quantity updated after cart addition",
      newQuantity,
      result,
    });
  } catch (error) {
    console.error("Error reducing quantity:", error);
    res.status(500).json({ message: "Failed to reduce quantity", error });
  }
});


// ------------------ Get Product for Shop----------------
router.get("/shop-all-products", async (req, res) => {
  try {
    const productsCollection = await getCollection("products");
    const { search, category, subCategory, type, variant, location, sort } = req.query;

    // ------------------ MATCH APPROVED ------------------
    const initialMatch = { $match: { isApproved: true } };

    // ------------------ AGGREGATION ------------------
    const products = await productsCollection.aggregate([
      initialMatch,

      // Convert string IDs to ObjectId for lookups
      {
        $addFields: {
          typeIdObj: { $toObjectId: "$productTypeId" },
          categoryIdObj: { $toObjectId: "$categoryId" },
          subCategoryIdObj: { $toObjectId: "$subCategoryId" },
          variantIdObj: { $toObjectId: "$variantId" },
        },
      },

      // PRODUCT TYPE
      { $lookup: { from: "types", localField: "typeIdObj", foreignField: "_id", as: "type" } },
      { $unwind: { path: "$type", preserveNullAndEmptyArrays: true } },

      // CATEGORY
      { $lookup: { from: "categories", localField: "categoryIdObj", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // SUBCATEGORY
      { $lookup: { from: "subCategories", localField: "subCategoryIdObj", foreignField: "_id", as: "subCategory" } },
      { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },

      // VARIANT
      { $lookup: { from: "variants", localField: "variantIdObj", foreignField: "_id", as: "variant" } },
      { $unwind: { path: "$variant", preserveNullAndEmptyArrays: true } },

      // ------------------ FILTER BY CATEGORY NAME ------------------
      ...(category && category !== "All" ? [{ $match: { "category.categoryName": { $regex: category, $options: "i" } } }] : []),

      // ------------------ SEARCH AFTER LOOKUPS ------------------
      ...(search && search.trim() !== ""
        ? [
            {
              $match: {
                $or: [
                  { "variant.variantName": { $regex: search, $options: "i" } },
                  { "category.categoryName": { $regex: search, $options: "i" } },
                  { location: { $regex: search, $options: "i" } },
                  { name: { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),

      // ------------------ FINAL PROJECTION ------------------
      {
        $project: {
          _id: 1,
          name: 1,
          quality: 1,
          unit: 1,
          price: 1,
          shortDescription: 1,
          productPhoto: 1,
          productStatus: 1,
          quantity: 1,
          location: 1,
          createdAt: 1,
          updatedAt: 1,
          rating: 1,
          reviewCount: 1,
          soldAmount: 1,
          accountStatus: 1,
          isApproved: 1,
          sellerDetails: 1,
          "type.typeName": 1,
          "type.typePhoto": 1,
          "category.categoryName": 1,
          "category.categoryPhoto": 1,
          "subCategory.subCategoryName": 1,
          "subCategory.subCategoryPhoto": 1,
          "variant.variantName": 1,
          "variant.variantPhoto": 1,
        },
      },

      // ------------------ SORTING ------------------
      ...(sort
        ? [
            {
              $sort:
                sort === "newest"
                  ? { createdAt: -1 }
                  : sort === "price-low"
                  ? { price: 1 }
                  : sort === "price-high"
                  ? { price: -1 }
                  : sort === "rating"
                  ? { rating: -1 }
                  : { createdAt: -1 },
            },
          ]
        : [{ $sort: { createdAt: -1 } }]),
    ]).toArray();

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products", error });
  }
});


// ------------------ Get Single Product for Shop----------------
// for details product
router.get("/shop-product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const productsCollection = await getCollection("products");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // ------------------ AGGREGATION ------------------
    const product = await productsCollection.aggregate([
      { $match: { _id: new ObjectId(id), isApproved: true } },

      // Convert string IDs to ObjectId for lookups
      {
        $addFields: {
          typeIdObj: { $toObjectId: "$productTypeId" },
          categoryIdObj: { $toObjectId: "$categoryId" },
          subCategoryIdObj: { $toObjectId: "$subCategoryId" },
          variantIdObj: { $toObjectId: "$variantId" },
        },
      },

      // PRODUCT TYPE
      { $lookup: { from: "types", localField: "typeIdObj", foreignField: "_id", as: "type" } },
      { $unwind: { path: "$type", preserveNullAndEmptyArrays: true } },

      // CATEGORY
      { $lookup: { from: "categories", localField: "categoryIdObj", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // SUBCATEGORY
      { $lookup: { from: "subCategories", localField: "subCategoryIdObj", foreignField: "_id", as: "subCategory" } },
      { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },

      // VARIANT
      { $lookup: { from: "variants", localField: "variantIdObj", foreignField: "_id", as: "variant" } },
      { $unwind: { path: "$variant", preserveNullAndEmptyArrays: true } },

      // FINAL PROJECTION
      {
        $project: {
          _id: 1,
          name: 1,
          quality: 1,
          unit: 1,
          price: 1,
          shortDescription: 1,
          productPhoto: 1,
          productStatus: 1,
          quantity: 1,
          location: 1,
          createdAt: 1,
          updatedAt: 1,
          rating: 1,
          reviewCount: 1,
          soldAmount: 1,
          accountStatus: 1,
          isApproved: 1,
          sellerDetails: 1,
          "type.typeName": 1,
          "type.typePhoto": 1,
          "category.categoryName": 1,
          "category.categoryPhoto": 1,
          "subCategory.subCategoryName": 1,
          "subCategory.subCategoryPhoto": 1,
          "variant.variantName": 1,
          "variant.variantPhoto": 1,
        },
      },
    ]).toArray();

    if (!product || product.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Failed to fetch product", error });
  }
});


export default router;

