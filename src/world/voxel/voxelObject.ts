import { vec3, vec4 } from 'gl-matrix';
import { Voxel } from './voxel';
import { AABB } from '../geometry/bounds/AABB';
import { Transform } from '../../math/transform';
import { Triangle } from '../geometry/triangle';

export class VoxelObject {
    id: string;
    transform: Transform;
    voxels: Voxel[];
    aabb: AABB;
    pallet: Array<vec4>;
    voxelOffset: number;
    private originalVoxelPositions: vec3[];

    constructor(id: string, voxels: Voxel[], pallet: Array<vec4>) {
        this.id = id;
        this.voxels = voxels;
        this.pallet = pallet;
        this.voxelOffset = 0;
        this.transform = new Transform();
        
        // Store original positions
        this.originalVoxelPositions = voxels.map(voxel => 
            vec3.clone(voxel.position)
        );
        
        this.aabb = this.updateBounds();
    }

    updateTransform() {
        const transformMatrix = this.transform.getMatrix();
        
        // Update each voxel position based on the transform
        for (let i = 0; i < this.voxels.length; i++) {
            const originalPos = this.originalVoxelPositions[i];
            const newPos = vec3.create();
            vec3.transformMat4(newPos, originalPos, transformMatrix);
            
            // Update voxel position
            vec3.copy(this.voxels[i].position, newPos);
        }
        
        // Update AABB after transform
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

        const halfSize = 1.001; // Give a bit of clearance

        for (const voxel of this.voxels) {
            const position = voxel.position;

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

    // Convenience methods for transformation
    setPosition(x: number, y: number, z: number) {
        this.transform.setPosition(x, y, z);
        this.updateTransform();
    }

    setRotation(x: number, y: number, z: number) {
        this.transform.setRotationEuler(x, y, z);
        this.updateTransform();
    }

    setScale(x: number, y: number, z: number) {
        this.transform.setScale(x, y, z);
        this.updateTransform();
    }

    translate(x: number, y: number, z: number) {
        this.transform.translate(x, y, z);
        this.updateTransform();
    }

    rotate(angleInDegrees: number, axis: vec3) {
        this.transform.rotate(angleInDegrees, axis);
        this.updateTransform();
    }

    generateTriangles() {
        for (const voxel of this.voxels) {
            voxel.triangles = this.createCubeTriangles(voxel.position);
        }
    }

    createCubeTriangles(position: vec3): Triangle[] {
        // Generate triangles for a cube centered at the given position
        const triangles: Triangle[] = [];
        
        const halfSize = 0.5;
        const vertices = [
            vec3.fromValues(position[0] - halfSize, position[1] - halfSize, position[2] - halfSize),
            vec3.fromValues(position[0] + halfSize, position[1] - halfSize, position[2] - halfSize),
            vec3.fromValues(position[0] + halfSize, position[1] + halfSize, position[2] - halfSize),
            vec3.fromValues(position[0] - halfSize, position[1] + halfSize, position[2] - halfSize),
            vec3.fromValues(position[0] - halfSize, position[1] - halfSize, position[2] + halfSize),
            vec3.fromValues(position[0] + halfSize, position[1] - halfSize, position[2] + halfSize),
            vec3.fromValues(position[0] + halfSize, position[1] + halfSize, position[2] + halfSize),
            vec3.fromValues(position[0] - halfSize, position[1] + halfSize, position[2] + halfSize)
        ];

        const color = vec3.fromValues(1.0, 1.0, 1.0); // White color for the triangles

        // Front face
        triangles.push(new Triangle(vertices[0], vertices[1], vertices[2], color));
        triangles.push(new Triangle(vertices[0], vertices[2], vertices[3], color));

        // Back face
        triangles.push(new Triangle(vertices[4], vertices[6], vertices[5], color));
        triangles.push(new Triangle(vertices[4], vertices[7], vertices[6], color));

        // Top face
        triangles.push(new Triangle(vertices[3], vertices[2], vertices[6], color));
        triangles.push(new Triangle(vertices[3], vertices[6], vertices[7], color));

        // Bottom face
        triangles.push(new Triangle(vertices[0], vertices[5], vertices[1], color));
        triangles.push(new Triangle(vertices[0], vertices[4], vertices[5], color));

        // Right face
        triangles.push(new Triangle(vertices[1], vertices[5], vertices[6], color));
        triangles.push(new Triangle(vertices[1], vertices[6], vertices[2], color));

        // Left face
        triangles.push(new Triangle(vertices[0], vertices[3], vertices[7], color));
        triangles.push(new Triangle(vertices[0], vertices[7], vertices[4], color));

        return triangles;
    }
}