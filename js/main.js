class ARNavigationApp {
    constructor() {
        this.initialized = false;
        this.isMapping = false;
        this.isNavigating = false;
        
        // Components
        this.tracker = null;
        this.navigator = null;
        this.mapper = null;
        
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Add device checks
        this.checkDeviceCompatibility().then(supported => {
            if (supported) {
                this.init();
            }
        });
    }

    async init() {
        try {
            // Check AR support
            if (!await Utils.checkARSupport()) {
                throw new Error('AR not supported');
            }

            // Initialize components
            this.initializeComponents();
            this.setupEventListeners();
            this.updateStatus('Ready to start AR');
            
            document.getElementById('startAR').disabled = false;

        } catch (error) {
            this.updateStatus(`Error: ${error.message}`);
            console.error(error);
        }
    }

    initializeComponents() {
        // Initialize Three.js
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Initialize other components
        this.tracker = new FeatureTracker();
        this.navigator = new NavigationSystem();
        this.mapper = new RoomMapper(this.scene);
    }

    setupEventListeners() {
        document.getElementById('startAR').addEventListener('click', () => this.startAR());
        document.getElementById('startMapping').addEventListener('click', () => this.startMapping());
        document.getElementById('addPoint').addEventListener('click', () => this.addPoint());
        document.getElementById('destinations').addEventListener('change', (e) => this.setDestination(e.target.value));
    }

    async startAR() {
        try {
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor', 'hit-test']
            });
            
            this.renderer.xr.enabled = true;
            await this.renderer.xr.setSession(session);
            
            document.getElementById('startMapping').disabled = false;
            this.updateStatus('AR started');
            
            this.startRenderLoop();
        } catch (error) {
            this.updateStatus('Failed to start AR');
            console.error(error);
        }
    }

    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }

    async checkDeviceCompatibility() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile) {
            this.updateStatus("Please use a mobile device");
            return false;
        }

        // Add orientation check
        window.addEventListener('orientationchange', () => {
            this.handleOrientation();
        });

        return await checkDeviceCompatibility();
    }

    handleOrientation() {
        if (window.orientation === 0) {
            this.updateStatus("Please rotate your device to landscape mode");
        }
    }
}

// Start the application
window.onload = () => {
    window.app = new ARNavigationApp();
}; 