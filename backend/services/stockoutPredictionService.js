const Product = require("../models/Product");
const Order = require("../models/Order");
const { predictStockout } = require("./stockoutService");
const axios = require("axios");

// ============================================================
// CONFIGURATION
// ============================================================

const ML_API_URL =
  process.env.ML_API_URL || "http://127.0.0.1:8001";

const DEFAULT_LEAD_TIME_DAYS = Number(
  process.env.DEFAULT_LEAD_TIME_DAYS || 7
);

const DEFAULT_PERFORMANCE = Number(
  process.env.DEFAULT_PERFORMANCE || 0.5
);

const VALID_ORDER_STATUSES = [
  "confirmed",
  "shipped",
  "delivered",
];

// ============================================================
// GET HISTORICAL SALES
// ============================================================

const getSalesHistory = async (productId) => {
  const now = new Date();

  const start30 = new Date(now);
  start30.setDate(start30.getDate() - 30);

  const start90 = new Date(now);
  start90.setDate(start90.getDate() - 90);

  const start180 = new Date(now);
  start180.setDate(start180.getDate() - 180);

  const start270 = new Date(now);
  start270.setDate(start270.getDate() - 270);

  const result = await Order.aggregate([
    {
      $match: {
        status: {
          $in: VALID_ORDER_STATUSES,
        },
        createdAt: {
          $gte: start270,
        },
        "items.product": productId,
      },
    },

    {
      $unwind: "$items",
    },

    {
      $match: {
        "items.product": productId,
      },
    },

    {
      $facet: {
        last30Days: [
          {
            $match: {
              createdAt: {
                $gte: start30,
              },
            },
          },
          {
            $group: {
              _id: null,
              units: {
                $sum: "$items.quantity",
              },
            },
          },
        ],

        last90Days: [
          {
            $match: {
              createdAt: {
                $gte: start90,
              },
            },
          },
          {
            $group: {
              _id: null,
              units: {
                $sum: "$items.quantity",
              },
            },
          },
        ],

        last180Days: [
          {
            $match: {
              createdAt: {
                $gte: start180,
              },
            },
          },
          {
            $group: {
              _id: null,
              units: {
                $sum: "$items.quantity",
              },
            },
          },
        ],

        last270Days: [
          {
            $match: {
              createdAt: {
                $gte: start270,
              },
            },
          },
          {
            $group: {
              _id: null,
              units: {
                $sum: "$items.quantity",
              },
            },
          },
        ],
      },
    },
  ]);

  const data = result[0] || {};

  return {
    sales_1_month:
      data.last30Days?.[0]?.units || 0,

    sales_3_month:
      data.last90Days?.[0]?.units || 0,

    sales_6_month:
      data.last180Days?.[0]?.units || 0,

    sales_9_month:
      data.last270Days?.[0]?.units || 0,
  };
};

// ============================================================
// GET WEEKLY DEMAND HISTORY
// ============================================================

