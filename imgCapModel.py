from transformers import BlipProcessor, BlipForConditionalGeneration, pipeline, BlipModel
from PIL import Image
# Load model directly
#from transformers import AutoProcessor, AutoModelForSeq2SeqLM


# Download Model from huggingface
'''
model_name = "Salesforce/blip-image-captioning-large"
save_dir = "./blip-image-captioning-large"

processor = BlipProcessor.from_pretrained(model_name)
processor.save_pretrained(save_dir)
model = BlipForConditionalGeneration.from_pretrained(model_name)
model.save_pretrained(save_dir)
'''

# using pipeline (optional)
'''
from transformers import pipeline

captioner = pipeline("image-to-text", model="Salesforce/blip-image-captioning-large")
capt = captioner("./KakaoTalk_20240703_172652377_08.jpg")[0]['generated_text']
print(capt)
'''

# LOAD MODEL FROM LOCAL DIRECTORY PATH

# local directory path (model path)
local_directory = "./blip-image-captioning-large"

# load processor and model from local directory
processor = BlipProcessor.from_pretrained(local_directory)
model = BlipForConditionalGeneration.from_pretrained(local_directory)


'''
# load image
image_path = "./KakaoTalk_20240703_172652377_05.jpg"
image = Image.open(image_path).convert('RGB')

inputs = processor(image, return_tensors="pt")

out = model.generate(**inputs)
#print(processor.decode(out[0], skip_special_tokens=True))
capt = processor.decode(out[0], skip_special_tokens=True)
print(capt)
'''
# caption generating code
#result = captioner(image)[0]['generated_text']
#print("Generated Caption:", result)


# generate_caption function
def generate_caption(image_path):
    image = Image.open(image_path).convert('RGB')

    inputs = processor(image, return_tensors="pt")

    out = model.generate(**inputs)

    caption = processor.decode(out[0], skip_special_tokens=True)

    return caption

# testing section (caption generating)
img1 = "./KakaoTalk_20240703_172652377_05.jpg"
capt1 = generate_caption(img1)
print(capt1)

img2 = "./KakaoTalk_20240703_172652377_07.jpg"
capt2 = generate_caption(img2)
print(capt2)

img3 = "./KakaoTalk_20240703_172652377_08.jpg"
capt3 = generate_caption(img3)
print(capt3)