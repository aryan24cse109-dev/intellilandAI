from paddleocr import PaddleOCR
import numpy as np


class PaddleOCREngine:

    def __init__(self, lang="hi"):

        self.ocr = PaddleOCR(
            lang=lang
        )

    def extract_text(
        self,
        image: np.ndarray
    ) -> list:

        if image is None:
            raise ValueError("Input image is None")

        result = self.ocr.predict(image)

        extracted = []

        for page_result in result:

            data = page_result.json

            if callable(data):
                data = data()

            if isinstance(data, dict):
                extracted.append(data)
            else:
                extracted.append({
                    "result": data
                })

        return extracted