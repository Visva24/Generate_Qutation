# Use official Node.js image
FROM node:18 as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the app
RUN npm run build

# === Final image ===
FROM node:18

# Set working directory
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy built app from previous stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

# If using Swagger static docs or assets
COPY --from=build /app/swagger-static ./swagger-static

# Environment Variables
ENV NODE_ENV=production
ENV PORT=5001

# Expose port
EXPOSE 5001

# Start app (adjust for your setup)
CMD ["node", "dist/main"]
