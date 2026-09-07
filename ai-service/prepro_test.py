# test_visual.py
import cv2
import os
from preprocessing import PreprocessingService

def test_on_file(image_path: str):
    if not os.path.exists(image_path):
        print(f"Error: File not found at {image_path}")
        return

    # 1. Load original image
    raw_img = cv2.imread(image_path)
    
    # 2. Run deskewing
    deskewed_img = PreprocessingService.deskew_image(raw_img)
    
    # 3. Run enhancement & binarization
    binarized_img = PreprocessingService.enhance_contrast_and_binarize(deskewed_img)

    # 4. Save intermediate outputs for inspection
    os.makedirs("test_outputs", exist_ok=True)
    cv2.imwrite("test_outputs/1_original-f.png", raw_img)
    cv2.imwrite("test_outputs/2_deskewed-f.png", deskewed_img)
    cv2.imwrite("test_outputs/3_binarized-f.png", binarized_img)

    print("Success: Processed images saved in 'test_outputs/' directory.")

if __name__ == "__main__":
    # Replace with path to a sample land record scan
    test_on_file("ai-service/skewed_img_1.png")