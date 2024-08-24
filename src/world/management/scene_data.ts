import { Camera } from "../camera";
import { Node } from "../bvh/node";
import { Voxel } from "../voxel/voxel";

export class SceneData {

    voxels: Voxel[];
    voxelCount: number;
    voxelIndices: number[];

    camera: Camera;
    nodes: Node[];
    nodesUsed: number;

    constructor() {
        this.voxels = [];
        this.voxelCount = 0;
        this.voxelIndices = [];
        this.camera = new Camera([0, 0, 0], 0, 0);
        this.nodes = [];
        this.nodesUsed = 0;
    }

    addVoxelObject(voxelObject: Voxel) {
        this.voxels.push(voxelObject);
        this.voxelCount += voxelObject.numberOfVoxels;

        // Here you would also update your BVH or other acceleration structures
    }

    updateVoxelObjectTransforms() {
        for (const voxelObject of this.voxels) {
            if (!voxelObject.parent) {
                voxelObject.updateTransform();
            }
        }
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
        ctx.fillText(`Nodes Used: ${this.nodesUsed}`, 10, 60);
    
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