import { StreamSelector } from './stream-selector'
import { VideoPlayer } from './video-player'
import { WebGPURenderer } from './webgpu-renderer'

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  const statusElement = document.getElementById('webgpu-status')
  
  // Check WebGPU support
  const webgpuSupported = await WebGPURenderer.isSupported()
  if (statusElement) {
    if (webgpuSupported) {
      statusElement.textContent = 'WebGPU Supported'
      statusElement.className = 'supported'
    } else {
      statusElement.textContent = 'WebGPU Not Supported - Using fallback'
      statusElement.className = 'unsupported'
    }
  }

  // Initialize video player
  const player = new VideoPlayer()
  
  if (webgpuSupported) {
    const initialized = await player.initWebGPU()
    if (!initialized && statusElement) {
      statusElement.textContent = 'WebGPU initialization failed - Using fallback'
      statusElement.className = 'unsupported'
    }
  }

  // Initialize stream selector
  const selector = new StreamSelector()
  
  // Connect stream selection to player
  selector.onSelect((stream) => {
    player.loadStream(stream)
  })

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    player.destroy()
  })
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main)
} else {
  main()
}
