import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

print("Loading dataset...")

df = pd.read_csv("kickstarter.csv", low_memory=False)

print("Dataset loaded:", df.shape)

# -------------------------------
# SELECT IMPORTANT FEATURES
# -------------------------------
df = df[[
    'Goal',
    'Duration in Days',
    'Backers',
    'Updates',
    'Comments',
    'Facebook Shares',
    'Has Video',
    '# Images',
    '# Words (Description)',
    'State'
]]

# -------------------------------
# CLEAN DATA
# -------------------------------
df = df[df['State'].isin(['successful', 'failed'])]

df['State'] = df['State'].map({
    'successful': 1,
    'failed': 0
})

# Convert Yes/No to 1/0
df['Has Video'] = df['Has Video'].map({'Yes': 1, 'No': 0})

df = df.fillna(0)

# -------------------------------
# FEATURES & LABEL
# -------------------------------
X = df.drop('State', axis=1)
y = df['State']

# -------------------------------
# SPLIT DATA
# -------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# -------------------------------
# SCALE DATA
# -------------------------------
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# -------------------------------
# MODEL (UPGRADED)
# -------------------------------
model = RandomForestClassifier(
    n_estimators=150,
    max_depth=10,
    random_state=42
)

print("Training model...")
model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)
print(f"Model Accuracy: {accuracy * 100:.2f}%")

# -------------------------------
# SAVE MODEL
# -------------------------------
joblib.dump(model, "model.pkl")
joblib.dump(scaler, "scaler.pkl")

print("Model and scaler saved!")