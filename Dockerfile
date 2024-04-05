# Use an official Node runtime as the parent image
FROM node:14-slim

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Bundle app source inside the Docker image
COPY . .

# Make sure any needed port is exposed
EXPOSE 3000

# Run the app when the container launches
CMD ["npm", "start"]
