// Variável global para armazenar a referência do círculo de alcance
let alcanceCircle;

// Exemplo de definição dos ícones (ajuste conforme necessário)
  const airportIcon = L.icon({
	iconUrl: 'img/airport-wp.png',
	iconSize: [24, 24],
	iconAnchor: [12, 12]
  });
  const fixesIcon = L.icon({
	iconUrl: 'img/wp/WP-FIXES.png',
	iconSize: [16, 16],
	iconAnchor: [8, 8]
  });
  const userIcon = L.icon({
	iconUrl: 'img/wp/WP-USER.png',
	iconSize: [16, 16],
	iconAnchor: [8, 8]
  });
  const waypointIcons = {
	[WaypointType.AIRPORT]: airportIcon,
	[WaypointType.FIXES]: fixesIcon,
	[WaypointType.USER]: userIcon
  };
  
  // Objeto principal do planejamento
  let flightPlan = JSON.parse(localStorage.getItem("flightPlan")) || {
	pontos: "",
	velocidade: 0,
	consumo: 0,
	alcance: 0,
	etapas: [],
	waypoints: []
  };
  
  let map;       // Referência ao mapa Leaflet
  let polyline;  // Referência à rota desenhada
  let markersArray = [];

/**
 * Função que retorna o ícone de acordo com tipo do waypoint
 * @param {*} waypoint 
 * @returns 
 */
  function getWaypointIcon(waypoint) {
	// Se o waypoint for do tipo FIXES ou GEO, retorna os ícones fixos
	if (waypoint.type === WaypointType.FIXES) {
		return fixesIcon;
	}
	if (waypoint.type === WaypointType.USER) {
		return userIcon;
	}
	
	// Para waypoint do tipo aeroporto, heliponto ou helideck
	// Define o código referente ao tipo:
	let typeCode = "";
	if (waypoint.type === WaypointType.AIRPORT) {
		typeCode = "AD";
	} else if (waypoint.type === WaypointType.HELIPOINT || waypoint.type === WaypointType.HELIDECK) {
		typeCode = "HP";
	} else {
		// Se for USER ou outro, você pode definir um padrão; aqui usamos "AD" como fallback
		typeCode = "AD";
	}
	
	// Define o código para a operação:
	// Se o flag IFR estiver ativo, mesmo que junto com VFR, usa "IF", senão "VI"
	let operCode = (waypoint.oper & OperationFlags.IFR) ? "IF" : "VI";
	
	// Define o código para o uso (user) acumulando os códigos conforme os flags
	// Ordem: PUBLIC (PB), MILITARY (MI) e PRIVADO (PV)
	let userCodes = "";
	if (waypoint.user & UserFlags.PUB) {
		userCodes += "PB";
	}
	if (waypoint.user & UserFlags.MIL) {
		userCodes += "MI";
	}
	if (waypoint.user & UserFlags.PRIV) {
		userCodes += "PV";
	}
	
	// Monta o nome do arquivo
	const fileName = `WP-${typeCode}${operCode}${userCodes}.png`;
	
	// Define o tamanho do ícone para os tipos de aeroporto/heliponto/helideck
	const iconSize = [24, 24];
	const iconAnchor = [12, 12];

	//console.log(fileName);
	
	// Cria e retorna o ícone usando o caminho construído
	return L.icon({
		iconUrl: `img/wp/${fileName}`,
		iconSize: iconSize,
		iconAnchor: iconAnchor
	});
  }
  
  
/**
 * Função para inicializar o mapa na página Plan
 * @returns 
 */
