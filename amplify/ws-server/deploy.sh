#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define Docker parameters
IMAGE_NAME="websocket-server"
CONTAINER_NAME="websocket-server"

# Step 1: Compile TypeScript for the server
echo "Compiling TypeScript for server..."
npx tsc

# Step 2: Ensure the `dist` directory exists
if [ ! -d "dist" ]; then
    echo "Error: Compilation failed. The 'dist' directory does not exist."
    exit 1
fi

# Step 3: Build the Docker image for the server
echo "Building Docker image for server..."
docker build -t $IMAGE_NAME .

# Step 4: Stop and remove any existing container for the server
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Stopping existing container: $CONTAINER_NAME..."
    docker stop $CONTAINER_NAME
fi

if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Removing existing container: $CONTAINER_NAME..."
    docker rm $CONTAINER_NAME
fi

# Step 5: Start a new Docker container for the server
echo "Starting new container: $CONTAINER_NAME..."
docker run -d -p 8765:8765 --name $CONTAINER_NAME $IMAGE_NAME

# Deployment complete
echo "Deployment complete. Container has been upgraded."
