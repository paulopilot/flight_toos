// Variáveis globais para armazenar os voos e o nome do tripulante
let nomeTripulante = localStorage.getItem("tripulante") || "";
let flights = JSON.parse(localStorage.getItem("flights")) || [];

// Inicializa a página ao carregar
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarPagina);
} else {
    iniciarPagina();
}

function iniciarPagina() {
    if (nomeTripulante) {
        document.getElementById("tripulante").value = nomeTripulante;
        document.getElementById("tripulante-name").textContent = nomeTripulante;
    }
    atualizarTabela();
}

// Função para calcular a distância entre duas coordenadas usando a fórmula de Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

// Função para obter as coordenadas usando a API do DECEA
function obterCoordenadas(icao) {
    const url = `https://api.decea.mil.br/aisweb/?apiKey=2025912383&apiPass=e8a8940a-7120-11ee-a2b8-0050569ac2e1&area=rotaer&icaoCode=${icao}`;
    return fetch(url)
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            const lat = data.querySelector("lat").textContent;
            const lng = data.querySelector("lng").textContent;
            return { lat: parseFloat(lat), lon: parseFloat(lng) };
        })
        .catch(error => {
            console.error("Erro ao buscar coordenadas:", error);
            return null;
        });
}

// Função para formatar a data no formato dd/mm/aaaa
function formatDate(inputDate) {
    const [year, month, day] = inputDate.split('-');
    return `${day}/${month}/${year}`;
}

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

    Promise.all([obterCoordenadas(origin), obterCoordenadas(destination)]).then(([originCoordinates, destinationCoordinates]) => {
        if (!originCoordinates || !destinationCoordinates) {
            alert("Erro ao obter coordenadas. Verifique os códigos ICAO.");
            return;
        }

        let distance = Number(calculateDistance(
            originCoordinates.lat, originCoordinates.lon,
            destinationCoordinates.lat, destinationCoordinates.lon
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

        flights.push({ date, aircraft, origin, destination, distance });
        salvarVoos();
        atualizarTabela();
    }).catch(error => {
        console.error("Erro ao buscar coordenadas:", error);
        alert("Houve um erro na conexão. Tente novamente.");
    });
}

function salvarVoos() {
    localStorage.setItem("flights", JSON.stringify(flights));
}

function atualizarTabela() {
    const tableBody = document.getElementById("flightsTable").getElementsByTagName('tbody')[0];
    tableBody.innerHTML = "";

    flights.forEach((voo, index) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${formatDate(voo.date)}</td>
            <td>${voo.aircraft}</td>
            <td>${voo.origin}</td>
            <td>${voo.destination}</td>
            <td class="distancia">${voo.distance} km</td>
            <td class="action-buttons">
                <button onclick="deleteFlight(${index})">Excluir</button>
            </td>
        `;
    });

    updateTotalDistance();
}

function deleteFlight(index) {
    flights.splice(index, 1);
    salvarVoos();
    atualizarTabela();
}

function limparTodosOsVoos() {
    if (confirm("Tem certeza de que deseja apagar todos os registros?")) {
        flights = [];
        localStorage.removeItem("flights");
        atualizarTabela();
    }
}

function updateTotalDistance() {
    let totalDistance = flights.reduce((acc, voo) => acc + parseFloat(voo.distance), 0);
    document.querySelector(".distancia_total").innerText = totalDistance.toFixed(1) + " km";
}
