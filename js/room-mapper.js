class RoomMapper {
    constructor(scene) {
        this.scene = scene;
        this.points = new Map();
        this.isMapping = false;
        
        this.pointVisuals = new THREE.Group();
        this.scene.add(this.pointVisuals);
    }

    startMapping() {
        this.isMapping = true;
        document.getElementById('addPoint').disabled = false;
    }

    stopMapping() {
        this.isMapping = false;
        document.getElementById('addPoint').disabled = true;
        this.saveMap();
    }

    addPoint(position, name) {
        const pointId = name || `point_${this.points.size}`;
        
        this.points.set(pointId, {
            position: position,
            connections: []
        });

        this.addPointVisual(position, pointId);
        this.updateDestinationsList();
    }

    addPointVisual(position, id) {
        const geometry = new THREE.SphereGeometry(0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const sphere = new THREE.Mesh(geometry, material);
        
        sphere.position.copy(position);
        sphere.userData.id = id;
        
        this.pointVisuals.add(sphere);
    }

    updateDestinationsList() {
        const select = document.getElementById('destinations');
        select.innerHTML = '<option value="">Select Destination</option>';
        
        this.points.forEach((point, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            select.appendChild(option);
        });
        
        select.disabled = false;
    }

    saveMap() {
        const mapData = {
            points: Array.from(this.points.entries()),
            timestamp: Date.now()
        };
        
        localStorage.setItem('roomMap', JSON.stringify(mapData));
    }

    loadMap() {
        const mapData = localStorage.getItem('roomMap');
        if (mapData) {
            const { points } = JSON.parse(mapData);
            points.forEach(([id, data]) => {
                this.addPoint(new THREE.Vector3().copy(data.position), id);
            });
        }
    }
} 