import { Renderer } from "./render/renderer.ts";
import { Scene } from "./world/scene";

export class App 
{
    canvases: Map<string, HTMLCanvasElement>;
    renderer!: Renderer;
    scene!: Scene;

    forwardsAmount: number = 0;
    rightAmount: number = 0;
    upAmount: number = 0;

    moveSpeed: number = 0.25;

    canvas_selected: boolean = false;
    
    constructor(canvases: { [key: string]: HTMLCanvasElement }) {
        this.canvases = new Map(Object.entries(canvases));
    }

    async initialize() {
        this.renderer = new Renderer(this.canvases.get("viewportMain")!);
        await this.renderer.Initialize();
        
        this.scene = await Scene.create();      // Empty Scene
        await this.scene.initialize();          // Initialize Scene
        // Initialize GFX Scene
        await this.renderer.setupScene(this.scene);
    
        this.run();

        document.addEventListener('keydown', this.handle_keypress.bind(this));
        document.addEventListener('keyup', this.handle_keyrelease.bind(this));
        document.addEventListener('wheel', this.handle_wheel.bind(this));
    
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement !== this.canvases.get("viewportMain")) {
                this.canvas_selected = false;
                console.log("Pointer unlocked");
            } else {
                this.canvas_selected = true;
                console.log("Pointer locked to viewportMain");
            }
        });

        this.canvases.get("viewportMain")!.onclick = () => {
            this.canvases.get("viewportMain")!.requestPointerLock();
        }

        this.canvases.get("viewportMain")!.addEventListener(
        "mousemove", 
        (event: MouseEvent) => {
            if (this.canvas_selected) {
                this.handle_mouse_move(event);
            }
        });
    }

    run = () => {

        var running: boolean = true;
        this.scene.update();

        for (let i = 0; i < 3; i++) {   // Here we are looping each axis as the move method is wack
            if (i == 0) this.scene.data.camera.move(i, this.rightAmount);      // Right
            if (i == 1) this.scene.data.camera.move(i, this.upAmount);         // Up
            if (i == 2) this.scene.data.camera.move(i, this.forwardsAmount);   // Forwards
        }

        // Render Viewport
        this.renderer.render(
            this.scene
        );
        // Render Scene Parameters
        const uiCameraInfoCtx = this.canvases.get("sceneParameters")!.getContext('2d');
        if (uiCameraInfoCtx) {
            this.scene.data.renderUI(uiCameraInfoCtx);
        }
        const uiRenderInfoCtx = this.canvases.get("renderParameters")!.getContext('2d');
        if (uiRenderInfoCtx) {
            this.renderer.renderUI(uiRenderInfoCtx);
        }


        // Request the next frame
        if (running) {
            requestAnimationFrame(this.run);
        }
    }

    handle_keypress(event: KeyboardEvent) {
        if (this.canvas_selected == false) return;

        if (event.code == "KeyW") {
            this.forwardsAmount = this.moveSpeed;
        }
        if (event.code == "KeyS") {
            this.forwardsAmount = -this.moveSpeed;
        }
        if (event.code == "KeyA") {
            this.rightAmount = -this.moveSpeed;
        }
        if (event.code == "KeyD") {
            this.rightAmount = this.moveSpeed;
        }
        if (event.code == "KeyE") {
            this.upAmount = this.moveSpeed;
        }
        if (event.code == "KeyQ") {
            this.upAmount = -this.moveSpeed;
        }
    }

    handle_keyrelease(event: KeyboardEvent) {
        if (this.canvas_selected == false) return;
        if (event.code == "KeyW" || event.code == "KeyS") {
            this.forwardsAmount = 0;
        }
        if (event.code == "KeyA" || event.code == "KeyD") {
            this.rightAmount = 0;
        }
        if (event.code == "KeyE" || event.code == "KeyQ") {
            this.upAmount = 0;
        }
    }

    handle_mouse_move(event: MouseEvent) {
        this.scene.data.camera.rotate(
            event.movementX / 5, event.movementY / 5
        );
    }

    handle_wheel(event: WheelEvent) {
        if (this.canvas_selected == false) return;
        if (event.deltaY < 0) {
            this.moveSpeed += 0.025; // Increase speed
        } else {
            this.moveSpeed = Math.max(0.01, this.moveSpeed - 0.01); // Decrease speed but not below 0.01
        }
    }
}