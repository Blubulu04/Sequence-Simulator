// 요청하신 물리적 핀 배치(상단: 6-5-4-3, 하단: 7-8-1-2) 규격을 완벽하게 반영했습니다.
const COMP_CONFIG = {
    'L': { w: 90, h: 60, pins: [{ id: '0', x: 45, y: 60, label: 'L' }] },
    'N': { w: 90, h: 60, pins: [{ id: '0', x: 45, y: 0, label: 'N' }] },
    'LAMP': { w: 120, h: 80, pins: [{ id: '0', x: 35, y: 0, label: 'IN' }, { id: '1', x: 85, y: 0, label: 'OUT' }] },
    'PB_NO': { w: 120, h: 80, pins: [{ id: '0', x: 35, y: 0, label: 'NO_1' }, { id: '1', x: 85, y: 0, label: 'NO_2' }] },
    'PB_NC': { w: 120, h: 80, pins: [{ id: '0', x: 35, y: 0, label: 'NC_1' }, { id: '1', x: 85, y: 0, label: 'NC_2' }] },
    'RELAY': { 
        w: 240, h: 120, 
        pins: [
            // 상단 핀 배열 (6, 5, 4, 3순으로 배치하여 글자 겹침을 방지하고 가독성을 확보)
            { id: '6', x: 35, y: 0, label: '6(NC)' }, { id: '5', x: 90, y: 0, label: '5(NO)' }, 
            { id: '4', x: 145, y: 0, label: '4(NO)' }, { id: '3', x: 205, y: 0, label: '3(NC)' },
            // 하단 핀 배열 (7, 8, 1, 2순으로 배치)
            { id: '7', x: 35, y: 120, label: '7(Coil)' }, { id: '8', x: 90, y: 120, label: '8(COM)' }, 
            { id: '1', x: 145, y: 120, label: '1(COM)' }, { id: '2', x: 205, y: 120, label: '2(Coil)' }
        ] 
    }
};

class Component {
    constructor(type, x, y) {
        this.id = type + '_' + Date.now();
        this.type = type;
        this.x = x;
        this.y = y;
        this.w = COMP_CONFIG[type].w;
        this.h = COMP_CONFIG[type].h;
        this.pins = COMP_CONFIG[type].pins;
        
        this.energized = false;
        this.pressed = false; 
    }

    getPinAbs(pinId) {
        const pin = this.pins.find(p => p.id === pinId);
        return { x: this.x + pin.x, y: this.y + pin.y };
    }
}