const getWeeklyDemandHistory = async (productId) => {
  const startDate = new Date();

  startDate.setDate(
    startDate.getDate() - 270
  );

  const orders = await Order.find({
    status: {
      $in: VALID_ORDER_STATUSES,
    },

    createdAt: {
      $gte: startDate,
    },

    "items.product": productId,
  })
    .select("createdAt items")
    .lean();

  const weeklyMap = new Map();

  // Convert orders into Monday-based weekly demand
  for (const order of orders) {
    const orderDate = new Date(
      order.createdAt
    );

    const day = orderDate.getUTCDay();

    const daysFromMonday =
      day === 0 ? 6 : day - 1;

    const monday = new Date(orderDate);

    monday.setUTCDate(
      monday.getUTCDate() -
        daysFromMonday
    );

    monday.setUTCHours(
      0,
      0,
      0,
      0
    );

    const weekKey = monday
      .toISOString()
      .split("T")[0];

    const productItem = order.items.find(
      (item) =>
        item.product?.toString() ===
        productId.toString()
    );

    if (!productItem) {
      continue;
    }

    const quantity =
      Number(productItem.quantity) || 0;

    weeklyMap.set(
      weekKey,
      (weeklyMap.get(weekKey) || 0) +
        quantity
    );
  }

  const availableWeeks = Array.from(
    weeklyMap.keys()
  ).sort();

  if (availableWeeks.length === 0) {
    throw new Error(
      "No historical sales data found for this product."
    );
  }

  const latestWeek =
    availableWeeks[
      availableWeeks.length - 1
    ];

  // Build complete 39-week history
  const latestWeekDate = new Date(
    `${latestWeek}T00:00:00.000Z`
  );

  const firstWeekDate = new Date(
    latestWeekDate
  );

  firstWeekDate.setUTCDate(
    firstWeekDate.getUTCDate() -
      38 * 7
  );

  const weeklyDemand = [];

  for (
    let index = 0;
    index < 39;
    index++
  ) {
    const weekDate = new Date(
      firstWeekDate
    );

    weekDate.setUTCDate(
      weekDate.getUTCDate() +
        index * 7
    );

    const weekKey = weekDate
      .toISOString()
      .split("T")[0];

    weeklyDemand.push(
      Number(
        weeklyMap.get(weekKey) || 0
      )
    );
  }

  return {
    weeklyDemand,
    lastWeek: latestWeek,
  };
};

// ============================================================
// GET REAL DEMAND FORECAST FROM FASTAPI
// ============================================================

const getDemandForecast = async ({
  product,
  weeklyDemand,
  lastWeek,
}) => {
  try {
    const response = await axios.post(
      `${ML_API_URL}/forecast`,
      {
        product_id:
          product._id?.toString(),

        product_name:
          product.name,

        sku:
          product.sku,

        category:
          product.category,

        weekly_demand:
          weeklyDemand,

        last_week:
          lastWeek,
      },
      {
        // This endpoint is intentionally only used
        // for detailed product intelligence.
        timeout: 120000,
      }
    );

    const forecast = response.data;

    if (!forecast) {
      throw new Error(
        "Demand forecasting API returned no data."
      );
    }

    return {
      forecast_3_month:
        Number(
          forecast.forecast_3_month
        ) || 0,

      forecast_6_month:
        Number(
          forecast.forecast_6_month
        ) || 0,

      forecast_9_month:
        Number(
          forecast.forecast_9_month
        ) || 0,

      forecast_3_month_units:
        Number(
          forecast.forecast_3_month_units
        ) || 0,

      forecast_6_month_units:
        Number(
          forecast.forecast_6_month_units
        ) || 0,

      forecast_9_month_units:
        Number(
          forecast.forecast_9_month_units
        ) || 0,

      lastHistoricalWeek:
        forecast.last_historical_week ||
        lastWeek,

      forecastStartWeek:
        forecast.forecast_start_week ||
        null,

      weeklyForecast:
        Array.isArray(
          forecast.weekly_forecast
        )
          ? forecast.weekly_forecast.map(
              (item) => ({
                week: item.week,

                forecast_demand:
                  Number(
                    item.forecast
                  ) || 0,
              })
            )
          : [],
    };
  } catch (error) {
    console.error(
      "Demand forecasting ML API Error:",
      error.response?.data ||
        error.message
    );

    throw new Error(
      "Demand forecasting service unavailable"
    );
  }
};

// ============================================================
// BUILD COMMON STOCKOUT MODEL INPUT
// ============================================================

const buildStockoutPayload = ({
  product,
  sales,
  forecast3,
  forecast6,
  forecast9,
}) => {
  return {
    sku:
      product.sku ||
      product._id.toString(),

    // Current inventory
    national_inv:
      Number(product.stock) || 0,

    // Default because Nivera does not currently
    // store supplier lead time
    lead_time:
      DEFAULT_LEAD_TIME_DAYS,

    // Nivera does not currently track
    // incoming inventory
    in_transit_qty: 0,

    // Demand forecast
    forecast_3_month:
      Number(forecast3) || 0,

    forecast_6_month:
      Number(forecast6) || 0,

    forecast_9_month:
      Number(forecast9) || 0,

    // Historical sales
    sales_1_month:
      sales.sales_1_month,

    sales_3_month:
      sales.sales_3_month,

    sales_6_month:
      sales.sales_6_month,

    sales_9_month:
      sales.sales_9_month,

    // Nivera low-stock threshold
    min_bank:
      Number(
        product.lowStockThreshold
      ) || 0,

    // Supply-chain fields not currently
    // stored by Nivera
    potential_issue: "No",

    pieces_past_due: 0,

    perf_6_month_avg:
      DEFAULT_PERFORMANCE,

    perf_12_month_avg:
      DEFAULT_PERFORMANCE,

    local_bo_qty: 0,

    deck_risk: "No",

    oe_constraint: "No",

    ppap_risk: "No",

    stop_auto_buy: "No",

    rev_stop: "No",
  };
};

