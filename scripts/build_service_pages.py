"""Atualiza as páginas estáticas de serviços com cabeçalho, contato e rodapé da página inicial."""
from pathlib import Path
import argparse
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
BASE = 'https://moranaservicos.com.br/'
SERVICES = [
    dict(slug='planejamento-estrategico', title='Planejamento estratégico', promise='Prioridades claras para crescer com direção.',
         description='Consultoria em planejamento estratégico: diagnóstico do negócio, objetivos, indicadores e um plano de ação com prioridades e responsáveis.',
         lead='Crescer exige escolhas. A Morana ajuda a compreender o momento da empresa, organizar prioridades e transformar objetivos em um plano que se conecte à rotina.',
         signals=['Há muitas iniciativas, mas falta clareza sobre o que vem primeiro.', 'As decisões do dia a dia se distanciam dos objetivos da empresa.', 'O negócio quer crescer e precisa organizar seu próximo ciclo.'],
         work=[('Entender o ponto de partida', 'Conhecer o contexto, ouvir os envolvidos e identificar desafios e oportunidades que merecem atenção.'), ('Definir objetivos e prioridades', 'Traduzir a direção desejada em objetivos claros e indicadores que ajudem a acompanhar o avanço.'), ('Organizar a execução', 'Construir um plano de ação com atividades, responsáveis e prioridades, com espaço para revisar o caminho.')]),
    dict(slug='gestao-financeira', title='Gestão financeira', promise='Entenda os números. Decida com mais segurança.',
         description='Consultoria em gestão financeira: organização do fluxo de caixa, orçamento, análise de custos e margens e indicadores para apoiar decisões.',
         lead='Faturar e ter resultado são coisas diferentes. A Morana ajuda a organizar as informações financeiras para compreender custos, margens e a movimentação do caixa.',
         signals=['A empresa vende, mas é difícil entender quanto sobra.', 'Contas a pagar e a receber são acompanhadas sem uma visão consolidada.', 'Decisões sobre custos e investimentos precisam de uma base mais clara.'],
         work=[('Organizar a visão do caixa', 'Estruturar o acompanhamento de entradas, saídas e compromissos para dar mais visibilidade à rotina financeira.'), ('Compreender custos e margens', 'Analisar custos e despesas para entender como eles se relacionam com os resultados do negócio.'), ('Acompanhar e planejar', 'Definir um orçamento e indicadores adequados ao contexto da empresa para apoiar a tomada de decisão.')]),
    dict(slug='processos-e-operacao', title='Processos e operação', promise='Uma rotina mais clara. Uma operação mais organizada.',
         description='Consultoria em processos e operação: mapeamento de atividades, identificação de gargalos, definição de rotinas e responsabilidades.',
         lead='Quando o trabalho depende de improviso, a operação perde clareza. A Morana ajuda a entender como as atividades acontecem e a organizar processos que façam sentido para quem executa.',
         signals=['O retrabalho se repete e as mesmas dúvidas voltam à equipe.', 'Etapas e responsabilidades ficam pouco claras.', 'A operação precisa de mais organização para acompanhar o crescimento.'],
         work=[('Mapear como o trabalho acontece', 'Entender as etapas, os envolvidos e os pontos de passagem entre áreas para identificar gargalos.'), ('Desenhar rotinas viáveis', 'Organizar atividades e responsabilidades, considerando a realidade da equipe e as necessidades do negócio.'), ('Apoiar a melhoria contínua', 'Acompanhar a implementação das mudanças e observar indicadores para ajustar o processo ao longo do tempo.')]),
    dict(slug='pessoas-e-lideranca', title='Pessoas e liderança', promise='Uma equipe alinhada à direção do negócio.',
         description='Consultoria em pessoas e liderança: clareza de papéis, alinhamento da equipe, comunicação e rotinas de acompanhamento da gestão.',
         lead='Uma empresa se move pelas pessoas que fazem parte dela. A Morana ajuda a aproximar objetivos, responsabilidades e rotinas de liderança para uma atuação mais alinhada.',
         signals=['Tarefas e decisões ficam concentradas em uma pessoa.', 'A equipe precisa de mais clareza sobre seu papel e suas prioridades.', 'A comunicação e o acompanhamento das atividades precisam de uma rotina.'],
         work=[('Dar clareza aos papéis', 'Organizar responsabilidades e pontos de decisão, tornando mais claro o que se espera de cada atuação.'), ('Alinhar pessoas e objetivos', 'Conectar as prioridades da empresa à rotina da equipe e fortalecer a comunicação sobre o trabalho.'), ('Estruturar rotinas de liderança', 'Definir formas de acompanhamento, alinhamento e revisão para apoiar líderes e equipes na execução.')]),
]

