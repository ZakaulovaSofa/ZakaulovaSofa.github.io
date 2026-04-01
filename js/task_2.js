/* jshint esversion: 8 */

const TASK2_GRAPHS_JSON_PATH = '../json/graphs.json';

let currentTask2Graph = null;
let currentTask2GraphMeta = null;

document.addEventListener('DOMContentLoaded', async () => {
    const inputBlockContent = document.querySelector('.input-block .block-content');
    const outputPre = document.querySelector('.output-pre');
    const startButton = document.getElementById('startButton');
    const graphContainer = document.querySelector('.graph-container');

    if (!inputBlockContent || !outputPre || !startButton || !graphContainer) {
        console.error('Не найдены нужные элементы страницы для task_2.js');
        return;
    }

    buildInputUI(inputBlockContent);
    buildGraphArea(graphContainer);

    try {
        const graphEntry = await loadRandomGraphFromJson(TASK2_GRAPHS_JSON_PATH);
        currentTask2GraphMeta = graphEntry;
        currentTask2Graph = normalizeAndValidateGraphFromJson(graphEntry);

        fillGraphData(currentTask2Graph, currentTask2GraphMeta);
        renderTask2Graph(currentTask2Graph);

        outputPre.textContent =
            'Граф загружен.\n' +
            'Введите обход в глубину в виде последовательности номеров вершин через пробел.';
    } catch (error) {
        outputPre.textContent = `Ошибка загрузки графа:\n${error.message}`;
        renderGraphError('cy', error.message);
        startButton.disabled = true;
        return;
    }

    startButton.addEventListener('click', () => {
        if (!currentTask2Graph) {
            outputPre.textContent = 'Ошибка: граф не загружен.';
            return;
        }

        try {
            const traversal = parseTraversalInput(
                document.getElementById('dfsTraversalInput').value,
                currentTask2Graph.length - 1
            );

            const checkResult = checkDFS(traversal, currentTask2Graph);
            outputPre.textContent = formatCheckResult(traversal, checkResult);
        } catch (error) {
            outputPre.textContent = `Ошибка:\n${error.message}`;
        }
    });
});

function buildInputUI(container) {
    container.innerHTML = `
        <div class="task2-input-wrapper">
            <label for="graphDataTextarea" style="display:block; margin-bottom:10px; font-weight:600;">
                Сгенерированный граф (списки смежности)
            </label>

            <textarea
                id="graphDataTextarea"
                rows="12"
                readonly
                style="width:100%; resize:vertical; padding:12px; box-sizing:border-box; font-family:monospace; background:#f8f8f8;"
                placeholder="Здесь появится случайный граф..."
            ></textarea>

            <div style="margin-top:14px;">
                <label for="dfsTraversalInput" style="display:block; margin-bottom:8px; font-weight:600;">
                    Введите обход графа в глубину
                </label>
                <input
                    id="dfsTraversalInput"
                    type="text"
                    autocomplete="off"
                    placeholder="Например: 1 2 3 4 5 6"
                    style="width:100%; padding:12px; box-sizing:border-box;"
                >
            </div>

            <div style="margin-top:12px; line-height:1.6;">
                <p style="margin:0;"><b>Формат ответа:</b> номера вершин через пробел.</p>
            </div>
        </div>
    `;
}

function buildGraphArea(container) {
    container.innerHTML = '<div id="cy" class="cy-graph-area"></div>';
}

