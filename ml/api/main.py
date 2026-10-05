from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="Nivera ML API",
    description="Demand Forecasting and Stockout Prediction API",
    version="1.0.0",
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"


# ============================================================
# LOAD STOCKOUT MODEL
# ============================================================

STOCKOUT_MODEL_PATH = MODEL_DIR / "final_stockout_model.joblib"
STOCKOUT_PREPROCESSOR_PATH = MODEL_DIR / "stockout_preprocessor.joblib"

try:
    stockout_model = joblib.load(STOCKOUT_MODEL_PATH)
    stockout_preprocessor = joblib.load(STOCKOUT_PREPROCESSOR_PATH)

    print("Stockout model loaded successfully.")

except Exception as error:
    print(f"Stockout model loading error: {error}")
    stockout_model = None
    stockout_preprocessor = None


# ============================================================
# LOAD DEMAND FORECASTING MODEL
# ============================================================

DEMAND_MODEL_PATH = MODEL_DIR / "demand_forecasting_model.joblib"
DEMAND_METADATA_PATH = MODEL_DIR / "demand_forecasting_metadata.json"

try:
    demand_model = joblib.load(DEMAND_MODEL_PATH)

    if DEMAND_METADATA_PATH.exists():
        demand_metadata = pd.read_json(
            DEMAND_METADATA_PATH,
            typ="series"
        ).to_dict()
    else:
        demand_metadata = {}

    print("Demand forecasting model loaded successfully.")

except Exception as error:
    print(f"Demand forecasting model loading error: {error}")
    demand_model = None
    demand_metadata = {}


# ============================================================
# STOCKOUT REQUEST SCHEMA
# ============================================================

class StockoutRequest(BaseModel):

    sku: Optional[str] = None

    national_inv: float = 0
    lead_time: Optional[float] = None
    in_transit_qty: float = 0

    forecast_3_month: float = 0
    forecast_6_month: float = 0
    forecast_9_month: float = 0

    sales_1_month: float = 0
    sales_3_month: float = 0
    sales_6_month: float = 0
    sales_9_month: float = 0

    min_bank: float = 0
    potential_issue: str = "No"

    pieces_past_due: float = 0

    perf_6_month_avg: Optional[float] = None
    perf_12_month_avg: Optional[float] = None

    local_bo_qty: float = 0

    deck_risk: str = "No"
    oe_constraint: str = "No"
    ppap_risk: str = "No"
    stop_auto_buy: str = "No"
    rev_stop: str = "No"


# ============================================================
# DEMAND FORECAST REQUEST SCHEMA
# ============================================================

class DemandForecastRequest(BaseModel):

    product_id: Optional[str] = None
    product_name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None

    weekly_demand: List[float] = Field(
        ...,
        min_length=4
    )

    last_week: str


# ============================================================
# STOCKOUT FEATURE ENGINEERING
# ============================================================

def create_stockout_features(data: dict) -> pd.DataFrame:

    df = pd.DataFrame([data])

    # --------------------------------------------------------
    # Convert -99 special values to missing values
    # --------------------------------------------------------

    performance_columns = [
        "perf_6_month_avg",
        "perf_12_month_avg",
    ]

    for column in performance_columns:
        if column in df.columns:
            df[column] = df[column].replace(-99, np.nan)

    # --------------------------------------------------------
    # Average monthly sales
    # --------------------------------------------------------

    df["avg_monthly_sales_3m"] = (
        df["sales_3_month"] / 3
    )

    df["avg_monthly_sales_6m"] = (
        df["sales_6_month"] / 6
    )

    df["avg_monthly_sales_9m"] = (
        df["sales_9_month"] / 9
    )

    # --------------------------------------------------------
    # Inventory / forecast features
    # --------------------------------------------------------

    df["inventory_to_forecast"] = (
        df["national_inv"] /
        (df["forecast_3_month"] + 1)
    )

    df["forecast_vs_sales"] = (
        df["forecast_3_month"] /
        (df["sales_3_month"] + 1)
    )

    df["inventory_gap"] = (
        df["national_inv"] -
        df["forecast_3_month"]
    )

    # --------------------------------------------------------
    # Demand pressure
    # --------------------------------------------------------

    df["demand_pressure"] = (
        df["forecast_3_month"] -
        df["national_inv"]
    )

    # --------------------------------------------------------
    # In-transit ratio
    # --------------------------------------------------------

    df["in_transit_ratio"] = (
        df["in_transit_qty"] /
        (df["forecast_3_month"] + 1)
    )

    # --------------------------------------------------------
    # Sales acceleration
    # --------------------------------------------------------

    df["sales_acceleration"] = (
        df["avg_monthly_sales_3m"] /
        (df["avg_monthly_sales_6m"] + 1e-6)
    )

    # --------------------------------------------------------
    # Forecast growth
    # --------------------------------------------------------

    df["forecast_growth_6m"] = (
        df["forecast_6_month"] /
        (df["forecast_3_month"] + 1)
    )

    df["forecast_growth_9m"] = (
        df["forecast_9_month"] /
        (df["forecast_6_month"] + 1)
    )

    # --------------------------------------------------------
    # Lead-time demand
    # --------------------------------------------------------

    lead_time = df["lead_time"].fillna(0)

    df["lead_time_demand"] = (
        df["avg_monthly_sales_3m"] *
        (lead_time / 30)
    )

    # --------------------------------------------------------
    # Inventory coverage
    # --------------------------------------------------------

    df["inventory_coverage"] = (
        df["national_inv"] /
        (df["avg_monthly_sales_3m"] + 1e-6)
    )

    # --------------------------------------------------------
    # Remove SKU because the training pipeline did not use it
    # --------------------------------------------------------

    if "sku" in df.columns:
        df = df.drop(columns=["sku"])

    return df


