import {
  AvatarVideoConfig,
  AvatarVideoDimension,
  VideoPlayerConfig,
} from './types';

const VALID_VIDEOS_EXT = ['mp4', 'webm', 'ogg', 'avi', 'mov'];
const VALID_IMAGES_EXT = ['jpg', 'jpeg', 'png', 'gif'];
const GREEN_SCALE_LOW: [number, number, number] = [0, 165, 0];
const GREEN_SCALE_HIGH: [number, number, number] = [180, 255, 180];

const DEFAULT_RESOLUTION = 512;

export class VideoPlayer {
  private inputVideoElement: HTMLVideoElement;
  private videoElement: HTMLVideoElement;

  private background?: string;
  private isVideo: boolean = false;
  private backgroundElement?: HTMLImageElement | HTMLVideoElement;
  private canvas?: HTMLCanvasElement;
  private canvasContext?: CanvasRenderingContext2D;

  private avatarVideoConfig: AvatarVideoConfig = {
    videoX: 0,
    videoY: 0,
    videoWidth: 'auto',
    videoHeight: 'auto',
  };

  constructor(config: VideoPlayerConfig) {
    this.background = config.background;
    this.videoElement = config.videoElement;
    this.inputVideoElement = document.createElement('video');

    if (config.avatarVideoConfig) {
      this.avatarVideoConfig = config.avatarVideoConfig;
    }

    config.videoTrack?.attach(this.inputVideoElement);
    /**
     * The browser only renders the video if it's attached to the DOM.
     */
    document.body.appendChild(this.inputVideoElement).style.visibility =
      'hidden';

    this.renderCanvas();
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
  }

  private createBackgroundElement() {
    if (!this.background) {
      return this.processVideoFrame();
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

    this.backgroundElement.addEventListener(
      this.isVideo ? 'loadeddata' : 'load',
      () => {
        if (this.isVideo) {
          (this.backgroundElement as HTMLVideoElement).play();
        }

        this.processVideoFrame();
      },
    );
  }

  private processVideoFrame() {
    if (!this.inputVideoElement || !this.canvas || !this.canvasContext) {
      return;
    }

    const inputRect = this.inputVideoElement.getBoundingClientRect();

    const height = inputRect.height || DEFAULT_RESOLUTION;
    const width = inputRect.width || DEFAULT_RESOLUTION;

    this.canvas.height = height;
    this.canvas.width = width;

    let bgData = null;

    if (this.backgroundElement) {
      this.canvasContext.drawImage(this.backgroundElement, 0, 0, width, height);

      const { data } = this.canvasContext.getImageData(0, 0, width, height);

      bgData = data;
    }

    const videoHeight =
      this.avatarVideoConfig.videoHeight === 'auto'
        ? height
        : this.avatarVideoConfig.videoHeight;
    const videoWidth =
      this.avatarVideoConfig.videoWidth === 'auto'
        ? width
        : this.avatarVideoConfig.videoWidth;

    this.canvasContext.drawImage(
      this.inputVideoElement,
      this.avatarVideoConfig.videoX,
      this.avatarVideoConfig.videoY,
      videoWidth,
      videoHeight,
    );

    const videoFrame = this.canvasContext.getImageData(
      0,
      0,
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

    this.canvasContext.putImageData(videoFrame, 0, 0);

    requestAnimationFrame(() => this.processVideoFrame());
  }

  public setVideoDimensions(
    width: AvatarVideoDimension,
    height: AvatarVideoDimension,
  ) {
    this.avatarVideoConfig.videoWidth = width;
    this.avatarVideoConfig.videoHeight = height;
  }

  public setVideoPosition(x: number, y: number) {
    this.avatarVideoConfig.videoX = x;
    this.avatarVideoConfig.videoY = y;
  }

  public setBackground(background: string) {
    this.background = background;
    this.createBackgroundElement();
  }

  public removeBackground() {
    this.backgroundElement?.remove();
    this.backgroundElement = undefined;
  }

  public destroy() {
    if (this.background) {
      this.inputVideoElement?.remove();
    }

    this.backgroundElement?.remove();
    this.canvas?.remove();
  }
}