async function loadRandomGraphFromJson(path) {
    const response = await fetch(path, { cache: 'no-store' });

    if (!response.ok) {
        throw new Error(`Не удалось загрузить файл графов: ${path}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Файл graphs.json пустой или имеет неверный формат.');
    }

    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
}

function normalizeAndValidateGraphFromJson(graphEntry) {
    if (!graphEntry || typeof graphEntry !== 'object') {
        throw new Error('Некорректная запись графа в JSON.');
    }

    if (!graphEntry.adjacency || typeof graphEntry.adjacency !== 'object') {
        throw new Error('У графа отсутствует поле adjacency.');
    }

    const adjacency = graphEntry.adjacency;
    const vertexKeys = Object.keys(adjacency)
        .map(Number)
        .sort((a, b) => a - b);

    if (vertexKeys.length === 0) {
        throw new Error('Граф не содержит вершин.');
    }

    const n = vertexKeys.length;

    for (let i = 0; i < n; i++) {
        const expected = i + 1;
        if (vertexKeys[i] !== expected) {
            throw new Error(
                `В JSON вершины должны быть пронумерованы подряд от 1 до n. Ожидалась вершина ${expected}.`
            );
        }
    }

    const graph = Array.from({ length: n + 1 }, () => []);

    for (let v = 1; v <= n; v++) {
        const neighbors = adjacency[String(v)];

        if (!Array.isArray(neighbors)) {
            throw new Error(`У вершины ${v} список смежности должен быть массивом.`);
        }

        const uniqueNeighbors = new Set();

        for (const neighbor of neighbors) {
            if (!Number.isInteger(neighbor) || neighbor <= 0) {
                throw new Error(`У вершины ${v} найден некорректный сосед: ${neighbor}.`);
            }

            if (neighbor === v) {
                throw new Error(`В JSON обнаружена петля у вершины ${v}.`);
            }

            if (neighbor < 1 || neighbor > n) {
                throw new Error(
                    `Вершина ${v} ссылается на несуществующую вершину ${neighbor}.`
                );
            }

            if (uniqueNeighbors.has(neighbor)) {
                throw new Error(
                    `В списке смежности вершины ${v} сосед ${neighbor} указан более одного раза.`
                );
            }

            uniqueNeighbors.add(neighbor);
        }

        graph[v] = Array.from(uniqueNeighbors).sort((a, b) => a - b);
    }

    for (let v = 1; v <= n; v++) {
        for (const u of graph[v]) {
            if (!graph[u].includes(v)) {
                throw new Error(
                    `Граф в JSON должен быть неориентированным: ${v} содержит ${u}, но ${u} не содержит ${v}.`
                );
            }
        }
    }

    return graph;
}

function fillGraphData(graph, graphMeta) {
    const textarea = document.getElementById('graphDataTextarea');
    if (!textarea) {
        return;
    }

    const lines = [];

    if (graphMeta && graphMeta.name) {
        lines.push(`Название: ${graphMeta.name}`);
        lines.push('');
    }

    for (let v = 1; v < graph.length; v++) {
        lines.push(`${v}: ${graph[v].join(' ')}`);
    }

    textarea.value = lines.join('\n');
}

function parseTraversalInput(rawValue, n) {
    const value = String(rawValue).trim();

    if (value.length === 0) {
        throw new Error('Введите обход графа.');
    }

    const tokens = value.split(/\s+/).filter(Boolean);

    if (tokens.length !== n) {
        throw new Error(
            `Обход должен содержать ровно ${n} вершин(ы). Сейчас введено: ${tokens.length}.`
        );
    }

    const traversal = tokens.map((token, index) => {
        if (!/^\d+$/.test(token)) {
            throw new Error(
                `Некорректное значение "${token}" на позиции ${index + 1}. Ожидается целое положительное число.`
            );
        }

        const vertex = Number(token);

        if (!Number.isSafeInteger(vertex) || vertex < 1 || vertex > n) {
            throw new Error(
                `Вершина ${token} на позиции ${index + 1} выходит за допустимые границы от 1 до ${n}.`
            );
        }

        return vertex;
    });

    const seen = new Set();
    for (const vertex of traversal) {
        if (seen.has(vertex)) {
            throw new Error(`Вершина ${vertex} указана более одного раза.`);
        }
        seen.add(vertex);
    }

    return traversal;
}

function checkDFS(traversal, graph) {
    const n = graph.length - 1;
    const stack = [];
    const visited = Array(n + 1).fill(false);
    let pos = 0;

    while (pos < n) {
        const currentVertex = traversal[pos];

        if (!visited[currentVertex]) {
            stack.push(currentVertex);
            visited[currentVertex] = true;
            pos++;
        }

        while (stack.length > 0 && pos < n) {
            const current = stack[stack.length - 1];
            const nextVertex = traversal[pos];

            let isNeighbor = false;
            for (const neighbor of graph[current]) {
                if (neighbor === nextVertex) {
                    isNeighbor = true;
                    break;
                }
            }

            if (isNeighbor && !visited[nextVertex]) {
                stack.push(nextVertex);
                visited[nextVertex] = true;
                pos++;
            } else {
                let hasUnvisitedNeighbor = false;

                for (const neighbor of graph[current]) {
                    if (!visited[neighbor]) {
                        hasUnvisitedNeighbor = true;
                        break;
                    }
                }

                if (hasUnvisitedNeighbor) {
                    return {
                        isCorrect: false,
                        message: `Обход некорректен: у вершины ${current} есть непосещённый сосед, но следующая вершина ${nextVertex} не может быть выбрана по DFS.`
                    };
                } else {
                    stack.pop();
                }
            }
        }
    }

    return {
        isCorrect: true,
        message: 'Обход корректен.'
    };
}

function formatCheckResult(traversal, checkResult) {
    const lines = [];

    lines.push(`Введённый обход: ${traversal.join(' ')}`);
    lines.push('');

    if (checkResult.isCorrect) {
        lines.push('Вердикт: ответ корректный.');
    } else {
        lines.push('Вердикт: ответ некорректный.');
        lines.push(checkResult.message);
    }

    return lines.join('\n');
}

function buildCytoscapeElements(graph) {
    const elements = [];
    const addedEdges = new Set();

    for (let v = 1; v < graph.length; v++) {
        elements.push({
            data: {
                id: String(v),
                label: String(v)
            }
        });
    }

    for (let v = 1; v < graph.length; v++) {
        for (const u of graph[v]) {
            const a = Math.min(v, u);
            const b = Math.max(v, u);
            const edgeId = `${a}-${b}`;

            if (!addedEdges.has(edgeId)) {
                addedEdges.add(edgeId);
                elements.push({
                    data: {
                        id: edgeId,
                        source: String(a),
                        target: String(b)
                    }
                });
            }
        }
    }

    return elements;
}

function getTask2Style() {
    const style = getDefaultCytoscapeStyle().slice();

    style.push({
        selector: 'node',
        style: {
            'label': 'data(label)',
            'text-wrap': 'none'
        }
    });

    return style;
}

function renderTask2Graph(graph) {
    const elements = buildCytoscapeElements(graph);

    renderGraphInContainer('cy', elements, {
        style: getTask2Style()
    });
}