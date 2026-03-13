// X Play - Gamer Edition: Pro Gamepad Engine
const { contextBridge } = require('electron');

const scriptToInject = `
(function() {
    console.log("🎮 X Play Gamer Engine: Initiating Pro Controls...");

    const state = {
        axes: [0, 0, 0, 0], // LS-X, LS-Y, RS-X, RS-Y
        buttons: Array(17).fill(0).map(() => ({ pressed: false, value: 0 })),
        keys: new Set(),
        mouseSensitivity: 0.004,
        pointerLocked: false,
        mouseDeltaX: 0,
        mouseDeltaY: 0
    };

    // PROFESSIONAL GAMER MAPPING
    const keyMap = {
        'KeyW': { type: 'ls', axis: 1, val: -1 },
        'KeyS': { type: 'ls', axis: 1, val: 1 },
        'KeyA': { type: 'ls', axis: 0, val: -1 },
        'KeyD': { type: 'ls', axis: 0, val: 1 },
        'Space': 0,        // A (Jump)
        'KeyE': 2,         // X (Interact/Reload)
        'KeyR': 3,         // Y (Switch Weapon)
        'KeyQ': 1,         // B (Back/Melee)
        'ShiftLeft': 10,   // L3 (Sprint)
        'ControlLeft': 11, // R3 (Crouch)
        'KeyF': 4,         // L1 (LB)
        'KeyG': 5,         // R1 (RB)
        'Tab': 8,          // Share/View
        'Escape': 9        // Menu/Options
    };

    window.addEventListener('keydown', (e) => state.keys.add(e.code));
    window.addEventListener('keyup', (e) => state.keys.delete(e.code));
    
    // MOUSE MAPPING (Shooter Style)
    window.addEventListener('mousedown', (e) => {
        if (!state.pointerLocked) {
            document.body.requestPointerLock();
        } else {
            if (e.button === 0) state.buttons[7] = { pressed: true, value: 1 }; // RT (Shoot)
            if (e.button === 2) state.buttons[6] = { pressed: true, value: 1 }; // LT (Aim)
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) state.buttons[7] = { pressed: false, value: 0 };
        if (e.button === 2) state.buttons[6] = { pressed: false, value: 0 };
    });

    window.addEventListener('mousemove', (e) => {
        if (!state.pointerLocked) return;
        state.mouseDeltaX += e.movementX;
        state.mouseDeltaY += e.movementY;
    });

    document.addEventListener('pointerlockchange', () => {
        state.pointerLocked = document.pointerLockElement === document.body;
    });

    // FRAME-PERFECT LOOP
    function engineLoop() {
        // 1. Reset Movement Axes
        state.axes[0] = 0;
        state.axes[1] = 0;

        // 2. Apply Keyboard Movement (WASD -> Left Stick)
        if (state.keys.has('KeyW')) state.axes[1] = -1;
        if (state.keys.has('KeyS')) state.axes[1] = 1;
        if (state.keys.has('KeyA')) state.axes[0] = -1;
        if (state.keys.has('KeyD')) state.axes[0] = 1;

        // 3. Apply Mouse Deltas (Mouse -> Right Stick)
        // We use sensitivty and a clamp to simulate analog stick behavior
        state.axes[2] = Math.max(-1, Math.min(1, state.mouseDeltaX * state.mouseSensitivity));
        state.axes[3] = Math.max(-1, Math.min(1, state.mouseDeltaY * state.mouseSensitivity));
        
        // Rapidly decay mouse deltas to simulate stick returning to center
        state.mouseDeltaX *= 0.15;
        state.mouseDeltaY *= 0.15;

        // 4. Apply Buttons
        Object.keys(keyMap).forEach(key => {
            const mapping = keyMap[key];
            if (typeof mapping === 'number') {
                const pressed = state.keys.has(key);
                state.buttons[mapping] = { pressed, value: pressed ? 1 : 0 };
            }
        });

        requestAnimationFrame(engineLoop);
    }
    engineLoop();

    // VIRTUAL GAMEPAD OBJECT
    const vGamepad = {
        get axes() { return state.axes; },
        get buttons() { return state.buttons; },
        connected: true,
        id: "Xbox 360 Controller (X Play Gamer Edition)",
        index: 0,
        mapping: "standard",
        timestamp: Date.now()
    };

    // INJECTION
    Object.defineProperty(navigator, 'getGamepads', {
        value: function() {
            vGamepad.timestamp = Date.now();
            return [vGamepad, null, null, null];
        }
    });

    // Disable context menu to prevent accidental RMB interruptions
    window.addEventListener('contextmenu', e => e.preventDefault());

    console.log("✅ X Play Gamer Engine: Ready. Click screen to lock mouse.");
})();
`;

window.addEventListener('DOMContentLoaded', () => {
    const script = document.createElement('script');
    script.textContent = scriptToInject;
    document.documentElement.appendChild(script);
});
