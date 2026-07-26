FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing bytecode and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=3004

# Copy dependencies list and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files and trained model
COPY . .

EXPOSE 3004

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3004"]
