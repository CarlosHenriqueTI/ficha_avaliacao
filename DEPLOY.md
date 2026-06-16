# 🚀 Guia de Deploy na Vercel

## ✅ Projeto já está no GitHub!
Repositório: https://github.com/CarlosHenriqueTI/ficha_avaliacao

## 📋 Próximos passos para Deploy na Vercel

### Opção 1: Deploy automático via Dashboard Vercel (Recomendado)

1. **Acesse o Dashboard da Vercel**
   - Abra: https://vercel.com/dashboard
   - Faça login com sua conta Vercel (ou crie uma com GitHub)

2. **Importe o repositório**
   - Clique em "Add New..." → "Project"
   - Selecione "Import Git Repository"
   - Cole a URL: `https://github.com/CarlosHenriqueTI/ficha_avaliacao.git`
   - Selecione seu repositório e clique "Import"

3. **Configure o projeto**
   - **Framework**: None (projeto estático)
   - **Build Command**: deixar em branco
   - **Output Directory**: deixar em branco
   - Clique em "Deploy"

4. **Aguarde o deploy**
   - A Vercel criará automaticamente um subdomínio
   - URL será algo como: `https://ficha-avaliacao.vercel.app`

### Opção 2: Deploy via CLI

```bash
# 1. Instale o CLI da Vercel globalmente
npm install -g vercel

# 2. Navegue até a pasta do projeto
cd c:\Users\User\Desktop\avaliacao-fisioterapeutica\avaliacao-fisioterapeutica

# 3. Faça o deploy
vercel

# 4. Siga as instruções interativas no terminal
```

## 🌐 Domínio personalizado (Opcional)

Após o deploy bem-sucedido:
1. Vá para "Settings" do projeto na Vercel
2. Clique em "Domains"
3. Adicione seu domínio customizado
4. Configure o DNS conforme as instruções

## 🔄 Atualizações futuras

Basta fazer push para a branch `main` do GitHub e o deployment na Vercel será feito automaticamente!

```bash
git add .
git commit -m "sua mensagem"
git push origin main
```

---

**Pronto para começar?** Clique em: https://vercel.com/dashboard
