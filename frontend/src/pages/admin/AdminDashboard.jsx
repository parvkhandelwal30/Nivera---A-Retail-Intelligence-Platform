import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import api from "../../api/axios";
import AdminNav from "../../components/AdminNav";

// ============================================================
// CHART COLORS
// ============================================================

const CATEGORY_BAR_COLORS = [
  "#c98a1b",
  "#2f6f52",
  "#b23a2e",
  "#3b3654",
  "#a8710f",
  "#4b5d3a",
  "#8b4a62",
  "#6b6559",
];

// ============================================================
// CHART TOOLTIP
// ============================================================

const ChartTooltip = ({
  active,
  payload,
  label,
  prefix = "₹",
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="bg-ink text-white text-xs px-3 py-2 rounded-md font-mono shadow-lg">
      <div className="text-white/60 mb-0.5">
        {label}
      </div>

      <div className="font-semibold">
        {prefix}
        {Number(payload[0].value || 0).toFixed(2)}
      </div>
    </div>
  );
};

// ============================================================
// RISK BADGE
// ============================================================

const getRiskBadgeClass = (riskLevel) => {
  switch (riskLevel) {
    case "HIGH":
      return "bg-brick-light text-brick";

    case "MEDIUM":
      return "bg-brand-light text-brand-dark";

    case "LOW":
      return "bg-pine-light text-pine";

    default:
      return "bg-paper text-ink-muted";
  }
};

