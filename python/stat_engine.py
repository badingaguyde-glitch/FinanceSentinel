import json
import logging
import traceback
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from scipy import stats
import statsmodels.api as sm

from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, accuracy_score, f1_score
from sklearn.impute import SimpleImputer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MCP_StatEngine")


# =========================
# DATA PROCESSOR
# =========================
class DataProcessor:
    def __init__(self, data: Any):
        self.df = self._load_data(data)
        self.feature_types = {}
        self.outliers = {}

    def _load_data(self, data: Any) -> pd.DataFrame:
        if isinstance(data, pd.DataFrame):
            return data.copy()
        elif isinstance(data, list):
            return pd.DataFrame(data)
        elif isinstance(data, dict):
            return pd.DataFrame(data)
        elif isinstance(data, str):
            try:
                return pd.DataFrame(json.loads(data))
            except:
                return pd.read_csv(data)
        else:
            raise ValueError("Unsupported data format")

    def apply_filters(self, filters: Dict[str, Any]):
        for col, cond in filters.items():
            if col not in self.df.columns:
                continue
            if "gt" in cond:
                self.df = self.df[self.df[col] > cond["gt"]]
            if "lt" in cond:
                self.df = self.df[self.df[col] < cond["lt"]]
            if "eq" in cond:
                self.df = self.df[self.df[col] == cond["eq"]]

    def _sanitize_columns(self):
        """Remove or flatten columns that contain unhashable types (lists, dicts, objects)
        coming from MongoDB nested structures, before any sklearn processing."""
        cols_to_drop = []
        for col in self.df.columns:
            # Check if any cell in the column is a list or dict
            sample = self.df[col].dropna()
            if len(sample) > 0:
                has_unhashable = sample.apply(lambda x: isinstance(x, (list, dict))).any()
                if has_unhashable:
                    # Try to stringify it; if that doesn't make sense, drop it
                    try:
                        self.df[col] = self.df[col].apply(
                            lambda x: str(x.get('name', x)) if isinstance(x, dict)
                            else (', '.join(str(i) for i in x) if isinstance(x, list) else x)
                        )
                    except Exception:
                        cols_to_drop.append(col)

        if cols_to_drop:
            logger.warning(f"Dropping unhashable columns: {cols_to_drop}")
            self.df.drop(columns=cols_to_drop, inplace=True)

    def process(self):
        self._sanitize_columns()
        self._detect_types()
        self._handle_missing()
        self._detect_outliers()
        return self.df

    def _detect_types(self):
        for col in self.df.columns:
            if pd.api.types.is_numeric_dtype(self.df[col]):
                self.feature_types[col] = "numeric"
            else:
                self.feature_types[col] = "categorical"

    def _handle_missing(self):
        num_cols = [c for c, t in self.feature_types.items() if t == "numeric"]
        cat_cols = [c for c, t in self.feature_types.items() if t == "categorical"]

        if num_cols:
            self.df[num_cols] = SimpleImputer(strategy='median').fit_transform(self.df[num_cols])
        if cat_cols:
            self.df[cat_cols] = SimpleImputer(strategy='most_frequent').fit_transform(self.df[cat_cols])

    def _detect_outliers(self):
        for col in self.df.select_dtypes(include=np.number).columns:
            z = np.abs(stats.zscore(self.df[col]))
            outliers = np.where(z > 3)[0]
            if len(outliers):
                self.outliers[col] = len(outliers)


# =========================
# STATISTICS
# =========================
class StatisticalAnalyzer:
    def __init__(self, df):
        self.df = df

    def analyze(self):
        corr_dict = self.df.corr(numeric_only=True).to_dict()
        return {
            "describe": self.df.describe().to_dict(),
            "correlation": corr_dict,
            "correlations": {
                "pearson": corr_dict
            }
        }


# =========================
# MODELING
# =========================
class Modeler:
    def __init__(self, df):
        self.df = df

    def run_prediction(self, config):
        target = config.get("target_column")
        features = config.get("features")

        if not target or target not in self.df.columns:
            return {}

        if features:
            X = self.df[features]
        else:
            X = self.df.drop(columns=[target], errors="ignore")

        X = pd.get_dummies(X, drop_first=True)
        X = X.astype(float).fillna(0)

        y = self.df[target].astype(float).fillna(0)

        # Determine task type: use regression for continuous float targets, classification for discrete int/categorical
        # A target is considered continuous if it has decimal parts OR many unique values
        has_decimals = (y % 1 != 0).any()
        is_classification = (not has_decimals) and (y.nunique() < 10)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

        result = {}

        if is_classification:
            model = RandomForestClassifier(n_estimators=50)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)

            result = {
                "type": "classification",
                "model": "RandomForestClassifier",
                "performance": {
                    "accuracy": float(accuracy_score(y_test, preds)),
                    "f1": float(f1_score(y_test, preds, average="weighted"))
                }
            }
        else:
            model = RandomForestRegressor(n_estimators=50)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)

            result = {
                "type": "regression",
                "model": "RandomForestRegressor",
                "performance": {
                    "r2": float(r2_score(y_test, preds)),
                    "mse": float(mean_squared_error(y_test, preds))
                }
            }
            try:
                X_sm = sm.add_constant(X_train)
                ols_model = sm.OLS(y_train, X_sm).fit()
                params_dict = ols_model.params.to_dict()
                result["ols_regression"] = {
                    "params": {str(k): float(v) for k, v in params_dict.items()},
                    "r2": float(ols_model.rsquared)
                }
            except Exception as e:
                logger.error(f"OLS failed: {e}")

        if hasattr(model, "feature_importances_"):
            fi = dict(zip(X.columns, model.feature_importances_))
            result["feature_importance"] = {
                k: float(v) for k, v in sorted(fi.items(), key=lambda x: x[1], reverse=True)[:10]
            }

        return result


