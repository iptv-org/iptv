/**
 * WebGPU-based video renderer with compute shader processing
 */
export interface ShaderParams {
  brightness: number
  contrast: number
  saturation: number
}

export class WebGPURenderer {
  private device: GPUDevice | null = null
  private context: GPUCanvasContext | null = null
  private pipeline: GPURenderPipeline | null = null
  private computePipeline: GPUComputePipeline | null = null
  private sampler: GPUSampler | null = null
  private uniformBuffer: GPUBuffer | null = null
  private bindGroup: GPUBindGroup | null = null
  private computeBindGroup: GPUBindGroup | null = null
  private videoTexture: GPUTexture | null = null
  private processedTexture: GPUTexture | null = null
  private videoTextureView: GPUTextureView | null = null
  private processedTextureView: GPUTextureView | null = null
  private canvas: HTMLCanvasElement
  private video: HTMLVideoElement | null = null
  private animationId: number | null = null
  private bindGroupsDirty: boolean = true
  private shaderParams: ShaderParams = {
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  /**
   * Check if WebGPU is supported
   */
  static async isSupported(): Promise<boolean> {
    if (!navigator.gpu) {
      return false
    }
    try {
      const adapter = await navigator.gpu.requestAdapter()
      return adapter !== null
    } catch {
      return false
    }
  }

  /**
   * Initialize WebGPU
   */
  async init(): Promise<void> {
    if (!navigator.gpu) {
      throw new Error('WebGPU is not supported')
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('Failed to get GPU adapter')
    }

    this.device = await adapter.requestDevice()
    this.context = this.canvas.getContext('webgpu')
    if (!this.context) {
      throw new Error('Failed to get WebGPU context')
    }

    const format = navigator.gpu.getPreferredCanvasFormat()
    this.context.configure({
      device: this.device,
      format,
      alphaMode: 'premultiplied'
    })

    // Create sampler
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    })

