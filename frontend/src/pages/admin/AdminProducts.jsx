import { useState, useEffect } from "react";
import api from "../../api/axios";
import AdminNav from "../../components/AdminNav";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "",
  price: "",
  stock: "",
  lowStockThreshold: "10",
  imageUrl: "",
  sku: "",
};

const inputClass =
  "w-full bg-white border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand";

const STATUS_BADGE = {
  approved: "bg-pine-light text-pine",
  pending: "bg-brand-light text-brand-dark",
  rejected: "bg-brick-light text-brick",
};

const RISK_BADGE = {
  HIGH: "bg-brick-light text-brick",
  MEDIUM: "bg-brand-light text-brand-dark",
  LOW: "bg-pine-light text-pine",
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [adjustingId, setAdjustingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // =========================================================
  // PRODUCT SEARCH
  // =========================================================

  const [searchQuery, setSearchQuery] = useState("");

  // ML intelligence state
  const [insightProduct, setInsightProduct] = useState(null);
  const [insightData, setInsightData] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const res = await api.get("/products/admin/all");
      setProducts(res.data);
    } catch (err) {
      setLoadError(
        err.response?.data?.message || "Could not load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setForm({
      name: product.name,
      description: product.description || "",
      category: product.category,
      price: product.price,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      imageUrl: product.imageUrl || "",
      sku: product.sku || "",
    });

    setEditingId(product._id);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const price = Number(form.price);
    const stock = Number(form.stock);

    const lowStockThreshold =
      form.lowStockThreshold === ""
        ? 10
        : Number(form.lowStockThreshold);

    if (Number.isNaN(price) || price < 0) {
      setError("Price must be a number of 0 or more.");
      return;
    }

    if (
      Number.isNaN(stock) ||
      stock < 0 ||
      !Number.isInteger(stock)
    ) {
      setError("Stock must be a whole number of 0 or more.");
      return;
    }

    if (
      Number.isNaN(lowStockThreshold) ||
      lowStockThreshold < 0
    ) {
      setError(
        "Low stock threshold must be a number of 0 or more."
      );
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      price,
      stock,
      lowStockThreshold,
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setShowForm(false);
      fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message || "Save failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Delete "${name}"? This can't be undone.`
      )
    ) {
      return;
    }

    setDeletingId(id);

    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Could not delete product"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const adjustStock = async (product, delta) => {
    const newStock = Math.max(
      0,
      product.stock + delta
    );

    setAdjustingId(product._id);

    setProducts((prev) =>
      prev.map((p) =>
        p._id === product._id
          ? { ...p, stock: newStock }
          : p
      )
    );

    try {
      await api.put(`/products/${product._id}`, {
        stock: newStock,
      });
    } catch (err) {
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id
            ? { ...p, stock: product.stock }
            : p
        )
      );

      alert(
        err.response?.data?.message ||
          "Could not update stock"
      );
    } finally {
      setAdjustingId(null);
    }
  };

  // =========================================================
  // ML PRODUCT INTELLIGENCE
  // =========================================================

  const openProductInsights = async (product) => {
    setInsightProduct(product);
    setInsightData(null);
    setInsightError("");
    setInsightLoading(true);

    try {
      const res = await api.get(
        `/stockout/product/${product._id}`
      );

      setInsightData(
        res.data?.data || res.data
      );
    } catch (err) {
      setInsightError(
        err.response?.data?.message ||
          "Could not load stockout intelligence."
      );
    } finally {
      setInsightLoading(false);
    }
  };

  const closeProductInsights = () => {
    setInsightProduct(null);
    setInsightData(null);
    setInsightError("");
    setInsightLoading(false);
  };

  // =========================================================
  // DERIVED ML INSIGHT VALUES
  // =========================================================

  const getInsightValues = () => {
    if (!insightData) return null;

    const product =
      insightData.product ||
      insightProduct ||
      {};

    const sales =
      insightData.salesHistory || {};

    const prediction =
      insightData.prediction || {};

    const modelInput =
      insightData.modelInput || {};

    const demandForecast =
      insightData.demandForecast || {};

    const weeklyForecast = Array.isArray(
      demandForecast.weeklyForecast
    )
      ? demandForecast.weeklyForecast
      : [];

    const stock =
      Number(product.stock) || 0;

    const sales1 =
      Number(sales.sales_1_month) || 0;

    const sales3 =
      Number(sales.sales_3_month) || 0;

    const sales6 =
      Number(sales.sales_6_month) || 0;

    const sales9 =
      Number(sales.sales_9_month) || 0;

    const lowStockThreshold =
      Number(product.lowStockThreshold) || 0;

    const probability =
      Number(
        prediction.stockout_probability
      ) || 0;

    const riskPercentage =
      Number(
        prediction.risk_percentage
      ) || probability * 100;

    const riskLevel =
      prediction.risk_level ||
      (riskPercentage >= 70
        ? "HIGH"
        : riskPercentage >= 30
        ? "MEDIUM"
        : "LOW");

    const predictionLabel =
      prediction.prediction_label ||
      (prediction.prediction === 1
        ? "BACKORDER"
        : "NO BACKORDER");

    const leadTime =
      Number(modelInput.lead_time) || 7;

    // ---------------------------------------------------------
    // REAL ML DEMAND FORECAST
    // ---------------------------------------------------------

    const forecast3 =
      Number(
        demandForecast.forecast_3_month
      ) || 0;

    const forecast6 =
      Number(
        demandForecast.forecast_6_month
      ) || 0;

    const forecast9 =
      Number(
        demandForecast.forecast_9_month
      ) || 0;

    const forecast3Units =
      Number(
        demandForecast.forecast_3_month_units
      ) || Math.round(forecast3);

    const forecast6Units =
      Number(
        demandForecast.forecast_6_month_units
      ) || Math.round(forecast6);

    const forecast9Units =
      Number(
        demandForecast.forecast_9_month_units
      ) || Math.round(forecast9);

    const lastHistoricalWeek =
      demandForecast.lastHistoricalWeek ||
      "";

    const forecastStartWeek =
      demandForecast.forecastStartWeek ||
      weeklyForecast[0]?.week ||
      "";

    // Historical demand
    const averageMonthlyDemand =
      sales3 > 0
        ? sales3 / 3
        : 0;

    const averageDailyDemand =
      averageMonthlyDemand / 30;

    const historicalLeadTimeDemand =
      averageDailyDemand * leadTime;

    const historicalCoverageDays =
      averageDailyDemand > 0
        ? stock / averageDailyDemand
        : null;

    // ---------------------------------------------------------
    // FORECAST-BASED REORDER ESTIMATE
    //
    // This is NOT an ML-predicted reorder quantity.
    // It uses the ML 3-month demand forecast as the demand
    // estimate, then applies a business rule.
    // ---------------------------------------------------------

    const forecastMonthlyDemand =
      forecast3 > 0
        ? forecast3 / 3
        : averageMonthlyDemand;

    const forecastDailyDemand =
      forecastMonthlyDemand / 30;

    const forecastLeadTimeDemand =
      forecastDailyDemand * leadTime;

    const estimatedReorderQuantity =
      Math.max(
        0,
        Math.ceil(
          forecastLeadTimeDemand +
            lowStockThreshold -
            stock
        )
      );

    const forecastCoverageDays =
      forecastDailyDemand > 0
        ? stock / forecastDailyDemand
        : null;

    // ---------------------------------------------------------
    // INVENTORY VS FORECAST COMPARISON
    // ---------------------------------------------------------

    const inventoryComparisonMax = Math.max(
      1,
      stock,
      forecast3Units,
      forecast6Units,
      forecast9Units
    );

    // Maximum weekly value for visual bars
    const maxWeeklyForecast =
      Math.max(
        1,
        ...weeklyForecast.map(
          (item) =>
            Number(
              item.forecast_demand
            ) || 0
        )
      );

    let recommendation = "";
    let recommendationTone = "";

    if (riskLevel === "HIGH") {
      recommendation =
        estimatedReorderQuantity > 0
          ? `Replenishment recommended. Consider adding approximately ${estimatedReorderQuantity} units based on forecasted demand and the configured safety threshold.`
          : "Replenishment recommended. Review inventory and supplier lead time.";

      recommendationTone = "high";
    } else if (riskLevel === "MEDIUM") {
      recommendation =
        estimatedReorderQuantity > 0
          ? `Monitor closely. Approximately ${estimatedReorderQuantity} units may be needed to maintain the configured safety buffer.`
          : "Monitor inventory and recent demand closely.";

      recommendationTone = "medium";
    } else {
      recommendation =
        "Inventory currently appears sufficient based on the current ML risk estimate and forecast.";

      recommendationTone = "low";
    }

    return {
      stock,
      lowStockThreshold,

      sales1,
      sales3,
      sales6,
      sales9,

      probability,
      riskPercentage,
      riskLevel,
      predictionLabel,

      leadTime,

      averageMonthlyDemand,
      averageDailyDemand,
      historicalLeadTimeDemand,
      historicalCoverageDays,

      forecast3,
      forecast6,
      forecast9,

      forecast3Units,
      forecast6Units,
      forecast9Units,

      inventoryComparisonMax,

      weeklyForecast,
      maxWeeklyForecast,

      lastHistoricalWeek,
      forecastStartWeek,

      forecastMonthlyDemand,
      forecastDailyDemand,
      forecastLeadTimeDemand,
      forecastCoverageDays,

      estimatedReorderQuantity,

      recommendation,
      recommendationTone,
    };
  };

  const insight = getInsightValues();

  // =========================================================
  // PRODUCT SEARCH
  // =========================================================

  const normalizedSearch =
    searchQuery.trim().toLowerCase();

  const filteredProducts =
    normalizedSearch
      ? products.filter((product) => {
          const name =
            String(
              product.name || ""
            ).toLowerCase();

          const sku =
            String(
              product.sku || ""
            ).toLowerCase();

          const category =
            String(
              product.category || ""
            ).toLowerCase();

          return (
            name.includes(
              normalizedSearch
            ) ||
            sku.includes(
              normalizedSearch
            ) ||
            category.includes(
              normalizedSearch
            )
          );
        })
      : products;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AdminNav />

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <p className="font-mono text-xs text-brand-dark uppercase tracking-wider mb-1">
            Admin
          </p>

          <h1 className="font-display text-2xl font-semibold text-ink">
            Manage products
          </h1>
        </div>

        <button
          onClick={openAddForm}
          className="bg-brand hover:bg-brand-dark text-ink font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Add product
        </button>
      </div>

      {/* =====================================================
          ADD / EDIT FORM
          ===================================================== */}

      {showForm && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-line">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">
              {editingId
                ? "Edit product"
                : "Add product"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              <input
                required
                placeholder="Product name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className={inputClass}
              />

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value,
                  })
                }
                className={inputClass}
                rows={2}
              />

              <input
                required
                placeholder="Category"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category:
                      e.target.value,
                  })
                }
                className={inputClass}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: e.target.value,
                    })
                  }
                  className={inputClass}
                />

                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stock: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              <input
                type="number"
                min="0"
                placeholder="Low stock threshold (default 10)"
                value={
                  form.lowStockThreshold
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    lowStockThreshold:
                      e.target.value,
                  })
                }
                className={inputClass}
              />

              <input
                placeholder="Image URL (optional)"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm({
                    ...form,
                    imageUrl:
                      e.target.value,
                  })
                }
                className={inputClass}
              />

              <input
                placeholder="SKU (optional)"
                value={form.sku}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sku: e.target.value,
                  })
                }
                className={inputClass}
              />

              {error && (
                <div className="text-brick text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  className="flex-1 border border-line text-ink text-sm font-medium py-2 rounded-lg hover:bg-paper transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-ink hover:bg-black disabled:bg-line disabled:text-ink-muted text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {saving
                    ? "Saving..."
                    : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          PRODUCT SEARCH
          ===================================================== */}

      {!loading && !loadError && (
        <div className="bg-white border border-line rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm pointer-events-none"
                aria-hidden="true"
              >
                🔍
              </span>

              <input
                type="search"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(
                    e.target.value
                  )
                }
                placeholder="Search by product name, SKU or category..."
                aria-label="Search products"
                className={`${inputClass} pl-9`}
              />
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setSearchQuery("")
                }
                className="text-sm text-ink-muted hover:text-ink font-medium whitespace-nowrap"
              >
                Clear search
              </button>
            )}
          </div>

          <div className="flex justify-between items-center mt-3 text-xs text-ink-muted gap-3">
            <span>
              {searchQuery
                ? `Showing ${filteredProducts.length} of ${products.length} products`
                : `${products.length} products`}
            </span>

            {searchQuery &&
              filteredProducts.length ===
                0 && (
                <span className="text-brick">
                  No products found for "
                  {searchQuery}"
                </span>
              )}
          </div>
        </div>
      )}

      {/* =====================================================
          PRODUCTS TABLE
          ===================================================== */}

      {loading ? (
        <div className="text-center text-ink-muted py-16">
          Loading products...
        </div>
      ) : loadError ? (
        <div className="text-center py-16 border border-dashed border-line rounded-lg">
          <p className="text-brick text-sm mb-3">
            {loadError}
          </p>

          <button
            onClick={fetchProducts}
            className="text-sm font-medium text-brand-dark hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[850px]">
            <thead className="bg-paper text-ink-muted text-left font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">
                  Name
                </th>

                <th className="px-4 py-3 font-medium">
                  Category
                </th>

                <th className="px-4 py-3 font-medium">
                  Price
                </th>

                <th className="px-4 py-3 font-medium">
                  Stock
                </th>

                <th className="px-4 py-3 font-medium">
                  Status
                </th>

                <th className="px-4 py-3 font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map(
                (p) => (
                  <tr
                    key={p._id}
                    className="border-t border-line hover:bg-paper/60 transition-colors"
                  >
                    <td className="px-4 py-3 text-ink font-medium">
                      {p.name}

                      {p.submittedBy && (
                        <div className="text-xs text-ink-muted font-normal mt-0.5">
                          Listed by{" "}
                          {p.submittedBy.name}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-ink-muted">
                      {p.category}
                    </td>

                    <td className="px-4 py-3 text-ink font-mono">
                      ₹
                      {Number(
                        p.price
                      ).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            adjustStock(
                              p,
                              -1
                            )
                          }
                          disabled={
                            adjustingId ===
                              p._id ||
                            p.stock <= 0
                          }
                          className="w-6 h-6 rounded border border-line text-ink-muted hover:bg-paper disabled:opacity-30 flex items-center justify-center"
                        >
                          −
                        </button>

                        <span
                          className={
                            p.stock <=
                            p.lowStockThreshold
                              ? "text-brand-dark font-medium w-6 text-center"
                              : "text-ink-muted w-6 text-center"
                          }
                        >
                          {p.stock}
                        </span>

                        <button
                          onClick={() =>
                            adjustStock(
                              p,
                              1
                            )
                          }
                          disabled={
                            adjustingId ===
                            p._id
                          }
                          className="w-6 h-6 rounded border border-line text-ink-muted hover:bg-paper disabled:opacity-30 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          STATUS_BADGE[
                            p.approvalStatus
                          ] ||
                          "bg-paper text-ink-muted"
                        }`}
                      >
                        {
                          p.approvalStatus
                        }
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() =>
                            openProductInsights(
                              p
                            )
                          }
                          className="text-pine hover:underline font-medium"
                        >
                          AI Insights
                        </button>

                        <button
                          onClick={() =>
                            openEditForm(p)
                          }
                          className="text-brand-dark hover:underline"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              p._id,
                              p.name
                            )
                          }
                          disabled={
                            deletingId ===
                            p._id
                          }
                          className="text-brick hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {deletingId ===
                          p._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {filteredProducts.length ===
            0 && (
            <div className="text-center text-ink-muted py-10 text-sm">
              {products.length === 0
                ? "No products yet. Add one to get started."
                : `No products found for "${searchQuery}".`}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          PRODUCT ML INTELLIGENCE MODAL
          ===================================================== */}

      {insightProduct && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-30">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-line shadow-xl">

            {/* HEADER */}

            <div className="px-6 py-5 border-b border-line flex justify-between items-start gap-4 sticky top-0 bg-white z-10">
              <div>
                <p className="font-mono text-xs text-brand-dark uppercase tracking-wider mb-1">
                  Inventory Intelligence
                </p>

                <h2 className="font-display text-xl font-semibold text-ink">
                  {insightProduct.name}
                </h2>

                <p className="text-sm text-ink-muted mt-1">
                  ML demand forecasting + stockout risk analysis
                </p>
              </div>

              <button
                onClick={
                  closeProductInsights
                }
                className="text-ink-muted hover:text-ink text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* LOADING */}

            {insightLoading && (
              <div className="py-16 text-center text-ink-muted">
                <div className="font-medium text-ink mb-1">
                  Analyzing product...
                </div>

                <div className="text-sm">
                  Fetching sales history,
                  demand forecast and ML
                  risk.
                </div>
              </div>
            )}

            {/* ERROR */}

            {!insightLoading &&
              insightError && (
                <div className="p-6">
                  <div className="border border-brick rounded-lg p-4 bg-brick-light">
                    <p className="text-brick font-medium text-sm">
                      Unable to load
                      inventory
                      intelligence
                    </p>

                    <p className="text-brick text-sm mt-1">
                      {insightError}
                    </p>
                  </div>
                </div>
              )}

            {/* CONTENT */}

            {!insightLoading &&
              !insightError &&
              insight &&
              insightData && (
                <div className="p-6 space-y-6">

                  {/* 1. TOP SUMMARY */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                    <div className="border border-line rounded-lg p-4">
                      <p className="text-xs text-ink-muted uppercase tracking-wide">
                        Current stock
                      </p>

                      <p className="font-mono text-2xl font-semibold text-ink mt-1">
                        {insight.stock}
                      </p>

                      <p className="text-xs text-ink-muted mt-1">
                        Threshold:{" "}
                        {
                          insight.lowStockThreshold
                        }
                      </p>
                    </div>

                    <div className="border border-line rounded-lg p-4">
                      <p className="text-xs text-ink-muted uppercase tracking-wide">
                        9M historical
                        sales
                      </p>

                      <p className="font-mono text-2xl font-semibold text-ink mt-1">
                        {insight.sales9}
                      </p>

                      <p className="text-xs text-ink-muted mt-1">
                        Units sold
                      </p>
                    </div>

                    <div className="border border-line rounded-lg p-4">
                      <p className="text-xs text-ink-muted uppercase tracking-wide">
                        ML stockout
                        risk
                      </p>

                      <p className="font-mono text-2xl font-semibold text-ink mt-1">
                        {insight.riskPercentage.toFixed(
                          2
                        )}
                        %
                      </p>

                      <span
                        className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          RISK_BADGE[
                            insight
                              .riskLevel
                          ] ||
                          "bg-paper text-ink-muted"
                        }`}
                      >
                        {
                          insight.riskLevel
                        }
                      </span>
                    </div>

                    <div className="border border-line rounded-lg p-4">
                      <p className="text-xs text-ink-muted uppercase tracking-wide">
                        Model prediction
                      </p>

                      <p className="font-mono text-lg font-semibold text-ink mt-2">
                        {
                          insight.predictionLabel
                        }
                      </p>

                      <p className="text-xs text-ink-muted mt-1">
                        Stockout classifier
                        output
                      </p>
                    </div>
                  </div>

                  {/* 2. STOCKOUT RISK */}

                  <div className="border border-line rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-ink">
                        Stockout
                        probability
                      </span>

                      <span className="font-mono text-sm text-ink">
                        {insight.riskPercentage.toFixed(
                          2
                        )}
                        %
                      </span>
                    </div>

                    <div className="w-full h-3 bg-paper rounded-full overflow-hidden border border-line">
                      <div
                        className={`h-full transition-all ${
                          insight.riskLevel ===
                          "HIGH"
                            ? "bg-brick"
                            : insight.riskLevel ===
                              "MEDIUM"
                            ? "bg-brand"
                            : "bg-pine"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              insight.riskPercentage
                            )
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-ink-muted mt-1">
                      <span>
                        0% — Low
                      </span>

                      <span>
                        30% — Medium
                      </span>

                      <span>
                        70% — High
                      </span>
                    </div>
                  </div>

                  {/* 3. ML DEMAND FORECAST */}

                  <div>
                    <div className="flex justify-between items-end mb-3 gap-3 flex-wrap">
                      <div>
                        <h3 className="font-display text-base font-semibold text-ink">
                          ML demand forecast
                        </h3>

                        <p className="text-xs text-ink-muted mt-1">
                          Random Forest demand
                          forecasting model
                        </p>
                      </div>

                      <div className="text-right text-xs text-ink-muted">
                        <div>
                          Historical week:{" "}
                          <span className="font-mono text-ink">
                            {insight.lastHistoricalWeek
                              ? insight.lastHistoricalWeek
                              : "N/A"}
                          </span>
                        </div>

                        <div className="mt-1">
                          Forecast starts:{" "}
                          <span className="font-mono text-ink">
                            {insight.forecastStartWeek
                              ? insight.forecastStartWeek
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3 / 6 / 9 MONTH FORECAST CARDS */}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                      <div className="border border-line rounded-lg p-4 bg-paper">
                        <p className="text-xs text-ink-muted uppercase tracking-wide">
                          Next 3 months
                        </p>

                        <p className="font-mono text-2xl font-semibold text-ink mt-2">
                          {insight.forecast3.toFixed(
                            2
                          )}
                        </p>

                        <p className="text-xs text-ink-muted mt-1">
                          forecasted demand
                        </p>

                        <div className="mt-3 pt-3 border-t border-line">
                          <span className="font-mono text-sm font-medium text-ink">
                            ≈{" "}
                            {
                              insight.forecast3Units
                            }{" "}
                            units
                          </span>
                        </div>
                      </div>

                      <div className="border border-line rounded-lg p-4 bg-paper">
                        <p className="text-xs text-ink-muted uppercase tracking-wide">
                          Next 6 months
                        </p>

                        <p className="font-mono text-2xl font-semibold text-ink mt-2">
                          {insight.forecast6.toFixed(
                            2
                          )}
                        </p>

                        <p className="text-xs text-ink-muted mt-1">
                          forecasted demand
                        </p>

                        <div className="mt-3 pt-3 border-t border-line">
                          <span className="font-mono text-sm font-medium text-ink">
                            ≈{" "}
                            {
                              insight.forecast6Units
                            }{" "}
                            units
                          </span>
                        </div>
                      </div>

                      <div className="border border-line rounded-lg p-4 bg-paper">
                        <p className="text-xs text-ink-muted uppercase tracking-wide">
                          Next 9 months
                        </p>

                        <p className="font-mono text-2xl font-semibold text-ink mt-2">
                          {insight.forecast9.toFixed(
                            2
                          )}
                        </p>

                        <p className="text-xs text-ink-muted mt-1">
                          forecasted demand
                        </p>

                        <div className="mt-3 pt-3 border-t border-line">
                          <span className="font-mono text-sm font-medium text-ink">
                            ≈{" "}
                            {
                              insight.forecast9Units
                            }{" "}
                            units
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* 4. FORECAST VS CURRENT INVENTORY */}

                  <div>
                    <div className="mb-4">
                      <h3 className="font-display text-base font-semibold text-ink">
                        Forecast vs current inventory
                      </h3>

                      <p className="text-xs text-ink-muted mt-1">
                        Comparing current inventory with ML forecasted
                        demand across planning horizons
                      </p>
                    </div>

                    <div className="border border-line rounded-lg p-4">

                      {/* CURRENT STOCK */}

                      <div className="mb-5">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="text-sm font-medium text-ink">
                              Current inventory
                            </p>

                            <p className="text-xs text-ink-muted mt-0.5">
                              Available stock
                            </p>
                          </div>

                          <span className="font-mono text-sm font-semibold text-ink">
                            {insight.stock} units
                          </span>
                        </div>

                        <div className="w-full h-3 bg-paper rounded-full overflow-hidden border border-line">
                          <div
                            className="h-full bg-pine rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                (insight.stock /
                                  insight.inventoryComparisonMax) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* 3 MONTH */}

                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm text-ink-muted">
                            3-month forecast
                          </span>

                          <span className="font-mono text-sm font-medium text-ink">
                            {insight.forecast3Units} units
                          </span>
                        </div>

                        <div className="w-full h-2.5 bg-paper rounded-full overflow-hidden border border-line">
                          <div
                            className="h-full bg-brand rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (insight.forecast3Units /
                                  insight.inventoryComparisonMax) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* 6 MONTH */}

                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm text-ink-muted">
                            6-month forecast
                          </span>

                          <span className="font-mono text-sm font-medium text-ink">
                            {insight.forecast6Units} units
                          </span>
                        </div>

                        <div className="w-full h-2.5 bg-paper rounded-full overflow-hidden border border-line">
                          <div
                            className="h-full bg-brand rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (insight.forecast6Units /
                                  insight.inventoryComparisonMax) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* 9 MONTH */}

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm text-ink-muted">
                            9-month forecast
                          </span>

                          <span className="font-mono text-sm font-medium text-ink">
                            {insight.forecast9Units} units
                          </span>
                        </div>

                        <div className="w-full h-2.5 bg-paper rounded-full overflow-hidden border border-line">
                          <div
                            className="h-full bg-brand rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (insight.forecast9Units /
                                  insight.inventoryComparisonMax) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* INVENTORY POSITION */}

                      <div className="mt-6 pt-5 border-t border-line">

                        <h4 className="font-display text-sm font-semibold text-ink mb-3">
                          Inventory position
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                          <div className="bg-paper rounded-lg p-3">
                            <p className="text-[11px] text-ink-muted uppercase tracking-wide">
                              Current stock
                            </p>

                            <p className="font-mono text-lg font-semibold text-ink mt-1">
                              {insight.stock}
                            </p>

                            <p className="text-[10px] text-ink-muted">
                              units
                            </p>
                          </div>

                          <div className="bg-paper rounded-lg p-3">
                            <p className="text-[11px] text-ink-muted uppercase tracking-wide">
                              3M demand
                            </p>

                            <p className="font-mono text-lg font-semibold text-ink mt-1">
                              {insight.forecast3Units}
                            </p>

                            <p className="text-[10px] text-ink-muted">
                              forecast units
                            </p>
                          </div>

                          <div className="bg-paper rounded-lg p-3">
                            <p className="text-[11px] text-ink-muted uppercase tracking-wide">
                              6M demand
                            </p>

                            <p className="font-mono text-lg font-semibold text-ink mt-1">
                              {insight.forecast6Units}
                            </p>

                            <p className="text-[10px] text-ink-muted">
                              forecast units
                            </p>
                          </div>

                          <div className="bg-paper rounded-lg p-3">
                            <p className="text-[11px] text-ink-muted uppercase tracking-wide">
                              9M demand
                            </p>

                            <p className="font-mono text-lg font-semibold text-ink mt-1">
                              {insight.forecast9Units}
                            </p>

                            <p className="text-[10px] text-ink-muted">
                              forecast units
                            </p>
                          </div>

                        </div>

                        {/* 9-MONTH DEMAND GAP */}

                        <div className="mt-4 flex justify-between items-center px-4 py-3 border border-line rounded-lg">
                          <div>
                            <p className="text-sm text-ink-muted">
                              9-month inventory gap
                            </p>

                            <p className="text-[11px] text-ink-muted mt-0.5">
                              Current stock − 9-month forecast
                            </p>
                          </div>

                          <span
                            className={`font-mono text-sm font-semibold ${
                              insight.stock -
                                insight.forecast9Units <
                              0
                                ? "text-brick"
                                : "text-pine"
                            }`}
                          >
                            {insight.stock -
                              insight.forecast9Units >
                            0
                              ? "+"
                              : ""}
                            {insight.stock -
                              insight.forecast9Units}{" "}
                            units
                          </span>
                        </div>

                        {/* COVERAGE */}

                        <div className="mt-3 flex justify-between items-center px-4 py-3 border border-line rounded-lg">
                          <span className="text-sm text-ink-muted">
                            Forecast-based inventory coverage
                          </span>

                          <span className="font-mono text-sm font-semibold text-ink">
                            {insight.forecastCoverageDays ===
                            null
                              ? "N/A"
                              : `${insight.forecastCoverageDays.toFixed(
                                  1
                                )} days`}
                          </span>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* 5. 39-WEEK FORECAST */}

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="font-display text-base font-semibold text-ink">
                          Weekly demand forecast
                        </h3>

                        <p className="text-xs text-ink-muted mt-1">
                          39-week recursive
                          forecast generated by
                          the ML model
                        </p>
                      </div>

                      <span className="font-mono text-xs text-ink-muted">
                        {
                          insight.weeklyForecast
                            .length
                        }{" "}
                        weeks
                      </span>
                    </div>

                    {insight.weeklyForecast
                      .length > 0 ? (
                      <div className="border border-line rounded-lg p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {insight.weeklyForecast.map(
                            (
                              item,
                              index
                            ) => {
                              const value =
                                Number(
                                  item.forecast_demand
                                ) || 0;

                              const width =
                                Math.max(
                                  4,
                                  (value /
                                    insight.maxWeeklyForecast) *
                                    100
                                );

                              return (
                                <div
                                  key={`${item.week}-${index}`}
                                  className="border border-line rounded-lg p-3"
                                >
                                  <div className="flex justify-between items-center gap-2 mb-2">
                                    <span className="text-[11px] font-mono text-ink-muted">
                                      W
                                      {index +
                                        1}
                                    </span>

                                    <span className="text-[11px] font-mono text-ink-muted">
                                      {
                                        item.week
                                      }
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-paper rounded-full overflow-hidden border border-line">
                                      <div
                                        className="h-full bg-brand"
                                        style={{
                                          width: `${width}%`,
                                        }}
                                      />
                                    </div>

                                    <span className="font-mono text-xs font-semibold text-ink min-w-[38px] text-right">
                                      {value.toFixed(
                                        1
                                      )}
                                    </span>
                                  </div>

                                  <p className="text-[10px] text-ink-muted mt-1 text-right">
                                    units
                                  </p>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-line rounded-lg p-6 text-center text-sm text-ink-muted">
                        Weekly forecast data is
                        not available.
                      </div>
                    )}
                  </div>

                  {/* 6. HISTORICAL SALES */}

                  <div>
                    <h3 className="font-display text-base font-semibold text-ink mb-3">
                      Historical sales
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                      <div className="bg-paper rounded-lg p-3">
                        <p className="text-xs text-ink-muted">
                          1 month
                        </p>

                        <p className="font-mono font-semibold text-ink mt-1">
                          {insight.sales1}
                        </p>

                        <p className="text-[11px] text-ink-muted">
                          units
                        </p>
                      </div>

                      <div className="bg-paper rounded-lg p-3">
                        <p className="text-xs text-ink-muted">
                          3 months
                        </p>

                        <p className="font-mono font-semibold text-ink mt-1">
                          {insight.sales3}
                        </p>

                        <p className="text-[11px] text-ink-muted">
                          units
                        </p>
                      </div>

                      <div className="bg-paper rounded-lg p-3">
                        <p className="text-xs text-ink-muted">
                          6 months
                        </p>

                        <p className="font-mono font-semibold text-ink mt-1">
                          {insight.sales6}
                        </p>

                        <p className="text-[11px] text-ink-muted">
                          units
                        </p>
                      </div>

                      <div className="bg-paper rounded-lg p-3">
                        <p className="text-xs text-ink-muted">
                          9 months
                        </p>

                        <p className="font-mono font-semibold text-ink mt-1">
                          {insight.sales9}
                        </p>

                        <p className="text-[11px] text-ink-muted">
                          units
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* 7. AI RISK EXPLANATION */}

                  <div>
                    <div className="mb-4">
                      <h3 className="font-display text-base font-semibold text-ink">
                        AI risk explanation
                      </h3>

                      <p className="text-xs text-ink-muted mt-1">
                        Contextual summary based on the ML risk score, inventory position and demand forecast
                      </p>
                    </div>

                    <div className="border border-line rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-display text-sm font-semibold text-ink">
                          Risk evaluation
                        </span>

                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            RISK_BADGE[insight.riskLevel] || "bg-paper text-ink-muted"
                          }`}
                        >
                          {insight.riskLevel}
                        </span>
                      </div>

                      <ul className="space-y-2 text-xs text-ink">
                        {insight.riskLevel === "HIGH" && (
                          <>
                            <li className="flex items-start gap-2">
                              <span className="text-brick mt-0.5 font-bold">•</span>
                              <span>High stockout risk detected by the ML classifier.</span>
                            </li>

                            {insight.stock < insight.forecast9Units && (
                              <li className="flex items-start gap-2">
                                <span className="text-brick mt-0.5 font-bold">•</span>
                                <span>Current inventory is below the forecasted 9-month demand.</span>
                              </li>
                            )}

                            {insight.stock < insight.forecast3Units && (
                              <li className="flex items-start gap-2">
                                <span className="text-brick mt-0.5 font-bold">•</span>
                                <span>Current inventory is already below the forecasted 3-month demand.</span>
                              </li>
                            )}

                            {insight.stock <= insight.lowStockThreshold && (
                              <li className="flex items-start gap-2">
                                <span className="text-brick mt-0.5 font-bold">•</span>
                                <span>Current stock is at or below the configured low-stock threshold.</span>
                              </li>
                            )}

                            {insight.forecastCoverageDays !== null && (
                              <li className="flex items-start gap-2">
                                <span className="text-brick mt-0.5 font-bold">•</span>
                                <span>
                                  Forecast-based inventory coverage is approximately{" "}
                                  {insight.forecastCoverageDays.toFixed(1)} days.
                                </span>
                              </li>
                            )}

                            {insight.forecastLeadTimeDemand > insight.stock && (
                              <li className="flex items-start gap-2">
                                <span className="text-brick mt-0.5 font-bold">•</span>
                                <span>Forecasted demand during the supplier lead time exceeds current inventory.</span>
                              </li>
                            )}
                          </>
                        )}

                        {insight.riskLevel === "MEDIUM" && (
                          <>
                            <li className="flex items-start gap-2">
                              <span className="text-brand-dark mt-0.5 font-bold">•</span>
                              <span>Moderate stockout risk detected by the ML classifier.</span>
                            </li>

                            {insight.stock < insight.forecast9Units && (
                              <li className="flex items-start gap-2">
                                <span className="text-brand-dark mt-0.5 font-bold">•</span>
                                <span>Current inventory is below the forecasted 9-month demand.</span>
                              </li>
                            )}

                            {insight.stock < insight.forecast3Units && (
                              <li className="flex items-start gap-2">
                                <span className="text-brand-dark mt-0.5 font-bold">•</span>
                                <span>Current inventory is already below the forecasted 3-month demand.</span>
                              </li>
                            )}

                            {insight.stock <= insight.lowStockThreshold && (
                              <li className="flex items-start gap-2">
                                <span className="text-brand-dark mt-0.5 font-bold">•</span>
                                <span>Current stock is at or below the configured low-stock threshold.</span>
                              </li>
                            )}

                            {insight.forecastCoverageDays !== null && (
                              <li className="flex items-start gap-2">
                                <span className="text-brand-dark mt-0.5 font-bold">•</span>
                                <span>
                                  Forecast-based inventory coverage is approximately{" "}
                                  {insight.forecastCoverageDays.toFixed(1)} days.
                                </span>
                              </li>
                            )}

                            {insight.forecastLeadTimeDemand > insight.stock && (
                              <li className="flex items-start gap-2">
                                <span className="text-brand-dark mt-0.5 font-bold">•</span>
                                <span>Forecasted demand during the supplier lead time exceeds current inventory.</span>
                              </li>
                            )}

                            {!(insight.stock < insight.forecast9Units) &&
                              !(insight.stock < insight.forecast3Units) &&
                              !(insight.stock <= insight.lowStockThreshold) &&
                              !(insight.forecastLeadTimeDemand > insight.stock) && (
                                <li className="flex items-start gap-2">
                                  <span className="text-brand-dark mt-0.5 font-bold">•</span>
                                  <span>Inventory should be monitored against the projected demand and supplier lead time.</span>
                                </li>
                              )}
                          </>
                        )}

                        {insight.riskLevel === "LOW" && (
                          <>
                            <li className="flex items-start gap-2">
                              <span className="text-pine mt-0.5 font-bold">•</span>
                              <span>Low stockout risk according to the ML classifier.</span>
                            </li>

                            {insight.stock >= insight.forecast3Units && (
                              <li className="flex items-start gap-2">
                                <span className="text-pine mt-0.5 font-bold">•</span>
                                <span>Current inventory is sufficient to cover the projected 3-month demand.</span>
                              </li>
                            )}

                            {insight.stock >= insight.forecast9Units && (
                              <li className="flex items-start gap-2">
                                <span className="text-pine mt-0.5 font-bold">•</span>
                                <span>Current inventory is also above the projected 9-month demand.</span>
                              </li>
                            )}

                            {insight.forecastCoverageDays !== null && (
                              <li className="flex items-start gap-2">
                                <span className="text-pine mt-0.5 font-bold">•</span>
                                <span>
                                  Forecast-based inventory coverage is approximately{" "}
                                  {insight.forecastCoverageDays.toFixed(1)} days.
                                </span>
                              </li>
                            )}

                            {!(insight.stock >= insight.forecast3Units) &&
                              !(insight.stock >= insight.forecast9Units) &&
                              insight.forecastCoverageDays === null && (
                                <li className="flex items-start gap-2">
                                  <span className="text-pine mt-0.5 font-bold">•</span>
                                  <span>Continue monitoring inventory as demand and stock levels change.</span>
                                </li>
                              )}
                          </>
                        )}
                      </ul>

                      <div className="mt-4 pt-3 border-t border-line text-[11px] text-ink-muted">
                        Contextual summary — not a causal explanation of individual model features.
                      </div>
                    </div>
                  </div>

                  {/* 8. RECOMMENDED ACTION */}

                  <div
                    className={`rounded-lg border p-4 ${
                      insight.recommendationTone === "high"
                        ? "border-brick bg-brick-light"
                        : insight.recommendationTone === "medium"
                        ? "border-brand bg-brand-light"
                        : "border-pine bg-pine-light"
                    }`}
                  >
                    <div className="mb-4">
                      <p className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                        Recommended action
                      </p>

                      <p className="text-sm font-medium text-ink mt-1">
                        {insight.recommendation}
                      </p>
                    </div>

                    <div className="border border-line/60 rounded-lg p-3 bg-white/70">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center sm:text-left">
                        <div>
                          <p className="text-[11px] text-ink-muted uppercase tracking-wide">
                            Risk level
                          </p>
                          <p className="font-mono text-sm font-semibold text-ink mt-0.5">
                            {insight.riskLevel}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-ink-muted uppercase tracking-wide">
                            Current stock
                          </p>
                          <p className="font-mono text-sm font-semibold text-ink mt-0.5">
                            {insight.stock} units
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-ink-muted uppercase tracking-wide">
                            3M forecast
                          </p>
                          <p className="font-mono text-sm font-semibold text-ink mt-0.5">
                            {insight.forecast3Units} units
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-ink-muted uppercase tracking-wide">
                            9M forecast
                          </p>
                          <p className="font-mono text-sm font-semibold text-ink mt-0.5">
                            {insight.forecast9Units} units
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-ink-muted uppercase tracking-wide">
                            Est. reorder
                          </p>
                          <p className="font-mono text-sm font-semibold text-ink mt-0.5">
                            {insight.estimatedReorderQuantity} units
                          </p>
                          <p className="text-[10px] text-ink-muted leading-tight mt-0.5">
                            Business-rule reorder estimate
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 9. MODEL NOTE */}

                  <div className="border border-line rounded-lg p-4 bg-paper">
                    <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
                      Model transparency & notes
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white border border-line rounded-lg p-3">
                        <p className="text-xs font-semibold text-ink uppercase tracking-wide">
                          Demand Forecast
                        </p>
                        <p className="text-xs leading-relaxed text-ink-muted mt-1.5">
                          Random Forest model generates the future weekly demand forecast and aggregates it into 3/6/9-month horizons.
                        </p>
                      </div>

                      <div className="bg-white border border-line rounded-lg p-3">
                        <p className="text-xs font-semibold text-ink uppercase tracking-wide">
                          Stockout Risk
                        </p>
                        <p className="text-xs leading-relaxed text-ink-muted mt-1.5">
                          The stockout classifier produces a probability/risk screening signal based on inventory, demand and other model inputs.
                        </p>
                      </div>

                      <div className="bg-white border border-line rounded-lg p-3">
                        <p className="text-xs font-semibold text-ink uppercase tracking-wide">
                          Reorder Estimate
                        </p>
                        <p className="text-xs leading-relaxed text-ink-muted mt-1.5">
                          The reorder quantity is a business-rule calculation using the ML demand forecast, supplier lead time, current inventory and low-stock threshold. It is NOT an ML prediction.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            {/* FOOTER */}

            <div className="px-6 py-4 border-t border-line flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={
                  closeProductInsights
                }
                className="border border-line text-ink text-sm font-medium px-4 py-2 rounded-lg hover:bg-paper transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}