/* jshint esversion: 6 */

const TASK6_GRAPHS_JSON_PATH = '../json/graphs.json';

let currentTask6Graph = null;
let currentTask6GraphMeta = null;

document.addEventListener('DOMContentLoaded', async () => {
    const inputBlockContent = document.querySelector('.input-block .block-content');
    const outputPre = document.querySelector('.output-pre');
    const startButton = document.getElementById('startButton');
    const graphContainer = document.querySelector('.graph-container');

    if (!inputBlockContent || !outputPre || !startButton || !graphContainer) {
        console.error('Не найдены нужные элементы страницы для task_6.js');
        return;
    }

    buildInputUI(inputBlockContent);
    buildGraphArea(graphContainer);

    try {
        const graphEntry = await loadRandomGraphFromJson(TASK6_GRAPHS_JSON_PATH);
        currentTask6GraphMeta = graphEntry;
        currentTask6Graph = normalizeAndValidateGraphFromJson(graphEntry);

        fillGraphData(currentTask6Graph, currentTask6GraphMeta);
        renderTask6Graph(currentTask6Graph);

        outputPre.textContent =
            'Граф загружен.\n' +
            'Введите число компонент связности и нажмите «Начать».';
    } catch (error) {
        outputPre.textContent = `Ошибка загрузки графа:\n${error.message}`;
        renderGraphError('cy', error.message);
        startButton.disabled = true;
        return;
    }

    startButton.addEventListener('click', () => {
        if (!currentTask6Graph) {
            outputPre.textContent = 'Ошибка: граф не загружен.';
            return;
        }

        try {
            const userAnswer = parseUserAnswer(
                document.getElementById('componentsAnswerInput').value
            );

            const components = findConnectedComponents(currentTask6Graph);
            const correctAnswer = components.length;

            outputPre.textContent = formatCheckResult(
                userAnswer,
                correctAnswer,
                components
            );
        } catch (error) {
            outputPre.textContent = `Ошибка:\n${error.message}`;
        }
    });
});

function buildInputUI(container) {
    container.innerHTML = `
        <div class="task6-input-wrapper">
            <label for="graphDataTextarea" style="display:block; margin-bottom:10px; font-weight:600;">
                Сгенерированный граф (списки смежности)
            </label>

            <textarea
                id="graphDataTextarea"
                rows="12"
                readonly
                placeholder="Здесь появится случайный граф..."
            ></textarea>

            <div style="margin-top:14px;">
                <label for="componentsAnswerInput" style="display:block; margin-bottom:8px; font-weight:600;">
                    Введите число компонент связности
                </label>
                <input
                    id="componentsAnswerInput"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    placeholder="Например: 2"
                >
            </div>

            <div style="margin-top:12px; line-height:1.6;">
                <p style="margin:0;"><b>Что нужно сделать:</b> определить, на сколько компонент связности распадается данный граф.</p>
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

    for (let v = 1; v < graph.length; v++) {
        lines.push(`${v}: ${graph[v].join(' ')}`);
    }

    textarea.value = lines.join('\n');
}

function parseUserAnswer(rawValue) {
    const value = String(rawValue).trim();

    if (value.length === 0) {
        throw new Error('Введите число компонент связности.');
    }

    if (!/^\d+$/.test(value)) {
        throw new Error('Ответ должен быть целым неотрицательным числом.');
    }

    const number = Number(value);

    if (!Number.isSafeInteger(number)) {
        throw new Error('Ответ слишком большой.');
    }

    if (number <= 0) {
        throw new Error('Число компонент связности должно быть положительным.');
    }

    return number;
}

function findConnectedComponents(graph) {
    const n = graph.length - 1;
    const visited = Array(n + 1).fill(false);
    const components = [];

    for (let start = 1; start <= n; start++) {
        if (!visited[start]) {
            const component = [];
            const queue = [start];
            visited[start] = true;

            while (queue.length > 0) {
                const current = queue.shift();
                component.push(current);

                for (const neighbor of graph[current]) {
                    if (!visited[neighbor]) {
                        visited[neighbor] = true;
                        queue.push(neighbor);
                    }
                }
            }

            components.push(component);
        }
    }

    return components;
}

function formatCheckResult(userAnswer, correctAnswer, components) {
    const lines = [];

    if (userAnswer === correctAnswer) {
        lines.push('Вердикт: ответ корректный.');
        lines.push(`Число компонент связности: ${correctAnswer}`);
    } else {
        lines.push('Вердикт: ответ некорректный.');
        lines.push(`Ваш ответ: ${userAnswer}`);
        lines.push(`Правильный ответ: ${correctAnswer}`);
    }

    lines.push('');
    lines.push('Компоненты связности:');

    for (let i = 0; i < components.length; i++) {
        lines.push(`Компонента ${i + 1}: { ${components[i].join(' ')} }`);
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

function getTask6Style() {
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

function renderTask6Graph(graph) {
    const elements = buildCytoscapeElements(graph);

    renderGraphInContainer('cy', elements, {
        style: getTask6Style()
    });
}