    // Create uniform buffer for shader parameters
    this.uniformBuffer = this.device.createBuffer({
      size: 16, // 3 floats + padding
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    // Create render pipeline
    await this.createRenderPipeline(format)
    
    // Create compute pipeline
    await this.createComputePipeline()
  }

  /**
   * Create the render pipeline
   */
  private async createRenderPipeline(format: GPUTextureFormat): Promise<void> {
    if (!this.device) throw new Error('Device not initialized')

    const shaderModule = this.device.createShaderModule({
      label: 'Video render shader',
      code: `
        struct Uniforms {
          brightness: f32,
          contrast: f32,
          saturation: f32,
        }

        @group(0) @binding(0) var texSampler: sampler;
        @group(0) @binding(1) var texVideo: texture_2d<f32>;
        @group(0) @binding(2) var<uniform> uniforms: Uniforms;

        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) texCoord: vec2f,
        }

        @vertex
        fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
          // Full-screen quad vertices
          var pos = array<vec2f, 6>(
            vec2f(-1.0, -1.0),
            vec2f( 1.0, -1.0),
            vec2f(-1.0,  1.0),
            vec2f(-1.0,  1.0),
            vec2f( 1.0, -1.0),
            vec2f( 1.0,  1.0)
          );
          
          var texCoords = array<vec2f, 6>(
            vec2f(0.0, 1.0),
            vec2f(1.0, 1.0),
            vec2f(0.0, 0.0),
            vec2f(0.0, 0.0),
            vec2f(1.0, 1.0),
            vec2f(1.0, 0.0)
          );

          var output: VertexOutput;
          output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
          output.texCoord = texCoords[vertexIndex];
          return output;
        }

        @fragment
        fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
          let color = textureSample(texVideo, texSampler, input.texCoord);
          
          // Apply brightness
          var adjusted = color.rgb * uniforms.brightness;
          
          // Apply contrast
          adjusted = (adjusted - 0.5) * uniforms.contrast + 0.5;
          
          // Apply saturation
          let gray = dot(adjusted, vec3f(0.299, 0.587, 0.114));
          adjusted = mix(vec3f(gray), adjusted, uniforms.saturation);
          
          return vec4f(clamp(adjusted, vec3f(0.0), vec3f(1.0)), color.a);
        }
      `
    })

    this.pipeline = this.device.createRenderPipeline({
      label: 'Video render pipeline',
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain'
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format }]
      },
      primitive: {
        topology: 'triangle-list'
      }
    })
  }

  /**
   * Create the compute pipeline for video processing
   */
  private async createComputePipeline(): Promise<void> {
    if (!this.device) throw new Error('Device not initialized')

    const computeShaderModule = this.device.createShaderModule({
      label: 'Video compute shader',
      code: `
        struct Uniforms {
          brightness: f32,
          contrast: f32,
          saturation: f32,
        }

        @group(0) @binding(0) var inputTexture: texture_2d<f32>;
        @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
        @group(0) @binding(2) var<uniform> uniforms: Uniforms;

        @compute @workgroup_size(8, 8)
        fn main(@builtin(global_invocation_id) global_id: vec3u) {
          let dims = textureDimensions(inputTexture);
          
          if (global_id.x >= dims.x || global_id.y >= dims.y) {
            return;
          }
          
          let color = textureLoad(inputTexture, vec2i(global_id.xy), 0);
          
          // Apply brightness
          var adjusted = color.rgb * uniforms.brightness;
          
          // Apply contrast
          adjusted = (adjusted - 0.5) * uniforms.contrast + 0.5;
          
          // Apply saturation
          let gray = dot(adjusted, vec3f(0.299, 0.587, 0.114));
          adjusted = mix(vec3f(gray), adjusted, uniforms.saturation);
          
          // Edge detection effect (optional visual enhancement)
          var edgeColor = adjusted;
          if (global_id.x > 0u && global_id.x < dims.x - 1u && 
              global_id.y > 0u && global_id.y < dims.y - 1u) {
            let left = textureLoad(inputTexture, vec2i(i32(global_id.x) - 1, i32(global_id.y)), 0).rgb;
            let right = textureLoad(inputTexture, vec2i(i32(global_id.x) + 1, i32(global_id.y)), 0).rgb;
            let up = textureLoad(inputTexture, vec2i(i32(global_id.x), i32(global_id.y) - 1), 0).rgb;
            let down = textureLoad(inputTexture, vec2i(i32(global_id.x), i32(global_id.y) + 1), 0).rgb;
            
            let edgeH = abs(left - right);
            let edgeV = abs(up - down);
            let edge = (edgeH + edgeV) * 0.1;
            
            edgeColor = adjusted + edge;
          }
          
          textureStore(outputTexture, vec2i(global_id.xy), 
                       vec4f(clamp(edgeColor, vec3f(0.0), vec3f(1.0)), color.a));
        }
      `
    })

    this.computePipeline = this.device.createComputePipeline({
      label: 'Video compute pipeline',
      layout: 'auto',
      compute: {
        module: computeShaderModule,
        entryPoint: 'main'
      }
    })
  }

  /**
   * Set the video element to render
   */
  setVideo(video: HTMLVideoElement): void {
    this.video = video
    this.resizeCanvas()
  }

  /**
   * Resize canvas to match video dimensions
   */
  private resizeCanvas(): void {
    if (this.video && this.video.videoWidth && this.video.videoHeight) {
      const container = this.canvas.parentElement
      if (container) {
        const containerAspect = container.clientWidth / container.clientHeight
        const videoAspect = this.video.videoWidth / this.video.videoHeight
        
        if (containerAspect > videoAspect) {
          this.canvas.height = container.clientHeight
          this.canvas.width = container.clientHeight * videoAspect
        } else {
          this.canvas.width = container.clientWidth
          this.canvas.height = container.clientWidth / videoAspect
        }
      } else {
        this.canvas.width = this.video.videoWidth
        this.canvas.height = this.video.videoHeight
      }
    }
  }

  /**
   * Update shader parameters
   */
  setShaderParams(params: Partial<ShaderParams>): void {
    this.shaderParams = { ...this.shaderParams, ...params }
    this.updateUniformBuffer()
  }

  /**
   * Update the uniform buffer with current shader parameters
   */
  private updateUniformBuffer(): void {
    if (!this.device || !this.uniformBuffer) return

    const data = new Float32Array([
      this.shaderParams.brightness,
      this.shaderParams.contrast,
      this.shaderParams.saturation,
      0 // padding
    ])

    this.device.queue.writeBuffer(this.uniformBuffer, 0, data)
  }

  /**
   * Create texture from video frame
   */
  private createVideoTexture(): void {
    if (!this.device || !this.video) return

    const width = this.video.videoWidth
    const height = this.video.videoHeight

    if (width === 0 || height === 0) return

    // Recreate textures if dimensions changed
    if (!this.videoTexture || 
        this.videoTexture.width !== width || 
        this.videoTexture.height !== height) {
      
      if (this.videoTexture) {
        this.videoTexture.destroy()
      }
      if (this.processedTexture) {
        this.processedTexture.destroy()
      }

      this.videoTexture = this.device.createTexture({
        label: 'Video texture',
        size: [width, height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | 
               GPUTextureUsage.COPY_DST | 
               GPUTextureUsage.RENDER_ATTACHMENT
      })

      this.processedTexture = this.device.createTexture({
        label: 'Processed texture',
        size: [width, height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | 
               GPUTextureUsage.STORAGE_BINDING
      })

      // Create texture views once when textures are created
      this.videoTextureView = this.videoTexture.createView()
      this.processedTextureView = this.processedTexture.createView()

      // Mark bind groups as dirty so they get recreated
      this.bindGroupsDirty = true

      this.resizeCanvas()
    }
  }

  /**
   * Create or update bind groups when textures change
   */
  private updateBindGroups(): void {
    if (!this.bindGroupsDirty) return
    if (!this.device || !this.videoTextureView || !this.processedTextureView || 
        !this.uniformBuffer || !this.sampler) return

    // Create compute bind group
    if (this.computePipeline) {
      this.computeBindGroup = this.device.createBindGroup({
        label: 'Compute bind group',
        layout: this.computePipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: this.videoTextureView },
          { binding: 1, resource: this.processedTextureView },
          { binding: 2, resource: { buffer: this.uniformBuffer } }
        ]
      })
    }

    // Create render bind group
    if (this.pipeline) {
      const textureViewToRender = this.computePipeline ? this.processedTextureView : this.videoTextureView
      this.bindGroup = this.device.createBindGroup({
        label: 'Render bind group',
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: this.sampler },
          { binding: 1, resource: textureViewToRender },
          { binding: 2, resource: { buffer: this.uniformBuffer } }
        ]
      })
    }

    this.bindGroupsDirty = false
  }

  /**
   * Render a single frame
   */
  private renderFrame(): void {
    if (!this.device || !this.context || !this.video || 
        !this.pipeline || !this.sampler || !this.uniformBuffer) return

    if (this.video.readyState < 2) return // Not enough data

    this.createVideoTexture()
    if (!this.videoTexture || !this.processedTexture) return

    // Update bind groups if textures changed
    this.updateBindGroups()
    if (!this.bindGroup) return

    // Copy video frame to texture
    this.device.queue.copyExternalImageToTexture(
      { source: this.video, flipY: false },
      { texture: this.videoTexture },
      [this.video.videoWidth, this.video.videoHeight]
    )

    // Run compute shader if pipeline is available
    if (this.computePipeline && this.computeBindGroup) {
      const commandEncoder = this.device.createCommandEncoder()
      const computePass = commandEncoder.beginComputePass()
      computePass.setPipeline(this.computePipeline)
      computePass.setBindGroup(0, this.computeBindGroup)
      computePass.dispatchWorkgroups(
        Math.ceil(this.video.videoWidth / 8),
        Math.ceil(this.video.videoHeight / 8)
      )
      computePass.end()
      this.device.queue.submit([commandEncoder.finish()])
    }

    // Render
    const commandEncoder = this.device.createCommandEncoder()
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    })

    renderPass.setPipeline(this.pipeline)
    renderPass.setBindGroup(0, this.bindGroup)
    renderPass.draw(6) // 6 vertices for full-screen quad
    renderPass.end()

    this.device.queue.submit([commandEncoder.finish()])
  }

  /**
   * Start the render loop
   */
  start(): void {
    const loop = (): void => {
      this.renderFrame()
      this.animationId = requestAnimationFrame(loop)
    }
    loop()
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop()
    if (this.videoTexture) {
      this.videoTexture.destroy()
    }
    if (this.processedTexture) {
      this.processedTexture.destroy()
    }
    if (this.uniformBuffer) {
      this.uniformBuffer.destroy()
    }
    if (this.device) {
      this.device.destroy()
    }
  }
}
