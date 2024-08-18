// NOT USED CURRENTLY
/*
import { Scene } from "../world/scene";

export class EventManager {
    private scene: Scene;
    private canvases: Map<string, HTMLCanvasElement>;

    private forwards_amount: number = 0;
    private right_amount: number = 0;
    private up_amount: number = 0;

    private canvas_selected: boolean = false;

    constructor(scene: Scene, canvases: Map<string, HTMLCanvasElement>) {
        this.scene = scene;
        this.canvases = new Map(Object.entries(canvases));

        const viewportMain = canvases.get("viewportMain");

        if (viewportMain) {
            document.addEventListener('keydown', this.handle_keypress.bind(this));
            document.addEventListener('keyup', this.handle_keyrelease.bind(this));
            document.addEventListener('pointerlockchange', this.handle_pointerlockchange.bind(this));

            viewportMain.onclick = () => {
                viewportMain.requestPointerLock();
            };

            viewportMain.addEventListener(
                "mousemove", 
                (event: MouseEvent) => {
                    if (!this.canvas_selected) return;
                    this.handle_mouse_move(event);
                }
            );

        } else {
            console.error("viewportMain canvas not found in the provided canvases map.");
        }
    }

    public update(scene: Scene) {
        scene.data.camera.move(0, this.right_amount);
        scene.data.camera.move(1, this.up_amount);
        scene.data.camera.move(2, this.forwards_amount);
    }

    private handle_keypress(event: KeyboardEvent) {
        if (!this.canvas_selected) return;

        if (event.code == "KeyW") {
            this.forwards_amount = 0.05;
        }
        if (event.code == "KeyS") {
            this.forwards_amount = -0.05;
        }
        if (event.code == "KeyA") {
            this.right_amount = -0.05;
        }
        if (event.code == "KeyD") {
            this.right_amount = 0.05;
        }
        if (event.code == "KeyE") {
            this.up_amount = 0.05;
        }
        if (event.code == "KeyQ") {
            this.up_amount = -0.05;
        }
    }

    private handle_keyrelease(event: KeyboardEvent) {
        if (!this.canvas_selected) return;

        if (event.code == "KeyW" || event.code == "KeyS") {
            this.forwards_amount = 0;
        }
        if (event.code == "KeyA" || event.code == "KeyD") {
            this.right_amount = 0;
        }
        if (event.code == "KeyE" || event.code == "KeyQ") {
            this.up_amount = 0;
        }
    }

    private handle_mouse_move(event: MouseEvent) {
        if (!this.canvas_selected) return;

        this.scene.data.camera.rotate(event.movementX / 5, event.movementY / 5);
    }

    //private handle_resize() {
        // TODO
    //}

    private handle_pointerlockchange() {
        if (document.pointerLockElement !== this.canvases.get("viewportMain")) {
            this.canvas_selected = false;
            console.log("Pointer unlocked");
        } else {
            this.canvas_selected = true;
            console.log("Pointer locked to viewportMain");
        }
    }
}
*/