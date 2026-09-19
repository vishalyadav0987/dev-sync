from PIL import Image

def get_crop_box(img_path):
    img = Image.open(img_path).convert("RGB")
    width, height = img.size
    
    # We will just guess a good center crop that cuts out the dark padding
    # Let's say we keep 80% of the center.
    margin = int(width * 0.12) # 12% on each side = 76% kept
    box = (margin, margin, width - margin, height - margin)
    
    return box

print(get_crop_box("/Users/vishalyadav/.gemini/antigravity-ide/brain/f4413a72-eaf1-413c-8093-a7e52f795769/devportfolio_icon_circle_1789824493176.jpg"))
