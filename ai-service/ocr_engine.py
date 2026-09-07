# app/services/ocr_engine.py
from paddleocr import PPStructureV3, PaddleOCR
import numpy as np
import cv2
class LandRecordOCREngine:
    def __init__(self):
        # PP-Structure handles layout analysis and table recovery
        self.table_engine = PPStructureV3(
            show_log=False, 
            table=True, 
            ocr=True, 
            lang='hi' # Supports Indic scripts
        )
        # Dedicated OCR engine for non-tabular header/stamp regions
        self.ocr_engine = PaddleOCR(
            use_angle_cls=True, 
            lang='hi', 
            show_log=False
        )

    def extract_layout_and_text(self, img: np.ndarray):
        results = self.table_engine(img)
        structured_blocks = []

        for region in results:
            block_type = region['type']
            bbox = region['bbox']
            
            if block_type == 'table':
                # Returns HTML representation and structured cell bounding boxes
                structured_blocks.append({
                    "type": "table",
                    "bbox": bbox,
                    "html": region['res']['html'],
                    "cell_boxes": region['res']['cell_bbox']
                })
            elif block_type == 'text':
                text_lines = [line['text'] for line in region['res']]
                confidences = [line['confidence'] for line in region['res']]
                structured_blocks.append({
                    "type": "text",
                    "bbox": bbox,
                    "content": " ".join(text_lines),
                    "avg_confidence": float(np.mean(confidences)) if confidences else 0.0
                })

        return structured_blocks

new_img = LandRecordOCREngine()
new_img.extract_layout_and_text(cv2.imread('sample-data/documents/handwritten/HANDWRITTEN_001.pdf'))