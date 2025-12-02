import Hls from 'hls.js'
import { Stream } from './m3u-parser'
import { WebGPURenderer } from './webgpu-renderer'

/**
 * Video player that handles HLS streams and WebGPU rendering
 */
export class VideoPlayer {
  private video: HTMLVideoElement
  private canvas: HTMLCanvasElement
  private renderer: WebGPURenderer | null = null
  private hls: Hls | null = null
  private playBtn: HTMLButtonElement
  private pauseBtn: HTMLButtonElement
  private currentStreamDisplay: HTMLElement
  private brightnessSlider: HTMLInputElement
  private contrastSlider: HTMLInputElement
  private saturationSlider: HTMLInputElement
  private useWebGPU: boolean = false

  constructor() {
    const video = document.getElementById('video-source')
    const canvas = document.getElementById('webgpu-canvas')
    const playBtn = document.getElementById('play-btn')
    const pauseBtn = document.getElementById('pause-btn')
    const currentStreamDisplay = document.getElementById('current-stream')
    const brightnessSlider = document.getElementById('brightness')
    const contrastSlider = document.getElementById('contrast')
    const saturationSlider = document.getElementById('saturation')
    
    if (!video || !canvas || !playBtn || !pauseBtn || !currentStreamDisplay ||
        !brightnessSlider || !contrastSlider || !saturationSlider) {
      throw new Error('Required DOM elements not found')
    }
    
    this.video = video as HTMLVideoElement
    this.canvas = canvas as HTMLCanvasElement
    this.playBtn = playBtn as HTMLButtonElement
    this.pauseBtn = pauseBtn as HTMLButtonElement
    this.currentStreamDisplay = currentStreamDisplay
    this.brightnessSlider = brightnessSlider as HTMLInputElement
    this.contrastSlider = contrastSlider as HTMLInputElement
    this.saturationSlider = saturationSlider as HTMLInputElement
    
    this.setupEventListeners()
  }

  /**
   * Initialize WebGPU renderer
   */
  async initWebGPU(): Promise<boolean> {
    try {
      const supported = await WebGPURenderer.isSupported()
      if (!supported) {
        console.warn('WebGPU is not supported')
        return false
      }

      this.renderer = new WebGPURenderer(this.canvas)
      await this.renderer.init()
      this.renderer.setVideo(this.video)
      this.useWebGPU = true
      return true
    } catch (error) {
      console.error('Failed to initialize WebGPU:', error)
      return false
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.playBtn.addEventListener('click', () => this.play())
    this.pauseBtn.addEventListener('click', () => this.pause())
    
    this.brightnessSlider.addEventListener('input', () => this.updateShaderParams())
    this.contrastSlider.addEventListener('input', () => this.updateShaderParams())
    this.saturationSlider.addEventListener('input', () => this.updateShaderParams())
    
    this.video.addEventListener('playing', () => {
      if (this.useWebGPU && this.renderer) {
        this.renderer.start()
        this.canvas.style.display = 'block'
      }
    })
    
    this.video.addEventListener('pause', () => {
      // Keep rendering when paused to show the last frame
    })
    
    this.video.addEventListener('ended', () => {
      if (this.renderer) {
        this.renderer.stop()
      }
    })
    
    this.video.addEventListener('error', (e) => {
      console.error('Video error:', e)
      this.currentStreamDisplay.textContent = 'Error loading stream'
    })
  }

  /**
   * Update shader parameters from sliders
   */
  private updateShaderParams(): void {
    if (this.renderer) {
      this.renderer.setShaderParams({
        brightness: parseFloat(this.brightnessSlider.value),
        contrast: parseFloat(this.contrastSlider.value),
        saturation: parseFloat(this.saturationSlider.value)
      })
    }
  }

  /**
   * Load a stream
   */
  async loadStream(stream: Stream): Promise<void> {
    // Cleanup previous stream
    if (this.hls) {
      this.hls.destroy()
      this.hls = null
    }
    
    this.currentStreamDisplay.textContent = stream.name
    
    // Enable controls
    this.playBtn.disabled = false
    this.pauseBtn.disabled = false

    const url = stream.url
    
    // Check if it's an HLS stream
    if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        this.hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          enableWorker: true
        })
        
        this.hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
          console.error('HLS error:', data)
          if (data.fatal) {
            this.currentStreamDisplay.textContent = `Error: ${data.details}`
          }
        })
        
        this.hls.loadSource(url)
        this.hls.attachMedia(this.video)
        
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          this.video.play().catch(console.error)
        })
      } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        this.video.src = url
        this.video.play().catch(console.error)
      } else {
        this.currentStreamDisplay.textContent = 'HLS not supported in this browser'
      }
    } else {
      // Direct video URL
      this.video.src = url
      this.video.play().catch(console.error)
    }
  }

  /**
   * Play the current stream
   */
  play(): void {
    if (this.video.src || this.hls) {
      this.video.play().catch(console.error)
    }
  }

  /**
   * Pause the current stream
   */
  pause(): void {
    this.video.pause()
  }

  /**
   * Stop and cleanup
   */
  destroy(): void {
    if (this.hls) {
      this.hls.destroy()
    }
    if (this.renderer) {
      this.renderer.destroy()
    }
    this.video.pause()
    this.video.src = ''
  }
}
