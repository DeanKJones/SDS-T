import { mat4, vec3, vec4 } from 'gl-matrix';
import { Voxel } from './voxel';
import { AABB } from '../geometry/bounds/AABB';

export class VoxelObject {
    id!: string;
    transform!: mat4;
    voxels!: Voxel[];
    aabb!: AABB;
    pallet!: Array<vec4>;

    constructor(id: string, 
                voxels: Voxel[], 
                pallet: Array<vec4>) 
                {
            this.id = id;
            this.voxels = voxels;
            this.pallet = pallet;

            this.transform = mat4.create();
            this.aabb = this.updateBounds();
    }   

    objectVoxelCount() {
        return this.voxels.length;
    }

    voxelTransform(voxelIndex: number, transform: mat4) {
        const voxel = this.voxels[voxelIndex];
        const position = vec3.fromValues(voxel.x, voxel.y, voxel.z);
        vec3.transformMat4(position, position, transform);
        voxel.x = position[0];
        voxel.y = position[1];
        voxel.z = position[2];
    }

    updateTransform(transform?: mat4) {
        if (transform) {
            this.transform = transform;
        }
        for (let i = 0; i < this.voxels.length; i++) {
            this.voxelTransform(i, this.transform);
        }
        this.updateBounds();
    }

    updateBounds() {

        if (!this.aabb) {
            this.aabb = {
                min: vec3.create(),
                max: vec3.create()
            };
        }

        this.aabb.min = vec3.fromValues(Infinity, Infinity, Infinity);
        this.aabb.max = vec3.fromValues(-Infinity, -Infinity, -Infinity);
    
        const halfSize = 1 / 2;
    
        for (let i = 0; i < this.voxels.length; i++) {
            const voxel = this.voxels[i];
            const position = vec3.fromValues(voxel.x, voxel.y, voxel.z);
    
            const minPosition = vec3.fromValues(
                position[0] - halfSize,
                position[1] - halfSize,
                position[2] - halfSize
            );
    
            const maxPosition = vec3.fromValues(
                position[0] + halfSize,
                position[1] + halfSize,
                position[2] + halfSize
            );
    
            vec3.min(this.aabb.min, this.aabb.min, minPosition);
            vec3.max(this.aabb.max, this.aabb.max, maxPosition);
        }
        return this.aabb;
    }
}