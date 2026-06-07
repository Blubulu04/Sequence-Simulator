class Wire {
    constructor(startCompId, startPinId) {
        this.id = 'wire_' + Date.now();
        this.startComp = startCompId;
        this.startPin = startPinId;
        this.endComp = null;
        this.endPin = null;
        this.waypoints = []; 
        this.energized = false;
    }
}

function getComp(id) {
    return components.find(c => c.id === id);
}

function getWirePath(wire) {
    const sc = getComp(wire.startComp);
    if (!sc) return [];
    
    const startPos = sc.getPinAbs(wire.startPin);
    const path = [startPos, ...wire.waypoints];
    
    if (wire.endComp) {
        const ec = getComp(wire.endComp);
        if (ec) path.push(ec.getPinAbs(wire.endPin));
    }
    return path;
}