function initMapPlan() {
	const mapElement = document.getElementById("map");
	if (!mapElement) {
	  console.error("Map container not found.");
	  return;
	}
	map = L.map("map").setView([-5, -42], 5);
	L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
	  maxZoom: 19,
	  attribution: '© OpenStreetMap'
	}).addTo(map);
	
	// Opcional: localização do usuário
	map.locate({ setView: true, maxZoom: 16 });
	map.on("locationfound", onLocationFound);
	map.on("locationerror", onLocationError);
	map.on('contextmenu', function(e) {
		const dms = decimalToDMS(e.latlng.lat, e.latlng.lng);
		const dmscopy = decimalToDMSString(e.latlng.lat, e.latlng.lng);
		// Substitua 'img/globe.png' pela URL/caminho da sua imagem de globo
		const content = `
		  <div style="
			width: 220px;
			font-size: 10px;
			font-family: Arial, sans-serif;
			//border: 1px solid #999;
			//box-sizing: border-box;
		  ">
			<!-- Barra superior com fundo cinza claro -->
			<div style="
			  background: #ccc;
			  color: #000;
			  padding: 2px 4px;
			  font-weight: bold;
			">
			  Location Information
			</div>
	  
			<!-- Corpo do popup: botão COPY, ícone do globo e coordenadas -->
			<div style="
			  display: flex;
			  align-items: center;
			  gap: 4px;
			  padding: 4px;
			  background: #eee;
			">
			  <!-- Botão COPY com gradiente azul e bordas arredondadas -->
			  <button id="copyBtn" style="
				background: linear-gradient(to bottom, #0099ff, #0066cc);
				color: #fff;
				border: 1px solid #005bb5;
				border-radius: 10px;
				font-size: 10px;
				padding: 2px 8px;
				cursor: pointer;
			  ">
				COPY
			  </button>
	  
			  <!-- Imagem de globo -->
			  <img src="img/globe.png" style="width: 16px; height: 16px;" alt="Globe" />
	  
			  <!-- Coordenadas em DMS -->
			  <span>${dms.lat} ${dms.lng}</span>
			</div>
		  </div>
		`;
	  
		L.popup()
		  .setLatLng(e.latlng)
		  .setContent(content)
		  .openOn(map);
	  
		// Adiciona o listener de clique ao botão COPY
		setTimeout(() => {
		  const copyBtn = document.getElementById("copyBtn");
		  if (copyBtn) {
			copyBtn.addEventListener("click", () => {
			  navigator.clipboard.writeText(dmscopy)
				.then(() => {
				  map.closePopup(); // Fecha o popup após copiar
				})
				.catch(err => {
				  console.error("Erro ao copiar: ", err);
				});
			});
		  }
		}, 100);
	});

	setTimeout(() => {
		map.invalidateSize();
	}, 200); // dá tempo do DOM carregar completamente

  }
  
/**
 * 
 * @param {*} e 
 */
function onLocationFound(e) {
	const radius = e.accuracy;
	//L.marker(e.latlng).addTo(map)
	//  .bindPopup("Você está a um raio de " + radius + " metros deste ponto.").openPopup();
	//L.marker(e.latlng).addTo(map);
	//L.circle(e.latlng, radius).addTo(map);
  }
  
/**
 * 
 * @param {*} e 
 */
function onLocationError(e) {
	alert(e.message);
  }
  
/**
 * Inicializa eventos
 */
function initPlanEvents() {
	const flightPlanForm = document.getElementById("flightPlanForm");
	const btnFechar = document.getElementById("fechar");
	const btnInverter = document.getElementById("invertRouteBtn");
  
	// calcula pontos ao digitar
	document.getElementById("pontos").addEventListener("keyup", function (e) {
		const value = e.target.value.trim();
		const pontos = value.split(/[\s,]+/).filter(Boolean);
	
		// Chama calculatePlan() se ENTER for pressionado
		if (e.key === "Enter") {
			processRoute();
		}
		
		if (e.key === " " && pontos.length >= 1) {
			processRoute();
		}
	});
  
	// Fechar modal
	if (btnFechar) {
		btnFechar.addEventListener("click", () => {
			const modal = document.getElementById("modal-container");
			if (modal) {
		  		modal.classList.remove("mostrar");
			}
	  	});
	}
  
	// Inverter rota
	if (btnInverter) {
		btnInverter.addEventListener("click", async () => {
			const input = document.getElementById("pontos");
			const btnImg = btnInverter.querySelector("img");

			if (!btnImg) return;

			// Salva a imagem original e troca por progress.gif
			const originalSrc = btnImg.src;
			btnImg.src = "img/progress.gif";
			btnInverter.disabled = true;

			// Processa a inversão e o cálculo
			const pontos = input.value.trim().split(/[\s,]+/).filter(Boolean);
			input.value = pontos.reverse().join(" ");

			await calculatePlan();

			// Restaura a imagem e reativa o botão
			btnImg.src = originalSrc;
			btnInverter.disabled = false;

			// Retorna foco para o campo pontos
			input.focus();
		});
	}

  
	["velocidade", "consumo"].forEach(id => {
		const input = document.getElementById(id);
		if (input) {
			input.addEventListener("keyup", (e) => {
				if (e.key === "Enter") {
					updateFlightPlan();
				}
			});
		}
	});

	["alcance"].forEach(id => {
		const input = document.getElementById(id);
		if (input) {
			input.addEventListener("keyup", (e) => {
				if (e.key === "Enter") {
					drawRangerCircle();
				}
			});
		}
	});
  
	if (flightPlanForm) {
		flightPlanForm.addEventListener("submit", (e) => {
			e.preventDefault();
			calculatePlan();
		});
	}
  }

