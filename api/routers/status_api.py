from fastapi import APIRouter
import logging, datetime

status_app=APIRouter()

#http://127.0.0.1:8030/status donde num es un numero entero
@status_app.get("/status")
async def status():
    log_Path="./logs"
    log_filename = f'{log_Path}/%Y-%m-%d.log'
    logging.basicConfig(filename=datetime.datetime.now().strftime(log_filename), level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
    logger = logging.getLogger("mediaduration-api")
    logger.info(F"ON LINE")

    return 'ON LINE'