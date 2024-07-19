from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import io

app = FastAPI()

local_dir = "./blip-image-captioning-large"
processor = BlipProcessor.from_pretrained(local_dir)
model = BlipForConditionalGeneration.from_pretrained(local_dir)

def generate_caption(image: Image.Image) -> str:
    inputs = processor(image, return_tensors="pt")
    out = model.generate(**inputs)
    caption = processor.decode(out[0], skip_special_tokens=True)
    return caption

@app.post("/generate-caption/")
async def create_upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert('RGB')

    caption = generate_caption(image)

    return {"filename": file.filename, "caption": caption}

## 다른 모델과 합칠 때에는 서버에서 모델을 아용한 함수들을 통해 caption, motion 등의 정보를 받아서 프롬프트 처리까지 하고 나온 해설 코멘터리를
## post method로 to client (실제 보여지는 자막) 

# HTML Form
@app.get("/", response_class=HTMLResponse)
async def main():
    content = """
    <body>
    <h1>Image Captioning</h1>
    <form action="/generate-caption/" enctype="multipart/form-data" method="post">
    <input name="file" type="file">
    <input type="submit">
    </form>
    </body>
    """
    return content

'''
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''
