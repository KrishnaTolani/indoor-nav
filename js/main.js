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
        
        // Initialize WebXR polyfill
        this.initWebXRPolyfill();
        
        // Initialize immediately
        this.initializeApp();
    }

    initWebXRPolyfill() {
        if (window.WebXRPolyfill) {
            new WebXRPolyfill();
        }
    }

    async initializeApp() {
        const status = document.getElementById('status');
        const errorMessage = document.getElementById('error-message');
        const instructions = document.getElementById('instructions');

        try {
            // First check if it's a mobile device
            if (!this.isMobileDevice()) {
                throw new Error('Please use a mobile device');
            }

            // Check if we're on HTTPS
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                throw new Error('AR requires HTTPS');
            }

            // Check AR compatibility
            const arSupported = await this.checkARCompatibility();
            if (!arSupported) {
                throw new Error('AR not supported on this device');
            }

            // Request camera permission
            const cameraGranted = await this.requestCameraPermission();
            if (!cameraGranted) {
                throw new Error('Camera permission is required');
            }

            // Hide instructions after successful initialization
            instructions.style.display = 'none';

            // Initialize the rest of the app
            await this.init();

        } catch (error) {
            errorMessage.textContent = error.message;
            status.textContent = 'Setup failed';
            console.error(error);
        }
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    async checkARCompatibility() {
        const status = document.getElementById('status');
        
        if (!('xr' in navigator)) {
            status.textContent = 'WebXR not supported. Please use Chrome on Android or Safari on iOS.';
            return false;
        }

        try {
            const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
            if (isSupported) {
                status.textContent = 'AR is supported! Please allow camera access.';
                return true;
            } else {
                status.textContent = 'AR is not supported on this device/browser.';
                return false;
            }
        } catch (error) {
            status.textContent = `Error checking AR support: ${error.message}`;
            return false;
        }
    }

    async requestCameraPermission() {
        const status = document.getElementById('status');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Use back camera
                } 
            });
            stream.getTracks().forEach(track => track.stop());
            status.textContent = 'Camera permission granted!';
            return true;
        } catch (error) {
            status.textContent = 'Camera permission denied. Please allow camera access.';
            return false;
        }
    }

    async startAR() {
        try {
            // Check if XR is available
            if (!navigator.xr) {
                throw new Error('WebXR not available');
            }

            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor', 'hit-test'],
                optionalFeatures: ['dom-overlay', 'light-estimation'],
                domOverlay: { root: document.getElementById('app') }
            });
            
            // Configure renderer for AR
            this.renderer.xr.enabled = true;
            this.renderer.xr.setReferenceSpaceType('local-floor');
            await this.renderer.xr.setSession(session);
            
            // Enable controls after AR starts
            document.getElementById('startMapping').disabled = false;
            this.updateStatus('AR started - Point your camera at the floor');
            
            // Start render loop
            this.renderer.setAnimationLoop((timestamp, frame) => {
                this.render(timestamp, frame);
            });

            // Add session end handler
            session.addEventListener('end', () => {
                this.updateStatus('AR session ended');
                this.renderer.setAnimationLoop(null);
                this.renderer.xr.enabled = false;
            });

        } catch (error) {
            this.updateStatus('Failed to start AR: ' + error.message);
            console.error(error);
        }
    }

    render(timestamp, frame) {
        if (frame) {
            // Handle AR frame updates here
            const pose = frame.getViewerPose(this.renderer.xr.getReferenceSpace());
            if (pose) {
                // Update camera and scene based on pose
                // ... your AR rendering code ...
            }
        }
        this.renderer.render(this.scene, this.camera);
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

// Initialize the app when the page loads
window.onload = () => {
    // Ensure DOM is fully loaded
    if (document.readyState === 'complete') {
        window.app = new ARNavigationApp();
    } else {
        window.addEventListener('load', () => {
            window.app = new ARNavigationApp();
        });
    }
}; 