from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid

router = APIRouter(prefix="/upload", tags=["Upload"])

# Đảm bảo thư mục uploads luôn tồn tại
os.makedirs("uploads", exist_ok=True)

@router.post("/")
async def upload_image(file: UploadFile = File(...)):
    # 1. Kiểm tra xem có đúng là ảnh không
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ upload file ảnh (jpg, png, jpeg...)")

    # 2. Đổi tên file ngẫu nhiên để tránh bị trùng tên đè lên nhau
    file_extension = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"uploads/{file_name}"

    # 3. Lưu file vào ổ cứng
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 4. Trả về link để Frontend gán vào <img src="...">
    # LƯU Ý: Nếu chạy trên Render, đổi localhost thành link Render của em
    return {"url": f"https://vnnet.onrender.com/uploads/{file_name}"}