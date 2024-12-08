class ARController {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.currentFacingMode = 'environment';
    }

    async initializeCamera(videoElement) {
        this.videoElement = videoElement;
        try {
            // First check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support camera access');
            }

            // Try environment camera first
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: this.currentFacingMode
                    }
                });
            } catch (e) {
                // If environment camera fails, try any available camera
                this.stream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });
            }

            // Set up video element
            this.videoElement.srcObject = this.stream;
            this.videoElement.style.display = 'block';
            
            // Wait for video to be ready
            await new Promise((resolve, reject) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play()
                        .then(resolve)
                        .catch(reject);
                };
                this.videoElement.onerror = reject;
            });

            return true;
        } catch (error) {
            console.error('Camera initialization error:', error);
            if (error.name === 'NotAllowedError') {
                throw new Error('Camera access denied. Please allow camera access and try again.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No camera found on your device.');
            } else if (error.name === 'NotReadableError') {
                throw new Error('Camera is already in use by another application.');
            } else {
                throw new Error('Failed to start camera: ' + error.message);
            }
        }
    }

    async switchCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
        return this.initializeCamera(this.videoElement);
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
} 