# CarFlow Contrate

> Página de contratação simplificada para o CarFlow — app React leve para criar assinaturas e coletar pagamentos.

## Visão geral

Este projeto é a interface de contratação (front-end) usada para contratar planos do CarFlow. Ele contém o formulário de contratação, máscaras de campos, integração com API pública e fluxo de pagamento (Pix, Boleto, Cartão).

## Principais arquivos

- `src/App.jsx` — entrada da aplicação e lógica principal do formulário.
- `src/components/` — componentes reutilizáveis (formulários, estados de pagamento, etc.).

## Requisitos

- Node.js >= 16
- npm ou yarn

## Instalação

1. Instale dependências:

```bash
npm install
# ou
yarn install
```

2. Execute em modo desenvolvimento:

```bash
npm run dev
# ou
yarn dev
```

3. Build para produção:

```bash
npm run build
# ou
yarn build
```

4. Previsualizar o build (se suportado):

```bash
npm run preview
# ou
yarn preview
```

> Observação: os nomes exatos dos scripts podem variar conforme `package.json`. Use `npm run` para listar os scripts disponíveis.

## Variáveis de ambiente

- `VITE_API_URL` ou `REACT_APP_API_URL` (dependendo do builder): URL da API do CarFlow. No código atual, a constante padrão é `https://apicontrole.carflow.app.br`.

Defina essas variáveis no seu ambiente ou em um arquivo `.env` local para apontar para um backend diferente durante o desenvolvimento.

## Executando localmente com API real

1. Certifique-se de que o back-end esteja acessível e permita CORS para seu host local.
2. Ajuste a variável de ambiente para apontar para o endpoint correto.

## Boas práticas e notas de desenvolvimento

- Campos sensíveis (números de cartão, CPF) são tratados com máscara no front-end; nunca os persistir em logs.
- A validação é feita no front-end, mas o back-end deve sempre revalidar dados antes de processar pagamentos.
- Padrões de máscara e funções úteis estão em `src/App.jsx` (funções `mask`, `formatCpf`, `formatCnpj`).

## Contribuindo

1. Abra uma issue descrevendo a proposta ou bug.
2. Crie uma branch com escopo claro: `feat/descricao` ou `fix/descricao`.
3. Envie um PR com descrição e testes/prints quando aplicável.

## Licença

Projeto interno — confirme com o time qual licença aplicar. Se quiser, adicione `MIT` para uso aberto.

---

Se quiser, eu adapto o README para outro idioma, ou adiciono instruções específicas de CI/CD e deploy.
