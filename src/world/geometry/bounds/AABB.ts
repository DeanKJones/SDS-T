import { vec3 } from "gl-matrix";

export interface AABB {
    min: vec3;
    max: vec3;
}