VISUALS = {
    'planejamento-estrategico': ('estrategia', ['LEITURA', 'PRIORIDADES', 'AÇÃO']),
    'gestao-financeira': ('financeiro', ['CAIXA', 'MARGENS', 'DECISÕES']),
    'processos-e-operacao': ('processos', ['MAPEAR', 'ORGANIZAR', 'EVOLUIR']),
    'pessoas-e-lideranca': ('pessoas', ['PAPÉIS', 'ALINHAMENTO', 'EQUIPE']),
}


def render(service, home):
    head = home.split('<body>', 1)[0]
    title = service['title'] + ' | Morana'
    url = BASE + 'solucoes/' + service['slug'] + '/'
    for name, content in [('description', service['description']), ('og:title', title), ('og:description', service['description']), ('og:url', url)]:
        head = re.sub(r'(<meta (?:name|property)="' + re.escape(name) + r'" content=")[^"]*', lambda m: m[1] + html.escape(content, quote=True), head)
    head = re.sub(r'<title>.*?</title>', '<title>' + html.escape(title) + '</title>', head)
    head = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m[1] + url, head)
    schema = {'@context':'https://schema.org', '@graph':[
        {'@type':'Service', 'name':service['title'], 'description':service['description'], 'serviceType':service['title'], 'url':url,
         'provider':{'@type':'Organization', '@id':BASE+'#organizacao', 'name':'Morana Serviços LTDA', 'url':BASE}},
        {'@type':'BreadcrumbList', 'itemListElement':[
            {'@type':'ListItem', 'position':1, 'name':'Início', 'item':BASE},
            {'@type':'ListItem', 'position':2, 'name':service['title'], 'item':url}]}]}
    head = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: '<script type="application/ld+json">'+json.dumps(schema, ensure_ascii=False, separators=(',',':'))+'</script>', head, flags=re.S)
    shell = home.split('<body>', 1)[1].split('<main id="conteudo">', 1)[0]
    shell = shell.replace('href="#topo"', 'href="../../"').replace('Morana — início', 'Morana — página inicial')
    for anchor in ['sobre', 'solucoes', 'metodo']:
        shell = shell.replace('href="#'+anchor+'"', 'href="../../#'+anchor+'"')
    tail = '<footer' + home.split('<footer', 1)[1]
    tail = tail.replace('<p class="photo-credit">Fotografia arquitetônica ilustrativa: Sean Pollock / Unsplash. Não representa as instalações da empresa.</p>', '')
    esc = html.escape
    signals = ''.join('<li>'+esc(item)+'</li>' for item in service['signals'])
    work = ''.join('<article><h3>'+esc(label)+'</h3><p>'+esc(text)+'</p></article>' for label,text in service['work'])
    links = ''.join('<a href="../'+s['slug']+'/"'+(' aria-current="page"' if s==service else '')+'>'+esc(s['title'])+'</a>' for s in SERVICES)
    visual, visual_labels = VISUALS[service['slug']]
    art_caption = ''.join('<span>'+esc(label)+'</span>' for label in visual_labels)
    main = f'''<main id="conteudo">
    <div class="service-stage">
    <section class="service-page-hero container" aria-labelledby="page-title">
      <nav class="breadcrumbs" aria-label="Localização"><a href="../../">Início</a><span aria-hidden="true">/</span><a href="../../#solucoes">Soluções</a><span aria-hidden="true">/</span><span aria-current="page">{esc(service['title'])}</span></nav>
      <div class="service-page-intro"><div><p class="eyebrow">CONSULTORIA EM GESTÃO EMPRESARIAL</p><h1 id="page-title">{esc(service['title'])}<span>{esc(service['promise'])}</span></h1><p class="service-lead">{esc(service['lead'])}</p><button class="button" data-contact>Conversar sobre esta solução <svg class="icon"><use href="#arrow-up-right"/></svg></button></div><figure class="service-page-art" aria-hidden="true" data-reveal><img src="assets/servico-{visual}.svg" width="420" height="300" alt=""><figcaption>{art_caption}</figcaption><p class="art-note">COMPOSIÇÃO CONCEITUAL</p></figure></div>
    </section>
    </div>
    <section class="service-page-body" aria-labelledby="service-work-title"><div class="container service-page-columns"><div data-reveal><p class="eyebrow">RECONHECE ESSE CENÁRIO?</p><h2>Quando faz sentido<br><span>olhar para essa área.</span></h2><ul class="service-signals">{signals}</ul></div><div data-reveal><p class="eyebrow">DA CONVERSA À PRÁTICA</p><h2 id="service-work-title">Como podemos atuar.</h2><div class="service-work">{work}</div><p class="service-scope">O escopo, as entregas e os prazos são definidos em uma proposta específica, a partir do momento e das prioridades da sua empresa.</p></div></div></section>
    <section class="container service-first-step" id="primeiro-passo" aria-labelledby="first-step-title"><div data-reveal><p class="eyebrow">O PRIMEIRO PASSO</p><h2 id="first-step-title">Vamos entender<br><span>o seu momento.</span></h2><p>Conte o que sua empresa vive hoje. A primeira conversa ajuda a compreender o contexto antes de definir uma atuação.</p><button class="button" data-contact>Conte seu desafio <svg class="icon"><use href="#arrow-up-right"/></svg></button></div><ol class="service-next-steps"><li>Você compartilha o contexto da empresa.</li><li>A equipe comercial retorna por e-mail.</li><li>Conversamos sobre as prioridades e os próximos passos.</li></ol></section>
    <nav class="container all-services" aria-label="Conheça outras soluções">{links}</nav>
  </main>
'''
    page = head+'<body class="service-page" data-interest="'+esc(service['title'], quote=True)+'">'+shell+main+tail
    # Apenas recursos locais da raiz: âncoras dos símbolos SVG e links comerciais são preservados.
    page = re.sub(r'((?:src|href|action)=")(assets/|styles\.css|brand\.css|app\.js|contato\.php)', r'\1../../\2', page)
    return page


def outputs():
    home = (DIST/'index.html').read_text()
    result = {DIST/'solucoes'/s['slug']/'index.html': render(s, home) for s in SERVICES}
    urls = [BASE] + [BASE+'solucoes/'+s['slug']+'/' for s in SERVICES]
    result[DIST/'sitemap.xml'] = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('  <url><loc>'+u+'</loc></url>\n' for u in urls)+'</urlset>\n'
    result[DIST/'robots.txt'] = 'User-agent: *\nAllow: /\n\nSitemap: '+BASE+'sitemap.xml\n'
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    for path, content in outputs().items():
        if args.check:
            if not path.exists() or path.read_text() != content:
                raise SystemExit('Página desatualizada: '+str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
    print('4 páginas de serviços, sitemap e robots verificados.' if args.check else '4 páginas de serviços, sitemap e robots atualizados.')
