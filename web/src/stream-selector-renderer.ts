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

      struct Position {
        y: f32,
        visible: f32,
      }

      struct Uniforms {
        scrollY: f32,
        canvasHeight: f32,
        itemHeight: f32,
        count: f32,
      }

      @group(0) @binding(0) var<storage, read> streams: array<StreamInfo>;
      @group(0) @binding(1) var<storage, read_write> positions: array<Position>;
      @group(0) @binding(2) var<uniform> uniforms: Uniforms;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id: vec3u) {
        let index = global_id.x;
        if (index >= u32(uniforms.count)) { return; }

        let yPos = f32(index) * uniforms.itemHeight - uniforms.scrollY;

        var visible = 0.0;
        if (yPos > -uniforms.itemHeight && yPos < uniforms.canvasHeight) {
          visible = 1.0;
        }

        positions[index].y = yPos;
        positions[index].visible = visible;
      }
    `;

    const renderShader = `
      struct Uniforms {
        scrollY: f32,
        canvasHeight: f32,
        itemHeight: f32,
        count: f32,
      }

      struct StreamInfo {
        atlasIndex: f32,
        flagIndex: f32,
      }

      struct Position {
        y: f32,
        visible: f32,
      }

      @group(0) @binding(0) var<storage, read> streams: array<StreamInfo>;
      @group(0) @binding(1) var<storage, read> positions: array<Position>;
      @group(0) @binding(2) var<uniform> uniforms: Uniforms;
      @group(0) @binding(3) var textSampler: sampler;
      @group(0) @binding(4) var textTexture: texture_2d<f32>;
      @group(0) @binding(5) var flagTexture: texture_2d<f32>;

      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) uv: vec2f,
        @location(1) atlasIndex: f32,
        @location(2) flagIndex: f32,
      }

      @vertex
      fn vs_main(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
        let pos = positions[instanceIndex];
        let stream = streams[instanceIndex];

        if (pos.visible < 0.5) {
          return VertexOutput(vec4f(-2.0, -2.0, 0.0, 1.0), vec2f(0.0), 0.0, 0.0);
        }

        var vPos = vec2f(0.0, 0.0);
        var vUV = vec2f(0.0, 0.0);

        switch(vertexIndex) {
          case 0u: { vPos = vec2f(0.0, 0.0); vUV = vec2f(0.0, 0.0); }
          case 1u: { vPos = vec2f(1.0, 0.0); vUV = vec2f(1.0, 0.0); }
          case 2u: { vPos = vec2f(0.0, 1.0); vUV = vec2f(0.0, 1.0); }
          case 3u: { vPos = vec2f(1.0, 1.0); vUV = vec2f(1.0, 1.0); }
          default: { }
        }

        let x = -1.0 + vPos.x * 2.0;
        let clipY = 1.0 - (pos.y + vPos.y * uniforms.itemHeight) / uniforms.canvasHeight * 2.0;

        return VertexOutput(
          vec4f(x, clipY, 0.0, 1.0),
          vUV,
          stream.atlasIndex,
          stream.flagIndex
        );
      }

      @fragment
      fn fs_main(in: VertexOutput) -> @location(0) vec4f {
        let atlasHeight = 4096.0;
        let itemHeight = 40.0;
        let row = in.atlasIndex;
        let v = (row * itemHeight + in.uv.y * itemHeight) / atlasHeight;
        let textCol = textureSample(textTexture, textSampler, vec2f(in.uv.x, v));

        var finalColor = vec4f(0.1, 0.1, 0.15, 1.0);

        // Flag rendering
        let flagWidth = 30.0;
        let flagHeight = 20.0;
        let flagPadding = 10.0;

        if (in.uv.x * 800.0 < flagWidth + flagPadding && in.uv.x * 800.0 > flagPadding && in.flagIndex >= 0.0) {
          let flagUV = vec2f(
            (in.uv.x * 800.0 - flagPadding) / flagWidth,
            in.uv.y
          );
          if (flagUV.x > 0.0 && flagUV.x < 1.0 && flagUV.y > 0.0 && flagUV.y < 1.0) {
            let flagV = (in.flagIndex * flagHeight + flagUV.y * flagHeight) / 2048.0;
            finalColor = textureSample(flagTexture, textSampler, vec2f(flagUV.x, flagV));
          }
        }

        return mix(finalColor, vec4f(1.0), textCol.a);
      }
    `;

    const compModule = this.device.createShaderModule({ code: computeShader });
    this.computePipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: { module: compModule, entryPoint: 'main' }
    });

    const vertModule = this.device.createShaderModule({ code: renderShader });
    this.renderPipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: vertModule, entryPoint: 'vs_main' },
      fragment: {
        module: vertModule,
        entryPoint: 'fs_main',
        targets: [{
          format: navigator.gpu.getPreferredCanvasFormat(),
          blend: {
            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
          }
        }]
      },
      primitive: { topology: 'triangle-strip' }
    });
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

    const posSize = Math.max(streams.length * 8, 32);
    this.positionBuffer = this.device.createBuffer({
      size: posSize,
      usage: GPUBufferUsage.STORAGE,
    });

    this.uniformBuffer = this.device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.createBindGroups();
  }

  private createBindGroups() {
    if (!this.device || !this.computePipeline || !this.renderPipeline) return;
    if (!this.streamBuffer || !this.positionBuffer || !this.uniformBuffer || !this.textAtlas.texture || !this.textAtlas.flagTexture) return;

    this.bindGroupCompute = this.device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.streamBuffer } },
        { binding: 1, resource: { buffer: this.positionBuffer } },
        { binding: 2, resource: { buffer: this.uniformBuffer } }
      ]
    });

    const sampler = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear' });

    this.bindGroupRender = this.device.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.streamBuffer } },
        { binding: 1, resource: { buffer: this.positionBuffer } },
        { binding: 2, resource: { buffer: this.uniformBuffer } },
        { binding: 3, resource: sampler },
        { binding: 4, resource: this.textAtlas.texture.createView() },
        { binding: 5, resource: this.textAtlas.flagTexture.createView() }
      ]
    });
  }

  private resize() {
    if (!this.canvas || !this.device) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      if (this.context) {
        this.context.configure({
          device: this.device,
          format: navigator.gpu.getPreferredCanvasFormat(),
          alphaMode: 'premultiplied'
        });
      }
    }
  }

  private startLoop() {
    const frame = (time: number) => {
      const dt = time - this.lastTime;
      this.lastTime = time;

      this.update(dt);
      this.render();

      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  private update(dt: number) {
    const factor = 1.0 - Math.pow(0.1, dt / 16.0);
    this.scrollY += (this.targetScrollY - this.scrollY) * factor;

    if (this.device && this.uniformBuffer) {
      const uniforms = new Float32Array([
        this.scrollY,
        this.canvas.height,
        this.itemHeight,
        this.streams.length
      ]);
      this.device.queue.writeBuffer(this.uniformBuffer, 0, uniforms);
    }
  }

  private render() {
    if (!this.device || !this.context || !this.computePipeline || !this.renderPipeline) return;
    if (!this.bindGroupCompute || !this.bindGroupRender) return;

    const encoder = this.device.createCommandEncoder();

    const computePass = encoder.beginComputePass();
    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.bindGroupCompute);
    const workgroups = Math.ceil(this.streams.length / 64);
    if (workgroups > 0) {
      computePass.dispatchWorkgroups(workgroups);
    }
    computePass.end();

    const view = this.context.getCurrentTexture().createView();
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [{
        view,
        clearValue: { r: 0.05, g: 0.05, b: 0.1, a: 1 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    });

    renderPass.setPipeline(this.renderPipeline);
    renderPass.setBindGroup(0, this.bindGroupRender);
    if (this.streams.length > 0) {
      renderPass.draw(4, this.streams.length);
    }
    renderPass.end();

    this.device.queue.submit([encoder.finish()]);
  }

  getStreamAt(y: number): Stream | null {
    const index = Math.floor((y + this.scrollY) / this.itemHeight);
    if (index >= 0 && index < this.streams.length) {
      return this.streams[index];
    }
    return null;
  }
}