// ============================================================
// ADMIN DASHBOARD
// ============================================================

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  // ML risk state
  const [stockoutRisks, setStockoutRisks] = useState([]);
  const [stockoutLoading, setStockoutLoading] = useState(false);

  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setDashboardError("");

        // ----------------------------------------------------
        // STEP 1
        // Load normal dashboard statistics.
        //
        // IMPORTANT:
        // We do NOT wait for ML predictions here.
        // ----------------------------------------------------

        const response = await api.get(
          "/products/dashboard/stats"
        );

        if (cancelled) {
          return;
        }

        const dashboardStats = response.data;

        setStats(dashboardStats);

        // ----------------------------------------------------
        // Dashboard is now ready to display.
        // ----------------------------------------------------

        setLoading(false);

        // ----------------------------------------------------
        // STEP 2
        // Calculate ML stockout risk in background.
        //
        // Only low-stock products are considered.
        // ----------------------------------------------------

        const lowStockProducts =
          dashboardStats.lowStockProducts || [];

        if (lowStockProducts.length === 0) {
          setStockoutRisks([]);
          setStockoutLoading(false);
          return;
        }

        setStockoutLoading(true);

        // ----------------------------------------------------
        // IMPORTANT PERFORMANCE OPTIMIZATION
        //
        // We only calculate the first 10 low-stock products.
        // The detailed product page can calculate any product.
        // ----------------------------------------------------

        const productsToPredict =
          lowStockProducts.slice(0, 10);

        // ----------------------------------------------------
        // Run fast stockout predictions.
        //
        // forecast=false tells the backend NOT to run the
        // expensive demand forecasting pipeline.
        // ----------------------------------------------------

        const results =
          await Promise.allSettled(
            productsToPredict.map(
              async (product) => {
                try {
                  const predictionResponse =
                    await api.get(
                      `/stockout/product/${product._id}?forecast=false`,
                      {
                        timeout: 15000,
                      }
                    );

                  return {
                    ...product,
                    ...(
                      predictionResponse.data?.data ||
                      {}
                    ),
                  };
                } catch (error) {
                  console.error(
                    `Stockout prediction failed for ${product.name}:`,
                    error
                  );

                  return {
                    ...product,
                    predictionError: true,
                  };
                }
              }
            )
          );

        if (cancelled) {
          return;
        }

        const formattedResults =
          results.map(
            (result, index) => {
              if (
                result.status ===
                "fulfilled"
              ) {
                return result.value;
              }

              return {
                ...productsToPredict[index],
                predictionError: true,
              };
            }
          );

        // ----------------------------------------------------
        // Sort:
        // HIGH → MEDIUM → LOW
        // ----------------------------------------------------

        const riskOrder = {
          HIGH: 1,
          MEDIUM: 2,
          LOW: 3,
        };

        formattedResults.sort(
          (a, b) => {
            const riskA =
              riskOrder[
                a.prediction?.risk_level
              ] || 99;

            const riskB =
              riskOrder[
                b.prediction?.risk_level
              ] || 99;

            if (riskA !== riskB) {
              return riskA - riskB;
            }

            const probabilityA =
              Number(
                a.prediction
                  ?.risk_percentage
              ) || 0;

            const probabilityB =
              Number(
                b.prediction
                  ?.risk_percentage
              ) || 0;

            return (
              probabilityB -
              probabilityA
            );
          }
        );

        setStockoutRisks(
          formattedResults
        );

        setStockoutLoading(false);
      } catch (error) {
        console.error(
          "Could not load dashboard:",
          error
        );

        if (!cancelled) {
          setDashboardError(
            error.response?.data?.message ||
              "Could not load dashboard."
          );

          setLoading(false);
          setStockoutLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // MAIN LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="text-center text-ink-muted py-16">
        Loading dashboard...
      </div>
    );
  }

  // ==========================================================
  // MAIN ERROR
  // ==========================================================

  if (dashboardError || !stats) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AdminNav />

        <div className="border border-brick bg-brick-light rounded-lg p-6 text-center mt-6">
          <p className="text-brick font-medium">
            Unable to load dashboard
          </p>

          <p className="text-brick text-sm mt-2">
            {dashboardError ||
              "Dashboard data is unavailable."}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="mt-4 bg-ink text-white px-4 py-2 rounded-lg text-sm"
          >
            Reload dashboard
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ML RISK DISTRIBUTION
  // ==========================================================

  // Count only successful ML predictions.
  // Failed predictions are excluded so they are not
  // incorrectly classified as LOW risk.

  const riskDistribution = stockoutRisks.reduce(
    (counts, item) => {
      if (item.predictionError) {
        return counts;
      }

      const riskLevel =
        item.prediction?.risk_level;

      if (riskLevel === "HIGH") {
        counts.HIGH += 1;
      } else if (riskLevel === "MEDIUM") {
        counts.MEDIUM += 1;
      } else if (riskLevel === "LOW") {
        counts.LOW += 1;
      }

      return counts;
    },
    {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    }
  );

  const evaluatedRiskProducts =
    riskDistribution.HIGH +
    riskDistribution.MEDIUM +
    riskDistribution.LOW;

  const riskDistributionData = [
    {
      label: "HIGH",
      count: riskDistribution.HIGH,
      barClass: "bg-brick",
      textClass: "text-brick",
    },
    {
      label: "MEDIUM",
      count: riskDistribution.MEDIUM,
      barClass: "bg-brand",
      textClass: "text-brand-dark",
    },
    {
      label: "LOW",
      count: riskDistribution.LOW,
      barClass: "bg-pine",
      textClass: "text-pine",
    },
  ];

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AdminNav />

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="mb-6">
        <p className="font-mono text-xs text-brand-dark uppercase tracking-wider mb-1">
          Admin
        </p>

        <h1 className="font-display text-2xl font-semibold text-ink">
          Dashboard
        </h1>
      </div>

      {/* ======================================================
          SUMMARY CARDS
          ====================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

        {/* TOTAL PRODUCTS */}

        <div className="bg-white border border-line rounded-lg p-5">
          <p className="text-sm text-ink-muted">
            Total products
          </p>

          <p className="font-mono text-2xl sm:text-3xl font-semibold text-ink mt-1">
            {stats.totalProducts}
          </p>
        </div>

        {/* LOW STOCK */}

        <div className="bg-white border border-line rounded-lg p-5">
          <p className="text-sm text-ink-muted">
            Low stock items
          </p>

          <p className="font-mono text-2xl sm:text-3xl font-semibold text-brand-dark mt-1">
            {stats.lowStockCount}
          </p>
        </div>

        {/* TOTAL ORDERS */}

        <div className="bg-white border border-line rounded-lg p-5">
          <p className="text-sm text-ink-muted">
            Total orders
          </p>

          <p className="font-mono text-2xl sm:text-3xl font-semibold text-ink mt-1">
            {stats.totalOrders}
          </p>
        </div>

        {/* TOTAL REVENUE */}

        <div className="bg-white border border-line rounded-lg p-5">
          <p className="text-sm text-ink-muted">
            Total revenue
          </p>

          <p className="font-mono text-2xl sm:text-3xl font-semibold text-pine mt-1">
            ₹
            {Number(
              stats.totalRevenue || 0
            ).toFixed(0)}
          </p>
        </div>

        {/* LISTINGS */}

        <Link
          to="/admin/listings"
          className="bg-white border border-line rounded-lg p-5 hover:border-brand transition-colors"
        >
          <p className="text-sm text-ink-muted">
            Listings to review
          </p>

          <p
            className={`font-mono text-2xl sm:text-3xl font-semibold mt-1 ${
              stats.pendingListingsCount >
              0
                ? "text-brand-dark"
                : "text-ink"
            }`}
          >
            {stats.pendingListingsCount}
          </p>
        </Link>
      </div>

      {/* ======================================================
          CHARTS
          ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* ----------------------------------------------------
            REVENUE
            ---------------------------------------------------- */}

        <div className="bg-white border border-line rounded-lg p-5">
          <h2 className="font-display text-base font-semibold text-ink mb-1">
            Revenue, last 14 days
          </h2>

          <p className="text-xs text-ink-muted mb-4">
            Daily revenue, cancelled orders excluded
          </p>

          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <LineChart
              data={
                stats.revenueByDay || []
              }
              margin={{
                left: -20,
                right: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e4dfd2"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{
                  fontSize: 11,
                  fill: "#6b6559",
                }}
                interval={2}
                axisLine={{
                  stroke: "#e4dfd2",
                }}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "#6b6559",
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                content={
                  <ChartTooltip />
                }
              />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#c98a1b"
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: "#c98a1b",
                }}
                activeDot={{
                  r: 5,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ----------------------------------------------------
            CATEGORY REVENUE
            ---------------------------------------------------- */}

        <div className="bg-white border border-line rounded-lg p-5">
          <h2 className="font-display text-base font-semibold text-ink mb-1">
            Revenue by category
          </h2>

          <p className="text-xs text-ink-muted mb-4">
            All-time, cancelled orders excluded
          </p>

          {!stats.salesByCategory ||
          stats.salesByCategory.length ===
            0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-ink-muted">
              No sales yet.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={220}
            >
              <BarChart
                data={
                  stats.salesByCategory
                }
                layout="vertical"
                margin={{
                  left: 10,
                  right: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e4dfd2"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  tick={{
                    fontSize: 11,
                    fill: "#6b6559",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  dataKey="category"
                  type="category"
                  width={110}
                  tick={{
                    fontSize: 11,
                    fill: "#1b1b1f",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  content={
                    <ChartTooltip />
                  }
                  cursor={{
                    fill: "#faf7f1",
                  }}
                />

                <Bar
                  dataKey="revenue"
                  radius={[
                    0,
                    4,
                    4,
                    0,
                  ]}
                >
                  {stats.salesByCategory.map(
                    (entry, index) => (
                      <Cell
                        key={
                          entry.category
                        }
                        fill={
                          CATEGORY_BAR_COLORS[
                            index %
                              CATEGORY_BAR_COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ======================================================
          LOW STOCK + TOP SELLING
          ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LOW STOCK */}

        <div className="bg-white border border-line rounded-lg p-5">
          <h2 className="font-display text-base font-semibold text-ink mb-3 flex items-center gap-2">
            <span className="stamp text-brand-dark text-[0.6rem]">
              low stock
            </span>
          </h2>

          {!stats.lowStockProducts ||
          stats.lowStockProducts.length ===
            0 ? (
            <p className="text-sm text-ink-muted">
              All products are well stocked.
            </p>
          ) : (
            <div className="space-y-2">
              {stats.lowStockProducts.map(
                (product) => (
                  <div
                    key={product._id}
                    className="flex justify-between text-sm py-1.5 border-b border-line last:border-0"
                  >
                    <span className="text-ink">
                      {product.name}
                    </span>

                    <span className="font-mono text-brand-dark font-medium">
                      {product.stock} left
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* TOP SELLING */}

        <div className="bg-white border border-line rounded-lg p-5">
          <h2 className="font-display text-base font-semibold text-ink mb-3 flex items-center gap-2">
            <span className="stamp text-pine text-[0.6rem]">
              top selling
            </span>
          </h2>

          {!stats.topSelling ||
          stats.topSelling.length ===
            0 ? (
            <p className="text-sm text-ink-muted">
              No sales yet.
            </p>
          ) : (
            <div className="space-y-2">
              {stats.topSelling.map(
                (product) => (
                  <div
                    key={product._id}
                    className="flex justify-between text-sm py-1.5 border-b border-line last:border-0"
                  >
                    <span className="text-ink">
                      {product.name}
                    </span>

                    <span className="font-mono text-ink-muted">
                      {product.unitsSold} sold
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          ML STOCKOUT RISK
          ====================================================== */}

      <div className="bg-white border border-line rounded-lg p-5 mt-6">

        {/* HEADER */}

        <div className="mb-4">
          <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
            <span className="stamp text-brand-dark text-[0.6rem]">
              ML STOCKOUT RISK
            </span>
          </h2>

          <p className="text-xs text-ink-muted mt-1">
            Machine learning based backorder risk for low-stock products
          </p>
        </div>

        {/* BACKGROUND LOADING */}

        {stockoutLoading && (
          <div className="flex items-center gap-2 text-sm text-ink-muted mb-4">
            <div className="w-3 h-3 border-2 border-line border-t-brand rounded-full animate-spin" />

            <span>
              Calculating stockout risk...
            </span>
          </div>
        )}

        {/* NO RESULTS */}

        {!stockoutLoading &&
          stockoutRisks.length === 0 && (
            <div className="border border-dashed border-line rounded-lg p-6 text-center">
              <p className="text-sm text-ink-muted">
                No stockout predictions are currently available.
              </p>
            </div>
          )}

        {/* RESULTS */}

        {stockoutRisks.length > 0 && (
          <div className="space-y-2">

            {stockoutRisks.map(
              (item, index) => {
                const product =
                  item.product || {};

                const productId =
                  product.id ||
                  product._id ||
                  item._id ||
                  index;

                const productName =
                  product.name ||
                  item.name ||
                  "Unknown product";

                const stock =
                  product.stock ??
                  item.stock ??
                  0;

                const prediction =
                  item.prediction;

                const riskPercentage =
                  Number(
                    prediction?.risk_percentage
                  ) || 0;

                const riskLevel =
                  prediction?.risk_level ||
                  "UNKNOWN";

                return (
                  <div
                    key={productId}
                    className="flex items-center justify-between gap-4 py-2.5 border-b border-line last:border-0"
                  >

                    {/* PRODUCT */}

                    <div className="min-w-0">
                      <p className="text-sm text-ink font-medium truncate">
                        {productName}
                      </p>

                      <p className="text-xs text-ink-muted mt-0.5">
                        Stock: {stock}
                      </p>
                    </div>

                    {/* PREDICTION */}

                    {item.predictionError ? (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-paper text-ink-muted flex-shrink-0">
                        Unavailable
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">

                        <span className="font-mono text-sm font-semibold text-ink">
                          {riskPercentage.toFixed(
                            2
                          )}
                          %
                        </span>

                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${getRiskBadgeClass(
                            riskLevel
                          )}`}
                        >
                          {riskLevel}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* LIMIT NOTE */}

        {stats.lowStockProducts &&
          stats.lowStockProducts.length >
            10 && (
            <div className="mt-4 pt-3 border-t border-line">
              <p className="text-[11px] text-ink-muted">
                Showing ML risk for the 10 most relevant low-stock
                products. Open{" "}
                <Link
                  to="/admin/products"
                  className="text-brand-dark font-medium hover:underline"
                >
                  Products → AI Insights
                </Link>{" "}
                for the complete demand forecast and stockout
                analysis of any product.
              </p>
            </div>
          )}

        {/* ======================================================
            ML RISK DISTRIBUTION
            ====================================================== */}

        {!stockoutLoading &&
          evaluatedRiskProducts > 0 && (
            <div className="mt-6 pt-5 border-t border-line">

              <div className="mb-4">
                <h3 className="font-display text-sm font-semibold text-ink">
                  ML Risk Distribution
                </h3>

                <p className="text-xs text-ink-muted mt-1">
                  Based on successfully evaluated low-stock products
                </p>
              </div>

              {/* RISK SUMMARY CARDS */}

              <div className="grid grid-cols-3 gap-3 mb-5">

                {riskDistributionData.map(
                  (risk) => (
                    <div
                      key={risk.label}
                      className="border border-line rounded-lg p-3 text-center"
                    >
                      <p
                        className={`text-[10px] font-semibold tracking-wider ${risk.textClass}`}
                      >
                        {risk.label}
                      </p>

                      <p className="font-mono text-2xl font-semibold text-ink mt-1">
                        {risk.count}
                      </p>
                    </div>
                  )
                )}

              </div>

              {/* RISK BARS */}

              <div className="space-y-3">

                {riskDistributionData.map(
                  (risk) => {
                    const percentage =
                      evaluatedRiskProducts > 0
                        ? (risk.count /
                            evaluatedRiskProducts) *
                          100
                        : 0;

                    return (
                      <div
                        key={risk.label}
                        className="grid grid-cols-[52px_1fr_42px] items-center gap-3"
                      >

                        <span
                          className={`text-[11px] font-semibold ${risk.textClass}`}
                        >
                          {risk.label}
                        </span>

                        <div className="h-2 bg-paper rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${risk.barClass}`}
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <span className="font-mono text-xs text-ink-muted text-right">
                          {risk.count}
                        </span>

                      </div>
                    );
                  }
                )}

              </div>

              <p className="text-[11px] text-ink-muted mt-4">
                {evaluatedRiskProducts} product
                {evaluatedRiskProducts !== 1
                  ? "s"
                  : ""}{" "}
                evaluated by the ML stockout model.
              </p>

            </div>
          )}

      </div>
    </div>
  );
}