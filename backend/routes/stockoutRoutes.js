const express = require("express");

const router = express.Router();

const {
  predictStockout,
} = require("../services/stockoutService");

const {
  predictStockoutFastForProduct,
  predictStockoutForProduct,
} = require("../services/stockoutPredictionService");

// ============================================================
// DIRECT STOCKOUT PREDICTION
//
// POST /api/stockout/predict
// ============================================================

router.post(
  "/predict",
  async (req, res) => {
    try {
      const prediction =
        await predictStockout(
          req.body
        );

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      console.error(
        "Stockout prediction error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ============================================================
// PRODUCT STOCKOUT PREDICTION
//
// GET /api/stockout/product/:productId
//
// FULL MODE:
// Uses real demand forecasting + stockout model.
//
// FAST MODE:
// GET /api/stockout/product/:productId?forecast=false
//
// Used by the Admin Dashboard.
// ============================================================

router.get(
  "/product/:productId",
  async (req, res) => {
    try {
      const useFastMode =
        req.query.forecast === "false";

      let result;

      if (useFastMode) {
        result =
          await predictStockoutFastForProduct(
            req.params.productId
          );
      } else {
        result =
          await predictStockoutForProduct(
            req.params.productId
          );
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(
        "Product stockout prediction error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;