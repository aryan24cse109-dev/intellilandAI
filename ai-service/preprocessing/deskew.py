import cv2
import numpy as np
import math


def _get_skew_angle(binary: np.ndarray) -> float:
    """
    Estimate document skew using Hough lines.

    The input should be a binary image where text/lines are white
    and background is black.
    """

    edges = cv2.Canny(binary, 50, 150)

    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=100,
        minLineLength=100,
        maxLineGap=20
    )

    if lines is None:
        return 0.0

    angles = []

    for line in lines:
        x1, y1, x2, y2 = line[0]

        angle = math.degrees(
            math.atan2(
                y2 - y1,
                x2 - x1
            )
        )

        # We only care about nearly-horizontal lines.
        if -20 <= angle <= 20:
            angles.append(angle)

    if not angles:
        return 0.0

    return float(np.median(angles))


def rotate_image(
    image: np.ndarray,
    angle: float
) -> np.ndarray:
    """
    Rotate image around its center while preserving dimensions.
    """

    height, width = image.shape[:2]

    center = (width // 2, height // 2)

    matrix = cv2.getRotationMatrix2D(
        center,
        angle,
        1.0
    )

    rotated = cv2.warpAffine(
        image,
        matrix,
        (width, height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE
    )

    return rotated


def deskew(image: np.ndarray):
    """
    Detect skew from a temporary processed image and rotate
    the original image.

    Returns:
        deskewed_image, detected_angle
    """

    if image is None:
        raise ValueError("Input image is None")

    # Create temporary grayscale image
    if len(image.shape) == 3:
        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY
        )
    else:
        gray = image.copy()

    # Slight blur reduces small document noise
    blur = cv2.GaussianBlur(
        gray,
        (5, 5),
        0
    )

    # Temporary binary image ONLY for angle detection
    binary = cv2.threshold(
        blur,
        0,
        255,
        cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )[1]

    # Remove tiny noise
    kernel = cv2.getStructuringElement(
        cv2.MORPH_RECT,
        (3, 3)
    )

    binary = cv2.morphologyEx(
        binary,
        cv2.MORPH_OPEN,
        kernel
    )

    angle = _get_skew_angle(binary)

    # Rotate the original image, NOT the binary image
    deskewed = rotate_image(
        image,
        angle
    )

    return deskewed, angle