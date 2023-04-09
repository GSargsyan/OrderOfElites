FROM python:3
ENV PYTHONUNBUFFERED 1

WORKDIR /opt/backend/
COPY ./ ./

RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# RUN apt-get update && apt-get install -y uwsgi uwsgi-plugin-python3

EXPOSE 8000