# ============================================================
# DEMAND FORECAST FEATURE ENGINEERING
# ============================================================

def build_forecast_features(
    weekly_demand: List[float],
    week_number: int,
    date_value: pd.Timestamp,
    time_index: int,
) -> pd.DataFrame:

    values = list(weekly_demand)

    # --------------------------------------------------------
    # Lag features
    # --------------------------------------------------------

    lag_1 = values[-1]
    lag_2 = values[-2]
    lag_3 = values[-3]
    lag_4 = values[-4]

    # --------------------------------------------------------
    # Rolling features
    # --------------------------------------------------------

    rolling_mean_3 = np.mean(values[-3:])
    rolling_mean_4 = np.mean(values[-4:])
    rolling_mean_8 = np.mean(values[-8:])

    rolling_std_4 = (
        np.std(values[-4:])
        if len(values[-4:]) > 1
        else 0
    )

    # --------------------------------------------------------
    # Calendar features
    # --------------------------------------------------------

    month = date_value.month
    quarter = date_value.quarter

    return pd.DataFrame(
        [
            {
                "lag_1": lag_1,
                "lag_2": lag_2,
                "lag_3": lag_3,
                "lag_4": lag_4,
                "rolling_mean_3": rolling_mean_3,
                "rolling_mean_4": rolling_mean_4,
                "rolling_mean_8": rolling_mean_8,
                "rolling_std_4": rolling_std_4,
                "week_number": week_number,
                "month": month,
                "quarter": quarter,
                "time_index": time_index,
            }
        ]
    )


# ============================================================
# DEMAND FORECAST GENERATION
# ============================================================

