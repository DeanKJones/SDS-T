import { Triangle } from "../geometry/triangle";
import { Camera } from "../camera";
import { Node } from "../bvh/node";

export class SceneData {
    triangles: Triangle[];
    triangleCount: number;
    triangleIndices: number[];

    camera: Camera;
    nodes: Node[];
    nodesUsed: number;

    constructor() {
        this.triangles = [];
        this.triangleCount = 0;
        this.triangleIndices = [];
        this.camera = new Camera([0, 0, 0], 0, 0);
        this.nodes = [];
        this.nodesUsed = 0;
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
        ctx.fillText(`Triangles: ${this.triangleCount}`, 10, 40);
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