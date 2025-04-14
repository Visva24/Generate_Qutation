# ----------- Build Stage -----------
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# OPTIONAL: Copy Swagger static folder if it exists
COPY ./swagger-static ./swagger-static

# Build the project (assumes NestJS or TypeScript project)
RUN npm run build


# ----------- Production Stage -----------
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy only necessary files from build stage
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled source code
COPY --from=build /app/dist ./dist

# Copy Swagger static assets if present
COPY --from=build /app/swagger-static ./swagger-static

# Set environment (optional)
ENV NODE_ENV=production

# Expose backend port
EXPOSE 5001

# Run the backend app
CMD ["node", "dist/main"]