# =========================
# PCA / CLUSTERING
# =========================
def run_pca(df):
    num_df = df.select_dtypes(include=np.number)
    if num_df.shape[1] < 2:
        return {}

    scaler = StandardScaler()
    scaled = scaler.fit_transform(num_df)

    pca = PCA(n_components=2)
    comps = pca.fit_transform(scaled)

    n_clusters = min(3, max(1, len(df)//2))
    kmeans = KMeans(n_clusters=n_clusters, n_init=10)

    clusters = kmeans.fit_predict(scaled)

    return {
        "variance": pca.explained_variance_ratio_.tolist(),
        "points": [{"x": float(c[0]), "y": float(c[1]), "cluster": int(clusters[i])}
                    for i, c in enumerate(comps)]
    }


# =========================
# MAIN FUNCTION
# =========================
def analyze_data(input_data: Any, config: Dict[str, Any] = None):
    try:
        if config is None:
            config = {}

        tasks = config.get("tasks", [])

        processor = DataProcessor(input_data)

        # FILTERS
        filters = config.get("filters", {})
        if filters:
            processor.apply_filters(filters)

        df = processor.process()

        # =====================
        # YFINANCE PIPELINE
        # =====================
        external_ticker = config.get("external_ticker")
        if external_ticker:
            try:
                import yfinance as yf
                
                # Check for various timestamp column names
                ts_col = None
                for col in ["timestamps", "publishedAt", "date", "time"]:
                    if col in df.columns:
                        ts_col = col
                        break
                        
                if ts_col:
                    df[ts_col] = pd.to_datetime(df[ts_col])
                    min_date = df[ts_col].min()
                    max_date = df[ts_col].max()
                    
                    min_date_str = (min_date - pd.Timedelta(days=5)).strftime("%Y-%m-%d")
                    max_date_str = (max_date + pd.Timedelta(days=5)).strftime("%Y-%m-%d")
                    
                    ticker = yf.Ticker(external_ticker)
                    hist = ticker.history(start=min_date_str, end=max_date_str)
                    
                    if not hist.empty:
                        # Extract timezone-naive dates for clean merging
                        try:
                            df["_merge_date"] = df[ts_col].dt.tz_localize(None).dt.normalize()
                        except TypeError:
                            # Already tz-naive
                            df["_merge_date"] = df[ts_col].dt.tz_convert(None).dt.normalize()
                        
                        try:
                            hist.index = hist.index.tz_localize(None).normalize()
                        except TypeError:
                            hist.index = hist.index.tz_convert(None).normalize()
                        
                        hist_clean = hist[["Close", "Volume"]].reset_index()
                        hist_clean.rename(columns={"Date": "_merge_date", "Close": f"{external_ticker}_price", "Volume": f"{external_ticker}_volume"}, inplace=True)
                        
                        df = pd.merge(df, hist_clean, on="_merge_date", how="left")
                        df.sort_values("_merge_date", inplace=True)
                        
                        df[f"{external_ticker}_price"] = df[f"{external_ticker}_price"].ffill().bfill()
                        df[f"{external_ticker}_volume"] = df[f"{external_ticker}_volume"].ffill().bfill()
                        
                        df.drop(columns=["_merge_date"], inplace=True)
                        
                        # Drop the yfinance columns if they are all NaN (fetch returned no matching dates)
                        price_col = f"{external_ticker}_price"
                        vol_col = f"{external_ticker}_volume"
                        if df[price_col].isna().all():
                            df.drop(columns=[price_col, vol_col], errors='ignore', inplace=True)
                            logger.warning(f"yfinance returned no overlapping dates for {external_ticker}. Columns dropped.")
                        else:
                            # Replace generic 'price_data' target with actual price
                            if config.get("target_column") == "price_data":
                                df["price_data"] = df[price_col]
                            
            except Exception as e:
                logger.error(f"Failed fetching yfinance data for {external_ticker}: {e}")

        results = {
            "summary": f"{len(df)} rows, {len(df.columns)} columns",
            "outliers": processor.outliers,
            "insights": [],
            "plots_metadata": []
        }

        # =====================
        # TASKS CONTROL
        # =====================

        if "statistics" in tasks:
            stats = StatisticalAnalyzer(df).analyze()
            results["statistics"] = stats
            if "correlation" in stats:
                results["insights"].append("Statistical analysis and correlations calculated.")

        if "pca" in tasks:
            pca_res = run_pca(df)
            results["pca"] = pca_res
            if pca_res and "points" in pca_res:
                results["insights"].append("PCA completed, identified cluster definitions.")
                results["plots_metadata"].append({
                    "type": "scatter_pca",
                    "data": {
                        "title": "PCA Cluster Visualization",
                        "points": pca_res["points"]
                    }
                })

        if "prediction" in tasks or "regression" in tasks:
            mod_res = Modeler(df).run_prediction(config)
            results["models"] = mod_res
            if mod_res.get("type"):
                 results["insights"].append(f"Model trained successfully ({mod_res.get('model')}).")

        # =====================
        # CONFIDENCE
        # =====================
        results["confidence_score"] = min(1.0, len(df)/1000)

        # =====================
        # CLEAN NaN FOR JSON
        # =====================
        import math

        def clean_nans(obj):
            if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
                return None
            elif isinstance(obj, dict):
                return {k: clean_nans(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_nans(i) for i in obj]
            return obj

        return clean_nans(results)

    except Exception as e:
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }