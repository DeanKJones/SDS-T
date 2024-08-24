import { vec3, mat4, quat } from "gl-matrix";
import { Deg2Rad } from "../math/deg_to_rad";

export class Camera {

    position: vec3;
    orientation: quat;
    viewMatrix: mat4;
    yaw: number;
    pitch: number;
    projectionMatrix: mat4;
    forwards: vec3;
    right: vec3;
    up: vec3;

    constructor(position: vec3, theta: number, phi: number) {
        this.position = position;
        this.orientation = quat.create();
        quat.rotateX(this.orientation, this.orientation, Deg2Rad(phi));
        quat.rotateY(this.orientation, this.orientation, Deg2Rad(theta));
        this.yaw = 0;
        this.pitch = 0;
        this.forwards = [0, 0, -1]; // Default forward direction
        this.up = [0, 1, 0]; // Default up direction
        this.right = [1, 0, 0]; // Default right direction
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
    }

    calculateViewMatrix() {
        // Calculate forward vector
        vec3.set(this.forwards, 0, 0, -1);
        vec3.transformQuat(this.forwards, this.forwards, this.orientation);

        // Calculate right vector
        vec3.set(this.right, 1, 0, 0);
        vec3.transformQuat(this.right, this.right, this.orientation);
        // Calculate up vector
        vec3.cross(this.up, this.right, this.forwards);

        // Calculate target position
        let target = vec3.create();
        vec3.add(target, this.position, this.forwards);
        // Create view matrix
        mat4.lookAt(this.viewMatrix, this.position, target, this.up);
    }

    calculateProjectionMatrix(aspectRatio: number, fov: number, near: number, far: number) {
        const mat = mat4.perspective(this.projectionMatrix, fov, aspectRatio, near, far);
        return mat;
    }

    updateMatrices(aspectRatio: number, fov: number, near: number, far: number) {
        this.calculateViewMatrix();
        this.calculateProjectionMatrix(aspectRatio, fov, near, far);
    }

    rotate(dX: number, dY: number) {
        // Update yaw and pitch
        this.yaw += Deg2Rad(-dX);
        this.pitch += Deg2Rad(-dY);

        // Clamp pitch to avoid flipping
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));

        // Reconstruct orientation quaternion
        quat.identity(this.orientation);
        quat.rotateY(this.orientation, this.orientation, this.yaw);
        quat.rotateX(this.orientation, this.orientation, this.pitch);

        // Update the camera direction
        this.calculateViewMatrix();
    }

    move(direction: number, amount: number) {
        if (direction == 0) {
            vec3.scaleAndAdd(this.position, this.position, this.right, amount);
        }
        if (direction == 1) {
            vec3.scaleAndAdd(this.position, this.position, this.up, amount);
        }
        if (direction == 2) {
            vec3.scaleAndAdd(this.position, this.position, this.forwards, amount);
        }
        // Update the camera direction display
        this.calculateViewMatrix();
    }
}