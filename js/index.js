document.addEventListener('DOMContentLoaded', function() {
  console.log('Pilot Tools carregado.');

  const linkQuilometragem = document.querySelector('a[href="quilometragem.html"]');

  linkQuilometragem.addEventListener('click', function(e) {
    e.preventDefault(); // Evita o redirecionamento

    fetch('quilometragem.html')
      .then(response => response.text())
      .then(data => {
        // Extrai o conteúdo do <body> da página carregada
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        const conteudo = doc.querySelector('body').innerHTML;
        document.querySelector('main').innerHTML = conteudo;

        // Chama a função que recupera os dados do localStorage e atualiza a tabela
        if (typeof iniciarPagina === 'function') {
          iniciarPagina();
        } else {
          console.error("A função iniciarPagina não foi encontrada.");
        }
      })
      .catch(error => console.error("Erro ao carregar a página:", error));
  });
});
