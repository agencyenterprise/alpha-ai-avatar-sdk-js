import {
  AvatarVideoConfig,
  AvatarVideoDimension,
  VideoPlayerLayer,
  VideoPlayerConfig,
} from './types';

const VALID_VIDEOS_EXT = ['mp4', 'webm', 'ogg', 'avi', 'mov'];
const VALID_IMAGES_EXT = ['jpg', 'jpeg', 'png', 'gif'];
const GREEN_SCALE_LOW: [number, number, number] = [0, 165, 0];
const GREEN_SCALE_HIGH: [number, number, number] = [180, 255, 180];

const DEFAULT_RESOLUTION = 512;

export class VideoPlayer {
  private readonly inputVideoElement: HTMLVideoElement;
  private readonly videoElement: HTMLVideoElement;

  private background?: string;
  private isVideo: boolean = false;
  private backgroundElement?: HTMLImageElement | HTMLVideoElement;
  private canvas?: HTMLCanvasElement;
  private canvasContext?: CanvasRenderingContext2D;

  private avatarConfig: AvatarVideoConfig = {
    videoX: 0,
    videoY: 0,
    videoWidth: 'auto',
    videoHeight: 'auto',
  };

  private _layers: VideoPlayerLayer[] = [];

  constructor(config: VideoPlayerConfig) {
    this.background = config.background;
    this.videoElement = config.videoElement;
    this.inputVideoElement = document.createElement('video');

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

    this.renderCanvas().then(() => {
      config.videoTrack?.attach(this.inputVideoElement);
    });
  }

  get layers() {
    return this._layers;
  }

  private async renderCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvasContext = this.canvas.getContext('2d', {
      willReadFrequently: true,
    })!;
    this.videoElement.srcObject = this.canvas.captureStream(30);
    this.videoElement.muted = true;
    this.videoElement.autoplay = true;

    await this.createBackgroundElement();

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

  private async createBackgroundElement() {
    if (!this.background) {
      return;
    }

    const fileType = await this.getURLFileType(this.background);

    if (fileType === 'video') {
      this.backgroundElement = document.createElement('video');
      this.backgroundElement.src = this.background;
      this.backgroundElement.loop = true;
      this.backgroundElement.muted = true;
      this.backgroundElement.autoplay = true;
      this.isVideo = true;

      this.backgroundElement.addEventListener('loadeddata', () => {
        (this.backgroundElement as HTMLVideoElement)?.play();
      });
    } else if (fileType === 'image') {
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
        layer.x || 0,
        layer.y || 0,
        layer.width,
        layer.height,
      );
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

  public async getURLFileType(url: string) {
    if (url.startsWith('data:')) {
      return url.includes('image') ? 'image' : 'video';
    }

    const response = await fetch(url, {
      method: 'HEAD',
    });

    const contentType = response.headers.get('content-type');
    const ext = contentType && contentType.split('/').pop();

    if (ext && VALID_VIDEOS_EXT.includes(ext)) {
      return 'video';
    }

    if (ext && VALID_IMAGES_EXT.includes(ext)) {
      return 'image';
    }

    throw new Error('Invalid content type');
  }

  public destroy() {
    this.inputVideoElement?.remove();
    this.backgroundElement?.remove();
    this.canvas?.remove();
    this._layers = [];
  }
}
