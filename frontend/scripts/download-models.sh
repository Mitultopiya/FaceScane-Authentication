#!/bin/bash
# Download face-api.js models for face detection
# Run from frontend directory: bash scripts/download-models.sh

MODEL_DIR="public/models"
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

mkdir -p "$MODEL_DIR"

echo "Downloading face-api.js models..."

files=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
)

for file in "${files[@]}"; do
  echo "  Downloading $file..."
  curl -sL "$BASE_URL/$file" -o "$MODEL_DIR/$file"
done

echo "✓ Models downloaded to $MODEL_DIR"
