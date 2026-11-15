#pragma once

#include <stdint.h>

// Left-stick → discrete nav for Kitsune Bar while input is suppressed.
// Returns 0 none, 1 left, 2 right, 3 up, 4 down.

inline uint8_t kitsune_stick_nav_direction(uint8_t axis_x, uint8_t axis_y, uint8_t deadzone) {
    const int16_t stick_x = static_cast<int16_t>(axis_x) - 128;
    const int16_t stick_y = static_cast<int16_t>(axis_y) - 128;
    const uint16_t abs_x = stick_x < 0 ? static_cast<uint16_t>(-stick_x) : static_cast<uint16_t>(stick_x);
    const uint16_t abs_y = stick_y < 0 ? static_cast<uint16_t>(-stick_y) : static_cast<uint16_t>(stick_y);
    if (abs_x < deadzone && abs_y < deadzone) {
        return 0;
    }
    if (abs_x >= abs_y) {
        return stick_x < 0 ? 1 : 2;
    }
    return stick_y < 0 ? 3 : 4;
}

inline bool kitsune_stick_nav_should_fire(
    uint8_t stick_dir,
    uint8_t prev_dir,
    uint32_t now_us,
    uint32_t next_us,
    bool *out_is_repeat
) {
    if (out_is_repeat) {
        *out_is_repeat = false;
    }
    if (stick_dir == 0) {
        return false;
    }
    if (stick_dir != prev_dir) {
        return true;
    }
    if (static_cast<int32_t>(now_us - next_us) >= 0) {
        if (out_is_repeat) {
            *out_is_repeat = true;
        }
        return true;
    }
    return false;
}
