#!/bin/bash
# Run this once to set up all GCP resources for TeamPulse
# Prerequisites: gcloud auth login (with alokmail108@gmail.com)

set -e

PROJECT_ID="promptwars-chennai-495105"
REGION="us-central1"

echo "=== Setting up TeamPulse on Google Cloud ==="

# Set project
gcloud config set project $PROJECT_ID
gcloud config set account alokmail108@gmail.com

# Enable required APIs
echo "Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  cloudtasks.googleapis.com \
  secretmanager.googleapis.com

# Create Artifact Registry repo
echo "Creating Artifact Registry repository..."
gcloud artifacts repositories create teampulse \
  --repository-format=docker \
  --location=$REGION \
  --description="TeamPulse Docker images" \
  2>/dev/null || echo "Repo already exists, skipping."

# Grant Cloud Build service account permissions
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "Granting Cloud Build permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer"

# Grant Cloud Run service account access to Vertex AI and Firestore
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/datastore.user"

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "1. Initialize Firestore in GCP Console: https://console.cloud.google.com/firestore"
echo "   → Select 'Native mode' → Region: us-central1"
echo ""
echo "2. Connect your GitHub repo to Cloud Build:"
echo "   → https://console.cloud.google.com/cloud-build/triggers"
echo "   → Connect Repository → GitHub → alok108/teampulse"
echo "   → Create trigger: Push to main branch → cloudbuild.yaml"
echo ""
echo "3. Manual deploy (without Cloud Build):"
echo "   gcloud builds submit --config cloudbuild.yaml ."
echo ""
echo "4. After first backend deploy, get the URL and update cloudbuild.yaml"
echo "   gcloud run services describe teampulse-backend --region=$REGION --format='value(status.url)'"