/**
 * Processa waypoint digitados
 * @returns 
 */
function processRoute() {
	const btnInverter = document.getElementById("invertRouteBtn");
	const btnImg = btnInverter?.querySelector("img");
	const inputPontos = document.getElementById("pontos");

	if (btnInverter && btnImg) {
		const originalSrc = btnImg.src;
		btnImg.src = "img/progress.gif";
		btnInverter.disabled = true;

		return calculatePlan().then(() => {
			btnImg.src = originalSrc;
			btnInverter.disabled = false;
			inputPontos.focus();
		});
	} else {
		// fallback se não existir botão
		return calculatePlan().then(() => {
			inputPontos.focus();
		});
	}
  }
  
  
/**
 * Função para desenhar a rota a partir dos waypoints salvos
 * @returns 
 */
async function drawRouteMap() {
	if (!flightPlan.waypoints || flightPlan.waypoints.length < 2) return;
	
	// Remove polyline antiga e marcadores
	if (polyline) { map.removeLayer(polyline); }
	markersArray.forEach((marker) => map.removeLayer(marker));
	markersArray = [];
	
	const polylinePoints = [];

	flightPlan.waypoints.forEach((waypoint) => {
		polylinePoints.push([waypoint.lat, waypoint.lng]);
		
		let popupHtml = "";
		if (waypoint.type === WaypointType.AIRPORT) {
			popupHtml = `
			<strong>${waypoint.ident}</strong> (${waypoint.name})<br>
			${waypoint.city} - ${waypoint.uf}<br>
			${getWpUser(waypoint.user)}-${getWpOper(waypoint.oper)}<br>
			Elev: ${waypoint.altFt} ft
			`;
		} else if (waypoint.type === WaypointType.FIXES) {
			popupHtml = `
			<strong>${waypoint.ident}</strong><br>
			Fix: ${waypoint.name}<br>
			Coord: ${waypoint.lat.toFixed(4)}, ${waypoint.lng.toFixed(4)}
			`;
		} else if (waypoint.type === WaypointType.USER) {
			const dms = decimalToDMS(waypoint.lat, waypoint.lng);
			popupHtml = `
			<strong>${waypoint.ident}</strong><br>
			${dms.lat}, ${dms.lng}
			`;
		} else {
			popupHtml = `
			<strong>${waypoint.ident}</strong><br>
			${waypoint.name} - ${waypoint.city} - ${waypoint.uf}<br>
			Elev: ${waypoint.altFt} ft
			`;
		}
		
		const markerIcon = getWaypointIcon(waypoint);
			const marker = L.marker([waypoint.lat, waypoint.lng], { icon: markerIcon })
			.addTo(map)
			.bindPopup(popupHtml);
			markersArray.push(marker);

	});

	if ((flightPlan.waypoints.length > 0) && (flightPlan.alcance > 0)) {
		//alcanceCircle = L.circle([flightPlan.waypoints[0].lat, flightPlan.waypoints[0].lng], flightPlan.alcance).addTo(map);
		drawRangerCircle();
	}
	
	if (polylinePoints.length > 1) {
		polyline = L.polyline(polylinePoints, { color: "magenta" }).addTo(map);
		map.fitBounds(polyline.getBounds());
	}
  }

/**
 * Ajusta largura da área do sumario
 * @returns 
 */
function setWidthSummaryArea() {
	const scrollDiv = document.querySelector(".table-scroll");
	const summaryTable = document.querySelector(".summary-table");

	if (!scrollDiv || !summaryTable) return;

	if (scrollDiv.scrollHeight > scrollDiv.clientHeight) {
		summaryTable.style.width = "96%";
	} else {
		summaryTable.style.width = "100%";
	}
}

  
/**
 * Função para renderizar a tabela com as etapas
 * @param {*} etapas 
 */
