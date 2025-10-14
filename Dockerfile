# Use an official lightweight Python image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app
COPY . .

# Expose the port Flask runs on
EXPOSE 5000

# Command to run the app
CMD ["python", "app.py"]
