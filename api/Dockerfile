FROM python:3.11

WORKDIR /app

COPY . /app

RUN pip install -r requirements.txt
RUN cp /usr/share/zoneinfo/America/Bogota /etc/localtime

CMD ["uvicorn", "apimain:app", "--port=8030", "--host=0.0.0.0"]