function renderTableAndMap(etapas) {
	const tbody = document.querySelector("#flightData tbody");
	tbody.innerHTML = "";
  
	let totalConsumo = 0;
	let totalDist = 0;
	let finalEta = "00:00";
  
	flightPlan.waypoints.forEach((waypoint, index) => {
		const row = document.createElement("tr");
	
		const iconPath = `img/wp/${getImgFileName(waypoint)}`;
		const iconHtml = `<img src="${iconPath}" alt="${waypoint.ident}" style="width:16px;height:16px; vertical-align:middle; margin-right:4px;">`;
	
		if (index === 0) {
			row.innerHTML = `
			<td style="text-align:left;">${iconHtml}${waypoint.ident}</td>
			<td style="text-align:center;">--</td>
			<td style="text-align:center;">--</td>
			<td style="text-align:center;">--</td>
			<td style="text-align:center;">--</td>
			<td style="text-align:center;">--</td>
			`;
		} else {
			const etapa = etapas[index - 1];
	
			row.innerHTML = `
			<td style="text-align:left;">${iconHtml}${waypoint.ident}</td>
			<td style="text-align:center;">${etapa.hdg}</td>
			<td style="text-align:right;">${etapa.distNM}</td>
			<td style="text-align:center;">${etapa.ete}</td>
			<td style="text-align:center;">${etapa.eta}</td>
			<td style="text-align:right;">${etapa.etapaConsumo}</td>
			`;
	
			totalDist += parseFloat(etapa.distNM);
			totalConsumo += parseFloat(etapa.etapaConsumo);
			finalEta = etapa.eta;
		}
	
		tbody.appendChild(row);
	});
  
	// Sumário
	document.getElementById("summary-dist").textContent = totalDist.toFixed(1);
	document.getElementById("summary-ete").textContent = convertMinToHHMM(
		etapas.reduce((acc, etapa) => {
			const [hh, mm] = etapa.ete.split(":").map(Number);
			return acc + hh * 60 + mm;
	  	}, 0)
	);
	document.getElementById("summary-eta").textContent = finalEta;
	document.getElementById("summary-burn").textContent = totalConsumo.toFixed(1);

	setWidthSummaryArea();
  }
  
 
/**
 * Store Plan into localStorage
 */
function storePlan() {
	localStorage.setItem("flightPlan", JSON.stringify(flightPlan));
  }
  


/**
 * 
 * @returns Atualiza dados do plano quando os valores de velocidade são alterados
 */
async function updateFlightPlan() {
    const velocidade = parseFloat(document.getElementById("velocidade").value);
    const consumoHora = parseFloat(document.getElementById("consumo").value);

	alert("Aqui");

    if (!flightPlan.waypoints || flightPlan.waypoints.length < 2) return;

    let totalTime = 0;

    for (let i = 0; i < flightPlan.etapas.length; i++) {
        const etapa = flightPlan.etapas[i];

        const distNM = parseFloat(etapa.distNM);

        const timeHours = distNM / velocidade;
        const timeMinutes = timeHours * 60;
        totalTime += timeMinutes;

        const ete = convertMinToHHMM(timeMinutes);
        const eta = convertMinToHHMM(totalTime);
        const etapaConsumo = timeHours * consumoHora;

        etapa.ete = ete;
        etapa.eta = eta;
        etapa.etapaConsumo = etapaConsumo.toFixed(1);
    }

    renderTableAndMap(flightPlan.etapas);
    storePlan();
}

/**
 * Desenha um círculo com centro no primeiro waypoint e raio com o valor do campo alcance
 */
function drawRangerCircle(){
	const alcance = parseFloat(document.getElementById("alcance").value) * 1852;
	
	if (flightPlan.waypoints.length > 0) {
		flightPlan.alcance = alcance;
		const centerPoint = flightPlan.waypoints[0];
		if (alcanceCircle) map.removeLayer(alcanceCircle);
		if (flightPlan.alcance > 0) {
			alcanceCircle = L.circle([centerPoint.lat, centerPoint.lng], flightPlan.alcance).addTo(map);
		}
	}
}

/**
 * Calcula rota
 * @returns
 */
