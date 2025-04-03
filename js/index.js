// Função para carregar um fragmento HTML no container #content
async function loadPage(pageUrl) {
    try {
		const response = await fetch(pageUrl);
		if (!response.ok) {
			throw new Error("Erro ao carregar a página " + pageUrl);
		}
		const html = await response.text();
		document.getElementById("content").innerHTML = html;
		
		// Se o fragmento carregado for o plan-content, inicializa o mapa e os eventos
		if (pageUrl === "plan-content.html") {
			// Aguarde um pequeno delay para garantir que o conteúdo esteja no DOM
			setTimeout(() => {
				initMapPlan();
				initPlanEvents();
				// Se houver um plano salvo, recarrega os dados
				if (flightPlan && flightPlan.pontos && flightPlan.waypoints && flightPlan.waypoints.length > 0) {
					// Preenche os campos do formulário
					document.getElementById("pontos").value = flightPlan.pontos;
					document.getElementById("velocidade").value = flightPlan.velocidade;
					document.getElementById("consumo").value = flightPlan.consumo;
					document.getElementById("alcance").value = flightPlan.alcance / 1852;
					// Renderiza a tabela e a rota
					renderTableAndMap(flightPlan.etapas);
					drawRouteMap();
				}
			}, 100);
		}

		if (pageUrl === "tools-content.html") {
			initToolsMenu();
		}
    } catch (error) {
      console.error(error);
      document.getElementById("content").innerHTML = "<p>Erro ao carregar o conteúdo.</p>";
    }
  }
  
  // Adiciona event listener aos links do menu
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.getAttribute("data-page");
      loadPage(page);
    });
  });
  
  // Carrega a página default (plan-content.html) quando o index.html é carregado
  window.addEventListener("DOMContentLoaded", () => {
    loadPage("plan-content.html");
  });