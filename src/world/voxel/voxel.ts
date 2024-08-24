import { mat4, vec3, vec4 } from 'gl-matrix';

export class Voxel {
    id: string;
    voxels: Uint8Array; // x, y, z, colorIndex for each voxel
    size: vec3;
    transform: mat4;
    parent: Voxel | null;
    children: Voxel[];
    numberOfVoxels: number;
    pallet: Array<vec4>;

    constructor(id: string, 
                voxels: Uint8Array, 
                size: vec3, 
                numberOfVoxels: number, 
                pallet: Array<vec4>) {
        this.id = id;
        this.voxels = voxels;
        this.size = size;
        this.transform = mat4.create();
        this.parent = null;
        this.children = [];
        this.numberOfVoxels = numberOfVoxels;
        this.pallet = pallet;
    }

    addChild(child: Voxel) {
        child.parent = this;
        this.children.push(child);
    }

    removeChild(child: Voxel) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }

    updateTransform() {
        if (this.parent) {
            mat4.multiply(this.transform, this.parent.transform, this.transform);
        }
        for (const child of this.children) {
            child.updateTransform();
        }
    }
}