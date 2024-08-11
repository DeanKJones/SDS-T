import { vec3, mat4, quat } from "gl-matrix";
import { Triangle } from "./triangle";

export class Plane {
    triangles: Triangle[];
    up: vec3;
    position: vec3;
    size: number;

    constructor(up: vec3, position: vec3, size: number, color: vec3) {
        this.up = up;
        this.position = position;
        this.size = size;
        this.triangles = [];

        // Build the plane using the provided parameters
        this.buildPlane(color);
    }

    buildPlane(color: vec3) {
        // Define the vertices of a unit square in the XY plane
        const vertices: vec3[] = [
            vec3.fromValues(-0.5, -0.5, 0),
            vec3.fromValues(0.5, -0.5, 0),
            vec3.fromValues(0.5, 0.5, 0),
            vec3.fromValues(-0.5, 0.5, 0)
        ];
    
        // Create transformation matrix
        const transform = mat4.create();
        mat4.translate(transform, transform, this.position);
        mat4.scale(transform, transform, vec3.fromValues(this.size, this.size, this.size));

        // Calculate the rotation matrix to align the Z-axis with the up vector
        const rotationMatrix = this.getRotationMatrix(this.up);
        mat4.multiply(transform, transform, rotationMatrix);

        const transformedVertices = vertices.map(vertex => {
            const transformedVertex = vec3.create();
            vec3.transformMat4(transformedVertex, vertex, transform);
            return transformedVertex;
        });
    
        // Create two triangles to form a square
        const triangle1 = new Triangle(transformedVertices[0], transformedVertices[1], transformedVertices[2],color);
        this.triangles.push(triangle1);
        
        //const triangle2 = new Triangle(transformedVertices[0], transformedVertices[2], transformedVertices[3], color);
        //this.triangles.push(triangle2);
    }

    private getRotationMatrix(up: vec3): mat4 {
        const zAxis = vec3.fromValues(0, 0, 1);
        const rotationAxis = vec3.create();
        vec3.cross(rotationAxis, zAxis, up);
        vec3.normalize(rotationAxis, rotationAxis);

        const dot = vec3.dot(zAxis, up);
        const angle = Math.acos(dot / (vec3.length(zAxis) * vec3.length(up)));

        const rotationQuat = quat.create();
        quat.setAxisAngle(rotationQuat, rotationAxis, angle);

        const rotationMatrix = mat4.create();
        mat4.fromQuat(rotationMatrix, rotationQuat);

        return rotationMatrix;
    }
}