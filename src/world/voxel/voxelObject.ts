import { mat4, vec3, vec4 } from 'gl-matrix';
import { Voxel } from './voxel';

export class VoxelObject {
    id!: string;
    transform!: mat4;
    voxels!: Voxel[];
    numberOfVoxels!: number;
    pallet!: Array<vec4>;

    constructor(id: string, 
                voxels: Voxel[], 
                numberOfVoxels: number, 
                pallet: Array<vec4>) 
                {
            this.id = id;
            this.voxels = voxels;
            this.transform = mat4.create();
            this.numberOfVoxels = numberOfVoxels;
            this.pallet = pallet;
    }   

    voxelTransform(voxelIndex: number, transform: mat4) {
        const voxel = this.voxels[voxelIndex];
        const position = vec3.fromValues(voxel.x, voxel.y, voxel.z);
        vec3.transformMat4(position, position, transform);
        voxel.x = position[0];
        voxel.y = position[1];
        voxel.z = position[2];
    }

    updateTransform() {
    }
}