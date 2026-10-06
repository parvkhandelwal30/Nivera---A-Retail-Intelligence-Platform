# Nivera

## Retail Enterprise Inventory Intelligence and Customer Management Platform

Nivera is a full-stack retail management and inventory intelligence platform that combines traditional e-commerce functionality with machine-learning-based demand forecasting and stockout risk prediction.

The platform provides customer-facing shopping functionality, administrator inventory management, order management, product management, and an AI-powered inventory intelligence system.

The core intelligence pipeline follows the principle:

> **Forecast future demand first, then combine the forecast with current inventory and operational information to estimate stockout risk and support replenishment decisions.**

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [End-to-End Execution Flow](#end-to-end-execution-flow)
- [Customer Flow](#customer-flow)
- [Administrator Flow](#administrator-flow)
- [Technology Stack](#technology-stack)
- [Dataset](#dataset)
- [Data Preprocessing](#data-preprocessing)
- [Feature Engineering](#feature-engineering)
- [Demand Forecasting](#demand-forecasting)
- [Demand Forecasting Model](#demand-forecasting-model)
- [Demand Forecasting Results](#demand-forecasting-results)
- [Stockout Prediction](#stockout-prediction)
- [Class Imbalance](#class-imbalance)
- [SMOTE and Tomek Links](#smote-and-tomek-links)
- [Stockout Model Evaluation](#stockout-model-evaluation)
- [Forecast to Stockout Integration](#forecast-to-stockout-integration)
- [Inventory Intelligence](#inventory-intelligence)
- [Reorder Estimation](#reorder-estimation)
- [ML Service Architecture](#ml-service-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Design](#database-design)
- [Frontend Architecture](#frontend-architecture)
- [API Documentation](#api-documentation)
- [Deployment Architecture](#deployment-architecture)
- [Testing and Validation](#testing-and-validation)
- [Research Foundation](#research-foundation)
- [Research Gap](#research-gap)
- [Limitations](#limitations)
- [Future Scope](#future-scope)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Results Summary](#results-summary)
- [Conclusion](#conclusion)
- [References](#references)

---

# Project Overview

Nivera is a full-stack retail enterprise platform that combines conventional retail management with machine learning.

The application provides two primary experiences.

### Customer Experience

Customers can:

- Register and log in
- Browse products
- Search for products
- View product information
- Add products to the cart
- Review the cart
- Place orders
- Track order status

### Administrator Experience

Administrators can:

- Manage products
- Manage inventory
- Manage orders
- Manage users
- View sales and revenue statistics
- Monitor low-stock products
- View AI-powered demand forecasts
- View stockout risk
- Analyze inventory coverage
- View demand gaps
- View reorder estimates

### Machine Learning Experience

The ML system provides:

- Weekly demand forecasting
- 39-week future demand forecasting
- 3-month demand forecast
- 6-month demand forecast
- 9-month demand forecast
- Stockout probability prediction
- LOW / MEDIUM / HIGH risk classification
- Inventory coverage analysis
- Demand gap analysis
- Business-rule-based reorder estimation

---

# Problem Statement

Traditional retail management systems primarily display current inventory levels and historical sales information.

However, current inventory alone does not provide sufficient information for proactive inventory management.

A product may have:

- Low current inventory
- Increasing demand
- Long supplier lead time
- High historical sales
- Increasing demand pressure

These factors can result in a future stockout even when the product is not currently out of stock.

Therefore, Nivera introduces a machine-learning-based inventory intelligence layer that combines:

```text
Historical Sales
       +
Demand Forecast
       +
Current Inventory
       +
Lead Time
       +
Inventory Threshold
       +
Stockout Prediction
       |
       v
Inventory Intelligence
```

This allows administrators to make more informed replenishment decisions.

---

# Objectives

The major objectives of Nivera are:

1. Build a complete retail management platform.
2. Provide customer-facing e-commerce functionality.
3. Provide administrator inventory and order management.
4. Forecast future product demand using historical sales data.
5. Predict the probability of product stockout/backorder.
6. Handle severe class imbalance in stockout prediction.
7. Integrate demand forecasting with stockout prediction.
8. Provide product-level inventory intelligence.
9. Provide practical replenishment information to administrators.
10. Deploy the application as independent frontend, backend, database, and ML services.

---

# Key Features

## Customer Features

- User registration
- User authentication
- Product browsing
- Product search
- Product details
- Shopping cart
- Order placement
- Order history
- Order status tracking

## Administrator Features

- Admin authentication
- Product management
- Product approval
- Inventory monitoring
- Order management
- Customer management
- Revenue dashboard
- Sales statistics
- Low-stock monitoring
- AI inventory insights

## Machine Learning Features

- Weekly demand forecasting
- Recursive multi-week forecasting
- 39-week forecast
- 3-month demand forecast
- 6-month demand forecast
- 9-month demand forecast
- Stockout probability prediction
- LOW / MEDIUM / HIGH risk classification
- Inventory coverage analysis
- Demand gap analysis
- Reorder quantity estimation

---

# System Architecture

Nivera follows a layered architecture in which the frontend, backend, database, and machine-learning services communicate through APIs.

```text
                         +--------------------------+
                         |       Nivera User        |
                         | Customer / Administrator |
                         +------------+-------------+
                                      |
                                      v
                    +-------------------------------+
                    |       React Frontend          |
                    |       Vite + Tailwind         |
                    |                               |
                    | - Customer Interface          |
                    | - Admin Dashboard             |
                    | - Product Management          |
                    | - AI Insights                 |
                    +---------------+---------------+
                                    |
                              REST API / Axios
                                    |
                                    v
                    +-------------------------------+
                    |       Node.js Backend         |
                    |          Express.js           |
                    |                               |
                    | - Authentication              |
                    | - Product Management          |
                    | - Cart Management             |
                    | - Order Management            |
                    | - User Management             |
                    | - Stockout Integration        |
                    +-----------+-----------+-------+
                                |           |
                         MongoDB Queries     |
                                |           |
                                v           |
                    +------------------+    |
                    |  MongoDB Atlas   |    |
                    |                  |    |
                    | - Users          |    |
                    | - Products       |    |
                    | - Orders         |    |
                    | - Inventory      |    |
                    +------------------+    |
                                            |
                                      ML REST API
                                            |
                                            v
                    +-------------------------------+
                    |       Python ML Service       |
                    |            FastAPI             |
                    |                               |
                    | +---------------------------+ |
                    | | Demand Forecasting Model  | |
                    | | Random Forest Regression  | |
                    | +-------------+-------------+ |
                    |               |               |
                    |               v               |
                    |      3M / 6M / 9M Forecast    |
                    |                               |
                    | +---------------------------+ |
                    | | Stockout Prediction Model | |
                    | | Random Forest Classifier  | |
                    | +-------------+-------------+ |
                    |               |               |
                    |               v               |
                    |       Risk Probability       |
                    +-------------------------------+
```

---

# Application Architecture

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | User interface and visualization |
| Backend | Node.js + Express.js | Business logic and REST APIs |
| Database | MongoDB Atlas | Persistent application data |
| ML Service | Python + FastAPI | ML inference |
| Forecasting | Scikit-learn Random Forest | Demand prediction |
| Stockout Model | Scikit-learn Random Forest | Stockout risk prediction |
| HTTP Client | Axios | Frontend/backend communication |
| Visualization | Recharts | Dashboard charts |
| Authentication | JWT + bcrypt | Authentication and password security |
| Deployment | Render | Frontend, backend, and ML service hosting |

---

# End-to-End Execution Flow

The inventory intelligence workflow follows the sequence below:

```text
1. Customer/Admin interacts with Nivera
                    |
                    v
2. React Frontend sends API request
                    |
                    v
3. Express Backend authenticates request
                    |
                    v
4. Backend retrieves product/order data
   from MongoDB Atlas
                    |
                    v
5. Backend builds product sales history
                    |
                    v
6. Weekly demand history is prepared
                    |
                    v
7. FastAPI ML service receives
   forecasting request
                    |
                    v
8. Random Forest generates
   39-week recursive forecast
                    |
                    v
9. Forecast is aggregated into
   3 / 6 / 9 month demand
                    |
                    v
10. Forecast values are combined with:
       - Current inventory
       - Lead time
       - Historical sales
       - Inventory threshold
                    |
                    v
11. Stockout prediction model
    calculates risk probability
                    |
                    v
12. Risk is classified:
       LOW / MEDIUM / HIGH
                    |
                    v
13. Backend returns integrated
    inventory intelligence
                    |
                    v
14. React renders:
       - Forecast
       - Stockout probability
       - Risk level
       - Inventory coverage
       - Demand gap
       - Reorder estimate
                    |
                    v
15. Administrator uses the
    information for replenishment decisions
```

---

# Inventory Intelligence Execution

For an individual product, the execution flow is:

```text
                    PRODUCT
                       |
                       v
              Historical Orders
                       |
                       v
                Sales History
          +------------+------------+
          |            |            |
          v            v            v
       1 Month      3 Months     9 Months
          |            |            |
          +------------+------------+
                       |
                       v
                Weekly Demand
                       |
                       v
             Feature Engineering
                       |
                       v
             Random Forest Model
                       |
                       v
             39-Week Forecast
                       |
          +------------+------------+
          |            |            |
          v            v            v
        3 Months     6 Months     9 Months
          |            |            |
          +------------+------------+
                       |
                       v
              Inventory Context
                       |
          +------------+--------------+
          |            |              |
          v            v              v
     Current Stock  Lead Time   Stock Threshold
          |            |              |
          +------------+--------------+
                       |
                       v
             Stockout Classifier
                       |
                       v
              Risk Probability
                       |
                       v
              Risk Classification
                       |
                       v
             Inventory Intelligence
                       |
                       v
              Reorder Estimate
```

---

# Customer Flow

```text
Customer
   |
   v
Login / Register
   |
   v
Browse Products
   |
   v
Search / Select Product
   |
   v
View Product
   |
   v
Add to Cart
   |
   v
Review Cart
   |
   v
Place Order
   |
   v
Order Created
   |
   v
Order Status Tracking
```

The customer interface focuses on product discovery, cart management, and order placement.

---

# Administrator Flow

```text
Administrator
      |
      v
Admin Login
      |
      v
Admin Dashboard
      |
      +---------------> Product Management
      |
      +---------------> Inventory Management
      |
      +---------------> Order Management
      |
      +---------------> Customer / User Management
      |
      +---------------> Inventory Intelligence
                              |
                              v
                       Select Product
                              |
                              v
                         AI Insights
                              |
                    +---------+---------+
                    |                   |
                    v                   v
             Demand Forecast       Stockout Risk
                    |                   |
                    +---------+---------+
                              |
                              v
                    Inventory Analysis
                              |
                              v
                    Reorder Recommendation
```

---

# Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- Axios
- Recharts

## Backend

- Node.js
- Express.js
- Mongoose
- JWT
- bcrypt
- Axios

## Machine Learning

- Python
- FastAPI
- Scikit-learn
- Pandas
- NumPy
- Joblib
- XGBoost

## Database

- MongoDB Atlas

## Deployment

- Render
- GitHub
- Git LFS

---

# Dataset

Nivera uses two major data sources for its machine-learning components.

## Stockout / Backorder Dataset

The stockout model was developed using a public backorder prediction dataset containing approximately:

- 1.68 million records
- 23 columns
- Approximately 0.67% positive stockout/backorder cases

The target variable is:

```text
went_on_backorder
```

Important input variables include:

| Feature | Description |
|---|---|
| `sku` | Product identifier |
| `national_inv` | Current inventory |
| `lead_time` | Supplier lead time |
| `in_transit_qty` | Inventory currently in transit |
| `forecast_3_month` | 3-month demand forecast |
| `forecast_6_month` | 6-month demand forecast |
| `forecast_9_month` | 9-month demand forecast |
| `sales_1_month` | Recent sales |
| `sales_3_month` | 3-month sales |
| `sales_6_month` | 6-month sales |
| `sales_9_month` | 9-month sales |
| `min_bank` | Minimum inventory/bank level |
| `potential_issue` | Potential supply issue |
| `pieces_past_due` | Past-due quantity |
| `perf_6_month_avg` | 6-month supplier performance |
| `perf_12_month_avg` | 12-month supplier performance |
| `local_bo_qty` | Local backorder quantity |
| `deck_risk` | Deck risk indicator |
| `oe_constraint` | Operational constraint |
| `ppap_risk` | PPAP risk indicator |
| `stop_auto_buy` | Automatic purchasing flag |
| `rev_stop` | Revenue-stop indicator |
| `went_on_backorder` | Target variable |

---

## Nivera Historical Sales Dataset

The demand forecasting model uses historical orders generated from the Nivera application database.

The dataset contains:

- 108 products
- 8 product categories
- 1,296 historical orders
- 3,733 total units sold
- 39 weeks of historical demand
- Complete product-week demand representation

The historical order period covers approximately January 2026 to October 2026.

The exported dataset is stored at:

```text
ml/data/nivera_sales_history.json
```

---

# Data Preprocessing

## Stockout Prediction Preprocessing

The stockout dataset contains severe class imbalance.

The preprocessing pipeline performs:

1. Load the training data.
2. Convert SKU values to string.
3. Remove rows with missing target values.
4. Replace special `-99` values in supplier performance features with missing values.
5. Separate numerical and categorical variables.
6. Apply median imputation to numerical features.
7. Apply most-frequent imputation to categorical features.
8. Standardize numerical variables.
9. One-hot encode categorical variables.
10. Perform stratified train-validation splitting.

The preprocessing pipeline is saved as:

```text
ml/models/stockout_preprocessor.joblib
```

---

# Demand Forecasting Preprocessing

The Nivera order data is transformed into weekly product-level demand.

```text
MongoDB Orders
      |
      v
Historical Order Data
      |
      v
Daily Product Demand
      |
      v
Weekly Product Demand
      |
      v
Complete Product x Week Grid
      |
      v
Lag / Rolling Features
      |
      v
Training Dataset
```

A complete product-week grid was generated so that every product has a consistent weekly time series.

```text
108 products x 39 weeks = 4212 product-week records
```

The forecasting dataset was divided into:

```text
Training:
33 weeks

Testing:
6 weeks
```

---

# Feature Engineering

Feature engineering transforms raw sales and inventory information into useful model inputs.

## Demand Forecasting Features

```text
lag_1
lag_2
lag_3
lag_4

rolling_mean_3
rolling_mean_4
rolling_mean_8

rolling_std_4

week_number
month
quarter
time_index
```

### Lag Features

```text
lag_1 = demand from previous week
lag_2 = demand from two weeks earlier
lag_3 = demand from three weeks earlier
lag_4 = demand from four weeks earlier
```

### Rolling Features

```text
rolling_mean_3
rolling_mean_4
rolling_mean_8
rolling_std_4
```

These capture recent demand levels and demand variability.

---

# Stockout Feature Engineering

The stockout pipeline uses raw inventory and demand variables together with engineered features.

Important engineered features include:

```text
avg_monthly_sales_3m
avg_monthly_sales_6m
avg_monthly_sales_9m

inventory_to_forecast
forecast_vs_sales
inventory_gap
demand_pressure
in_transit_ratio
sales_acceleration

forecast_growth_6m
forecast_growth_9m

lead_time_demand
inventory_coverage
```

---

# Demand Forecasting

The demand forecasting component predicts future weekly product demand.

```text
Historical Orders
       |
       v
Daily Demand
       |
       v
Weekly Demand
       |
       v
Feature Engineering
       |
       v
Random Forest Regression
       |
       v
Recursive Weekly Forecast
       |
       v
39 Future Weeks
       |
       +----------------+
       |                |
       v                v
  3-Month          6-Month
  Forecast         Forecast
       |                |
       +-------+--------+
               |
               v
        9-Month Forecast
```

---

# Demand Forecasting Model

Several models were evaluated:

- Naive baseline
- 4-week Moving Average
- Linear Regression
- Random Forest
- Gradient Boosting

The final model selected was:

```text
Random Forest Regressor
```

Final configuration:

```python
RandomForestRegressor(
    n_estimators=300,
    max_depth=12,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)
```

---

# Demand Forecasting Results

| Model | MAE | RMSE |
|---|---:|---:|
| Naive | 2.2037 | 3.5888 |
| 4-Week Moving Average | 1.7485 | 2.5393 |
| Linear Regression | 1.1693 | 2.0026 |
| Random Forest | **1.0124** | **1.8334** |
| Gradient Boosting | 1.0444 | 1.8973 |

Random Forest achieved the lowest MAE and RMSE among the evaluated models.

### Final Metrics

```text
MAE  = 1.0124
RMSE = 1.8334
```

---

# Product-Level Forecast Performance

The final Random Forest model was evaluated across all 108 products.

```text
Products evaluated: 108

Mean MAE:   1.0124
Std. MAE:   0.6093
Minimum:    0.1337
Median:     0.8230
Maximum:    3.1057
```

Distribution:

```text
MAE <= 1.0  -> 65 products
MAE <= 1.5  -> 89 products
MAE > 2.0   -> 12 products
```

---

# Feature Importance

The most important demand forecasting features were:

| Feature | Importance |
|---|---:|
| `rolling_mean_3` | 0.4035 |
| `rolling_mean_8` | 0.1764 |
| `week_number` | 0.0851 |
| `time_index` | 0.0844 |
| `lag_2` | 0.0505 |

Recent rolling demand was the most important feature in the final forecasting model.

---

# Multi-Horizon Forecasting

The final model produces a recursive 39-week forecast.

The forecast is aggregated into three business horizons.

| Horizon | Mean Forecast |
|---|---:|
| 3 Months | 9.15 units |
| 6 Months | 17.93 units |
| 9 Months | 26.99 units |

Observed ranges:

| Horizon | Minimum | Maximum |
|---|---:|---:|
| 3 Months | 5.35 | 35.27 |
| 6 Months | 13.51 | 48.84 |
| 9 Months | 23.35 | 57.04 |

---

# Stockout Prediction

The second machine-learning component predicts whether a product is at risk of going on backorder/stockout.

```text
Inventory Data
      +
Sales Data
      +
Demand Forecast
      +
Operational Features
      |
      v
Feature Engineering
      |
      v
Preprocessing
      |
      v
Class Imbalance Handling
      |
      v
Random Forest Classifier
      |
      v
Stockout Probability
      |
      v
LOW / MEDIUM / HIGH
```

---

# Stockout Prediction Features

The model uses a combination of raw and engineered features.

### Inventory Features

```text
national_inv
in_transit_qty
min_bank
local_bo_qty
```

### Demand Features

```text
forecast_3_month
forecast_6_month
forecast_9_month
sales_1_month
sales_3_month
sales_6_month
sales_9_month
```

### Operational Features

```text
lead_time
pieces_past_due
potential_issue
deck_risk
oe_constraint
ppap_risk
stop_auto_buy
rev_stop
```

### Engineered Features

```text
avg_monthly_sales_3m
avg_monthly_sales_6m
avg_monthly_sales_9m
inventory_to_forecast
forecast_vs_sales
inventory_gap
demand_pressure
in_transit_ratio
sales_acceleration
forecast_growth_6m
forecast_growth_9m
lead_time_demand
inventory_coverage
```

---

# Class Imbalance

The stockout dataset contains severe class imbalance.

Approximately:

```text
Positive stockout/backorder cases ≈ 0.67%
Negative cases                   ≈ 99.33%
```

A model that predicts almost every record as `NO BACKORDER` could still achieve high accuracy while failing to identify actual stockout cases.

Therefore, accuracy alone is not sufficient.

The project emphasizes:

- Precision
- Recall
- F1-score
- ROC-AUC
- PR-AUC

PR-AUC is especially important for rare-event classification.

---

# SMOTE and Tomek Links

To address class imbalance, the project uses:

```text
SMOTE + Tomek Links
```

### SMOTE

SMOTE stands for:

> Synthetic Minority Over-sampling Technique

SMOTE creates synthetic minority-class examples rather than simply duplicating existing positive samples.

### Tomek Links

Tomek Links identify close observations belonging to different classes.

Removing Tomek Links helps clean ambiguous class boundaries.

### Combined Pipeline

```text
Original Training Data
          |
          v
Separate Minority / Majority
          |
          v
Controlled Negative Sampling
          |
          v
SMOTE Oversampling
          |
          v
Tomek Link Cleaning
          |
          v
Balanced Training Dataset
          |
          v
Random Forest / XGBoost
```

Because directly applying SMOTE + Tomek to the complete 1.68M-row dataset was computationally expensive, the optimized training process retained all positive samples and sampled a controlled number of negative samples before applying SMOTE + Tomek.

The resulting balanced training data contained approximately:

```text
580,100 samples

≈ 290,050 positive
≈ 290,050 negative
```

---

# Stockout Model Evaluation

Two major models were evaluated after SMOTE + Tomek preprocessing.

## Random Forest

```text
Accuracy  = 0.9601
Precision = 0.1180
Recall    = 0.7654
F1        = 0.2044
ROC-AUC   = 0.9675
PR-AUC    = 0.2731
```

## XGBoost

```text
Accuracy  = 0.9455
Precision = 0.0852
Recall    = 0.7348
F1        = 0.1528
ROC-AUC   = 0.9482
PR-AUC    = 0.1737
```

### Model Comparison

| Metric | Random Forest | XGBoost |
|---|---:|---:|
| Accuracy | **0.9601** | 0.9455 |
| Precision | **0.1180** | 0.0852 |
| Recall | **0.7654** | 0.7348 |
| F1 | **0.2044** | 0.1528 |
| ROC-AUC | **0.9675** | 0.9482 |
| PR-AUC | **0.2731** | 0.1737 |

Random Forest performed better across the reported evaluation metrics and was selected as the final stockout model.

---

# Final Stockout Model

The final model uses:

```python
RandomForestClassifier(
    n_estimators=150,
    max_depth=20,
    min_samples_leaf=2,
    class_weight=None,
    n_jobs=1,
    random_state=42
)
```

The trained model is stored as:

```text
ml/models/final_stockout_model.joblib
```

The preprocessing pipeline is stored as:

```text
ml/models/stockout_preprocessor.joblib
```

---

# Risk Classification

The predicted stockout probability is converted into an operational risk level.

```text
Probability < 0.30
        |
        v
       LOW


0.30 <= Probability < 0.70
        |
        v
      MEDIUM


Probability >= 0.70
        |
        v
       HIGH
```

Therefore:

```text
LOW    -> < 30%
MEDIUM -> 30% to < 70%
HIGH   -> >= 70%
```

The probability should be interpreted as a model-based risk score rather than a guaranteed stockout event.

---

# Forecast to Stockout Integration

The key contribution of Nivera is the integration of demand forecasting and stockout prediction.

Instead of treating the two models as completely independent systems, the demand forecast is passed into the stockout prediction pipeline.

```text
              Historical Sales
                     |
                     v
            Demand Forecasting
                     |
                     v
             39-Week Forecast
                     |
        +------------+------------+
        v            v            v
      3 Month      6 Month      9 Month
      Demand       Demand       Demand
        |            |            |
        +------------+------------+
                     |
                     v
            Inventory Context
                     |
       +-------------+-------------+
       v             v             v
 Current Stock   Lead Time   Stock Threshold
       |             |             |
       +-------------+-------------+
                     |
                     v
            Stockout Prediction
                     |
                     v
              Risk Probability
                     |
                     v
              Risk Classification
```

---

# Inventory Intelligence

For each product, the administrator can view:

- Current stock
- Inventory threshold
- Historical sales
- Demand forecast
- 3-month forecast
- 6-month forecast
- 9-month forecast
- Weekly future demand
- Stockout probability
- Stockout risk classification
- Inventory coverage
- Demand gap
- Reorder estimate

The administrator can access this information through the **AI Insights** interface.

---

# Reorder Estimation

The current implementation does **not** claim that the machine-learning model directly predicts the reorder quantity.

Instead, the reorder estimate is calculated using the ML forecast together with business rules.

### Forecast Monthly Demand

```text
Forecast Monthly Demand
=
3-Month Forecast / 3
```

### Forecast Daily Demand

```text
Forecast Daily Demand
=
Forecast Monthly Demand / 30
```

### Lead-Time Demand

```text
Lead-Time Demand
=
Forecast Daily Demand × Lead Time
```

### Approximate Reorder Quantity

```text
Reorder Quantity
=
max(
    0,
    ceil(
        Lead-Time Demand
        + Inventory Threshold
        - Current Stock
    )
)
```

Therefore, the displayed reorder quantity should be interpreted as:

> **A business-rule-based reorder estimate informed by the ML demand forecast.**

---

# ML Service Architecture

The machine-learning functionality is separated from the main Node.js application and exposed through FastAPI endpoints.

```text
                  Node.js Backend
                         |
                         | HTTP POST
                         v
              +----------------------+
              |    FastAPI Service   |
              +----------+-----------+
                         |
              +----------+----------+
              |                     |
              v                     v
        /forecast                 /predict
              |                     |
              v                     v
     Demand Forecasting      Stockout Prediction
         Random Forest          Random Forest
              |                     |
              v                     v
       Weekly Forecast        Risk Probability
              |                     |
              +----------+----------+
                         |
                         v
                  Integrated Result
                         |
                         v
                   Node.js Backend
                         |
                         v
                  React Frontend
```

---

# API Documentation

## Backend Health Check

```http
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "message": "Retail system API is running"
}
```

---

## ML Health Check

```http
GET /health
```

Example response:

```json
{
  "status": "ok",
  "stockout_model_loaded": true,
  "stockout_preprocessor_loaded": true,
  "demand_model_loaded": true
}
```

---

## ML Root Endpoint

```http
GET /
```

Example response:

```json
{
  "message": "Nivera ML API is running",
  "services": {
    "stockout_prediction": "/predict",
    "demand_forecasting": "/forecast"
  }
}
```

---

## Demand Forecasting

```http
POST /forecast
```

Example request:

```json
{
  "product_id": "product-id",
  "product_name": "Product Name",
  "sku": "SKU-001",
  "category": "Electronics",
  "weekly_demand": [
    2,
    3,
    4,
    2,
    5
  ],
  "last_week": "2026-09-21"
}
```

The service returns a recursive weekly forecast and aggregated demand horizons.

---

## Stockout Prediction

```http
POST /predict
```

The request contains the features required by the stockout model.

The service returns:

```text
Prediction
+
Probability
+
Risk Level
```

---

## Product-Level Inventory Intelligence

```http
GET /api/stockout/product/:productId
```

The backend:

```text
Product ID
    |
    v
Retrieve Product
    |
    v
Retrieve Historical Orders
    |
    v
Build Sales History
    |
    v
Build Weekly Demand
    |
    v
Call FastAPI /forecast
    |
    v
Receive 39-Week Forecast
    |
    v
Generate 3/6/9 Month Forecast
    |
    v
Build Stockout Model Input
    |
    v
Call FastAPI /predict
    |
    v
Return Integrated Intelligence
```

---

# Backend Architecture

The Node.js backend exposes REST APIs for:

```text
/api/auth
/api/products
/api/cart
/api/orders
/api/users
/api/stockout
```

The backend is responsible for:

- Authentication
- Authorization
- Product operations
- Cart operations
- Order operations
- User management
- Dashboard statistics
- Historical sales extraction
- ML service integration

---

# Database Design

Nivera uses MongoDB Atlas as its primary application database.

Major models include:

```text
Users
Products
Orders
```

---

# Product Model

The product model contains fields such as:

```text
name
description
category
price
stock
lowStockThreshold
imageUrl
sku
unitsSold
submittedBy
approvalStatus
```

The product model also provides a low-stock calculation based on the configured inventory threshold.

---

# Order Model

An order contains:

```text
user
items
totalAmount
status
paymentStatus
createdAt
updatedAt
```

Each order item contains:

```text
product
name
price
quantity
```

Order status values include:

```text
pending
confirmed
shipped
delivered
cancelled
```

Payment status values include:

```text
pending
paid
```

---

# Database and ML Data Flow

```text
                     MongoDB Atlas
                          |
             +------------+------------+
             |                         |
             v                         v
         Products                    Orders
             |                         |
             +------------+------------+
                          |
                          v
                  Historical Sales
                          |
                          v
                  Weekly Demand
                          |
                          v
                 FastAPI ML Service
```

---

# Frontend Architecture

The frontend is implemented using:

```text
React
Vite
Tailwind CSS
Axios
Recharts
```

The frontend communicates with the backend through Axios.

The API base URL is configured using:

```text
VITE_API_URL
```

---

# Frontend Functional Areas

## Customer Interface

```text
Home
Products
Product Details
Cart
Orders
Profile
Authentication
```

## Administrator Interface

```text
Admin Dashboard
Products
Orders
Users
Inventory
AI Insights
```

---

# Admin Dashboard

The administrator dashboard provides:

- Total products
- Low-stock products
- Total orders
- Total revenue
- Pending product listings
- Recent revenue
- Category revenue
- Low-stock products
- Top-selling products
- Stockout risk

The AI Insights section provides deeper analysis for individual products.

---

# AI Insights

The AI Insights interface displays:

```text
Product
   |
   +-- Current Inventory
   +-- Historical Sales
   +-- Demand Forecast
   |      +-- 3 Months
   |      +-- 6 Months
   |      +-- 9 Months
   |
   +-- Stockout Probability
   +-- Risk Level
   +-- Inventory Coverage
   +-- Demand Gap
   +-- Weekly Forecast
   +-- Reorder Estimate
```

This provides administrators with a consolidated view instead of requiring them to inspect multiple independent data sources.

---

# Deployment Architecture

The deployed application is separated into independent services.

```text
                         Internet
                            |
              +-------------+-------------+
              |                           |
              v                           v
    +-------------------+       +--------------------+
    | Nivera Frontend   |       | Nivera Backend     |
    | Render Static Site|------>| Render Web Service |
    +-------------------+       +----------+---------+
                                          |
                              +-----------+-----------+
                              |                       |
                              v                       v
                    +-----------------+    +------------------+
                    | MongoDB Atlas   |    | Nivera ML API    |
                    | Database        |    | Render Service   |
                    +-----------------+    +------------------+
```

---

# Deployed Services

| Service | Platform | Purpose |
|---|---|---|
| Frontend | Render Static Site | React application |
| Backend | Render Web Service | Node.js / Express API |
| ML API | Render Web Service | FastAPI ML inference |
| Database | MongoDB Atlas | Application database |

---

# Production URLs

### Frontend

```text
https://nivera-frontend.onrender.com
```

### Backend

```text
https://nivera-backend.onrender.com
```

### Backend Health

```text
https://nivera-backend.onrender.com/api/health
```

### ML API

```text
https://nivera-ml-api.onrender.com
```

### ML Health

```text
https://nivera-ml-api.onrender.com/health
```

---

# Model Artifacts

The ML project stores trained artifacts separately from application source code.

```text
ml/models/
|
+-- final_stockout_model.joblib
+-- stockout_preprocessor.joblib
+-- demand_forecasting_model.joblib
+-- demand_forecasting_metadata.json
+-- feature_info.joblib
```

The large stockout model is managed using Git Large File Storage (Git LFS).

---

# Project Structure

```text
Nivera/
|
+-- backend/
|   +-- config/
|   +-- controllers/
|   +-- middleware/
|   +-- models/
|   +-- routes/
|   +-- services/
|   +-- server.js
|   +-- package.json
|
+-- frontend/
|   +-- src/
|   |   +-- api/
|   |   +-- components/
|   |   +-- pages/
|   |   +-- context/
|   |   +-- App.jsx
|   +-- public/
|   +-- package.json
|
+-- ml/
|   +-- api/
|   |   +-- main.py
|   |
|   +-- data/
|   |   +-- nivera_sales_history.json
|   |   +-- nivera_demand_forecast.csv
|   |   +-- nivera_demand_forecasts.csv
|   |
|   +-- models/
|   |   +-- final_stockout_model.joblib
|   |   +-- stockout_preprocessor.joblib
|   |   +-- demand_forecasting_model.joblib
|   |   +-- demand_forecasting_metadata.json
|   |   +-- feature_info.joblib
|   |
|   +-- notebooks/
|       +-- 01_Stockout_Preprocessing.ipynb
|       +-- 02_Stockout_Modeling.ipynb
|       +-- 03_Demand_Forecasting.ipynb
|
+-- .gitignore
+-- .gitattributes
+-- README.md
```

---

# Testing and Validation

The project was tested at multiple levels.

## ML Model Validation

The demand forecasting model was evaluated using:

```text
MAE
RMSE
```

The stockout model was evaluated using:

```text
Accuracy
Precision
Recall
F1-score
ROC-AUC
PR-AUC
```

---

## Saved Model Validation

The trained models were reloaded from their saved artifacts to verify that the serialized models could be used for inference.

The FastAPI health endpoint verifies:

```text
stockout_model_loaded
stockout_preprocessor_loaded
demand_model_loaded
```

---

## API Validation

The ML API was tested using:

```text
GET /health
GET /
POST /forecast
POST /predict
```

The backend was tested using:

```text
GET /api/health
```

Product-level stockout integration was also tested using:

```text
GET /api/stockout/product/:productId
```

---

# Complete ML Pipeline

The complete implemented ML pipeline can be summarized as:

```text
                 HISTORICAL DATA
                       |
             +---------+---------+
             |                   |
             v                   v
      Nivera Orders       Stockout Dataset
             |                   |
             v                   v
       Data Cleaning       Data Cleaning
             |                   |
             v                   v
      Weekly Demand       Feature Engineering
             |                   |
             v                   v
    Forecast Features     Preprocessing
             |                   |
             v                   v
     Random Forest        SMOTE + Tomek
     Regression                |
             |                  v
             |          Random Forest
             |          Classification
             |                  |
             v                  v
      39-Week Forecast    Stockout Probability
             |                  |
             +------+           |
             |      |           v
             v      v       Risk Level
            3M    6M/9M
             |      |
             +--+---+
                |
                v
        Inventory Context
                |
                v
      Inventory Intelligence
                |
                v
        Admin AI Insights
```

---

# Research Foundation

The machine-learning design is motivated by research on inventory stockout prediction and demand forecasting.

Two major research directions were studied:

### Machine Learning for Inventory Stockout Prediction

Research demonstrates that machine-learning models such as Random Forest can perform effectively for stockout prediction, but severe class imbalance creates challenges for precision and rare-event detection.

### Product-Level Demand Forecasting

Research on demand forecasting demonstrates the usefulness of product-level time-series features, lag variables, rolling statistics, and model selection based on demand behavior.

---

# Research Gap

The literature review identified several important gaps:

- Demand forecasting and stockout prediction are often treated separately.
- Severe class imbalance makes stockout prediction difficult.
- Forecast output is not always directly connected to inventory risk prediction.
- Operational inventory information is not always integrated with demand forecasting.
- There is a need for business-oriented risk interpretation.

Nivera addresses the integration gap by connecting the demand forecasting output with the stockout prediction workflow.

---

# Implemented vs Future Research

It is important to distinguish between techniques implemented in the current Nivera system and techniques identified as future research directions.

## Currently Implemented

```text
Random Forest Demand Forecasting
Random Forest Stockout Classification
SMOTE
Tomek Links
Lag Features
Rolling Features
Recursive Forecasting
3/6/9 Month Aggregation
Forecast -> Stockout Integration
```

## Future Research Directions

```text
K-Means + PCA Product Segmentation
LSTM Forecasting
XGBoost / LightGBM
Advanced Ensemble Forecasting
External Signals
Dynamic Product Clustering
Cross-Domain Validation
Cost-Sensitive Learning
```

These future techniques should not be interpreted as currently deployed Nivera components.

---

# Limitations

## 1. Stockout Precision

The stockout model achieves strong recall and ROC-AUC, but precision remains relatively low.

Therefore, the model should be treated as a:

> **Stockout risk screening system**

rather than a guaranteed stockout detector.

---

## 2. Dataset Imbalance

The stockout dataset is extremely imbalanced.

Even after applying SMOTE + Tomek Links, rare-event prediction remains challenging.

---

## 3. Historical Dataset Size

The Nivera demand forecasting dataset currently contains 39 weeks of historical demand.

Longer historical periods could improve the model's ability to learn:

- Seasonal patterns
- Annual trends
- Long-term demand cycles

---

## 4. External Factors

The current forecasting system does not incorporate external signals such as:

- Weather
- Promotions
- Discounts
- Festivals
- Macroeconomic indicators
- Competitor pricing
- Marketing campaigns

These could affect retail demand.

---

## 5. Reorder Quantity

The current reorder estimate is business-rule-based.

It is informed by the ML demand forecast but is not directly predicted by a dedicated optimization or probabilistic inventory model.

---

## 6. Generalization

The stockout model is trained on a public backorder dataset, while demand forecasting is trained using Nivera's historical sales data.

Further validation using real-world retail datasets would be required to establish broader generalization.

---

# Future Scope

## 1. Advanced Demand Forecasting

Future versions could evaluate:

```text
LSTM
GRU
Temporal Fusion Transformer
XGBoost
LightGBM
Hybrid Ensemble Models
```

---

## 2. Product Segmentation

Products could be dynamically grouped according to demand behavior using:

```text
K-Means
PCA
Time-Series Clustering
```

Different forecasting models could then be assigned to different demand clusters.

---

## 3. External Demand Signals

Future versions can incorporate:

```text
Promotions
Discounts
Festivals
Weather
Pricing
Marketing Campaigns
Economic Indicators
```

---

## 4. Cost-Sensitive Stockout Prediction

The stockout classifier could be optimized according to business costs.

```text
Cost of Stockout
        vs
Cost of Overstock
```

The decision threshold could then be optimized based on the financial impact of false negatives and false positives.

---

## 5. Precision-Recall Optimization

Since stockout events are rare, future work could focus on improving:

```text
Precision
PR-AUC
F1-score
Cost-weighted Recall
```

rather than optimizing accuracy alone.

---

## 6. Dynamic Risk Thresholds

Instead of fixed thresholds:

```text
LOW    < 30%
MEDIUM 30% - 70%
HIGH   >= 70%
```

future versions could use product-specific thresholds based on:

- Product value
- Lead time
- Sales velocity
- Criticality
- Supplier reliability
- Business impact

---

## 7. Automated Replenishment Optimization

A future version could replace the business-rule-based reorder estimate with an optimization system considering:

```text
Demand Forecast
+
Lead Time
+
Safety Stock
+
Ordering Cost
+
Holding Cost
+
Stockout Cost
+
Supplier Constraints
```

---

## 8. Continuous Model Monitoring

Future deployments could include:

```text
Model Drift Detection
Data Drift Detection
Prediction Monitoring
Performance Monitoring
Automated Retraining
```

---

## 9. Real-Time Inventory Intelligence

The system can eventually use streaming technologies such as:

```text
Kafka
Debezium
Apache Flink
```

to continuously process inventory and sales events.

This would allow inventory risk to be updated in near real time.

---

# Installation and Setup

## Prerequisites

Install:

```text
Node.js
npm
Python 3.x
MongoDB Atlas account
Git
Git LFS
```

---

# Clone the Repository

```bash
git clone https://github.com/Shwet-Singh1/Retail-Enterprise-Inventory-Intelligence-and-Customer-management-platform.git

cd Retail-Enterprise-Inventory-Intelligence-and-Customer-management-platform
```

---

# Backend Setup

```bash
cd backend
npm install
```

Create:

```text
backend/.env
```

Add:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ML_API_URL=http://127.0.0.1:8001
PORT=5000
```

Start the backend:

```bash
npm start
```

Backend:

```text
http://localhost:5000
```

---

# ML Service Setup

Navigate to the ML directory:

```bash
cd ml
```

Create a virtual environment:

### Windows

```powershell
python -m venv .venv
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn api.main:app --host 127.0.0.1 --port 8001
```

ML service:

```text
http://127.0.0.1:8001
```

---

# Frontend Setup

Navigate to the frontend:

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env
```

Add:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

---

# Running the Complete System

The local system requires the following services:

### Terminal 1 — ML Service

```bash
cd ml
.venv\Scripts\activate
uvicorn api.main:app --host 127.0.0.1 --port 8001
```

### Terminal 2 — Backend

```bash
cd backend
npm start
```

### Terminal 3 — Frontend

```bash
cd frontend
npm run dev
```

MongoDB Atlas is used as the database, so a local MongoDB server is not required if the Atlas connection is configured correctly.

---

# Local Architecture

```text
Browser
   |
   v
React / Vite
   |
   | REST API
   v
Node.js / Express
   |
   +-----------------> MongoDB Atlas
   |
   +-----------------> FastAPI
                           |
                           +---- /forecast
                           |
                           +---- /predict
```

---

# Environment Variables

## Backend

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ML_API_URL=http://127.0.0.1:8001
PORT=5000
```

## Frontend

```env
VITE_API_URL=http://localhost:5000/api
```

## Production Frontend

```env
VITE_API_URL=https://nivera-backend.onrender.com/api
```

## Production Backend

```env
ML_API_URL=https://nivera-ml-api.onrender.com
```

Never commit actual secrets or credentials to GitHub.

---

# Git Large File Storage

The final stockout model is a large binary file and is tracked using Git LFS.

```text
ml/models/final_stockout_model.joblib
```

To initialize Git LFS:

```bash
git lfs install
```

To download LFS files:

```bash
git lfs pull
```

---

# API Summary

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/` | Backend root |
| POST | `/api/stockout/predict` | Direct stockout prediction |
| GET | `/api/stockout/product/:productId` | Product-level inventory intelligence |
| GET | `/health` | ML service health |
| GET | `/` | ML service information |
| POST | `/forecast` | Demand forecasting |
| POST | `/predict` | Stockout prediction |

Additional customer, product, cart, order, and user endpoints are available through their respective backend route modules.

---

# Results Summary

## Demand Forecasting

```text
Best Model:
Random Forest

MAE:
1.0124

RMSE:
1.8334
```

## Stockout Prediction

```text
Best Model:
Random Forest

Accuracy:
96.01%

Precision:
11.80%

Recall:
76.54%

F1:
20.44%

ROC-AUC:
96.75%

PR-AUC:
27.31%
```

Because the stockout problem is highly imbalanced, PR-AUC, recall, precision, and F1 are more informative than accuracy alone.

---

# Example Integrated Prediction

For a validated Nivera product:

```text
Product:
Noise Cancelling Headphones

Current Stock:
20 units

Inventory Threshold:
8 units

Historical Sales:
1 Month  -> 5 units
3 Months -> 18 units
6 Months -> 31 units
9 Months -> 45 units

Forecast:
3 Months -> approximately 10 units
6 Months -> approximately 20 units
9 Months -> approximately 29 units

Stockout Risk:
12.21%

Risk Level:
LOW

Prediction:
No Backorder
```

---

# Key Technical Contributions

### 1. Full-Stack Retail Platform

A complete retail platform was developed using:

```text
React
+
Node.js
+
Express
+
MongoDB
```

### 2. Separate ML Microservice

Machine-learning functionality was separated from the main backend using:

```text
Python
+
FastAPI
```

### 3. Demand Forecasting

A Random Forest regression model predicts future product demand using:

```text
Lag Features
+
Rolling Statistics
+
Calendar Features
```

### 4. Stockout Prediction

A Random Forest classifier predicts stockout/backorder risk using inventory, demand, sales, and operational variables.

### 5. Rare-Event Handling

The stockout model uses:

```text
Controlled Negative Sampling
+
SMOTE
+
Tomek Links
```

to address extreme class imbalance.

### 6. Forecast-to-Risk Integration

The primary system-level contribution is connecting:

```text
Demand Forecast
       |
       v
Stockout Prediction
       |
       v
Inventory Intelligence
```

### 7. Business-Oriented Output

The ML results are transformed into practical administrator-facing information:

```text
Forecast
Risk Probability
Risk Level
Inventory Coverage
Demand Gap
Reorder Estimate
```

---

# Conclusion

Nivera integrates full-stack retail management with machine-learning-based inventory intelligence.

The system combines:

```text
React
   +
Node.js / Express
   +
MongoDB Atlas
   +
Python / FastAPI
   +
Random Forest
   +
SMOTE + Tomek Links
```

The implemented machine-learning pipeline consists of two major components:

```text
Demand Forecasting
        +
Stockout Prediction
        |
        v
Inventory Intelligence
```

The demand forecasting model predicts future product demand over a 39-week horizon, while the stockout model estimates the probability of a product entering a stockout/backorder state.

The resulting system provides administrators with a consolidated view of future demand, inventory risk, and replenishment requirements.

---

# References

## Dataset

Back Order Prediction Dataset:

https://www.kaggle.com/datasets/gowthammiryala/back-order-prediction-dataset

## Project Repository

https://github.com/Shwet-Singh1/Retail-Enterprise-Inventory-Intelligence-and-Customer-management-platform

## Research Foundation

The project was developed with reference to research on:

- Machine-learning-based inventory stockout prediction
- Demand forecasting using time-series feature engineering
- Ensemble learning for retail demand forecasting
- Rare-event classification
- Inventory forecasting and replenishment intelligence

---

# License

This project is developed as an academic/capstone project.

The repository may contain third-party datasets and libraries that are subject to their respective licenses and terms of use.

---

# Nivera

```text
Retail Management
       +
Machine Learning
       +
Demand Forecasting
       +
Stockout Prediction
       +
Inventory Intelligence
```

> **Predict demand. Identify risk. Make better inventory decisions.**

---

## Author

### Parv Khandelwal

**B.Tech — Computer Science and Engineering**  
**VIT Bhopal University**

**Areas of Work:**
- Full-Stack Development
- Machine Learning
- Data Analytics
- Demand Forecasting
- Stockout Prediction
- Inventory Intelligence

**GitHub:**  
[github.com/parvkhandelwal30/Nivera---A-Retail-Intelligence-Platform](https://github.com/parvkhandelwal30/Nivera---A-Retail-Intelligence-Platform)

---
