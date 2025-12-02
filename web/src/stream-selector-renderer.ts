import { Stream } from './m3u-parser';
import { TextAtlas } from './text-atlas';

export class StreamSelectorRenderer {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private canvas: HTMLCanvasElement;

  private computePipeline: GPUComputePipeline | null = null;
  private renderPipeline: GPURenderPipeline | null = null;

  private streamBuffer: GPUBuffer | null = null;
  private positionBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;

  private bindGroupCompute: GPUBindGroup | null = null;
  private bindGroupRender: GPUBindGroup | null = null;

  private textAtlas: TextAtlas;
  private streams: Stream[] = [];

  private scrollY = 0;
  private targetScrollY = 0;
  private itemHeight = 40;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.textAtlas = new TextAtlas();

    const observer = new ResizeObserver(() => this.resize());
    observer.observe(canvas);

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetScrollY += e.deltaY;
      this.targetScrollY = Math.max(0, Math.min(this.targetScrollY, this.getContentHeight() - this.canvas.height));
    }, { passive: false });
  }

  private getContentHeight(): number {
    return this.streams.length * this.itemHeight;
  }

  async init(): Promise<void> {
    if (!navigator.gpu) throw new Error('WebGPU not supported');
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('No GPU adapter');
    this.device = await adapter.requestDevice();

    this.context = this.canvas.getContext('webgpu');
    if (!this.context) throw new Error('No WebGPU context');

    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'premultiplied'
    });

    await this.textAtlas.loadFlags(this.device);
    await this.createPipelines();
    this.startLoop();
  }

  private async createPipelines() {
    if (!this.device) return;

    const computeShader = `
      struct StreamInfo {
        atlasIndex: f32,
        flagIndex: f32,
      }
      // ... (rest of compute shader is the same)
    `;

    const renderShader = `
      // ... (uniforms and structs)
      @group(0) @binding(5) var flagTexture: texture_2d<f32>;

      // ... (vertex shader is the same)

      @fragment
      fn fs_main(in: VertexOutput) -> @location(0) vec4f {
        let atlasHeight = 4096.0;
        let itemHeight = 40.0;
        let row = in.atlasIndex;
        let v = (row * itemHeight + in.uv.y * itemHeight) / atlasHeight;
        let textCol = textureSample(textTexture, textSampler, vec2f(in.uv.x, v));

        // Flag rendering
        let flagWidth = 30.0;
        let flagHeight = 20.0;
        let flagPadding = 10.0;
        
        var finalColor = vec4f(0.1, 0.1, 0.15, 1.0); // bg

        if (in.uv.x * 800.0 < flagWidth + flagPadding && in.uv.x * 800.0 > flagPadding) {
            let flagUV = vec2f(
                (in.uv.x * 800.0 - flagPadding) / flagWidth,
                in.uv.y
            );
            if (flagUV.x > 0.0 && flagUV.x < 1.0 && flagUV.y > 0.0 && flagUV.y < 1.0) {
                 let flagIndex = streams[u32(in.atlasIndex)].flagIndex;
                 let flagV = (flagIndex * flagHeight + flagUV.y * flagHeight) / 2048.0; // Assuming flag atlas height
                 finalColor = textureSample(flagTexture, textSampler, vec2f(flagUV.x, flagV));
            }
        }
        
        // Blend text over
        return mix(finalColor, vec4f(1.0), textCol.a);
      }
    `;
    // Pipelines creation logic...
  }

  setStreams(streams: Stream[]) {
    this.streams = streams;
    if (!this.device) return;

    this.textAtlas.clear();
    for (const s of streams) {
      this.textAtlas.addText(s.name);
    }
    this.textAtlas.upload(this.device);

    const streamData = new Float32Array(streams.flatMap(s => [
      this.textAtlas.addText(s.name),
      this.textAtlas.getFlagIndex(s.countryCode)
    ]));

    this.streamBuffer = this.device.createBuffer({
      size: Math.max(streamData.byteLength, 32),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.streamBuffer, 0, streamData);

    // ... (rest of buffer and bind group setup)
  }

  // ... (rest of the class is the same)
}
