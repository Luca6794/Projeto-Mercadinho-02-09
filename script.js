// Variáveis globais
let produtos = [];
let produtoEditando = null;
let produtoParaDeletar = null;

// Elementos do DOM
const listaProdutos = document.getElementById('lista-produtos');
const contadorProdutos = document.getElementById('contador-produtos');
const estadoVazio = document.getElementById('estado-vazio');
const buscaProduto = document.getElementById('busca-produto');
const filtroEstoque = document.getElementById('filtro-estoque');

// Modais
const modalProduto = document.getElementById('modal-produto');
const modalConfirmarExclusao = document.getElementById('modal-confirmar-exclusao');
const formProduto = document.getElementById('form-produto');

// Botões
const btnNovoProduto = document.getElementById('btn-novo-produto');
const btnPrimeiroProduto = document.getElementById('btn-primeiro-produto');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const btnCancelar = document.getElementById('btn-cancelar');
const btnSalvar = document.getElementById('btn-salvar');
const modalTitulo = document.getElementById('modal-titulo');

// Modal de exclusão
const btnCancelarExclusao = document.getElementById('btn-cancelar-exclusao');
const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
const nomeProdutoExclusao = document.getElementById('nome-produto-exclusao');

// Event listeners
btnNovoProduto.addEventListener('click', () => abrirModalProduto());
btnPrimeiroProduto.addEventListener('click', () => abrirModalProduto());
btnFecharModal.addEventListener('click', fecharModalProduto);
btnCancelar.addEventListener('click', fecharModalProduto);
btnCancelarExclusao.addEventListener('click', fecharModalExclusao);
btnConfirmarExclusao.addEventListener('click', confirmarExclusao);

formProduto.addEventListener('submit', salvarProduto);
buscaProduto.addEventListener('input', filtrarProdutos);
filtroEstoque.addEventListener('change', filtrarProdutos);

// Fechar modal clicando fora
modalProduto.addEventListener('click', (e) => {
    if (e.target === modalProduto) fecharModalProduto();
});

modalConfirmarExclusao.addEventListener('click', (e) => {
    if (e.target === modalConfirmarExclusao) fecharModalExclusao();
});

// Funções principais
async function listarProdutos() {
    try {
        mostrarLoading();
        const response = await fetch('/api/produtos');
        if (!response.ok) {
            throw new Error('Erro ao buscar produtos');
        }
        produtos = await response.json();
        exibirProdutos();
        atualizarContador();
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        mostrarErro('Erro ao carregar produtos');
    }
}

function exibirProdutos() {
    const produtosFiltrados = filtrarProdutosPorBusca();
    
    if (produtosFiltrados.length === 0) {
        listaProdutos.style.display = 'none';
        estadoVazio.style.display = 'block';
        return;
    }
    
    listaProdutos.style.display = 'grid';
    estadoVazio.style.display = 'none';
    
    listaProdutos.innerHTML = produtosFiltrados.map(produto => criarCardProduto(produto)).join('');
}

function criarCardProduto(produto) {
    const statusEstoque = obterStatusEstoque(produto.quantidade);
    const dataFormatada = formatarData(produto.dataAtualizacao);
    
    return `
        <div class="produto-card fade-in">
            <div class="produto-header">
                <div class="produto-info">
                    <h3>${produto.nome}</h3>
                    <div class="categoria">${produto.categoria}</div>
                </div>
                <div class="produto-acoes">
                    <button class="btn-icon edit" onclick="editarProduto(${produto.id})" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-icon delete" onclick="abrirModalExclusao(${produto.id})" title="Excluir">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="produto-body">
                <div class="produto-detalhes">
                    <div class="detalhe-linha">
                        <span class="detalhe-label">Preço:</span>
                        <span class="preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div class="detalhe-linha">
                        <span class="detalhe-label">Estoque:</span>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="quantidade">${produto.quantidade}</span>
                            <span class="status-estoque ${statusEstoque.classe}">${statusEstoque.texto}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="produto-footer">
                <span>Código: ${produto.codigo}</span>
                <span>Atualizado ${dataFormatada}</span>
            </div>
        </div>
    `;
}

function obterStatusEstoque(quantidade) {
    if (quantidade === 0) {
        return { classe: 'status-sem-estoque', texto: 'Sem estoque' };
    } else if (quantidade <= 10) {
        return { classe: 'status-estoque-baixo', texto: 'Estoque baixo' };
    } else {
        return { classe: 'status-em-estoque', texto: 'Em estoque' };
    }
}

function formatarData(dataString) {
    const agora = new Date();
    const data = new Date(dataString);
    const diffEmDias = Math.floor((agora - data) / (1000 * 60 * 60 * 24));
    
    if (diffEmDias === 0) return 'hoje';
    if (diffEmDias === 1) return 'ontem';
    if (diffEmDias <= 7) return `há ${diffEmDias} dias`;
    
    return data.toLocaleDateString('pt-BR');
}

function filtrarProdutos() {
    exibirProdutos();
}

