from fastapi import APIRouter, UploadFile, File, HTTPException
import cloudinary
import cloudinary.uploader

# KHAI BÁO CHÌA KHÓA CỦA EM VÀO ĐÂY
cloudinary.config(
    cloud_name="dmrfw1vw5",
    api_key="537557692366912",
    api_secret="KOEPZChTcB1T2BY4G5vzTHOlBiE"
)

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.post("")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ upload file ảnh")

    try:
        # Đọc dữ liệu ảnh trực tiếp từ Frontend gửi lên
        contents = await file.read()
        
        # Bắn thẳng dữ liệu lên mây Cloudinary
        result = cloudinary.uploader.upload(contents)
        
        # Cloudinary trả về một link vĩnh viễn (secure_url), ta lấy nó đưa cho Frontend
        return {"url": result.get("secure_url")}
        
    except Exception as e:
        print("Lỗi Cloudinary:", e)
        raise HTTPException(status_code=500, detail="Lỗi khi upload ảnh lên mây")