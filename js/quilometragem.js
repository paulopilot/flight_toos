// Variáveis globais para armazenar os voos e o nome do tripulante
let nomeTripulante = localStorage.getItem("tripulante") || "";
let flightsRecords = JSON.parse(localStorage.getItem("flightsRecords")) || [];

/*
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarPagina);
} else {
    iniciarPagina();
}*/

/**
 * Inicializa página carregando voos salvos
 */
function iniciarPagina() {
    if (nomeTripulante) {
        document.getElementById("tripulante").value = nomeTripulante;
        document.getElementById("tripulante-name").textContent = nomeTripulante;
    }
    atualizarTabela();
}


/**
 * Função para formatar a data no formato dd/mm/aaaa
 * @param {date} inputDate 
 * @returns dd/mm/aaaa
 */
function formatDate(inputDate) {
    const [year, month, day] = inputDate.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Adiciona voo
 * 
 */
function adicionarVoo() {
    const date = document.getElementById("date").value;
    const aircraft = document.getElementById("aircraft").value;
    const origin = document.getElementById("origin").value;
    const destination = document.getElementById("destination").value;
    nomeTripulante = nomeTripulante || document.getElementById("tripulante").value;
    const nameCrew = document.getElementById("tripulante-name");

    
    if (!nomeTripulante) {
        alert('Por favor, insira o nome do tripulante.');
        return;
    }

    nameCrew.textContent = nomeTripulante;
    localStorage.setItem("tripulante", nomeTripulante);

    Promise.all([getAirport(origin), getAirport(destination)]).then(([originCoordinates, destinationCoordinates]) => {
        if (!originCoordinates || !destinationCoordinates) {
            alert("Erro ao obter coordenadas. Verifique os códigos ICAO.");
            return;
        }

        let distance = Number(calcularDistancia(
            originCoordinates.lat, originCoordinates.lng,
            destinationCoordinates.lat, destinationCoordinates.lng
        )).toFixed(1);

        // Se origem e destino forem iguais, solicitar a distância ao usuário
        if (origin.toUpperCase() === destination.toUpperCase()) {
            let userDistance;
            do {
                userDistance = prompt("Aeroporto de origem e destino são iguais. Informe a distância em km:", "0.0");
                if (userDistance === null) return;
                userDistance = userDistance.replace(",", ".");
            } while (isNaN(userDistance) || parseFloat(userDistance) < 0);

            distance = parseFloat(userDistance).toFixed(1);
        }

        flightsRecords.push({ date, aircraft, origin, destination, distance });
        salvarVoos();
        atualizarTabela();
    }).catch(error => {
        console.error("Erro ao buscar coordenadas:", error);
        alert("Houve um erro na conexão. Tente novamente.");
    });
}

/**
 * Salva voos
 */
function salvarVoos() {
    localStorage.setItem("flightsRecords", JSON.stringify(flightsRecords));
}

/**
 * Atualiza tabela com os voos salvos
 */
function atualizarTabela() {
    const tableBody = document.getElementById("flightsTable").getElementsByTagName('tbody')[0];
    tableBody.innerHTML = "";

    flightsRecords.forEach((voo, index) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${formatDate(voo.date)}</td>
            <td>${voo.aircraft}</td>
            <td>${voo.origin}</td>
            <td>${voo.destination}</td>
            <td class="distancia">${voo.distance} km</td>
            <td class="action-buttons">
                <img src="img/del-button.png" alt="Adicionar Voo" class="del_flight" onclick="deleteFlight(${index})">
            </td>
        `;
    });

    //<button class="new_flight" type="submit" onclick="deleteFlight(${index})">X</button>
    //<button onclick="deleteFlight(${index})">Excluir</button>
    //<img src="img/del-button.png" alt="Adicionar Voo" class="del_flight" onclick="deleteFlight(${index})">
    updateTotalDistance();
}

/**
 * Apaga um determinado voo pelo valor do index
 * @param {numer} index 
 */
function deleteFlight(index) {
    flightsRecords.splice(index, 1);
    salvarVoos();
    atualizarTabela();
}

function limparTodosOsVoos() {
    if (confirm("Tem certeza de que deseja apagar todos os registros?")) {
        flightsRecords = [];
        localStorage.removeItem("flightsRecords");
        atualizarTabela();
    }
}

function updateTotalDistance() {
    let totalDistance = flightsRecords.reduce((acc, voo) => acc + parseFloat(voo.distance), 0);
    document.querySelector(".distancia_total").innerText = totalDistance.toFixed(1) + " km";
}
