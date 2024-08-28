import {
  AvatarVideoConfig,
  AvatarVideoDimension,
  VideoPlayerLayer,
  VideoPlayerConfig,
  AvatarFilter,
} from './types';

import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision';
import { NormalizedLandmark } from '@mediapipe/face_mesh';

const VALID_VIDEOS_EXT = ['mp4', 'webm', 'ogg', 'avi', 'mov'];
const VALID_IMAGES_EXT = ['jpg', 'jpeg', 'png', 'gif'];
const GREEN_SCALE_LOW: [number, number, number] = [0, 165, 0];
const GREEN_SCALE_HIGH: [number, number, number] = [180, 255, 180];

const DEFAULT_RESOLUTION = 512;

const FACE_DATA_BUFFER_SIZE = 5;
const DAMPING_FACTOR = 0.7;

export class VideoPlayer {
  private inputVideoElement: HTMLVideoElement;
  private videoElement: HTMLVideoElement;

  private background?: string;
  private isVideo: boolean = false;
  private backgroundElement?: HTMLImageElement | HTMLVideoElement;
  private canvas?: HTMLCanvasElement;
  private canvasContext?: CanvasRenderingContext2D;

  // private faceDetector: faceLandmarksDetection.FaceLandmarksDetector | null =
  //   null;
  private faceDataBuffer: NormalizedLandmark[] = [];
  // private lastSmoothFaceData: NormalizedLandmark | null = null;
  // private smoothFaceData: NormalizedLandmark | null = null;

  private avatarConfig: AvatarVideoConfig = {
    videoX: 0,
    videoY: 0,
    videoWidth: 'auto',
    videoHeight: 'auto',
  };

  private _layers: VideoPlayerLayer[] = [];
  private _filters: AvatarFilter[] = [];
  private filterImages: Record<string, HTMLImageElement> = {};

  constructor(config: VideoPlayerConfig) {
    this.background = config.background;
    this.videoElement = config.videoElement;
    this.inputVideoElement = document.createElement('video');
    this._filters = config.filters || [];

    if (config.layers) {
      for (let i = 0; i < config.layers.length; i++) {
        this.addLayer(config.layers[i]!);
      }
    }

    if (config.avatarConfig) {
      this.avatarConfig = config.avatarConfig;
    }

    /**
     * The browser only renders the video if it's attached to the DOM.
     */
    document.body.appendChild(this.inputVideoElement).style.visibility =
      'hidden';

    this.renderCanvas();

    config.videoTrack?.attach(this.inputVideoElement);

    if (this._filters.length > 0) {
      this.loadFilters().then(() => {
        this.initFaceFilters();
      });
    }
  }

  get layers() {
    return this._layers;
  }

  get filters() {
    return this._filters;
  }

