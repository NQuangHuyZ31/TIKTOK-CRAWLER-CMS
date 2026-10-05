import uvicorn

from config import SERVICE_HOST, SERVICE_PORT


if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host=SERVICE_HOST,
        port=SERVICE_PORT,
        reload=False,
    )