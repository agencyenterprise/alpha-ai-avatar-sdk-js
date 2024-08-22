import { RemoteTrack } from 'livekit-client';

const VALID_VIDEOS_EXT = ['mp4', 'webm', 'ogg', 'avi', 'mov'];
const VALID_IMAGES_EXT = ['jpg', 'jpeg', 'png', 'gif'];
const GREEN_SCALE_LOW: [number, number, number] = [0, 165, 0];
const GREEN_SCALE_HIGH: [number, number, number] = [180, 255, 180];

const DEFAULT_RESOLUTION = 512;

export class VideoPlayer {
  private inputVideoElement: HTMLVideoElement;
  private outputVideoElement: HTMLVideoElement;

  private background?: string;
  private isVideo: boolean = false;
  private backgroundElement?: HTMLImageElement | HTMLVideoElement;
  private canvas?: HTMLCanvasElement;
  private canvasContext?: CanvasRenderingContext2D;

  constructor(
    outputVideoElement: HTMLVideoElement,
    videoTrack: RemoteTrack,
    background?: string,
  ) {
    this.background = background;
    this.outputVideoElement = outputVideoElement;
    this.inputVideoElement = this.background
      ? document.createElement('video')
      : outputVideoElement;

    videoTrack.attach(this.inputVideoElement);

    if (this.background) {
      /**
       * The browser only renders the video if it's attached to the DOM.
       */
      document.body.appendChild(this.inputVideoElement).style.visibility =
        'hidden';
      this.renderBackground();
    }
  }

  private renderBackground() {
    this.createBackgroundElement();

    if (!this.backgroundElement) {
      return;
    }

    this.canvas = document.createElement('canvas');
    this.canvasContext = this.canvas.getContext('2d', {
      willReadFrequently: true,
    })!;
    this.outputVideoElement.srcObject = this.canvas.captureStream(30);
    this.outputVideoElement.muted = true;
    this.outputVideoElement.autoplay = true;

    this.backgroundElement.addEventListener(
      this.isVideo ? 'loadeddata' : 'load',
      () => {
        if (this.isVideo) {
          (this.backgroundElement as HTMLVideoElement).play();
        }

        this.processFrame();
      },
    );
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

  private processFrame() {
    if (
      !this.inputVideoElement ||
      !this.canvas ||
      !this.canvasContext ||
      !this.backgroundElement
    ) {
      return;
    }

    const inputRect = this.inputVideoElement.getBoundingClientRect();

    const height = inputRect.height || DEFAULT_RESOLUTION;
    const width = inputRect.width || DEFAULT_RESOLUTION;

    this.canvas.height = height;
    this.canvas.width = width;

    this.canvasContext.drawImage(this.backgroundElement, 0, 0, width, height);

    const { data: bgData } = this.canvasContext.getImageData(
      0,
      0,
      width,
      height,
    );

    this.canvasContext.drawImage(this.inputVideoElement, 0, 0, width, height);

    const videoFrame = this.canvasContext.getImageData(0, 0, width, height);

    const videoData = videoFrame.data;

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

    this.canvasContext.putImageData(videoFrame, 0, 0);

    requestAnimationFrame(() => this.processFrame());
  }

  public destroy() {
    if (this.background) {
      this.inputVideoElement?.remove();
    }

    this.backgroundElement?.remove();
    this.canvas?.remove();
  }
}
