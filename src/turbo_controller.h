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

struct TurboConfig {
    bool enabled;
    uint8_t speed_cps; // 2..30 Clicks Per Second (default: 8)
    bool humanize;     // Natural ±15% timing jitter (anti-cheat safe)
    uint8_t mask;      // Enabled turbo buttons bitmask
};

void turbo_controller_init();
TurboConfig const &turbo_controller_get_config();
void turbo_controller_set_config(bool enabled, uint8_t speed_cps, bool humanize, uint8_t buttons_mask);
uint8_t turbo_controller_get_mask();
void turbo_controller_set_mask(uint8_t mask);
void turbo_controller_set_speed(uint8_t speed_cps);
void turbo_controller_set_humanize(bool humanize);
void turbo_controller_toggle_button(uint8_t turbo_button_bit);
void turbo_controller_process_report(uint8_t *report, uint16_t len, uint32_t now_us, bool home_raw);
void turbo_controller_loop();

#endif // DS5_BRIDGE_TURBO_CONTROLLER_H
