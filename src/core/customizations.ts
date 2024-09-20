import { Landmarks } from './types';

export function drawGlasses(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmarks,
  image: HTMLImageElement,
) {
  const leftEye = landmarks[133];
  const rightEye = landmarks[362];
  const noseTop = landmarks[6];

  if (!leftEye || !rightEye || !noseTop) return;

  const eyeDistance = Math.hypot(
    rightEye.x - leftEye.x,
    rightEye.y - leftEye.y,
  );
  const glassesWidth = eyeDistance * 3.8;
  const glassesHeight = glassesWidth * (image.height / image.width);
  const glassesX = leftEye.x - glassesWidth * 0.25;
  const glassesY = noseTop.y - glassesHeight * 0.5;

  ctx.drawImage(image, glassesX - 27, glassesY, glassesWidth, glassesHeight);
}

export function drawHat(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmarks,
  image: HTMLImageElement,
) {
  const topOfHead = landmarks[10];
  const leftSideOfHead = landmarks[234];
  const rightSideOfHead = landmarks[454];

  if (!topOfHead || !leftSideOfHead || !rightSideOfHead) return;

  const headWidth = Math.abs(rightSideOfHead.x - leftSideOfHead.x);
  const hatWidth = headWidth * 1.4;
  const hatHeight = hatWidth * (image.height / image.width);
  const hatX = topOfHead.x - hatWidth / 2;
  const hatY = topOfHead.y - hatHeight * 0.88;

  ctx.drawImage(image, hatX, hatY, hatWidth, hatHeight);
}

export function drawMustache(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmarks,
  image: HTMLImageElement,
) {
  const noseBottom = landmarks[2];
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];

  if (!noseBottom || !leftMouth || !rightMouth) return;

  const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
  const mustacheWidth = mouthWidth * 2.3;
  const mustacheHeight = mustacheWidth * (image.height / image.width);
  const mustacheX = noseBottom.x - mustacheWidth / 2;
  const mustacheY = noseBottom.y;

  ctx.drawImage(image, mustacheX, mustacheY, mustacheWidth, mustacheHeight);
}
