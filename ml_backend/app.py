from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

print("Loading model and scaler...")

# -------------------------------
# Load model and scaler
# -------------------------------
BASE_DIR = os.path.dirname(__file__)

model_path = os.path.join(BASE_DIR, "model.pkl")
scaler_path = os.path.join(BASE_DIR, "scaler.pkl")

model = joblib.load(model_path)
scaler = joblib.load(scaler_path)

print("Model and scaler loaded successfully!")


# -------------------------------
# Home route
# -------------------------------
@app.route("/")
def home():
    return "Smart ChainFund ML API is running!"


# -------------------------------
# Prediction API
# -------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        # -------------------------------
        # Extract inputs
        # -------------------------------
        goal = float(data["goal"])
        duration = float(data["duration"])
        backers = float(data["backers"])
        updates = float(data["updates"])
        comments = float(data["comments"])
        shares = float(data["shares"])
        has_video = int(data["has_video"])
        images = float(data["images"])
        words = float(data["words"])

        # -------------------------------
        # Prepare input
        # -------------------------------
        input_data = np.array([[
            goal,
            duration,
            backers,
            updates,
            comments,
            shares,
            has_video,
            images,
            words
        ]])

        input_scaled = scaler.transform(input_data)

        # -------------------------------
        # Prediction
        # -------------------------------
        prediction = model.predict(input_scaled)[0]
        probability = model.predict_proba(input_scaled)[0][1]

        # -------------------------------
        # Smart decision logic
        # -------------------------------
        threshold = 0.6

        if probability >= threshold:
            status = "Likely Successful"
        else:
            status = "High Risk of Failure"

        # Confidence score (0–100%)
        confidence = round(abs(probability - 0.5) * 2 * 100, 2)

        # -------------------------------
        # Smart suggestions
        # -------------------------------
        suggestions = []

        if goal > 15000:
            suggestions.append("💡 Lower your funding goal to attract more backers.")

        if duration < 20:
            suggestions.append("⏳ Increase campaign duration for better visibility.")

        if shares < 50:
            suggestions.append("📢 Improve social media promotion.")

        if has_video == 0:
            suggestions.append("🎥 Adding a video increases trust and engagement.")

        if words < 300:
            suggestions.append("📝 Provide a more detailed project description.")

        if backers < 20:
            suggestions.append("👥 Try to get initial supporters early.")

        if updates < 3:
            suggestions.append("🔄 Post regular updates to keep users engaged.")

        # -------------------------------
        # Response
        # -------------------------------
        return jsonify({
            "status": status,
            "success": int(prediction),
            "probability": round(float(probability), 3),
            "confidence": confidence,
            "suggestions": suggestions
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        })


# -------------------------------
# Run server
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True)