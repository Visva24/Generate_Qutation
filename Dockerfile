# ----------- Build Stage -----------
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the project (if using TypeScript or a bundler)
RUN npm run build



# ----------- Production Stage -----------
FROM node:18-alpine AS production

WORKDIR /app

# Copy only what is needed for production
COPY package*.json ./
RUN npm install --omit=dev

# Copy built app from build stage
COPY --from=build /app/dist ./dist

# Copy Swagger static files (ensure this folder exists!)
COPY --from=build /app/swagger-static ./swagger-static

# Set environment variables (optional)
ENV NODE_ENV=production

# Expose port (adjust based on your app)
EXPOSE 3000

# Start the app
CMD ["node", "dist/main"]
