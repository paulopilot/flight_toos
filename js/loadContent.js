function loadContent(page) {
    fetch(page)
        .then(response => response.text())
        .then(html => {
            document.getElementById("content").innerHTML = html;

            // Reexecuta scripts da página carregada
            let scripts = document.getElementById("content").getElementsByTagName("script");
            for (let i = 0; i < scripts.length; i++) {
                let newScript = document.createElement("script");
                newScript.text = scripts[i].text;
                document.body.appendChild(newScript);
            }
        })
        .catch(error => console.error('Erro ao carregar conteúdo:', error));
}
