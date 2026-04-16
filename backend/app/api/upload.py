# 1. Nhớ import thêm Request
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
import shutil
import os
import uuid

router = APIRouter(prefix="/upload", tags=["Upload"])

os.makedirs("uploads", exist_ok=True)

# 2. Thêm request: Request vào hàm
@router.post("")
async def upload_image(request: Request, file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ upload file ảnh")

    file_extension = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"uploads/{file_name}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 3. THAY ĐỔI QUAN TRỌNG: Tự động lấy URL gốc của Server
    base_url = str(request.base_url) 
    # Nếu chạy ở dưới máy, nó tự hiểu là http://localhost:8000/
    # Nếu chạy trên Render, nó tự hiểu là https://vnnet.onrender.com/
    
    return {"url": f"{base_url}uploads/{file_name}"}