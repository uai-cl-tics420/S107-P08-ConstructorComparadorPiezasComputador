FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the scraper scripts
COPY . .

# Run the script immediately, then wait and run it again in a loop
# Default interval is 86400 seconds (24 hours). 
# You can override this in docker-compose.yml
CMD sh -c "while true; do python fetch_data.py; echo \"Next update in ${UPDATE_INTERVAL:-86400} seconds...\"; sleep ${UPDATE_INTERVAL:-86400}; done"