class ARNavigationApp {
    constructor() {
        this.initialized = false;
        this.setupInitialButton();
    }

    setupInitialButton() {
        const startButton = document.getElementById('startAR');
        startButton.disabled = false;
        startButton.addEventListener('click', async () => {
            // Hide the initial prompt
            document.getElementById('initial-prompt').style.display = 'none';
            await this.initializeApp();
        });
    }

    async initializeApp() {
        try {
            // Check if it's a mobile device
            if (!this.isMobileDevice()) {
                throw new Error('Please use a mobile device');
            }

            this.updateStatus('Requesting camera permission...');
            
            // Request camera permission first
            const cameraGranted = await this.requestCameraPermission();
            if (!cameraGranted) {
                throw new Error('Camera permission is required');
            }

            // Initialize AR
            await this.initAR();
            
            // Show controls after successful initialization
            document.getElementById('controls').style.display = 'flex';

        } catch (error) {
            this.showError(error.message);
        }
    }

    async initAR() {
        if (!navigator.xr) {
            throw new Error('WebXR not supported on this browser');
        }

        const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!isSupported) {
            throw new Error('AR not supported on this device');
        }

        try {
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor', 'hit-test'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: document.getElementById('app') }
            });

            // Set up Three.js
            this.setupThreeJS();

            // Start AR session
            this.renderer.xr.enabled = true;
            await this.renderer.xr.setSession(session);

            // Enable controls
            document.getElementById('startMapping').disabled = false;
            document.getElementById('addPoint').disabled = false;

            this.updateStatus('AR started - Point your camera at the floor');

            // Handle session end
            session.addEventListener('end', () => {
                this.updateStatus('AR session ended');
                location.reload(); // Reload page when AR session ends
            });

        } catch (error) {
            throw new Error('Failed to start AR: ' + error.message);
        }
    }

    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        this.updateStatus('Setup failed');
    }

    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }

    // ... rest of your existing methods ...
}

// Initialize when the page is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ARNavigationApp();
}); 