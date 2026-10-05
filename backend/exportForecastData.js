require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const Order = require("./models/Order");
const Product = require("./models/Product");

const OUTPUT_DIR = path.resolve(__dirname, "../ml/data");
const OUTPUT_FILE = path.join(
  OUTPUT_DIR,
  "nivera_sales_history.json"
);

const VALID_STATUSES = [
  "confirmed",
  "shipped",
  "delivered",
];

const exportForecastData = async () => {
  await connectDB();

  try {
    console.log("Fetching historical orders...");

    const orders = await Order.find({
      status: { $in: VALID_STATUSES },
    })
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Orders found: ${orders.length}`);

    if (orders.length === 0) {
      throw new Error(
        "No historical orders found in the database."
      );
    }

    // ---------------------------------------------------------
    // Collect product IDs
    // ---------------------------------------------------------

    const productIds = [];

    for (const order of orders) {
      for (const item of order.items || []) {
        if (item.product) {
          productIds.push(item.product.toString());
        }
      }
    }

    const uniqueProductIds = [
      ...new Set(productIds),
    ];

    console.log(
      `Products referenced by orders: ${uniqueProductIds.length}`
    );

    // ---------------------------------------------------------
    // Fetch product metadata
    // ---------------------------------------------------------

    const products = await Product.find({
      _id: {
        $in: uniqueProductIds,
      },
    })
      .select("_id name sku category price")
      .lean();

    const productMap = new Map();

    for (const product of products) {
      productMap.set(
        product._id.toString(),
        product
      );
    }

    // ---------------------------------------------------------
    // Flatten order items
    // ---------------------------------------------------------

    const salesHistory = [];

    for (const order of orders) {
      for (const item of order.items || []) {
        if (!item.product) continue;

        const productId =
          item.product.toString();

        const product =
          productMap.get(productId);

        if (!product) {
          console.warn(
            `Product not found for order item: ${productId}`
          );
          continue;
        }

        salesHistory.push({
          orderId: order._id.toString(),

          productId,

          productName:
            product.name || item.name,

          sku:
            product.sku || "",

          category:
            product.category || "",

          price:
            Number(item.price ?? product.price) || 0,

          quantity:
            Number(item.quantity) || 0,

          totalAmount:
            Number(item.price ?? product.price) *
            (Number(item.quantity) || 0),

          status: order.status,

          paymentStatus:
            order.paymentStatus,

          createdAt:
            order.createdAt,
        });
      }
    }

    // ---------------------------------------------------------
    // Create output directory
    // ---------------------------------------------------------

    fs.mkdirSync(OUTPUT_DIR, {
      recursive: true,
    });

    // ---------------------------------------------------------
    // Save JSON
    // ---------------------------------------------------------

    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(
        salesHistory,
        null,
        2
      ),
      "utf8"
    );

    // ---------------------------------------------------------
    // Summary
    // ---------------------------------------------------------

    const productSet = new Set(
      salesHistory.map(
        (row) => row.productId
      )
    );

    const totalUnits = salesHistory.reduce(
      (sum, row) =>
        sum + Number(row.quantity || 0),
      0
    );

    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      "       FORECAST DATA EXPORT COMPLETE"
    );
    console.log(
      "========================================"
    );

    console.log(
      `Orders exported: ${orders.length}`
    );

    console.log(
      `Sales records: ${salesHistory.length}`
    );

    console.log(
      `Products: ${productSet.size}`
    );

    console.log(
      `Total units sold: ${totalUnits}`
    );

    console.log(
      `Output: ${OUTPUT_FILE}`
    );

    console.log(
      "========================================"
    );
  } catch (error) {
    console.error(
      "Forecast data export failed:"
    );

    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

exportForecastData();