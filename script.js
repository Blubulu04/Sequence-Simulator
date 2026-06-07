let mode = 'SELECT'; 
let components = [];
let wires = [];
let isSimulating = false;

let draggingItem = null; 
let currentWiring = null; 
let mousePos = { x: 0, y: 0 };
let simInterval = null;
let activePB = null; 

function setMode(newMode) {
    if (isSimulating) toggleSimulation(); 
    mode = newMode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-mode-${newMode}`).classList.add('active');
    currentWiring = null;
    render();
}

function toggleSimulation() {
    isSimulating = !isSimulating;
    const btn = document.getElementById('btn-sim');
    if (isSimulating) {
        mode = 'SELECT';
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('btn-mode-SELECT').classList.add('active');
        btn.classList.add('active');
        btn.innerText = '⏹️ 시뮬레이션 중지';
        currentWiring = null;
        simInterval = setInterval(() => { runSimulation(); render(); }, 60);
    } else {
        btn.classList.remove('active');
        btn.innerText = '▶️ 시뮬레이션 시작';
        clearInterval(simInterval);
        components.forEach(c => { c.energized = false; c.pressed = false; });
        wires.forEach(w => w.energized = false);
        activePB = null;
        render();
    }
}

function addComponent(type) {
    if (isSimulating) return;
    components.push(new Component(type, 300, 200));
    setMode('SELECT');
}

// 📱 모바일 터치와 PC 마우스 좌표를 통합해서 정확하게 계산하는 함수
function getCoords(e) {
    const svg = document.getElementById('workspace');
    const rect = svg.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function handlePointerDown(e) {
    if (!e.isPrimary) return; // 멀티터치 오류 방지
    e.target.setPointerCapture(e.pointerId); // 손가락이 부품 밖으로 살짝 나가도 계속 추적
    
    mousePos = getCoords(e);
    const target = e.target;
    const dataType = target.getAttribute('data-type');
    
    if (isSimulating) {
        if (dataType === 'comp' || dataType === 'comp-label') {
            const comp = getComp(target.getAttribute('data-id'));
            if (comp && comp.type.startsWith('PB')) {
                comp.pressed = true;
                activePB = comp;
                runSimulation();
                render();
            }
        }
        return;
    }

    if (mode === 'DELETE') {
        if (dataType === 'comp') {
            const id = target.getAttribute('data-id');
            components = components.filter(c => c.id !== id);
            wires = wires.filter(w => w.startComp !== id && w.endComp !== id);
        } else if (dataType === 'wire') {
            const id = target.getAttribute('data-id');
            wires = wires.filter(w => w.id !== id);
        } else if (dataType === 'waypoint') {
            const wId = target.getAttribute('data-wire-id');
            const wpIdx = parseInt(target.getAttribute('data-wp-index'));
            const wire = wires.find(w => w.id === wId);
            if (wire) wire.waypoints.splice(wpIdx, 1);
        }
        render();
        return;
    }

    if (mode === 'WIRE') {
        if (dataType === 'terminal') {
            const cId = target.getAttribute('data-comp');
            const pId = target.getAttribute('data-pin');
            if (!currentWiring) {
                currentWiring = new Wire(cId, pId);
            } else {
                if (currentWiring.startComp !== cId || currentWiring.startPin !== pId) {
                    currentWiring.endComp = cId;
                    currentWiring.endPin = pId;
                    wires.push(currentWiring);
                    currentWiring = null;
                }
            }
        } else if (currentWiring) {
            currentWiring.waypoints.push({ x: mousePos.x, y: mousePos.y });
        }
        render();
        return;
    }

    if (mode === 'SELECT') {
        if (dataType === 'comp' || dataType === 'comp-label') {
            const comp = getComp(target.getAttribute('data-id'));
            draggingItem = { type: 'COMP', obj: comp, offX: mousePos.x - comp.x, offY: mousePos.y - comp.y };
        } else if (dataType === 'waypoint') {
            const wire = wires.find(w => w.id === target.getAttribute('data-wire-id'));
            draggingItem = { type: 'WP', obj: wire.waypoints[target.getAttribute('data-wp-index')] };
        }
    }
}

function handlePointerMove(e) {
    if (!e.isPrimary) return;
    mousePos = getCoords(e);
    
    if (draggingItem) {
        if (draggingItem.type === 'COMP') {
            draggingItem.obj.x = mousePos.x - draggingItem.offX;
            draggingItem.obj.y = mousePos.y - draggingItem.offY;
        } else if (draggingItem.type === 'WP') {
            draggingItem.obj.x = mousePos.x;
            draggingItem.obj.y = mousePos.y;
        }
        render();
    } else if (currentWiring) {
        render();
    }
}

function handlePointerUp(e) {
    if (e.target.releasePointerCapture) {
        e.target.releasePointerCapture(e.pointerId);
    }
    if (isSimulating && activePB) {
        activePB.pressed = false;
        activePB = null;
        runSimulation();
        render();
    }
    draggingItem = null;
}

function render() {
    const compLayer = document.getElementById('component-layer');
    const wireLayer = document.getElementById('wire-layer');
    const uiLayer = document.getElementById('ui-layer');
    
    compLayer.innerHTML = ''; wireLayer.innerHTML = ''; uiLayer.innerHTML = '';

    wires.forEach(w => {
        const path = getWirePath(w);
        if (path.length < 2) return;
        
        const pts = path.map(p => `${p.x},${p.y}`).join(' ');
        const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        poly.setAttribute("points", pts);
        poly.setAttribute("class", w.energized ? "wire energized" : "wire");
        poly.setAttribute("data-type", "wire");
        poly.setAttribute("data-id", w.id);
        wireLayer.appendChild(poly);

        if (!isSimulating && (mode === 'SELECT' || mode === 'DELETE')) {
            w.waypoints.forEach((wp, idx) => {
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", wp.x); circle.setAttribute("cy", wp.y);
                circle.setAttribute("r", "10"); // 모바일 터치를 위해 터치 영역 확대 (6->10)
                circle.setAttribute("class", "waypoint");
                circle.setAttribute("data-type", "waypoint");
                circle.setAttribute("data-wire-id", w.id);
                circle.setAttribute("data-wp-index", idx);
                uiLayer.appendChild(circle);
            });
        }
    });

    if (currentWiring) {
        const path = getWirePath(currentWiring);
        path.push(mousePos);
        const pts = path.map(p => `${p.x},${p.y}`).join(' ');
        const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        poly.setAttribute("points", pts);
        poly.setAttribute("class", "wire-drawing");
        uiLayer.appendChild(poly);
    }

    components.forEach(c => {
