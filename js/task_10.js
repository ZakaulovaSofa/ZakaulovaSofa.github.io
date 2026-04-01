/* jshint esversion: 6 */

const TASK10_MAX_VERTICES = 20;

document.addEventListener('DOMContentLoaded', () => {
    const inputBlockContent = document.querySelector('.input-block .block-content');
    const outputPre = document.querySelector('.output-pre');
    const startButton = document.getElementById('startButton');
    const graphContainer = document.querySelector('.graph-container');

    if (!inputBlockContent || !outputPre || !startButton || !graphContainer) {
        console.error('Не найдены нужные элементы страницы для task_10.js');
        return;
    }

    buildInputUI(inputBlockContent);
    buildGraphArea(graphContainer);

    startButton.addEventListener('click', () => {
        try {
            const rawText = document.getElementById('edgeListInput').value;
            const parsed = parseEdgeList(rawText);
            const adjacency = buildAdjacencyFromEdges(parsed.edges, parsed.n);

            if (!isTree(adjacency, parsed.n)) {
                throw new Error('Граф не является деревом.');
            }

            const pruferCode = computePruferCode(copyAdjacency(adjacency), parsed.n);

            outputPre.textContent = formatResult(adjacency, pruferCode);
            renderTask10Graph(adjacency);
        } catch (error) {
            outputPre.textContent = `Ошибка:\n${error.message}`;
            renderGraphError('cy', error.message);
        }
    });
});

function buildInputUI(container) {
    container.innerHTML = `
        <div class="task10-input-wrapper">
            <label for="edgeListInput" style="display:block; margin-bottom:10px; font-weight:600;">
                Введите дерево списком рёбер
            </label>

            <textarea
                id="edgeListInput"
                rows="12"
                style="width:100%; resize:vertical; padding:12px; box-sizing:border-box; font-family:monospace;"
                placeholder="Пример:
1 2
1 3
3 4
3 5"
            >1 2
1 3
3 4
3 5</textarea>

            <div style="margin-top:12px; line-height:1.6;">
                <p style="margin:0 0 8px 0;"><b>Формат ввода:</b></p>
                <p style="margin:0;">Каждая строка содержит одно ребро:</p>
                <p style="margin:6px 0 0 0; font-family:monospace;">вершина1 вершина2</p>
                <p style="margin:8px 0 0 0;">Например:</p>
                <pre style="margin:6px 0 0 0; padding:10px; background:#f6f6f6; overflow:auto;">1 2
1 3
3 4
3 5</pre>
                <p style="margin:8px 0 0 0;">
                    Максимальное число вершин: ${TASK10_MAX_VERTICES}.
                </p>
            </div>
        </div>
    `;
}

function buildGraphArea(container) {
    container.innerHTML = '<div id="cy" class="cy-graph-area"></div>';
}

function parseEdgeList(rawText) {
    if (!rawText || !rawText.trim()) {
        throw new Error('Поле ввода пустое.');
    }

    const lines = rawText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (lines.length === 0) {
        throw new Error('Не удалось прочитать ни одного ребра.');
    }

    const edges = [];
    let maxVertex = 0;
    const edgeSet = new Set();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/\s+/);

        if (parts.length !== 2) {
            throw new Error(
                `Неверный формат строки ${i + 1}: "${line}". Ожидается формат "u v".`
            );
        }

        const u = Number(parts[0]);
        const v = Number(parts[1]);

        if (!Number.isInteger(u) || !Number.isInteger(v) || u <= 0 || v <= 0) {
            throw new Error(
                `В строке ${i + 1} вершины должны быть целыми положительными числами.`
            );
        }

        if (u === v) {
            throw new Error(`Обнаружена петля в строке ${i + 1}: ${u} ${v}.`);
        }

        const a = Math.min(u, v);
        const b = Math.max(u, v);
        const edgeId = `${a}-${b}`;

        if (edgeSet.has(edgeId)) {
            throw new Error(`Ребро ${a} ${b} указано более одного раза.`);
        }

        edgeSet.add(edgeId);
        edges.push([u, v]);
        maxVertex = Math.max(maxVertex, u, v);
    }

    if (maxVertex === 0) {
        throw new Error('Не удалось определить вершины графа.');
    }

    if (maxVertex > TASK10_MAX_VERTICES) {
        throw new Error(
            `Количество вершин (${maxVertex}) превышает допустимый максимум (${TASK10_MAX_VERTICES}).`
        );
    }

    return {
        edges,
        n: maxVertex
    };
}

function buildAdjacencyFromEdges(edges, n) {
    const adjacency = Array.from({ length: n + 1 }, () => new Set());

    for (const [u, v] of edges) {
        adjacency[u].add(v);
        adjacency[v].add(u);
    }

    return adjacency;
}

function isTree(adjacency, n) {
    let edgesCount = 0;

    for (let i = 1; i <= n; i++) {
        edgesCount += adjacency[i].size;
    }

    edgesCount /= 2;

    if (edgesCount !== n - 1) {
        return false;
    }

    const visited = Array(n + 1).fill(false);
    const stack = [1];
    visited[1] = true;
    let visitedCount = 1;

    while (stack.length > 0) {
        const v = stack.pop();

        for (const u of adjacency[v]) {
            if (!visited[u]) {
                visited[u] = true;
                visitedCount++;
                stack.push(u);
            }
        }
    }

    return visitedCount === n;
}

function computePruferCode(adjacency, n) {
    const pruferCode = [];

    for (let k = 0; k < n - 2; k++) {
        let leaf = -1;

        for (let i = 1; i <= n; i++) {
            if (adjacency[i].size === 1) {
                leaf = i;
                break;
            }
        }

        if (leaf === -1) {
            throw new Error('Не удалось найти лист при построении кода Прюфера.');
        }

        const neighbor = adjacency[leaf].values().next().value;
        pruferCode.push(neighbor);

        adjacency[neighbor].delete(leaf);
        adjacency[leaf].clear();
    }

    return pruferCode;
}

function copyAdjacency(adjacency) {
    return adjacency.map(neighbors => new Set(neighbors));
}

function formatResult(adjacency, pruferCode) {
    const lines = [];

    lines.push('Список смежности:');
    for (let i = 1; i < adjacency.length; i++) {
        lines.push(`${i}: ${Array.from(adjacency[i]).sort((a, b) => a - b).join(' ')}`);
    }

    lines.push('');
    lines.push(`Код Прюфера: ${pruferCode.join(' ')}`);

    return lines.join('\n');
}

function buildCytoscapeElements(adjacency) {
    const elements = [];
    const addedEdges = new Set();

    for (let v = 1; v < adjacency.length; v++) {
        elements.push({
            data: {
                id: String(v),
                label: String(v)
            }
        });
    }

    for (let v = 1; v < adjacency.length; v++) {
        for (const u of adjacency[v]) {
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

function getTask10Style() {
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

function renderTask10Graph(adjacency) {
    const elements = buildCytoscapeElements(adjacency);

    renderGraphInContainer('cy', elements, {
        style: getTask10Style()
    });
}