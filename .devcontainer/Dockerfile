FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install Java (required for Firebase Emulators)
RUN apt-get update && apt-get install -y default-jre

# Install Firebase CLI globally
RUN npm install -g firebase-tools

# Expose ports for Node/Vite and Firebase Local Emulator Suite
EXPOSE 3000 4000 5000 5001 8080 8085 9000 9099 9199 9150 4500 4400

# Default workspace directory
WORKDIR /workspace
