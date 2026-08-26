A CODEXA é um espaço para mostrar projetos digitais de um jeito simples e organizado.

Cada pessoa pode criar seu próprio portfólio, escolher quais projetos quer mostrar e compartilhar um nome público para ser encontrada por outras pessoas.

## Como funciona

1. A pessoa cria uma conta usando e-mail e senha.
2. Escolhe o nome público da sua galeria, como `usuario`.
3. Entra no painel pessoal e cria seus projetos.
4. Adiciona descrição, tecnologias e o link do projeto.
5. Decide se cada projeto será **Público** ou **Privado**.

Quem visita a CODEXA não precisa fazer login. Basta pesquisar o nome público de alguém para ver os projetos que essa pessoa decidiu publicar.

Projetos privados continuam visíveis somente para quem criou a conta.

## O que já está funcionando

- Cadastro e login
- Confirmação de e-mail
- Nome público para cada galeria
- Painel pessoal
- Criação de projetos
- Edição de projetos
- Link para abrir cada projeto
- Tecnologias usadas
- Controle de projetos públicos e privados
- Busca de galerias sem login
- Layout adaptado para celular e computador

## Tecnologias usadas

- HTML
- CSS
- JavaScript
- Supabase Auth, para contas e login
- Supabase Database, para perfis e projetos
- GitHub, para guardar o código
- Vercel, para publicar o site

## Principais arquivos

- `index.html`: tela principal do site
- `style.css`: aparência e organização das telas
- `script.js`: login, cadastro, galerias e projetos
- `supabase-config.js`: conexão pública com o Supabase
- `supabase-schema.sql`: criação das tabelas e regras de segurança
- `contact.html`: página de contato
- `services.html`: página de serviços
- `tech.html`: página de tecnologias

## Configurar o Supabase

1. Crie um projeto no Supabase.
2. Abra o **SQL Editor**.
3. Abra o arquivo `supabase-schema.sql`.
4. Copie o conteúdo e cole no SQL Editor.
5. Clique em **Run**.
6. Em **Project Settings > API**, copie a URL do projeto e a chave pública.
7. Coloque esses dados em `supabase-config.js`.

A chave usada no site deve ser a chave pública. Nunca coloque a chave `service_role` no frontend.

## Abrir no computador

Dentro da pasta do projeto, execute:

```powershell
python -m http.server 8000
```

Depois abra no navegador:

```text
http://localhost:8000
```

## Publicar na internet

1. Envie os arquivos para um repositório no GitHub.
2. No Vercel, clique em **Add New > Project**.
3. Escolha o repositório da CODEXA.
4. Clique em **Deploy**.
5. Use o endereço gerado pelo Vercel para compartilhar a CODEXA.

## Exemplo de galeria

Se o nome público escolhido for `usuario`, o endereço poderá ser:

```text
https://seu-site.vercel.app/#portfolio-usuario
```

No futuro, esse endereço poderá usar um domínio próprio, como:

```text
https://codexa.com/@usuario
```