// ============================================================
// FAST STOCKOUT PREDICTION
//
// Used by the ADMIN DASHBOARD.
//
// IMPORTANT:
// This does NOT call the expensive demand forecasting API.
// Historical sales are used as forecast proxies.
//
// This keeps the dashboard fast while preserving the full
// demand forecasting pipeline for detailed AI Insights.
// ============================================================

const predictStockoutFastForProduct = async (
  productId
) => {
  const product =
    await Product.findById(productId);

  if (!product) {
    throw new Error(
      "Product not found"
    );
  }

  const sales =
    await getSalesHistory(
      product._id
    );

  // Historical sales are used as proxies
  // for the fast dashboard prediction.
  const payload =
    buildStockoutPayload({
      product,
      sales,

      forecast3:
        sales.sales_3_month,

      forecast6:
        sales.sales_6_month,

      forecast9:
        sales.sales_9_month,
    });

  const prediction =
    await predictStockout(
      payload
    );

  return {
    product: {
      id: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      stock: product.stock,
      lowStockThreshold:
        product.lowStockThreshold,
      unitsSold:
        product.unitsSold,
    },

    salesHistory: sales,

    prediction,

    modelInput: payload,

    mode: "fast",
  };
};

// ============================================================
// FULL STOCKOUT + DEMAND FORECAST
//
// Used by:
// Admin Products → AI Insights
//
// This executes the complete research pipeline:
// historical sales → demand forecast → stockout prediction
// ============================================================

const predictStockoutForProduct = async (
  productId
) => {
  const product =
    await Product.findById(productId);

  if (!product) {
    throw new Error(
      "Product not found"
    );
  }

  // ----------------------------------------------------------
  // Historical sales
  // ----------------------------------------------------------

  const sales =
    await getSalesHistory(
      product._id
    );

  // ----------------------------------------------------------
  // Weekly demand history
  // ----------------------------------------------------------

  const weeklyHistory =
    await getWeeklyDemandHistory(
      product._id
    );

  // ----------------------------------------------------------
  // REAL ML demand forecast
  // ----------------------------------------------------------

  const demandForecast =
    await getDemandForecast({
      product,

      weeklyDemand:
        weeklyHistory.weeklyDemand,

      lastWeek:
        weeklyHistory.lastWeek,
    });

  // ----------------------------------------------------------
  // Stockout model input
  // ----------------------------------------------------------

  const payload =
    buildStockoutPayload({
      product,
      sales,

      // IMPORTANT:
      // These are REAL ML demand forecasts.
      forecast3:
        demandForecast.forecast_3_month,

      forecast6:
        demandForecast.forecast_6_month,

      forecast9:
        demandForecast.forecast_9_month,
    });

  // ----------------------------------------------------------
  // Run stockout ML model
  // ----------------------------------------------------------

  const prediction =
    await predictStockout(
      payload
    );

  // ----------------------------------------------------------
  // Final response
  // ----------------------------------------------------------

  return {
    product: {
      id: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      stock: product.stock,
      lowStockThreshold:
        product.lowStockThreshold,
      unitsSold:
        product.unitsSold,
    },

    salesHistory: sales,

    demandForecast,

    prediction,

    modelInput: payload,

    mode: "full",
  };
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getSalesHistory,
  getWeeklyDemandHistory,
  getDemandForecast,

  predictStockoutFastForProduct,

  predictStockoutForProduct,
};