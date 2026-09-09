FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

RUN addgroup --system api && adduser --system --ingroup api api

COPY requirements.runtime.txt requirements.genomics.txt requirements.postgres.txt ./
RUN pip install --no-cache-dir -r requirements.runtime.txt -r requirements.genomics.txt -r requirements.postgres.txt

COPY app ./app
COPY data ./data

USER api

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
