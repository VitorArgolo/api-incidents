# Documentação da API

Esta é uma API simples construída com Node.js e Express, que utiliza autenticação JWT (JSON Web Tokens) para proteger rotas específicas. A API permite a criação, leitura, atualização e exclusão de incidentes, além de fornecer informações sobre o servidor onde está hospedada.

## Rotas

### Autenticação

- **POST /login**
  - Esta rota permite autenticar um usuário e receber um token JWT válido para acesso às demais rotas protegidas.
  - Body:
    ```json
    {
      "username": "admin",
      "password": "admin"
    }
    ```
  - Resposta de Sucesso:
    ```json
    {
      "token": "token_jwt"
    }
    ```

### Incidentes

- **GET /incidents**
  - Retorna uma lista de todos os incidentes cadastrados.
  - Requer autenticação JWT.

- **POST /incidents**
  - Cria um novo incidente.
  - Body:
    ```json
    {
      "title": "Título do Incidente",
      "description": "Descrição detalhada do incidente",
      "leak": "Tipo de vazamento",
      "severity": "Severidade do incidente"
    }
    ```
  - Requer autenticação JWT.

- **PUT /incidents/:id**
  - Atualiza um incidente existente.
  - Parâmetros de Rota:
    - `id`: ID do incidente a ser atualizado.
  - Body:
    ```json
    {
      "title": "Novo Título",
      "description": "Nova descrição",
      "leak": "Novo tipo de vazamento",
      "severity": "Nova severidade"
    }
    ```
  - Requer autenticação JWT.

- **DELETE /incidents/:id**
  - Exclui um incidente existente.
  - Parâmetros de Rota:
    - `id`: ID do incidente a ser excluído.
  - Requer autenticação JWT.

### Informações do Servidor

- **GET /server-info**
  - Retorna informações sobre o servidor onde a API está hospedada, como nome do host, tempo de atividade, memória total e livre, carga média do sistema, informações da CPU e interfaces de rede.

## Configuração

1. Instale as dependências:
   ```bash
   npm install

2. Execute a aplicação:
    ```bash
   node app.js

    A aplicação será executada na porta especificada (padrão: 3000).

## Pré-requisitos
   - Node.js e npm instalados na máquina.

