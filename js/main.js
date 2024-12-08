class ARNavigationApp {
    constructor() {
        this.initialized = false;
        this.setupInitialButton();
        this.videoElement = null;
    }

    setupInitialButton() {
        const startButton = document.getElementById('startAR');
        startButton.disabled = false;
        startButton.addEventListener('click', async () => {
            startButton.disabled = true;
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

            // Initialize AR after camera permission
            await this.initAR();
            
            // Show controls after successful initialization
            document.getElementById('controls').style.display = 'flex';
            document.getElementById('initial-prompt').style.display = 'none';

        } catch (error) {
            this.showError(error.message);
            document.getElementById('startAR').disabled = false;
        }
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    async requestCameraPermission() {
        try {
            // Create video element if it doesn't exist
            if (!this.videoElement) {
                this.videoElement = document.createElement('video');
                this.videoElement.id = 'camera-preview';
                this.videoElement.playsInline = true;
                this.videoElement.style.position = 'fixed';
                this.videoElement.style.top = '0';
                this.videoElement.style.left = '0';
                this.videoElement.style.width = '100%';
                this.videoElement.style.height = '100%';
                this.videoElement.style.objectFit = 'cover';
                document.body.appendChild(this.videoElement);
            }

            // Request camera stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: window.innerWidth },
                    height: { ideal: window.innerHeight }
                },
                audio: false
            });

            // Attach stream to video element
            this.videoElement.srcObject = stream;
            await this.videoElement.play();
            
            this.updateStatus('Camera access granted!');
            return true;
        } catch (error) {
            console.error('Camera permission error:', error);
            this.showError('Camera permission denied. Please allow camera access and try again.');
            return false;
        }
    }

    async initAR() {
        if (!navigator.xr) {
            throw new Error('WebXR not supported on this browser');
        }

        try {
            const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
            if (!isSupported) {
                throw new Error('AR not supported on this device');
            }

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

            // Hide video element when AR starts
            if (this.videoElement) {
                this.videoElement.style.display = 'none';
            }

            // Enable controls
            document.getElementById('startMapping').disabled = false;
            document.getElementById('addPoint').disabled = false;

            this.updateStatus('AR started - Point your camera at the floor');

            // Handle session end
            session.addEventListener('end', () => {
                this.updateStatus('AR session ended');
                if (this.videoElement) {
                    this.videoElement.style.display = 'block';
                }
                location.reload();
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
}

// Initialize when the page is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ARNavigationApp();
}); 