function initToolsMenu() {
    document.querySelectorAll('.tools-menu li').forEach(function(item) {
      item.addEventListener('click', function() {
        const page = item.getAttribute('data-page');
        fetch(page)
          .then(response => {
            if (!response.ok) {
              throw new Error("Erro ao carregar a página: " + page);
            }
            return response.text();
          })
          .then(html => {
            document.getElementById('toolsContentArea').innerHTML = html;
          })
          .catch(error => {
            document.getElementById('toolsContentArea').innerHTML = "<p>Erro ao carregar o conteúdo.</p>";
            console.error(error);
          });
      });
    });
  }
  
  window.addEventListener("DOMContentLoaded", function(){
    if(document.getElementById('toolsContentArea')) {
      fetch("quilometragem.html")
        .then(response => response.text())
        .then(html => {
          document.getElementById('toolsContentArea').innerHTML = html;
        })
        .catch(error => {
          document.getElementById('toolsContentArea').innerHTML = "<p>Erro ao carregar o conteúdo.</p>";
          console.error(error);
        });
      initToolsMenu();
    }
  });
  