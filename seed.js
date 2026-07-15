const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Criando tabela articles...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        seo_title VARCHAR(255),
        seo_description VARCHAR(255),
        source_name VARCHAR(100),
        source_link VARCHAR(255),
        image_url VARCHAR(255),
        image_credit VARCHAR(255),
        category VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Inserindo matérias de teste...');
    const articles = [
      {
        title: "Novo casal? Atriz famosa é vista em jantar romântico no Rio",
        slug: "novo-casal-atriz-famosa-vista-jantar-romantico-rio",
        excerpt: "Flagra exclusivo mostra a estrela das novelas das 21h em clima de romance com empresário milionário.",
        content: "<p>A noite carioca estava agitada nesta quarta-feira, mas o que realmente chamou a atenção dos paparazzi foi o clima de intimidade entre a renomada atriz da TV Globo e um conhecido empresário do ramo imobiliário. Os dois foram vistos jantando em um dos restaurantes mais caros do Leblon.</p><p>Segundo fontes exclusivas do Fuxi Dluz, o casal não fez questão de esconder a proximidade. Trocas de olhares, sorrisos e até mãos dadas foram registradas por quem estava no local. A atriz, que recentemente anunciou o fim de um casamento de cinco anos, parece estar aproveitando a nova fase de solteira — ou talvez não tão solteira assim.</p><p>A assessoria de imprensa da atriz foi procurada, mas afirmou que não comenta sobre a vida pessoal de seus clientes. Já o empresário desativou os comentários em suas redes sociais logo após o vazamento das primeiras fotos.</p>",
        seo_title: "Atriz famosa é vista em jantar romântico no Rio de Janeiro | Fuxi Dluz",
        seo_description: "Flagra mostra estrela da TV em clima de romance com empresário milionário no Leblon. Veja os detalhes do novo casal que está agitando a web.",
        source_name: "Portal LeoDias",
        source_link: "https://portalleodias.com",
        image_url: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?q=80&w=1200&auto=format&fit=crop",
        image_credit: "Unsplash / Jantar Romântico",
        category: "Famosos"
      },
      {
        title: "Cantor sertanejo se envolve em polêmica após show cancelado",
        slug: "cantor-sertanejo-polemica-show-cancelado",
        excerpt: "Fãs revoltados relatam falta de comunicação após o cancelamento repentino de uma apresentação milionária.",
        content: "<p>O clima esquentou nos bastidores da música sertaneja. Um dos maiores nomes do gênero na atualidade cancelou seu show minutos antes de subir ao palco, deixando milhares de fãs frustrados e revoltados na arena lotada.</p><p>A produção do evento alegou 'problemas técnicos', mas nossa reportagem apurou que o real motivo seria um desentendimento no camarim envolvendo o cachê da apresentação. Testemunhas afirmam ter ouvido gritos e uma discussão acalorada entre a equipe do cantor e os contratantes locais.</p><p>Nas redes sociais, o público não perdoou. A hashtag com o nome do artista foi parar nos trending topics, com vídeos mostrando o empurra-empurra e a decepção de quem viajou horas para ver o ídolo. A equipe do cantor emitiu nota pedindo desculpas e prometendo remarcar a data.</p>",
        seo_title: "Cantor sertanejo cancela show e gera revolta dos fãs",
        seo_description: "Motivo real do cancelamento envolve discussão de bastidores. Saiba tudo sobre a polêmica envolvendo o astro sertanejo.",
        source_name: "Portal LeoDias",
        source_link: "https://portalleodias.com",
        image_url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200&auto=format&fit=crop",
        image_credit: "Unsplash / Evento",
        category: "Música"
      },
      {
        title: "Bomba! Vaza áudio de influenciadora detonando reality show",
        slug: "vaza-audio-influenciadora-detonando-reality-show",
        excerpt: "Ex-participante não poupou palavras e acusou a produção de manipulação em áudio vazado.",
        content: "<p>Um áudio comprometedor está dando o que falar nos grupos de fofoca. Uma famosa influenciadora digital, recém-eliminada de um badalado reality show de confinamento, foi exposta em uma gravação onde acusa a direção do programa de favorecer determinados participantes.</p><p>'Eles escolhem quem vai brilhar na edição. A gente lá dentro faz de tudo e nada aparece', disse ela em um trecho do áudio. A influenciadora, que era tida como favorita no início do jogo, saiu com alto índice de rejeição e parece não ter digerido bem o resultado.</p><p>A emissora, até o momento, não se pronunciou sobre as falas da ex-participante. No entanto, cláusulas contratuais rigorosas podem render um processo milionário contra a famosa, que quebrou o sigilo exigido após o fim do programa.</p>",
        seo_title: "Áudio vazado: Influenciadora detona manipulação em reality show",
        seo_description: "Ex-participante acusa produção de manipular edição de reality. Ouça os detalhes do áudio que vazou e está gerando polêmica.",
        source_name: "Portal LeoDias",
        source_link: "https://portalleodias.com",
        image_url: "https://images.unsplash.com/photo-1516280440502-85f5e82dc437?q=80&w=1200&auto=format&fit=crop",
        image_credit: "Unsplash / Microfone",
        category: "TV"
      },
      {
        title: "O divórcio de milhões: detalhes da separação do casal queridinho da internet",
        slug: "divorcio-separacao-casal-queridinho-internet",
        excerpt: "A divisão de bens inclui mansões, carros de luxo e até a guarda de dois cachorros de raça.",
        content: "<p>O que parecia um conto de fadas digital chegou ao fim. O casal de influenciadores que somava mais de 30 milhões de seguidores anunciou o fim do casamento, mas o que está chamando a atenção é a partilha de bens estrondosa.</p><p>Nossa equipe teve acesso a detalhes exclusivos do processo. Entre os bens disputados estão uma mansão em São Paulo avaliada em R$ 15 milhões, uma casa de praia no Nordeste e uma frota de carros esportivos de luxo. A guarda dos dois cachorros da raça Golden Retriever também virou ponto de tensão, com a ex-esposa exigindo visitas semanais.</p><p>Amigos próximos afirmam que a separação já vinha se arrastando há meses e que o estopim foi uma divergência na administração da empresa de cosméticos fundada pelos dois.</p>",
        seo_title: "Divórcio de milhões: partilha de bens de influenciadores choca",
        seo_description: "Detalhes exclusivos sobre a divisão da fortuna do ex-casal mais famoso da internet. Mansões e carros de luxo na disputa.",
        source_name: "Portal LeoDias",
        source_link: "https://portalleodias.com",
        image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop",
        image_credit: "Unsplash / Mansão",
        category: "Celebridades"
      },
      {
        title: "Revelação de ator sobre bastidores de novela das 9 choca público",
        slug: "revelacao-ator-bastidores-novela-choca-publico",
        excerpt: "Veterano da televisão revelou climão e brigas de ego durante gravações de sucesso.",
        content: "<p>Em uma entrevista franca e sem filtros, um consagrado ator da televisão brasileira abriu o jogo sobre os bastidores tensos da novela das 9 que marcou época. Segundo ele, o clima no set era insustentável devido às brigas de ego entre os protagonistas.</p><p>'Muitas vezes a gente parava a gravação porque fulano não queria gravar com ciclano, ou exigia que o roteiro fosse reescrito na hora', disparou o veterano, sem citar nomes diretos, mas deixando claro quem eram os envolvidos pela época da produção.</p><p>A declaração caiu como uma bomba nas redes sociais, reacendendo teorias de fãs sobre a falta de química entre o casal principal da trama na reta final. Vários ex-colegas de elenco demonstraram apoio ao ator nas redes, confirmando a toxicidade dos bastidores daquela época.</p>",
        seo_title: "Ator veterano revela brigas de ego em bastidores de novela das 9",
        seo_description: "Confusões, atrasos e climão: saiba tudo o que acontecia nos bastidores da novela de maior sucesso da emissora.",
        source_name: "Portal LeoDias",
        source_link: "https://portalleodias.com",
        image_url: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=1200&auto=format&fit=crop",
        image_credit: "Unsplash / Cinema",
        category: "TV"
      },
      {
        title: "Festa de luxo termina em confusão entre convidados famosos",
        slug: "festa-de-luxo-termina-em-confusao-convidados-famosos",
        excerpt: "Aniversário de subcelebridade teve barraco, choro e até segurança intervindo.",
        content: "<p>O que era para ser uma noite de celebração glamourosa virou caso de polícia. A badalada festa de aniversário de uma conhecida subcelebridade, realizada em uma cobertura luxuosa de São Paulo, terminou antes do esperado após uma confusão generalizada.</p><p>Segundo relatos de presentes, a briga começou quando duas modelos influentes se desentenderam na área VIP. A discussão rapidamente escalou, envolvendo empurrões e copos arremessados. A equipe de segurança precisou intervir para separar as envolvidas, que foram escoltadas para fora do evento sob olhares atônitos dos outros convidados.</p><p>A aniversariante saiu chorando e encerrou a festa logo em seguida. As duas modelos ainda não se pronunciaram sobre o episódio, mas o barraco já é o assunto mais comentado das rodinhas da alta sociedade.</p>",
        seo_title: "Barraco em festa de luxo: convidados famosos protagonizam confusão",
        seo_description: "Aniversário termina mal após briga entre modelos na área VIP. Seguranças precisaram intervir.",
        source_name: "Portal LeoDias",
        source_link: "https://portalleodias.com",
        image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop",
        image_credit: "Unsplash / Festa VIP",
        category: "Famosos"
      },
      {
        title: "Flagra! Jogador de futebol é pego na balada antes de final",
        slug: "flagra-jogador-futebol-pego-balada-antes-final",
        excerpt: "Atleta desfalcou o time alegando virose, mas fotos na madrugada contam outra história.",
        content: "<p>A torcida de um dos maiores clubes do país está revoltada. O atacante titular e craque do time pediu dispensa do último treino antes da grande final do campeonato alegando uma forte virose, mas a verdade veio à tona poucas horas depois.</p><p>O portal Fuxi Dluz obteve com exclusividade fotos do jogador curtindo a noite em uma boate badalada, cercado de amigos e bebidas, na madrugada anterior ao jogo. As imagens viralizaram rapidamente, causando indignação entre os torcedores e a diretoria do clube.</p><p>O jogador foi cortado da relação oficial da final e deve enfrentar pesadas multas internas, além da provável rescisão contratual. Seu empresário tenta contornar a crise, afirmando que as fotos são antigas, mas a datação das imagens não deixa dúvidas.</p>",
        seo_title: "Jogador é pego na balada após alegar virose antes de final",
        seo_description: "Atacante titular é flagrado na madrugada e gera revolta da torcida. Diretoria promete punição severa.",
        source_name: "Portal LeoDias",
        source_link: "https://portalleodias.com",
        image_url: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1200&auto=format&fit=crop",
        image_credit: "Unsplash / Balada",
        category: "Esportes"
      },
      {
        title: "Astro internacional faz exigências absurdas para show no Brasil",
        slug: "astro-internacional-exigencias-absurdas-show-brasil",
        excerpt: "Camarim todo branco e toalhas importadas estão na lista do polêmico cantor.",
        content: "<p>A turnê tão esperada de um grande astro pop no Brasil pode estar gerando mais dores de cabeça do que lucros para a produtora. Vazou a lista de exigências de camarim do artista, e os pedidos são, no mínimo, extravagantes.</p><p>Entre os itens solicitados estão: toalhas felpudas de uma marca específica que só existe na Europa, temperatura do camarim cravada em 21,5 graus Celsius, e a total ausência de cores fortes no ambiente — tudo deve ser absolutamente branco, do sofá aos arranjos de flores (sem espinhos).</p><p>Profissionais que estão trabalhando na montagem do evento relatam que a equipe do astro é extremamente arrogante e ameaça cancelar a apresentação caso qualquer detalhe da lista não seja cumprido à risca. Os fãs, claro, não sabem do drama que rola nos bastidores.</p>",
        seo_title: "As exigências bizarras de astro internacional para show no Brasil",
        seo_description: "Camarim branco e toalhas importadas: vazou a lista de pedidos extravagantes do cantor pop.",
        source_name: "Portal LeoDias",
        source_link: "https://portalleodias.com",
        image_url: "https://images.unsplash.com/photo-1493225457124-a1a2a5f0a41e?q=80&w=1200&auto=format&fit=crop",
        image_credit: "Unsplash / Camarim",
        category: "Música"
      },
      {
        title: "Separação milionária: quem fica com a fortuna do empresário?",
        slug: "separacao-milionaria-quem-fica-fortuna-empresario",
        excerpt: "Fim do casamento de bilionário vira batalha judicial por império de empresas.",
        content: "<p>O mundo dos negócios amanheceu em choque com a notícia do divórcio de um dos maiores bilionários brasileiros. O que parecia um acordo amigável logo se transformou em uma verdadeira guerra nos tribunais pela divisão do império empresarial construído pelo casal.</p><p>A ex-esposa, que foi fundamental na fundação da principal empresa do grupo, pleiteia não apenas metade dos bens, mas também uma posição no conselho de administração — o que o empresário tenta evitar a todo custo. O patrimônio total é estimado em mais de R$ 5 bilhões.</p><p>Advogados das duas partes não param de trocar acusações. A situação está impactando até mesmo as ações das empresas na bolsa de valores, com investidores temerosos sobre o futuro do grupo. Esta novela da vida real promete durar anos.</p>",
        seo_title: "Guerra judicial: divórcio de bilionário disputa fortuna de R$ 5 bi",
        seo_description: "Ex-esposa quer lugar no conselho de administração. Saiba os detalhes da separação que abalou o mercado.",
        source_name: "Portal LeoDias",
        source_link: "https://portalleodias.com",
        image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1200&auto=format&fit=crop",
        image_credit: "Unsplash / Negócios",
        category: "Famosos"
      },
      {
        title: "Transformação radical: cantora surpreende com novo visual",
        slug: "transformacao-radical-cantora-surpreende-novo-visual",
        excerpt: "Fãs ficaram chocados com a mudança drástica após o lançamento do novo álbum.",
        content: "<p>Ela fez de novo! A rainha da reinvenção pop brasileira apareceu completamente irreconhecível em sua última aparição pública. Para marcar o início da sua nova era musical, a cantora abandonou as longas madeixas escuras e surgiu com os fios curtíssimos e platinados, além de um estilo bem mais ousado.</p><p>A mudança radical dividiu opiniões na internet. Enquanto alguns fãs exaltaram a coragem e atitude da artista, chamando o novo visual de 'icônico', outros confessaram sentir falta da imagem antiga. O maquiador responsável pela transformação revelou que o processo durou mais de 12 horas e exigiu muita paciência.</p><p>Mas o marketing funcionou: o nome da cantora não sai dos assuntos mais comentados e o videoclipe de seu novo single já bateu recordes de visualizações nas primeiras 24 horas.</p>",
        seo_title: "Cantora pop surge irreconhecível com novo corte de cabelo platinado",
        seo_description: "Mudança radical de visual divide opiniões na internet, mas alavanca lançamento de novo clipe. Veja a transformação.",
        source_name: "Portal LeoDias",
        source_link: "https://portalleodias.com",
        image_url: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?q=80&w=1200&auto=format&fit=crop",
        image_credit: "Unsplash / Fashion",
        category: "Música"
      }
    ];

    for (const article of articles) {
      await client.query(
        `INSERT INTO articles (title, slug, excerpt, content, seo_title, seo_description, source_name, source_link, image_url, image_credit, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (slug) DO NOTHING`,
        [article.title, article.slug, article.excerpt, article.content, article.seo_title, article.seo_description, article.source_name, article.source_link, article.image_url, article.image_credit, article.category]
      );
    }
    console.log('Seed finalizado com sucesso.');
  } catch (err) {
    console.error('Erro ao executar seed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
