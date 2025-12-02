import { Stream, CountryFile, getCountryList, fetchM3U } from './m3u-parser'
import { StreamSelectorRenderer } from './stream-selector-renderer'

/**
 * Stream selector component for browsing and selecting IPTV streams
 */
export class StreamSelector {
  private countrySelect: HTMLSelectElement
  private searchInput: HTMLInputElement
  private streamList: HTMLElement
  private renderer: StreamSelectorRenderer | null = null
  private canvas: HTMLCanvasElement | null = null

  private countries: CountryFile[]
  private streams: Stream[] = []
  private filteredStreams: Stream[] = []
  private onStreamSelect: ((stream: Stream) => void) | null = null
  private baseUrl: string

  constructor(baseUrl: string = 'https://iptv-org.github.io/iptv/streams/') {
    this.baseUrl = baseUrl
    this.countries = getCountryList()
    
    const countrySelect = document.getElementById('country-select')
    const searchInput = document.getElementById('search-input')
    const streamList = document.getElementById('stream-list')
    
    if (!countrySelect || !searchInput || !streamList) {
      throw new Error('Required DOM elements not found')
    }
    
    this.countrySelect = countrySelect as HTMLSelectElement
    this.searchInput = searchInput as HTMLInputElement
    this.streamList = streamList as HTMLElement
    
    this.init()
  }

  /**
   * Initialize the stream selector
   */
  private async init(): Promise<void> {
    this.populateCountrySelect()
    this.setupEventListeners()
    await this.setupRenderer()
  }

  private async setupRenderer(): Promise<void> {
    // Replace UL with Canvas container
    this.streamList.innerHTML = ''
    this.streamList.style.position = 'relative'

    // Create canvas
    this.canvas = document.createElement('canvas')
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.display = 'block'
    this.streamList.appendChild(this.canvas)

    // Create status overlay
    const statusOverlay = document.createElement('div')
    statusOverlay.id = 'status-overlay'
    statusOverlay.style.position = 'absolute'
    statusOverlay.style.top = '0'
    statusOverlay.style.left = '0'
    statusOverlay.style.width = '100%'
    statusOverlay.style.height = '100%'
    statusOverlay.style.pointerEvents = 'none'
    statusOverlay.style.display = 'flex'
    statusOverlay.style.justifyContent = 'center'
    statusOverlay.style.alignItems = 'center'
    statusOverlay.style.color = 'white'
    statusOverlay.style.fontSize = '1.2em'
    this.streamList.appendChild(statusOverlay)

    // Create renderer
    try {
      this.renderer = new StreamSelectorRenderer(this.canvas)
      await this.renderer.init()

      // Handle clicks on canvas
      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas!.getBoundingClientRect()
        const y = e.clientY - rect.top

        const stream = this.renderer!.getStreamAt(y)
        if (stream) {
          this.onStreamSelect?.(stream)
        }
      })
    } catch (e) {
      console.error('WebGPU Stream Selector init failed', e)
      this.streamList.textContent = 'WebGPU not supported or failed to init.'
    }
  }

  /**
   * Populate the country select dropdown
   */
  private populateCountrySelect(): void {
    this.countrySelect.innerHTML = '<option value="">Select a country...</option>'
    
    for (const country of this.countries) {
      const option = document.createElement('option')
      option.value = country.filename
      option.textContent = country.name
      this.countrySelect.appendChild(option)
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.countrySelect.addEventListener('change', () => this.onCountryChange())
    this.searchInput.addEventListener('input', () => this.onSearchChange())
  }

  /**
   * Handle country selection change
   */
  private updateStatus(message: string): void {
    const overlay = document.getElementById('status-overlay')
    if (overlay) {
      overlay.textContent = message
    }
  }

  private async onCountryChange(): Promise<void> {
    const filename = this.countrySelect.value
    if (!filename) {
      this.streams = []
      this.filteredStreams = []
      this.renderer?.setStreams([])
      this.updateStatus('Select a country to view streams')
      return
    }

    try {
      this.updateStatus('Loading streams...')
      const url = `${this.baseUrl}${filename}`
      this.streams = await fetchM3U(url)
      this.filteredStreams = this.streams
      this.applySearch()
    } catch (error) {
      console.error('Failed to load streams:', error)
      this.updateStatus('Failed to load streams. Please try again.')
    }
  }

  /**
   * Handle search input change
   */
  private onSearchChange(): void {
    this.applySearch()
  }

  /**
   * Apply search filter to streams
   */
  private applySearch(): void {
    const query = this.searchInput.value.toLowerCase().trim()
    
    if (!query) {
      this.filteredStreams = this.streams
    } else {
      this.filteredStreams = this.streams.filter(stream => 
        stream.name.toLowerCase().includes(query) ||
        (stream.tvgId && stream.tvgId.toLowerCase().includes(query))
      )
    }
    
    if (this.filteredStreams.length === 0) {
      this.updateStatus(this.streams.length === 0 ? 'No streams loaded' : 'No streams match your search')
    } else {
      this.updateStatus('')
    }

    // Limit to 100 items to fit in texture atlas
    const displayStreams = this.filteredStreams.slice(0, 100)
    this.renderer?.setStreams(displayStreams)
  }

  /**
   * Set callback for stream selection
   */
  onSelect(callback: (stream: Stream) => void): void {
    this.onStreamSelect = callback
  }

  /**
   * Get currently loaded streams
   */
  getStreams(): Stream[] {
    return this.streams
  }
}
