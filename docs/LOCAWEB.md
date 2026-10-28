# Publicar a Morana na Locaweb

Destino confirmado: **Hospedagem Compartilhada I - Linux**. A conta também possui E-mail GO 5 e SSL DV Domínio Único. Contato comercial: **comercial@moranaservicos.com.br**.

## Pacote de upload

Execute na raiz do repositório:

```bash
python3 scripts/package_locaweb.py
```

O arquivo `artifacts/morana-locaweb.zip` contém a página, estilos, scripts, arquivos PHP do contato e da ativação, biblioteca PHPMailer e `assets/` diretamente na raiz do ZIP. Não há build ou dependências para instalar no servidor. É necessário PHP 7.4 ou superior com OpenSSL e conexões SMTP de saída para o envio autenticado. Nenhuma senha de caixa postal é incluída no pacote.

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

O envio de e-mail é independente da integração com o GitHub. Na verificação de 27/10/2026, `mail()` estava indisponível. O envio SMTP permite encaminhar o formulário sem depender dessa função, após a ativação descrita abaixo. Publicar os arquivos não preenche a senha da caixa postal.

Referências: [Integração com GitHub Actions documentada pela Locaweb](https://www.locaweb.com.br/ajuda/wiki/github-actions-ftp-hospedagem-compartilhada-locaweb/) e [Secrets no GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

## Funcionamento do contato

- O e-mail direto funciona pelo aplicativo de e-mail do visitante.
- Quando o navegador consegue acessar o endpoint PHP e encontra SMTP configurado ou `mail()` disponível, o botão mostra **Enviar mensagem**.
- Sem um servidor PHP, como no GitHub Pages, o botão mostra **Preparar e-mail**. O visitante revisa a mensagem, abre seu aplicativo e confirma o envio. A página não afirma que uma mensagem preparada já foi enviada.
- Se o envio pelo servidor falhar, os campos são preservados e o e-mail direto continua visível.
- A mensagem sempre é destinada a `comercial@moranaservicos.com.br`. Esse mesmo endereço é usado como remetente e envelope; o endereço do visitante é usado apenas em `Reply-To`.
- Com SMTP configurado, PHPMailer faz uma conexão autenticada e criptografada com a caixa comercial. Sem essa configuração, `mail()` pode ser usado se estiver disponível, seguindo as orientações da Locaweb sobre `From`, `Return-Path` e `-r`.

## Ativar o formulario por SMTP

1. Abra **https://moranaservicos.com.br/configurar-contato.php**.
2. Informe o código de configuração de uso único, fornecido separadamente por um canal privado.
3. Informe a senha de **comercial@moranaservicos.com.br**, a mesma usada no webmail. A página já define a conta de envio.
4. Clique em **Salvar e ativar formulário**. A página verifica a conexão e a autenticação antes de salvar, sem enviar e-mails.
5. Volte ao site, abra o formulário e envie um teste. Confira o recebimento no e-mail comercial e o funcionamento do endereço de resposta.

A senha vai diretamente ao servidor por HTTPS e fica em `../.morana-private/smtp.json`, fora de `public_html`. A pasta usa permissão 0700 e o arquivo 0600. Credenciais nunca entram no repositório, nos Secrets do deploy ou no FTP. A configuração fica preservada entre publicações porque está fora de `dist/` e da pasta de destino do deploy.

O host é fixo (`email-ssl.com.br`), assim como a conta de envio e o destinatário do contato comercial. Após esse contato ser aceito, uma confirmação de texto fixo pode ser enviada ao visitante validado. Ela não repete os campos informados, usa a Morana como remetente e Reply-To, e tem limite de uma por endereço a cada 15 minutos. Se a confirmação falhar, a solicitação comercial continua aceita. A porta 465 usa TLS desde a conexão; 587 exige STARTTLS. Não há opção de SMTP sem criptografia ou de ignorar certificados. O código de ativação expira em 24 horas e é bloqueado após o primeiro salvamento. A validade desse código não expira a configuração já salva.

Para renovar a ativação ou atualizar a senha, execute **localmente** `python3 scripts/rotate_contact_setup_key.py`, guarde o código exibido em um canal privado e publique a mudança de `dist/contact-setup-key.php`. Apenas o SHA-256 e a validade do código são versionados. Não execute esse gerador em logs públicos. Uma nova impressão digital permite reconfigurar a caixa com um novo código; a senha anterior permanece ativa até a nova autenticação ser confirmada.

O diagnóstico técnico de conexão exige um código válido e o mesmo domínio HTTPS. Ele testa as portas sem autenticar nem enviar e-mails e não retorna senhas, caminhos privados ou dados do ambiente.

Referências oficiais: [Configuração de E-mail GO, servidor e porta de saída](https://www.locaweb.com.br/ajuda/wiki/migracao-do-e-mail-exchange-para-o-e-mail-locaweb-ou-o-e-mail-go-parte-2/), [PHPMailer](https://github.com/PHPMailer/PHPMailer) e [envio nativo com mail()](https://www.locaweb.com.br/ajuda/wiki/como-enviar-e-mails-com-a-funcao-mail-do-php-hospedagem-de-sites/).

## Teste após o upload

1. Abra o site em HTTPS e confira imagens, links e navegação no celular.
2. Abra o formulário. Na Locaweb, ele deve mostrar **Enviar mensagem**.
3. Envie uma solicitação de teste e confira o recebimento na caixa comercial, inclusive no spam.
4. Responda ao e-mail recebido para conferir se o destinatário da resposta é o endereço informado no formulário.
5. Se o servidor aceitar o envio mas a mensagem não chegar, confira a caixa postal, a configuração do domínio e as regras de envio do plano com a Locaweb. Não ative confirmação automática de entrega sem verificar o recebimento real.

## Limites e dados temporários

O servidor aceita no máximo 3 tentativas por origem de rede e 30 tentativas totais em 15 minutos. Solicitações inválidas não são encaminhadas. Os contadores usam um identificador calculado a partir do IP e ficam em uma pasta privada do diretório temporário do servidor, fora de `public_html`. Os registros fora da janela são removidos na próxima solicitação. Nome, e-mail, empresa e mensagem não são gravados nesses contadores.

Não é necessário criar banco de dados. Não envie o repositório inteiro, arquivos de teste ou credenciais para `public_html`.
