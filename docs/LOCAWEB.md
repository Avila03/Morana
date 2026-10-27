# Publicar a Morana na Locaweb

Destino confirmado: **Hospedagem Compartilhada I - Linux**. A conta também possui E-mail GO 5 e SSL DV Domínio Único. Contato comercial: **comercial@moranaservicos.com.br**.

## Pacote de upload

Execute na raiz do repositório:

```bash
python3 scripts/package_locaweb.py
```

O arquivo `artifacts/morana-locaweb.zip` contém `index.html`, `styles.css`, `app.js`, `contato.php`, `contact-handler.php` e `assets/` diretamente na raiz do ZIP. Não há build ou dependências para instalar no servidor. É necessário PHP 7.4 ou superior com a função `mail()` disponível.

## Enviar os arquivos

O projeto também possui publicação pelo GitHub Actions. Para o fluxo automático ou por botão, use a configuração abaixo. O envio manual por FileZilla continua descrito nesta seção.

1. Acesse a hospedagem pelo painel da Locaweb e entre em **Arquivos e FTP**.
2. Conecte o WebFTP ou FileZilla usando os dados apresentados no painel.
3. Extraia o ZIP no computador e envie seu conteúdo para `public_html`. Não envie uma pasta `dist` envolvendo os arquivos se quiser abrir o site diretamente na raiz do domínio.
4. O pacote inclui `.htaccess` com `DirectoryIndex index.html index.php` para abrir o site institucional na página inicial.
5. Confira se o domínio correto aponta para a hospedagem e se o certificado SSL contratado está instalado e válido para esse domínio. O produto ativo, por si só, não comprova essa instalação.

Para testar sem trocar a página inicial, envie os arquivos para `public_html/demo/` e abra o domínio seguido de `/demo/`.

## Conectar GitHub e Locaweb

