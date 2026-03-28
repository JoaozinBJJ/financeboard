# FinanceBoard — Deploy Vercel + PlanetScale

## Estrutura do projeto

```
financeboard/
├── vercel.json
├── package.json
├── lib/
│   ├── db.js          ← conexão PlanetScale
│   └── auth.js        ← JWT + bcrypt helpers
├── api/
│   ├── setup.js       ← cria as tabelas (rodar 1x)
│   ├── auth/
│   │   ├── register.js
│   │   ├── login.js
│   │   └── me.js
│   └── transactions/
│       ├── index.js   ← GET / POST
│       └── [id].js    ← PUT / DELETE
└── public/
    ├── index.html
    ├── login.html
    ├── app.js
    └── style.css
```

---

## Passo a Passo do Deploy

### 1. Criar banco no PlanetScale

1. Acesse https://planetscale.com e crie uma conta grátis
2. Clique em **"Create database"** → dê um nome (ex: `financeboard`)
3. Escolha a região mais próxima (ex: `us-east`)
4. Após criar, vá em **"Connect"** → selecione **"@planetscale/database"**
5. Anote as 3 variáveis:
   - `DATABASE_HOST`
   - `DATABASE_USERNAME`
   - `DATABASE_PASSWORD`

### 2. Publicar no GitHub

```bash
git init
git add .
git commit -m "FinanceBoard inicial"
git remote add origin https://github.com/SEU_USER/financeboard.git
git push -u origin main
```

### 3. Deploy no Vercel

1. Acesse https://vercel.com e faça login com GitHub
2. Clique em **"Add New Project"** → importe o repositório
3. Em **"Environment Variables"**, adicione:

| Nome               | Valor                        |
|--------------------|------------------------------|
| `DATABASE_HOST`    | (do PlanetScale)             |
| `DATABASE_USERNAME`| (do PlanetScale)             |
| `DATABASE_PASSWORD`| (do PlanetScale)             |
| `JWT_SECRET`       | uma string aleatória longa   |
| `SETUP_SECRET`     | uma senha que só você sabe   |

4. Clique em **Deploy** ✅

### 4. Criar as tabelas (uma única vez)

Após o deploy, acesse no navegador:

```
https://seu-app.vercel.app/api/setup?key=SUA_SETUP_SECRET
```

Resposta esperada:
```json
{ "ok": true, "message": "Tabelas criadas com sucesso!" }
```

Pronto! Acesse `https://seu-app.vercel.app` e cadastre-se.

---

## Variáveis de ambiente resumidas

```env
DATABASE_HOST=aws.connect.psdb.cloud
DATABASE_USERNAME=xxxxxxxxx
DATABASE_PASSWORD=pscale_pw_xxxxxxxxx
JWT_SECRET=minha-chave-super-secreta-aleatoria
SETUP_SECRET=minha-senha-de-setup
```

---

## Desenvolvimento local

```bash
npm install
npx vercel dev
```

Crie um arquivo `.env.local` com as variáveis acima.