import { Stream, Group, fetchGroups } from './m3u-parser';
import { StreamSelectorRenderer } from './stream-selector-renderer';

export class StreamSelector {
  private groupSelect: HTMLSelectElement;
  private searchInput: HTMLInputElement;
  private streamList: HTMLElement;
  private renderer: StreamSelectorRenderer | null = null;
  private canvas: HTMLCanvasElement | null = null;

  private groups: Group[] = [];
  private streams: Stream[] = [];
  private filteredStreams: Stream[] = [];
  private onStreamSelect: ((stream: Stream) => void) | null = null;

  constructor() {
    const groupSelect = document.getElementById('group-select');
    const searchInput = document.getElementById('search-input');
    const streamList = document.getElementById('stream-list');

    if (!groupSelect || !searchInput || !streamList) {
      throw new Error('Required DOM elements not found');
    }

    this.groupSelect = groupSelect as HTMLSelectElement;
    this.searchInput = searchInput as HTMLInputElement;
    this.streamList = streamList as HTMLElement;

    this.init();
  }

  private async init(): Promise<void> {
    this.setupEventListeners();
    await this.setupRenderer();
    this.showIntroScreen();
    await this.loadGroups();
  }

  private showIntroScreen() {
    this.updateStatus('Welcome! Select a group to begin.');
    // Here you could add more complex intro graphics or animations
  }

  private async loadGroups(): Promise<void> {
    try {
      this.updateStatus('Loading groups...');
      this.groups = await fetchGroups();
      this.populateGroupSelect();
      this.updateStatus('Select a group to view streams');
    } catch (error) {
      console.error('Failed to load groups:', error);
      this.updateStatus('Failed to load stream groups. Please try again.');
    }
  }

  private populateGroupSelect(): void {
    this.groupSelect.innerHTML = '<option value="">Select a group...</option>';
    for (const group of this.groups) {
      const option = document.createElement('option');
      option.value = group.name;
      option.textContent = `${group.name} (${group.streams.length})`;
      this.groupSelect.appendChild(option);
    }
  }

  private async setupRenderer(): Promise<void> {
    this.streamList.innerHTML = '';
    this.streamList.style.position = 'relative';

    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.streamList.appendChild(this.canvas);

    const statusOverlay = document.createElement('div');
    statusOverlay.id = 'status-overlay';
    statusOverlay.style.position = 'absolute';
    statusOverlay.style.top = '0';
    statusOverlay.style.left = '0';
    statusOverlay.style.width = '100%';
    statusOverlay.style.height = '100%';
    statusOverlay.style.pointerEvents = 'none';
    statusOverlay.style.display = 'flex';
    statusOverlay.style.justifyContent = 'center';
    statusOverlay.style.alignItems = 'center';
    statusOverlay.style.color = 'white';
    statusOverlay.style.fontSize = '1.2em';
    this.streamList.appendChild(statusOverlay);

    try {
      this.renderer = new StreamSelectorRenderer(this.canvas);
      await this.renderer.init();

      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas!.getBoundingClientRect();
        const y = e.clientY - rect.top;

        const stream = this.renderer!.getStreamAt(y);
        if (stream) {
          this.onStreamSelect?.(stream);
        }
      });
    } catch (e) {
      console.error('WebGPU Stream Selector init failed', e);
      this.streamList.textContent = 'WebGPU not supported or failed to init.';
    }
  }

  private setupEventListeners(): void {
    this.groupSelect.addEventListener('change', () => this.onGroupChange());
    this.searchInput.addEventListener('input', () => this.onSearchChange());
  }

  private updateStatus(message: string): void {
    const overlay = document.getElementById('status-overlay');
    if (overlay) {
      overlay.textContent = message;
    }
  }

  private onGroupChange(): void {
    const groupName = this.groupSelect.value;
    const selectedGroup = this.groups.find(g => g.name === groupName);

    if (!selectedGroup) {
      this.streams = [];
      this.filteredStreams = [];
      this.renderer?.setStreams([]);
      this.updateStatus('Select a group to view streams');
      return;
    }

    this.streams = selectedGroup.streams;
    this.applySearch();
  }

  private onSearchChange(): void {
    this.applySearch();
  }

  private applySearch(): void {
    const query = this.searchInput.value.toLowerCase().trim();

    if (!query) {
      this.filteredStreams = this.streams;
    } else {
      this.filteredStreams = this.streams.filter(stream =>
        stream.name.toLowerCase().includes(query) ||
        (stream.tvgId && stream.tvgId.toLowerCase().includes(query))
      );
    }

    if (this.filteredStreams.length === 0) {
      this.updateStatus(this.streams.length === 0 ? 'No streams loaded' : 'No streams match your search');
    } else {
      this.updateStatus('');
    }

    const displayStreams = this.filteredStreams.slice(0, 200); // Increased limit
    this.renderer?.setStreams(displayStreams);
  }

  onSelect(callback: (stream: Stream) => void): void {
    this.onStreamSelect = callback;
  }

  getStreams(): Stream[] {
    return this.streams;
  }
}
