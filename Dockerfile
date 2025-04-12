# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install
RUN npm install puppeteer@latest  # Ensure Puppeteer is installed

# Copy project files
COPY . .

# Set environment variables
ENV PORT=5001

# Expose the correct port
EXPOSE 5001

# Start the application on port 5001
CMD ["npm", "run", "start:dev"]
