import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(process.cwd(), 'public')));

const produtosFile = path.join(process.cwd(), 'produtos.json');

function lerProdutos() {
  try {
    if (fs.existsSync(produtosFile)) {
      const data = fs.readFileSync(produtosFile, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Erro ao ler produtos:', error);
    return [];
  }
}

function salvarProdutos(produtos: any[]) {
  try {
    fs.writeFileSync(produtosFile, JSON.stringify(produtos, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar produtos:', error);
    return false;
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.get('/api/produtos', (req, res) => {
  try {
    const produtos = lerProdutos();
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar produtos" });
  }
});

app.get('/api/produtos/:id', (req, res) => {
  try {
    const produtos = lerProdutos();
    const id = parseInt(req.params.id);
    const produto = produtos.find((p: any) => p.id === id);
    
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    
    res.json(produto);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar produto" });
  }
});

app.post('/api/produtos', (req, res) => {
  try {
    const produtos = lerProdutos();
    const { nome, categoria, preco, quantidade, codigo } = req.body;
    
    if (!nome || !categoria || !preco || quantidade === undefined || !codigo) {
      return res.status(400).json({ erro: "Todos os campos são obrigatórios" });
    }
    if (produtos.find((p: any) => p.codigo === codigo)) {
      return res.status(400).json({ erro: "Código de produto já existe" });
    }
    
    const novoId = produtos.length > 0 ? Math.max(...produtos.map((p: any) => p.id)) + 1 : 1;
    const novoProduto = {
      id: novoId,
      nome,
      categoria,
      preco: parseFloat(preco),
      quantidade: parseInt(quantidade),
      codigo,
      dataAtualizacao: new Date().toISOString()
    };
    
    produtos.push(novoProduto);
    
    if (salvarProdutos(produtos)) {
      res.status(201).json(novoProduto);
    } else {
      res.status(500).json({ erro: "Erro ao salvar produto" });
    }
  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar produto" });
  }
});

app.put('/api/produtos/:id', (req, res) => {
  try {
    const produtos = lerProdutos();
    const id = parseInt(req.params.id);
    const { nome, categoria, preco, quantidade, codigo } = req.body;
    
    const produtoIndex = produtos.findIndex((p: any) => p.id === id);
    if (produtoIndex === -1) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    const codigoExiste = produtos.find((p: any) => p.codigo === codigo && p.id !== id);
    if (codigoExiste) {
      return res.status(400).json({ erro: "Código de produto já existe" });
    }
    
    produtos[produtoIndex] = {
      ...produtos[produtoIndex],
      nome: nome || produtos[produtoIndex].nome,
      categoria: categoria || produtos[produtoIndex].categoria,
      preco: preco !== undefined ? parseFloat(preco) : produtos[produtoIndex].preco,
      quantidade: quantidade !== undefined ? parseInt(quantidade) : produtos[produtoIndex].quantidade,
      codigo: codigo || produtos[produtoIndex].codigo,
      dataAtualizacao: new Date().toISOString()
    };
    
    if (salvarProdutos(produtos)) {
      res.json(produtos[produtoIndex]);
    } else {
      res.status(500).json({ erro: "Erro ao atualizar produto" });
    }
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar produto" });
  }
});

app.delete('/api/produtos/:id', (req, res) => {
  try {
    const produtos = lerProdutos();
    const id = parseInt(req.params.id);
    
    const produtoIndex = produtos.findIndex((p: any) => p.id === id);
    if (produtoIndex === -1) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    
    const produtoRemovido = produtos.splice(produtoIndex, 1)[0];
    
    if (salvarProdutos(produtos)) {
      res.json({ mensagem: `Produto ${produtoRemovido.nome} removido com sucesso` });
    } else {
      res.status(500).json({ erro: "Erro ao remover produto" });
    }
  } catch (error) {
    res.status(500).json({ erro: "Erro ao deletar produto" });
  }
});

const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor iniciado na porta ${port}: http://localhost:${port}`);
});
