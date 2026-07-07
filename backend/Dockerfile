FROM python:3.11-slim
ENV PYTHONUNBUFFERED 1

WORKDIR /opt/backend/

# Copy requirements first for better layer caching
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY ./ ./

# RUN apt-get update && apt-get install -y uwsgi uwsgi-plugin-python3

EXPOSE 8000
