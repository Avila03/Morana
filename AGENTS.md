# Morana — orientações de desenvolvimento

## Fonte do projeto

- Repositório canônico: `Avila03/Morana`.
- Branch principal: `main`.
- Continue a partir do estado atual desse repositório. Não recrie uma demo separada nem use outro projeto como fonte de código.
- Os arquivos em `dist/` são o código-fonte do site estático; não há etapa de build.
- As quatro páginas em `dist/solucoes/`, o sitemap e o robots são atualizados por `python3 scripts/build_service_pages.py`, reutilizando o cabeçalho, contato e rodapé de `dist/index.html`. Após editar esses trechos compartilhados, regenere as páginas e confira `--check`; nenhum gerador roda na hospedagem.

## Identidade e conteúdo

- Use português do Brasil.
- Preserve a marca original e a paleta do manual: `#29383E`, `#516D79` e `#D7D7D6`.
- Mantenha a tipografia Montserrat e seus arquivos locais; o logotipo já contém a tipografia original da marca.
- Preserve o layout responsivo, a navegação por teclado, os estados de foco e o suporte a movimento reduzido.
- `dist/brand.css` aplica a direção visual sobre `styles.css`: blocos claros/escuros, grafismos do M original, tratamento fotográfico por CSS e rodapé em grafite. As ilustrações `assets/servico-*.svg` são conceituais, sem indicadores ou resultados de clientes. Preserve o símbolo original e não trate os desenhos como dados reais. Entradas animadas são opcionais; conteúdo deve continuar acessível sem JavaScript ou com movimento reduzido.
- Os textos e serviços da demo são propostas para validação. Não invente depoimentos, clientes, estatísticas, endereços, contatos ou credenciais da empresa.
- O contato oficial é `comercial@moranaservicos.com.br`. Não há WhatsApp por enquanto.
- A empresa atende diferentes portes e segmentos; região e modalidade de atendimento não devem restringir a apresentação.
- Em hospedagem PHP, `contato.php` encaminha o formulário ao e-mail comercial. Em hospedagem estática, o formulário prepara uma mensagem para o aplicativo de e-mail; esse fluxo nunca deve informar que a mensagem já foi enviada.
- SMTP autenticado é o transporte preferencial, pois `mail()` está indisponível na conta. A biblioteca PHPMailer 7.1.1 está incluída em `dist/vendor/phpmailer/` com sua licença e origem. O aceite SMTP ou de `mail()` confirma o encaminhamento ao servidor de envio, não a entrega à caixa postal. O recebimento final precisa ser verificado após a ativação na Locaweb.
- A senha comercial é informada apenas em `configurar-contato.php`, por HTTPS, com código aleatório de uso único. Fica em `.morana-private/smtp.json` fora da pasta pública; nunca publique essa senha pelo GitHub, FTP ou artefatos. `contact-setup-key.php` contém somente SHA-256 e validade do código. Para renovar, use o gerador local, nunca em logs públicos. Um código consumido não pode reconfigurar a caixa.
- Preserve TLS obrigatório e validação dos certificados no SMTP; host, conta de envio e destinatário do contato comercial são fixos. A página de ativação autentica a caixa sem enviar uma mensagem. O diagnóstico protegido testa conectividade sem autenticação e sem envio.
- O usuário aprovou uma confirmação automática de recebimento ao visitante. Ela só ocorre depois do aceite da solicitação comercial, tem texto fixo sem refletir os campos do formulário e só usa o endereço de visitante validado. Remetente, envelope e Reply-To da confirmação continuam comerciais. Limite uma confirmação por endereço a cada 15 minutos; falhas nessa confirmação não invalidam nem repetem o contato já aceito. Nunca afirme entrega final à caixa postal com base no aceite SMTP.

## Verificação

- Para alterações no JavaScript, execute `node --check dist/app.js`.
- Para páginas e navegação, execute `python3 scripts/build_service_pages.py --check` e `python3 tests/site-test.py`.
- Para alterações no envio, confira a sintaxe de `dist/*.php` e `dist/vendor/phpmailer/*.php`, execute `php tests/contact-handler-test.php`, `php tests/contact-mailer-test.php` e `python3 tests/contact-endpoint-test.py`. Os testes usam transporte falso e não enviam mensagens reais.
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