O workflow [Publicar na Locaweb](../.github/workflows/deploy-locaweb.yml) publica o conteúdo de `dist/` diretamente em `public_html/`, correspondente a [moranaservicos.com.br](https://moranaservicos.com.br/). Esse é o destino autorizado: o novo site substitui a página principal do domínio, sem `/site/` na URL.

### Configuração única dos Secrets

1. No repositório `Avila03/Morana`, abra **Settings → Secrets and variables → Actions → New repository secret**.
2. Cadastre os três Secrets abaixo, um de cada vez. A senha deve ser preenchida diretamente no GitHub, nunca em arquivos do repositório ou na conversa.

| Nome do Secret | Valor |
| --- | --- |
| `LOCAWEB_FTP_HOST` | Host FTP da hospedagem, por exemplo `ftp.moranaservicos2.hospedagemdesites.ws`, sem `ftp://` nem caminhos |
| `LOCAWEB_FTP_USER` | Usuário FTP, atualmente `moranaservicos2` |
| `LOCAWEB_FTP_PASSWORD` | Senha FTP atual, a mesma usada no FileZilla |

### Publicar

1. Abra **Actions → Publicar na Locaweb → Run workflow**.
2. Selecione a branch **main** e clique em **Run workflow**.
3. Abra a execução para acompanhar. O workflow verifica a sintaxe, executa os testes locais sem envio real de e-mail e publica diretamente, sem etapa de backup.
4. Ao terminar, consulte o resumo da execução e abra [moranaservicos.com.br](https://moranaservicos.com.br/). Os arquivos estáticos e a página inicial são comparados com os do commit; o endpoint PHP também é consultado, sem enviar e-mails.

Depois da configuração inicial, commits na `main` que alterem `dist/` ou os arquivos de publicação/teste listados no workflow também iniciam o deploy. Alterações apenas na documentação não publicam o site. Um commit em outra branch não publica na Locaweb. Adicionar um Secret não inicia uma execução: o primeiro envio deve ser iniciado pelo botão.

Sem os Secrets, uma execução automática registra que a configuração está pendente e não envia arquivos. Uma execução manual sem credenciais termina com uma orientação para cadastrá-las. Não há conexão FTP validada enquanto o primeiro envio com credenciais não terminar com sucesso.

A conexão está configurada para **FTP na porta 21**, conforme o acesso dessa hospedagem. O servidor recusou FTPS com `500 Command "AUTH" not understood`. O responsável autorizou explicitamente a conexão FTP sem criptografia para a publicação desta conta. Os Secrets protegem o armazenamento das credenciais no GitHub. A checagem pública do site continua usando HTTPS com validação do certificado.

O deploy não usa limpeza integral da pasta remota. A sincronização acompanha os arquivos do projeto em `.morana-deploy-sync-state.json`; pode atualizar ou remover arquivos de publicações anteriores que sejam controlados por esse estado. Arquivos alheios ao estado não são apagados automaticamente. O novo `.htaccess` substitui as regras antigas da página principal por uma configuração que prioriza o `index.html` da Morana.

O envio de e-mail é independente da integração com o GitHub. Na verificação de 27/10/2026, `/site/contato.php` respondeu `available: false`: a função `mail()` estava indisponível. Um deploy bem-sucedido não habilita essa função; o resumo da execução sinaliza essa pendência, e o formulário permanece no modo de preparar e-mail até a configuração do servidor permitir o envio direto.

Referências: [Integração com GitHub Actions documentada pela Locaweb](https://www.locaweb.com.br/ajuda/wiki/github-actions-ftp-hospedagem-compartilhada-locaweb/) e [Secrets no GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

## Funcionamento do contato

- O e-mail direto funciona pelo aplicativo de e-mail do visitante.
- Quando o navegador consegue acessar o endpoint PHP e a função `mail()` está disponível, o botão do formulário mostra **Enviar mensagem**.
- Sem um servidor PHP, como no GitHub Pages, o botão mostra **Preparar e-mail**. O visitante revisa a mensagem, abre seu aplicativo e confirma o envio. A página não afirma que uma mensagem preparada já foi enviada.
- Se o envio pelo servidor falhar, os campos são preservados e o e-mail direto continua visível.
- A mensagem sempre é destinada a `comercial@moranaservicos.com.br`. Esse mesmo endereço é usado como remetente e envelope; o endereço do visitante é usado apenas em `Reply-To`.
- O envio usa o mecanismo PHP `mail()` do ambiente Linux compartilhado, seguindo as orientações da Locaweb sobre `From`, `Return-Path` e o parâmetro `-r`. Não exige colocar a senha da caixa postal no código.

Referência oficial: [Envio de e-mails com a função mail() na Hospedagem de Sites](https://www.locaweb.com.br/ajuda/wiki/como-enviar-e-mails-com-a-funcao-mail-do-php-hospedagem-de-sites/).

## Teste após o upload

1. Abra o site em HTTPS e confira imagens, links e navegação no celular.
2. Abra o formulário. Na Locaweb, ele deve mostrar **Enviar mensagem**.
3. Envie uma solicitação de teste e confira o recebimento na caixa comercial, inclusive no spam.
4. Responda ao e-mail recebido para conferir se o destinatário da resposta é o endereço informado no formulário.
5. Se o servidor aceitar o envio mas a mensagem não chegar, confira a caixa postal, a configuração do domínio e as regras de envio do plano com a Locaweb. Não ative confirmação automática de entrega sem verificar o recebimento real.

## Limites e dados temporários

O servidor aceita no máximo 3 tentativas por origem de rede e 30 tentativas totais em 15 minutos. Solicitações inválidas não são encaminhadas. Os contadores usam um identificador calculado a partir do IP e ficam em uma pasta privada do diretório temporário do servidor, fora de `public_html`. Os registros fora da janela são removidos na próxima solicitação. Nome, e-mail, empresa e mensagem não são gravados nesses contadores.

Não é necessário criar banco de dados. Não envie o repositório inteiro, arquivos de teste ou credenciais para `public_html`.
