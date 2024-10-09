# Use Node.js base image
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json if available
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy everything from the current context that is needed for the server
# including the dist folder which should contain the compiled files
COPY ./dist ./dist

# Expose the necessary port
EXPOSE 8765

# Start the server
CMD ["node", "dist/ws-server/lib/server.js"]
