class ARNavigationApp {
    constructor() {
        this.initialized = false;
        this.videoElement = null;
        this.stream = null;
        // Request camera permission immediately
        this.initializeCamera();
    }

    async initializeCamera() {
        try {
            // Check if it's a mobile device
            if (!this.isMobileDevice()) {
                throw new Error('Please use a mobile device');
            }

            this.updateStatus('Requesting camera permission...');

            // Get video element
            this.videoElement = document.getElementById('camera-feed');
            
            // Request camera access immediately
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: window.innerWidth },
                    height: { ideal: window.innerHeight }
                },
                audio: false
            });

            // Show video feed
            this.videoElement.srcObject = this.stream;
            this.videoElement.style.display = 'block';
            document.getElementById('camera-container').style.display = 'block';
            
            // Wait for video to start playing
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play()
                        .then(resolve)
                        .catch(e => {
                            this.showError('Failed to play camera feed: ' + e.message);
                        });
                };
            });

            this.updateStatus('Camera started successfully!');
            document.getElementById('initial-prompt').style.display = 'none';
            document.getElementById('controls').style.display = 'flex';
            
            // Enable AR button after camera is working
            const startARButton = document.getElementById('startAR');
            startARButton.textContent = 'Start AR';
            startARButton.disabled = false;
            startARButton.addEventListener('click', () => this.initAR());

        } catch (error) {
            console.error('Camera start error:', error);
            if (error.name === 'NotAllowedError') {
                this.showError('Camera permission denied. Please allow camera access and reload the page.');
            } else {
                this.showError('Failed to start camera: ' + error.message);
            }
        }
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
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
            });

        } catch (error) {
            this.showError('Failed to start AR: ' + error.message);
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

    cleanup() {
        // Stop camera stream if it exists
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    }
}

// Initialize when the page is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ARNavigationApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.cleanup();
    }
}); 