async function calculatePlan() {
	const routeInput = document.getElementById("pontos").value.trim().toUpperCase();
	const velocidade = parseFloat(document.getElementById("velocidade").value);
	const consumoHora = parseFloat(document.getElementById("consumo").value);
	const alcance = parseFloat(document.getElementById("alcance").value) * 1852;
	
	//document.getElementById("pontos").disabled = true;
	//document.getElementById("velocidade").disabled = true;
	//document.getElementById("consumo").disabled = true;
	//document.getElementById("alcance").disabled = true;
  
	let route_points = routeInput.split(/[\s,]+/).filter(Boolean);
  
	if (route_points.length === 0) {
		showNotifyInputPlan(`Insira pelo menos 1 waypoint.`);
	  
		document.getElementById("pontos").disabled = false;
		document.getElementById("velocidade").disabled = false;
		document.getElementById("consumo").disabled = false;
		document.getElementById("alcance").disabled = false;
		return;
	}
  
	// Limpar dados anteriores
	flightPlan.etapas = [];
	flightPlan.waypoints = [];
	flightPlan.pontos = routeInput;
	flightPlan.velocidade = velocidade;
	flightPlan.consumo = consumoHora;
	flightPlan.alcance = alcance;
  
	if (polyline) map.removeLayer(polyline);
	markersArray.forEach(marker => map.removeLayer(marker));
	markersArray = [];
  
	const resultTable = document.getElementById("resultTable");
	if (resultTable) {
		const tbody = resultTable.querySelector("tbody");
		if (tbody) tbody.innerHTML = "";
		resultTable.style.display = "none";
	}
  
	let totalTime = 0;
	const polylinePoints = [];
  
	// Se apenas 1 waypoint, plota no mapa e exibe na tabela
	if (route_points.length === 1) {
		const waypoint = await getWaypoint(route_points[0]);
		if (!waypoint) {
			showNotifyInputPlan(`Posição ${route_points[0]} não localizada.`);
			
			document.getElementById("pontos").disabled = false;
			document.getElementById("velocidade").disabled = false;
			document.getElementById("consumo").disabled = false;
			document.getElementById("alcance").disabled = false;
			return;
		}
	
		flightPlan.waypoints = [waypoint];
		storePlan();
	
		const markerIcon = getWaypointIcon(waypoint);
		const marker = L.marker([waypoint.lat, waypoint.lng], { icon: markerIcon })
			.addTo(map)
			.bindPopup(waypoint.ident);
		markersArray.push(marker);
	
		drawRangerCircle();
	
		// 🔥 Adiciona o ponto na tabela com valores "--"
		renderTableAndMap([]);
		map.setView([waypoint.lat, waypoint.lng], 9); // 9 é um zoom sugerido
		
		document.getElementById("pontos").disabled = false;
		document.getElementById("velocidade").disabled = false;
		document.getElementById("consumo").disabled = false;
		document.getElementById("alcance").disabled = false;
		return;
	}
  
	// Obter todos os waypoints
	for (let i = 0; i < route_points.length; i++) {
		const waypoint = await getWaypoint(route_points[i]);
		if (!waypoint) {
			showNotifyInputPlan(`Posição ${route_points[i]} não localizada.`);
			
			document.getElementById("pontos").disabled = false;
			document.getElementById("velocidade").disabled = false;
			document.getElementById("consumo").disabled = false;
			document.getElementById("alcance").disabled = false;
			return;
		}
		flightPlan.waypoints.push(waypoint);
		polylinePoints.push([waypoint.lat, waypoint.lng]);
	}
  
	// Calcular etapas
	for (let i = 0; i < flightPlan.waypoints.length - 1; i++) {
		const originAirport = flightPlan.waypoints[i];
		const destAirport = flightPlan.waypoints[i + 1];
	
		const distKm = calcularDistancia(originAirport.lat, originAirport.lng, destAirport.lat, destAirport.lng);
		const distNM = distKm / 1.852;
		const hdgTrue = parseFloat(calcHeading(originAirport.lat, originAirport.lng, destAirport.lat, destAirport.lng));
		const now = new Date();
		const magDecl = await getMagneticDeclination(originAirport.lat, originAirport.lng, now);
		let hdg = (hdgTrue - magDecl + 360) % 360;
		hdg = Math.round(hdg) + "º";
	
		const timeHours = distNM / velocidade;
		const timeMinutes = timeHours * 60;
		totalTime += timeMinutes;
	
		const eteHHMM = convertMinToHHMM(timeMinutes);
		const etaHHMM = convertMinToHHMM(totalTime);
		const etapaConsumo = timeHours * consumoHora;
	
		flightPlan.etapas.push({
			origin: originAirport.ident,
			destination: destAirport.ident,
			distNM: distNM.toFixed(1),
			hdg,
			ete: eteHHMM,
			eta: etaHHMM,
			etapaConsumo: etapaConsumo.toFixed(1)
		});
	}
  
	// Marcadores
	flightPlan.waypoints.forEach((waypoint) => {
		let popupHtml = "";
	
		if (waypoint.type === WaypointType.AIRPORT) {
			popupHtml = `
			<strong>${waypoint.ident}</strong> (${waypoint.name})<br>
			${waypoint.city} - ${waypoint.uf}<br>
			${getWpUser(waypoint.user)}-${getWpOper(waypoint.oper)}<br>
			Elev: ${waypoint.altFt} ft
			`;
		} else if (waypoint.type === WaypointType.FIXES) {
			popupHtml = `
			<strong>${waypoint.ident}</strong><br>
			Fix: ${waypoint.name}<br>
			Coord: ${waypoint.lat.toFixed(4)}, ${waypoint.lng.toFixed(4)}
			`;
		} else if (waypoint.type === WaypointType.USER) {
			const dms = decimalToDMS(waypoint.lat, waypoint.lng);
			popupHtml = `
			<strong>${waypoint.ident}</strong><br>
			${dms.lat}, ${dms.lng}
			`;
		} else {
			popupHtml = `
			<strong>${waypoint.ident}</strong><br>
			${waypoint.name} - ${waypoint.city} - ${waypoint.uf}<br>
			Elev: ${waypoint.altFt} ft
			`;
		}
	
		const markerIcon = getWaypointIcon(waypoint);
		const marker = L.marker([waypoint.lat, waypoint.lng], { icon: markerIcon })
			.addTo(map)
			.bindPopup(popupHtml);
		markersArray.push(marker);
	});
  
	// Círculo de alcance
	drawRangerCircle();
  
	storePlan();
	renderTableAndMap(flightPlan.etapas);
  
	if (polylinePoints.length > 1) {
		polyline = L.polyline(polylinePoints, { color: "magenta" }).addTo(map);
		map.fitBounds(polyline.getBounds());
	}
	
	document.getElementById("pontos").disabled = false;
	document.getElementById("velocidade").disabled = false;
	document.getElementById("consumo").disabled = false;
	document.getElementById("alcance").disabled = false;
  }
  
