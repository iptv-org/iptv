import { Stream, CountryFile, getCountryList, fetchM3U } from './m3u-parser'

/**
 * Stream selector component for browsing and selecting IPTV streams
 */
export class StreamSelector {
  private countrySelect: HTMLSelectElement
  private searchInput: HTMLInputElement
  private streamList: HTMLUListElement
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
    this.streamList = streamList as HTMLUListElement
    
    this.init()
  }

  /**
   * Initialize the stream selector
   */
  private init(): void {
    this.populateCountrySelect()
    this.setupEventListeners()
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
  private async onCountryChange(): Promise<void> {
    const filename = this.countrySelect.value
    if (!filename) {
      this.streams = []
      this.filteredStreams = []
      this.renderStreamList()
      return
    }

    try {
      this.streamList.innerHTML = '<li class="loading">Loading streams...</li>'
      const url = `${this.baseUrl}${filename}`
      this.streams = await fetchM3U(url)
      this.filteredStreams = this.streams
      this.applySearch()
    } catch (error) {
      console.error('Failed to load streams:', error)
      this.streamList.innerHTML = '<li class="error">Failed to load streams. Please try again.</li>'
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
    
    this.renderStreamList()
  }

  /**
   * Render the stream list
   */
  private renderStreamList(): void {
    this.streamList.innerHTML = ''
    
    if (this.filteredStreams.length === 0) {
      const li = document.createElement('li')
      li.className = 'empty'
      li.textContent = this.streams.length === 0 
        ? 'No streams loaded' 
        : 'No streams match your search'
      this.streamList.appendChild(li)
      return
    }

    // Limit to first 100 streams for performance
    const displayStreams = this.filteredStreams.slice(0, 100)
    
    for (const stream of displayStreams) {
      const li = document.createElement('li')
      li.dataset.streamId = stream.id
      
      const nameDiv = document.createElement('div')
      nameDiv.className = 'stream-name'
      nameDiv.textContent = stream.name
      
      const qualityDiv = document.createElement('div')
      qualityDiv.className = 'stream-quality'
      qualityDiv.textContent = stream.quality || 'Unknown quality'
      
      li.appendChild(nameDiv)
      li.appendChild(qualityDiv)
      
      li.addEventListener('click', () => this.selectStream(stream, li))
      
      this.streamList.appendChild(li)
    }
    
    if (this.filteredStreams.length > 100) {
      const li = document.createElement('li')
      li.className = 'more-info'
      li.textContent = `Showing 100 of ${this.filteredStreams.length} streams. Use search to filter.`
      this.streamList.appendChild(li)
    }
  }

  /**
   * Select a stream
   */
  private selectStream(stream: Stream, element: HTMLLIElement): void {
    // Remove active class from all items
    const activeItems = this.streamList.querySelectorAll('li.active')
    activeItems.forEach(item => item.classList.remove('active'))
    
    // Add active class to selected item
    element.classList.add('active')
    
    // Notify callback
    if (this.onStreamSelect) {
      this.onStreamSelect(stream)
    }
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
