import cv2
import json

from preprocessing.grayscale import to_grayscale
from preprocessing.deskew import deskew
from preprocessing.image_processing import preprocess_for_ocr
from ocr.paddle_ocr import PaddleOCREngine


IMAGE_PATH = "ai-service/REGISTRATION_001_POOR_QUALITY_page-0001.jpg"
OUTPUT_PATH = "output.json"


def process_image(image_path: str):

    # 1. Load image
    image = cv2.imread(image_path)

    if image is None:
        raise FileNotFoundError(
            f"Could not load image: {image_path}"
        )

    # 2. Grayscale
    gray = to_grayscale(image)

    # 3. Deskew
    deskewed, angle = deskew(gray)

    print(f"Detected skew angle: {angle:.2f}°")

    # 4. OpenCV preprocessing
    processed = preprocess_for_ocr(
        deskewed,
        use_threshold=False
    )

    # 5. OCR
    ocr_engine = PaddleOCREngine(lang="hi")

    ocr_image = cv2.cvtColor(
    processed,
    cv2.COLOR_GRAY2BGR
)

    ocr_result = ocr_engine.extract_text(
    ocr_image
)

    # 6. JSON structure
    result = {
        "file": image_path,
        "deskew_angle": angle,
        "ocr": ocr_result
    }

    return result


if __name__ == "__main__":

    result = process_image(IMAGE_PATH)

    with open(
        OUTPUT_PATH,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            result,
            f,
            ensure_ascii=False,
            indent=2
        )

    print(f"OCR completed → {OUTPUT_PATH}")