def generate_demand_forecast(
    weekly_demand: List[float],
    last_week: str,
):

    if demand_model is None:
        raise RuntimeError(
            "Demand forecasting model is not available."
        )

    history = [
        float(value)
        for value in weekly_demand
    ]

    if len(history) < 8:
        raise ValueError(
            "At least 8 weeks of demand history are required."
        )

    last_week_date = pd.to_datetime(last_week)

    # ========================================================
    # IMPORTANT:
    # last_week represents the latest HISTORICAL week.
    # Forecast must begin from the following week.
    # ========================================================

    forecast_start_week = (
        last_week_date +
        pd.Timedelta(weeks=1)
    )

    weekly_forecasts = []

    # 39 weeks ≈ 9 months
    for step in range(39):

        forecast_week = (
            forecast_start_week +
            pd.Timedelta(weeks=step)
        )

        # ----------------------------------------------------
        # Feature generation
        # ----------------------------------------------------

        features = build_forecast_features(
            weekly_demand=history,
            week_number=int(
                forecast_week.isocalendar().week
            ),
            date_value=forecast_week,
            time_index=len(history),
        )

        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        prediction = demand_model.predict(
            features
        )[0]

        # Demand cannot be negative
        prediction = max(
            0.0,
            float(prediction)
        )

        weekly_forecasts.append(
            {
                "week": forecast_week.strftime(
                    "%Y-%m-%d"
                ),
                "forecast": round(
                    prediction,
                    4
                ),
            }
        )

        # ----------------------------------------------------
        # Recursive forecasting:
        # predicted value becomes future history
        # ----------------------------------------------------

        history.append(prediction)

    # ========================================================
    # MULTI-HORIZON FORECAST
    # ========================================================

    first_13_weeks = [
        item["forecast"]
        for item in weekly_forecasts[:13]
    ]

    first_26_weeks = [
        item["forecast"]
        for item in weekly_forecasts[:26]
    ]

    first_39_weeks = [
        item["forecast"]
        for item in weekly_forecasts[:39]
    ]

    forecast_3_month = float(
        np.sum(first_13_weeks)
    )

    forecast_6_month = float(
        np.sum(first_26_weeks)
    )

    forecast_9_month = float(
        np.sum(first_39_weeks)
    )

    return {
        "forecast_3_month": round(
            forecast_3_month,
            4
        ),
        "forecast_6_month": round(
            forecast_6_month,
            4
        ),
        "forecast_9_month": round(
            forecast_9_month,
            4
        ),

        "forecast_3_month_units": int(
            round(forecast_3_month)
        ),

        "forecast_6_month_units": int(
            round(forecast_6_month)
        ),

        "forecast_9_month_units": int(
            round(forecast_9_month)
        ),

        "weekly_forecast": weekly_forecasts,
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Nivera ML API is running",
        "services": {
            "stockout_prediction": "/predict",
            "demand_forecasting": "/forecast",
        },
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "stockout_model_loaded": (
            stockout_model is not None
        ),
        "stockout_preprocessor_loaded": (
            stockout_preprocessor is not None
        ),
        "demand_model_loaded": (
            demand_model is not None
        ),
    }


# ============================================================
# STOCKOUT PREDICTION
# ============================================================

@app.post("/predict")
def predict_stockout(
    request: StockoutRequest
):

    if stockout_model is None:
        raise HTTPException(
            status_code=500,
            detail="Stockout model is not loaded.",
        )

    if stockout_preprocessor is None:
        raise HTTPException(
            status_code=500,
            detail="Stockout preprocessor is not loaded.",
        )

    try:

        input_data = request.model_dump()

        features = create_stockout_features(
            input_data
        )

        # ----------------------------------------------------
        # Transform using the exact preprocessing pipeline
        # ----------------------------------------------------

        transformed_features = (
            stockout_preprocessor.transform(
                features
            )
        )

        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        prediction = int(
            stockout_model.predict(
                transformed_features
            )[0]
        )

        probability = float(
            stockout_model.predict_proba(
                transformed_features
            )[0][1]
        )

        # ----------------------------------------------------
        # Risk level
        # ----------------------------------------------------

        if probability >= 0.70:
            risk_level = "HIGH"

        elif probability >= 0.30:
            risk_level = "MEDIUM"

        else:
            risk_level = "LOW"

        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return {
            "prediction": prediction,

            "prediction_label": (
                "BACKORDER"
                if prediction == 1
                else "NO BACKORDER"
            ),

            "stockout_probability": round(
                probability,
                4
            ),

            "risk_percentage": round(
                probability * 100,
                2
            ),

            "risk_level": risk_level,
        }

    except Exception as error:

        print(
            f"Stockout prediction error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# DEMAND FORECASTING
# ============================================================

@app.post("/forecast")
def forecast_demand(
    request: DemandForecastRequest
):

    if demand_model is None:
        raise HTTPException(
            status_code=500,
            detail="Demand forecasting model is not loaded.",
        )

    try:

        result = generate_demand_forecast(
            weekly_demand=request.weekly_demand,
            last_week=request.last_week,
        )

        return {
            "success": True,

            "product_id": request.product_id,
            "product_name": request.product_name,
            "sku": request.sku,
            "category": request.category,

            "last_historical_week": request.last_week,

            "forecast_start_week": result[
                "weekly_forecast"
            ][0]["week"],

            "forecast_3_month": result[
                "forecast_3_month"
            ],

            "forecast_6_month": result[
                "forecast_6_month"
            ],

            "forecast_9_month": result[
                "forecast_9_month"
            ],

            "forecast_3_month_units": result[
                "forecast_3_month_units"
            ],

            "forecast_6_month_units": result[
                "forecast_6_month_units"
            ],

            "forecast_9_month_units": result[
                "forecast_9_month_units"
            ],

            "weekly_forecast": result[
                "weekly_forecast"
            ],
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        print(
            f"Demand forecasting error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )