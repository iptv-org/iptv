/**
 * Helper to render text into a texture atlas for WebGPU usage
 */
export class TextAtlas {
  private canvas: OffscreenCanvas
  private context: OffscreenCanvasRenderingContext2D
  public texture: GPUTexture | null = null
  public flagTexture: GPUTexture | null = null
  public readonly width = 2048
  public readonly height = 4096
  public readonly itemHeight = 40
  public readonly maxItems: number

  // Map of text string to its index in the atlas (row index)
  private textMap = new Map<string, number>()
  private flagMap = new Map<string, number>()
  private nextIndex = 0

  constructor() {
    this.canvas = new OffscreenCanvas(this.width, this.height)
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context for TextAtlas')
    this.context = ctx

    this.context.font = '24px sans-serif'
    this.context.textBaseline = 'middle'
    this.context.fillStyle = 'white'

    this.maxItems = Math.floor(this.height / this.itemHeight)
  }

  /**
   * Load flag sprite sheet
   */
  async loadFlags(device: GPUDevice, url: string = '/flags.png'): Promise<void> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to load flags image')
      }
      const blob = await response.blob()
      const imageBitmap = await createImageBitmap(blob)

      this.flagTexture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      })

      device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: this.flagTexture },
        [imageBitmap.width, imageBitmap.height]
      )

      // Simplified: assuming a known layout for the flag sprite
      const codes = ['us', 'gb', 'de', 'fr', 'es', 'it', 'br', 'mx', 'ca', 'au', 'jp', 'kr', 'in', 'ru', 'cn']
      codes.forEach((code, i) => this.flagMap.set(code, i))
    } catch (e) {
      console.warn('Failed to load flags atlas, using fallback', e)
      
      // Create a 1x1 white texture as fallback
      this.flagTexture = device.createTexture({
        size: [1, 1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      })
      
      const whitePixel = new Uint8Array([255, 255, 255, 255])
      device.queue.writeTexture(
        { texture: this.flagTexture },
        whitePixel,
        { bytesPerRow: 4, rowsPerImage: 1 },
        { width: 1, height: 1 }
      )
    }
  }

  /**
   * Get flag index for country code
   */
  getFlagIndex(countryCode?: string): number {
    return this.flagMap.get(countryCode || '') ?? -1
  }

  /**
   * Clear the atlas
   */
  clear(): void {
    this.context.clearRect(0, 0, this.width, this.height)
    this.textMap.clear()
    this.nextIndex = 0
  }

  /**
   * Add text to the atlas and get its index
   */
  addText(text: string): number {
    if (this.textMap.has(text)) {
      return this.textMap.get(text)!
    }

    if (this.nextIndex >= this.maxItems) {
      console.warn('TextAtlas full, reusing last slot')
      return this.maxItems - 1
    }

    const index = this.nextIndex++
    this.textMap.set(text, index)

    const y = index * this.itemHeight + (this.itemHeight / 2)
    this.context.fillText(text, 10, y)

    return index
  }

  /**
   * Upload the atlas to a GPU texture
   */
  upload(device: GPUDevice): void {
    if (this.texture) this.texture.destroy()

    this.texture = device.createTexture({
      size: [this.width, this.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    })

    device.queue.copyExternalImageToTexture(
      { source: this.canvas },
      { texture: this.texture },
      [this.width, this.height]
    )
  }
}
