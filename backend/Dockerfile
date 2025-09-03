FROM node:18-alpine

WORKDIR /BabyLeague

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start the application in development mode
CMD ["npm", "run", "dev"]