  private async initFaceFilters() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    );
    const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      numFaces: 1,
    });

    if (this.inputVideoElement) {
      const detect = () => {
        let startTimeMs = performance.now();
        const result = faceLandmarker.detectForVideo(
          this.inputVideoElement,
          startTimeMs,
        );

        if (result.faceLandmarks && result.faceLandmarks.length) {
          this.faceDataBuffer = result.faceLandmarks[0]!;
        }

        requestAnimationFrame(detect);
      };

      requestAnimationFrame(detect);
    }

    // console.log('faceLandmarker', faceLandmarker.detectForVideo);
  }

  // private async detectFaceLandmarks() {
  //   console.log('detecting face landmarks', faceDetector);
  //   if (
  //     this.inputVideoElement.readyState ===
  //     this.inputVideoElement.HAVE_ENOUGH_DATA
  //   ) {
  //     const faces = await faceDetector?.estimateFaces(this.inputVideoElement!, {
  //       flipHorizontal: false,
  //     });

  //     console.log('faces', faces);

  //     if (faces!.length > 0) {
  //       console.log('face detected');
  //       this.faceDataBuffer.push(faces?.[0]!);
  //       if (this.faceDataBuffer.length > FACE_DATA_BUFFER_SIZE) {
  //         this.faceDataBuffer.shift();
  //       }
  //       this.calculateSmoothFaceData();
  //     }
  //   }
  //   requestAnimationFrame(() => this.detectFaceLandmarks());
  // }

  // private calculateSmoothFaceData() {
  //   if (!this.faceDataBuffer || this.faceDataBuffer.length === 0) return;

  //   // const avgFaceData: NormalizedLandmark[][] = this.faceDataBuffer.map(() => ({
  //   //   x: 0,
  //   //   y: 0
  //   // }))

  //   // const avgFaceData: faceLandmarksDetection.Face = {
  //   //   ...this.faceDataBuffer[0]!,
  //   //   keypoints: this.faceDataBuffer[0]!.keypoints.map(() => ({
  //   //     x: 0,
  //   //     y: 0,
  //   //   })),
  //   // };

  //   // this.faceDataBuffer.forEach((face) => {
  //   //   face.keypoints.forEach((keypoint, i) => {
  //   //     avgFaceData.keypoints[i]!.x += keypoint.x / FACE_DATA_BUFFER_SIZE;
  //   //     avgFaceData.keypoints[i]!.y += keypoint.y / FACE_DATA_BUFFER_SIZE;
  //   //   });
  //   // });

  //   // if (this.lastSmoothFaceData) {
  //   //   avgFaceData.keypoints = avgFaceData.keypoints.map((keypoint, i) => ({
  //   //     x: this.lerp(
  //   //       this.lastSmoothFaceData!.keypoints[i]!.x,
  //   //       keypoint.x,
  //   //       1 - DAMPING_FACTOR,
  //   //     ),
  //   //     y: this.lerp(
  //   //       this.lastSmoothFaceData!.keypoints[i]!.y,
  //   //       keypoint.y,
  //   //       1 - DAMPING_FACTOR,
  //   //     ),
  //   //   }));
  //   // }

  //   // this.lastSmoothFaceData = avgFaceData;
  //   // this.smoothFaceData = avgFaceData;

  //   // requestAnimationFrame(() => this.calculateSmoothFaceData());
  //   // animationFrameRef.current = requestAnimationFrame(calculateSmoothFaceData);
  // }

  // private lerp(start: number, end: number, t: number) {
  //   return start * (1 - t) + end * t;
  // }

  private async loadFilters() {
    const imageUrls = {
      leftEar: 'https://i.imgur.com/YhIFoNP.png',
      rightEar: 'https://i.imgur.com/PwGXI2n.png',
      nose: 'https://i.imgur.com/cdmSFKp.png',
      glasses: 'https://i.imgur.com/XRKUJ3y.png',
    };

    const loadedImages: Record<string, HTMLImageElement> = {};
    for (const [key, url] of Object.entries(imageUrls)) {
      const img = new Image();
      img.src = url;
      img.crossOrigin = 'anonymous';
      await new Promise((resolve) => (img.onload = resolve));
      loadedImages[key] = img;
    }

    this.filterImages = loadedImages;
  }

  private renderCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvasContext = this.canvas.getContext('2d', {
      willReadFrequently: true,
    })!;
    this.videoElement.srcObject = this.canvas.captureStream(30);
    this.videoElement.muted = true;
    this.videoElement.autoplay = true;

    this.createBackgroundElement();

    if (this.backgroundElement) {
      this.backgroundElement.addEventListener(
        this.isVideo ? 'loadeddata' : 'load',
        () => {
          if (this.isVideo) {
            (this.backgroundElement as HTMLVideoElement).play();
          }

          this.processVideoFrame();
        },
      );
    } else {
      this.processVideoFrame();
    }
  }

  private createBackgroundElement() {
    if (!this.background) {
      return;
    }

    const extension = this.background.split('.').pop();

    if (VALID_VIDEOS_EXT.includes(extension!)) {
      this.backgroundElement = document.createElement('video');
      this.backgroundElement.src = this.background;
      this.backgroundElement.loop = true;
      this.backgroundElement.muted = true;
      this.backgroundElement.autoplay = true;
      this.isVideo = true;
    } else if (VALID_IMAGES_EXT.includes(extension!)) {
      this.backgroundElement = new Image();
      this.backgroundElement.crossOrigin = 'anonymous';
      this.backgroundElement.src = this.background;
    } else {
      throw new Error('Invalid background file');
    }
  }

  private processVideoFrame() {
    if (!this.inputVideoElement || !this.canvas || !this.canvasContext) {
      return;
    }

    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const inputRect = this.inputVideoElement.getBoundingClientRect();

    const height = inputRect.height || DEFAULT_RESOLUTION;
    const width = inputRect.width || DEFAULT_RESOLUTION;

    const videoHeight =
      this.avatarConfig.videoHeight === 'auto'
        ? height
        : this.avatarConfig.videoHeight;
    const videoWidth =
      this.avatarConfig.videoWidth === 'auto'
        ? width
        : this.avatarConfig.videoWidth;

    this.canvas.height = height;
    this.canvas.width = width;

    let bgData = null;

    if (this.backgroundElement) {
      this.canvasContext.drawImage(this.backgroundElement, 0, 0, width, height);

      const { data } = this.canvasContext.getImageData(
        this.avatarConfig.videoX,
        this.avatarConfig.videoY,
        videoWidth,
        videoHeight,
      );

      bgData = data;
    }

    this.canvasContext.drawImage(
      this.inputVideoElement,
      this.avatarConfig.videoX,
      this.avatarConfig.videoY,
      videoWidth,
      videoHeight,
    );

    const videoFrame = this.canvasContext.getImageData(
      this.avatarConfig.videoX,
      this.avatarConfig.videoY,
      videoWidth,
      videoHeight,
    );

    const videoData = videoFrame.data;

    if (bgData) {
      for (let i = 0; i < videoData.length; i += 4) {
        const r = videoData[i]!;
        const g = videoData[i + 1]!;
        const b = videoData[i + 2]!;

        if (
          r >= GREEN_SCALE_LOW[0] &&
          r <= GREEN_SCALE_HIGH[0] &&
          g >= GREEN_SCALE_LOW[1] &&
          g <= GREEN_SCALE_HIGH[1] &&
          b >= GREEN_SCALE_LOW[2] &&
          b <= GREEN_SCALE_HIGH[2]
        ) {
          videoData[i] = bgData[i]!;

          videoData[i + 1] = bgData[i + 1]!;
          videoData[i + 2] = bgData[i + 2]!;
          videoData[i + 3] = bgData[i + 3]!;
        }
      }
    }

    this.canvasContext.putImageData(
      videoFrame,
      this.avatarConfig.videoX,
      this.avatarConfig.videoY,
    );

    for (let i = 0; i < this._layers.length; i++) {
      const layer = this._layers[i]!;

      this.canvasContext.drawImage(
        layer.element,
        layer.x,
        layer.y,
        layer.width,
        layer.height,
      );
    }

    if (this.faceDataBuffer.length) {
      /**
       * Dog filter
       */
      const drawingUtils = new DrawingUtils(this.canvasContext);

      const landmarks = this.faceDataBuffer as any;
      
      console.log(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE)

      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: '#C0C0C070', lineWidth: 1 },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: '#FF3030' },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: '#FF3030' },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: '#30FF30' },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: '#30FF30' },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: '#E0E0E0' },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        {
          color: '#E0E0E0',
        },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: '#FF3030' },
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: '#30FF30' },
      );
      // const { leftEar, rightEar, nose } = this.filterImages;
      // const leftEye = this.faceDataBuffer[159]!;
      // const rightEye = this.faceDataBuffer[386]!;
      // const topHead = this.faceDataBuffer[10]!;
      // const nosePoint = this.faceDataBuffer[1]!;

      // // this.canvasContext.drawImage(leftEar!, 0, 0, 256, 256);

      // const eyeDistance = Math.hypot(
      //   rightEye.x - leftEye.x,
      //   rightEye.y - leftEye.y,
      // );

      // const earSize = eyeDistance;
      // const earY = topHead.y - earSize;
      // // const noseSize = eyeDistance * 1.2;

      // console.log('lefteye', leftEye.x, leftEye.y);
      // console.log('earSize', earSize);
      // console.log('earY', earY);

      // this.canvasContext.drawImage(
      //   leftEar!,
      //   leftEye.x,
      //   leftEye.y,
      //   60,
      //   60,
      //   // earY,
      //   // earSize,
      //   // earSize,
      // );

      // this.canvasContext.drawImage(
      //   rightEar!,
      //   rightEye.x - earSize + 130,
      //   earY,
      //   earSize,
      //   earSize,
      // );
      // this.canvasContext.drawImage(
      //   nose!,
      //   nosePoint.x - 15 - noseSize / 2,
      //   nosePoint.y - noseSize / 2,
      //   noseSize + 30,
      //   noseSize,
      // );
    }

    requestAnimationFrame(() => this.processVideoFrame());
  }

  public setAvatarDimensions(
    width: AvatarVideoDimension,
    height: AvatarVideoDimension,
  ) {
    if (width === 0 || height === 0) {
      throw new Error(
        'Invalid avatar dimensions, width and height must be bigger than 0',
      );
    }

    this.avatarConfig.videoWidth = width;
    this.avatarConfig.videoHeight = height;
  }

  public setAvatarPosition(x: number, y: number) {
    this.avatarConfig.videoX = x;
    this.avatarConfig.videoY = y;
  }

  public setBackground(background: string) {
    this.background = background;
    this.createBackgroundElement();
  }

  public addLayer(layer: VideoPlayerLayer) {
    if (layer.element instanceof HTMLImageElement) {
      layer.element.crossOrigin = 'anonymous';
    }

    this._layers.push(layer);
  }

  public updateLayer(index: number, layer: VideoPlayerLayer) {
    this._layers[index] = layer;
  }

  public removeLayer(index: number) {
    this._layers.splice(index, 1);
  }

  public removeBackground() {
    this.backgroundElement?.remove();
    this.backgroundElement = undefined;
  }

  public destroy() {
    this.inputVideoElement?.remove();
    this.backgroundElement?.remove();
    this.canvas?.remove();
    this._layers = [];
  }
}