function filtrarProdutosPorBusca() {
    const termoBusca = buscaProduto.value.toLowerCase();
    const filtroSelecionado = filtroEstoque.value;
    
    return produtos.filter(produto => {
        // Filtro por busca
        const correspondeBusca = 
            produto.nome.toLowerCase().includes(termoBusca) ||
            produto.categoria.toLowerCase().includes(termoBusca) ||
            produto.codigo.toLowerCase().includes(termoBusca);
        
        // Filtro por estoque
        let correspondeEstoque = true;
        switch (filtroSelecionado) {
            case 'em-estoque':
                correspondeEstoque = produto.quantidade > 10;
                break;
            case 'estoque-baixo':
                correspondeEstoque = produto.quantidade > 0 && produto.quantidade <= 10;
                break;
            case 'sem-estoque':
                correspondeEstoque = produto.quantidade === 0;
                break;
            default: // 'todos'
                correspondeEstoque = true;
        }
        
        return correspondeBusca && correspondeEstoque;
    });
}

function atualizarContador() {
    contadorProdutos.textContent = `${produtos.length} produtos`;
}

// Funções do modal
function abrirModalProduto(produto = null) {
    produtoEditando = produto;
    
    if (produto) {
        modalTitulo.textContent = 'Editar Produto';
        btnSalvar.textContent = 'Salvar Alterações';
        preencherFormulario(produto);
    } else {
        modalTitulo.textContent = 'Adicionar Novo Produto';
        btnSalvar.textContent = 'Adicionar Produto';
        formProduto.reset();
    }
    
    modalProduto.style.display = 'flex';
    document.getElementById('nome-produto').focus();
}

function fecharModalProduto() {
    modalProduto.style.display = 'none';
    produtoEditando = null;
    formProduto.reset();
}

function preencherFormulario(produto) {
    document.getElementById('nome-produto').value = produto.nome;
    document.getElementById('categoria-produto').value = produto.categoria;
    document.getElementById('preco-produto').value = produto.preco;
    document.getElementById('quantidade-produto').value = produto.quantidade;
    document.getElementById('codigo-produto').value = produto.codigo;
}

async function salvarProduto(e) {
    e.preventDefault();
    
    const dadosFormulario = new FormData(formProduto);
    const produtoData = {
        nome: dadosFormulario.get('nome'),
        categoria: dadosFormulario.get('categoria'),
        preco: parseFloat(dadosFormulario.get('preco')),
        quantidade: parseInt(dadosFormulario.get('quantidade')),
        codigo: dadosFormulario.get('codigo')
    };
    
    try {
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';
        
        let response;
        if (produtoEditando) {
            response = await fetch(`/api/produtos/${produtoEditando.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produtoData)
            });
        } else {
            response = await fetch('/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produtoData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.erro || 'Erro ao salvar produto');
        }
        
        await listarProdutos();
        fecharModalProduto();
        mostrarSucesso(produtoEditando ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        mostrarErro(error.message);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = produtoEditando ? 'Salvar Alterações' : 'Adicionar Produto';
    }
}

function editarProduto(id) {
    const produto = produtos.find(p => p.id === id);
    if (produto) {
        abrirModalProduto(produto);
    }
}

function abrirModalExclusao(id) {
    const produto = produtos.find(p => p.id === id);
    if (produto) {
        produtoParaDeletar = produto;
        nomeProdutoExclusao.textContent = produto.nome;
        modalConfirmarExclusao.style.display = 'flex';
    }
}

function fecharModalExclusao() {
    modalConfirmarExclusao.style.display = 'none';
    produtoParaDeletar = null;
}

async function confirmarExclusao() {
    if (!produtoParaDeletar) return;
    
    try {
        btnConfirmarExclusao.disabled = true;
        btnConfirmarExclusao.textContent = 'Excluindo...';
        
        const response = await fetch(`/api/produtos/${produtoParaDeletar.id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.erro || 'Erro ao excluir produto');
        }
        
        await listarProdutos();
        fecharModalExclusao();
        mostrarSucesso('Produto excluído com sucesso!');
        
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        mostrarErro(error.message);
    } finally {
        btnConfirmarExclusao.disabled = false;
        btnConfirmarExclusao.textContent = 'Excluir';
    }
}

// Funções utilitárias
function mostrarLoading() {
    listaProdutos.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

function mostrarSucesso(mensagem) {
    // Implementação simples de notificação
    const alerta = document.createElement('div');
    alerta.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d1fae5;
        color: #065f46;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        border: 1px solid #a7f3d0;
        z-index: 1001;
        animation: fadeIn 0.3s ease-in-out;
    `;
    alerta.textContent = mensagem;
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

function mostrarErro(mensagem) {
    // Implementação simples de notificação de erro
    const alerta = document.createElement('div');
    alerta.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fee2e2;
        color: #991b1b;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        border: 1px solid #fecaca;
        z-index: 1001;
        animation: fadeIn 0.3s ease-in-out;
    `;
    alerta.textContent = mensagem;
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        alerta.remove();
    }, 5000);
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    listarProdutos();
});
