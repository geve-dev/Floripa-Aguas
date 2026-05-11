const btnFechar = document.getElementById('btnFechar');
const btnLogout = document.getElementById('btnLogout');
const popup = document.getElementById('popupOverlay');
const btnAbrirRegistro = document.getElementById('btnAbrirRegistro');
const registerOverlay = document.getElementById('registerOverlay');

render_perfil()
let currentPage = 1;
let currentRegion = '';
get_cards(currentPage)

btnFechar.addEventListener('click', () => {
    popup.classList.remove('active');
});

btnCancelar.addEventListener('click', () => {
    registerOverlay.classList.remove('active');
});


document.querySelector('main header').addEventListener('click', (event) => {
    if (event.target.id === 'btnLogout') {
        logout();
    }

    if (event.target.id === 'btnAbrir') {
        popup.classList.add('active');
    }
});

btnAbrirRegistro.addEventListener('click', () => {
    if(get_status() == true){
        registerOverlay.classList.add('active');
    } else {
        alert('Você precisa estar logado para postar uma análise!');
    }
});

async function post_curtidas(idCard) {
    if (!get_status()) {
        alert('Você precisa estar logado para curtir!');
        return;
    }

    const usuario_id = localStorage.getItem('codigousuario');

    try {
        const res = await fetch('http://localhost:3000/curtidas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: usuario_id,
                acao_id: idCard
            })
        });

        const resultado = await res.json();
        if (resultado.success) {
            // Atualiza os cards para mostrar a mudança
            get_cards(currentPage);
            console.log(resultado.message);
        }
    } catch (error) {
        console.error('Erro ao processar curtida:', error);
    }


}

async function post_comentario(idCard) {
    if (!get_status()) {
        alert('Você precisa estar logado para comentar!');
        return;
    }

    const input = document.getElementById(`input-comentario-${idCard}`);
    const texto = input.value.trim();

    if (!texto) {
        alert('O comentário não pode estar vazio!');
        return;
    }

    const usuario_id = localStorage.getItem('codigousuario');

    try {
        const res = await fetch('http://localhost:3000/comentarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: usuario_id,
                acao_id: idCard,
                texto_comentario: texto
            })
        });

        const resultado = await res.json();
        if (resultado.success) {
            input.value = '';
            get_cards(currentPage);
            console.log(resultado.message);
        }
    } catch (error) {
        console.error('Erro ao processar comentário:', error);
    }
}

function toggleComentarios(idCard) {
    const footers = document.querySelectorAll('.card-footer-comentario');
    const targetFooter = document.getElementById(`footer-comentario-${idCard}`);
    const isAlreadyOpen = targetFooter.style.display === 'block';

    // Fecha todos os outros
    footers.forEach(f => f.style.display = 'none');

    // Abre o alvo se ele não estava aberto
    if (!isAlreadyOpen) {
        targetFooter.style.display = 'block';
    }
}




    

async function post_cards(){
    const form = document.getElementById('fc');
    const dados = new FormData(form);
    let valoresCard = Object.fromEntries(dados.entries());
    valoresCard = {
        ...valoresCard, 
        usuario_id: localStorage.getItem('codigousuario')
    }

    console.log(valoresCard);

    const res = await fetch(
        'http://localhost:3000/cards',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(valoresCard)
        }
    );

    const resultado = await res.json();

    if (resultado.success) {
        alert('Postagem registrada com sucesso!');
        form.reset();
        currentPage = 1;
        get_cards(currentPage); // Atualiza os cards na tela
    } else {
        alert('Erro ao registrar: ' + resultado.message);
    }

    registerOverlay.classList.remove('active');
}


async function post_login() {
    const form = document.getElementById('fl');
    const dados = new FormData(form);
    const valores = Object.fromEntries(dados.entries());
    console.log(valores);

    const res = await fetch(
        'http://localhost:3000/login',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(valores)
        }
    );

    let resultado = await res.json();

    //armazena os dados do usuario logado no localStorage
    if (res.status == 200) {
        localStorage.setItem('codigousuario', resultado.user.id);
        localStorage.setItem('nomeusuario', resultado.user.nome);
        localStorage.setItem('fotousuario', resultado.user.foto_perfil);
        console.log('logado');
    }

    popup.classList.remove('active');

    render_perfil()
}


