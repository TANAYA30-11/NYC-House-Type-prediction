import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pydantic import BaseModel, Field

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

COLUMNS = [
    "latitude",
    "longitude",
    "price",
    "minimum_nights",
    "number_of_reviews",
    "reviews_per_month",
    "calculated_host_listings_count",
    "availability_365",
    "neighbourhood_group",
    "neighbourhood",
]

model = joblib.load("model_pipeline.pkl")


class Features(BaseModel):
    latitude: float = Field(
        ..., ge=-90, le=90, description="Latitude coordinate"
    )
    longitude: float = Field(
        ..., ge=-180, le=180, description="Longitude coordinate"
    )
    price: float = Field(..., gt=0, description="Price per night")
    minimum_nights: int = Field(
        ..., ge=1, le=365, description="Minimum nights required"
    )
    number_of_reviews: int = Field(
        ..., ge=0, description="Total number of reviews"
    )
    reviews_per_month: float = Field(
        ..., ge=0, description="Average reviews per month"
    )
    calculated_host_listings_count: int = Field(
        ..., ge=0, description="Host listings count"
    )
    availability_365: int = Field(
        ..., ge=0, le=365, description="Days available in a year"
    )
    neighbourhood_group: str = Field(
        ..., min_length=1, description="Borough group"
    )
    neighbourhood: str = Field(
        ..., min_length=1, description="Neighbourhood name"
    )


@app.get("/")
def greet():
    return {"message": "Airbnb Room Type Classifier API"}


@app.post("/predict")
def predict(features: Features):
    input_data = features.model_dump()
    row = pd.DataFrame([input_data], columns=COLUMNS)

    prediction = model.predict(row)[0]

    response = {"Predicted_room_type": str(prediction)}

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(row)[0]
        classes = (
            model.classes_.tolist()
            if hasattr(model, "classes_")
            else [f"Class {i}" for i in range(len(probabilities))]
        )
        response["Probabilities"] = dict(
            zip(classes, [round(float(p), 4) for p in probabilities])
        )

    return response