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
- O contato oficial é `comercial@moranaservicos.com.br`. Não há WhatsApp por enquanto.
- A empresa atende diferentes portes e segmentos; região e modalidade de atendimento não devem restringir a apresentação.
- Em hospedagem PHP, `contato.php` encaminha o formulário ao e-mail comercial. Em hospedagem estática, o formulário prepara uma mensagem para o aplicativo de e-mail; esse fluxo nunca deve informar que a mensagem já foi enviada.
- O aceite de `mail()` confirma o encaminhamento ao servidor de envio, não a entrega à caixa postal. O recebimento final precisa ser verificado após a publicação na Locaweb.

## Verificação

- Para alterações no JavaScript, execute `node --check dist/app.js`.
- Para alterações no envio, execute `php -l dist/contato.php`, `php -l dist/contact-handler.php` e `php tests/contact-handler-test.php`. Os testes usam transporte falso e não enviam mensagens reais.
- Confira os caminhos de imagens, fontes e links internos depois de mover arquivos.
- Para alterações visuais, revise computador e celular e teste as interações afetadas, usando o fluxo de preview disponível no ambiente.
- Não introduza frameworks, banco de dados ou dependências sem necessidade para a solicitação.

## Publicação

- A demo existente usa o `project_id` de `.openai/hosting.json`. Preserve essa identidade ao continuar sua publicação pelo Sites.
- O GitHub é a fonte de código. Atualizações de produção exigem o fluxo de publicação da hospedagem; não prometa deploy automático sem integração configurada e verificada.
- Nunca versione senhas, tokens, chaves privadas ou arquivos `.env`.
- Produto de destino confirmado: Hospedagem Compartilhada I - Linux, com E-mail GO 5 e SSL DV Domínio Único. O pacote de upload contém somente os arquivos de `dist/`.
- O usuário autorizou o novo site diretamente em `moranaservicos.com.br`, sem `/site/`. O workflow `.github/workflows/deploy-locaweb.yml` conecta a `main` à pasta `public_html/` por FTP na porta 21, após o cadastro dos Secrets `LOCAWEB_FTP_HOST`, `LOCAWEB_FTP_USER` e `LOCAWEB_FTP_PASSWORD`. Há execução manual pelo Actions e automática para os caminhos definidos no workflow. O servidor desta conta recusou FTPS com `500 Command "AUTH" not understood`. O usuário autorizou explicitamente usar FTP na porta 21, ciente da transmissão sem criptografia; essa autorização se aplica à publicação desta conta.
- O usuário solicitou expressamente publicar sem a etapa de backup. O workflow deve enviar os arquivos diretamente após as verificações; não reintroduza uma exigência de backup. O pacote inclui `.htaccess` com a prioridade de `index.html`; a checagem pública também verifica a URL inicial, além dos arquivos.
- Preserve a validação dos certificados HTTPS na checagem pública e a ausência de limpeza integral da pasta remota. Os Secrets protegem o armazenamento das credenciais no GitHub; a conexão FTP autorizada não é criptografada. Credenciais são preenchidas pelo usuário diretamente nos Secrets. Não afirme que a conexão ou o deploy foram validados antes de uma execução com credenciais; a checagem pública apenas por GET não envia e-mails.
