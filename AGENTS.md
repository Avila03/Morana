# Morana — orientações de desenvolvimento

## Fonte do projeto

- Repositório canônico: `Avila03/Morana`.
- Branch principal: `main`.
- Continue a partir do estado atual desse repositório. Não recrie uma demo separada nem use outro projeto como fonte de código.
- Os arquivos em `dist/` são o código-fonte do site estático; não há etapa de build.

## Identidade e conteúdo

- Use português do Brasil.
- Preserve a marca original e a paleta do manual: `#29383E`, `#516D79` e `#D7D7D6`.
- Mantenha a tipografia Montserrat e seus arquivos locais; o logotipo já contém a tipografia original da marca.
- Preserve o layout responsivo, a navegação por teclado, os estados de foco e o suporte a movimento reduzido.
- Os textos e serviços da demo são propostas para validação. Não invente depoimentos, clientes, estatísticas, endereços, contatos ou credenciais da empresa.
- O formulário atual é uma simulação. Não apresente uma mensagem como enviada enquanto não houver um serviço de envio implementado e verificado.

## Verificação

- Para alterações no JavaScript, execute `node --check dist/app.js`.
- Confira os caminhos de imagens, fontes e links internos depois de mover arquivos.
- Para alterações visuais, revise computador e celular e teste as interações afetadas, usando o fluxo de preview disponível no ambiente.
- Não introduza frameworks, banco de dados ou dependências sem necessidade para a solicitação.

## Publicação

- A demo existente usa o `project_id` de `.openai/hosting.json`. Preserve essa identidade ao continuar sua publicação pelo Sites.
- O GitHub é a fonte de código. Atualizações de produção exigem o fluxo de publicação da hospedagem; não prometa deploy automático sem integração configurada e verificada.
- Nunca versione senhas, tokens, chaves privadas ou arquivos `.env`.
