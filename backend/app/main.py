from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# load the model
MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "house_model.joblib"
saved = joblib.load(MODEL_PATH)
pipeline = saved["pipeline"]
FEATURES = saved["features"]
zip_encoder = pipeline.named_steps["prep"].named_transformers_["zip"]
KNOWN_ZIPCODES = sorted(str(code) for code in zip_encoder.categories_[0])

app = FastAPI(title="Immo price Predictor")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class HouseInput(BaseModel):
    sqft_living: int = Field(ge=250, le=14000)
    sqft_lot: int = Field(ge=400, le=1700000)
    bedrooms: int = Field(ge=1, le=9)
    bathrooms: float = Field(ge=0.5, le=8)
    floors: float = Field(ge=1, le=3.5)
    waterfront: int = Field(ge=0, le=1)
    view: int = Field(ge=0, le=4)
    condition: int = Field(ge=1, le=5)
    grade: int = Field(ge=1, le=13)
    year_built: int = Field(ge=1900, le=2026)
    renovated: int = Field(ge=0, le=1)
    zipcode: str = Field(min_length=5, max_length=5)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "sqft_living": 1180,
                    "sqft_lot": 5650,
                    "bedrooms": 3,
                    "bathrooms": 1.0,
                    "floors": 1.0,
                    "waterfront": 0,
                    "view": 0,
                    "condition": 3,
                    "grade": 7,
                    "year_built": 1955,
                    "renovated": 0,
                    "zipcode": "98178",
                }
            ]
        }
    }


@app.get("/")
def home():
    return {"status": "ok", "project": "MaisonPrix"}


@app.get("/zipcodes")
def zipcodes():
    return {"zipcodes": KNOWN_ZIPCODES}


@app.post("/predict")
def predict(house: HouseInput):
    if house.zipcode not in KNOWN_ZIPCODES:
        raise HTTPException(status_code=422, detail="Unknown zipcode")

    data = house.model_dump()
    data["age"] = max(0, 2015 - data.pop("year_built"))

    row = pd.DataFrame([data])[FEATURES]
    price = float(np.exp(pipeline.predict(row)[0]))

    return {"price": round(price), "currency": "USD"}