async function render_perfil() {
    const asideHeader = document.querySelector('aside header');
    const mainHeader = document.querySelector('main header');

    if (get_status() == true) {
        asideHeader.innerHTML = `
            <img src="${localStorage.getItem('fotousuario')}" alt="Logo Floripa Águas">
            <h1 id="userName">${localStorage.getItem('nomeusuario')}</h1>
            <p id="totalAnalises">309</p>
            <span>Balneabilidade informadas</span>
        `;
        mainHeader.innerHTML = `
        <button id="btnLogout">Logout</button>
        `;
    } else {
        asideHeader.innerHTML = `
            <img src="assets/images/logo.jpg" alt="Logo Floripa Águas">
            <h1 id="userName">Floripa Águas</h1>
            <p id="totalAnalises">309</p>
            <span>Análises já realizadas</span>
        `;
        mainHeader.innerHTML = `
         <button id="btnAbrir">Login</button>
        `;
    }
}

async function get_cards(page = 1) {
    const usuario_id = localStorage.getItem('codigousuario') || 0;
    let url = `http://localhost:3000/cards?page=${page}&limit=4&usuario_id=${usuario_id}`;
    
    if (currentRegion) {
        url += `&regiao=${currentRegion}`;
    }

    const res = await fetch(url);

    let response = await res.json();
    console.log(response);

    render_cards(response.cards);
    render_pagination(response.pagination);
};

window.filterByRegion = function(region) {
    currentRegion = region;
    currentPage = 1;
    get_cards(currentPage);
};

function render_pagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    const { totalPages, currentPage } = pagination;
    let html = '';

    // Botão Anterior
    html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Anterior</button>`;

    // Números das páginas
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    // Botão Próximo
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Próximo</button>`;

    paginationContainer.innerHTML = html;
}

window.changePage = function(page) {
    currentPage = page;
    get_cards(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

async function render_cards(dados) {
    const cards = document.querySelector('.cards');
    let conteudoHTML = '';

    for (let i = 0; i < dados.length; i++) {

        const idCard = dados[i].idCard;
        const totalCurtidas = dados[i].total_curtidas;
        const jaCurtido = dados[i].ja_curtido > 0 ? 'liked' : '';

        conteudoHTML += `
        <div class="card">
                <header>
                    <span class="nomePraia">${dados[i].nome_praia}</span>
                    <span class="data">${dados[i].postagem_formatada}</span>
                </header>
                <main class="card-corpo">
                    <img src="${dados[i].foto_perfil}" alt="" class="avatar">

                    <div class="card-conteudo">
                         <h3 class="username">${dados[i].autor}</h3>

                         <div class="infos">
                             <div class="itens-info">
                                <span>${dados[i].data_coleta_formatada}</span>
                                <p>Data da coleta</p>
                             </div>
                             <div class="itens-info">
                                <span>${dados[i].status_balneabilidade}</span>
                                <p>Situação da praia</p>
                             </div>
                             <div class="itens-info">
                                <span>${dados[i].regiao}</span>
                                <p>Região</p>
                             </div>
                             <div class="card-interacoes">
                                <button class="btn-like ${jaCurtido}" onclick="post_curtidas(${idCard})">
                                    <img src="assets/images/icones/${jaCurtido ? 'CoracaoVermelho.svg' : 'coracao.svg'}" alt=""> ${totalCurtidas}
                                </button>
                                <button class="btn-comentar" onclick="toggleComentarios(${idCard})"><img src="assets/images/icones/comentario.svg" alt=""> ${dados[i].total_comentarios}</button>
                            </div>
                         </div>
                    </div>
                </main>
                <footer class="card-footer-comentario" id="footer-comentario-${idCard}" style="display: none;">
                    <div class="comentarios-input-container">
                        <input type="text" placeholder="Escrever comentário..." id="input-comentario-${idCard}">
                        <button onclick="post_comentario(${idCard})">
                            <img src="assets/images/icones/send.svg" alt="Enviar">
                        </button>
                    </div>
                </footer>
            </div>
        `;
    }

    cards.innerHTML = conteudoHTML;
};

function logout() {
    //remove os dados do usuario logado no localStorage
    localStorage.removeItem('codigousuario');
    localStorage.removeItem('nomeusuario');
    localStorage.removeItem('fotousuario');
    console.log('deslogado');

    //rezeta o form de cadastro
    const form = document.getElementById('fl');
    if (form) {
        form.reset();
    }

    render_perfil();
};


function get_status() {
    const status = localStorage.getItem('codigousuario');

    if (status > 0) {
        return true
    } else {
        return false
    }
};