/**
 * 
 * @param {*} mensagem 
 */
function showNotifyInputPlan(mensagem) {
    const input = document.getElementById("pontos");
    let balao = document.getElementById("pontos-notify");

    // Se não existe no DOM, cria dinamicamente
    if (!balao) {
        balao = document.createElement("div");
        balao.id = "pontos-notify";
        balao.className = "input-notify";
        input.parentNode.insertBefore(balao, input.nextSibling);
    }

    balao.textContent = mensagem;
    balao.classList.add("show");

    // Alinhar com o input
    const inputRect = input.getBoundingClientRect();
    balao.style.left = `${input.offsetLeft}px`;

    // Esconde após 3 segundos
    setTimeout(() => {
        balao.classList.remove("show");
    }, 3000);

    // Se o usuário editar, esconder imediatamente
    const hideOnInput = () => {
        balao.classList.remove("show");
        input.removeEventListener("input", hideOnInput);
    };
    input.addEventListener("input", hideOnInput);
}

/**
 *  Update clock
 */
function updateUTCClock() {
	const now = new Date();
	// Obtém a hora, minuto e segundo em UTC
	const hours = now.getUTCHours().toString().padStart(2, '0');
	const minutes = now.getUTCMinutes().toString().padStart(2, '0');
	const seconds = now.getUTCSeconds().toString().padStart(2, '0');
	const timeString = `${hours}:${minutes}:${seconds} Z`;
	const clockEl = document.getElementById("utcClock");
	if (clockEl) {
		clockEl.textContent = timeString;
	}
  }
  
// Inicia a atualização do relógio a cada segundo
setInterval(updateUTCClock, 1000);
updateUTCClock(); // Atualiza imediatamente
  
/**
 * Open Fligh Plan Container
 */
function openContainer() {
	const modal = document.getElementById('modal-container')
	modal.classList.add('mostrar')
	/* Fecha o modal-container clicando em qualquer lugar dele !!!
	modal.addEventListener('click', (e) => {
		if (e.target === modal) {
			modal.classList.remove('mostrar');
			localStorage.fechaModal = 'modal-container';
		}
	});*/
}