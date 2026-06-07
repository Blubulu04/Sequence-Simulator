function runSimulation() {
    if (!isSimulating) return;

    // 시퀀스 제어의 자기유지(Feedback Loop) 회로를 정상 연산하기 위해 3회 반복 연산 루프 수행
    for (let loop = 0; loop < 3; loop++) {
        let lConnected = new Set();
        let nConnected = new Set();
        let internalConnections = [];

        components.forEach(c => {
            const cid = c.id;
            if (c.type === 'L') lConnected.add(`${cid}_0`);
            if (c.type === 'N') nConnected.add(`${cid}_0`);
            
            if (c.type === 'PB_NO' && c.pressed) internalConnections.push([`${cid}_0`, `${cid}_1`]);
            if (c.type === 'PB_NC' && !c.pressed) internalConnections.push([`${cid}_0`, `${cid}_1`]);
            
            // 요청하신 접점 구조 논리를 완벽하게 매핑했습니다.
            if (c.type === 'RELAY') {
                // 1번(COM) - 4번(NO) / 3번(NC) 논리 구조
                internalConnections.push([`${cid}_1`, c.energized ? `${cid}_4` : `${cid}_3`]);
                // 8번(COM) - 5번(NO) / 6번(NC) 논리 구조
                internalConnections.push([`${cid}_8`, c.energized ? `${cid}_5` : `${cid}_6`]);
            }
        });

        let adj = {};
        const addEdge = (u, v) => {
            if (!adj[u]) adj[u] = [];
            if (!adj[v]) adj[v] = [];
            adj[u].push(v); adj[v].push(u);
        };

        wires.filter(w => w.endComp).forEach(w => {
            addEdge(`${w.startComp}_${w.startPin}`, `${w.endComp}_${w.endPin}`);
        });
        internalConnections.forEach(pair => addEdge(pair[0], pair[1]));

        const bfs = (startSet) => {
            let visited = new Set(startSet);
            let queue = Array.from(startSet);
            while (queue.length > 0) {
                let curr = queue.shift();
                if (adj[curr]) {
                    adj[curr].forEach(neighbor => {
                        if (!visited.has(neighbor)) {
                            visited.add(neighbor);
                            queue.push(neighbor);
                        }
                    });
                }
            }
            return visited;
        };

        let reachableFromL = bfs(lConnected);
        let reachableFromN = bfs(nConnected);

        components.forEach(c => {
            if (c.type === 'LAMP') {
                const pin0L = reachableFromL.has(`${c.id}_0`);
                const pin1N = reachableFromN.has(`${c.id}_1`);
                const pin0N = reachableFromN.has(`${c.id}_0`);
                const pin1L = reachableFromL.has(`${c.id}_1`);
                c.energized = (pin0L && pin1N) || (pin0N && pin1L);
            }
            if (c.type === 'RELAY') {
                // 2번-7번 코일 전압 인가 판단 논리 구조
                const pin2L = reachableFromL.has(`${c.id}_2`);
                const pin7N = reachableFromN.has(`${c.id}_7`);
                const pin2N = reachableFromN.has(`${c.id}_2`);
                const pin7L = reachableFromL.has(`${c.id}_7`);
                c.energized = (pin2L && pin7N) || (pin2N && pin7L);
            }
        });

        wires.forEach(w => {
            w.energized = reachableFromL.has(`${w.startComp}_${w.startPin}`);
        });
    }
}