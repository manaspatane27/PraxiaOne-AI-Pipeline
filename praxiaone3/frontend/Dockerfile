# PraxiaOne Frontend Dockerfile
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all the remaining Next.js source code into the container
COPY . .

# Build the optimal production bundle
RUN npm run build

# Expose the standard Next.js port
EXPOSE 3000

# Start the production Next.js server
CMD ["npm", "start"]
