#ifndef DS5_BRIDGE_TOUCHPAD_ZONE_H
#define DS5_BRIDGE_TOUCHPAD_ZONE_H

#include <cstdint>

enum TouchpadZoneId : uint8_t {
    TouchpadZoneNone = 0,
    TouchpadZone1 = 1, // Top-Left Quadrant
    TouchpadZone2 = 2, // Top-Right Quadrant
    TouchpadZone3 = 3, // Bottom-Left Quadrant
    TouchpadZone4 = 4, // Bottom-Right Quadrant
};

enum TouchpadZoneTargetButton : uint8_t {
    TouchpadTargetDisabled = 0,
    TouchpadTargetTriangle = 1,
    TouchpadTargetCircle = 2,
    TouchpadTargetCross = 3,
    TouchpadTargetSquare = 4,
    TouchpadTargetL1 = 5,
    TouchpadTargetR1 = 6,
    TouchpadTargetL2 = 7,
    TouchpadTargetR2 = 8,
    TouchpadTargetL3 = 9,
    TouchpadTargetR3 = 10,
    TouchpadTargetDpadUp = 11,
    TouchpadTargetDpadRight = 12,
    TouchpadTargetDpadDown = 13,
    TouchpadTargetDpadLeft = 14,
    TouchpadTargetCreate = 15,
    TouchpadTargetOptions = 16,
    TouchpadTargetHome = 17,
    TouchpadTargetTouchpadClick = 18, // Normal physical click passthrough
};

inline bool touchpad_zone_valid_target(uint8_t target) {
    return target <= TouchpadTargetTouchpadClick;
}

enum TouchpadOperatingMode : uint8_t {
    TouchpadOperatingModeZones = 0,
    TouchpadOperatingModeSwipe = 1,
};

enum TouchpadGestureActionType : uint8_t {
    TouchpadGestureActionShortcut = 0,
    TouchpadGestureActionMedia = 1,
    TouchpadGestureActionCustomKeys = 2,
    TouchpadGestureActionButton = 3,
};

struct TouchpadZoneConfig {
    bool enabled;
    uint8_t deadzone_percent; // e.g. 50 (radius = 150px around 960, 540)
    TouchpadZoneTargetButton zone_targets[4]; // Index 0..3 corresponds to Zone 1..4
    TouchpadOperatingMode mode;
    uint8_t gesture_sequence_len;
    uint8_t gesture_sequence[6];
    TouchpadGestureActionType gesture_action_type;
    TouchpadZoneTargetButton gesture_target_button;
};

// Initialize touchpad zone remapping with default configuration
void touchpad_zone_init();

// Check if 4-zone touchpad remapping is enabled
bool touchpad_zone_is_enabled();

// Set enabled state
void touchpad_zone_set_enabled(bool enabled);

// Toggle enabled state, returns new state
bool touchpad_zone_toggle();

// Get current configuration
TouchpadZoneConfig const &touchpad_zone_get_config();

// Set entire configuration
void touchpad_zone_set_config(TouchpadZoneConfig const &config);

// Set target button for a specific zone (zone_1_to_4: 1..4)
void touchpad_zone_set_target(uint8_t zone_1_to_4, TouchpadZoneTargetButton target);

// Pure coordinate calculation for DualSense (X: 0..1920, Y: 0..1080)
TouchpadZoneId touchpad_zone_detect(uint16_t x, uint16_t y, uint8_t deadzone_percent);

// Process controller input report: injects remapped button when touchpad is pressed
void touchpad_zone_process_report(uint8_t *report, uint16_t len);

#endif // DS5_BRIDGE_TOUCHPAD_ZONE_H
