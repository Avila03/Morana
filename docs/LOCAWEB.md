# Publicar a Morana na Locaweb

Destino confirmado: **Hospedagem Compartilhada I - Linux**. A conta também possui E-mail GO 5 e SSL DV Domínio Único. Contato comercial: **comercial@moranaservicos.com.br**.

## Pacote de upload

Execute na raiz do repositório:

```bash
python3 scripts/package_locaweb.py
```

O arquivo `artifacts/morana-locaweb.zip` contém `index.html`, `styles.css`, `app.js`, `contato.php`, `contact-handler.php` e `assets/` diretamente na raiz do ZIP. Não há build ou dependências para instalar no servidor. É necessário PHP 7.4 ou superior com a função `mail()` disponível.

## Enviar os arquivos

1. Faça backup dos arquivos e do banco do site que já estiver no domínio, antes de substituí-lo.
2. Acesse a hospedagem pelo painel da Locaweb e entre em **Arquivos e FTP**.
3. Conecte o WebFTP ou FileZilla usando os dados apresentados no painel.
4. Extraia o ZIP no computador e envie seu conteúdo para `public_html`. Não envie uma pasta `dist` envolvendo os arquivos se quiser abrir o site diretamente na raiz do domínio.
5. Se ainda houver um WordPress na mesma pasta, confira o `index.php` antigo e as regras de `.htaccess` antes de trocar a página inicial. O pacote não inclui um `.htaccess` que sobrescreva automaticamente as regras existentes.
6. Confira se o domínio correto aponta para a hospedagem e se o certificado SSL contratado está instalado e válido para esse domínio. O produto ativo, por si só, não comprova essa instalação.

Para testar sem trocar a página inicial, envie os arquivos para `public_html/demo/` e abra o domínio seguido de `/demo/`.

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
