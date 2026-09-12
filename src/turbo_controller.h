#ifndef DS5_BRIDGE_TURBO_CONTROLLER_H
#define DS5_BRIDGE_TURBO_CONTROLLER_H

#include <cstdint>

enum TurboButton : uint8_t {
    TurboCross    = (1 << 0),
    TurboCircle   = (1 << 1),
    TurboSquare   = (1 << 2),
    TurboTriangle = (1 << 3),
    TurboL1       = (1 << 4),
    TurboR1       = (1 << 5),
    TurboL2       = (1 << 6),
    TurboR2       = (1 << 7),
};

void turbo_controller_init();
uint8_t turbo_controller_get_mask();
void turbo_controller_set_mask(uint8_t mask);
void turbo_controller_toggle_button(uint8_t turbo_button_bit);

// Process and apply rapid fire oscillation to active buttons in the DualSense controller report
void turbo_controller_process_report(uint8_t *report, uint16_t len, uint32_t now_us);

// Service loop for timed haptic confirmation
void turbo_controller_loop();

#endif // DS5_BRIDGE_TURBO_CONTROLLER_H
