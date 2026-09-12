#ifndef DS5_BRIDGE_TOUCHPAD_MOUSE_H
#define DS5_BRIDGE_TOUCHPAD_MOUSE_H

#include <cstdint>
#include "controller_state.h"

// Standard USB HID Mouse Report Structure matching Report ID 2
struct __attribute__((packed)) TouchpadMouseReport {
    uint8_t buttons; // Bit 0: Left, Bit 1: Right, Bit 2: Middle
    int8_t x;        // Relative X delta (-127 .. 127)
    int8_t y;        // Relative Y delta (-127 .. 127)
    int8_t wheel;    // Scroll wheel delta (-127 .. 127)
    int8_t pan;      // Horizontal scroll (0)
};

// Initialize touchpad mouse state
void touchpad_mouse_init();

// Toggle between Gamepad mode and Laptop Touchpad mode. Returns true if Laptop mode is now active.
bool touchpad_mouse_toggle();

// Returns whether Laptop Touchpad mode is currently active
bool touchpad_mouse_is_active();

// Explicitly set whether Laptop Touchpad mode is active
void touchpad_mouse_set_active(bool active);

// Process incoming touch points and physical click state from DualSense report.
void touchpad_mouse_process_touch(
    BridgeTouchPoint const *points,
    uint8_t count,
    bool physical_click,
    uint32_t now_us
);

// Service loop called from main/companion loop to dispatch mouse reports over TinyUSB HID
void touchpad_mouse_loop();

#endif // DS5_BRIDGE_TOUCHPAD_MOUSE_H
