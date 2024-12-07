class Utils {
    static async checkARSupport() {
        if (!navigator.xr) {
            throw new Error('WebXR not available');
        }

        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!supported) {
            throw new Error('AR not supported on this device');
        }

        return true;
    }

    static createVector3(x, y, z) {
        return new THREE.Vector3(x, y, z);
    }

    static calculateDistance(point1, point2) {
        return point1.distanceTo(point2);
    }

    static degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
} 