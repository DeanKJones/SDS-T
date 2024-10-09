import { Camera } from "../camera";
import { VoxelObject } from "../voxel/voxelObject";
import { BVH } from "../bvh/bvh";

export class SceneData {

    voxelObjects: VoxelObject[];
    voxelIndices: number[];

    totalVoxelCount: number;
    sceneObjectCount: number;
    sceneBVH: BVH;

    camera: Camera;

    constructor() {
        this.voxelObjects = [];
        this.voxelIndices = [];

        this.totalVoxelCount = 0;
        this.sceneObjectCount = 0;
        this.sceneBVH = new BVH();

        this.camera = new Camera([0, 0, 0], 0, 0);
    }

    buildSceneBVH() {
        this.sceneBVH.buildBVH(this.voxelObjects);
    }

    addVoxelObject(voxelObject: VoxelObject) {
        this.voxelObjects.push(voxelObject);
        this.sceneObjectCount = this.voxelObjects.length;

        // Here you would also update your BVH or other acceleration structures
    }

    updateSceneDataTransforms() {
        for (const voxelObject of this.voxelObjects) {
            voxelObject.updateTransform();
        }
    }

    getVoxelCount() {
        this.totalVoxelCount = 0;
        for (const voxelObject of this.voxelObjects) {
            this.totalVoxelCount += voxelObject.voxels.length;
        }
        return this.totalVoxelCount;
    }

    renderUI(ctx: CanvasRenderingContext2D) {
        if (!ctx) return;
    
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
        // Header style
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
    
        // Scene Parameters Header
        ctx.fillText('Scene Parameters', 10, 10);
    
        // Regular text style
        ctx.font = '12px Arial';
    
        // Scene Parameters 
        ctx.fillText(`Nodes Used: ${this.sceneBVH.nodesUsed}`, 10, 60);
    
        // Convert Float32Array to regular array before using map
        const cameraPosition = Array.from(this.camera.position).map(coord => coord.toFixed(2)).join(', ');
        const cameraOrientation = Array.from(this.camera.orientation).map(coord => coord.toFixed(2)).join(', ');
        const cameraForward = Array.from(this.camera.forwards).map(coord => coord.toFixed(2)).join(', ');
    
        // Camera Parameters Header
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Camera Parameters', 10, 90);
    
        // Regular text style
        ctx.font = '12px Arial';
    
        // Camera Parameters
        ctx.fillText(`Position: ${cameraPosition}`, 10, 120);
        ctx.fillText(`Orientation: ${cameraOrientation}`, 10, 140);
        ctx.fillText(`Forward: ${cameraForward}`, 10, 160);
    }
}