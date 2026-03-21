declare module "gifler" {
  import type { GifReader, Frame } from "omggif";

  interface FrameWithPixels extends Frame {
    pixels: Uint8ClampedArray;
  }

  export class Animator {
    constructor(reader: GifReader, frames: FrameWithPixels[]);
    start(): Animator;
    stop(): Animator;
    animateInCanvas(canvas: HTMLCanvasElement, setDimensions?: boolean): Animator;
    running(): boolean;
    reset(): Animator;
  }

  export class Decoder {
    static decodeFramesSync(reader: GifReader): FrameWithPixels[];
  }

  interface GifHandle {
    animate(selector: string | HTMLCanvasElement): Promise<Animator>;
  }

  export class Gif {
    constructor(dataPromise: Promise<ArrayBuffer>);
    animate(selector: string | HTMLCanvasElement): Promise<Animator>;
  }

  function gifler(url: string): GifHandle;

  export = gifler;
}
